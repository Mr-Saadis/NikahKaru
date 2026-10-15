// Raw database queries for requests
import { unstable_cache } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RequestItem, RequestStatus, FilterState } from '@/components/requests/types';

export async function fetchBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  const supabase = await createClient();

  // Query official manager requests board view
  let query = supabase.from('vw_manager_requests_board').select('*');

  // Database-Level Filtering
  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`full_name.ilike."${q}",cnic.ilike."${q}",primary_phone.ilike."${q}"`);
  }
  if (filters.dateFrom) {
    query = query.gte('request_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('request_date', filters.dateTo);
  }
  if (filters.staff) {
    query = query.or(`current_agent_name.eq."${filters.staff}",created_by_name.eq."${filters.staff}"`);
  }

  query = query.order('request_date', { ascending: false }).limit(200);

  const { data, error } = await query;

  if (error) {
    console.error('Supabase requests view query error:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.board_id,
    name: item.full_name || 'Unknown',
    cnic: item.cnic || '00000-0000000-0',
    phone: item.primary_phone || item.phone || 'N/A',
    staff: item.current_agent_name || item.created_by_name || 'System',
    date: item.request_date,
    status: item.request_status,
    later: item.later || false,
    isRead: item.is_read || false,
    profileData: item, // Attach full profile row for sheet & matching
  }));
}

export async function fetchColumnRequests(
  status: string,
  filters: FilterState,
  offset: number = 0,
  limit: number = 20
): Promise<RequestItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from('vw_manager_requests_board')
    .select('*')
    .eq('request_status', status);

  // Database-Level Filtering
  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`full_name.ilike."${q}",cnic.ilike."${q}",primary_phone.ilike."${q}"`);
  }
  if (filters.dateFrom) {
    query = query.gte('request_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('request_date', filters.dateTo);
  }
  if (filters.staff) {
    query = query.or(`current_agent_name.eq."${filters.staff}",created_by_name.eq."${filters.staff}"`);
  }

  // Pagination & Sorting
  query = query
    .order('request_date', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error(`Supabase requests view query error for column ${status}:`, error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.board_id,
    name: item.full_name || 'Unknown',
    cnic: item.cnic || '00000-0000000-0',
    phone: item.primary_phone || item.phone || 'N/A',
    staff: item.current_agent_name || item.created_by_name || 'System',
    date: item.request_date,
    status: item.request_status,
    later: item.later || false,
    isRead: item.is_read || false,
    profileData: item,
  }));
}

