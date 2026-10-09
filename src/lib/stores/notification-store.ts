import { create } from 'zustand';
import { notificationService } from '@/lib/services/notification-service';
import type { Notification } from '@/lib/types/database.types';
import { createBrowserClient } from '@supabase/ssr';

interface NotificationState {
  notifications: Notification[];
  isInitialized: boolean;
  isLoading: boolean;
  
  // Actions
  initialize: (userId: string, role: string) => Promise<void>;
  markAsReadOptimistic: (id: string) => void;
}

let realtimeChannel: any = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isInitialized: false,
  isLoading: false,

  initialize: async (userId: string, role: string) => {
    // Prevent multiple fetches
    if (get().isInitialized || get().isLoading) return;
    
    set({ isLoading: true });

    try {
      // 1. Initial Fetch
      const data = await notificationService.getMyNotifications(userId, role, { 
        status: 'unread', 
        limit: 15 
      });
      
      set({ notifications: data || [], isInitialized: true, isLoading: false });

      // 2. Setup Realtime Subscription
      if (!realtimeChannel) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        realtimeChannel = supabase
          .channel('global-notifications-realtime')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            (payload) => {
              const newNotif = payload.new as Notification;
              if (newNotif.user_id === userId || newNotif.target_role === role) {
                set(state => ({
                  notifications: [newNotif, ...state.notifications].slice(0, 15)
                }));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'notifications' },
            (payload) => {
              const updatedNotif = payload.new as Notification;
              if (updatedNotif.user_id === userId || updatedNotif.target_role === role) {
                if (updatedNotif.is_read) {
                  // Remove if marked read
                  set(state => ({
                    notifications: state.notifications.filter(n => n.id !== updatedNotif.id)
                  }));
                } else {
                  // Update or insert if marked unread
                  set(state => {
                    const exists = state.notifications.find(n => n.id === updatedNotif.id);
                    if (exists) {
                      return {
                        notifications: state.notifications.map(n => n.id === updatedNotif.id ? updatedNotif : n)
                      };
                    } else {
                      return {
                        notifications: [updatedNotif, ...state.notifications].slice(0, 15)
                      };
                    }
                  });
                }
              }
            }
          )
          .subscribe();
      }

    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      set({ isLoading: false });
    }
  },

  markAsReadOptimistic: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }
}));
