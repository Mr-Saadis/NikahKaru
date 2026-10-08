'use client';

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, X, FileText, Download, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { notificationService } from "@/lib/services/notification-service";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createBrowserClient } from "@supabase/ssr";
import type { Notification } from "@/lib/types/database.types";

const formatTimeOnly = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const formatDateOnly = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const isToday = (d: Date) => {
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

const isYesterday = (d: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
};

export default function NotificationDropdown({ btnClass }: { btnClass: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { user, role } = useAuthStore();

  const fetchUnreadNotifications = async () => {
    if (!user?.id || !role) return;
    try {
      const data = await notificationService.getMyNotifications(user.id, role, { 
        status: 'unread', 
        limit: 15 
      });
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
  }, [user?.id, role]);

  useEffect(() => {
    if (!user?.id && !role) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('dropdown-notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.user_id === user?.id || newNotif.target_role === role) {
            setNotifications(prev => [newNotif, ...(prev || [])].slice(0, 15));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updatedNotif = payload.new as Notification;
          if (updatedNotif.user_id === user?.id || updatedNotif.target_role === role) {
             if (updatedNotif.is_read) {
               // Remove from unread dropdown list
               setNotifications(prev => (prev || []).filter(n => n.id !== updatedNotif.id));
             } else {
               // Update existing or add to list if marked unread (rare)
               setNotifications(prev => {
                 const current = prev || [];
                 const exists = current.find(n => n.id === updatedNotif.id);
                 if (exists) {
                   return current.map(n => n.id === updatedNotif.id ? updatedNotif : n);
                 }
                 return [updatedNotif, ...current].slice(0, 15);
               });
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = async (notif: Notification) => {
    setIsOpen(false);
    // Optimistically remove from dropdown
    setNotifications((prev) => (prev || []).filter((n) => n.id !== notif.id));
    
    try {
      await notificationService.markAsRead(notif.id);
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
    
    router.push(`/notifications`);
  };

  const groupedUnread = (notifications || []).reduce((groups: Record<string, Notification[]>, notif) => {
    const date = notif.created_at ? formatDateOnly(notif.created_at) : 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(notif);
    return groups;
  }, {});

  const hasUnread = notifications.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={btnClass}
      >
        <Bell className="w-4 h-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full left-2 right-2 sm:left-auto sm:right-0 mt-0 sm:mt-2 w-auto sm:w-96 max-w-[95vw] bg-white border border-[var(--border-main)] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-card-neutral)] flex justify-between items-center">
            <p className="text-xs text-[var(--brand-primary)] uppercase tracking-wider font-semibold">
              Notifications
            </p>
            <span className="text-[10px] text-[var(--text-muted)] font-medium bg-[var(--bg-sidebar)] px-2 py-0.5 rounded-full">
              {notifications.length} New
            </span>
          </div>

          <div className="max-h-[70vh] sm:max-h-[320px] overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--border-main)] hover:[&::-webkit-scrollbar-thumb]:bg-[var(--border-soft)] [&::-webkit-scrollbar-thumb]:rounded-full">
            {notifications.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <Bell size={24} className="text-[var(--border-soft)] mb-2" />
                <p className="text-xs text-[var(--text-muted)] font-medium">No new notifications</p>
              </div>
            ) : (
              Object.entries(groupedUnread).map(([date, notifs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--bg-card-neutral)] sticky top-0 z-10">
                    <div className="flex-1 h-[1px] bg-[var(--border-soft)]"></div>
                    <span className="text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-widest shrink-0">
                      {date}
                    </span>
                    <div className="flex-1 h-[1px] bg-[var(--border-soft)]"></div>
                  </div>

                  {notifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className="px-3 sm:px-4 py-3 border-b border-[var(--border-soft)] transition-colors flex items-start gap-2 sm:gap-3 cursor-pointer hover:bg-[var(--bg-sidebar)]"
                    >
                      <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                        notif.type === 'REQUEST' ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]' :
                        notif.type === 'SYSTEM' ? 'bg-[var(--accent-gold-bg)] text-[var(--accent-gold)]' :
                        'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                      }`}>
                        <FileText size={14} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <h4 className="text-[13px] font-semibold text-[var(--text-page-title)] truncate pr-2">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-[var(--text-body)] line-clamp-2 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-[var(--text-subtle)] mt-1.5 font-medium">
                          {formatTimeOnly(notif.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-[var(--border-soft)] bg-[var(--bg-card-neutral)]">
            <button
              onClick={() => { setIsOpen(false); router.push('/notifications'); }}
              className="w-full text-center text-xs text-[var(--accent-gold)] font-semibold hover:text-[var(--accent-gold-dark)] transition-colors py-1"
            >
              View All History
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
