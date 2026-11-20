import { createClient } from '@/lib/supabase/client';
import type { AllPreferences } from '../types/database.types';

const prefWriteLocks = new Map<string, Promise<unknown>>();

async function withPrefLock<T>(profileId: string, fn: () => Promise<T>): Promise<T> {
  const prev = prefWriteLocks.get(profileId) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(() => fn());
  const tracked = run.catch(() => undefined);
  prefWriteLocks.set(profileId, tracked);
  try {
    return await run;
  } finally {
    if (prefWriteLocks.get(profileId) === tracked) {
      prefWriteLocks.delete(profileId);
    }
  }
}

export class PreferenceService {
  /**
   * Save preferences for a profile.
   * Updates the current preference_set in place (upsert) to avoid duplicate versions
   * on auto-save, creating a new version only if none exists or the current one is
   * already referenced by an official match_run.
   */
  static async savePreferences(profileId: string, data: AllPreferences, createdBy: string): Promise<void> {
    return withPrefLock(profileId, async () => {
      const supabase = createClient();

      let setId: string | null = null;

      // 1. Reuse existing current preference_set if not locked by an official match_run
      const { data: currentSet } = await supabase
        .from('preference_sets')
        .select('id, version')
        .eq('profile_id', profileId)
        .eq('is_current', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentSet) {
        const { count: matchRunCount, error: matchRunError } = await supabase
          .from('match_runs')
          .select('id', { count: 'exact', head: true })
          .eq('preference_set_id', currentSet.id);

        if (!matchRunError && (matchRunCount ?? 0) === 0) {
          setId = currentSet.id;
        }
      }

      // 2. Create a new preference_set only when none exists or current is tied to a match_run
      if (!setId) {
        await supabase
          .from('preference_sets')
          .update({ is_current: false })
          .eq('profile_id', profileId);

        const { data: latestSet } = await supabase
          .from('preference_sets')
          .select('version')
          .eq('profile_id', profileId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextVersion = latestSet ? latestSet.version + 1 : 1;

        const { data: newSet, error: setError } = await supabase
          .from('preference_sets')
          .insert({
            profile_id: profileId,
            version: nextVersion,
            is_current: true,
            created_by: createdBy,
          })
          .select('id')
          .single();

        if (setError || !newSet) {
          throw new Error(`Failed to create preference set: ${setError?.message}`);
        }

        setId = newSet.id;
      }

      if (!setId) {
        throw new Error('Failed to resolve or create preference set ID');
      }

      const currentSetId = setId;

      // 3. Upsert all provided preference sub-tables in parallel
      const sectionTables: Array<[keyof AllPreferences, string]> = [
        ['basic', 'basic_preferences'],
        ['physical', 'physical_preferences'],
        ['education', 'education_preferences'],
        ['profession', 'profession_preferences'],
        ['religion', 'religion_preferences'],
        ['location', 'location_preferences'],
        ['family', 'family_preferences'],
        ['lifestyle', 'lifestyle_preferences'],
        ['relocation', 'relocation_preferences'],
      ];

      const tasks = sectionTables
        .filter(([key]) => Boolean(data[key]))
        .map(([key, table]) =>
          (supabase.from(table as any) as any)
            .upsert({ ...(data[key] as any), preference_set_id: currentSetId }, { onConflict: 'preference_set_id' })
        );

      const results = await Promise.all(tasks);

      // Check for errors
      for (const result of results) {
        if (result.error) {
          console.error('Preference upsert error:', result.error);
          throw new Error(`Failed to save a preference section: ${result.error.message}`);
        }
      }

      // 4 & 5. Sync preferred locations & relocations atomically via authorized server action
      if (data.preferredLocations !== undefined || data.preferredRelocations !== undefined) {
        const { replacePreferenceChildRecordsAction } = await import('@/lib/actions/profiles');

        if (data.preferredLocations !== undefined) {
          const rows = (data.preferredLocations || []).map(loc => ({
            country_id: Number(loc.country_id),
            province_id: loc.province_id ? Number(loc.province_id) : null,
            city_id: loc.city_id ? Number(loc.city_id) : null,
            is_excluded: Boolean(loc.is_excluded),
          }));
          const plRes = await replacePreferenceChildRecordsAction(setId, 'preferred_locations', rows);
          if (!plRes.success) {
            console.error('Error saving preferred_locations:', plRes.error);
            throw new Error(`Failed to save preferred locations: ${plRes.error || 'Unknown error'}`);
          }
        }

        if (data.preferredRelocations !== undefined) {
          const rows = (data.preferredRelocations || []).map(loc => ({
            country_id: Number(loc.country_id),
            province_id: loc.province_id ? Number(loc.province_id) : null,
            city_id: loc.city_id ? Number(loc.city_id) : null,
            is_excluded: Boolean(loc.is_excluded),
          }));
          const prRes = await replacePreferenceChildRecordsAction(setId, 'preferred_relocations', rows);
          if (!prRes.success) {
            console.error('Error saving preferred_relocations:', prRes.error);
            throw new Error(`Failed to save preferred relocations: ${prRes.error || 'Unknown error'}`);
          }
        }
      }
    });
  }

  static async getCurrentPreferences(profileId: string): Promise<AllPreferences | null> {
    const supabase = createClient();

    // 1. Prefer enriched view (includes lookup name_en / name_ur)
    const { data: viewRows, error: viewError } = await supabase
      .from('vw_profile_active_preferences')
      .select('*')
      .eq('profile_id', profileId)
      .order('version', { ascending: false })
      .limit(1);

    if (!viewError && viewRows && viewRows.length > 0) {
      const row = viewRows[0] as any;
      const prefLocs = row.preferred_locations || row.location?.preferred_locations || [];
      const prefRelocs = row.preferred_relocations || row.relocation?.preferred_relocations || [];
      return {
        basic: row.basic || null,
        physical: row.physical || null,
        education: row.education || null,
        profession: row.profession || null,
        religion: row.religion || null,
        location: row.location || null,
        preferredLocations: prefLocs,
        family: row.family || null,
        lifestyle: row.lifestyle || null,
        relocation: row.relocation || null,
        preferredRelocations: prefRelocs,
      };
    }

    // 2. Fallback directly to preference_sets (even if is_current was false)
    const { data: setRows, error } = await supabase
      .from('preference_sets')
      .select('id')
      .eq('profile_id', profileId)
      .order('is_current', { ascending: false })
      .order('version', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    const prefSet = setRows?.[0];
    if (error || !prefSet) return null;

    const setId = prefSet.id;

    const [
      basicReq, physicalReq, eduReq, profReq, relReq, locReq, famReq, lifeReq, relocReq, prefLocReq, prefRelocReq
    ] = await Promise.all([
      supabase.from('basic_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('physical_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('education_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('profession_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('religion_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('location_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('family_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('lifestyle_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('relocation_preferences').select('*').eq('preference_set_id', setId).limit(1),
      supabase.from('preferred_locations').select('*').eq('preference_set_id', setId),
      supabase.from('preferred_relocations').select('*').eq('preference_set_id', setId),
    ]);

    return {
      basic: basicReq.data?.[0] || null,
      physical: physicalReq.data?.[0] || null,
      education: eduReq.data?.[0] || null,
      profession: profReq.data?.[0] || null,
      religion: relReq.data?.[0] || null,
      location: locReq.data?.[0] || null,
      preferredLocations: prefLocReq.data || [],
      family: famReq.data?.[0] || null,
      lifestyle: lifeReq.data?.[0] || null,
      relocation: relocReq.data?.[0] || null,
      preferredRelocations: prefRelocReq.data || [],
    };
  }
}
