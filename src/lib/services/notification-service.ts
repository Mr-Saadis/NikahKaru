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
   * Fetch extra details for an information request notification
   */
  getRequestDetails: async (requestId: string) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Fetch the request
    const { data: request, error: reqErr } = await supabase
      .from('information_requests')
      .select('requested_by, source_profile_id')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) {
      console.error('Error fetching request:', reqErr);
      return null;
    }

    // 2. Fetch Agent & Profile concurrently
    const [agentRes, profileRes] = await Promise.all([
      supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', request.requested_by)
        .single(),
      supabase
        .from('personal_information')
        .select('full_name, phone_number, residence_city')
        .eq('profile_id', request.source_profile_id)
        .single()
    ]);

    return {
      agent: agentRes.data,
      target_profile: profileRes.data
    };
  }
};
