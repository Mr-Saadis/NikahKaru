'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Robust helper to purge all profile picture files for a given profile from Supabase Storage.
 * Runs FIRST before the profile record is deleted.
 */
export async function purgeProfilePictureFromStorage(
  profileId: string,
  profileUrl?: string | null
): Promise<void> {
  const adminClient = createAdminClient();
  const bucketNames = ['Profile_Picture', 'profile_picture'];

  for (const bucket of bucketNames) {
    try {
      const filesToDelete = new Set<string>();

      // 1. If profileUrl is provided, extract its file name / path
      if (profileUrl) {
        try {
          const url = new URL(profileUrl);
          const decodedPath = decodeURIComponent(url.pathname);
          const marker = `/${bucket}/`;
          const idx = decodedPath.indexOf(marker);
          if (idx !== -1) {
            const relativePath = decodedPath.substring(idx + marker.length).split('?')[0];
            if (relativePath) filesToDelete.add(relativePath);
          }
          const parts = decodedPath.split('/');
          const rawName = parts[parts.length - 1]?.split('?')[0];
          if (rawName) filesToDelete.add(rawName);

          const rawParts = url.pathname.split('/');
          const encodedName = rawParts[rawParts.length - 1]?.split('?')[0];
          if (encodedName) filesToDelete.add(encodedName);
        } catch (urlErr) {
          console.warn('Could not parse profileUrl for storage cleanup:', urlErr);
        }
      }

      // 2. Search bucket for any files matching profileId
      const { data: listedFiles, error: listErr } = await adminClient.storage
        .from(bucket)
        .list('', { search: profileId });

      if (!listErr && listedFiles && listedFiles.length > 0) {
        for (const file of listedFiles) {
          if (file.name) {
            filesToDelete.add(file.name);
          }
        }
      }

      // 3. Delete all matching files from the bucket
      if (filesToDelete.size > 0) {
        const fileList = Array.from(filesToDelete);
        await adminClient.storage.from(bucket).remove(fileList);
      }
    } catch (bucketErr) {
      console.warn(`[Storage] Error cleaning bucket '${bucket}':`, bucketErr);
    }
  }
}

/**
 * Server Action: Delete a profile via rpc_delete_profile.
 * - Deletes Profile Picture from Supabase Storage FIRST
 * - Calls rpc_delete_profile PostgreSQL function
 * - Atomic execution in PostgreSQL
 * - Strictly checks HIGH_LEVEL_ADMIN role
 * - Enforces 0 information_requests ("New Data" only)
 */
export async function deleteProfileViaRpc(profileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profileId) {
      return { success: false, error: 'Profile ID is required' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Please log in.' };
    }

    // Verify HIGH_LEVEL_ADMIN role BEFORE touching storage or DB
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .maybeSingle();
    const roleName = ((roleData?.roles as any)?.name)?.toUpperCase() || '';
    if (roleName !== 'HIGH_LEVEL_ADMIN') {
      return { success: false, error: 'Forbidden: Only High-Level Admins can delete profiles.' };
    }

    const adminClient = createAdminClient();

    // 1. Fetch profile photo URL before database deletion
    const { data: profile } = await adminClient
      .from('profiles')
      .select('profile_URL')
      .eq('id', profileId)
      .maybeSingle();

    // 2. Execute PostgreSQL RPC function FIRST (enforces 0 information_requests atomically)
    const { error: rpcError } = await supabase.rpc('rpc_delete_profile', {
      p_profile_id: profileId,
      p_actor_user_id: user.id,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    // 3. Only purge storage AFTER DB deletion succeeds
    await purgeProfilePictureFromStorage(profileId, profile?.profile_URL || null);

    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteProfileViaRpc:', err);
    return { success: false, error: err?.message || 'Failed to delete profile' };
  }
}

export async function pauseProfileAction(params: {
  profileId: string;
  durationDays?: number | null;
  customUntilIso?: string | null;
  reason?: string | null;
}) {
  const { pauseProfileServer } = await import('@/lib/services/profile-pause-server');
  return pauseProfileServer(params);
}

export async function extendProfilePauseAction(params: {
  profileId: string;
  durationDays?: number | null;
  customUntilIso?: string | null;
  reason?: string | null;
}) {
  const { extendProfilePauseServer } = await import('@/lib/services/profile-pause-server');
  return extendProfilePauseServer(params);
}

export async function resumeProfileAction(profileId: string) {
  const { resumeProfileServer } = await import('@/lib/services/profile-pause-server');
  return resumeProfileServer(profileId);
}

export async function getProfilePauseSummaryAction(profileId: string) {
  const { getProfilePauseSummaryServer } = await import('@/lib/services/profile-pause-server');
  return getProfilePauseSummaryServer(profileId);
}

// ============================================================================
// AUTHORIZED, SERIALIZED, RLS-SAFE CHILD RECORD SYNC ACTIONS
// ============================================================================

export type ProfileChildTable =
  | 'education_records'
  | 'employment_records'
  | 'siblings'
  | 'children'
  | 'previous_marriages';

export type PreferenceChildTable =
  | 'preferred_locations'
  | 'preferred_relocations';

const ALLOWED_PROFILE_CHILD_TABLES = new Set<ProfileChildTable>([
  'education_records',
  'employment_records',
  'siblings',
  'children',
  'previous_marriages',
]);

const ALLOWED_PREFERENCE_CHILD_TABLES = new Set<PreferenceChildTable>([
  'preferred_locations',
  'preferred_relocations',
]);

const childSyncLocks = new Map<string, Promise<unknown>>();

async function withServerLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = childSyncLocks.get(key) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(() => fn());
  const tracked = run.catch(() => undefined);
  childSyncLocks.set(key, tracked);
  try {
    return await run;
  } finally {
    if (childSyncLocks.get(key) === tracked) {
      childSyncLocks.delete(key);
    }
  }
}

