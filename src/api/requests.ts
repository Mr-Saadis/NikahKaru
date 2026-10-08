// Raw database queries for requests

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RequestItem, RequestStatus, FilterState } from '@/components/requests/types';

export async function fetchBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  const supabase = await createClient();
  const boardItems: RequestItem[] = [];

  // =======================================================================
  // 1. Fetch NEW DATA from Profiles (Profiles with no requests or new ones)
  // =======================================================================
  let profilesQuery = supabase
    .from('profiles')
    .select(`
      id,
      created_at,
      status,
      created_by ( id, full_name ),
      personal_information ( full_name, cnic )
    `)
    .order('created_at', { ascending: false });

  // Note: For a real bulletproof filtering, Supabase server-side filters
  // would be applied here, but for now we'll do robust memory filtering
  // below to handle the exact user-typed search strings across multiple relations
  // without complex inner-join POSTGREST syntax limits.

  const { data: profilesData, error: profilesError } = await profilesQuery;
  
  if (profilesError) {
    console.error('Supabase profiles query error:', profilesError);
  }

  if (!profilesError && profilesData) {
    profilesData.forEach((p: any) => {
      // "New Data" logic: we show it if it's recently added.
      // Ideally, we'd check if it has NO information_requests.
      // For now, we put all active/draft profiles in "new".
      const name = p.personal_information?.full_name || 'Unknown Name';
      const cnic = p.personal_information?.cnic?.toString() || '00000-0000000-0';
      let staffName = p.created_by?.full_name || 'System';

      boardItems.push({
        id: p.id, // Using profile ID as the card ID for new data
        name,
        cnic,
        phone: 'N/A', // Phone is not directly on profile in schema v2
        staff: staffName,
        date: p.created_at,
        status: 'new',
        later: false
      });
    });
  }

  // =======================================================================
  // 2. Fetch Requests (First, Second, Responded, Completed, etc.)
  // =======================================================================
  const { data: reqData, error: reqError } = await supabase
    .from('information_requests')
    .select(`
      id,
      status,
      created_at,
      is_read,
      requested_by ( id, full_name ),
      source_profile_id,
      profiles (
        id,
        personal_information ( full_name, cnic )
      )
    `)
    .order('created_at', { ascending: false });

  if (reqError) {
    console.error('Supabase requests query error:', reqError);
  }

  if (!reqError && reqData) {
    // Count requests per profile to determine First vs Second time
    const requestCountMap = new Map<string, number>();
    reqData.forEach((r: any) => {
      const pid = r.source_profile_id;
      requestCountMap.set(pid, (requestCountMap.get(pid) || 0) + 1);
    });

    const seenProfileIds = new Set<string>();

    reqData.forEach((r: any) => {
      const pid = r.source_profile_id;
      const count = requestCountMap.get(pid) || 1;

      // Skip if we already added a newer request for this profile
      if (seenProfileIds.has(pid)) return;
      seenProfileIds.add(pid);

      let colStatus: RequestStatus = 'first';
      
      if (r.status === 'PENDING') {
        colStatus = count > 1 ? 'second' : 'first';
      } else if (r.status === 'PENDING_OTHER') {
        // As per user instructions, if status is PENDING_OTHER, it's second time
        colStatus = 'second';
      } else if (r.status === 'IN_REVIEW') {
        colStatus = 'responded';
      } else if (r.status === 'COMPLETED') {
        colStatus = 'done';
      } else if (r.status === 'CANCELLED') {
        colStatus = 'archive';
      }

      const pInfo = r.profiles?.personal_information;
      const name = pInfo?.full_name || 'Unknown Name';
      const cnic = pInfo?.cnic?.toString() || '00000-0000000-0';
      let staffName = r.requested_by?.full_name || 'System';

      boardItems.push({
        id: r.id, // Using request ID
        name,
        cnic,
        phone: 'N/A',
        staff: staffName,
        date: r.created_at,
        status: colStatus,
        later: false,
        isRead: r.is_read || false
      });
    });
  }

  // =======================================================================
  // 3. Bulletproof Memory Filtering based on User Inputs
  // =======================================================================
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

