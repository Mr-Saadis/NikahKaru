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
  GitBranch,
  MessageSquare,
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
  StatusPill,
  AvatarInitials,
  SemiCircleGauge,
  OverviewSkeleton,
  ErrorBlock,
  EmptyBlock,
  UntrackedBox,
  RadialProgressRing,
  StepChipsRow,
  TodayActivityChart,
  FIXED_STEP_SECTIONS,
} from './overview-ui';
import { toast } from 'sonner';

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

export default function StaffOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentOverviewData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
  const pipeline = data.pipeline;
  const attention = data.attention || [];
  const profiles = data.profiles || [];
  const drafts = data.drafts || [];
  const readyForDelivery = data.ready_for_delivery || [];
  const requests = data.requests || [];
  const tracking = data.tracking;
  const todayActivity = data.today_activity;

  // Total Pipeline calculation
  const totalPipeline =
    (pipeline?.with_manager || 0) +
    (pipeline?.ready || 0) +
    (pipeline?.downloaded || 0) +
    (pipeline?.completed || 0);

  const pipelineSegments = [
    {
      id: 'with_manager',
      label: 'With Manager',
      value: pipeline?.with_manager || 0,
      color: '#1F3B34',
    },
    {
      id: 'ready',
      label: 'Ready',
      value: pipeline?.ready || 0,
      color: '#A3B18A',
    },
    {
      id: 'downloaded',
      label: 'Downloaded',
      value: pipeline?.downloaded || 0,
      color: '#C86A4A',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: pipeline?.completed || 0,
      color: '#166534',
    },
  ];

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
        {/* 1. Awaiting Download */}
        <KpiCard
          icon={Download}
          label="AWAITING DOWNLOAD"
          numericValue={kpis.awaiting_download ?? 0}
          value={kpis.awaiting_download ?? 0}
          caption="Ready for family delivery"
          isAlert={(kpis.awaiting_download ?? 0) > 0}
          alertColor="amber"
          onClick={() => router.push('/agent-requests')}
        />
        {/* 2. Open Requests */}
        <KpiCard
          icon={Inbox}
          label="OPEN REQUESTS"
          numericValue={kpis.open_requests ?? 0}
          value={kpis.open_requests ?? 0}
          caption="Submitted to manager"
          onClick={() => router.push('/agent-requests')}
        />
        {/* 3. Drafts Pending */}
        <KpiCard
          icon={FileEdit}
          label="DRAFTS PENDING"
          numericValue={kpis.drafts_pending ?? 0}
          value={kpis.drafts_pending ?? 0}
          caption="Incomplete registrations"
          onClick={() => router.push('/profiles')}
        />
        {/* 4. Assigned Profiles */}
        <KpiCard
          icon={UserCheck}
          label="ASSIGNED PROFILES"
          numericValue={kpis.assigned_profiles ?? 0}
          value={kpis.assigned_profiles ?? 0}
          caption="Active client roster"
          onClick={() => router.push('/profiles')}
        />
        {/* 5. Released for Client */}
        <KpiCard
          icon={Send}
          label="RELEASED FOR CLIENT"
          numericValue={kpis.released_for_client ?? 0}
          value={kpis.released_for_client ?? 0}
          caption="Approved by manager"
          onClick={() => router.push('/agent-requests')}
        />
        {/* 6. Shared with Family */}
        <KpiCard
          icon={Share2}
          label="SHARED WITH FAMILY"
          numericValue={kpis.shared_with_family ?? 0}
          value={kpis.shared_with_family ?? 0}
          caption="Dossiers delivered"
          onClick={() => router.push('/agent-requests')}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. TODAY'S ACTIVITY — CONCENTRIC 270° RADIAL ARC CHART
      ════════════════════════════════════════════════════════════════ */}
      <TodayActivityChart
        data={data.today_activity}
        error={data.today_activity_error}
        onRetry={() => void fetchData(false)}
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
                {attention.length} items
              </span>
            }
          >
            {attention.length === 0 ? (
              <EmptyBlock message="No profiles or requests currently require attention." />
            ) : (
              <div className="rounded-xl border border-[#E9E4DC]/80 overflow-hidden divide-y divide-[#E9E4DC]/70">
                {attention.map((item, idx) => {
                  let kindLabel = 'ACTION';
                  let linkHref = '/agent-requests';
                  let actionText = 'Open';

                  if (item.kind === 'release_ready') {
                    kindLabel = 'RELEASE READY';
                    actionText = 'Deliver';
                    linkHref = `/agent-requests?requestId=${item.entity_id}&profileId=${item.profile_id}`;
                  } else if (item.kind === 'assigned_to_you') {
                    kindLabel = 'ASSIGNED';
                    actionText = 'View';
                    linkHref = `/agent-requests?requestId=${item.entity_id}&profileId=${item.profile_id}`;
                  } else if (item.kind === 'no_preferences') {
                    kindLabel = 'NO PREFERENCES';
                    actionText = 'Add Prefs';
                    linkHref = `/add-profile?profileId=${item.profile_id}&step=8`;
                  } else if (item.kind === 'stale_draft') {
                    kindLabel = 'STALE DRAFT';
                    actionText = 'Continue';
                    linkHref = `/add-profile?profileId=${item.profile_id}`;
                  } else if (item.kind === 'ready_to_request') {
                    kindLabel = 'READY TO REQUEST';
                    actionText = 'Request';
                    linkHref = `/agent-requests?profileId=${item.profile_id}`;
                  }

                  return (
                    <div
                      key={`${item.kind}-${item.entity_id}-${idx}`}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white hover:bg-[#FAF8F5]/80 transition-colors duration-120 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarInitials name={item.profile_name} size="sm" />
                        <StatusPill label={kindLabel} size="xs" />
                        <span
                          className="font-semibold text-[#1E2022] truncate max-w-[200px]"
                          title={item.profile_name}
                        >
                          {item.profile_name}
                        </span>
                        <span className="text-[11px] text-[#7D766C] tabular-nums shrink-0 whitespace-nowrap">
                          {formatRelativeTime(item.since)}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            if (item.entity_id) sessionStorage.setItem('target_open_request_id', item.entity_id);
                            if (item.profile_id) sessionStorage.setItem('target_open_profile_id', item.profile_id);
                          }
                          router.push(linkHref);
                        }}
                        className="rounded-full px-3 py-1 border border-[#1F3B34] text-[#1F3B34] hover:bg-[#1F3B34] hover:text-white text-xs font-semibold shrink-0 transition-all duration-120 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        {actionText}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </OverviewCard>

          {/* B. Ready for Client Delivery (Moved up to Main Column!) */}
          <OverviewCard
            icon={Send}
            title="Ready for Client Delivery"
            badge={
              <span className="text-[11px] text-[#7D766C] font-semibold bg-[#F4EFE7] px-2 py-0.5 rounded-full">
                {readyForDelivery.length} releases
              </span>
            }
          >
            {readyForDelivery.length === 0 ? (
              <EmptyBlock message="No candidate dossiers awaiting delivery." />
            ) : (
              <div className="space-y-3 text-xs">
                {readyForDelivery.map((rel) => (
                  <div
                    key={rel.release_id}
                    className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80 space-y-3 transition-all duration-150 hover:bg-[#F4EFE7]/80 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarInitials name={rel.full_name || 'Candidate'} size="sm" />
                        <div className="min-w-0">
                          <span
                            className="font-bold text-sm text-[#1E2022] truncate block"
                            title={rel.full_name || '—'}
                          >
                            {rel.full_name || '—'}
                          </span>
                          <span className="text-[11px] text-[#7D766C]">
                            Approved by {rel.released_by_name || 'Manager'}
                          </span>
                        </div>
                      </div>

                      {rel.score !== null && rel.score !== undefined ? (
                        <div
                          className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold tabular-nums rounded-full shadow-2xs cursor-help shrink-0"
                          title="Compatibility score, not a marriage probability"
                        >
                          {rel.score}% Match
                        </div>
                      ) : (
                        <span className="text-[#7D766C] text-xs">—</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-[#E9E4DC]/60">
                      <div>
                        <span className="text-[#A49C8F] block text-[10px] uppercase">Age</span>
                        <span className="font-semibold text-[#1E2022]">
                          {rel.age !== null ? `${rel.age} yrs` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#A49C8F] block text-[10px] uppercase">City</span>
                        <span className="font-semibold text-[#1E2022] truncate block">
                          {rel.city || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#A49C8F] block text-[10px] uppercase">Caste</span>
                        <span className="font-semibold text-[#1E2022] truncate block">
                          {rel.caste || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#A49C8F] block text-[10px] uppercase">Education</span>
                        <span className="font-semibold text-[#1E2022] truncate block">
                          {rel.education || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-3">
                      <Link
                        href={`/agent-requests?requestId=${rel.request_id}&profileId=${rel.candidate_profile_id}`}
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            if (rel.request_id) sessionStorage.setItem('target_open_request_id', rel.request_id);
                            if (rel.candidate_profile_id) sessionStorage.setItem('target_open_profile_id', rel.candidate_profile_id);
                          }
                        }}
                        className="text-xs font-semibold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View on Requests Board</span>
                      </Link>

                      <Link
                        href={`/agent-requests?requestId=${rel.request_id}&profileId=${rel.candidate_profile_id}`}
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            if (rel.request_id) sessionStorage.setItem('target_open_request_id', rel.request_id);
                            if (rel.candidate_profile_id) sessionStorage.setItem('target_open_profile_id', rel.candidate_profile_id);
                          }
                        }}
                        className="rounded-full px-4 py-1.5 bg-[#1F3B34] hover:bg-[#172E29] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all duration-120 active:scale-98"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Dossier (PDF)</span>
                      </Link>
                    </div>
                  </div>
                ))}
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

          {/* 2. Pipeline Gauge Card */}
          <OverviewCard icon={GitBranch} title="Request Pipeline">
            <SemiCircleGauge
              total={totalPipeline}
              totalCaption="Total Requests"
              segments={pipelineSegments}
              ariaLabel="Agent Pipeline Gauge"
            />
          </OverviewCard>

          {/* 3. Requests with Manager */}
          <OverviewCard
            icon={Inbox}
            title="Requests with Manager"
            rightAction={
              <Link
                href="/agent-requests"
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
                    onClick={() => router.push('/agent-requests')}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-[#FAF8F5]/80 transition-colors duration-120 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div
                        className="font-semibold text-[#1E2022] truncate max-w-[140px]"
                        title={req.profile_name || 'Client'}
                      >
                        {req.profile_name || 'Client'}
                      </div>
                      <div className="text-[10px] text-[#7D766C] truncate">
                        {req.reviewed_by_name
                          ? `Rev: ${req.reviewed_by_name}`
                          : 'Unreviewed'}
                      </div>
                    </div>

                    <StatusPill label={req.status || 'PENDING'} size="xs" />
                  </div>
                ))}
              </div>
            )}
          </OverviewCard>

          {/* 4. Active Client Discussions (Sinks to bottom when empty/untracked) */}
          <OverviewCard icon={MessageSquare} title="Active Client Discussions">
            {!tracking || tracking.matches_active === 0 ? (
              <UntrackedBox message="Not tracked yet" />
            ) : (
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80 flex items-center justify-between text-xs">
                <span className="text-[#4E473D] font-medium">Active Discussions</span>
                <span className="text-xl font-bold text-[#1F3B34] tabular-nums">
                  {tracking.matches_active}
                </span>
              </div>
            )}
          </OverviewCard>
        </div>
      </div>
    </div>
  );
}