async function authorizeProfileWrite(profileId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false as const, error: 'Unauthorized: Please log in.' };
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  const rawRoles = roleData?.roles as { name?: string } | { name?: string }[] | null | undefined;
  const roleObj = Array.isArray(rawRoles) ? rawRoles[0] : rawRoles;
  const roleName = (roleObj?.name || '').toUpperCase();

  const adminClient = createAdminClient();
  const { data: profile, error: profError } = await adminClient
    .from('profiles')
    .select('id, current_agent_id, created_by')
    .eq('id', profileId)
    .maybeSingle();

  if (profError || !profile) {
    return { ok: false as const, error: profError?.message || 'Profile not found.' };
  }

  const allowed =
    roleName === 'HIGH_LEVEL_ADMIN' ||
    roleName === 'MANAGER' ||
    profile.current_agent_id === user.id ||
    profile.created_by === user.id;

  if (!allowed) {
    return { ok: false as const, error: 'Forbidden: You do not have permission to update this profile.' };
  }

  return { ok: true as const, adminClient, userId: user.id };
}

function normStr(val: unknown): string | null {
  if (typeof val === 'string') {
    const t = val.trim();
    return t.length > 0 ? t : null;
  }
  return val == null ? null : String(val);
}

function stripChildMeta(row: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, created_at: _ca, updated_at: _ua, _tempId: _tid, profile_id: _pid, ...rest } = row;
  return rest;
}

function dedupeChildRecordsForTable(
  table: ProfileChildTable,
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (table !== 'education_records' && table !== 'employment_records') {
    return rows;
  }

  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];

  for (const r of rows) {
    const key =
      table === 'education_records'
        ? JSON.stringify([
            r.education_level_id != null ? Number(r.education_level_id) : null,
            normStr(r.qualification),
            normStr(r.institution_name),
            normStr(r.field_of_study),
            r.start_year != null ? Number(r.start_year) : null,
            r.end_year != null ? Number(r.end_year) : null,
            Boolean(r.is_highest_qualification),
            normStr(r.details),
          ])
        : JSON.stringify([
            r.occupation_id != null ? Number(r.occupation_id) : null,
            normStr(r.job_title),
            normStr(r.organization_name),
            normStr(r.employment_type),
            r.start_date || null,
            r.is_current ? null : (r.end_date || null),
            Boolean(r.is_current),
            normStr(r.details),
          ]);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  return unique;
}

export async function replaceProfileChildRecordsAction(
  profileId: string,
  table: ProfileChildTable,
  records: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profileId || !ALLOWED_PROFILE_CHILD_TABLES.has(table)) {
      return { success: false, error: 'Invalid profile ID or target table.' };
    }

    const auth = await authorizeProfileWrite(profileId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    return await withServerLock(`${table}:${profileId}`, async () => {
      const cleaned = (Array.isArray(records) ? records : []).map(stripChildMeta);
      const deduped = dedupeChildRecordsForTable(table, cleaned);

      const rowsToInsert = deduped.map((row, idx) =>
        table === 'previous_marriages'
          ? { ...row, profile_id: profileId, marriage_number: idx + 1 }
          : { ...row, profile_id: profileId }
      );

      const { error: delError } = await auth.adminClient
        .from(table)
        .delete()
        .eq('profile_id', profileId);

      if (delError) {
        return { success: false, error: `Failed to clear ${table}: ${delError.message}` };
      }

      if (rowsToInsert.length > 0) {
        const { error: insError } = await auth.adminClient
          .from(table)
          .insert(rowsToInsert);

        if (insError) {
          return { success: false, error: `Failed to insert ${table}: ${insError.message}` };
        }
      }

      return { success: true };
    });
  } catch (err: any) {
    console.error(`Error syncing ${table} for profile ${profileId}:`, err);
    return { success: false, error: err?.message || `Failed to save ${table}` };
  }
}

