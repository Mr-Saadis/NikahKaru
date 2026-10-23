import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RequestItem, FilterState } from '@/components/requests/types';

// =======================================================================
// Fetch all board requests for agent (used on initial load / full sync)
// =======================================================================
export async function fetchAgentBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Query official agent requests board view
  let query = supabase.from('vw_agent_requests_board').select('*');

  // Database-Level Filtering
  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`full_name.ilike."${q}",cnic.ilike."${q}",phone.ilike."${q}"`);
  }
  if (filters.dateFrom) {
    query = query.gte('request_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('request_date', filters.dateTo);
  }

  query = query.order('request_date', { ascending: false }).limit(200);

  const { data, error } = await query;

  if (error) {
    console.error('Supabase agent requests view query error:', error);
    return [];
  }

  // 1. Filter out items reassigned to another agent
  let rawData = (data || []).filter((item: any) => !item.current_agent_id || item.current_agent_id === user.id);

  // 2. Self-healing check: Fetch any profiles assigned to this agent that might be missing from the view
  const { data: assignedProfs } = await supabase
    .from('profiles')
    .select('id')
    .eq('current_agent_id', user.id);

  const assignedProfIds = (assignedProfs || []).map((p: any) => p.id);
  const existingProfIds = new Set(rawData.map((item: any) => item.profile_id));
  const missingProfIds = assignedProfIds.filter(id => !existingProfIds.has(id));

  if (missingProfIds.length > 0) {
    const { data: missingReqs } = await supabase
      .from('information_requests')
      .select('id, status, created_at, is_read, source_profile_id')
      .in('source_profile_id', missingProfIds);

    let profCoreQuery = supabase.from('vw_profile_core').select('*').in('profile_id', missingProfIds);
    if (filters.search) {
      const q = `%${filters.search}%`;
      profCoreQuery = profCoreQuery.or(`full_name.ilike."${q}",cnic.ilike."${q}",phone.ilike."${q}"`);
    }
    const { data: missingProfCore } = await profCoreQuery;
    const coreMap = new Map((missingProfCore || []).map((p: any) => [p.profile_id, p]));

    // Auto-sync requested_by in background so future view queries include it directly
    Promise.resolve(
      createAdminClient()
        .from('information_requests')
        .update({ requested_by: user.id })
        .in('source_profile_id', missingProfIds)
    ).catch(() => {});

    for (const req of (missingReqs || [])) {
      const core = coreMap.get(req.source_profile_id);
      if (core) {
        let st = 'requested';
        if (req.status === 'IN_REVIEW') st = 'responded';
        else if (req.status === 'DOWNLOADED') st = 'downloaded';
        else if (req.status === 'COMPLETED') st = 'done';
        else if (req.status === 'COMPLETED_OUTSIDE_SYSTEM') st = 'completed_outside';
        else if (req.status === 'CANCELLED') st = 'archive';

        rawData.push({
          ...core,
          board_id: req.id,
          request_id: req.id,
          request_status: st,
          request_date: req.created_at,
          is_read: req.is_read || false,
        });
      }
    }
  }

  const requestIds = rawData.map((item: any) => item.request_id || item.board_id).filter(Boolean);
  let downloadedIds = new Set<string>();
  let completedOutsideIds = new Set<string>();

  if (requestIds.length > 0) {
    const { data: statusRows } = await supabase
      .from('information_requests')
      .select('id, status')
      .in('id', requestIds)
      .in('status', ['DOWNLOADED', 'COMPLETED_OUTSIDE_SYSTEM']);

    if (statusRows && statusRows.length > 0) {
      statusRows.forEach((r: any) => {
        if (r.status === 'DOWNLOADED') downloadedIds.add(r.id);
        if (r.status === 'COMPLETED_OUTSIDE_SYSTEM') completedOutsideIds.add(r.id);
      });
    }
  }

  return rawData.map((item: any) => {
    let status = item.request_status;
    if (downloadedIds.has(item.request_id) || downloadedIds.has(item.board_id)) {
      status = 'downloaded';
    } else if (completedOutsideIds.has(item.request_id) || completedOutsideIds.has(item.board_id)) {
      status = 'completed_outside';
    }
    return {
      id: item.board_id,
      name: item.full_name || 'Unknown',
      cnic: item.cnic || '00000-0000000-0',
      phone: item.phone || item.primary_phone || 'N/A',
      staff: item.created_by_name || item.current_agent_name || 'Agent',
      date: item.request_date,
      status,
      later: item.later || false,
      isRead: item.is_read || false,
      profileData: { ...item, request_status: status },
    };
  });
}

