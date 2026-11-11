'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Layers,
  Database,
  Sliders,
  ShieldAlert,
  Activity,
  Users,
  CheckCircle,
  FileText,
  Send,
  Cpu,
  BarChart3,
  TrendingUp,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import DualCapsuleBar from './DualCapsuleBar';
import DemographicsChart from './DemographicsChart';
import { DashboardService, type AdminOverviewData } from '@/lib/services/dashboard-service';
import {
  formatKarachiTime,
  formatDelta,
  getTurnaroundBadge,
  formatWaitingHours,
} from '@/lib/utils/overview-helpers';
import {
  OverviewCard,
  KpiCard,
  PageHeader,
  SegmentedTabs,
  StatusPill,
  AvatarInitials,
  SemiCircleGauge,
  TrendAreaChart,
  OverviewSkeleton,
  ErrorBlock,
  EmptyBlock,
  UntrackedBox,
  AlertStrip,
  FunnelBars,
} from './overview-ui';
import { toast } from 'sonner';

export default function AdminOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [teamTab, setTeamTab] = useState<'MANAGERS' | 'AGENTS'>('MANAGERS');

  const fetchData = async (days: number, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await DashboardService.getDashboardData('HIGH_LEVEL_ADMIN', days);
      if (!res) return;
      setData(res as AdminOverviewData);
      setLastUpdated(formatKarachiTime(new Date()));
      setError(null);
      setLoading(false);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'AbortError') return;
      console.error('[AdminOverview] load error:', err);
      setError(e?.message || 'Failed to load system dashboard');
      toast.error('Failed to load system overview');
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    DashboardService.getDashboardData('HIGH_LEVEL_ADMIN', selectedDays)
      .then((res) => {
        if (isCancelled || !res) return;
        setData(res as AdminOverviewData);
        setLastUpdated(formatKarachiTime(new Date()));
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        const e = err as { name?: string; message?: string };
        if (e?.name === 'AbortError') return;
        console.error('[AdminOverview] load error:', err);
        setError(e?.message || 'Failed to load system dashboard');
        toast.error('Failed to load system overview');
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
          message={error || 'Unable to connect to system RPC'}
          onRetry={() => void fetchData(selectedDays, true)}
        />
      </div>
    );
  }

  const kpis = data.kpis;
  const funnel = data.funnel || [];
  const heatmap = data.pool_heatmap || [];
  const trend = data.trend || [];
  const demandVsSupply = data.demand_vs_supply || [];
  const mandatoryCriteria = data.mandatory_criteria || [];
  const managers = data.managers || [];
  const agents = data.agents || [];
  const lowMatch = data.low_match || [];
  const scoreDist = data.score_distribution;
  const fieldsReleased = data.fields_released || [];
  const users = data.users;
  const dataQuality = data.data_quality;
  const rejections = data.rejections;
  const algorithm = data.algorithm;
  const auditLogs = data.auditLogs || [];
  const demographics = data.demographics;

  const requestsDelta =
    selectedDays > 0
      ? formatDelta(kpis.requests_in_range, kpis.requests_prev_range)
      : null;

  // Heatmap lookup
  const ageBuckets = ['18-22', '23-27', '28-32', '33-37', '38+'] as const;
  const heatmapCities = Array.from(new Set(heatmap.map((h) => h.city))).slice(0, 10);
  const heatMapLookup: Record<string, number> = {};
  heatmap.forEach((h) => {
    heatMapLookup[`${h.city}_${h.age_bucket}_${h.gender}`] = h.n;
  });

  // Score distribution gauge segments
  const totalScores =
    (scoreDist?.excellent || 0) +
    (scoreDist?.good || 0) +
    (scoreDist?.borderline || 0);

  const scoreDistSegments = [
    {
      id: 'excellent',
      label: 'Excellent (85+)',
      value: scoreDist?.excellent || 0,
      color: '#166534',
    },
    {
      id: 'good',
      label: 'Good (70-84)',
      value: scoreDist?.good || 0,
      color: '#A3B18A',
    },
    {
      id: 'borderline',
      label: 'Borderline (<70)',
      value: scoreDist?.borderline || 0,
      color: '#C86A4A',
    },
  ];

  // Maximum value for mandatory criteria ranking
  const maxCriterionVal = Math.max(...mandatoryCriteria.map((c) => c.n), 1);

  // Combined system alert counts
  const overdueCount = kpis.overdue_requests || 0;
  const inactiveAgentsCount = users?.agents_inactive_7d || 0;
  const missingPrefsCount = dataQuality?.active_without_preferences || 0;
  const hasSystemAlerts =
    overdueCount > 0 || inactiveAgentsCount > 0 || missingPrefsCount > 0;

  return (
    <div className="w-full min-w-0 space-y-5 font-sans">
      {/* ════════════════════════════════════════════════════════════════
          1. PAGE HEADER (with range segmented control)
      ════════════════════════════════════════════════════════════════ */}
      <PageHeader
        title="Executive Report"
        subtitle="Platform health, matchmaking throughput & demographic distribution"
        icon={Layers}
        lastUpdated={lastUpdated}
        onRefresh={() => void fetchData(selectedDays, true)}
        selectedDays={selectedDays}
        onRangeChange={setSelectedDays}
      />

      {/* ════════════════════════════════════════════════════════════════
          2. COMBINED ACTION ALERT STRIP
      ════════════════════════════════════════════════════════════════ */}
      {hasSystemAlerts && (
        <AlertStrip
          variant="amber"
          icon={AlertTriangle}
          message={
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">System Alerts:</span>
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                  {overdueCount} overdue requests
                </span>
              )}
              {inactiveAgentsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  {inactiveAgentsCount} inactive agents (7d)
                </span>
              )}
              {missingPrefsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 text-[11px] font-bold">
                  {missingPrefsCount} active profiles without preferences
                </span>
              )}
            </div>
          }
          actionText="Inspect Queue"
          actionHref="/requests"
        />
      )}

      {/* ════════════════════════════════════════════════════════════════
          3. ROW OF 6 KPI CARDS WITH ANIMATED NUMERALS & DELTA CHIPS
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={Users}
          label="ACTIVE PROFILES"
          numericValue={kpis.active_profiles ?? 0}
          value={kpis.active_profiles ?? 0}
          caption={`${kpis.draft_profiles || 0} draft / ${kpis.paused_profiles || 0} paused`}
          onClick={() => router.push('/profiles')}
        />
        <KpiCard
          icon={Clock}
          label="PENDING REQUESTS"
          numericValue={kpis.pending_requests ?? 0}
          value={kpis.pending_requests ?? 0}
          isAlert={(kpis.overdue_requests || 0) > 0}
          alertColor="red"
          caption={`${kpis.overdue_requests || 0} overdue`}
          onClick={() => router.push('/requests?column=first')}
        />
        <KpiCard
          icon={FileText}
          label="REQUESTS"
          numericValue={kpis.requests_in_range ?? 0}
          value={kpis.requests_in_range ?? 0}
          delta={requestsDelta}
          caption="Submitted in period"
          onClick={() => router.push('/requests')}
        />
        <KpiCard
          icon={Cpu}
          label="MATCH RUNS"
          numericValue={kpis.runs_in_range ?? 0}
          value={kpis.runs_in_range ?? 0}
          caption="Engine executions"
          onClick={() => router.push('/requests')}
        />
        <KpiCard
          icon={Send}
          label="RELEASES"
          numericValue={kpis.releases_in_range ?? 0}
          value={kpis.releases_in_range ?? 0}
          caption="Dossiers released"
          onClick={() => router.push('/requests?column=downloaded')}
        />
        <KpiCard
          icon={CheckCircle}
          label="COMPLETED"
          numericValue={kpis.completed_in_range ?? 0}
          value={kpis.completed_in_range ?? 0}
          caption={`Avg: ${formatWaitingHours(kpis.avg_release_hours)}`}
          onClick={() => router.push('/requests?column=done')}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          4. WEEKLY TREND (AREA CHART) & CONVERSION FUNNEL (TALL BARS)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Weekly Trend Area Chart */}
        <div className="lg:col-span-7 min-w-0">
          <OverviewCard icon={BarChart3} title="Weekly Activity Trend">
            <TrendAreaChart data={trend} ariaLabel="Weekly Activity Trend Line Chart" />
          </OverviewCard>
        </div>

        {/* Right 5 cols: Conversion Funnel (h-9 Tall Bars with Gradients) */}
        <div className="lg:col-span-5 min-w-0">
          <OverviewCard
            icon={TrendingUp}
            title="Conversion Funnel"
            rightAction={
              <span className="text-xs text-[#7D766C] font-medium">
                All-time distinct
              </span>
            }
          >
            <FunnelBars stages={funnel} />
          </OverviewCard>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          5. HERO "POOL HEATMAP" (Matrix with 5 Flat Opacity Steps)
      ════════════════════════════════════════════════════════════════ */}
      <OverviewCard
        icon={MapPin}
        title="Pool Heatmap (Active Candidates)"
        rightAction={
          /* Legend: 5 Flat Opacity Steps */
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#7D766C]">
            <span className="font-semibold uppercase text-[10px]">Gap:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1F3B34]/5 border border-[#E9E4DC]" />
              <span>0-1</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1F3B34]/15 border border-[#1F3B34]/20" />
              <span>2-4</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1F3B34]/30 border border-[#1F3B34]/30" />
              <span>5-9</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1F3B34]/55 border border-[#1F3B34]/50" />
              <span>10-19</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1F3B34]/80 text-white" />
              <span>20+</span>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Active Pool Ratio Dual Capsule Bar */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80">
            <DualCapsuleBar
              labelLeft="Active Grooms (M)"
              valueLeft={kpis.male_active || 0}
              pctLeft={
                (kpis.male_active || 0) + (kpis.female_active || 0) > 0
                  ? Math.round(
                      ((kpis.male_active || 0) /
                        ((kpis.male_active || 0) + (kpis.female_active || 0))) *
                        100
                    )
                  : 50
              }
              colorLeft="#1F3B34"
              labelRight="Active Brides (F)"
              valueRight={kpis.female_active || 0}
              pctRight={
                (kpis.male_active || 0) + (kpis.female_active || 0) > 0
                  ? 100 -
                    Math.round(
                      ((kpis.male_active || 0) /
                        ((kpis.male_active || 0) + (kpis.female_active || 0))) *
                        100
                    )
                  : 50
              }
              colorRight="#C86A4A"
              height={8}
            />
          </div>

          {/* Heatmap Matrix Table */}
          {heatmapCities.length === 0 ? (
            <EmptyBlock message="No pool demographic data available." />
          ) : (
            <div className="rounded-xl border border-[#E9E4DC]/80 overflow-hidden">
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E9E4DC] text-[11px] font-semibold uppercase tracking-wider text-[#7D766C]">
                      <th className="py-2.5 px-4 font-semibold">City</th>
                      {ageBuckets.map((b) => (
                        <th key={b} className="py-2.5 px-2 text-center font-semibold">
                          {b}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E4DC]/60 bg-white">
                    {heatmapCities.map((city) => (
                      <tr
                        key={city}
                        className="hover:bg-[#FAF8F5]/80 transition-colors duration-120"
                      >
                        <td className="py-2.5 px-4 font-semibold text-[#1E2022] whitespace-nowrap">
                          {city}
                        </td>
                        {ageBuckets.map((bucket) => {
                          const m = heatMapLookup[`${city}_${bucket}_MALE`] || 0;
                          const f = heatMapLookup[`${city}_${bucket}_FEMALE`] || 0;
                          const total = m + f;
                          const gap = Math.abs(m - f);

                          // 5 Discrete Opacity Fill Steps from Brand Token
                          let cellBg = 'bg-[#FAF8F5] text-[#7D766C]';
                          if (total > 0) {
                            if (gap <= 1) {
                              cellBg = 'bg-[#1F3B34]/5 text-[#1F3B34]';
                            } else if (gap <= 4) {
                              cellBg = 'bg-[#1F3B34]/15 text-[#1F3B34] font-semibold';
                            } else if (gap <= 9) {
                              cellBg = 'bg-[#1F3B34]/30 text-[#1F3B34] font-semibold';
                            } else if (gap <= 19) {
                              cellBg = 'bg-[#1F3B34]/55 text-white font-semibold';
                            } else {
                              cellBg = 'bg-[#1F3B34]/80 text-white font-semibold';
                            }
                          }

                          const cellTitle = `${city}, ${bucket}: Male ${m} / Female ${f}, gap ${gap}`;

                          return (
                            <td key={bucket} className="p-1.5 text-center">
                              <div
                                title={cellTitle}
                                className={`p-1.5 rounded-lg tabular-nums text-[11px] transition-all duration-120 cursor-help ${cellBg}`}
                              >
                                {total > 0 ? (
                                  <span>
                                    {m}M / {f}F
                                  </span>
                                ) : (
                                  <span className="text-[#A49C8F]">—</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </OverviewCard>

      {/* ════════════════════════════════════════════════════════════════
          6. DEMAND VS SUPPLY & MOST MANDATORY CRITERIA
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Demand vs Supply: Paired Bars per City */}
        <OverviewCard icon={MapPin} title="Demand vs Supply by City">
          {demandVsSupply.length === 0 ? (
            <EmptyBlock message="No mandatory location criteria recorded." />
          ) : (
            <div className="space-y-3 text-xs">
              {demandVsSupply.slice(0, 5).map((d) => (
                <div
                  key={d.city}
                  className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80 space-y-2 transition-all duration-120 hover:bg-[#F4EFE7]/80"
                >
                  <div className="font-semibold text-[#1E2022]">{d.city}</div>

                  {/* Pair 1: Groom Demand vs Bride Supply */}
                  <div className="flex items-center justify-between text-[11px] tabular-nums">
                    <span className="text-[#4E473D]">
                      Male Demand: <strong>{d.demand_from_males}</strong>
                    </span>
                    <span className="text-[#1F3B34] font-semibold">
                      Brides Available: <strong>{d.females_available}</strong>
                    </span>
                  </div>

                  {/* Pair 2: Bride Demand vs Groom Supply */}
                  <div className="flex items-center justify-between text-[11px] tabular-nums pt-1 border-t border-[#E9E4DC]/60">
                    <span className="text-[#4E473D]">
                      Female Demand: <strong>{d.demand_from_females}</strong>
                    </span>
                    <span className="text-[#C86A4A] font-semibold">
                      Grooms Available: <strong>{d.males_available}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>

        {/* Most Mandatory Criteria */}
        <OverviewCard icon={Sliders} title="Most Mandatory Criteria">
          {mandatoryCriteria.length === 0 ? (
            <EmptyBlock message="No mandatory criteria recorded." />
          ) : (
            <div className="space-y-3 text-xs">
              {mandatoryCriteria.slice(0, 8).map((c, i) => {
                const w = Math.max(4, Math.round((c.n / maxCriterionVal) * 100));

                return (
                  <div key={c.criterion} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#1E2022]">
                        {i + 1}. {c.criterion}
                      </span>
                      <strong className="text-[#1F3B34] tabular-nums">
                        {c.n} profiles
                      </strong>
                    </div>
                    <div className="w-full bg-[#FAF8F5] rounded-full h-2.5 overflow-hidden border border-[#E9E4DC]/60">
                      <div
                        className="bg-[#1F3B34] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </OverviewCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          7. FULL-WIDTH "TEAMS" TABBED TABLE
      ════════════════════════════════════════════════════════════════ */}
      <OverviewCard
        icon={Users}
        title="Team Operational Performance"
        rightAction={
          <div className="flex items-center gap-3">
            <SegmentedTabs
              tabs={[
                { id: 'MANAGERS', label: 'Managers', count: managers.length },
                { id: 'AGENTS', label: 'Agents', count: agents.length },
              ]}
              activeId={teamTab}
              onChange={(id) => setTeamTab(id as 'MANAGERS' | 'AGENTS')}
              size="sm"
            />
            {users?.agents_inactive_7d > 0 && (
              <span className="hidden sm:inline-flex px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full">
                {users.agents_inactive_7d} inactive
              </span>
            )}
          </div>
        }
      >
        {teamTab === 'MANAGERS' ? (
          <div className="rounded-xl border border-[#E9E4DC]/80 overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E9E4DC] text-[11px] font-semibold uppercase tracking-wider text-[#7D766C]">
                    <th className="py-2.5 px-4 font-semibold">Manager</th>
                    <th className="py-2.5 px-3 font-semibold">Releases Approved</th>
                    <th className="py-2.5 px-3 font-semibold">Match Runs</th>
                    <th className="py-2.5 px-4 font-semibold text-right">
                      Avg Turnaround
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E4DC]/60 bg-white">
                  {managers.map((m) => {
                    const badge = getTurnaroundBadge(m.avg_release_hours);

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-[#FAF8F5]/80 transition-colors duration-120"
                      >
                        <td className="py-3 px-4 font-semibold text-[#1E2022]">
                          <div className="flex items-center gap-2">
                            <AvatarInitials name={m.full_name} size="sm" />
                            <span>{m.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1F3B34] tabular-nums">
                          {m.releases_approved}
                        </td>
                        <td className="py-3 px-3 text-[#2F3E51] tabular-nums">
                          {m.runs}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          <StatusPill
                            label={`${badge.label} (${
                              m.avg_release_hours !== null
                                ? `${m.avg_release_hours}h`
                                : '—'
                            })`}
                            size="xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E9E4DC]/80 overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E9E4DC] text-[11px] font-semibold uppercase tracking-wider text-[#7D766C]">
                    <th className="py-2.5 px-4 font-semibold">Agent</th>
                    <th className="py-2.5 px-3 font-semibold">Active Profiles</th>
                    <th className="py-2.5 px-3 font-semibold">Drafts</th>
                    <th className="py-2.5 px-3 font-semibold">Created in Period</th>
                    <th className="py-2.5 px-3 font-semibold">Requests</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E4DC]/60 bg-white">
                  {agents.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-[#FAF8F5]/80 transition-colors duration-120"
                    >
                      <td className="py-3 px-4 font-semibold text-[#1E2022]">
                        <div className="flex items-center gap-2">
                          <AvatarInitials name={a.full_name} size="sm" />
                          <span>{a.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1F3B34] tabular-nums">
                        {a.active_profiles}
                      </td>
                      <td className="py-3 px-3 text-amber-700 tabular-nums">
                        {a.drafts}
                      </td>
                      <td className="py-3 px-3 text-[#4E473D] tabular-nums">
                        {a.profiles_created}
                      </td>
                      <td className="py-3 px-3 text-[#2F3E51] tabular-nums">
                        {a.requests}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                        {a.completed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </OverviewCard>

      {/* ════════════════════════════════════════════════════════════════
          8. MATCHING ANALYTICS: SCORE DISTRIBUTION, LOW-MATCH, REJECTIONS
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Score Distribution (Gauge) */}
        <OverviewCard icon={Sliders} title="Score Distribution">
          <SemiCircleGauge
            total={totalScores}
            totalCaption="Total Runs"
            segments={scoreDistSegments}
            ariaLabel="Score Distribution Gauge"
          />
        </OverviewCard>

        {/* Low-Match Profiles */}
        <OverviewCard
          icon={Clock}
          title="Low-Match Profiles"
          badge={
            <span className="text-[11px] text-[#7D766C] font-semibold bg-[#F4EFE7] px-2 py-0.5 rounded-full">
              {lowMatch.length}
            </span>
          }
        >
          {lowMatch.length === 0 ? (
            <EmptyBlock message="No candidate bottlenecks detected." />
          ) : (
            <div className="space-y-2.5 text-xs">
              {lowMatch.slice(0, 4).map((l) => (
                <div
                  key={l.profile_id}
                  onClick={() => router.push(`/matching?profileId=${l.profile_id}`)}
                  className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80 flex items-center justify-between gap-2 hover:bg-[#F4EFE7] transition-colors duration-120 cursor-pointer"
                >
                  <span
                    className="font-semibold text-[#1E2022] truncate max-w-[130px]"
                    title={l.full_name || 'Client'}
                  >
                    {l.full_name || 'Client'}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full tabular-nums shrink-0">
                    {l.candidates} found
                  </span>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>

        {/* Rejections (Sinks to bottom if inactive) */}
        <OverviewCard icon={Clock} title="Family Rejections">
          {!rejections || !rejections.tracking_active ? (
            <UntrackedBox message="Not tracked yet" />
          ) : (
            <div className="space-y-2 text-xs">
              {rejections.top_reasons?.map((tr) => (
                <div
                  key={tr.reason}
                  className="flex justify-between border-b border-[#E9E4DC]/60 pb-1.5 text-[11px]"
                >
                  <span className="text-[#4E473D] truncate">{tr.reason}</span>
                  <strong className="text-[#1E2022] tabular-nums">{tr.n}</strong>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          9. DIAGNOSTICS & SYSTEM DATA: FIELDS RELEASED, DATA QUALITY, USERS
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Fields Released (with red SENSITIVE pill) */}
        <OverviewCard icon={ShieldAlert} title="Fields Released by Managers">
          {fieldsReleased.length === 0 ? (
            <EmptyBlock message="No field releases recorded in period." />
          ) : (
            <div className="space-y-2 text-xs">
              {fieldsReleased.slice(0, 7).map((f) => (
                <div
                  key={f.field}
                  className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-[11px] font-semibold text-[#1E2022] truncate"
                      title={f.field}
                    >
                      {f.field}
                    </span>
                    {f.sensitive && (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-full">
                        SENSITIVE
                      </span>
                    )}
                  </div>
                  <strong className="text-[#1F3B34] tabular-nums shrink-0 font-semibold">
                    {f.n}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </OverviewCard>

        {/* Data Quality */}
        <OverviewCard icon={Database} title="Data Hygiene">
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#4E473D]">Active w/o Preferences:</span>
              <strong className="text-[#C86A4A] tabular-nums font-semibold">
                {dataQuality?.active_without_preferences ?? 0}
              </strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#4E473D]">Stale Drafts (&gt;14d):</span>
              <strong className="text-amber-700 tabular-nums font-semibold">
                {dataQuality?.stale_drafts_14d ?? 0}
              </strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#4E473D]">Active w/o Agent:</span>
              <strong className="text-rose-600 tabular-nums font-semibold">
                {dataQuality?.active_without_agent ?? 0}
              </strong>
            </div>

            {dataQuality?.top_other_caste && dataQuality.top_other_caste.length > 0 && (
              <div className="pt-2 border-t border-[#E9E4DC]/60 space-y-1.5">
                <span className="text-[10px] font-bold text-[#7D766C] uppercase">
                  Unmapped Castes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dataQuality.top_other_caste.slice(0, 3).map((c) => (
                    <span
                      key={c.value}
                      className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E9E4DC] text-[10px] text-[#1E2022] rounded-full"
                    >
                      {c.value} ({c.n})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </OverviewCard>

        {/* Users by Role & Status + Algorithm Versions */}
        <OverviewCard icon={Users} title="Users & Engine Versions">
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {users?.by_role?.map((ur, idx) => (
                <div
                  key={`${ur.role}-${ur.status}-${idx}`}
                  className="p-2 bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]/80"
                >
                  <div className="font-semibold text-[#1E2022]">{ur.role}</div>
                  <div className="text-base font-bold text-[#1F3B34] tabular-nums">
                    {ur.n}
                  </div>
                  <div className="text-[9px] font-semibold text-[#7D766C] uppercase">
                    {ur.status}
                  </div>
                </div>
              ))}
            </div>

            {/* Algorithm Versions */}
            <div className="pt-2 border-t border-[#E9E4DC]/60">
              <span className="text-[10px] font-bold text-[#7D766C] uppercase block mb-1">
                Algorithm Versions
              </span>
              <div className="space-y-1">
                {algorithm?.versions && algorithm.versions.length > 0 ? (
                  algorithm.versions.map((v) => (
                    <div
                      key={v.version}
                      className="p-1.5 bg-[#FAF8F5] rounded-lg border border-[#E9E4DC]/60 flex justify-between text-[11px]"
                    >
                      <span className="font-mono font-semibold text-[#1E2022]">
                        {v.version || 'v1.0.0'}
                      </span>
                      <span className="text-[#1F3B34] font-semibold tabular-nums">
                        {v.runs} runs
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-1.5 bg-[#FAF8F5] rounded-lg border border-[#E9E4DC]/60 text-xs text-[#7D766C]">
                    Deterministic Engine v1.0
                  </div>
                )}
              </div>
            </div>
          </div>
        </OverviewCard>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          10. RECENT SYSTEM ACTIVITY (AUDIT LOGS) & DEMOGRAPHICS
      ════════════════════════════════════════════════════════════════ */}
      <OverviewCard icon={Activity} title="Recent System Activity (Audit Log)">
        {auditLogs.length === 0 ? (
          <EmptyBlock message="No recent activity recorded." />
        ) : (
          <div className="divide-y divide-[#E9E4DC]/60 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/80 px-2 rounded-lg transition-colors duration-120"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[#1E2022] truncate max-w-[340px]">
                    {log.details || log.action}
                  </div>
                  <div className="text-[10px] text-[#7D766C]">
                    By {log.actor_name} • {log.action}
                  </div>
                </div>
                <span className="text-[11px] text-[#7D766C] tabular-nums shrink-0 whitespace-nowrap">
                  {log.created_at_relative}
                </span>
              </div>
            ))}
          </div>
        )}
      </OverviewCard>

      {/* Demographics Widget (Rule 14) */}
      {demographics && (
        <OverviewCard icon={BarChart3} title="Demographic Distribution">
          <DemographicsChart demographics={demographics} />
        </OverviewCard>
      )}
    </div>
  );
}