export async function syncProfileParentsAction(
  profileId: string,
  records: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profileId) {
      return { success: false, error: 'Profile ID is required.' };
    }

    const auth = await authorizeProfileWrite(profileId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    return await withServerLock(`parents:${profileId}`, async () => {
      const input = Array.isArray(records) ? records : [];
      const seen = new Set<string>();
      const uniqueRecords: Record<string, unknown>[] = [];

      for (let i = input.length - 1; i >= 0; i--) {
        const stripped = stripChildMeta(input[i]);
        const type = typeof stripped.parent_type === 'string' ? stripped.parent_type.toUpperCase() : '';
        if ((type === 'FATHER' || type === 'MOTHER') && !seen.has(type)) {
          seen.add(type);
          uniqueRecords.unshift({
            ...stripped,
            profile_id: profileId,
            parent_type: type,
          });
        }
      }

      if (uniqueRecords.length === 0) {
        const { error: delErr } = await auth.adminClient
          .from('parents')
          .delete()
          .eq('profile_id', profileId);

        if (delErr) {
          return { success: false, error: `Failed to clear parents: ${delErr.message}` };
        }
        return { success: true };
      }

      if (uniqueRecords.length === 1) {
        const otherType = uniqueRecords[0].parent_type === 'FATHER' ? 'MOTHER' : 'FATHER';
        const { error: delOtherErr } = await auth.adminClient
          .from('parents')
          .delete()
          .eq('profile_id', profileId)
          .eq('parent_type', otherType);

        if (delOtherErr) {
          return { success: false, error: `Failed to remove unused parent record: ${delOtherErr.message}` };
        }
      }

      const { error: upsertErr } = await auth.adminClient
        .from('parents')
        .upsert(uniqueRecords, { onConflict: 'profile_id,parent_type' });

      if (upsertErr) {
        return { success: false, error: `Failed to save parents: ${upsertErr.message}` };
      }

      return { success: true };
    });
  } catch (err: any) {
    console.error(`Error syncing parents for profile ${profileId}:`, err);
    return { success: false, error: err?.message || 'Failed to save parents' };
  }
}

export async function replacePreferenceChildRecordsAction(
  preferenceSetId: string,
  table: PreferenceChildTable,
  records: Array<{ country_id: number; province_id: number | null; city_id: number | null; is_excluded: boolean }>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!preferenceSetId || !ALLOWED_PREFERENCE_CHILD_TABLES.has(table)) {
      return { success: false, error: 'Invalid preference set ID or target table.' };
    }

    const adminClient = createAdminClient();
    const { data: prefSet, error: setErr } = await adminClient
      .from('preference_sets')
      .select('id, profile_id')
      .eq('id', preferenceSetId)
      .maybeSingle();

    if (setErr || !prefSet) {
      return { success: false, error: setErr?.message || 'Preference set not found.' };
    }

    const auth = await authorizeProfileWrite(prefSet.profile_id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    return await withServerLock(`${table}:${preferenceSetId}`, async () => {
      const seen = new Set<string>();
      const rowsToInsert: Array<{
        preference_set_id: string;
        country_id: number;
        province_id: number | null;
        city_id: number | null;
        is_excluded: boolean;
      }> = [];

      for (const r of Array.isArray(records) ? records : []) {
        const countryId = Number(r.country_id);
        if (!countryId || Number.isNaN(countryId)) continue;
        const provinceId = r.province_id ? Number(r.province_id) : null;
        const cityId = r.city_id ? Number(r.city_id) : null;
        const isExcluded = Boolean(r.is_excluded);
        const key = `${countryId}|${provinceId ?? ''}|${cityId ?? ''}|${isExcluded}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rowsToInsert.push({
          preference_set_id: preferenceSetId,
          country_id: countryId,
          province_id: provinceId,
          city_id: cityId,
          is_excluded: isExcluded,
        });
      }

      const { error: delError } = await auth.adminClient
        .from(table)
        .delete()
        .eq('preference_set_id', preferenceSetId);

      if (delError) {
        return { success: false, error: `Failed to clear ${table}: ${delError.message}` };
      }

      if (rowsToInsert.length > 0) {
        const { error: insError } = await auth.adminClient
          .from(table)
          .insert(rowsToInsert);

        if (insError) {
          return { success: false, error: `Failed to insert ${table}: ${insError.message}` };
        }
      }

      return { success: true };
    });
  } catch (err: any) {
    console.error(`Error syncing ${table} for preference set ${preferenceSetId}:`, err);
    return { success: false, error: err?.message || `Failed to save ${table}` };
  }
}

export async function deleteIncomeInfoAction(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profileId) {
      return { success: false, error: 'Profile ID is required.' };
    }

    const auth = await authorizeProfileWrite(profileId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    return await withServerLock(`income_information:${profileId}`, async () => {
      const { error } = await auth.adminClient
        .from('income_information')
        .delete()
        .eq('profile_id', profileId);

      if (error) {
        return { success: false, error: `Failed to clear income_information: ${error.message}` };
      }

      return { success: true };
    });
  } catch (err: any) {
    console.error(`Error clearing income_information for profile ${profileId}:`, err);
    return { success: false, error: err?.message || 'Failed to clear income information' };
  }
}

