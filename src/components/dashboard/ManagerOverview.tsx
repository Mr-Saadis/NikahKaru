'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  ExternalLink,
  AlertCircle,
  Flame,
  Sliders,
  ShieldAlert,
  Send,
  Cpu,
  CheckCircle2,
  FileCheck,
  Timer,
  Inbox,
  ListFilter,
  Users,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { DashboardService, type ManagerOverviewData } from '@/lib/services/dashboard-service';
import { COLUMNS } from '@/components/requests/constants';
import {
  formatWaitingHours,
  formatRelativeTime,
  formatKarachiDate,
  formatKarachiTime,
  formatDelta,
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
  AlertStrip,
} from './overview-ui';
import { toast } from 'sonner';

export default function ManagerOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ManagerOverviewData | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = async (days: number, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await DashboardService.getDashboardData('MANAGER', days, 24);
      if (!res) return;
      setData(res as ManagerOverviewData);
      setLastUpdated(formatKarachiTime(new Date()));
      setError(null);
      setLoading(false);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'AbortError') return;
      console.error('[ManagerOverview] load error:', err);
      setError(e?.message || 'Failed to load manager desk data');
      toast.error('Failed to load operations desk');
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    DashboardService.getDashboardData('MANAGER', selectedDays, 24)
      .then((res) => {
        if (isCancelled || !res) return;
        setData(res as ManagerOverviewData);
        setLastUpdated(formatKarachiTime(new Date()));
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        const e = err as { name?: string; message?: string };
        if (e?.name === 'AbortError') return;
        console.error('[ManagerOverview] load error:', err);
        setError(e?.message || 'Failed to load manager desk data');
        toast.error('Failed to load operations desk');
        setLoading(false);
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
  const hotCandidates = data.hot_candidates || [];
  const scoreQuality = data.score_quality;
  const lowMatch = data.low_match || [];
  const orphaned = data.orphaned_profiles || { count: 0, items: [] };
  const recentReleases = data.recent_releases || [];
  const feedback = data.feedback;

  const oldestWaitingHours = kpis.oldest_waiting_hours ?? 0;
  const isOldestOverdue = oldestWaitingHours > (data.sla_hours || 24);
  const releasesDelta =
    selectedDays > 0
      ? formatDelta(kpis.releases_in_range, kpis.releases_prev_range)
      : null;

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
        onRangeChange={setSelectedDays}
      />

      {/* ════════════════════════════════════════════════════════════════
          2. ACTION-FIRST ALERT STRIPS
      ════════════════════════════════════════════════════════════════ */}
      {(kpis.overdue ?? 0) > 0 && (
        <AlertStrip
          variant="rose"
          icon={AlertTriangle}
          message={
            <span>
              <strong>{kpis.overdue} request(s)</strong> have exceeded the SLA threshold
              of {data.sla_hours || 24} hours. Immediate triage required.
            </span>
          }
          actionText="Triage Overdue"
          actionHref="/release-requests"
        />
      )}

      {orphaned.count > 0 && (
        <AlertStrip
          variant="rose"
          icon={ShieldAlert}
          message={
            <span>
              <strong>{orphaned.count} active profile(s)</strong> currently have no assigned
              agent in roster.
            </span>
          }
          actionText="Reassign Profiles"
          actionHref="/profiles"
        />
      )}

      {stuckReleases.length > 0 && (
        <AlertStrip
          variant="amber"
          icon={Clock}
          message={
            <span>
              <strong>{stuckReleases.length} approved release(s)</strong> have been waiting for agent
              download past 48 hours.
            </span>
          }
          actionText="Inspect Releases"
          actionHref="/release-requests"
        />
      )}

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
          onClick={() => router.push('/release-requests')}
        />
        <KpiCard
          icon={AlertTriangle}
          label="OVERDUE REQUESTS"
          numericValue={kpis.overdue ?? 0}
          value={kpis.overdue ?? 0}
          isAlert={(kpis.overdue ?? 0) > 0}
          alertColor="red"
          caption="Exceeded SLA waiting time"
          onClick={() => router.push('/release-requests')}
        />
        <KpiCard
          icon={Inbox}
          label="PENDING REQUESTS"
          numericValue={kpis.pending ?? 0}
          value={kpis.pending ?? 0}
          caption="Currently in triage queue"
          onClick={() => router.push('/release-requests')}
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
              <span className="text-[11px] text-[#7D766C] font-semibold bg-[#F4EFE7] px-2 py-0.5 rounded-full">
                {queue.length} in queue
              </span>
            }
            rightAction={
              <Link
                href="/release-requests"
                className="text-xs font-semibold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
              >
                <span>Full Board</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            }
          >
            {queue.length === 0 ? (
              <EmptyBlock message="No pending requests currently waiting in queue." />
            ) : (
              <div className="rounded-xl border border-[#E9E4DC]/80 overflow-hidden">
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#E9E4DC] text-[11px] font-semibold uppercase tracking-wider text-[#7D766C]">
                        <th className="py-2.5 px-4 font-semibold">Client</th>
                        <th className="py-2.5 px-3 font-semibold">Agent</th>
                        <th className="py-2.5 px-3 font-semibold">SLA</th>
                        <th className="py-2.5 px-3 font-semibold">Waiting</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E4DC]/60 bg-white">
                      {queue.map((req) => (
                        <tr
                          key={req.request_id}
                          className="hover:bg-[#FAF8F5]/80 transition-colors duration-120"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AvatarInitials name={req.full_name || ''} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-semibold text-[#1E2022] truncate max-w-[130px]"
                                    title={req.full_name || 'Client'}
                                  >
                                    {req.full_name || 'Client'}
                                  </span>
                                  {req.is_repeat && (
                                    <span className="rounded-full px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold">
                                      REPEAT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#7D766C] truncate">
                                  {req.age ? `${req.age}y` : '—'} • {req.city || '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[#4E473D] truncate max-w-[110px]">
                            {req.agent_name || 'Unassigned'}
                          </td>
                          <td className="py-3 px-3">
                            <StatusPill label={req.sla_state || 'FRESH'} size="xs" />
                          </td>
                          <td className="py-3 px-3 tabular-nums font-semibold text-[#1E2022]">
                            {formatWaitingHours(req.waiting_hours)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => router.push('/release-requests')}
                              className="rounded-full px-3 py-1 bg-[#1F3B34] hover:bg-[#172E29] text-white text-[11px] font-semibold transition-all duration-120 active:scale-95 cursor-pointer shadow-2xs"
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

        {/* ─── RIGHT 5 COLS: AGENT WORKLOAD & STUCK RELEASES ─── */}
        <div className="lg:col-span-5 min-w-0 space-y-5">
          {/* A. Agent Workload */}
          <OverviewCard icon={Users} title="Agent Workload">
            {workload.length === 0 ? (
              <EmptyBlock message="No active agents found in workload." />
            ) : (
              <div className="space-y-3.5">
                {workload.map((w) => {
                  const totalProfiles = (w.active_profiles || 0) + (w.drafts || 0);
                  const activePct =
                    totalProfiles > 0
                      ? Math.round((w.active_profiles / totalProfiles) * 100)
                      : 0;
                  const isOverloaded = w.load === 'OVERLOADED';

                  return (
                    <div
                      key={w.id}
                      className={`p-2.5 rounded-xl transition-all duration-150 ${
                        isOverloaded
                          ? 'bg-rose-50/60 border border-rose-200 ring-1 ring-rose-200'
                          : 'bg-[#FAF8F5] border border-[#E9E4DC]/70'
                      } space-y-1.5 text-xs`}
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
                          <StatusPill label={w.load || 'BALANCED'} size="xs" />
                        </div>
                      </div>

                      {/* Stacked Rounded Bar (h-3) */}
                      <div className="w-full bg-[#E9E4DC] h-3 rounded-full overflow-hidden flex">
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
              <span className="text-[11px] text-[#7D766C] font-semibold bg-[#F4EFE7] px-2 py-0.5 rounded-full">
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
                    className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80 flex items-center justify-between gap-2 transition-all duration-120 hover:bg-[#F4EFE7]"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1E2022] truncate">
                        {rel.candidate_name || 'Candidate'} → {rel.source_name || 'Client'}
                      </div>
                      <div className="text-[10px] text-[#7D766C] truncate">
                        Agent: {rel.agent_name || 'Unassigned'} •{' '}
                        <span className="text-rose-600 font-semibold">
                          {rel.days_waiting}d waiting
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/release-requests')}
                      className="rounded-full px-3 py-1 border border-[#E9E4DC] bg-white text-[11px] font-semibold text-[#1F3B34] hover:bg-[#FAF8F5] shrink-0 transition-all duration-120 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </OverviewCard>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          5. PIPELINE STRIP & SECONDARY STATS
      ════════════════════════════════════════════════════════════════ */}
      <OverviewCard
        icon={Activity}
        title="Request Pipeline"
        rightAction={
          <Link
            href="/release-requests"
            className="text-xs font-semibold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Board</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {COLUMNS.map((col) => {
            const count = pipeline[col.key] || 0;
            return (
              <Link
                key={col.key}
                href="/release-requests"
                className="p-3 bg-[#FAF8F5] hover:bg-[#F4EFE7] rounded-xl border border-[#E9E4DC]/80 flex flex-col justify-between transition-all duration-120 hover:-translate-y-0.5 group shadow-2xs"
              >
                <span
                  className="text-[11px] font-semibold text-[#7D766C] truncate group-hover:text-[#1E2022]"
                  title={col.label}
                >
                  {col.label}
                </span>
                <span className="text-xl md:text-2xl font-bold text-[#1E2022] tabular-nums mt-1.5">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </OverviewCard>

      {/* Secondary Stats: 5 small KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          icon={FileCheck}
          label="AWAITING AGENT"
          numericValue={kpis.released_awaiting_agent ?? 0}
          value={kpis.released_awaiting_agent ?? 0}
          caption="Ready for download"
        />
        <KpiCard
          icon={CheckCircle2}
          label="COMPLETED"
          numericValue={kpis.completed_in_range ?? 0}
          value={kpis.completed_in_range ?? 0}
          caption={`In ${selectedDays > 0 ? `${selectedDays}d` : 'all-time'}`}
        />
        <KpiCard
          icon={Send}
          label="RELEASES"
          numericValue={kpis.releases_in_range ?? 0}
          value={kpis.releases_in_range ?? 0}
          delta={releasesDelta}
          caption={`In ${selectedDays > 0 ? `${selectedDays}d` : 'all-time'}`}
        />
        <KpiCard
          icon={Cpu}
          label="MATCH RUNS"
          numericValue={kpis.runs_in_range ?? 0}
          value={kpis.runs_in_range ?? 0}
          caption="Algorithm executions"
        />
        <KpiCard
          icon={Timer}
          label="AVG RESOLUTION"
          value={formatWaitingHours(kpis.avg_release_hours)}
          caption="Turnaround speed"
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          6. ANALYTICS ROW: 4 CARDS (SCORE QUALITY, HOT CANDIDATES, LOW-MATCH, ORPHANED)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A. Score Quality (Gauge) */}
        <OverviewCard icon={Sliders} title="Score Quality">
          <SemiCircleGauge
            total={`${scoreQuality.avg || 0}%`}
            totalCaption="Avg Compatibility"
            segments={scoreQualitySegments}
            ariaLabel="Match Score Quality Gauge"
          />
        </OverviewCard>

        {/* B. Hot Candidates */}
        <OverviewCard icon={Flame} title="Hot Candidates">
          {hotCandidates.length === 0 ? (
            <EmptyBlock message="No recurring candidates in current queue." />
          ) : (
            <div className="space-y-2.5 text-xs">
              {hotCandidates.slice(0, 5).map((c) => (
                <div
                  key={c.candidate_profile_id}
                  className="flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AvatarInitials name={c.candidate_name || ''} size="sm" />
                    <span
                      className="font-semibold text-[#1E2022] truncate max-w-[110px]"
                      title={c.candidate_name || 'Candidate'}
                    >
                      {c.candidate_name || 'Candidate'}
                    </span>
                  </div>
                  <span className="rounded-full px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0">
                    in {c.requests_count} reqs
                  </span>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>

        {/* C. Low-Match Desk */}
        <OverviewCard icon={AlertCircle} title="Low-Match Desk">
          {lowMatch.length === 0 ? (
            <EmptyBlock message="All profiles have healthy match candidate pools." />
          ) : (
            <div className="space-y-2.5 text-xs">
              {lowMatch.slice(0, 5).map((lm) => (
                <div
                  key={lm.profile_id}
                  onClick={() => router.push('/release-requests')}
                  className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/60 flex items-center justify-between gap-2 hover:bg-[#F4EFE7] transition-colors duration-120 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div
                      className="font-semibold text-[#1E2022] truncate max-w-[120px]"
                      title={lm.full_name || 'Profile'}
                    >
                      {lm.full_name || 'Profile'}
                    </div>
                    <div className="text-[10px] text-[#7D766C]">
                      {formatRelativeTime(lm.executed_at)}
                    </div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold shrink-0">
                    {lm.candidates} found
                  </span>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>

        {/* D. Orphaned Profiles */}
        <OverviewCard
          icon={ShieldAlert}
          title="Orphaned Profiles"
          className={
            orphaned.count > 0 ? 'border-rose-300 ring-1 ring-rose-200' : ''
          }
          badge={
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                orphaned.count > 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-[#F4EFE7] text-[#7D766C]'
              }`}
            >
              {orphaned.count}
            </span>
          }
        >
          {orphaned.count === 0 ? (
            <EmptyBlock message="All active profiles have assigned agents." />
          ) : (
            <div className="space-y-2 text-xs">
              {orphaned.items.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push('/profiles')}
                  className="p-2 bg-rose-50/60 border border-rose-200/60 rounded-xl flex items-center justify-between text-xs hover:bg-rose-100/60 transition-colors duration-120 cursor-pointer"
                >
                  <span
                    className="font-semibold text-[#1E2022] truncate max-w-[130px]"
                    title={p.full_name || 'Profile'}
                  >
                    {p.full_name || 'Profile'}
                  </span>
                  <span className="text-[10px] text-rose-700 font-bold">
                    Reassign
                  </span>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          7. RECENT RELEASES & FEEDBACK/REJECTIONS (Untracked sinks to bottom)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Releases */}
        <OverviewCard
          icon={Send}
          title="Recent Releases"
          rightAction={
            <Link
              href="/release-requests"
              className="text-xs font-semibold text-[#1F3B34] hover:underline"
            >
              View All
            </Link>
          }
        >
          {recentReleases.length === 0 ? (
            <EmptyBlock message="No recent releases completed in this period." />
          ) : (
            <div className="rounded-xl border border-[#E9E4DC]/80 overflow-hidden">
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E9E4DC] text-[11px] font-semibold uppercase tracking-wider text-[#7D766C]">
                      <th className="py-2.5 px-4 font-semibold">Candidate</th>
                      <th className="py-2.5 px-3 font-semibold">Client</th>
                      <th className="py-2.5 px-3 font-semibold">Agent</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E4DC]/60 bg-white">
                    {recentReleases.slice(0, 6).map((rel) => (
                      <tr
                        key={rel.release_id}
                        className="hover:bg-[#FAF8F5]/80 transition-colors duration-120"
                      >
                        <td className="py-2.5 px-4 font-semibold text-[#1E2022] truncate max-w-[130px]">
                          {rel.candidate_name || 'Candidate'}
                        </td>
                        <td className="py-2.5 px-3 text-[#4E473D] truncate max-w-[130px]">
                          {rel.source_name || 'Client'}
                        </td>
                        <td className="py-2.5 px-3 text-[#7D766C] truncate max-w-[120px]">
                          {rel.agent_name || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-[11px] text-[#7D766C] tabular-nums whitespace-nowrap">
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

        {/* Family Feedback & Rejections */}
        <OverviewCard icon={MessageSquare} title="Family Feedback & Rejections">
          {!feedback || !feedback.tracking_active ? (
            <UntrackedBox message="Not tracked yet" />
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-[#7D766C]">
                Structured feedback tracking active
              </div>
            </div>
          )}
        </OverviewCard>
      </div>
    </div>
  );
}
