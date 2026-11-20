import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ProfilePauseInfo } from '@/lib/types/database.types';
import { formatPauseDate } from '@/lib/utils/pauseFormatting';

export interface PauseActionResult {
  success: boolean;
  error?: string;
  status?: 'ACTIVE' | 'PAUSED';
  boardStage?: string;
  agentBoardStage?: string;
  pauseInfo?: ProfilePauseInfo | null;
}

export interface ProfilePauseSummary {
  profileId: string;
  fullName: string;
  phone: string;
  city: string;
  status: string;
  assignedAgentName: string;
  canManage: boolean;
  pauseInfo: ProfilePauseInfo | null;
}

let lastReminderCheckMs = 0;
const REMINDER_CHECK_THROTTLE_MS = 60_000;

interface ActorContext {
  userId: string;
  roleName: string;
  fullName: string;
  isManagerOrAdmin: boolean;
  isAgent: boolean;
}

async function resolveActorContext(adminClient: ReturnType<typeof createAdminClient>, userId: string): Promise<ActorContext | null> {
  const [roleRes, userRes] = await Promise.all([
    adminClient
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userId),
    adminClient
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  if (roleRes.error || !roleRes.data || roleRes.data.length === 0) {
    return null;
  }

  const roles = roleRes.data
    .map((r: any) => (Array.isArray(r.roles) ? r.roles[0]?.name : r.roles?.name))
    .filter(Boolean)
    .map((r: string) => r.toUpperCase());

  const roleName =
    roles.includes('HIGH_LEVEL_ADMIN')
      ? 'HIGH_LEVEL_ADMIN'
      : roles.includes('MANAGER')
        ? 'MANAGER'
        : roles.includes('AGENT')
          ? 'AGENT'
          : roles[0] || '';

  const isManagerOrAdmin = roleName === 'HIGH_LEVEL_ADMIN' || roleName === 'MANAGER';
  const isAgent = roleName === 'AGENT';
  const fullName = userRes.data?.full_name || userRes.data?.email?.split('@')[0] || 'Staff';

  return {
    userId,
    roleName,
    fullName,
    isManagerOrAdmin,
    isAgent,
  };
}

function canActorManageProfile(
  actor: ActorContext,
  profile: { current_agent_id: string | null; created_by: string }
): boolean {
  if (actor.isManagerOrAdmin) return true;
  if (actor.isAgent) {
    return (
      profile.current_agent_id === actor.userId ||
      (!profile.current_agent_id && profile.created_by === actor.userId)
    );
  }
  return false;
}

function computePauseUntil(
  durationDays?: number | null,
  customUntilIso?: string | null,
  nowMs: number = Date.now()
): { pauseUntil: string | null; pauseDays: number | null; error?: string } {
  if (customUntilIso && customUntilIso.trim()) {
    const trimmed = customUntilIso.trim();
    // Handle YYYY-MM-DD directly as 09:00 PKT (04:00 UTC)
    const parsedDate =
      trimmed.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
        ? new Date(`${trimmed}T04:00:00.000Z`)
        : new Date(trimmed);

    if (isNaN(parsedDate.getTime())) {
      return { pauseUntil: null, pauseDays: null, error: 'Invalid reminder date.' };
    }

    const untilMs = parsedDate.getTime();
    // Allow dates starting today (at 09:00 PKT it may be slightly earlier today, or future)
    const days = Math.max(1, Math.ceil((untilMs - nowMs) / 86_400_000));
    return { pauseUntil: parsedDate.toISOString(), pauseDays: days };
  }

  if (durationDays !== undefined && durationDays !== null && durationDays > 0) {
    const cleanDays = Math.min(Math.max(Math.round(durationDays), 1), 365);
    const pauseUntil = new Date(nowMs + cleanDays * 86_400_000).toISOString();
    return { pauseUntil, pauseDays: cleanDays };
  }

  return { pauseUntil: null, pauseDays: null };
}

/**
 * Batch-fetches the latest active pause schedule metadata for a list of profile IDs from audit_logs.
 */
export async function getPauseInfoMap(profileIds: string[]): Promise<Map<string, ProfilePauseInfo>> {
  const adminClient = createAdminClient();
  return getActivePauseInfoMapInternal(adminClient, profileIds);
}

/**
 * Tracks settled profile IDs so a prior pause before a resume is ignored.
 */
async function getActivePauseInfoMapInternal(
  adminClient: ReturnType<typeof createAdminClient>,
  profileIds: string[]
): Promise<Map<string, ProfilePauseInfo>> {
  const result = new Map<string, ProfilePauseInfo>();
  if (!profileIds || profileIds.length === 0) return result;

  const uniqueIds = Array.from(new Set(profileIds.filter(Boolean)));
  if (uniqueIds.length === 0) return result;

  const { data, error } = await adminClient
    .from('audit_logs')
    .select('entity_id, metadata, created_at')
    .eq('entity_type', 'profile')
    .eq('action', 'STATUS_CHANGE')
    .in('entity_id', uniqueIds)
    .order('created_at', { ascending: false });

  if (error || !data) {
    if (error) console.error('[getPauseInfoMap] audit_logs query error:', error);
    return result;
  }

  const settledIds = new Set<string>();
  for (const row of data) {
    const pid = row.entity_id;
    if (!pid || settledIds.has(pid)) continue;
    const meta = (row.metadata || {}) as Record<string, any>;
    if (meta.event === 'PROFILE_PAUSED' || meta.event === 'PROFILE_PAUSE_EXTENDED') {
      settledIds.add(pid);
      result.set(pid, {
        paused_at: meta.paused_at || row.created_at,
        pause_until: meta.pause_until ?? null,
        pause_days: meta.pause_days ?? null,
        reason: meta.reason ?? null,
        paused_by_id: meta.paused_by_id ?? null,
        paused_by_name: meta.paused_by_name ?? null,
        paused_by_role: meta.paused_by_role ?? null,
        event: meta.event,
      });
    } else if (meta.event === 'PROFILE_RESUMED') {
      settledIds.add(pid);
    }
  }

  return result;
}

/**
 * Computes exact Manager & Agent board stages when a paused profile returns to ACTIVE.
 */
export async function computeRestoredBoardStages(
  adminClient: ReturnType<typeof createAdminClient>,
  profileId: string
): Promise<{ managerStage: string; agentStage: string }> {
  const { data: reqs, error } = await adminClient
    .from('information_requests')
    .select('id, status, created_at')
    .eq('source_profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error || !reqs || reqs.length === 0) {
    return { managerStage: 'new', agentStage: 'logged' };
  }

  const count = reqs.length;
  const latestStatus = String(reqs[0].status || '').toUpperCase();

  let managerStage = 'new';
  if (latestStatus === 'PENDING') managerStage = count > 1 ? 'second' : 'first';
  else if (latestStatus === 'PENDING_OTHER') managerStage = 'second';
  else if (latestStatus === 'IN_REVIEW') managerStage = 'responded';
  else if (latestStatus === 'DOWNLOADED') managerStage = 'downloaded';
  else if (latestStatus === 'COMPLETED') managerStage = 'done';
  else if (latestStatus === 'COMPLETED_OUTSIDE_SYSTEM') managerStage = 'completed_outside';

  let agentStage = 'logged';
  if (latestStatus === 'PENDING' || latestStatus === 'PENDING_OTHER') agentStage = 'requested';
  else if (latestStatus === 'IN_REVIEW') agentStage = 'responded';
  else if (latestStatus === 'DOWNLOADED') agentStage = 'downloaded';
  else if (latestStatus === 'COMPLETED') agentStage = 'done';
  else if (latestStatus === 'COMPLETED_OUTSIDE_SYSTEM') agentStage = 'completed_outside';
  else if (latestStatus === 'CANCELLED') agentStage = 'archive';

  return { managerStage, agentStage };
}

export async function pauseProfileServer(params: {
  profileId: string;
  durationDays?: number | null;
  customUntilIso?: string | null;
  reason?: string | null;
}): Promise<PauseActionResult> {
  try {
    const { profileId, durationDays, customUntilIso, reason } = params;
    if (!profileId) {
      return { success: false, error: 'Profile ID is required.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Please log in.' };
    }

    const adminClient = createAdminClient();
    const actor = await resolveActorContext(adminClient, user.id);
    if (!actor || (!actor.isManagerOrAdmin && !actor.isAgent)) {
      return { success: false, error: 'Forbidden: Insufficient permissions to pause profiles.' };
    }

    const { data: profile, error: profError } = await adminClient
      .from('profiles')
      .select('id, status, current_agent_id, created_by')
      .eq('id', profileId)
      .maybeSingle();

    if (profError || !profile) {
      return { success: false, error: 'Profile not found.' };
    }

    if (!canActorManageProfile(actor, profile)) {
      return { success: false, error: 'Forbidden: Agents can only pause their own assigned profiles.' };
    }

    if (['DRAFT', 'INACTIVE', 'ARCHIVED'].includes(profile.status)) {
      return {
        success: false,
        error: `Cannot pause a ${profile.status.toLowerCase()} profile. Only active profiles can be paused.`,
      };
    }

    if (profile.status === 'PAUSED') {
      return extendProfilePauseServer({ profileId, durationDays, customUntilIso, reason });
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const { pauseUntil, pauseDays, error: dateErr } = computePauseUntil(durationDays, customUntilIso, nowMs);
    if (dateErr) {
      return { success: false, error: dateErr };
    }

    const trimmedReason = reason?.trim() || null;

    const { data: pi } = await adminClient
      .from('personal_information')
      .select('full_name')
      .eq('profile_id', profileId)
      .maybeSingle();
    const profileName = pi?.full_name || 'Profile';

    const { error: updError } = await adminClient
      .from('profiles')
      .update({ status: 'PAUSED', updated_at: nowIso })
      .eq('id', profileId);

    if (updError) {
      return { success: false, error: updError.message };
    }

    const pauseInfo: ProfilePauseInfo = {
      paused_at: nowIso,
      pause_until: pauseUntil,
      pause_days: pauseDays,
      reason: trimmedReason,
      paused_by_id: actor.userId,
      paused_by_name: actor.fullName,
      paused_by_role: actor.roleName,
      event: 'PROFILE_PAUSED',
    };

    const { error: auditErr } = await adminClient.from('audit_logs').insert({
      actor_user_id: actor.userId,
      action: 'STATUS_CHANGE',
      entity_type: 'profile',
      entity_id: profileId,
      old_data: { status: profile.status },
      new_data: { status: 'PAUSED' },
      metadata: {
        profile_id: profileId,
        profile_name: profileName,
        ...pauseInfo,
      },
    });

    if (auditErr) {
      console.error('[pauseProfileServer] audit_logs insert failed:', auditErr);
    }

    try {
      await adminClient.rpc('refresh_mv_matching_profiles');
    } catch (mvErr) {
      console.warn('[pauseProfileServer] refresh_mv_matching_profiles failed:', mvErr);
    }

    // Cross-role informational notification
    const durationText = pauseUntil
      ? `until ${formatPauseDate(pauseUntil)}${pauseDays ? ` (${pauseDays} day${pauseDays === 1 ? '' : 's'})` : ''}`
      : 'indefinitely (no end timer)';
    const reasonText = trimmedReason ? ` Reason: ${trimmedReason}.` : '';

    if (actor.isAgent) {
      await adminClient.from('notifications').insert({
        user_id: null,
        target_role: 'MANAGER',
        type: 'INFO',
        title: `Profile Paused: ${profileName}`,
        message: `${actor.fullName} paused ${profileName} ${durationText}.${reasonText}`,
        entity_type: 'profile',
        entity_id: profileId,
      });
    } else if (profile.current_agent_id && profile.current_agent_id !== actor.userId) {
      await adminClient.from('notifications').insert({
        user_id: profile.current_agent_id,
        target_role: null,
        type: 'INFO',
        title: `Profile Paused: ${profileName}`,
        message: `${actor.fullName} paused ${profileName} ${durationText}.${reasonText}`,
        entity_type: 'profile',
        entity_id: profileId,
      });
    }

    return {
      success: true,
      status: 'PAUSED',
      boardStage: 'pause',
      pauseInfo,
    };
  } catch (err: any) {
    console.error('[pauseProfileServer] unexpected error:', err);
    return { success: false, error: err?.message || 'Failed to pause profile.' };
  }
}

export async function extendProfilePauseServer(params: {
  profileId: string;
  durationDays?: number | null;
  customUntilIso?: string | null;
  reason?: string | null;
}): Promise<PauseActionResult> {
  try {
    const { profileId, durationDays, customUntilIso, reason } = params;
    if (!profileId) {
      return { success: false, error: 'Profile ID is required.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Please log in.' };
    }

    const adminClient = createAdminClient();
    const actor = await resolveActorContext(adminClient, user.id);
    if (!actor || (!actor.isManagerOrAdmin && !actor.isAgent)) {
      return { success: false, error: 'Forbidden: Insufficient permissions.' };
    }

    const { data: profile, error: profError } = await adminClient
      .from('profiles')
      .select('id, status, current_agent_id, created_by')
      .eq('id', profileId)
      .maybeSingle();

    if (profError || !profile) {
      return { success: false, error: 'Profile not found.' };
    }

    if (!canActorManageProfile(actor, profile)) {
      return { success: false, error: 'Forbidden: Agents can only update reminders on their own assigned profiles.' };
    }

    if (profile.status !== 'PAUSED') {
      return { success: false, error: 'Only currently paused profiles can have their reminder updated.' };
    }

    const existingMap = await getActivePauseInfoMapInternal(adminClient, [profileId]);
    const prevPause = existingMap.get(profileId);
    const resolvedReason =
      reason !== undefined ? (reason?.trim() || null) : (prevPause?.reason ?? null);

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const { pauseUntil, pauseDays, error: dateErr } = computePauseUntil(durationDays, customUntilIso, nowMs);
    if (dateErr) {
      return { success: false, error: dateErr };
    }

    const { data: pi } = await adminClient
      .from('personal_information')
      .select('full_name')
      .eq('profile_id', profileId)
      .maybeSingle();
    const profileName = pi?.full_name || 'Profile';

    await adminClient
      .from('profiles')
      .update({ updated_at: nowIso })
      .eq('id', profileId);

    const pauseInfo: ProfilePauseInfo = {
      paused_at: nowIso,
      pause_until: pauseUntil,
      pause_days: pauseDays,
      reason: resolvedReason,
      paused_by_id: actor.userId,
      paused_by_name: actor.fullName,
      paused_by_role: actor.roleName,
      event: 'PROFILE_PAUSE_EXTENDED',
    };

    const { error: auditErr } = await adminClient.from('audit_logs').insert({
      actor_user_id: actor.userId,
      action: 'STATUS_CHANGE',
      entity_type: 'profile',
      entity_id: profileId,
      old_data: { status: 'PAUSED', pause_until: prevPause?.pause_until ?? null },
      new_data: { status: 'PAUSED', pause_until: pauseUntil },
      metadata: {
        profile_id: profileId,
        profile_name: profileName,
        ...pauseInfo,
      },
    });

    if (auditErr) {
      console.error('[extendProfilePauseServer] audit_logs insert failed:', auditErr);
    }

    return {
      success: true,
      status: 'PAUSED',
      boardStage: 'pause',
      pauseInfo,
    };
  } catch (err: any) {
    console.error('[extendProfilePauseServer] unexpected error:', err);
    return { success: false, error: err?.message || 'Failed to update pause reminder.' };
  }
}

export async function resumeProfileServer(profileId: string): Promise<PauseActionResult> {
  try {
    if (!profileId) {
      return { success: false, error: 'Profile ID is required.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Please log in.' };
    }

    const adminClient = createAdminClient();
    const actor = await resolveActorContext(adminClient, user.id);
    if (!actor || (!actor.isManagerOrAdmin && !actor.isAgent)) {
      return { success: false, error: 'Forbidden: Insufficient permissions to activate profiles.' };
    }

    const { data: profile, error: profError } = await adminClient
      .from('profiles')
      .select('id, status, current_agent_id, created_by')
      .eq('id', profileId)
      .maybeSingle();

    if (profError || !profile) {
      return { success: false, error: 'Profile not found.' };
    }

    if (!canActorManageProfile(actor, profile)) {
      return { success: false, error: 'Forbidden: Agents can only activate their own assigned profiles.' };
    }

    if (profile.status !== 'PAUSED') {
      return { success: false, error: `Profile is currently ${profile.status}, not PAUSED.` };
    }

    const nowIso = new Date().toISOString();

    const { data: pi } = await adminClient
      .from('personal_information')
      .select('full_name')
      .eq('profile_id', profileId)
      .maybeSingle();
    const profileName = pi?.full_name || 'Profile';

    const { error: updError } = await adminClient
      .from('profiles')
      .update({ status: 'ACTIVE', updated_at: nowIso })
      .eq('id', profileId);

    if (updError) {
      return { success: false, error: updError.message };
    }

    const { error: auditErr } = await adminClient.from('audit_logs').insert({
      actor_user_id: actor.userId,
      action: 'STATUS_CHANGE',
      entity_type: 'profile',
      entity_id: profileId,
      old_data: { status: 'PAUSED' },
      new_data: { status: 'ACTIVE' },
      metadata: {
        event: 'PROFILE_RESUMED',
        profile_id: profileId,
        profile_name: profileName,
        resumed_at: nowIso,
        resumed_by_id: actor.userId,
        resumed_by_name: actor.fullName,
        resumed_by_role: actor.roleName,
      },
    });

    if (auditErr) {
      console.error('[resumeProfileServer] audit_logs insert failed:', auditErr);
    }

    try {
      await adminClient.rpc('refresh_mv_matching_profiles');
    } catch (mvErr) {
      console.warn('[resumeProfileServer] refresh_mv_matching_profiles failed:', mvErr);
    }

    if (actor.isAgent) {
      await adminClient.from('notifications').insert({
        user_id: null,
        target_role: 'MANAGER',
        type: 'INFO',
        title: `Profile Resumed: ${profileName}`,
        message: `${actor.fullName} activated ${profileName}. Profile is now active for matching again.`,
        entity_type: 'profile',
        entity_id: profileId,
      });
    } else if (profile.current_agent_id && profile.current_agent_id !== actor.userId) {
      await adminClient.from('notifications').insert({
        user_id: profile.current_agent_id,
        target_role: null,
        type: 'INFO',
        title: `Profile Resumed: ${profileName}`,
        message: `${actor.fullName} activated ${profileName}. Profile is now active for matching again.`,
        entity_type: 'profile',
        entity_id: profileId,
      });
    }

    const { managerStage, agentStage } = await computeRestoredBoardStages(adminClient, profileId);

    return {
      success: true,
      status: 'ACTIVE',
      boardStage: managerStage,
      agentBoardStage: agentStage,
      pauseInfo: null,
    };
  } catch (err: any) {
    console.error('[resumeProfileServer] unexpected error:', err);
    return { success: false, error: err?.message || 'Failed to resume profile.' };
  }
}

export async function getProfilePauseSummaryServer(
  profileId: string
): Promise<{ success: boolean; data?: ProfilePauseSummary; error?: string }> {
  try {
    if (!profileId) {
      return { success: false, error: 'Profile ID is required.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = createAdminClient();
    const actor = await resolveActorContext(adminClient, user.id);
    if (!actor) {
      return { success: false, error: 'Forbidden' };
    }

    const { data: core, error: coreErr } = await adminClient
      .from('vw_profile_core')
      .select('profile_id, full_name, phone, status, current_city_name_en, current_location_text, current_agent_id, created_by, current_agent_name, created_by_name')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (coreErr || !core) {
      return { success: false, error: 'Profile not found.' };
    }

    const canManage = canActorManageProfile(actor, {
      current_agent_id: core.current_agent_id,
      created_by: core.created_by,
    });

    if (!actor.isManagerOrAdmin && !canManage) {
      return { success: false, error: 'Forbidden' };
    }

    let pauseInfo: ProfilePauseInfo | null = null;
    if (core.status === 'PAUSED') {
      const pauseMap = await getActivePauseInfoMapInternal(adminClient, [profileId]);
      pauseInfo = pauseMap.get(profileId) || null;
    }

    return {
      success: true,
      data: {
        profileId: core.profile_id,
        fullName: core.full_name || 'Profile',
        phone: core.phone || 'N/A',
        city: core.current_city_name_en || core.current_location_text || 'N/A',
        status: core.status,
        assignedAgentName: core.current_agent_name || core.created_by_name || 'Unassigned',
        canManage,
        pauseInfo,
      },
    };
  } catch (err: any) {
    console.error('[getProfilePauseSummaryServer] error:', err);
    return { success: false, error: err?.message || 'Failed to load profile pause summary.' };
  }
}

export async function checkAndTriggerDuePauseReminders(
  force: boolean = false
): Promise<{ checked: number; triggered: number }> {
  const nowMs = Date.now();
  if (!force && nowMs - lastReminderCheckMs < REMINDER_CHECK_THROTTLE_MS) {
    return { checked: 0, triggered: 0 };
  }
  lastReminderCheckMs = nowMs;

  const adminClient = createAdminClient();

  const { data: pausedProfiles, error: pausedErr } = await adminClient
    .from('profiles')
    .select('id, current_agent_id, created_by')
    .eq('status', 'PAUSED');

  if (pausedErr || !pausedProfiles || pausedProfiles.length === 0) {
    return { checked: 0, triggered: 0 };
  }

  const pausedIds = pausedProfiles.map((p: any) => p.id);
  const pauseMap = await getActivePauseInfoMapInternal(adminClient, pausedIds);

  const dueProfiles = pausedProfiles.filter((p: any) => {
    const info = pauseMap.get(p.id);
    if (!info?.pause_until) return false;
    const untilTs = new Date(info.pause_until).getTime();
    return !isNaN(untilTs) && untilTs <= nowMs;
  });

  if (dueProfiles.length === 0) {
    return { checked: pausedProfiles.length, triggered: 0 };
  }

  const dueIds = dueProfiles.map((p: any) => p.id);

  // Check existing reminder notifications for due profiles
  const { data: existingNotifs } = await adminClient
    .from('notifications')
    .select('entity_id, created_at')
    .eq('entity_type', 'profile_pause_reminder')
    .in('entity_id', dueIds);

  const latestNotifByProfile = new Map<string, number>();
  for (const n of existingNotifs || []) {
    if (!n.entity_id || !n.created_at) continue;
    const ts = new Date(n.created_at).getTime();
    const prev = latestNotifByProfile.get(n.entity_id) || 0;
    if (ts > prev) latestNotifByProfile.set(n.entity_id, ts);
  }

  const toTrigger = dueProfiles.filter((p: any) => {
    const info = pauseMap.get(p.id);
    const pausedAtTs = info?.paused_at ? new Date(info.paused_at).getTime() : 0;
    const latestNotifTs = latestNotifByProfile.get(p.id) || 0;
    return latestNotifTs < pausedAtTs || latestNotifTs === 0;
  });

  if (toTrigger.length === 0) {
    return { checked: pausedProfiles.length, triggered: 0 };
  }

  const triggerIds = toTrigger.map((p: any) => p.id);
  const agentUserIds = Array.from(
    new Set(
      toTrigger
        .map((p: any) => p.current_agent_id || p.created_by)
        .filter(Boolean)
    )
  );

  const [piRes, agentRolesRes] = await Promise.all([
    adminClient
      .from('personal_information')
      .select('profile_id, full_name')
      .in('profile_id', triggerIds),
    agentUserIds.length > 0
      ? adminClient
          .from('user_roles')
          .select('user_id, roles(name)')
          .in('user_id', agentUserIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const nameMap = new Map<string, string>();
  for (const row of piRes.data || []) {
    if (row.profile_id) nameMap.set(row.profile_id, row.full_name || 'Profile');
  }

  const managerOrAdminUserIds = new Set<string>();
  for (const row of agentRolesRes.data || []) {
    const r = Array.isArray((row as any).roles) ? (row as any).roles[0]?.name : (row as any).roles?.name;
    const roleUpper = String(r || '').toUpperCase();
    if (roleUpper === 'MANAGER' || roleUpper === 'HIGH_LEVEL_ADMIN') {
      managerOrAdminUserIds.add((row as any).user_id);
    }
  }

  const notificationsToInsert: any[] = [];

  for (const p of toTrigger) {
    const info = pauseMap.get(p.id)!;
    const fullName = nameMap.get(p.id) || 'Profile';
    const durationLabel = info.pause_days
      ? `${info.pause_days} day${info.pause_days === 1 ? '' : 's'}`
      : `ended on ${formatPauseDate(info.pause_until)}`;
    const reasonPart = info.reason ? ` (${info.reason})` : '';
    const title = `Pause Reminder: ${fullName}`;
    const message = `The pause period (${durationLabel}) for ${fullName} has ended${reasonPart}. Please activate this profile or set a new reminder.`;

    const ownerUserId = p.current_agent_id || p.created_by;
    if (ownerUserId && !managerOrAdminUserIds.has(ownerUserId)) {
      notificationsToInsert.push({
        user_id: ownerUserId,
        target_role: null,
        type: 'ALERT',
        title,
        message,
        entity_type: 'profile_pause_reminder',
        entity_id: p.id,
      });
    }

    notificationsToInsert.push({
      user_id: null,
      target_role: 'MANAGER',
      type: 'ALERT',
      title,
      message,
      entity_type: 'profile_pause_reminder',
      entity_id: p.id,
    });

    notificationsToInsert.push({
      user_id: null,
      target_role: 'HIGH_LEVEL_ADMIN',
      type: 'ALERT',
      title,
      message,
      entity_type: 'profile_pause_reminder',
      entity_id: p.id,
    });
  }

  if (notificationsToInsert.length > 0) {
    const { error: insertErr } = await adminClient
      .from('notifications')
      .insert(notificationsToInsert);

    if (insertErr) {
      console.error('[checkAndTriggerDuePauseReminders] insert notifications failed:', insertErr);
      return { checked: pausedProfiles.length, triggered: 0 };
    }
  }

  return { checked: pausedProfiles.length, triggered: toTrigger.length };
}

export { getActivePauseInfoMapInternal };
