// Raw database queries for requests

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RequestItem, RequestStatus, FilterState } from '@/components/requests/types';

export async function fetchBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  const supabase = await createClient();

  // Query official manager requests board view
  const { data, error } = await supabase
    .from('vw_manager_requests_board')
    .select('*');

  if (error) {
    console.error('Supabase requests view query error:', error);
    return [];
  }

  let boardItems: RequestItem[] = (data || []).map((item: any) => ({
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

  // Bulletproof Memory Filtering based on User Inputs
  return boardItems.filter((item) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.cnic.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Date range
    if (filters.dateFrom && item.date < filters.dateFrom) return false;
    if (filters.dateTo && item.date > filters.dateTo) return false;
    
    // Staff exact match
    if (filters.staff && item.staff !== filters.staff) return false;
    
    return true;
  });
}

// =======================================================================
// Fetch Real Agent Names for the Filter Dropdown
// =======================================================================
export async function fetchAgentNames(): Promise<string[]> {
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
}

// =======================================================================
// Mark a Request as Read
// =======================================================================
export async function markRequestAsRead(requestId: string): Promise<void> {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('information_requests')
    .update({ is_read: true })
    .eq('id', requestId);

  if (error) {
    console.error('Error marking request as read:', error);
  }
}

