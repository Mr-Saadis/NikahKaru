'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  ExternalLink,
  Download,
  Eye,
  AlertCircle,
  Users,
  UserCheck,
  FileEdit,
  Send,
  Share2,
  Inbox,
  Mail,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DashboardService, type AgentOverviewData } from '@/lib/services/dashboard-service';
import {
  formatRelativeTime,
  formatKarachiDate,
  formatKarachiTime,
} from '@/lib/utils/overview-helpers';
import {
  OverviewCard,
  KpiCard,
  PageHeader,
  AvatarInitials,
  OverviewSkeleton,
  ErrorBlock,
  EmptyBlock,
  RadialProgressRing,
  StepChipsRow,
  TodayActivityChart,
  FIXED_STEP_SECTIONS,
} from './overview-ui';
import { toast } from 'sonner';
import { generateReleasedProfilesPDF } from '@/lib/utils/pdfExport';
import { notificationService } from '@/lib/services/notification-service';

function getNextStepNumber(nextStepName?: string | null): number {
  if (!nextStepName) return 1;
  const s = nextStepName.toLowerCase();
  if (s.includes('personal') || s.includes('basic')) return 1;
  if (s.includes('physical')) return 2;
  if (s.includes('education') || s.includes('profession')) return 3;
  if (s.includes('religion') || s.includes('culture')) return 4;
  if (s.includes('location') || s.includes('residency')) return 5;
  if (s.includes('family')) return 6;
  if (s.includes('lifestyle')) return 7;
  if (s.includes('preference')) return 8;
  return 1;
}

function getRequestStatusColor(status?: string | null): string {
  const s = (status || '').toUpperCase().trim();
  switch (s) {
    case 'COMPLETED':
      return 'text-[#166534]'; // Emerald green
    case 'COMPLETED_OUTSIDE_SYSTEM':
      return 'text-[#4F46E5]'; // Violet / Indigo
    case 'DOWNLOADED':
      return 'text-[#C86A4A]'; // Terracotta / Rust
    case 'IN_REVIEW':
      return 'text-[#D97706]'; // Amber / Ochre
    case 'REQUESTED':
    case 'SUBMITTED':
      return 'text-[#2563EB]'; // Blue
    case 'RESPONDED':
    case 'READY':
    case 'RELEASE_READY':
      return 'text-[#0D9488]'; // Teal
    case 'REJECTED':
      return 'text-[#DC2626]'; // Crimson Red
    default:
      return 'text-[#7D766C]'; // Neutral Slate
  }
}

