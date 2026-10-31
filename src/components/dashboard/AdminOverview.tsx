'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Clock,
  ExternalLink,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Database,
  Sliders,
  ShieldAlert,
  Activity,
  Users,
} from 'lucide-react';
import DualCapsuleBar from './DualCapsuleBar';
import DemographicsChart from './DemographicsChart';
import { DashboardService, type AdminOverviewData } from '@/lib/services/dashboard-service';
import {
  formatKarachiDate,
  formatKarachiTime,
  formatDelta,
  getTurnaroundBadge,
} from '@/lib/utils/overview-helpers';
import { toast } from 'sonner';

export default function AdminOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [teamTab, setTeamTab] = useState<'MANAGERS' | 'AGENTS'>('MANAGERS');

  const loadData = async (days: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await DashboardService.getDashboardData('HIGH_LEVEL_ADMIN', days);
      if (!res) return;
      setData(res as AdminOverviewData);
      setLastUpdated(formatKarachiTime(new Date()));
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('[AdminOverview] load error:', err);
      setError(err.message || 'Failed to load system dashboard');
      toast.error('Failed to load system overview');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDays);
  }, [selectedDays]);

  // --------------------------------------------------------------------------
  // SKELETON STATE (Rule 2: Flat static blocks)
  // --------------------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="w-full min-w-0 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#E9E4DC]">
          <div className="h-6 w-44 bg-[#E9E4DC]" />
          <div className="h-7 w-48 bg-[#E9E4DC]" />
        </div>
        <div className="h-28 bg-[#E9E4DC] border border-[#E9E4DC]" />
        <div className="h-44 bg-[#E9E4DC] border border-[#E9E4DC]" />
        <div className="h-64 bg-[#E9E4DC] border border-[#E9E4DC]" />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="w-full min-w-0 p-6 border border-[#DC2626] bg-[#FEF2F2] text-[#991B1B] space-y-3 rounded-[2px]">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>Error Loading System Overview</span>
        </div>
        <p className="text-xs text-[#7F1D1D]">{error || 'Unable to connect to system RPC'}</p>
        <button
          onClick={() => loadData(selectedDays)}
          className="px-3 py-1.5 bg-[#1F3B34] text-white text-xs font-bold rounded-[2px] transition-colors duration-120 hover:bg-[#172E29] cursor-pointer"
        >
          Retry
        </button>
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

  const requestsDelta = selectedDays > 0 ? formatDelta(kpis.requests_in_range, kpis.requests_prev_range) : null;

  // Heatmap cities and age buckets
  const ageBuckets = ['18-22', '23-27', '28-32', '33-37', '38+'] as const;
  const heatmapCities = Array.from(new Set(heatmap.map((h) => h.city))).slice(0, 10);
  const heatMapLookup: Record<string, number> = {};
  heatmap.forEach((h) => {
    heatMapLookup[`${h.city}_${h.age_bucket}_${h.gender}`] = h.n;
  });

  // Score distribution percentages
  const totalScores = (scoreDist?.excellent || 0) + (scoreDist?.good || 0) + (scoreDist?.borderline || 0);
  const excellentPct = totalScores > 0 ? Math.round((scoreDist.excellent / totalScores) * 100) : 0;
  const goodPct = totalScores > 0 ? Math.round((scoreDist.good / totalScores) * 100) : 0;
  const borderlinePct = totalScores > 0 ? 100 - excellentPct - goodPct : 0;

  // Maximum value for trend grouped columns
  const maxTrendVal = Math.max(
    ...trend.map((t) => Math.max(t.profiles || 0, t.requests || 0)),
    5
  );

  // Maximum value for mandatory criteria ranking
  const maxCriterionVal = Math.max(...mandatoryCriteria.map((c) => c.n), 1);

  // Base stage value for Funnel width sizing
  const maxFunnelVal = Math.max(...funnel.map((f) => f.n), 1);

  return (
    <div className="w-full min-w-0 space-y-5 font-sans">
      {/* ════════════════════════════════════════════════════════════════
          HEADER: TITLE, RANGE SELECTOR, LAST UPDATED
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E9E4DC]">
        <div>
          <h1 className="text-xl font-bold text-[#1F3B34] tracking-tight">
            System Executive Overview
          </h1>
          <p className="text-xs text-[#7D766C]">
            Phase 1 operational telemetry, pool balance, matching funnel & data hygiene
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {lastUpdated && (
            <span className="text-[11px] text-[#7D766C] tabular-nums whitespace-nowrap">
              Last updated {lastUpdated}
            </span>
          )}
          <button
            onClick={() => loadData(selectedDays)}
            aria-label="Refresh overview"
            title="Refresh overview"
            className="p-1 text-[#7D766C] hover:text-[#1F3B34] transition-colors duration-120 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Joined Segmented Control */}
          <div className="inline-flex border border-[#E9E4DC] divide-x divide-[#E9E4DC] bg-white rounded-[2px] text-xs font-bold">
            {[
              { label: '7d', days: 7 },
              { label: '30d', days: 30 },
              { label: '90d', days: 90 },
              { label: 'All', days: 0 },
            ].map((tab) => (
              <button
                key={tab.days}
                onClick={() => setSelectedDays(tab.days)}
                className={`px-3 py-1 transition-colors duration-120 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1F3B34] ${
                  selectedDays === tab.days
                    ? 'bg-[#1F3B34] text-white'
                    : 'text-[#7D766C] hover:bg-[#FAF8F5] hover:text-[#1E2022]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          KPI ROW: 6 LARGE NUMERALS SEPARATED BY HAIRLINES
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#E9E4DC]">
        {/* KPI 1: Active Profiles */}
        <Link
          href="/directory"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block truncate">
              Active Profiles
            </span>
            <div className="text-2xl font-bold text-[#1F3B34] tabular-nums mt-1">
              {kpis.active_profiles ?? 0}
            </div>
          </div>
          <span className="text-[10px] text-[#7D766C] tabular-nums mt-1 truncate">
            {kpis.draft_profiles ?? 0} drafts, {kpis.paused_profiles ?? 0} paused
          </span>
        </Link>

        {/* KPI 2: Pending Requests */}
        <Link
          href="/requests"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block truncate">
              Pending Requests
            </span>
            <div className="text-2xl font-bold text-[#8B6122] tabular-nums mt-1">
              {kpis.pending_requests ?? 0}
            </div>
          </div>
          <span className="text-[10px] text-[#DC2626] font-semibold tabular-nums mt-1 truncate">
            {kpis.overdue_requests ?? 0} overdue (&gt;24h)
          </span>
        </Link>

        {/* KPI 3: Requests in Range */}
        <div className="p-3.5 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] truncate">
                Requests
              </span>
              {requestsDelta && (
                <span
                  className={`px-1 py-0.5 border text-[9px] font-bold rounded-[2px] inline-flex items-center gap-0.5 ${
                    requestsDelta.isPositive ? 'bg-[#E5EFE9] text-[#166534] border-[#C2DDD0]' : 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                  }`}
                >
                  {requestsDelta.isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {requestsDelta.text}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-[#1E2022] tabular-nums mt-1">
              {kpis.requests_in_range ?? 0}
            </div>
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">in period</span>
        </div>

        {/* KPI 4: Runs in Range */}
        <div className="p-3.5 min-w-0 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block truncate">
              Match Runs
            </span>
            <div className="text-2xl font-bold text-[#2F3E51] tabular-nums mt-1">
              {kpis.runs_in_range ?? 0}
            </div>
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">official engine executions</span>
        </div>

        {/* KPI 5: Releases in Range */}
        <div className="p-3.5 min-w-0 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block truncate">
              Releases
            </span>
            <div className="text-2xl font-bold text-[#1F3B34] tabular-nums mt-1">
              {kpis.releases_in_range ?? 0}
            </div>
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">approved dossiers</span>
        </div>

        {/* KPI 6: Completed in Range */}
        <div className="p-3.5 min-w-0 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block truncate">
              Completed
            </span>
            <div className="text-2xl font-bold text-[#166534] tabular-nums mt-1">
              {kpis.completed_in_range ?? 0}
            </div>
          </div>
          <span className="text-[10px] text-[#7D766C] tabular-nums mt-1 truncate">
            Avg: {kpis.avg_release_hours !== null ? `${kpis.avg_release_hours}h` : '—'}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          FULL-WIDTH "CONVERSION FUNNEL" BAND (7 ROWS)
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
            Conversion Funnel
          </span>
          <span className="text-[10px] text-[#7D766C]">
            All-time, by distinct profile
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {funnel.map((f, i) => {
            const prevN = i > 0 ? funnel[i - 1].n : null;
            const dropOff = prevN !== null && prevN > 0 && f.n < prevN
              ? Math.round(((prevN - f.n) / prevN) * 100)
              : null;
            const barWidth = Math.max(4, Math.round((f.n / maxFunnelVal) * 100));

            return (
              <div key={f.stage} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-3 sm:col-span-2 font-bold text-[#1E2022] truncate text-xs">
                  {f.stage}
                </div>
                <div className="col-span-6 sm:col-span-8 flex items-center gap-2">
                  <div className="w-full bg-[#FAF8F5] border border-[#E9E4DC] h-3 rounded-none overflow-hidden p-0.5">
                    <div
                      className="bg-[#1F3B34] h-full transition-all duration-120"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-3 sm:col-span-2 text-right flex items-center justify-end gap-2 tabular-nums">
                  <strong className="text-[#1E2022]">{f.n}</strong>
                  {dropOff !== null ? (
                    <span className="text-[10px] font-semibold text-[#DC2626]">
                      -{dropOff}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#7D766C]">base</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          FULL-WIDTH HERO "POOL HEATMAP" (Matrix, 5 Discrete Flat Steps)
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E9E4DC]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Pool Heatmap (Active Candidates)
            </span>
            <p className="text-[11px] text-[#7D766C]">
              Cross-tabulation of City by Age Bracket with Male / Female ratios
            </p>
          </div>

          {/* Legend: 5 Discrete Flat Squares (No Gradients) */}
          <div className="flex items-center gap-3 text-[10px] text-[#7D766C]">
            <span className="font-semibold uppercase">Gap:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[1px] bg-[#F2EDE1] border border-[#E9E4DC]" />
              <span>0-1</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[1px] bg-[#E5EFE9] border border-[#C2DDD0]" />
              <span>2-4</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[1px] bg-[#D1FAE5] border border-[#A7F3D0]" />
              <span>5-9</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[1px] bg-[#A7F3D0] border border-[#6EE7B7]" />
              <span>10-19</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[1px] bg-[#6EE7B7] border border-[#34D399]" />
              <span>20+</span>
            </div>
          </div>
        </div>

        {heatmapCities.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#7D766C]">
            No pool demographic data available.
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E4DC] text-[10px] font-bold uppercase tracking-wider text-[#7D766C]">
                  <th className="py-2 pr-3 font-semibold">City</th>
                  {ageBuckets.map((b) => (
                    <th key={b} className="py-2 px-2 text-center font-semibold">
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E4DC]">
                {heatmapCities.map((city) => (
                  <tr key={city} className="hover:bg-[#FAF8F5] transition-colors duration-120">
                    <td className="py-2 pr-3 font-bold text-[#1E2022] whitespace-nowrap">
                      {city}
                    </td>
                    {ageBuckets.map((bucket) => {
                      const m = heatMapLookup[`${city}_${bucket}_MALE`] || 0;
                      const f = heatMapLookup[`${city}_${bucket}_FEMALE`] || 0;
                      const total = m + f;
                      const gap = Math.abs(m - f);

                      // 5 DISCRETE Flat Steps based on gap (No gradients)
                      let cellStyle = 'bg-[#FAF8F5] text-[#7D766C] border-[#E9E4DC]';
                      if (total > 0) {
                        if (gap <= 1) {
                          cellStyle = 'bg-[#F2EDE1] text-[#4E473D] border-[#E2D9C8]';
                        } else if (gap <= 4) {
                          cellStyle = m > f
                            ? 'bg-[#E5EFE9] text-[#1F3B34] border-[#C2DDD0]'
                            : 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]';
                        } else if (gap <= 9) {
                          cellStyle = m > f
                            ? 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]'
                            : 'bg-[#FDE68A] text-[#854D0E] border-[#FCD34D]';
                        } else if (gap <= 19) {
                          cellStyle = m > f
                            ? 'bg-[#A7F3D0] text-[#064E3B] border-[#6EE7B7]'
                            : 'bg-[#FCD34D] text-[#78350F] border-[#F59E0B]';
                        } else {
                          cellStyle = m > f
                            ? 'bg-[#6EE7B7] text-[#064E3B] border-[#34D399]'
                            : 'bg-[#F59E0B] text-white border-[#D97706]';
                        }
                      }

                      return (
                        <td key={bucket} className="p-1 text-center">
                          <div className={`p-1.5 border rounded-[2px] font-medium tabular-nums text-[11px] ${cellStyle}`}>
                            {total > 0 ? (
                              <span>{m}M / {f}F</span>
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
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2 COLUMNS: WEEKLY TREND (GROUPED COLUMNS) & DEMAND VS SUPPLY
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Weekly Trend as Grouped Columns (No Line Chart with Markers) */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Weekly Trend
              </span>
              <p className="text-[11px] text-[#7D766C]">
                Profiles Created vs Requests Submitted
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1 text-[#1F3B34]">
                <span className="w-2.5 h-2.5 rounded-[1px] bg-[#1F3B34]" />
                <span>Profiles</span>
              </div>
              <div className="flex items-center gap-1 text-[#2F3E51]">
                <span className="w-2.5 h-2.5 rounded-[1px] bg-[#2F3E51]" />
                <span>Requests</span>
              </div>
            </div>
          </div>

          {trend.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7D766C]">
              No trend series data in period.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-44 flex items-end gap-2 pt-4 px-1 border-b border-[#E9E4DC]">
                {trend.map((t) => {
                  const pHeight = Math.max(3, Math.round(((t.profiles || 0) / maxTrendVal) * 100));
                  const rHeight = Math.max(3, Math.round(((t.requests || 0) / maxTrendVal) * 100));

                  return (
                    <div key={t.week} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        {/* Profiles Column */}
                        <div
                          className="w-1/2 bg-[#1F3B34] transition-all duration-120"
                          style={{ height: `${pHeight}%` }}
                          title={`Week ${t.week}: ${t.profiles} profiles`}
                        />
                        {/* Requests Column */}
                        <div
                          className="w-1/2 bg-[#2F3E51] transition-all duration-120"
                          style={{ height: `${rHeight}%` }}
                          title={`Week ${t.week}: ${t.requests} requests`}
                        />
                      </div>
                      <span className="text-[9px] text-[#7D766C] tabular-nums truncate max-w-full">
                        {new Date(t.week).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Demand vs Supply: Paired Bars per City */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Demand vs Supply
              </span>
              <p className="text-[11px] text-[#7D766C]">
                People who made this city mandatory vs available opposite-gender profiles
              </p>
            </div>
          </div>

          {demandVsSupply.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7D766C]">
              No mandatory location criteria recorded.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {demandVsSupply.slice(0, 5).map((d) => (
                <div key={d.city} className="p-2.5 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] space-y-1.5">
                  <div className="font-bold text-[#1E2022]">{d.city}</div>

                  {/* Pair 1: Groom Demand vs Bride Supply */}
                  <div className="flex items-center justify-between text-[10.5px] tabular-nums">
                    <span className="text-[#4E473D]">Male Demand: <strong>{d.demand_from_males}</strong></span>
                    <span className="text-[#1F3B34]">Brides Available: <strong>{d.females_available}</strong></span>
                  </div>

                  {/* Pair 2: Bride Demand vs Groom Supply */}
                  <div className="flex items-center justify-between text-[10.5px] tabular-nums pt-0.5 border-t border-[#E9E4DC]">
                    <span className="text-[#4E473D]">Female Demand: <strong>{d.demand_from_females}</strong></span>
                    <span className="text-[#1F3B34]">Grooms Available: <strong>{d.males_available}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          2 COLUMNS: MOST MANDATORY CRITERIA & FIELDS RELEASED
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Most Mandatory Criteria */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Most Mandatory Criteria
            </span>
            <Sliders className="w-3.5 h-3.5 text-[#1F3B34]" />
          </div>

          {mandatoryCriteria.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7D766C]">
              No mandatory criteria recorded.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {mandatoryCriteria.slice(0, 8).map((c, i) => {
                const w = Math.max(4, Math.round((c.n / maxCriterionVal) * 100));

                return (
                  <div key={c.criterion} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#1E2022]">{i + 1}. {c.criterion}</span>
                      <strong className="text-[#1F3B34] tabular-nums">{c.n} profiles</strong>
                    </div>
                    <div className="w-full bg-[#FAF8F5] border border-[#E9E4DC] h-2 rounded-none overflow-hidden">
                      <div className="bg-[#1F3B34] h-full" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fields Released with SENSITIVE Tag */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Fields Released by Managers
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#C86A4A]" />
          </div>

          {fieldsReleased.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7D766C]">
              No field releases recorded in period.
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              {fieldsReleased.slice(0, 8).map((f) => (
                <div key={f.field} className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[11px] font-semibold text-[#1E2022] truncate" title={f.field}>
                      {f.field}
                    </span>
                    {f.sensitive && (
                      <span className="px-1.5 py-0.2 border border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626] text-[9px] font-bold rounded-[2px]">
                        SENSITIVE
                      </span>
                    )}
                  </div>
                  <strong className="text-[#1F3B34] tabular-nums shrink-0">{f.n}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          FULL-WIDTH "TEAMS" TABBED TABLE
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E9E4DC]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Team Operational Performance
            </span>

            {/* Joined Square Tabs */}
            <div className="inline-flex border border-[#E9E4DC] divide-x divide-[#E9E4DC] bg-white rounded-[2px] text-xs font-bold">
              <button
                onClick={() => setTeamTab('MANAGERS')}
                className={`px-3 py-0.5 transition-colors duration-120 cursor-pointer ${
                  teamTab === 'MANAGERS' ? 'bg-[#1F3B34] text-white' : 'text-[#7D766C] hover:bg-[#FAF8F5]'
                }`}
              >
                Managers ({managers.length})
              </button>
              <button
                onClick={() => setTeamTab('AGENTS')}
                className={`px-3 py-0.5 transition-colors duration-120 cursor-pointer ${
                  teamTab === 'AGENTS' ? 'bg-[#1F3B34] text-white' : 'text-[#7D766C] hover:bg-[#FAF8F5]'
                }`}
              >
                Agents ({agents.length})
              </button>
            </div>
          </div>

          {users?.agents_inactive_7d > 0 && (
            <span className="px-2 py-0.5 border border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626] text-xs font-bold rounded-[2px] self-start sm:self-auto">
              {users.agents_inactive_7d} agents inactive 7+ days
            </span>
          )}
        </div>

        {teamTab === 'MANAGERS' ? (
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E9E4DC] text-[10px] font-bold uppercase tracking-wider text-[#7D766C]">
                  <th className="pb-2 font-semibold">Manager</th>
                  <th className="pb-2 font-semibold">Releases Approved</th>
                  <th className="pb-2 font-semibold">Match Runs</th>
                  <th className="pb-2 font-semibold text-right">Avg Turnaround</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E4DC]">
                {managers.map((m) => {
                  const badge = getTurnaroundBadge(m.avg_release_hours);

                  return (
                    <tr key={m.id} className="hover:bg-[#FAF8F5] transition-colors duration-120">
                      <td className="py-2.5 font-bold text-[#1E2022]">{m.full_name}</td>
                      <td className="py-2.5 font-semibold text-[#1F3B34] tabular-nums">{m.releases_approved}</td>
                      <td className="py-2.5 text-[#2F3E51] tabular-nums">{m.runs}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={`px-1.5 py-0.5 border text-[9.5px] font-bold rounded-[2px] ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label} ({m.avg_release_hours !== null ? `${m.avg_release_hours}h` : '—'})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E9E4DC] text-[10px] font-bold uppercase tracking-wider text-[#7D766C]">
                  <th className="pb-2 font-semibold">Agent</th>
                  <th className="pb-2 font-semibold">Active Profiles</th>
                  <th className="pb-2 font-semibold">Drafts</th>
                  <th className="pb-2 font-semibold">Created in Period</th>
                  <th className="pb-2 font-semibold">Requests</th>
                  <th className="pb-2 font-semibold text-right">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E4DC]">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAF8F5] transition-colors duration-120">
                    <td className="py-2.5 font-bold text-[#1E2022]">{a.full_name}</td>
                    <td className="py-2.5 font-semibold text-[#1F3B34] tabular-nums">{a.active_profiles}</td>
                    <td className="py-2.5 text-[#8B6122] tabular-nums">{a.drafts}</td>
                    <td className="py-2.5 text-[#4E473D] tabular-nums">{a.profiles_created}</td>
                    <td className="py-2.5 text-[#2F3E51] tabular-nums">{a.requests}</td>
                    <td className="py-2.5 text-right font-bold text-[#166534] tabular-nums">{a.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3 COLUMNS: SCORE DISTRIBUTION, LOW-MATCH PROFILES, REJECTIONS
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Score Distribution */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Score Distribution
            </span>
          </div>

          {totalScores === 0 ? (
            <div className="py-6 text-center text-xs text-[#7D766C]">
              No runs in period.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="w-full bg-[#E9E4DC] h-2.5 flex rounded-none overflow-hidden">
                <div className="bg-[#166534] h-full" style={{ width: `${excellentPct}%` }} title="Excellent" />
                <div className="bg-[#D97706] h-full" style={{ width: `${goodPct}%` }} title="Good" />
                <div className="bg-[#C86A4A] h-full" style={{ width: `${borderlinePct}%` }} title="Borderline" />
              </div>

              <div className="space-y-1.5 text-[11px] tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[#166534] font-semibold">Excellent (85+)</span>
                  <strong>{scoreDist.excellent} ({excellentPct}%)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#D97706] font-semibold">Good (70-84)</span>
                  <strong>{scoreDist.good} ({goodPct}%)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C86A4A] font-semibold">Borderline (&lt;70)</span>
                  <strong>{scoreDist.borderline} ({borderlinePct}%)</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Low-Match Profiles */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Low-Match Profiles
            </span>
            <span className="text-[10px] text-[#7D766C] tabular-nums">{lowMatch.length}</span>
          </div>

          {lowMatch.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7D766C]">
              No candidate bottlenecks.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {lowMatch.slice(0, 4).map((l) => (
                <div
                  key={l.profile_id}
                  onClick={() => router.push(`/matching?profileId=${l.profile_id}`)}
                  className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] flex items-center justify-between gap-1 cursor-pointer hover:bg-white transition-colors duration-120"
                >
                  <span className="font-semibold text-[#1E2022] truncate max-w-[130px]">{l.full_name || 'Client'}</span>
                  <span className="px-1.5 py-0.5 border border-[#E9E4DC] bg-white text-[10px] font-bold text-[#C86A4A] rounded-[2px] tabular-nums shrink-0">
                    {l.candidates} found
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejections */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Family Rejections
            </span>
          </div>

          {(!rejections || !rejections.tracking_active) ? (
            <div className="p-6 border border-[#E9E4DC] bg-[#FAF8F5] text-center text-xs text-[#7D766C] rounded-[2px]">
              Not tracked yet
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {rejections.top_reasons?.map((tr) => (
                <div key={tr.reason} className="flex justify-between border-b border-[#E9E4DC] pb-1 text-[11px]">
                  <span className="text-[#4E473D] truncate">{tr.reason}</span>
                  <strong className="text-[#1E2022] tabular-nums">{tr.n}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          3 COLUMNS: DATA QUALITY, USERS BY ROLE, ALGORITHM VERSIONS
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Data Quality */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Data Quality
            </span>
            <Database className="w-3.5 h-3.5 text-[#1F3B34]" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#4E473D]">Active w/o Preferences:</span>
              <strong className="text-[#C86A4A] tabular-nums">{dataQuality?.active_without_preferences ?? 0}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#4E473D]">Stale Drafts (&gt;14d):</span>
              <strong className="text-[#8B6122] tabular-nums">{dataQuality?.stale_drafts_14d ?? 0}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#4E473D]">Active w/o Agent:</span>
              <strong className="text-[#DC2626] tabular-nums">{dataQuality?.active_without_agent ?? 0}</strong>
            </div>

            {dataQuality?.top_other_caste && dataQuality.top_other_caste.length > 0 && (
              <div className="pt-2 border-t border-[#E9E4DC] space-y-1">
                <span className="text-[10px] font-bold text-[#7D766C] uppercase">Unmapped Castes:</span>
                <div className="flex flex-wrap gap-1">
                  {dataQuality.top_other_caste.slice(0, 3).map((c) => (
                    <span key={c.value} className="px-1.5 py-0.5 bg-[#FAF8F5] border border-[#E9E4DC] text-[10px] text-[#1E2022] rounded-[2px]">
                      {c.value} ({c.n})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Users by Role */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Users by Role & Status
            </span>
            <Users className="w-3.5 h-3.5 text-[#1F3B34]" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {users?.by_role?.map((ur, idx) => (
              <div key={`${ur.role}-${ur.status}-${idx}`} className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px]">
                <div className="font-bold text-[#1E2022]">{ur.role}</div>
                <div className="text-sm font-bold text-[#1F3B34] tabular-nums">{ur.n}</div>
                <div className="text-[9px] font-semibold text-[#7D766C] uppercase">{ur.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm Versions */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Algorithm Versions
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {algorithm?.versions && algorithm.versions.length > 0 ? (
              algorithm.versions.map((v) => (
                <div key={v.version} className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] flex justify-between">
                  <span className="font-mono font-bold text-[#1E2022]">{v.version || 'v1.0.0'}</span>
                  <span className="text-[#1F3B34] font-semibold tabular-nums">{v.runs} runs</span>
                </div>
              ))
            ) : (
              <div className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] text-xs text-[#7D766C] rounded-[2px]">
                Deterministic Engine v1.0
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          RECENT SYSTEM ACTIVITY (AUDIT LOGS - RULE 13)
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
            Recent System Activity (Audit Log)
          </span>
          <Activity className="w-3.5 h-3.5 text-[#1F3B34]" />
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#7D766C]">
            No recent activity recorded.
          </div>
        ) : (
          <div className="divide-y divide-[#E9E4DC] text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-[#1E2022] truncate max-w-[320px]">
                    {log.details || log.action}
                  </div>
                  <div className="text-[10px] text-[#7D766C]">
                    By {log.actor_name} | {log.action}
                  </div>
                </div>
                <span className="text-[10.5px] text-[#7D766C] tabular-nums shrink-0 whitespace-nowrap">
                  {log.created_at_relative}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DEMOGRAPHICS WIDGET (RULE 14)
      ════════════════════════════════════════════════════════════════ */}
      {demographics && (
        <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] p-4">
          <DemographicsChart demographics={demographics} />
        </div>
      )}

    </div>
  );
}