// =======================================================================
// Fetch Real Agent Names for the Filter Dropdown
// =======================================================================
export const fetchAgentNames = unstable_cache(async (): Promise<string[]> => {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      roles!inner ( name ),
      users!user_roles_user_id_fkey!inner ( full_name )
    `)
    .eq('roles.name', 'AGENT');

  if (error) {
    console.error('Error fetching agent names:', error);
    return [];
  }

  if (!data) return [];

  // Extract names
  const names = new Set<string>();
  data.forEach((row: any) => {
    let name = row.users?.full_name;
    if (name) {
      names.add(name);
    }
  });

  return Array.from(names).sort();
}, ['agent-names-cache'], { revalidate: 3600, tags: ['agents'] });

// =======================================================================
// Mark a Request as Read
// =======================================================================
export async function markRequestAsRead(requestId: string): Promise<void> {
  const supabase = await createClient(); // Use regular authenticated client to respect RLS
  
  const { error } = await supabase
    .from('information_requests')
    .update({ is_read: true })
    .eq('id', requestId);

  if (error) {
    console.error('Error marking request as read:', error);
  }
}

// =======================================================================
// Fetch Request Release History (Manager Only)
// =======================================================================
export async function fetchRequestReleaseHistory(requestId: string): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_request_release_history', {
    p_request_id: requestId,
  });

  if (error) {
    console.error('Failed to fetch request release history:', error);
    return [];
  }

  return data || [];
}

// =======================================================================
// Fetch Sent Candidate Profiles with Role-Based Field Masking
// (If AGENT calls this, unapproved fields are stripped at server level!)
// =======================================================================
export async function fetchSentProfilesForRequest(
  requestId: string,
  sourceProfileId?: string
): Promise<{ history: any[]; fullProfiles: any[]; viewResults: any[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { history: [], fullProfiles: [], viewResults: [] };

  // Determine user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', user.id)
    .single();

  const userRole = (roleData as any)?.roles?.name || 'AGENT';
  const isAgent = userRole === 'AGENT';

  // 1. Fetch release history for this request
  const { data: historyData, error: histError } = await supabase.rpc('get_request_release_history', {
    p_request_id: requestId,
  });

  const history = historyData || [];
  if (history.length === 0) {
    return { history: [], fullProfiles: [], viewResults: [] };
  }

  const candidateIds = history.map((h: any) => h.candidate_profile_id);

  // 2. Fetch profiles from database
  const { data: profilesData } = await supabase
    .from('vw_profile_core')
    .select('*')
    .in('profile_id', candidateIds);

  let fullProfiles = profilesData || [];

  // 3. Fetch scores if sourceProfileId provided
  let viewResults: any[] = [];
  if (sourceProfileId) {
    const { data: scoresData } = await supabase
      .from('vw_profile_match_results')
      .select('*')
      .eq('source_profile_id', sourceProfileId)
      .in('candidate_profile_id', candidateIds);
    if (scoresData) viewResults = scoresData;
  }

  // 4. CRITICAL AGENT SECURITY: Strip unapproved fields if caller is an AGENT!
  if (isAgent) {
    const fieldMapping: Record<string, string[]> = {
      'personal_information.profile_picture': ['profile_url', 'profile_picture'],
      'personal_information.cnic': ['cnic'],
      'personal_information.phone': ['phone', 'primary_phone'],
      'personal_information.full_name': ['full_name'],
      'personal_information.date_of_birth': ['date_of_birth'],
      'personal_information.marital_status': ['marital_status'],
      'personal_information.number_of_children': ['number_of_children'],
      'physical_information.height_cm': ['height_cm'],
      'physical_information.weight_kg': ['weight_kg'],
      'physical_information.complexion': ['complexion'],
      'physical_information.has_disability': ['has_disability', 'disability_details'],
      'education_records': ['qualification', 'field_of_study'],
      'employment_records': ['job_title'],
      'income_information.monthly_income_min': ['monthly_income_min', 'monthly_income_max', 'currency_code'],
      'religion_information.religion_id': ['religion_name_en', 'religion_name_ur'],
      'religion_information.sect_id': ['sect_name_en', 'sect_name_ur'],
      'religion_information.caste_id': ['caste_name_en', 'caste_name_ur', 'other_caste_text'],
      'personal_information.mother_tongue_id': ['mother_tongue_name_en', 'mother_tongue_name_ur'],
      'profile_locations.current_city_id': ['current_city_name_en', 'current_city_name_ur', 'current_location_text', 'current_country_name_en', 'current_province_name_en'],
      'profile_locations.permanent_city_id': ['permanent_city_name_en', 'permanent_city_name_ur', 'permanent_location_text'],
      'residency_information.house_status': ['house_status', 'property_type', 'nationality_country_name_en'],
      'family_information.family_profession_business': ['family_profession_business'],
      'family_information.social_background': ['social_background'],
      'residency_information.family_setup': ['family_setup'],
      'residency_information.living_with': ['living_with', 'living_with_other_details'],
      'lifestyle_information.religious_practice': ['religious_practice'],
      'lifestyle_information.beard': ['beard'],
      'lifestyle_information.hijab': ['hijab'],
      'lifestyle_information.smoking': ['smoking'],
    };

    fullProfiles = fullProfiles.map((prof: any) => {
      const h = history.find((x: any) => x.candidate_profile_id === prof.profile_id);
      const selectedSet = new Set<string>(h?.selected_fields || []);

      const masked: any = {
        profile_id: prof.profile_id,
        gender: prof.gender,
      };

      for (const [fieldPath, columnKeys] of Object.entries(fieldMapping)) {
        if (selectedSet.has(fieldPath)) {
          for (const key of columnKeys) {
            if (prof[key] !== undefined) {
              masked[key] = prof[key];
            }
          }
        } else {
          // Explicitly nullify unapproved fields so they never leave the server!
          for (const key of columnKeys) {
            masked[key] = null;
          }
        }
      }

      return masked;
    });
  }

  return { history, fullProfiles, viewResults };
}


// =======================================================================
// Fetch Profile Complete Release History (When profile is candidate or source)
// =======================================================================
export async function fetchProfileCompleteReleaseHistory(profileId: string): Promise<any[]> {
  const supabase = await createClient();

  // Get all requests where this profile is the source
  const { data: sourceRequests } = await supabase
    .from('information_requests')
    .select('id')
    .eq('source_profile_id', profileId);
    
  const requestIds = sourceRequests?.map(r => r.id) || [];

  if (requestIds.length === 0) return [];

  // Get all releases for these requests (i.e. candidates sent to this source profile)
  const { data: releases, error } = await supabase
    .from('information_releases')
    .select(`
      id,
      request_id,
      candidate_profile_id,
      released_at
    `)
    .in('request_id', requestIds)
    .order('released_at', { ascending: false });

  if (error || !releases) return [];

  const otherProfileIds = new Set<string>();
  releases.forEach(r => {
    otherProfileIds.add(r.candidate_profile_id);
  });

  const { data: namesData } = await supabase
    .from('vw_profile_core')
    .select('profile_id, full_name')
    .in('profile_id', Array.from(otherProfileIds));
    
  const namesMap = new Map();
  if (namesData) {
    namesData.forEach(row => namesMap.set(row.profile_id, row.full_name));
  }

  return releases.map(r => {
    return {
      release_id: r.id,
      other_profile_id: r.candidate_profile_id,
      other_name: namesMap.get(r.candidate_profile_id) || 'Unknown',
      released_at: r.released_at,
    };
  });
}

// =======================================================================
// Fetch Profile Audit Logs (kb kia, kisny kia, kia kiaa)
// =======================================================================
export interface ProfileAuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_user_id: string | null;
  actor_name: string;
  actor_role: string;
  created_at: string;
  title: string;
  description: string;
  metadata?: any;
  old_data?: any;
  new_data?: any;
}

function formatAuditAction(log: any): { title: string; description: string } {
  const action = log.action;
  const entityType = log.entity_type;
  const meta = log.metadata || {};
  const newData = log.new_data || {};
  const oldData = log.old_data || {};

  if (action === 'CREATE' && entityType === 'information_request') {
    return {
      title: 'Information Request Created',
      description: `Agent requested candidate matching for this profile (Status: ${newData.status || 'PENDING'}).`,
    };
  }

  if (action === 'RELEASE' && entityType === 'information_request') {
    const candidateCount = meta.selected_candidate_count ?? 1;
    const fieldCount = meta.field_snapshot_count;
    return {
      title: 'Candidate Profiles Released',
      description: `Manager released ${candidateCount} candidate profile${candidateCount > 1 ? 's' : ''}${fieldCount ? ` (${fieldCount} fields approved)` : ''}.`,
    };
  }

  if (action === 'CREATE' && (entityType === 'profile' || entityType === 'profiles')) {
    return {
      title: 'Profile Created',
      description: 'Profile registered in the NikaahKaro matrimonial system.',
    };
  }

  if (action === 'UPDATE' && (entityType === 'profile' || entityType === 'profiles')) {
    return {
      title: 'Profile Updated',
      description: 'Profile details or partner preferences were updated.',
    };
  }

  if (action === 'STATUS_CHANGE') {
    return {
      title: 'Status Changed',
      description: `Profile status updated${newData.status ? ` to ${newData.status}` : ''}${oldData.status ? ` (from ${oldData.status})` : ''}.`,
    };
  }

  if (action === 'MATCH_RUN') {
    return {
      title: 'Match Algorithm Executed',
      description: 'Deterministic match run evaluated candidate compatibility scores.',
    };
  }

  if (action === 'APPROVE') {
    return {
      title: 'Request Approved',
      description: 'Manager approved the information disclosure request.',
    };
  }

  if (action === 'REJECT') {
    return {
      title: 'Request Rejected',
      description: meta.reason ? `Request rejected: ${meta.reason}` : 'Information request was rejected.',
    };
  }

  if (action === 'ASSIGN') {
    return {
      title: 'Agent Assigned',
      description: meta.agent_name ? `Assigned to agent ${meta.agent_name}.` : 'Profile assigned to an agent.',
    };
  }

  if (action === 'UNASSIGN') {
    return {
      title: 'Agent Unassigned',
      description: 'Agent assignment removed.',
    };
  }

  const cleanAction = (action || 'ACTION').replace(/_/g, ' ');
  const cleanEntity = (entityType || 'ENTITY').replace(/_/g, ' ');
  return {
    title: `${cleanAction} (${cleanEntity})`,
    description: meta.note || meta.summary || `Action performed on ${cleanEntity.toLowerCase()}.`,
  };
}

export async function fetchProfileAuditLogs(profileId: string): Promise<ProfileAuditLogItem[]> {
  if (!profileId) return [];

  const supabase = createAdminClient();

  // 1. Get all requests associated with this profile
  const { data: sourceRequests } = await supabase
    .from('information_requests')
    .select('id')
    .eq('source_profile_id', profileId);

  const requestIds = (sourceRequests || []).map((r: any) => r.id);

  // 2. Fetch audit logs directly tied to profile or its requests
  let rawLogs: any[] = [];

  if (requestIds.length > 0) {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .or(`entity_id.eq.${profileId},entity_id.in.(${requestIds.join(',')})`)
      .order('created_at', { ascending: false });

    if (!error && logs) {
      rawLogs = logs;
    }
  } else {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', profileId)
      .order('created_at', { ascending: false });

    if (!error && logs) {
      rawLogs = logs;
    }
  }

  // Also query any logs where new_data contains source_profile_id = profileId
  const { data: jsonLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .filter('new_data->>source_profile_id', 'eq', profileId);

  if (jsonLogs && jsonLogs.length > 0) {
    const existingIds = new Set(rawLogs.map(l => l.id));
    for (const jLog of jsonLogs) {
      if (!existingIds.has(jLog.id)) {
        rawLogs.push(jLog);
        existingIds.add(jLog.id);
      }
    }
    rawLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (rawLogs.length === 0) return [];

  // 3. Resolve actor details (names, roles)
  const actorIds = Array.from(new Set(rawLogs.map(l => l.actor_user_id).filter(Boolean)));
  const userMap = new Map<string, { name: string; role: string }>();

  if (actorIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', actorIds);

    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, roles(name)')
      .in('user_id', actorIds);

    const rolesMap = new Map<string, string>();
    if (rolesData) {
      rolesData.forEach((r: any) => {
        const roleName = r.roles?.name;
        if (roleName) rolesMap.set(r.user_id, roleName);
      });
    }

    if (usersData) {
      usersData.forEach((u: any) => {
        userMap.set(u.id, {
          name: u.full_name || u.email?.split('@')[0] || 'User',
          role: rolesMap.get(u.id) || 'AGENT',
        });
      });
    }
  }

  // 4. Transform into rich ProfileAuditLogItem
  return rawLogs.map((log: any) => {
    const actor = log.actor_user_id ? userMap.get(log.actor_user_id) : null;
    const actorRole = actor?.role || (log.metadata?.role ?? 'SYSTEM');
    const actorName = actor?.name || (actorRole === 'SYSTEM' ? 'System' : 'Staff');
    const { title, description } = formatAuditAction(log);

    return {
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      actor_user_id: log.actor_user_id,
      actor_name: actorName,
      actor_role: actorRole,
      created_at: log.created_at,
      title,
      description,
      metadata: log.metadata,
      old_data: log.old_data,
      new_data: log.new_data,
    };
  });
}

// =======================================================================
// Fetch Profile Active Preferences
// =======================================================================
export async function fetchProfileActivePreferences(profileId: string): Promise<any | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vw_profile_active_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile preferences from view:', error);
    return null;
  }

  return data || null;
}

