// Raw database queries for agent requests

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RequestItem, FilterState } from '@/components/requests/types';

export async function fetchAgentRequests(filters: FilterState): Promise<RequestItem[]> {
  const supabase = await createClient();
  const boardItems: RequestItem[] = [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const agentId = user.id;

  // We need the agent's name
  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', agentId)
    .single();
  const agentName = userData?.full_name || 'Agent';

  // =======================================================================
  // 1. Fetch LOGGED ENTRIES (Profiles created by this agent)
  // =======================================================================
  let profilesQuery = supabase
    .from('profiles')
    .select(`
      id,
      created_at,
      status,
      personal_information ( full_name, cnic )
    `)
    .eq('created_by', agentId)
    .order('created_at', { ascending: false });

  const { data: profilesData, error: profilesError } = await profilesQuery;

  if (profilesError) {
    console.error('Supabase profiles query error:', profilesError);
  }

  if (!profilesError && profilesData) {
    profilesData.forEach((p: any) => {
      const name = p.personal_information?.full_name || 'Unknown Name';
      const cnic = p.personal_information?.cnic?.toString() || '00000-0000000-0';

      boardItems.push({
        id: p.id, // Using profile ID
        name,
        cnic,
        phone: 'N/A',
        staff: agentName,
        date: p.created_at,
        status: 'logged', // Matches AGENT_COLUMNS[0].key
        later: false
      });
    });
  }

  // =======================================================================
  // 2. Fetch Requests (Requested, Responded, Completed)
  // =======================================================================
  // Agent requests:
  // - Requested: status = 'PENDING'
  // - Responded: status = 'APPROVED' or 'RELEASED'
  // - Completed: ? Maybe a separate completed status or if a match is finalised? Let's use 'REJECTED' or a custom logic. Let's map 'RELEASED' to completed if it's fully done, or use the request status. For now, 'COMPLETED' is not a standard status. Let's map 'APPROVED' to responded, and 'RELEASED' to completed. Or maybe we just use standard 'PENDING' -> requested, 'APPROVED' -> responded, 'REJECTED' -> done (or a specific completed state). Wait, the user said "jo usne apni taraf se complete ki hoongi". Let's assume there is a 'CLOSED' or 'COMPLETED' status, or we map 'RELEASED' to done, and 'APPROVED' to responded. Let's map 'PENDING' -> 'requested', 'APPROVED' -> 'responded', 'REJECTED' or 'CLOSED' -> 'done'.
  // We'll just map the existing statuses.

  const { data: reqData, error: reqError } = await supabase
    .from('information_requests')
    .select(`
      id,
      status,
      created_at,
      is_read,
      source_profile_id,
      profiles (
        id,
        personal_information ( full_name, cnic )
      )
    `)
    .eq('requested_by', agentId)
    .order('created_at', { ascending: false });

  if (reqError) {
    console.error('Supabase requests query error:', reqError);
  }

  if (!reqError && reqData) {
    reqData.forEach((r: any) => {
      let colStatus = 'requested'; // default
      if (r.status === 'PENDING') {
        colStatus = 'requested';
      } else if (r.status === 'APPROVED') {
        colStatus = 'responded';
      } else if (r.status === 'RELEASED' || r.status === 'CLOSED' || r.status === 'REJECTED') {
        colStatus = 'done';
      }

      const p = r.profiles || {};
      const pi = p.personal_information || {};

      boardItems.push({
        id: r.id,
        name: pi.full_name || 'Unknown',
        cnic: pi.cnic?.toString() || '00000-0000000-0',
        phone: 'N/A',
        staff: agentName,
        date: r.created_at,
        status: colStatus,
        later: false,
        // For agent, we temporarily ignore the manager's is_read so the colors show up correctly.
        // Once agent_is_read is added to the DB, we can map it here.
        isRead: false 
      });
    });
  }

  // â”€â”€ Apply Search & Filters locally (same as manager) â”€â”€
  return boardItems.filter((item) => {
    // 1. Search term (Name, ID, CNIC)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.cnic.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // 2. Date from
    if (filters.dateFrom) {
      if (new Date(item.date) < new Date(filters.dateFrom)) return false;
    }

    // 3. Date to
    if (filters.dateTo) {
      // Add 1 day to include the whole "To" day
      const toDate = new Date(filters.dateTo);
      toDate.setDate(toDate.getDate() + 1);
      if (new Date(item.date) >= toDate) return false;
    }

    // 4. Staff (for agent it's always themselves, but we'll apply it just in case)
    if (filters.staff && item.staff !== filters.staff) {
      return false;
    }

    return true;
  });
}

// Fetch staff names for filter dropdown (Only the agent themselves)
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
