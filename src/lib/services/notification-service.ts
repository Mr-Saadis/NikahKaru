import { createBrowserClient } from '@supabase/ssr';
import type { Notification } from '@/lib/types/database.types';

export interface NotificationFilters {
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
  status?: 'all' | 'unread' | 'read';
  page?: number;
  limit?: number;
}

export const notificationService = {
  /**
   * Fetch all notifications for the current user and their role
   */
  getMyNotifications: async (userId: string, role: string, filters?: NotificationFilters): Promise<Notification[]> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},target_role.eq.${role}`);

    if (filters?.status === 'unread') {
      query = query.eq('is_read', false);
    } else if (filters?.status === 'read') {
      query = query.eq('is_read', true);
    }

    if (filters?.fromDate) {
      query = query.gte('created_at', new Date(filters.fromDate).toISOString());
    }

    if (filters?.toDate) {
      const to = new Date(filters.toDate + 'T23:59:59').toISOString();
      query = query.lte('created_at', to);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,message.ilike.%${filters.searchQuery}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.page !== undefined && filters?.limit !== undefined) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data as Notification[];
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all user/role notifications as read
   */
  markAllAsRead: async (userId: string, role: string): Promise<void> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .or(`user_id.eq.${userId},target_role.eq.${role}`)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Fetch BASIC request details only (agent + target profile, NO releases).
   * Used for "Request Submitted", "New Match Analysis Request" etc.
   */
  getRequestBasicDetails: async (requestId: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: request, error: reqErr } = await supabase
      .from('information_requests')
      .select('id, requested_by, source_profile_id, status, created_at')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      console.error('Error fetching request:', reqErr);
      return null;
    }

    const [agentRes, profileRes, locationRes] = await Promise.all([
      supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', request.requested_by)
        .single(),
      supabase
        .from('personal_information')
        .select('full_name, phone, date_of_birth, marital_status')
        .eq('profile_id', request.source_profile_id)
        .single(),
      supabase
        .from('profile_locations')
        .select('current_location_text')
        .eq('profile_id', request.source_profile_id)
        .maybeSingle()
    ]);

    return {
      request,
      agent: agentRes.data,
      target_profile: {
        ...profileRes.data,
        location: locationRes.data?.current_location_text || 'N/A'
      },
      releases: [] as any[]  // empty — no releases loaded
    };
  },

  /**
   * Fetch FULL request details WITH releases + candidate info + fields.
   * Used for "Matches Released" and "Matches Sent" notifications.
   */
  getRequestWithReleases: async (requestId: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: request, error: reqErr } = await supabase
      .from('information_requests')
      .select('id, requested_by, source_profile_id, status, created_at')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      console.error('Error fetching request:', reqErr);
      return null;
    }

    const [agentRes, profileRes, locationRes, releasesRes] = await Promise.all([
      supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', request.requested_by)
        .single(),
      supabase
        .from('personal_information')
        .select('full_name, phone, date_of_birth, marital_status')
        .eq('profile_id', request.source_profile_id)
        .single(),
      supabase
        .from('profile_locations')
        .select('current_location_text')
        .eq('profile_id', request.source_profile_id)
        .maybeSingle(),
      supabase
        .from('information_releases')
        .select(`
          id,
          candidate_profile_id,
          release_status,
          released_at,
          information_release_fields (
            id,
            field_path,
            field_value
          ),
          match_run_results (
            final_score,
            rank
          )
        `)
        .eq('request_id', requestId)
    ]);

    const releases = releasesRes.data || [];
    const candidateIds = releases.map((r: any) => r.candidate_profile_id);
    let candidatesData: Record<string, any> = {};

    if (candidateIds.length > 0) {
      const [candsRes, profsRes] = await Promise.all([
        supabase
          .from('personal_information')
          .select('profile_id, full_name, phone, date_of_birth, marital_status')
          .in('profile_id', candidateIds),
        supabase
          .from('profiles')
          .select('id, gender')
          .in('id', candidateIds)
      ]);

      const genderMap: Record<string, string> = {};
      profsRes.data?.forEach((p: any) => {
        genderMap[p.id] = p.gender;
      });

      candsRes.data?.forEach((c: any) => {
        candidatesData[c.profile_id] = {
          ...c,
          gender: genderMap[c.profile_id] || null
        };
      });
    }

    const enhancedReleases = releases.map((rel: any) => ({
      ...rel,
      candidate: candidatesData[rel.candidate_profile_id] || { full_name: 'Candidate' },
      score: Array.isArray(rel.match_run_results)
        ? rel.match_run_results[0]?.final_score
        : rel.match_run_results?.final_score,
      rank: Array.isArray(rel.match_run_results)
        ? rel.match_run_results[0]?.rank
        : rel.match_run_results?.rank,
      fields: rel.information_release_fields || []
    }));

    return {
      request,
      agent: agentRes.data,
      target_profile: {
        ...profileRes.data,
        location: locationRes.data?.current_location_text || 'N/A'
      },
      releases: enhancedReleases
    };
  }
};