export default function StaffOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentOverviewData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [visibleAttentionCount, setVisibleAttentionCount] = useState<number>(5);
  const [downloadingRequestId, setDownloadingRequestId] = useState<string | null>(null);
  const [extraCandidatesMap, setExtraCandidatesMap] = useState<Record<string, any[]>>({});
  const [extraClientMap, setExtraClientMap] = useState<Record<string, { profile_id: string; full_name: string }>>({});
  const [activityPeriod, setActivityPeriod] = useState<'today' | 'yesterday' | 'all'>('today');
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(false);
  const activityCacheRef = React.useRef<Record<string, any>>({});
  const attentionContainerRef = React.useRef<HTMLDivElement>(null);

  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await DashboardService.getDashboardData('AGENT');
      if (!res) return;
      setData(res as AgentOverviewData);
      setLastUpdated(formatKarachiTime(new Date()));
      setError(null);
      setLoading(false);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'AbortError') return;
      console.error('[StaffOverview] load error:', err);
      setError(e?.message || 'Failed to load agent desk data');
      toast.error('Failed to load agent desk');
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    DashboardService.getDashboardData('AGENT')
      .then((res) => {
        if (isCancelled || !res) return;
        setData(res as AgentOverviewData);
        setLastUpdated(formatKarachiTime(new Date()));
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        const e = err as { name?: string; message?: string };
        if (e?.name === 'AbortError') return;
        console.error('[StaffOverview] load error:', err);
        setError(e?.message || 'Failed to load agent desk data');
        toast.error('Failed to load agent desk');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Sync today's activity into currentActivity on initial dashboard fetch
  useEffect(() => {
    if (data?.today_activity) {
      setCurrentActivity(data.today_activity);
      activityCacheRef.current['today'] = data.today_activity;
    }
  }, [data?.today_activity]);

  const handlePeriodChange = async (newPeriod: 'today' | 'yesterday' | 'all') => {
    setActivityPeriod(newPeriod);
    if (activityCacheRef.current[newPeriod]) {
      setCurrentActivity(activityCacheRef.current[newPeriod]);
      return;
    }

    setIsActivityLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard?role=AGENT&activity_only=true&activity_period=${newPeriod}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.activity) {
          activityCacheRef.current[newPeriod] = json.activity;
          setCurrentActivity(json.activity);
        }
      }
    } catch (err) {
      console.error('[StaffOverview] error loading activity for period:', newPeriod, err);
      toast.error(`Failed to load ${newPeriod} activity`);
    } finally {
      setIsActivityLoading(false);
    }
  };

  const attention = data?.attention || [];
  const readyForDeliveryRaw = data?.ready_for_delivery || [];
  const requests = data?.requests || [];

  // Group released candidates by request_id
  const candidatesByRequestId = React.useMemo(() => {
    const map = new Map<string, typeof readyForDeliveryRaw>();
    for (const rel of readyForDeliveryRaw) {
      const list = map.get(rel.request_id) || [];
      list.push(rel);
      map.set(rel.request_id, list);
    }
    return map;
  }, [readyForDeliveryRaw]);

  // Dynamically fetch releases for requests in attention that are missing candidate payload
  useEffect(() => {
    if (!attention || attention.length === 0) return;
    const missingReleaseRequestIds = attention
      .filter(
        (a) =>
          a.kind === 'release_ready' &&
          (!candidatesByRequestId.has(a.entity_id) ||
            (candidatesByRequestId.get(a.entity_id)?.length || 0) === 0)
      )
      .map((a) => a.entity_id);

    if (missingReleaseRequestIds.length === 0) return;

    let cancelled = false;
    missingReleaseRequestIds.forEach(async (reqId) => {
      if (extraCandidatesMap[reqId]) return;
      try {
        const details = await notificationService.getRequestWithReleases(reqId);
        if (cancelled || !details?.releases || details.releases.length === 0) return;

        const mapped = details.releases.map((rel: any) => {
          const dob = rel.candidate?.date_of_birth;
          let age: number | null = null;
          if (dob) {
            const birthDate = new Date(dob);
            if (!isNaN(birthDate.getTime())) {
              const diffMs = Date.now() - birthDate.getTime();
              age = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
            }
          }
          const fvMap: Record<string, string> = {};
          (rel.fields || []).forEach((f: any) => {
            const key = f.field_path.split('.').pop();
            if (key) fvMap[key] = f.field_value;
          });

          return {
            release_id: rel.id,
            request_id: reqId,
            candidate_profile_id: rel.candidate_profile_id,
            released_at: rel.released_at,
            request_status: details.request?.status || 'IN_REVIEW',
            full_name: rel.candidate?.full_name || fvMap['full_name'] || 'Candidate',
            age,
            city: fvMap['city'] || fvMap['current_city'] || null,
            caste: fvMap['caste'] || null,
            education: fvMap['education'] || fvMap['qualification'] || null,
            score: rel.score ?? null,
            released_by_name: 'Manager',
          };
        });

        if (details.request?.source_profile_id || details.target_profile) {
          setExtraClientMap((prev) => ({
            ...prev,
            [reqId]: {
              profile_id: details.request?.source_profile_id || (details.target_profile as any)?.id || '',
              full_name: details.target_profile?.full_name || 'Client',
            },
          }));
        }

        if (!cancelled && mapped.length > 0) {
          setExtraCandidatesMap((prev) => ({ ...prev, [reqId]: mapped }));
        }
      } catch (e) {
        console.error('Error fetching extra releases for request', reqId, e);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [attention, candidatesByRequestId, extraCandidatesMap]);

  // Unified list of Needs Attention items (Client profiles remain main items)
  const mergedAttentionList = React.useMemo(() => {
    const list = [...attention];
    const coveredRequestIds = new Set(
      attention.filter((a) => a.kind === 'release_ready').map((a) => a.entity_id)
    );

    // If any release exists whose request_id was not in attention, add it
    for (const rel of readyForDeliveryRaw) {
      if (!coveredRequestIds.has(rel.request_id)) {
        coveredRequestIds.add(rel.request_id);
        const req = requests.find((r) => r.id === rel.request_id);
        const clientInfo = extraClientMap[rel.request_id];
        list.push({
          kind: 'release_ready',
          entity_id: rel.request_id,
          profile_id: req?.profile_id || clientInfo?.profile_id || '',
          profile_name: req?.profile_name || clientInfo?.full_name || 'Client Profile',
          since: rel.released_at,
        });
      }
    }
    return list;
  }, [attention, readyForDeliveryRaw, requests, extraClientMap]);

  // Sorted by since descending (newest at the very top)
  const sortedAttention = React.useMemo(() => {
    return [...mergedAttentionList].sort((a, b) => {
      const timeA = a.since ? new Date(a.since).getTime() : 0;
      const timeB = b.since ? new Date(b.since).getTime() : 0;
      return timeB - timeA;
    });
  }, [mergedAttentionList]);

  const displayedAttention = sortedAttention.slice(0, visibleAttentionCount);
  const isAttentionScrollable = visibleAttentionCount > 5;
  const remainingAttentionCount = sortedAttention.length - visibleAttentionCount;

  const handleSeeMoreAttention = () => {
    setVisibleAttentionCount((prev) => prev + 5);
  };

  const handleShowLessAttention = () => {
    setVisibleAttentionCount(5);
    if (attentionContainerRef.current) {
      attentionContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDownloadDossier = async (
    e: React.MouseEvent,
    requestId: string,
    clientName: string
  ) => {
    e.stopPropagation();
    if (downloadingRequestId) return;
    setDownloadingRequestId(requestId);
    try {
      toast.info('Generating official released matches dossier...');
      const releaseDetails = await notificationService.getRequestWithReleases(requestId);
      if (!releaseDetails || !releaseDetails.releases || releaseDetails.releases.length === 0) {
        toast.error('No released candidate profiles found for this request.');
        router.push(`/agent-requests?requestId=${requestId}`);
        return;
      }
      await generateReleasedProfilesPDF({
        sourceProfile: releaseDetails.target_profile || { full_name: clientName },
        agent: releaseDetails.agent || { full_name: 'Agent' },
        releases: releaseDetails.releases,
        requestId,
      });
      toast.success('Dossier downloaded successfully');
    } catch (err: any) {
      console.error('Error downloading dossier:', err);
      toast.error('Opening request dossier on board...');
      router.push(`/agent-requests?requestId=${requestId}`);
    } finally {
      setDownloadingRequestId(null);
    }
  };

  const handleOpenCandidateProfile = (candidateId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selected_profile_id', candidateId);
    }
    router.push(`/profiles?id=${candidateId}`);
  };

  const navigateToRequestsColumn = (columnKey: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('target_request_column', columnKey);
    }
    router.push(`/agent-requests?column=${columnKey}`);
  };

  // --------------------------------------------------------------------------
  // SKELETON STATE
  // --------------------------------------------------------------------------
  if (loading && !data) {
    return <OverviewSkeleton />;
  }

  // --------------------------------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="w-full min-w-0">
        <ErrorBlock
          message={error || 'Unable to load agent desk overview'}
          onRetry={() => void fetchData(true)}
        />
      </div>
    );
  }

  const kpis = data.kpis;
  const drafts = data.drafts || [];

  return (
    <div className="w-full min-w-0 space-y-5 font-sans">
      {/* ════════════════════════════════════════════════════════════════
          1. PAGE HEADER (with greeting line & attention count)
      ════════════════════════════════════════════════════════════════ */}
      <PageHeader
        title="Agent Desk"
        subtitle="Client assignments, matching pipeline & profile operations"
        icon={Users}
        lastUpdated={lastUpdated}
        onRefresh={() => void fetchData(true)}
        actionButton={
          <Link
            href="/add-profile"
            className="rounded-full bg-[#1F3B34] hover:bg-[#172E29] text-white px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all duration-120 active:scale-98"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Profile</span>
          </Link>
        }
      />

      {/* ════════════════════════════════════════════════════════════════
          2. ROW OF 6 KPI CARDS (Most Actionable First)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Awaiting Download -> Responded / Released */}
        <KpiCard
          icon={Download}
          label="AWAITING DOWNLOAD"
          numericValue={kpis.awaiting_download ?? 0}
          value={kpis.awaiting_download ?? 0}
          caption="Ready for family delivery"
          isAlert={(kpis.awaiting_download ?? 0) > 0}
          alertColor="amber"
          onClick={() => navigateToRequestsColumn('responded')}
        />
        {/* 2. Open Requests -> Requested Profiles */}
        <KpiCard
          icon={Inbox}
          label="OPEN REQUESTS"
          numericValue={kpis.open_requests ?? 0}
          value={kpis.open_requests ?? 0}
          caption="Submitted to manager"
          onClick={() => navigateToRequestsColumn('requested')}
        />
        {/* 3. Drafts Pending -> Entries Logged */}
        <KpiCard
          icon={FileEdit}
          label="DRAFTS PENDING"
          numericValue={kpis.drafts_pending ?? 0}
          value={kpis.drafts_pending ?? 0}
          caption="Incomplete registrations"
          onClick={() => navigateToRequestsColumn('logged')}
        />
        {/* 4. Assigned Profiles -> Entries Logged */}
        <KpiCard
          icon={UserCheck}
          label="ASSIGNED PROFILES"
          numericValue={kpis.assigned_profiles ?? 0}
          value={kpis.assigned_profiles ?? 0}
          caption="Active client roster"
          onClick={() => navigateToRequestsColumn('logged')}
        />
        {/* 5. Released for Client -> Responded / Released */}
        <KpiCard
          icon={Send}
          label="RELEASED FOR CLIENT"
          numericValue={kpis.released_for_client ?? 0}
          value={kpis.released_for_client ?? 0}
          caption="Approved by manager"
          onClick={() => navigateToRequestsColumn('responded')}
        />
        {/* 6. Shared with Family -> Downloaded */}
        <KpiCard
          icon={Share2}
          label="SHARED WITH FAMILY"
          numericValue={kpis.shared_with_family ?? 0}
          value={kpis.shared_with_family ?? 0}
          caption="Dossiers delivered"
          onClick={() => navigateToRequestsColumn('downloaded')}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. ACTIVITY DESK — CONCENTRIC 270° RADIAL ARC CHART (Today / Yesterday / All)
      ════════════════════════════════════════════════════════════════ */}
      <TodayActivityChart
        data={currentActivity || data.today_activity}
        isLoading={isActivityLoading}
        period={activityPeriod}
        onPeriodChange={handlePeriodChange}
        error={data.today_activity_error}
        onRetry={() => void handlePeriodChange(activityPeriod)}
      />

      {/* ════════════════════════════════════════════════════════════════
          4. 12-COLUMN MAIN CONTENT (LEFT 8, RIGHT 4)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── LEFT 8 COLUMNS: ACTIONABLE WORKLIST ─── */}
        <div className="lg:col-span-8 min-w-0 space-y-5">
          {/* A. Needs Attention */}
          <OverviewCard
            icon={AlertCircle}
            title="Needs Attention"
            badge={
              <span className="text-[11px] text-[#7D766C] font-semibold bg-[#F4EFE7] px-2 py-0.5 rounded-full">
                {sortedAttention.length} items
              </span>
            }
          >
            {sortedAttention.length === 0 ? (
              <EmptyBlock message="No profiles or requests currently require attention." />
            ) : (
              <div className="flex flex-col">
                <div
                  ref={attentionContainerRef}
                  className={`space-y-4 ${
                    isAttentionScrollable
                      ? 'max-h-[950px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-[#E9E4DC] transition-all duration-300'
                      : ''
                  }`}
                >
                  {displayedAttention.map((item, idx) => {
                    let kindLabel = 'ACTION';
                    let linkHref = '/agent-requests';
                    let actionText = 'Open';
                    let subtitle = 'Action required for profile';
                    let isUrgent = false;
                    let tagTextColor = 'text-[#475569]';
                    let actionBtnColor = 'bg-[#1F3B34] hover:bg-[#172E29] text-white';

                    const rawCandidates = item.kind === 'release_ready'
                      ? (candidatesByRequestId.get(item.entity_id) || extraCandidatesMap[item.entity_id] || [])
                      : [];

                    // Strictly ensure candidate is never the client themselves
                    const releasedCandidates = rawCandidates.filter(
                      (c) => c.candidate_profile_id !== item.profile_id && c.full_name !== item.profile_name
                    );

                    const hasReleases = item.kind === 'release_ready' && releasedCandidates.length > 0;

                    if (item.kind === 'release_ready') {
                      if (hasReleases) {
                        kindLabel = 'RELEASE READY';
                        actionText = 'Deliver';
                        subtitle = 'Candidate dossier approved by Manager';
                        tagTextColor = 'text-[#C86A4A]';
                        actionBtnColor = 'bg-[#C86A4A] hover:bg-[#B55A3C] text-white';
                      } else {
                        kindLabel = 'IN REVIEW';
                        actionText = 'View Request';
                        subtitle = 'Request with Manager • Awaiting match release';
                        tagTextColor = 'text-[#2F3E51]';
                        actionBtnColor = 'bg-[#2F3E51] hover:bg-[#1E293B] text-white';
                      }
                      linkHref = `/agent-requests?requestId=${item.entity_id}&profileId=${item.profile_id}`;
                    } else if (item.kind === 'assigned_to_you') {
                      kindLabel = 'ASSIGNED';
                      actionText = 'View';
                      subtitle = 'New client request assigned to you';
                      tagTextColor = 'text-[#2563EB]';
                      actionBtnColor = 'bg-[#1F3B34] hover:bg-[#172E29] text-white';
                      linkHref = `/agent-requests?requestId=${item.entity_id}&profileId=${item.profile_id}`;
                    } else if (item.kind === 'no_preferences') {
                      kindLabel = 'NO PREFERENCES';
                      actionText = 'Add Prefs';
                      subtitle = 'Preferences required before matching';
                      tagTextColor = 'text-[#D97706]';
                      actionBtnColor = 'bg-[#D97706] hover:bg-[#B45309] text-white';
                      linkHref = `/add-profile?profileId=${item.profile_id}&step=8`;
                    } else if (item.kind === 'stale_draft') {
                      kindLabel = 'STALE DRAFT';
                      actionText = 'Continue';
                      subtitle = 'Incomplete registration inactive for 7+ days';
                      isUrgent = true;
                      tagTextColor = 'text-[#DC2626]';
                      actionBtnColor = 'bg-[#1F3B34] hover:bg-[#172E29] text-white';
                      linkHref = `/add-profile?profileId=${item.profile_id}`;
                    } else if (item.kind === 'ready_to_request') {
                      kindLabel = 'READY TO REQUEST';
                      actionText = 'Request';
                      subtitle = 'Profile active with preferences • Ready for matching';
                      tagTextColor = 'text-[#166534]';
                      actionBtnColor = 'bg-[#166534] hover:bg-[#14532D] text-white';
                      linkHref = `/agent-requests?profileId=${item.profile_id}`;
                    }

                    const handleNavigate = () => {
                      if (typeof window !== 'undefined') {
                        if (item.entity_id) sessionStorage.setItem('target_open_request_id', item.entity_id);
                        if (item.profile_id) sessionStorage.setItem('target_open_profile_id', item.profile_id);
                      }
                      router.push(linkHref);
                    };

                    // Alternating horizontal offset: even entries (2nd, 4th, etc.) placed slightly forward
                    const horizontalOffset = idx % 2 === 1 ? 'ml-3 sm:ml-6' : 'ml-0';

                    // Flat crisp card styling (NO GRADIENTS, NO BORDER ACCENTS)
                    const cardBgClass = isUrgent
                      ? 'bg-[#FFF9F8] border-[#FBD8D4] hover:border-[#F8BDB5]'
                      : item.kind === 'release_ready' && hasReleases
                      ? 'bg-white border-[#E7E2D8] hover:border-[#C86A4A]/50'
                      : 'bg-white border-[#EBE7DF] hover:border-[#1F3B34]/40';

                    return (
                      <div
                        key={`${item.kind}-${item.entity_id || item.profile_id}-${idx}`}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col gap-3.5 shadow-xs hover:shadow-md group ${cardBgClass} ${horizontalOffset}`}
                      >
                        {/* ── 1. MAIN CLIENT ROW ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <AvatarInitials name={item.profile_name} size="md" />
                              {isUrgent && (
                                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white">
                                  !
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Borderless, backgroundless clean status tag */}
                                <span
                                  className={`inline-flex items-center text-[10.5px] font-bold tracking-wider uppercase select-none ${tagTextColor}`}
                                >
                                  {kindLabel}
                                </span>

                                {isUrgent && (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-rose-600 px-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-600 fill-rose-600" />
                                    <span>Urgent</span>
                                  </span>
                                )}
                              </div>

                              <h4
                                className="text-[15px] font-bold text-[#1E2022] tracking-tight truncate group-hover:text-[#1F3B34] transition-colors cursor-pointer mt-0.5"
                                title={item.profile_name}
                                onClick={handleNavigate}
                              >
                                {item.profile_name}
                              </h4>
                              <p className="text-[11.5px] text-[#7D766C] font-medium truncate">
                                {subtitle} <span className="text-[#CCC6BA] mx-1">•</span>{' '}
                                <span className="font-semibold text-[#5C5549]">{formatRelativeTime(item.since)}</span>
                              </p>
                            </div>
                          </div>

                          {/* Primary Action Button */}
                          {item.kind === 'release_ready' && hasReleases ? (
                            <button
                              disabled={downloadingRequestId === item.entity_id}
                              onClick={(e) => handleDownloadDossier(e, item.entity_id, item.profile_name)}
                              className="rounded-full px-4 py-2 bg-[#C86A4A] hover:bg-[#B55A3C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-60 shrink-0 self-start sm:self-center"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>
                                {downloadingRequestId === item.entity_id
                                  ? 'Generating PDF…'
                                  : 'Download Dossier (PDF)'}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={handleNavigate}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 transition-all duration-150 active:scale-95 shadow-xs cursor-pointer flex items-center justify-center self-start sm:self-center ${actionBtnColor}`}
                            >
                              <span>{actionText}</span>
                            </button>
                          )}
                        </div>

                        {/* ── 2. RELEASED CANDIDATE SECTION (Underneath client when Manager responded) ── */}
                        {item.kind === 'release_ready' && (
                          <div className="pt-3 border-t border-[#F0EBE1] space-y-2.5">
                            <div className="flex items-center justify-between text-[11px] gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8275]">
                                {hasReleases
                                  ? `Approved Candidate${releasedCandidates.length > 1 ? 's' : ''} by Manager`
                                  : 'Request Under Review'}
                              </span>
                              <Link
                                href={`/agent-requests?requestId=${item.entity_id}&profileId=${item.profile_id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('target_open_request_id', item.entity_id);
                                    sessionStorage.setItem('target_open_profile_id', item.profile_id);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-[#1F3B34] bg-[#FAF8F5] border border-[#E2DCBD] hover:bg-[#F2ECE1] hover:border-[#1F3B34]/40 shadow-2xs transition-all duration-150 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#1F3B34]" />
                                <span>View on Requests Board</span>
                              </Link>
                            </div>

                            {hasReleases ? (
                              <div className="space-y-2.5">
                                {releasedCandidates.map((cand) => (
                                  <div
                                    key={cand.release_id}
                                    className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EDE7DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-150 hover:bg-[#F5F0E8] hover:border-[#C86A4A]/30 hover:shadow-2xs"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div
                                        className="cursor-pointer shrink-0 transition-transform active:scale-95"
                                        onClick={() => handleOpenCandidateProfile(cand.candidate_profile_id)}
                                        title={`View ${cand.full_name || 'Candidate'} profile`}
                                      >
                                        <AvatarInitials name={cand.full_name || 'Candidate'} size="sm" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                          <span
                                            className="font-bold text-[14px] text-[#1E2022] hover:text-[#C86A4A] transition-colors cursor-pointer truncate"
                                            title={`View ${cand.full_name || 'Candidate'} profile`}
                                            onClick={() => handleOpenCandidateProfile(cand.candidate_profile_id)}
                                          >
                                            {cand.full_name || 'Candidate'}
                                          </span>
                                          {cand.score !== null && cand.score !== undefined && (
                                            <span className="text-[#166534] font-bold text-xs tracking-tight select-none">
                                              {cand.score}% Match
                                            </span>
                                          )}
                                        </div>

                                        {/* Clean horizontal inline specs without inner box nesting */}
                                        <div className="flex items-center gap-2.5 text-[11.5px] text-[#5C5549] mt-1 flex-wrap">
                                          <span>
                                            <strong className="text-[#8C8477] font-medium">Age:</strong>{' '}
                                            {cand.age !== null ? `${cand.age} yrs` : '—'}
                                          </span>
                                          <span className="text-[#D0C9BD]">•</span>
                                          <span>
                                            <strong className="text-[#8C8477] font-medium">City:</strong>{' '}
                                            {cand.city || '—'}
                                          </span>
                                          <span className="text-[#D0C9BD]">•</span>
                                          <span>
                                            <strong className="text-[#8C8477] font-medium">Caste:</strong>{' '}
                                            {cand.caste || '—'}
                                          </span>
                                          <span className="text-[#D0C9BD]">•</span>
                                          <span>
                                            <strong className="text-[#8C8477] font-medium">Education:</strong>{' '}
                                            {cand.education || '—'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCandidateProfile(cand.candidate_profile_id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#1F3B34] bg-white border border-[#DDD6C9] hover:bg-[#1F3B34] hover:text-white hover:border-[#1F3B34] transition-all duration-150 shadow-2xs cursor-pointer active:scale-95"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Candidate Profile</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EDE7DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#7D766C]">
                                <span>Manager is reviewing matches for this client. Once candidates are released, they will appear here.</span>
                                <Link
                                  href={`/agent-requests?requestId=${item.entity_id}&profileId=${item.profile_id}`}
                                  className="text-[#2F3E51] font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
                                >
                                  <span>Track on Board</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* See More / Show Less Action Footer */}
                {sortedAttention.length > 5 && (
                  <div className="pt-3 mt-3 border-t border-[#F0EBE2] flex items-center justify-between text-[11.5px] text-[#7D766C]">
                    <span className="font-medium">
                      Showing{' '}
                      <span className="font-bold text-[#1E2022]">{displayedAttention.length}</span>{' '}
                      of <span className="font-bold text-[#1E2022]">{sortedAttention.length}</span> items
                    </span>

                    <div className="flex items-center gap-2">
                      {remainingAttentionCount > 0 ? (
                        <button
                          type="button"
                          onClick={handleSeeMoreAttention}
                          className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#1F3B34] text-white hover:bg-[#172E29] transition-all duration-120 shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>See more</span>
                          <span className="text-[10px] text-white/80 font-normal">
                            (+{Math.min(5, remainingAttentionCount)})
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-white/80" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleShowLessAttention}
                          className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-white border border-[#E2DDD5] text-[#5C5549] hover:text-[#1F3B34] hover:border-[#1F3B34] hover:bg-[#FAF8F5] transition-all duration-120 shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Show less</span>
                          <ChevronUp className="w-3.5 h-3.5 text-[#5C5549]" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </OverviewCard>
        </div>

        {/* ─── RIGHT 4 COLUMNS: WORKLIST SUPPORT ─── */}
        <div className="lg:col-span-4 min-w-0 space-y-5">
          {/* 1. Drafts (with 8-step Chips & Next step highlight) */}
          <OverviewCard
            icon={FileEdit}
            title="Drafts"
            badge={
              <span className="text-[11px] text-[#7D766C] font-semibold bg-[#F4EFE7] px-2 py-0.5 rounded-full">
                {drafts.length} pending
              </span>
            }
          >
            {drafts.length === 0 ? (
              <EmptyBlock message="No incomplete drafts in roster." />
            ) : (
              <div className="space-y-3">
                {drafts.map((d) => {
                  const missing = d.missing;
                  const hasMissing = missing !== undefined && missing !== null && Array.isArray(missing);
                  const stepsDone = hasMissing ? 8 - missing.length : d.steps_done;
                  const nextStep = hasMissing
                    ? (FIXED_STEP_SECTIONS.find((sec) => missing.includes(sec)) || null)
                    : d.next_step;

                  return (
                    <div
                      key={d.id}
                      className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80 space-y-2.5 text-xs transition-all duration-120 hover:bg-[#F4EFE7]/80"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-semibold text-[#1E2022] truncate max-w-[170px]"
                          title={d.full_name}
                        >
                          {d.full_name}
                        </span>
                        <span className="text-[10px] text-[#7D766C] tabular-nums font-semibold">
                          {stepsDone}/{d.steps_total || 8} steps
                        </span>
                      </div>

                      {/* Compact row of 8 chips + Next step highlight */}
                      <StepChipsRow
                        stepsDone={stepsDone}
                        stepsTotal={d.steps_total || 8}
                        nextStep={nextStep}
                        missing={missing}
                      />

                      <div className="flex items-center justify-end pt-1">
                        <button
                          onClick={() => {
                            const stepNum = getNextStepNumber(nextStep);
                            router.push(`/add-profile?draftId=${d.id}&profileId=${d.id}&step=${stepNum}`);
                          }}
                          className="rounded-full px-3 py-1 border border-[#1F3B34] text-[#1F3B34] hover:bg-[#1F3B34] hover:text-white text-xs font-semibold transition-all duration-120 active:scale-95 cursor-pointer shadow-2xs"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </OverviewCard>

          {/* 2. Requests with Manager */}
          <OverviewCard
            icon={Inbox}
            title="Requests with Manager"
            rightAction={
              <Link
                href="/agent-requests?column=requested"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('target_request_column', 'requested');
                  }
                }}
                className="text-xs font-semibold text-[#1F3B34] hover:underline"
              >
                View All
              </Link>
            }
          >
            {requests.length === 0 ? (
              <EmptyBlock message="No active requests submitted." />
            ) : (
              <div className="divide-y divide-[#E9E4DC]/60">
                {requests.slice(0, 10).map((req) => (
                  <div
                    key={req.id}
                    onClick={() => navigateToRequestsColumn('requested')}
                    className="group py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF8F5]/80 transition-colors duration-120 cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div
                        className="text-[14px] font-bold text-[#1E2022] truncate tracking-tight group-hover:text-[#1F3B34] transition-colors"
                        title={req.profile_name || 'Client'}
                      >
                        {req.profile_name || 'Client'}
                      </div>
                      <div className="text-[11px] text-[#8C8477] truncate font-medium mt-0.5">
                        {req.reviewed_by_name
                          ? `Rev: ${req.reviewed_by_name}`
                          : 'Unreviewed'}
                      </div>
                    </div>

                    <span
                      className={`text-[10.5px] font-bold uppercase tracking-wider shrink-0 text-right select-none ${getRequestStatusColor(
                        req.status
                      )}`}
                    >
                      {(req.status || 'PENDING').replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </OverviewCard>
        </div>
      </div>
    </div>
  );
}
