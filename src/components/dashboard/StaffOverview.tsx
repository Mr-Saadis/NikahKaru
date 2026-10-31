'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  RefreshCw,
  Clock,
  ExternalLink,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { DashboardService, type AgentOverviewData } from '@/lib/services/dashboard-service';
import {
  formatRelativeTime,
  formatKarachiDate,
  formatKarachiTime,
  getStatusBadge,
} from '@/lib/utils/overview-helpers';
import { toast } from 'sonner';

export default function StaffOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentOverviewData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DashboardService.getDashboardData('AGENT');
      if (!res) return;
      setData(res as AgentOverviewData);
      setLastUpdated(formatKarachiTime(new Date()));
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('[StaffOverview] load error:', err);
      setError(err.message || 'Failed to load agent desk data');
      toast.error('Failed to load agent desk');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------------------------------
  // SKELETON STATE (Phase B Rule 2: Static flat grey blocks, no pulse/ping)
  // --------------------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="w-full min-w-0 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#E9E4DC]">
          <div className="h-6 w-36 bg-[#E9E4DC]" />
          <div className="h-8 w-28 bg-[#E9E4DC]" />
        </div>
        <div className="border border-[#E9E4DC] bg-white h-24 grid grid-cols-2 lg:grid-cols-6 divide-x divide-[#E9E4DC]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-3 w-16 bg-[#E9E4DC]" />
              <div className="h-6 w-10 bg-[#E9E4DC]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 min-w-0 space-y-5">
            <div className="border border-[#E9E4DC] bg-white h-48 p-4 space-y-3">
              <div className="h-4 w-32 bg-[#E9E4DC]" />
              <div className="h-8 w-full bg-[#FAF8F5]" />
              <div className="h-8 w-full bg-[#FAF8F5]" />
            </div>
          </div>
          <div className="lg:col-span-4 min-w-0 space-y-5">
            <div className="border border-[#E9E4DC] bg-white h-48 p-4 space-y-3">
              <div className="h-4 w-28 bg-[#E9E4DC]" />
              <div className="h-8 w-full bg-[#FAF8F5]" />
            </div>
          </div>
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
          <span>Error Loading Agent Desk</span>
        </div>
        <p className="text-xs text-[#7F1D1D]">{error || 'Unable to load overview data.'}</p>
        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-[#1F3B34] text-white text-xs font-bold rounded-[2px] transition-colors duration-120 hover:bg-[#172E29] cursor-pointer"
        >
          Retry
        </button>
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

  return (
    <div className="w-full min-w-0 space-y-5 font-sans">
      {/* ════════════════════════════════════════════════════════════════
          ROW 1: TITLE LEFT, "NEW PROFILE" BUTTON RIGHT
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E9E4DC]">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-xl font-bold text-[#1F3B34] tracking-tight truncate">
            Agent Desk
          </h1>
          {lastUpdated && (
            <span className="text-[11px] text-[#7D766C] tabular-nums whitespace-nowrap">
              Last updated {lastUpdated}
            </span>
          )}
          <button
            onClick={loadData}
            aria-label="Refresh overview"
            title="Refresh overview"
            className="p-1 text-[#7D766C] hover:text-[#1F3B34] transition-colors duration-120 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <Link
          href="/add-profile"
          className="px-3.5 py-1.5 bg-[#1F3B34] text-white text-xs font-bold rounded-[2px] inline-flex items-center gap-1.5 transition-colors duration-120 hover:bg-[#172E29] cursor-pointer shrink-0 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>New Profile</span>
        </Link>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 2: ONE BORDERED BAND SPLIT INTO 6 EQUAL CELLS BY HAIRLINES
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full border border-[#E9E4DC] bg-white rounded-[2px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#E9E4DC]">
        {/* Cell 1: Assigned Profiles */}
        <Link
          href="/profiles"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <span className="text-[10px] font-bold text-[#7D766C] uppercase tracking-wider truncate">
            Assigned Profiles
          </span>
          <div className="text-2xl font-bold text-[#1F3B34] tabular-nums mt-1">
            {kpis.assigned_profiles ?? 0}
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">Active in roster</span>
        </Link>

        {/* Cell 2: Drafts Pending */}
        <Link
          href="/profiles"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <span className="text-[10px] font-bold text-[#7D766C] uppercase tracking-wider truncate">
            Drafts Pending
          </span>
          <div className="text-2xl font-bold text-[#C86A4A] tabular-nums mt-1">
            {kpis.drafts_pending ?? 0}
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">Incomplete entries</span>
        </Link>

        {/* Cell 3: Released for Client */}
        <Link
          href="/agent-requests"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <span className="text-[10px] font-bold text-[#7D766C] uppercase tracking-wider truncate">
            Released for Client
          </span>
          <div className="text-2xl font-bold text-[#2F3E51] tabular-nums mt-1">
            {kpis.released_for_client ?? 0}
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">Candidates approved</span>
        </Link>

        {/* Cell 4: Shared with Family */}
        <Link
          href="/agent-requests"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <span className="text-[10px] font-bold text-[#7D766C] uppercase tracking-wider truncate">
            Shared with Family
          </span>
          <div className="text-2xl font-bold text-[#166534] tabular-nums mt-1">
            {kpis.shared_with_family ?? 0}
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">Dossiers downloaded</span>
        </Link>

        {/* Cell 5: Open Requests */}
        <Link
          href="/agent-requests"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <span className="text-[10px] font-bold text-[#7D766C] uppercase tracking-wider truncate">
            Open Requests
          </span>
          <div className="text-2xl font-bold text-[#8B6122] tabular-nums mt-1">
            {kpis.open_requests ?? 0}
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">Pending manager</span>
        </Link>

        {/* Cell 6: Awaiting Download */}
        <Link
          href="/agent-requests"
          className="p-3.5 min-w-0 flex flex-col justify-between hover:bg-[#FAF8F5] transition-colors duration-120 focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
        >
          <span className="text-[10px] font-bold text-[#7D766C] uppercase tracking-wider truncate">
            Awaiting Download
          </span>
          <div className="text-2xl font-bold text-[#1F3B34] tabular-nums mt-1">
            {kpis.awaiting_download ?? 0}
          </div>
          <span className="text-[10px] text-[#7D766C] mt-1 truncate">Ready for delivery</span>
        </Link>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 3: 12-COLUMN GRID (LEFT 8, RIGHT 4)
      ════════════════════════════════════════════════════════════════ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ─── LEFT COLUMN (8 COLS) ─── */}
        <div className="lg:col-span-8 min-w-0 space-y-5">
          
          {/* 1. Needs Attention (Ruled List with hairlines) */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E9E4DC]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Needs Attention
              </span>
              <span className="text-[10px] text-[#7D766C] tabular-nums">
                {attention.length} items
              </span>
            </div>

            {attention.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7D766C]">
                No profiles or requests currently require attention.
              </div>
            ) : (
              <div className="divide-y divide-[#E9E4DC]">
                {attention.map((item, idx) => {
                  let badgeText = 'ACTION';
                  let badgeClass = 'bg-[#FAF8F5] text-[#1E2022] border-[#E9E4DC]';
                  let actionText = 'Open';
                  let linkHref = '/agent-requests';

                  if (item.kind === 'release_ready') {
                    badgeText = 'RELEASE READY';
                    badgeClass = 'bg-[#EBF2F7] text-[#2F3E51] border-[#D0DFEA]';
                    actionText = 'Open Request';
                    linkHref = '/agent-requests';
                  } else if (item.kind === 'assigned_to_you') {
                    badgeText = 'ASSIGNED';
                    badgeClass = 'bg-[#E5EFE9] text-[#1F3B34] border-[#C2DDD0]';
                    actionText = 'View Request';
                    linkHref = '/agent-requests';
                  } else if (item.kind === 'no_preferences') {
                    badgeText = 'NO PREFERENCES';
                    badgeClass = 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]';
                    actionText = 'Add Preferences';
                    linkHref = `/add-profile?profileId=${item.profile_id}&step=8`;
                  } else if (item.kind === 'stale_draft') {
                    badgeText = 'STALE DRAFT';
                    badgeClass = 'bg-[#FEF3C7] text-[#8B6122] border-[#FDE68A]';
                    actionText = 'Continue';
                    linkHref = `/add-profile?profileId=${item.profile_id}`;
                  } else if (item.kind === 'ready_to_request') {
                    badgeText = 'READY TO REQUEST';
                    badgeClass = 'bg-[#FAF8F5] text-[#1E2022] border-[#E9E4DC]';
                    actionText = 'Request Manager';
                    linkHref = '/agent-requests';
                  }

                  return (
                    <div
                      key={`${item.kind}-${item.entity_id}-${idx}`}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 border text-[9.5px] font-bold rounded-[2px] tracking-wider shrink-0 ${badgeClass}`}
                        >
                          {badgeText}
                        </span>
                        <span className="font-semibold text-[#1E2022] truncate" title={item.profile_name}>
                          {item.profile_name}
                        </span>
                        <span className="text-[11px] text-[#7D766C] tabular-nums shrink-0 whitespace-nowrap">
                          {formatRelativeTime(item.since)}
                        </span>
                      </div>

                      <button
                        onClick={() => router.push(linkHref)}
                        className="px-2.5 py-1 border border-[#1F3B34] text-[#1F3B34] text-[11px] font-bold rounded-[2px] transition-colors duration-120 hover:bg-[#1F3B34] hover:text-white shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1F3B34]"
                      >
                        {actionText}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. My Profiles (Table with 8-square segmented bar) */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E9E4DC]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                My Profiles
              </span>
              <Link
                href="/profiles"
                className="text-[11px] font-bold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
              >
                <span>Directory</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {profiles.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7D766C]">
                No profiles assigned to your roster yet.
              </div>
            ) : (
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E9E4DC] text-[10px] font-bold uppercase tracking-wider text-[#7D766C]">
                      <th className="pb-2 font-semibold">Name</th>
                      <th className="pb-2 font-semibold">Gender</th>
                      <th className="pb-2 font-semibold">Status</th>
                      <th className="pb-2 font-semibold">Completion</th>
                      <th className="pb-2 font-semibold">Preferences</th>
                      <th className="pb-2 font-semibold text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E4DC]">
                    {profiles.map((p) => {
                      const statusBadge = getStatusBadge(p.status);
                      const missingTooltip = p.missing && p.missing.length > 0
                        ? `Missing: ${p.missing.join(', ')}`
                        : 'Complete';

                      return (
                        <tr
                          key={p.id}
                          onClick={() => router.push('/profiles')}
                          className="hover:bg-[#FAF8F5] transition-colors duration-120 cursor-pointer"
                        >
                          <td className="py-2.5 pr-2 font-bold text-[#1E2022] truncate max-w-[150px]" title={p.full_name}>
                            {p.full_name}
                          </td>
                          <td className="py-2.5 pr-2 text-[#4E473D]">
                            {p.gender === 'MALE' ? 'Male' : p.gender === 'FEMALE' ? 'Female' : p.gender}
                          </td>
                          <td className="py-2.5 pr-2">
                            <span
                              className={`px-1.5 py-0.5 border text-[9.5px] font-bold rounded-[2px] ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-1.5" title={missingTooltip}>
                              {/* Segmented 8-square bar */}
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: p.steps_total || 8 }).map((_, sqIdx) => (
                                  <span
                                    key={sqIdx}
                                    className={`w-2 h-2 rounded-[1px] ${
                                      sqIdx < p.steps_done
                                        ? 'bg-[#1F3B34]'
                                        : 'bg-[#E9E4DC]'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-[#7D766C] tabular-nums">
                                {p.steps_done}/{p.steps_total || 8}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-2">
                            {!p.has_preferences ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/add-profile?profileId=${p.id}&step=8`);
                                }}
                                className="px-1.5 py-0.5 border text-[9.5px] font-bold rounded-[2px] bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] hover:bg-[#FDE68A] cursor-pointer"
                              >
                                NO PREFERENCES
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#166534] font-semibold">
                                SET
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-[11px] text-[#7D766C] tabular-nums whitespace-nowrap">
                            {formatKarachiDate(p.updated_at, { day: '2-digit', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* ─── RIGHT RAIL (4 COLS) ─── */}
        <div className="lg:col-span-4 min-w-0 space-y-5">
          
          {/* 3. Pipeline: Vertical 4-step stack joined by thin rule */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Pipeline
            </span>

            <div className="border-l border-[#E9E4DC] pl-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#4E473D]">With Manager</span>
                <span className="font-bold text-[#8B6122] tabular-nums">{pipeline?.with_manager ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4E473D]">Ready</span>
                <span className="font-bold text-[#2F3E51] tabular-nums">{pipeline?.ready ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4E473D]">Downloaded</span>
                <span className="font-bold text-[#1F3B34] tabular-nums">{pipeline?.downloaded ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4E473D]">Completed</span>
                <span className="font-bold text-[#166534] tabular-nums">{pipeline?.completed ?? 0}</span>
              </div>
            </div>
          </div>

          {/* 4. Drafts */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Drafts
              </span>
              <span className="text-[10px] text-[#7D766C] tabular-nums">
                {drafts.length} pending
              </span>
            </div>

            {drafts.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#7D766C]">
                No incomplete drafts.
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {drafts.map((d) => (
                  <div key={d.id} className="p-2.5 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E2022] truncate max-w-[180px]" title={d.full_name}>
                        {d.full_name}
                      </span>
                      <span className="text-[10px] text-[#7D766C] tabular-nums">
                        {d.steps_done}/{d.steps_total} steps
                      </span>
                    </div>

                    {/* Segmented bar */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: d.steps_total || 8 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-[1px] ${
                            i < d.steps_done ? 'bg-[#1F3B34]' : 'bg-[#E9E4DC]'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10.5px] text-[#7D766C] truncate max-w-[140px]">
                        Next: {d.next_step || 'Review'}
                      </span>
                      <button
                        onClick={() => router.push(`/add-profile?profileId=${d.id}`)}
                        className="px-2 py-0.5 border border-[#1F3B34] text-[#1F3B34] text-[10px] font-bold rounded-[2px] transition-colors duration-120 hover:bg-[#1F3B34] hover:text-white cursor-pointer"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Ready for Client Delivery */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Ready for Client Delivery
              </span>
              <span className="text-[10px] text-[#7D766C] tabular-nums">
                {readyForDelivery.length} releases
              </span>
            </div>

            {readyForDelivery.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#7D766C]">
                No candidates approved for delivery.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {readyForDelivery.map((rel) => (
                  <div key={rel.release_id} className="p-3 border border-[#E9E4DC] bg-[#FAF8F5] rounded-[2px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E2022] truncate max-w-[150px]" title={rel.full_name || '—'}>
                        {rel.full_name || '—'}
                      </span>
                      {rel.score !== null && rel.score !== undefined ? (
                        <span
                          className="px-1.5 py-0.5 border border-[#E9E4DC] bg-white text-[10px] font-bold text-[#1F3B34] tabular-nums rounded-[2px] cursor-help"
                          title="Compatibility score, not a marriage probability"
                        >
                          {rel.score}%
                        </span>
                      ) : (
                        <span className="text-[#7D766C] text-[10px]">—</span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#7D766C] space-y-0.5">
                      <div>Age: {rel.age !== null ? `${rel.age}y` : '—'} | City: {rel.city || '—'}</div>
                      <div>Caste: {rel.caste || '—'} | Edu: {rel.education || '—'}</div>
                      <div className="text-[10px] text-[#A49C8F]">
                        Approved by {rel.released_by_name || 'Manager'}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-[#E9E4DC] flex items-center justify-between gap-2">
                      <Link
                        href="/agent-requests"
                        className="text-[10.5px] font-bold text-[#1F3B34] hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Board</span>
                      </Link>

                      <Link
                        href="/agent-requests"
                        className="px-2 py-0.5 bg-[#1F3B34] text-white text-[10.5px] font-bold rounded-[2px] inline-flex items-center gap-1 transition-colors duration-120 hover:bg-[#172E29]"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Requests with Manager */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9E4DC]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
                Requests with Manager
              </span>
              <Link href="/agent-requests" className="text-[10px] font-bold text-[#1F3B34] hover:underline">
                View All
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#7D766C]">
                No active requests.
              </div>
            ) : (
              <div className="divide-y divide-[#E9E4DC]">
                {requests.map((req) => {
                  const badge = getStatusBadge(req.status);

                  return (
                    <div
                      key={req.id}
                      onClick={() => router.push('/agent-requests')}
                      className="py-2 flex items-center justify-between gap-2 text-xs hover:bg-[#FAF8F5] transition-colors duration-120 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#1E2022] truncate max-w-[140px]" title={req.profile_name || 'Client'}>
                          {req.profile_name || 'Client'}
                        </div>
                        <div className="text-[10px] text-[#7D766C] truncate">
                          {req.reviewed_by_name ? `Rev: ${req.reviewed_by_name}` : 'Unreviewed'}
                        </div>
                      </div>

                      <span
                        className={`px-1.5 py-0.5 border text-[9px] font-bold rounded-[2px] shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. Active Client Discussions */}
          <div className="border border-[#E9E4DC] bg-white rounded-[2px] p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3B34]">
              Active Client Discussions
            </span>

            {(!tracking || tracking.matches_active === 0) ? (
              <div className="p-3 border border-[#E9E4DC] bg-[#FAF8F5] text-center text-xs text-[#7D766C] rounded-[2px]">
                Not tracked yet
              </div>
            ) : (
              <div className="p-3 border border-[#E9E4DC] bg-[#FAF8F5] flex items-center justify-between text-xs rounded-[2px]">
                <span className="text-[#4E473D]">Active Discussions</span>
                <span className="text-base font-bold text-[#1F3B34] tabular-nums">
                  {tracking.matches_active}
                </span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