// =======================================================================
// Fetch column requests for agent with pagination (Lazy Loading)
// =======================================================================
export async function fetchAgentColumnRequests(
  status: string,
  filters: FilterState,
  offset: number = 0,
  limit: number = 20
): Promise<RequestItem[]> {
  const supabase = await createClient();

  if (status === 'downloaded') {
    // 1. First check if the database view directly returns downloaded requests
    let viewQuery = supabase
      .from('vw_agent_requests_board')
      .select('*')
      .eq('request_status', 'downloaded');

    if (filters.search) {
      const q = `%${filters.search}%`;
      viewQuery = viewQuery.or(`full_name.ilike."${q}",cnic.ilike."${q}",phone.ilike."${q}"`);
    }
    if (filters.dateFrom) {
      viewQuery = viewQuery.gte('request_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      viewQuery = viewQuery.lte('request_date', filters.dateTo);
    }
    viewQuery = viewQuery.order('request_date', { ascending: false }).range(offset, offset + limit - 1);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: viewData } = await viewQuery;
    if (viewData && viewData.length > 0) {
      const validItems = viewData.filter((item: any) => !item.current_agent_id || item.current_agent_id === user.id);
      if (validItems.length > 0) {
        return validItems.map((item: any) => ({
          id: item.board_id,
          name: item.full_name || 'Unknown',
          cnic: item.cnic || '00000-0000000-0',
          phone: item.phone || item.primary_phone || 'N/A',
          staff: item.created_by_name || item.current_agent_name || 'Agent',
          date: item.request_date,
          status: 'downloaded',
          later: item.later || false,
          isRead: item.is_read || false,
          profileData: item,
        }));
      }
    }

    // 2. Fallback: Query information_requests with status = 'DOWNLOADED' directly
    const { data: myProfs } = await supabase
      .from('profiles')
      .select('id')
      .eq('current_agent_id', user.id);
    const myProfIds = (myProfs || []).map((p: any) => p.id);

    let irQuery = supabase
      .from('information_requests')
      .select('id, created_at, is_read, source_profile_id');

    if (myProfIds.length > 0) {
      irQuery = irQuery.or(`requested_by.eq.${user.id},source_profile_id.in.(${myProfIds.join(',')})`);
    } else {
      irQuery = irQuery.eq('requested_by', user.id);
    }

    irQuery = irQuery
      .eq('status', 'DOWNLOADED')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.dateFrom) irQuery = irQuery.gte('created_at', filters.dateFrom);
    if (filters.dateTo) irQuery = irQuery.lte('created_at', filters.dateTo);

    const { data: irData, error: irError } = await irQuery;
    if (irError || !irData || irData.length === 0) return [];

    const profIds = irData.map((r: any) => r.source_profile_id).filter(Boolean);
    let profMap = new Map<string, any>();
    if (profIds.length > 0) {
      let profQuery = supabase.from('vw_profile_core').select('*').in('profile_id', profIds);
      if (filters.search) {
        const q = `%${filters.search}%`;
        profQuery = profQuery.or(`full_name.ilike."${q}",cnic.ilike."${q}",phone.ilike."${q}"`);
      }
      const { data: profs } = await profQuery;
      (profs || []).forEach((p: any) => profMap.set(p.profile_id, p));
    }

    return irData
      .filter((r: any) => !filters.search || profMap.has(r.source_profile_id))
      .map((r: any) => {
        const prof = profMap.get(r.source_profile_id) || {};
        return {
          id: r.id,
          name: prof.full_name || 'Unknown',
          cnic: prof.cnic || '00000-0000000-0',
          phone: prof.phone || prof.primary_phone || 'N/A',
          staff: prof.created_by_name || prof.current_agent_name || 'Agent',
          date: r.created_at,
          status: 'downloaded',
          later: false,
          isRead: r.is_read || false,
          profileData: { ...prof, request_id: r.id, request_status: 'downloaded' },
        };
      });
  }

  if (status === 'completed_outside') {
    // 1. First check if the database view directly returns completed_outside requests
    let viewQuery = supabase
      .from('vw_agent_requests_board')
      .select('*')
      .eq('request_status', 'completed_outside');

    if (filters.search) {
      const q = `%${filters.search}%`;
      viewQuery = viewQuery.or(`full_name.ilike."${q}",cnic.ilike."${q}",phone.ilike."${q}"`);
    }
    if (filters.dateFrom) viewQuery = viewQuery.gte('request_date', filters.dateFrom);
    if (filters.dateTo) viewQuery = viewQuery.lte('request_date', filters.dateTo);
    viewQuery = viewQuery.order('request_date', { ascending: false }).range(offset, offset + limit - 1);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: viewData } = await viewQuery;
    if (viewData && viewData.length > 0) {
      const validItems = viewData.filter((item: any) => !item.current_agent_id || item.current_agent_id === user.id);
      if (validItems.length > 0) {
        return validItems.map((item: any) => ({
          id: item.board_id,
          name: item.full_name || 'Unknown',
          cnic: item.cnic || '00000-0000000-0',
          phone: item.phone || item.primary_phone || 'N/A',
          staff: item.created_by_name || item.current_agent_name || 'Agent',
          date: item.request_date,
          status: 'completed_outside',
          later: item.later || false,
          isRead: item.is_read || false,
          profileData: item,
        }));
      }
    }

    // 2. Fallback: Query information_requests with status = 'COMPLETED_OUTSIDE_SYSTEM' directly
    const { data: myProfs } = await supabase
      .from('profiles')
      .select('id')
      .eq('current_agent_id', user.id);
    const myProfIds = (myProfs || []).map((p: any) => p.id);

    let irQuery = supabase
      .from('information_requests')
      .select('id, created_at, is_read, source_profile_id');

    if (myProfIds.length > 0) {
      irQuery = irQuery.or(`requested_by.eq.${user.id},source_profile_id.in.(${myProfIds.join(',')})`);
    } else {
      irQuery = irQuery.eq('requested_by', user.id);
    }

    irQuery = irQuery
      .eq('status', 'COMPLETED_OUTSIDE_SYSTEM')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.dateFrom) irQuery = irQuery.gte('created_at', filters.dateFrom);
    if (filters.dateTo) irQuery = irQuery.lte('created_at', filters.dateTo);

    const { data: irData, error: irError } = await irQuery;
    if (irError || !irData || irData.length === 0) return [];

    const profIds = irData.map((r: any) => r.source_profile_id).filter(Boolean);
    let profMap = new Map<string, any>();
    if (profIds.length > 0) {
      let profQuery = supabase.from('vw_profile_core').select('*').in('profile_id', profIds);
      if (filters.search) {
        const q = `%${filters.search}%`;
        profQuery = profQuery.or(`full_name.ilike."${q}",cnic.ilike."${q}",phone.ilike."${q}"`);
      }
      const { data: profs } = await profQuery;
      (profs || []).forEach((p: any) => profMap.set(p.profile_id, p));
    }

    return irData
      .filter((r: any) => !filters.search || profMap.has(r.source_profile_id))
      .map((r: any) => {
        const prof = profMap.get(r.source_profile_id) || {};
        return {
          id: r.id,
          name: prof.full_name || 'Unknown',
          cnic: prof.cnic || '00000-0000000-0',
          phone: prof.phone || prof.primary_phone || 'N/A',
          staff: prof.created_by_name || prof.current_agent_name || 'Agent',
          date: r.created_at,
          status: 'completed_outside',
          later: false,
          isRead: r.is_read || false,
          profileData: { ...prof, request_id: r.id, request_status: 'completed_outside' },
        };
      });
  }

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('vw_agent_requests_board')
    .select('*')
    .eq('request_status', status);

  // Database-Level Filtering
  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`full_name.ilike."${q}",cnic.ilike."${q}",phone.ilike."${q}"`);
  }
  if (filters.dateFrom) {
    query = query.gte('request_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('request_date', filters.dateTo);
  }

  // Pagination & Sorting
  query = query
    .order('request_date', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error(`Supabase agent requests view error for column ${status}:`, error);
    return [];
  }

  const rawData = (data || []).filter((item: any) => !user || !item.current_agent_id || item.current_agent_id === user.id);

  // If status is 'requested', filter out any items that are actually DOWNLOADED in information_requests
  if (status === 'requested' && rawData.length > 0) {
    const reqIds = rawData.map((item: any) => item.request_id || item.board_id).filter(Boolean);
    const { data: downloadedRows } = await supabase
      .from('information_requests')
      .select('id')
      .in('id', reqIds)
      .eq('status', 'DOWNLOADED');

    const downloadedSet = new Set((downloadedRows || []).map((r: any) => r.id));
    return rawData
      .filter((item: any) => !downloadedSet.has(item.request_id) && !downloadedSet.has(item.board_id))
      .map((item: any) => ({
        id: item.board_id,
        name: item.full_name || 'Unknown',
        cnic: item.cnic || '00000-0000000-0',
        phone: item.phone || item.primary_phone || 'N/A',
        staff: item.created_by_name || item.current_agent_name || 'Agent',
        date: item.request_date,
        status: item.request_status,
        later: item.later || false,
        isRead: item.is_read || false,
        profileData: item,
      }));
  }

  return rawData.map((item: any) => ({
    id: item.board_id,
    name: item.full_name || 'Unknown',
    cnic: item.cnic || '00000-0000000-0',
    phone: item.phone || item.primary_phone || 'N/A',
    staff: item.created_by_name || item.current_agent_name || 'Agent',
    date: item.request_date,
    status: item.request_status,
    later: item.later || false,
    isRead: item.is_read || false,
    profileData: item, // Full profile payload attached
  }));
}

// Backward-compatible alias
export async function fetchAgentRequests(filters: FilterState): Promise<RequestItem[]> {
  return fetchAgentBoardRequests(filters);
}

// =======================================================================
// Fetch Agent Names (current agent name for filter consistency)
// =======================================================================
export async function fetchAgentNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();

  if (userData?.full_name) {
    return [userData.full_name];
  }
  return [];
}
