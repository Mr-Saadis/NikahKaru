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

    const adminClient = createAdminClient();

    // 1. Fetch profile to get photo URL BEFORE database deletion
    const { data: profile } = await adminClient
      .from('profiles')
      .select('profile_URL')
      .eq('id', profileId)
      .maybeSingle();

    // 2. DELETE PROFILE PICTURE FIRST from Supabase Storage
    await purgeProfilePictureFromStorage(profileId, profile?.profile_URL || null);

    // 3. Execute PostgreSQL RPC function
    const { error: rpcError } = await supabase.rpc('rpc_delete_profile', {
      p_profile_id: profileId,
      p_actor_user_id: user.id,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteProfileViaRpc:', err);
    return { success: false, error: err?.message || 'Failed to delete profile' };
  }
}
