'use server';

import { createClient } from '@/lib/supabase/server';

interface LogProfileEditParams {
  profileId: string;
  role?: string;
  newData?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Server Action: Log profile edits into audit_logs via rpc_log_profile_edit.
 * - Logs for AGENT and MANAGER
 * - SKIPS for HIGH_LEVEL_ADMIN (handled atomically inside RPC)
 */
export async function logProfileEditAction({
  profileId,
  role,
  newData = {},
  metadata = {},
}: LogProfileEditParams): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    // 1. If role passed is Admin, skip immediately
    if (role === 'HIGH_LEVEL_ADMIN') {
      return { success: true, skipped: true };
    }

    // 2. Authenticate current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 3. Execute PostgreSQL RPC function rpc_log_profile_edit
    const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_log_profile_edit', {
      p_profile_id: profileId,
      p_new_data: newData,
      p_metadata: metadata,
      p_actor_user_id: user.id,
    });

    if (rpcError) {
      console.error('Failed to execute rpc_log_profile_edit:', rpcError);
      return { success: false, error: rpcError.message };
    }

    return { success: true, skipped: rpcData?.skipped };
  } catch (err: any) {
    console.error('Error in logProfileEditAction:', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}
