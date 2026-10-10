'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Inbox, ArrowLeft, Check, X, Clock, CalendarDays, Search, Download, FileText, Loader2 } from 'lucide-react';
import { generateReleasedProfilesPDF } from '@/lib/utils/pdfExport';
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
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!requestDetails) return;
    try {
      setIsDownloadingPDF(true);
      toast.info('Generating PDF download...');
      await generateReleasedProfilesPDF({
        sourceProfile: requestDetails.target_profile,
        agent: requestDetails.agent,
        releases: requestDetails.releases,
        requestId: selectedNotification?.entity_id || undefined
      });
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };
  
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
    
    if (selectedNotification.type === 'REQUEST' && selectedNotification.entity_id) {
      const title = selectedNotification.title?.toLowerCase() || '';
      const isReleaseNotification = title.includes('release') || title.includes('sent');

      setIsLoadingDetails(true);

      // Only load releases for release/sent notifications — not for "Request Submitted" or "New Match Analysis"
      const fetchFn = isReleaseNotification
        ? notificationService.getRequestWithReleases
        : notificationService.getRequestBasicDetails;

      fetchFn(selectedNotification.entity_id).then(data => {
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

                {selectedNotification.type === 'REQUEST' && requestDetails && (() => {
                  const title = selectedNotification.title?.toLowerCase() || '';
                  const isReleaseNotif = title.includes('release') || title.includes('sent');
                  const isManager = role === 'MANAGER' || role === 'HIGH_LEVEL_ADMIN';
                  const hasReleases = requestDetails.releases && requestDetails.releases.length > 0;

                  return (
                  <div className="flex flex-col gap-6">

                    {/* Manager/Admin: full details for all REQUEST notifications */}
                    {isManager && (
                      <>
                        {/* Request Details Header */}
                        <div className="flex flex-col gap-4">
                          <h3 className="text-[14px] font-bold text-[#1F3B34]">Request Details</h3>
                          <div className="flex justify-between items-center bg-[#FAF8F5] rounded-xl p-3 border border-[#EFE9DF]">
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
                        <div className="border border-[#EFE9DF] rounded-2xl p-6 shadow-sm bg-white">
                          <h4 className="text-[10px] font-bold text-[#C86A4A] uppercase tracking-wider mb-4">TARGET PROFILE DETAIL</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Name</span>
                              <span className="text-[14px] font-semibold text-[#1F3B34]">{requestDetails?.target_profile?.full_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Phone</span>
                              <span className="text-[14px] font-semibold text-[#1F3B34]">{requestDetails?.target_profile?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Location / City</span>
                              <span className="text-[14px] font-semibold text-[#1F3B34]">{requestDetails?.target_profile?.location || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Agent Card */}
                        <div className="border border-[#EFE9DF] rounded-2xl p-6 shadow-sm bg-white">
                          <h4 className="text-[10px] font-bold text-[#C86A4A] uppercase tracking-wider mb-4">AGENT DETAIL</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Name</span>
                              <span className="text-[14px] font-semibold text-[#1F3B34]">{requestDetails?.agent?.full_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Phone</span>
                              <span className="text-[14px] font-semibold text-[#1F3B34]">{requestDetails?.agent?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#A49C8F] uppercase tracking-wider">Status</span>
                              <span className="text-[14px] font-semibold text-[#1F3B34]">{requestDetails?.request?.status || 'PENDING'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Manager: Released Candidate Cards (only on release/sent notifications) */}
                        {isReleaseNotif && hasReleases && (
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-bold text-[#1F3B34] uppercase tracking-wider flex items-center gap-2">
                                <span>Approved Match Candidates</span>
                                <span className="bg-[#1F3B34] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {requestDetails.releases.length}
                                </span>
                              </h4>
                              <button
                                onClick={handleDownloadPDF}
                                disabled={isDownloadingPDF}
                                className="flex items-center gap-2 bg-[#064E3B] text-white text-[12px] font-semibold px-4 py-2 rounded-full hover:bg-[#043d2e] transition shadow-sm disabled:opacity-50"
                              >
                                {isDownloadingPDF ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" /> Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} /> Download PDF
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="flex flex-col gap-4">
                              {requestDetails.releases.map((rel: any, idx: number) => (
                                <div key={rel.id || idx} className="border border-[#EFE9DF] rounded-2xl p-5 bg-white shadow-sm">
                                  <div className="flex items-center justify-between pb-3 border-b border-[#F2EEE8] mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EFE9DF] flex items-center justify-center text-[11px] font-bold text-[#1F3B34]">{idx + 1}</span>
                                      <span className="text-[15px] font-bold text-[#1F3B34]">{rel.candidate?.full_name || 'Candidate Profile'}</span>
                                    </div>
                                    <span className="bg-[#EAF5ED] text-[#1F3B34] border border-[#C4E3CC] text-[11px] font-bold px-3 py-1 rounded-full">
                                      {rel.score !== undefined && rel.score !== null ? `${rel.score}% Match` : 'Released Match'}
                                    </span>
                                  </div>

                                  {rel.fields && rel.fields.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {rel.fields.map((f: any, fIdx: number) => {
                                        const path = f.field_path || '';
                                        const label = path ? path.split('.').pop().replace(/_/g, ' ') : 'Field';
                                        let val = 'N/A';
                                        if (f.field_value !== null && f.field_value !== undefined && f.field_value !== '') {
                                          if (typeof f.field_value === 'boolean') {
                                            val = f.field_value ? 'Yes' : 'No';
                                          } else if (typeof f.field_value === 'string') {
                                            if (/^\d{4}-\d{2}-\d{2}/.test(f.field_value)) {
                                              try { const d = new Date(f.field_value); val = !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB') : f.field_value; } catch { val = f.field_value; }
                                            } else { val = f.field_value; }
                                          } else if (Array.isArray(f.field_value)) {
                                            if (f.field_value.length === 0) { val = 'None'; }
                                            else if (path.includes('education_records')) { val = f.field_value.map((item: any) => [item.qualification, item.institution_name].filter(Boolean).join(' - ') || 'Education').join(', '); }
                                            else if (path.includes('employment_records')) { val = f.field_value.map((item: any) => [item.job_title, item.organization_name].filter(Boolean).join(' at ') || 'Employment').join(', '); }
                                            else { val = f.field_value.map((item: any) => typeof item === 'object' ? (item.name || item.title || 'Record') : String(item)).join(', '); }
                                          } else if (typeof f.field_value === 'object') {
                                            val = Object.entries(f.field_value).map(([k, v]) => `${k}: ${v}`).join(', ');
                                          } else { val = String(f.field_value); }
                                        }
                                        return (
                                          <div key={fIdx} className="flex flex-col bg-[#FAF8F5] rounded-xl p-2.5 border border-[#EFE9DF]/60">
                                            <span className="text-[9px] font-bold text-[#8D8C86] uppercase tracking-wider capitalize">{label}</span>
                                            <span className="text-[12px] font-semibold text-[#1F3B34] truncate mt-0.5" title={val}>{val}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[12px] text-[#8D8C86] italic">No individual fields recorded.</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Agent: Only see PDF download on release notifications, no detail cards */}
                    {role === 'AGENT' && isReleaseNotif && hasReleases && (
                      <div className="border border-[#EFE9DF] rounded-2xl p-6 shadow-sm bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <h4 className="text-[14px] font-bold text-[#1F3B34]">
                              {requestDetails.releases.length} Matched Profile{requestDetails.releases.length > 1 ? 's' : ''} Released
                            </h4>
                            <p className="text-[12px] text-[#8D8C86]">
                              Manager has released matching profiles for {requestDetails?.target_profile?.full_name || 'your request'}. Download the PDF to view details.
                            </p>
                          </div>
                          <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloadingPDF}
                            className="flex items-center gap-2 bg-[#064E3B] text-white text-[13px] font-semibold px-5 py-3 rounded-full hover:bg-[#043d2e] transition shadow-sm shrink-0 disabled:opacity-50"
                          >
                            {isDownloadingPDF ? (
                              <>
                                <Loader2 size={16} className="animate-spin" /> Downloading...
                              </>
                            ) : (
                              <>
                                <Download size={16} strokeWidth={2.5} /> Download PDF
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-4 shrink-0 mt-2">
                      <button onClick={handleReviewRequest} className="flex items-center gap-2 bg-[#1F3B34] text-white font-semibold text-[13px] px-7 py-3 rounded-full hover:bg-[#172E29] transition-colors shadow-sm">
                        <Check size={16} strokeWidth={2.5} /> Redirect
                      </button>
                    </div>
                  </div>
                  );
                })()}
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