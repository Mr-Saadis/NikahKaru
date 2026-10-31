'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  RefreshCw,
  Clock,
  AlertTriangle,
  ExternalLink,
  AlertCircle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { DashboardService, type ManagerOverviewData } from '@/lib/services/dashboard-service';
import { COLUMNS } from '@/components/requests/constants';
import {
  formatWaitingHours,
  formatKarachiDate,
  formatKarachiTime,
  formatDelta,
  getSlaBadge,
  getLoadBadge,
} from '@/lib/utils/overview-helpers';
import { toast } from 'sonner';

export default function ManagerOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ManagerOverviewData | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadData = async (days: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await DashboardService.getDashboardData('MANAGER', days, 24);
      if (!res) return;
      setData(res as ManagerOverviewData);
      setLastUpdated(formatKarachiTime(new Date()));
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('[ManagerOverview] load error:', err);
      setError(err.message || 'Failed to load manager desk data');
      toast.error('Failed to load operations desk');
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
        <div className="h-24 bg-[#E9E4DC] border border-[#E9E4DC]" />
        <div className="h-16 bg-[#E9E4DC] border border-[#E9E4DC]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 h-64 bg-[#E9E4DC]" />
          <div className="lg:col-span-5 h-64 bg-[#E9E4DC]" />
        </div>
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
          <span>Error Loading Operations Desk</span>
        </div>
        <p className="text-xs text-[#7F1D1D]">{error || 'Unable to connect to operations RPC'}</p>
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
  const releasesDelta = selectedDays > 0 ? formatDelta(kpis.releases_in_range, kpis.releases_prev_range) : null;

  // Score quality percentages
  const totalScores = (scoreQuality.excellent || 0) + (scoreQuality.good || 0) + (scoreQuality.borderline || 0);
  const excellentPct = totalScores > 0 ? Math.round((scoreQuality.excellent / totalScores) * 100) : 0;
  const goodPct = totalScores > 0 ? Math.round((scoreQuality.good / totalScores) * 100) : 0;
  const borderlinePct = totalScores > 0 ? 100 - excellentPct - goodPct : 0;

  return (
    <div className="w-full min-w-0 space-y-5 font-sans">
      {/* ════════════════════════════════════════════════════════════════
          TOP: FULL-WIDTH SLA BAND WITH THREE FIGURES + RANGE SELECTOR
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Three Figures Separated by Hairlines */}
        <div className="flex items-center divide-x divide-[#E9E4DC] min-w-0">
          {/* 1. Oldest Waiting */}
          <div className="pr-6 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block">
              Oldest Waiting
            </span>
            <div
              className={`text-2xl font-bold tabular-nums mt-0.5 ${
                isOldestOverdue ? 'text-[#DC2626]' : 'text-[#1E2022]'
              }`}
            >
              {formatWaitingHours(kpis.oldest_waiting_hours)}
            </div>
            <span className="text-[10px] text-[#7D766C]">SLA: {data.sla_hours || 24}h</span>
          </div>

          {/* 2. Overdue */}
          <div className="px-6 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block">
              Overdue
            </span>
            <div
              className={`text-2xl font-bold tabular-nums mt-0.5 ${
                (kpis.overdue ?? 0) > 0 ? 'text-[#DC2626]' : 'text-[#1E2022]'
              }`}
            >
              {kpis.overdue ?? 0}
            </div>
            <span className="text-[10px] text-[#7D766C]">&gt;{data.sla_hours || 24}h limit</span>
          </div>

          {/* 3. Pending */}
          <div className="pl-6 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block">
              Pending Queue
            </span>
            <div className="text-2xl font-bold text-[#1F3B34] tabular-nums mt-0.5">
              {kpis.pending ?? 0}
            </div>
            <span className="text-[10px] text-[#7D766C]">Awaiting match run</span>
          </div>
        </div>

        {/* Right side: Last Updated + Refresh + Joined Segmented Control */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {lastUpdated && (
            <span className="text-[11px] text-[#7D766C] tabular-nums whitespace-nowrap">
              {lastUpdated}
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

          {/* Joined Segmented Control of Square Buttons */}
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
          PIPELINE STRIP: ONE ROW OF JOINED EQUAL BOXES (NO GAPS)
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y sm:divide-y-0 divide-[#E9E4DC]">
        {COLUMNS.slice(0, 7).map((col) => {
          const count = pipeline[col.key] || 0;
          return (
            <Link
              key={col.key}
              href="/requests"
              className="p-3 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] truncate" title={col.label}>
                {col.label}
              </span>
              <div className="text-xl font-bold text-[#1E2022] tabular-nums mt-1">
                {count}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SECONDARY STATS IN ONE HAIRLINE ROW
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[#7D766C]">Released Awaiting Agent:</span>
          <strong className="text-[#2F3E51] font-bold tabular-nums">{kpis.released_awaiting_agent ?? 0}</strong>
        </div>
        <div className="h-3 w-px bg-[#E9E4DC] hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#7D766C]">Completed in Period:</span>
          <strong className="text-[#166534] font-bold tabular-nums">{kpis.completed_in_range ?? 0}</strong>
        </div>
        <div className="h-3 w-px bg-[#E9E4DC] hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#7D766C]">Releases in Period:</span>
          <strong className="text-[#1F3B34] font-bold tabular-nums">{kpis.releases_in_range ?? 0}</strong>
          {releasesDelta && (
            <span
              className={`px-1 py-0.5 border text-[9.5px] font-bold rounded-[2px] inline-flex items-center gap-0.5 ${
                releasesDelta.isPositive ? 'bg-[#E5EFE9] text-[#166534] border-[#C2DDD0]' : 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
              }`}
            >
              {releasesDelta.isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {releasesDelta.text}
            </span>
          )}
        </div>
        <div className="h-3 w-px bg-[#E9E4DC] hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#7D766C]">Match Runs in Period:</span>
          <strong className="text-[#1E2022] font-bold tabular-nums">{kpis.runs_in_range ?? 0}</strong>
        </div>
        <div className="h-3 w-px bg-[#E9E4DC] hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#7D766C]">Avg Release Time:</span>
          <strong className="text-[#1E2022] font-bold tabular-nums">
            {kpis.avg_release_hours !== null ? `${kpis.avg_release_hours}h` : '—'}
          </strong>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MAIN GRID 12 COLUMNS: LEFT 7 / RIGHT 5
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT: Waiting Queue (7 Cols) */}
        <div className="lg:col-span-7 min-w-0 border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Waiting Queue (Priority Ledger)
            </span>
            <Link
              href="/requests"
              className="text-[11px] font-bold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
            >
              <span>Board</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {queue.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7D766C]">
              Queue clear. No requests waiting for matching runs.
            </div>
          ) : (
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E9E4DC] text-[10px] font-bold uppercase tracking-wider text-[#7D766C]">
                    <th className="pb-2 font-semibold">Candidate</th>
                    <th className="pb-2 font-semibold">Details</th>
                    <th className="pb-2 font-semibold">Agent</th>
                    <th className="pb-2 font-semibold">SLA Status</th>
                    <th className="pb-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E4DC]">
                  {queue.map((item) => {
                    const sla = getSlaBadge(item.sla_state);

                    return (
                      <tr key={item.request_id} className="hover:bg-[#FAF8F5] transition-colors duration-120">
                        <td className="py-2.5 pr-2 font-bold text-[#1E2022]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[130px]" title={item.full_name || 'Candidate'}>
                              {item.full_name || 'Candidate'}
                            </span>
                            {item.is_repeat && (
                              <span className="px-1 py-0.5 border text-[9px] font-bold rounded-[2px] bg-[#EBF2F7] text-[#2F3E51] border-[#D0DFEA]">
                                REPEAT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 pr-2 text-[#4E473D] whitespace-nowrap">
                          {item.age !== null ? `${item.age}y` : '—'}, {item.city || '—'}, {item.caste || '—'}
                        </td>
                        <td className="py-2.5 pr-2 text-[#7D766C] truncate max-w-[100px]" title={item.agent_name || 'Staff'}>
                          {item.agent_name || 'Staff'}
                        </td>
                        <td className="py-2.5 pr-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 border text-[9.5px] font-bold rounded-[2px] ${sla.bg} ${sla.text} ${sla.border}`}>
                            {sla.label} ({formatWaitingHours(item.waiting_hours)})
                          </span>
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/matching?profileId=${item.profile_id}`)}
                            className="px-2.5 py-1 bg-[#1F3B34] text-white text-[11px] font-bold rounded-[2px] inline-flex items-center gap-1 transition-colors duration-120 hover:bg-[#172E29] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
                          >
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>Run Match</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Agent Workload & Stuck Releases (5 Cols) */}
        <div className="lg:col-span-5 min-w-0 space-y-5">
          
          {/* Agent Workload */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Agent Workload
              </span>
              <span className="text-[10px] text-[#7D766C] tabular-nums">
                {workload.length} agents
              </span>
            </div>

            {workload.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#7D766C]">
                No active staff members.
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {workload.map((agent) => {
                  const badge = getLoadBadge(agent.load);
                  const total = agent.active_profiles + agent.drafts;
                  const maxCap = Math.max(total, 20);
                  const activeWidth = Math.round((agent.active_profiles / maxCap) * 100);
                  const draftsWidth = Math.round((agent.drafts / maxCap) * 100);

                  return (
                    <div key={agent.id} className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1E2022] truncate max-w-[150px]" title={agent.full_name}>
                          {agent.full_name}
                        </span>
                        <span className={`px-1.5 py-0.2 border text-[9px] font-bold rounded-[2px] ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Horizontal stacked bar */}
                      <div className="w-full bg-[#E9E4DC] h-2 flex rounded-none overflow-hidden">
                        <div
                          className="bg-[#1F3B34] h-full"
                          style={{ width: `${activeWidth}%` }}
                          title={`Active: ${agent.active_profiles}`}
                        />
                        <div
                          className="bg-[#C86A4A] h-full"
                          style={{ width: `${draftsWidth}%` }}
                          title={`Drafts: ${agent.drafts}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-[#7D766C] tabular-nums">
                        <span>{agent.active_profiles} active, {agent.drafts} drafts</span>
                        <span className="font-bold text-[#1E2022]">{agent.open_requests} open reqs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stuck Releases */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Stuck Releases (&gt;7 Days)
              </span>
              <span className="text-[10px] text-[#7D766C] tabular-nums">
                {stuckReleases.length} stuck
              </span>
            </div>

            {stuckReleases.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#7D766C]">
                No stuck releases. All dossiers downloaded on time.
              </div>
            ) : (
              <div className="divide-y divide-[#E9E4DC] text-xs">
                {stuckReleases.map((s) => (
                  <div key={s.release_id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1E2022] truncate max-w-[160px]" title={`${s.candidate_name || 'Candidate'} for ${s.source_name || 'Client'}`}>
                        {s.candidate_name || 'Candidate'} for {s.source_name || 'Client'}
                      </div>
                      <div className="text-[10px] text-[#7D766C]">
                        Agent: {s.agent_name || 'Staff'}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 border border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626] text-[10px] font-bold rounded-[2px] shrink-0 tabular-nums">
                      {s.days_waiting}d waiting
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          BOTTOM: 4-COLUMN ROW OF EQUAL MODULES
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Module 1: Hot Candidates */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Hot Candidates
            </span>
            <Flame className="w-3.5 h-3.5 text-[#C86A4A]" />
          </div>

          {hotCandidates.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#7D766C]">
              No high-frequency candidates.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {hotCandidates.map((h) => (
                <div key={h.candidate_profile_id} className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] flex items-center justify-between gap-1">
                  <span className="font-semibold text-[#1E2022] truncate max-w-[120px]" title={h.candidate_name || 'Candidate'}>
                    {h.candidate_name || 'Candidate'}
                  </span>
                  <span className="px-1.5 py-0.5 border border-[#FCD34D] bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-[2px] shrink-0 tabular-nums">
                    in {h.requests_count} reqs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 2: Score Quality */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Score Quality
            </span>
            <span className="text-xs font-bold text-[#1F3B34] tabular-nums">
              {scoreQuality.avg !== null ? `${scoreQuality.avg}% avg` : '—'}
            </span>
          </div>

          {totalScores === 0 ? (
            <div className="py-4 text-center text-xs text-[#7D766C]">
              No runs in period.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {/* Single segmented bar */}
              <div className="w-full bg-[#E9E4DC] h-2.5 flex rounded-none overflow-hidden">
                <div className="bg-[#166534] h-full" style={{ width: `${excellentPct}%` }} title={`Excellent: ${scoreQuality.excellent}`} />
                <div className="bg-[#D97706] h-full" style={{ width: `${goodPct}%` }} title={`Good: ${scoreQuality.good}`} />
                <div className="bg-[#C86A4A] h-full" style={{ width: `${borderlinePct}%` }} title={`Borderline: ${scoreQuality.borderline}`} />
              </div>

              <div className="space-y-1 text-[11px] tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[#166534] font-semibold">Excellent (85+)</span>
                  <strong>{scoreQuality.excellent}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#D97706] font-semibold">Good (70-84)</span>
                  <strong>{scoreQuality.good}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C86A4A] font-semibold">Borderline (&lt;70)</span>
                  <strong>{scoreQuality.borderline}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Module 3: Low-Match Desk */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Low-Match Desk
            </span>
            <span className="text-[10px] text-[#7D766C] tabular-nums">
              {lowMatch.length}
            </span>
          </div>

          {lowMatch.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#7D766C]">
              No low-match bottlenecks.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {lowMatch.map((l) => (
                <div
                  key={l.profile_id}
                  onClick={() => router.push(`/matching?profileId=${l.profile_id}`)}
                  className="p-2 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] flex items-center justify-between gap-1 cursor-pointer hover:bg-white transition-colors duration-120"
                >
                  <div className="min-w-0 truncate" title={l.full_name || 'Client'}>
                    <div className="font-bold text-[#1E2022] truncate">{l.full_name || 'Client'}</div>
                    <div className="text-[10px] text-[#7D766C]">{formatKarachiDate(l.executed_at, { day: '2-digit', month: 'short' })}</div>
                  </div>
                  <span className="px-1.5 py-0.5 border border-[#E9E4DC] bg-white text-[10px] font-bold text-[#C86A4A] rounded-[2px] shrink-0 tabular-nums">
                    {l.candidates} found
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 4: Orphaned Profiles (Red outline when count > 0) */}
        <div
          className={`bg-white rounded-[2px] p-4 space-y-3 min-w-0 border ${
            orphaned.count > 0 ? 'border-[#DC2626]' : 'border-[#E9E4DC]'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Orphaned Profiles
            </span>
            <span
              className={`px-1.5 py-0.5 border text-[10px] font-bold rounded-[2px] tabular-nums ${
                orphaned.count > 0
                  ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                  : 'bg-[#FAF8F5] text-[#7D766C] border-[#E9E4DC]'
              }`}
            >
              {orphaned.count}
            </span>
          </div>

          {orphaned.count === 0 ? (
            <div className="py-4 text-center text-xs text-[#7D766C]">
              All profiles assigned to active staff.
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              {orphaned.items.map((o) => (
                <div
                  key={o.id}
                  onClick={() => router.push('/directory')}
                  className="p-1.5 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] truncate font-semibold text-[#1E2022] cursor-pointer hover:bg-white transition-colors duration-120"
                  title={o.full_name || 'Profile'}
                >
                  {o.full_name || 'Profile'}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          LAST ROW: 2 COLUMNS (RECENT RELEASES & FAMILY FEEDBACK)
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recent Releases */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Recent Releases
            </span>
            <Link href="/requests" className="text-[10px] font-bold text-[#1F3B34] hover:underline">
              Board
            </Link>
          </div>

          {recentReleases.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7D766C]">
              No release history in selected period.
            </div>
          ) : (
            <div className="divide-y divide-[#E9E4DC] text-xs">
              {recentReleases.map((r) => (
                <div key={r.release_id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1E2022] truncate max-w-[240px]">
                      {r.candidate_name || 'Candidate'} for {r.source_name || 'Client'}
                    </div>
                    <div className="text-[10px] text-[#7D766C]">
                      Agent: {r.agent_name || 'Staff'}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#7D766C] tabular-nums shrink-0 whitespace-nowrap">
                    {formatKarachiDate(r.released_at, { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Family Feedback + Top Rejection Reasons */}
        <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Family Feedback Telemetry
            </span>
          </div>

          {(!feedback || !feedback.tracking_active) ? (
            <div className="p-6 border border-[#E9E4DC] bg-[#FAF8F5] text-center text-xs text-[#7D766C] rounded-[2px]">
              Not tracked yet
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {feedback.top_reasons?.map((tr) => (
                <div key={tr.reason} className="flex justify-between border-b border-[#E9E4DC] pb-1.5">
                  <span className="text-[#4E473D]">{tr.reason}</span>
                  <strong className="text-[#1E2022] tabular-nums">{tr.n}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
