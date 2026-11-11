'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  ExternalLink,
  AlertCircle,
  Sliders,
  Send,
  Inbox,
  ListFilter,
  Users,
  Activity,
} from 'lucide-react';
import { DashboardService, type ManagerOverviewData } from '@/lib/services/dashboard-service';
import { COLUMNS } from '@/components/requests/constants';
import {
  formatWaitingHours,
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
} from './overview-ui';
import { toast } from 'sonner';

export default function ManagerOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ManagerOverviewData | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRangeLoading, setIsRangeLoading] = useState<boolean>(false);
  const managerCacheRef = React.useRef<Record<number, ManagerOverviewData>>({});

  const handleRangeChange = (days: number) => {
    setSelectedDays(days);
    if (managerCacheRef.current[days]) {
      setData(managerCacheRef.current[days]);
    } else {
      setIsRangeLoading(true);
    }
  };

  const fetchData = async (days: number, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await DashboardService.getDashboardData('MANAGER', days, 24);
      if (!res) return;
      managerCacheRef.current[days] = res as ManagerOverviewData;
      setData(res as ManagerOverviewData);
      setLastUpdated(formatKarachiTime(new Date()));
      setError(null);
      setLoading(false);
      setIsRangeLoading(false);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'AbortError') return;
      console.error('[ManagerOverview] load error:', err);
      setError(e?.message || 'Failed to load manager desk data');
      toast.error('Failed to load operations desk');
      setLoading(false);
      setIsRangeLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    DashboardService.getDashboardData('MANAGER', selectedDays, 24)
      .then((res) => {
        if (isCancelled || !res) return;
        managerCacheRef.current[selectedDays] = res as ManagerOverviewData;
        setData(res as ManagerOverviewData);
        setLastUpdated(formatKarachiTime(new Date()));
        setError(null);
        setLoading(false);
        setIsRangeLoading(false);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        const e = err as { name?: string; message?: string };
        if (e?.name === 'AbortError') return;
        console.error('[ManagerOverview] load error:', err);
        setError(e?.message || 'Failed to load manager desk data');
        toast.error('Failed to load operations desk');
        setLoading(false);
        setIsRangeLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedDays]);

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
          message={error || 'Unable to connect to operations RPC'}
          onRetry={() => void fetchData(selectedDays, true)}
        />
      </div>
    );
  }

  const kpis = data.kpis;
  const pipeline = data.pipeline || {};
  const queue = data.queue || [];
  const workload = data.agent_workload || [];
  const stuckReleases = data.stuck_releases || [];
  const scoreQuality = data.score_quality;
  const lowMatch = data.low_match || [];
  const recentReleases = data.recent_releases || [];

  const oldestWaitingHours = kpis.oldest_waiting_hours ?? 0;
  const isOldestOverdue = oldestWaitingHours > (data.sla_hours || 24);

  // Score quality gauge segments
  const scoreQualitySegments = [
    {
      id: 'excellent',
      label: 'Excellent (>80%)',
      value: scoreQuality.excellent || 0,
      color: '#166534',
    },
    {
      id: 'good',
      label: 'Good (65-80%)',
      value: scoreQuality.good || 0,
      color: '#A3B18A',
    },
    {
      id: 'borderline',
      label: 'Borderline (<65%)',
      value: scoreQuality.borderline || 0,
      color: '#C86A4A',
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-5 font-sans">
      {/* ════════════════════════════════════════════════════════════════
          1. PAGE HEADER (with range pill tabs)
      ════════════════════════════════════════════════════════════════ */}
      <PageHeader
        title="Manager Control Room"
        subtitle="Queue triage, operational SLAs & candidate release telemetry"
        icon={Sliders}
        lastUpdated={lastUpdated}
        onRefresh={() => void fetchData(selectedDays, true)}
        selectedDays={selectedDays}
        onRangeChange={handleRangeChange}
        isRefreshing={isRangeLoading}
      />

      {/* ════════════════════════════════════════════════════════════════
          2. REQUEST PIPELINE (Full 10-column Board Overview)
      ════════════════════════════════════════════════════════════════ */}
      <OverviewCard
        icon={Activity}
        title="Request Pipeline"
        rightAction={
          <Link
            href="/requests"
            className="text-xs font-semibold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Board</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {COLUMNS.map((col) => {
            const count = pipeline[col.key] || 0;
            return (
              <Link
                key={col.key}
                href={`/requests?column=${col.key}`}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('target_request_column', col.key);
                  }
                }}
                className="p-3 bg-white/70 hover:bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E9E4DC]/80 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 group shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  <span
                    className="text-[10.5px] font-bold uppercase tracking-wider text-[#7D766C] truncate group-hover:text-[#1E2022]"
                    title={col.label}
                  >
                    {col.label}
                  </span>
                </div>
                <span
                  className="text-xl md:text-2xl font-bold tabular-nums mt-1.5"
                  style={{ color: col.color }}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </OverviewCard>

      {/* ════════════════════════════════════════════════════════════════
          3. HERO SLA BAND: 3 LARGE CARDS
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={Clock}
          label="OLDEST WAITING"
          value={formatWaitingHours(kpis.oldest_waiting_hours)}
          isAlert={isOldestOverdue}
          alertColor="red"
          caption={`SLA threshold: ${data.sla_hours || 24}h`}
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('target_request_column', 'first');
            }
            router.push('/requests?column=first');
          }}
        />
        <KpiCard
          icon={AlertTriangle}
          label="OVERDUE REQUESTS"
          numericValue={kpis.overdue ?? 0}
          value={kpis.overdue ?? 0}
          isAlert={(kpis.overdue ?? 0) > 0}
          alertColor="red"
          caption="Exceeded SLA waiting time"
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('target_request_column', 'first');
            }
            router.push('/requests?column=first');
          }}
        />
        <KpiCard
          icon={Inbox}
          label="PENDING REQUESTS"
          numericValue={kpis.pending ?? 0}
          value={kpis.pending ?? 0}
          caption="Currently in triage queue"
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('target_request_column', 'first');
            }
            router.push('/requests?column=first');
          }}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          4. MAIN GRID: WAITING QUEUE (LEFT 7) + AGENT WORKLOAD & STUCK (RIGHT 5)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── LEFT 7 COLS: WAITING QUEUE ─── */}
        <div className="lg:col-span-7 min-w-0">
          <OverviewCard
            icon={ListFilter}
            title="Waiting Queue"
            badge={
              <span className="text-[11px] font-bold text-[#1F3B34] tracking-wider uppercase">
                {queue.length} in queue
              </span>
            }
            rightAction={
              <Link
                href="/requests?column=first"
                className="text-xs font-semibold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
              >
                <span>Full Board</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            }
          >
            {queue.length === 0 ? (
              <EmptyBlock message="All incoming requests have been triaged. Waiting queue is empty." />
            ) : (
              <div className="rounded-2xl border border-[#E9E4DC]/80 overflow-hidden bg-white/70 backdrop-blur-sm shadow-2xs">
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF8F5]/80 border-b border-[#E9E4DC] text-[10.5px] font-bold uppercase tracking-wider text-[#7D766C]">
                        <th className="py-3 px-4 font-bold">Client Profile</th>
                        <th className="py-3 px-3 font-bold">Assigned Agent</th>
                        <th className="py-3 px-3 font-bold">SLA Health</th>
                        <th className="py-3 px-3 font-bold">Waiting Time</th>
                        <th className="py-3 px-4 font-bold text-right">Triage Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E4DC]/50 bg-transparent">
                      {queue.map((req) => (
                        <tr
                          key={req.request_id}
                          className="hover:bg-white/80 transition-all duration-150 group"
                        >
                          {/* 1. Client Profile */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <AvatarInitials name={req.full_name || ''} size="md" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="font-bold text-[#1E2022] text-[13.5px] truncate max-w-[150px] group-hover:text-[#1F3B34] transition-colors"
                                    title={req.full_name || 'Client'}
                                  >
                                    {req.full_name || 'Client'}
                                  </span>
                                  {req.is_repeat ? (
                                    <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#D4AF37]">
                                      REPEAT
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#1F3B34]">
                                      FIRST TIME
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#7D766C] truncate mt-0.5 flex items-center gap-1.5 font-medium">
                                  <span>{req.age ? `${req.age} yrs` : 'Age —'}</span>
                                  <span className="text-[#D3CABA]">•</span>
                                  <span>{req.city || 'Pakistan'}</span>
                                  {req.caste && (
                                    <>
                                      <span className="text-[#D3CABA]">•</span>
                                      <span>{req.caste}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Assigned Agent */}
                          <td className="py-3.5 px-3">
                            <span className="text-xs font-semibold text-[#2F3E51] capitalize">
                              {req.agent_name || 'Unassigned'}
                            </span>
                          </td>

                          {/* 3. SLA Health (Pure Colored Text - Borderless & Backgroundless) */}
                          <td className="py-3.5 px-3">
                            {(() => {
                              const s = (req.sla_state || 'fresh').toLowerCase();
                              if (s === 'overdue') {
                                return (
                                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#C86A4A]">
                                    OVERDUE
                                  </span>
                                );
                              }
                              if (s === 'warning') {
                                return (
                                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#D4AF37]">
                                    WARNING
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[11px] font-bold tracking-wider uppercase text-[#1F3B34]">
                                  ON TIME
                                </span>
                              );
                            })()}
                          </td>

                          {/* 4. Waiting Time */}
                          <td className="py-3.5 px-3">
                            <span className="text-xs font-bold text-[#1E2022] tabular-nums">
                              {formatWaitingHours(req.waiting_hours)}
                            </span>
                          </td>

                          {/* 5. Triage Action (Solid Brand - No Gradients) */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                const targetCol = req.is_repeat ? 'second' : 'first';
                                if (typeof window !== 'undefined') {
                                  if (req.request_id) sessionStorage.setItem('target_open_request_id', req.request_id);
                                  sessionStorage.setItem('target_request_column', targetCol);
                                }
                                const query = req.request_id
                                  ? `?requestId=${req.request_id}&column=${targetCol}`
                                  : `?column=${targetCol}`;
                                router.push(`/requests${query}`);
                              }}
                              className="rounded-full px-4 py-1.5 bg-[#1F3B34] hover:bg-[#152823] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                            >
                              Run Match
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </OverviewCard>
        </div>

        {/* ─── RIGHT 5 COLS: AGENT WORKLOAD, STUCK RELEASES, SCORE QUALITY ─── */}
        <div className="lg:col-span-5 min-w-0 space-y-5">
          {/* A. Agent Workload */}
          <OverviewCard icon={Users} title="Agent Workload">
            {workload.length === 0 ? (
              <EmptyBlock message="No active agents found in workload." />
            ) : (
              <div className="space-y-3">
                {workload.map((w) => {
                  const totalProfiles = (w.active_profiles || 0) + (w.drafts || 0);
                  const activePct =
                    totalProfiles > 0
                      ? Math.round((w.active_profiles / totalProfiles) * 100)
                      : 0;

                  return (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E9E4DC]/80 space-y-2 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <AvatarInitials name={w.full_name || ''} size="sm" />
                          <span
                            className="font-semibold text-[#1E2022] truncate max-w-[140px]"
                            title={w.full_name}
                          >
                            {w.full_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[#7D766C] tabular-nums font-medium">
                            {w.open_requests || 0} reqs
                          </span>
                          <span
                            className={`text-[10.5px] font-bold tracking-wider uppercase select-none ${
                              w.load === 'OVERLOADED'
                                ? 'text-[#C86A4A]'
                                : w.load === 'BALANCED'
                                ? 'text-[#1F3B34]'
                                : 'text-[#2F3E51]'
                            }`}
                          >
                            {w.load || 'BALANCED'}
                          </span>
                        </div>
                      </div>

                      {/* Stacked Rounded Bar (h-2.5) */}
                      <div className="w-full bg-[#E9E4DC] h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#1F3B34] h-full transition-all duration-500 ease-out"
                          style={{ width: `${activePct}%` }}
                          title={`Active: ${w.active_profiles}`}
                        />
                        <div
                          className="bg-[#C86A4A] h-full transition-all duration-500 ease-out"
                          style={{ width: `${100 - activePct}%` }}
                          title={`Drafts: ${w.drafts}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#7D766C] font-medium">
                        <span>{w.active_profiles || 0} active</span>
                        <span>{w.drafts || 0} drafts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </OverviewCard>

          {/* B. Stuck Releases */}
          <OverviewCard
            icon={AlertTriangle}
            title="Stuck Releases"
            badge={
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#C86A4A]">
                {stuckReleases.length} stuck
              </span>
            }
          >
            {stuckReleases.length === 0 ? (
              <EmptyBlock message="No releases awaiting agent download past 48h." />
            ) : (
              <div className="space-y-2.5 text-xs">
                {stuckReleases.map((rel) => (
                  <div
                    key={rel.release_id}
                    className="p-3.5 bg-white/70 hover:bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E9E4DC]/80 flex items-center justify-between gap-3 transition-all duration-150 shadow-2xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarInitials name={rel.source_name || ''} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-bold text-[#1E2022] text-[13px] truncate max-w-[120px]"
                            title={rel.source_name || 'Client'}
                          >
                            {rel.source_name || 'Client'}
                          </span>
                          <span className="text-[10px] text-[#7D766C] font-medium">←</span>
                          <span
                            className="text-xs font-bold text-[#1F3B34] truncate max-w-[130px]"
                            title={rel.candidate_name || 'Candidate'}
                          >
                            {rel.candidate_name || 'Candidate'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#7D766C] truncate mt-1 flex items-center gap-1.5 font-medium">
                          <span className="capitalize text-[#2F3E51] font-semibold">
                            Agent: {rel.agent_name || 'Unassigned'}
                          </span>
                          <span className="text-[#D3CABA]">•</span>
                          <span className="text-[#C86A4A] font-bold">
                            {rel.days_waiting}d not downloaded
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          if (rel.request_id) sessionStorage.setItem('target_open_request_id', rel.request_id);
                          sessionStorage.setItem('target_request_column', 'downloaded');
                        }
                        const query = rel.request_id
                          ? `?requestId=${rel.request_id}&column=downloaded`
                          : '?column=downloaded';
                        router.push(`/requests${query}`);
                      }}
                      className="rounded-full px-4 py-1.5 bg-[#1F3B34] hover:bg-[#152823] text-white text-[11px] font-semibold transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </OverviewCard>

          {/* C. Score Quality (Gauge) */}
          <OverviewCard icon={Sliders} title="Score Quality">
            <SemiCircleGauge
              total={`${scoreQuality.avg || 0}%`}
              totalCaption="Avg Compatibility"
              segments={scoreQualitySegments}
              ariaLabel="Match Score Quality Gauge"
            />
          </OverviewCard>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          5. RECENT RELEASES & LOW-MATCH DESK (SIDE BY SIDE)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Releases (7 cols) */}
        <div className="lg:col-span-7 min-w-0">
          <OverviewCard
            icon={Send}
            title="Recent Releases"
            rightAction={
              <Link
                href="/requests?column=downloaded"
                className="text-xs font-semibold text-[#1F3B34] hover:underline"
              >
                View All
              </Link>
            }
          >
            {recentReleases.length === 0 ? (
              <EmptyBlock message="No recent releases completed in this period." />
            ) : (
              <div className="rounded-2xl border border-[#E9E4DC]/80 overflow-hidden bg-white/70 backdrop-blur-sm shadow-2xs">
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF8F5]/80 border-b border-[#E9E4DC] text-[10.5px] font-bold uppercase tracking-wider text-[#7D766C]">
                        <th className="py-3 px-4 font-bold">Candidate</th>
                        <th className="py-3 px-3 font-bold">Client</th>
                        <th className="py-3 px-3 font-bold">Agent</th>
                        <th className="py-3 px-4 font-bold text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E4DC]/50 bg-transparent">
                      {recentReleases.slice(0, 6).map((rel) => (
                        <tr
                          key={rel.release_id}
                          onClick={() => {
                            const reqId = rel.request_id;
                            if (typeof window !== 'undefined') {
                              if (reqId) sessionStorage.setItem('target_open_request_id', reqId);
                              sessionStorage.setItem('target_request_column', 'downloaded');
                            }
                            router.push(reqId ? `/requests?requestId=${reqId}&column=downloaded` : '/requests?column=downloaded');
                          }}
                          className="hover:bg-white/80 transition-colors duration-120 cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-bold text-[#1F3B34] truncate max-w-[130px] group-hover:underline">
                            {rel.candidate_name || 'Candidate'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#1E2022] truncate max-w-[130px]">
                            {rel.source_name || 'Client'}
                          </td>
                          <td className="py-3 px-3 text-[#2F3E51] font-medium truncate max-w-[120px] capitalize">
                            {rel.agent_name || '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-[11px] text-[#7D766C] tabular-nums whitespace-nowrap">
                            {formatKarachiDate(rel.released_at, {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </OverviewCard>
        </div>

        {/* Right: Low-Match Desk (5 cols) */}
        <div className="lg:col-span-5 min-w-0">
          <OverviewCard icon={AlertCircle} title="Low-Match Desk">
            {lowMatch.length === 0 ? (
              <EmptyBlock message="All profiles have healthy match candidate pools." />
            ) : (
              <div className="space-y-2.5 text-xs">
                {lowMatch.slice(0, 5).map((lm) => (
                  <div
                    key={lm.profile_id}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('target_open_profile_id', lm.profile_id);
                      }
                      router.push(`/requests?profileId=${lm.profile_id}`);
                    }}
                    className="p-3.5 bg-white/70 hover:bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E9E4DC]/80 flex items-center justify-between gap-3 hover:bg-white transition-all duration-150 shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarInitials name={lm.full_name || ''} size="md" />
                      <div className="min-w-0">
                        <div
                          className="font-bold text-[#1E2022] text-[13px] truncate max-w-[130px] group-hover:text-[#1F3B34] transition-colors"
                          title={lm.full_name || 'Profile'}
                        >
                          {lm.full_name || 'Profile'}
                        </div>
                        <div className="text-[11px] text-[#7D766C] mt-0.5 font-medium">
                          {formatRelativeTime(lm.executed_at)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#C86A4A] tracking-wider uppercase shrink-0">
                      {lm.candidates} {lm.candidates === 1 ? 'match' : 'matches'}
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
