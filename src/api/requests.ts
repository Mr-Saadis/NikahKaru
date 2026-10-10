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

