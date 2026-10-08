'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Inbox, ArrowLeft, Check, X, Clock, CalendarDays, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { notificationService } from '@/lib/services/notification-service';
import CustomDatePicker from '@/components/ui/custom-date-picker';
import type { Notification } from '@/lib/types/database.types';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';

type UINotif = Notification & {
  date: string;
  time: string;
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDate = (isoString: string) => {
  const d = new Date(isoString);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, role } = useAuthStore();
  
  const [notifications, setNotifications] = useState<UINotif[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user?.id || !role) return;
    const currentPage = reset ? 1 : page;

    if (reset) {
      setIsLoadingList(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const data = await notificationService.getMyNotifications(user.id, role, {
        searchQuery: appliedSearchQuery,
        fromDate,
        toDate,
        status: activeTab,
        page: currentPage,
        limit: 25
      });
      
      const newNotifs = data.map(n => ({
        ...n,
        date: formatDate(n.created_at),
        time: formatTime(n.created_at),
      }));

      if (reset) {
        setNotifications(newNotifs);
      } else {
        setNotifications(prev => [...prev, ...newNotifs]);
      }
      
      setHasMore(data.length === 25);
      if (reset) setPage(1);

    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoadingList(false);
      setIsFetchingMore(false);
    }
  }, [user?.id, role, appliedSearchQuery, fromDate, toDate, activeTab, page]);

  useEffect(() => {
    fetchNotifications(true);
  }, [appliedSearchQuery, fromDate, toDate, activeTab, user?.id, role]);

  useEffect(() => {
    if (page > 1) {
      fetchNotifications(false);
    }
  }, [page]);

  useEffect(() => {
    // Real-time subscription
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          // Check if it's for us
          if (newNotif.user_id === user?.id || newNotif.target_role === role) {
            setNotifications(prev => [
              { ...newNotif, date: formatDate(newNotif.created_at), time: formatTime(newNotif.created_at) },
              ...prev
            ]);
            toast.success('New notification received');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updatedNotif = payload.new as Notification;
          setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? 
            { ...updatedNotif, date: formatDate(updatedNotif.created_at), time: formatTime(updatedNotif.created_at) } 
            : n
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, role]);

  const selectedNotification = notifications.find(n => n.id === selectedNotificationId);

  useEffect(() => {
    if (!selectedNotification) {
      setRequestDetails(null);
      return;
    }
    
    if ((role === 'MANAGER' || role === 'HIGH_LEVEL_ADMIN') && selectedNotification.type === 'REQUEST' && selectedNotification.entity_id) {
      setIsLoadingDetails(true);
      notificationService.getRequestDetails(selectedNotification.entity_id).then(data => {
        setRequestDetails(data);
        setIsLoadingDetails(false);
      });
    } else {
      setRequestDetails(null);
    }
  }, [selectedNotification?.id, role, selectedNotification?.entity_id, selectedNotification?.type]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // We no longer filter client-side, the backend handles it.
  const displayNotifications = notifications;

  // Group by date
  const groupedNotifications = displayNotifications.reduce((acc, notif) => {
    (acc[notif.date] ||= []).push(notif);
    return acc;
  }, {} as Record<string, UINotif[]>);

  const handleSelect = async (id: string) => {
    setSelectedNotificationId(id);
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.is_read) {
      try {
        await notificationService.markAsRead(id);
        // State updates automatically via real-time UPDATE event or we can do optimistic update
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      } catch {
        // ignore
      }
    }
  };

  const handleReviewRequest = () => {
    if (selectedNotification?.entity_type === 'information_request' && selectedNotification.entity_id) {
      router.push(`/dashboard/release-requests`);
    } else if (selectedNotification?.entity_type === 'match' && selectedNotification.entity_id) {
      router.push(`/dashboard/proposals`);
    } else {
      toast.info('No direct action available for this notification type.');
    }
  };

  const handleDismiss = async () => {
    if (selectedNotification) {
      try {
        await notificationService.markAsRead(selectedNotification.id);
        setNotifications(prev => prev.map(n => (n.id === selectedNotification.id ? { ...n, is_read: true } : n)));
        setSelectedNotificationId(null);
        toast.success('Notification dismissed');
      } catch (err) {
        toast.error('Failed to dismiss notification');
      }
    }
  };

  return (
    <>
      <Header title="Notifications" variant="dark" />
      <div 
        className="h-full overflow-hidden"
        style={{
          background: 'var(--bg-app)',
          borderRadius: 26,
        }}
      >
        <div className="block w-full h-full">
      {/* Restored left padding so it doesn't touch the global sidebar directly, allowing the page bg to show */}
      <div className="w-full max-w-[1500px] mx-auto min-h-full flex flex-col lg:flex-row justify-between gap-6 lg:gap-8 pt-2 pb-2 pl-4 pr-4 lg:pl-8 lg:pr-6">

        {/* ── Left floating dark panel ── */}
        {/* CHANGED: width 460 → 450, padding p-8 → p-6, min-w-0, hidden on mobile when a notification is open */}
        <div className={`${selectedNotificationId ? 'hidden lg:flex' : 'flex'} bg-[#2F3E51] rounded-[32px] lg:sticky lg:top-6 overflow-hidden p-6 shadow-2xl w-full lg:w-[450px] shrink-0 min-w-0 h-[calc(100vh-48px)] flex-col self-start`}>

          {/* GREEN BOX: Filters */}
          <div className="shrink-0 flex flex-col gap-5">
            {/* Search */}
            <div className="relative">
              <button 
                onClick={() => setAppliedSearchQuery(searchQuery)}
                className="absolute left-4 top-1/2 -translate-y-1/2 outline-none group"
              >
                <Search className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedSearchQuery(searchQuery);
                  }
                }}
                placeholder="Search notifications..."
                className="w-full bg-white/5 border border-white/10 text-white text-[13px] font-medium rounded-full pl-11 pr-4 py-2.5 outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
              />
            </div>

            {/* Dates */}
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-2">From</label>
                <div className="w-full text-black">
                  <CustomDatePicker
                    value={fromDate}
                    onChange={setFromDate}
                    placeholder="From Date"
                    className="w-full h-10 bg-white/5 border border-white/10 text-white/80 text-[13px] font-medium rounded-full pl-4 pr-10 outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
                    iconClassName="h-4 w-4 text-white/50 group-hover:text-white transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-2">To</label>
                <div className="w-full text-black">
                  <CustomDatePicker
                    value={toDate}
                    onChange={setToDate}
                    placeholder="To Date"
                    className="w-full h-10 bg-white/5 border border-white/10 text-white/80 text-[13px] font-medium rounded-full pl-4 pr-10 outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
                    iconClassName="h-4 w-4 text-white/50 group-hover:text-white transition-colors"
                    popoverAlignment="right"
                  />
                </div>
              </div>
            </div>

            {/* Status Radios & Clear Button */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-5 pl-2">
                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('all')}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${activeTab === 'all' ? 'border-white bg-white/20' : 'border-white/30 group-hover:border-white/50'}`}>
                    {activeTab === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-[14px] ${activeTab === 'all' ? 'text-white font-medium' : 'text-white/60'}`}>All</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('read')}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${activeTab === 'read' ? 'border-white bg-white/20' : 'border-white/30 group-hover:border-white/50'}`}>
                    {activeTab === 'read' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-[14px] ${activeTab === 'read' ? 'text-white font-medium' : 'text-white/60'}`}>Read</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('unread')}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${activeTab === 'unread' ? 'border-white bg-white/20' : 'border-white/30 group-hover:border-white/50'}`}>
                    {activeTab === 'unread' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-[14px] ${activeTab === 'unread' ? 'text-white font-medium' : 'text-white/60'}`}>Unread</span>
                </label>
              </div>

              {(appliedSearchQuery || fromDate || toDate || activeTab !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setAppliedSearchQuery('');
                    setFromDate('');
                    setToDate('');
                    setActiveTab('all');
                  }}
                  className="text-[10px] font-bold text-white/50 hover:text-[#FF5B5B] transition-colors uppercase tracking-wider pr-2 flex items-center gap-1 outline-none"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* BLUE BOX: Timeline Notification List */}
          {/* CHANGED: min-h-0 + overflow-x-hidden so nothing spills past the panel edge */}
          <div 
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden hide-scrollbar pt-2 pb-2 flex flex-col gap-2"
            onScroll={(e) => {
              const target = e.currentTarget;
              if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
                if (hasMore && !isFetchingMore) {
                  setPage(p => p + 1);
                }
              }
            }}
          >
            {isLoadingList ? (
              <div className="flex-1 flex flex-col items-center justify-center pt-10 text-white/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50 mb-4"></div>
                <span className="text-[13px] font-medium">Loading notifications...</span>
              </div>
            ) : Object.keys(groupedNotifications).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/40">
                <Inbox size={32} className="opacity-30 mb-4" />
                <p className="text-[14px] font-bold text-white/60 mb-1">No notifications</p>
                <p className="text-[12px]">You're all caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col relative pb-4">
                {Object.entries(groupedNotifications).map(([date, notifs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center mt-4">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="px-4 text-[10px] font-bold text-white/40 tracking-widest uppercase">{date}</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="flex flex-col">
                      {notifs.map((notif, i) => (
                        <div
                          key={notif.id}
                          onClick={() => handleSelect(notif.id)}
                          /* CHANGED: removed -mx-3 (it pushed the row and badges outside the panel), gap-4 → gap-3 */
                          className="relative flex gap-3 group cursor-pointer p-3 rounded-2xl"
                        >
                          <div className="relative flex flex-col items-center shrink-0 w-6">
                            {/* Continuous timeline line */}
                            {i < notifs.length - 1 && (
                              <div className="absolute top-5 -bottom-[28px] w-[1.5px] bg-white/10 z-0"></div>
                            )}
                            <div className={`relative w-3.5 h-3.5 rounded-full border-2 bg-[#2F3E51] z-10 mt-1 transition-colors ${!notif.is_read
                              ? 'border-[#C86A4A]'
                              : selectedNotificationId === notif.id ? 'border-white' : 'border-white/30'
                              }`} />
                          </div>

                          {/* CHANGED: min-w-0 so long text truncates instead of pushing the badge out */}
                          <div className="flex-1 min-w-0 flex items-start justify-between gap-2 transition-transform duration-300 group-hover:translate-x-1">
                            <div className="flex flex-col gap-1 min-w-0">
                              <h3 className={`text-[14px] truncate ${!notif.is_read || selectedNotificationId === notif.id ? 'font-bold text-white' : 'font-semibold text-white/70'}`}>
                                {notif.title}
                              </h3>
                              <p className={`text-[12px] line-clamp-2 leading-snug ${!notif.is_read || selectedNotificationId === notif.id ? 'text-white/80' : 'text-white/50'}`}>
                                {notif.message}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!notif.is_read ? 'bg-white/20 text-white' : 'bg-transparent border border-white/20 text-white/50'
                                }`}>
                                {notif.is_read ? 'Read' : 'Unread'}
                              </span>
                              <span className="text-[11px] font-medium text-white/40 mt-1">{notif.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Loading indicator for infinite scroll */}
            {isFetchingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/50"></div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Detail View ── */}
        <div className={`${selectedNotificationId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 lg:max-w-[1000px] mx-auto lg:mx-0 lg:mt-2 h-[calc(100vh-48px)]`}>
          <div className="flex-1 bg-transparent p-0 lg:p-6 flex flex-col overflow-hidden">

            {!selectedNotification ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#7D766C]">
                <div className="w-16 h-16 border border-[#EFE9DF] rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Bell className="w-8 h-8 text-[#1F3B34]" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1F3B34] mb-2">No Message Selected</h2>
                <p className="text-[14px] max-w-sm">Select any notification from the left panel to read its complete details and take actions.</p>
              </div>
            ) : isLoadingDetails ? (
              <div className="flex-1 rounded-[32px] border border-[#EFE9DF]/80 p-8 lg:p-12 flex flex-col items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F3B34] mb-4"></div>
                <span className="text-[13px] font-semibold text-[#7D766C]">Fetching request details...</span>
              </div>
            ) : (
              <div key={selectedNotification.id} className="flex-1 rounded-[32px] border border-[#EFE9DF]/80 p-8 lg:p-12 flex flex-col overflow-y-auto hide-scrollbar relative shadow-[0_2px_12px_rgba(0,0,0,0.02)]">

                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedNotificationId(null)}
                  className="self-start mb-8 text-[13px] font-bold text-[#1F3B34] bg-white hover:bg-[#FAF8F5] px-4 py-2 rounded-full transition-colors flex items-center gap-2 border border-[#EFE9DF] shadow-sm lg:hidden"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                {/* Top Right Badges */}
                <div className="absolute top-8 right-8 hidden lg:flex items-center gap-3 mt-4">
                  <span className="text-[12px] font-semibold text-[#7D766C] bg-white border border-[#EFE9DF] px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <CalendarDays size={14} strokeWidth={2.5} /> {selectedNotification.date}
                  </span>
                  <span className="text-[12px] font-semibold text-[#7D766C] bg-white border border-[#EFE9DF] px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <Clock size={14} strokeWidth={2.5} /> {selectedNotification.time}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-[26px] font-bold text-[#1F3B34] pr-0 lg:pr-72 tracking-tight">
                  {selectedNotification.title}
                </h2>
                <div className="w-12 h-[3px] bg-[#C86A4A] rounded-full mt-3 mb-8 shrink-0" />

                {/* Mobile Badges */}
                <div className="lg:hidden mb-6 flex gap-2">
                  <span className="text-[11px] font-bold text-[#7D766C] bg-white border border-[#EFE9DF] px-3 py-1 rounded-full">{selectedNotification.date}</span>
                  <span className="text-[11px] font-bold text-[#7D766C] bg-white border border-[#EFE9DF] px-3 py-1 rounded-full">{selectedNotification.time}</span>
                </div>

                {/* Message & Status Badge Row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <p className="text-[14px] text-[#7D766C] leading-relaxed max-w-2xl font-medium">
                    {selectedNotification.message}
                  </p>
                  <span className={`shrink-0 text-[10px] font-bold px-3 py-1 rounded-full ${!selectedNotification.is_read ? 'bg-[#2F3E51] text-white' : 'bg-transparent border border-[#EFE9DF] text-[#7D766C]'}`}>
                    {selectedNotification.is_read ? 'Read' : 'Unread'}
                  </span>
                </div>

                {(role === 'MANAGER' || role === 'HIGH_LEVEL_ADMIN') && selectedNotification.type === 'REQUEST' && (
                  <div className="flex flex-col gap-6">
                    {/* Request Details Header */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-[14px] font-bold text-[#1F3B34]">Requests detail</h3>
                      
                      <div className="flex justify-between items-center bg-[#FAF8F5] rounded-xl ">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Requested By</span>
                          <span className="text-[13px] font-semibold text-[#1F3B34]">
                            {requestDetails?.agent?.full_name || 'Unknown Agent'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Target Profile</span>
                          <span className="text-[13px] font-semibold text-[#1F3B34]">
                            {requestDetails?.target_profile?.full_name || 'Unknown Profile'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Target Profile Card */}
                    <div className=" border border-[#EFE9DF] rounded-2xl p-6 shadow-sm">
                      <h4 className="text-[10px] font-bold text-[#C86A4A] uppercase tracking-wider mb-4">TARGET PROFILE DETAIL</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Name</span>
                          <span className="text-[14px] font-semibold text-[#1F3B34]">
                            {requestDetails?.target_profile?.full_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Phone</span>
                          <span className="text-[14px] font-semibold text-[#1F3B34]">
                            {requestDetails?.target_profile?.phone_number || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">City</span>
                          <span className="text-[14px] font-semibold text-[#1F3B34]">
                            {requestDetails?.target_profile?.residence_city || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Agent Profile Card */}
                    <div className="border border-[#EFE9DF] rounded-2xl p-6 shadow-sm">
                      <h4 className="text-[10px] font-bold text-[#C86A4A] uppercase tracking-wider mb-4">AGENT DETAIL</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Name</span>
                          <span className="text-[14px] font-semibold text-[#1F3B34]">
                            {requestDetails?.agent?.full_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Phone</span>
                          <span className="text-[14px] font-semibold text-[#1F3B34]">
                            {requestDetails?.agent?.phone || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Branch</span>
                          <span className="text-[14px] font-semibold text-[#1F3B34]">Main Office</span>
                        </div>
                      </div>
                    </div>


                    {/* Actions */}
                    <div className="flex flex-wrap gap-4 shrink-0 mt-2">
                      <button onClick={handleReviewRequest} className="flex items-center gap-2 bg-[#1F3B34] text-white font-semibold text-[13px] px-7 py-3 rounded-full hover:bg-[#172E29] transition-colors shadow-sm">
                        <Check size={16} strokeWidth={2.5} /> Redirect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
        </div>
      </div>
    </>
  );
}