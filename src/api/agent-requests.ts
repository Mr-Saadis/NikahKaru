import { createClient } from '@/lib/supabase/server';
import type { RequestItem, FilterState } from '@/components/requests/types';

// =======================================================================
// Fetch all board requests for agent (used on initial load / full sync)
// =======================================================================
export async function fetchAgentBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  const supabase = await createClient();

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

  return (data || []).map((item: any) => ({
    id: item.board_id,
    name: item.full_name || 'Unknown',
    cnic: item.cnic || '00000-0000000-0',
    phone: item.phone || item.primary_phone || 'N/A',
    staff: item.created_by_name || item.current_agent_name || 'Agent',
    date: item.request_date,
    status: item.request_status,
    later: item.later || false,
    isRead: item.is_read || false,
    profileData: item, // Full profile payload attached for sheet & sections
  }));
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

  return (data || []).map((item: any) => ({
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
