'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OverviewHeader from './OverviewHeader';
import DualCapsuleBar from './DualCapsuleBar';
import HorizontalBarRank from './HorizontalBarRank';
import DemographicsChart from './DemographicsChart';
import { DashboardService, type AdminDashboardData } from '@/lib/services/dashboard-service';
import { mockRejectionReasons, mockZeroCandidateProfiles } from './mockData';
import { toast } from 'sonner';

export default function AdminOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'MANAGERS' | 'AGENTS'>('MANAGERS');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await DashboardService.getDashboardData('HIGH_LEVEL_ADMIN');
        if (isMounted) {
          setData(res as AdminDashboardData);
        }
      } catch (err: any) {
        console.error('Error loading admin dashboard:', err);
        toast.error('Failed to load admin dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2.5 text-[#7D766C] text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-[#1F3B34]" />
          <span>Loading system overview...</span>
        </div>
      </div>
    );
  }

  const health = data?.health || {
    total_active_profiles: 0,
    male_active_profiles: 0,
    female_active_profiles: 0,
    gender_ratio_male_pct: 50,
    gender_ratio_female_pct: 50,
    active_in_progress_matches: 0,
    total_match_runs: 0,
    total_releases: 0,
    avg_request_sla_hours: 3.4,
    accepted_matches_this_month: 0,
    rejected_matches_this_month: 0,
  };

  const managers = data?.managersPerformance || [];
  const agents = data?.agentsWorkload || [];
  const auditLogs = data?.auditLogs || [];

  return (
    <div className="space-y-7">
      
      {/* ════════════════════════════════════════════════════════════════
          PAGE HEADER (Native Notification Flow & Real DB Stats)
      ════════════════════════════════════════════════════════════════ */}
      <OverviewHeader
        title="Overview"
        subtitle="System operations, manager workload & matching outcomes"
        stats={[
          { label: 'Active Pool', value: health.total_active_profiles.toLocaleString() },
          { label: 'Active Requests', value: health.active_in_progress_matches, color: '#1F3B34' },
          { label: 'Match Runs', value: health.total_match_runs, color: '#2F3E51' },
          { label: 'Total Releases', value: health.total_releases, color: '#166534' },
        ]}
      />

      {/* ════════════════════════════════════════════════════════════════
          TOP METRIC CARDS
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pool & Gender Ratio */}
        <div className="bg-white rounded-[22px] p-5 border border-[#E9E4DC] shadow-xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D766C]">
              Active Pool & Ratio
            </span>
            <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E9E4DC] text-[#1F3B34] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1">
            <div className="text-[26px] font-bold text-[#1F3B34]">
              {health.total_active_profiles.toLocaleString()}
              <span className="text-[12px] font-medium text-[#7D766C] ml-2">Profiles</span>
            </div>
          </div>

          <DualCapsuleBar
            labelLeft="Male"
            valueLeft={health.male_active_profiles}
            pctLeft={health.gender_ratio_male_pct}
            colorLeft="#1F3B34"
            labelRight="Female"
            valueRight={health.female_active_profiles}
            pctRight={health.gender_ratio_female_pct}
            colorRight="#C86A4A"
            height={6}
          />
        </div>

        {/* Active Requests */}
        <div className="bg-white rounded-[22px] p-5 border border-[#E9E4DC] shadow-xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D766C]">
              Requests In Progress
            </span>
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#E5EFE9] text-[#1F3B34]">
              Active
            </span>
          </div>

          <div className="my-1">
            <div className="text-[26px] font-bold text-[#1F3B34]">
              {health.active_in_progress_matches}
              <span className="text-[12px] font-medium text-[#7D766C] ml-2">Cases</span>
            </div>
          </div>

          <div className="text-[11.5px] text-[#7D766C]">
            Profiles undergoing review & candidate matching
          </div>
        </div>

        {/* Official Match Runs */}
        <div className="bg-white rounded-[22px] p-5 border border-[#E9E4DC] shadow-xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D766C]">
              Official Match Runs
            </span>
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#166534]">
              Algorithm
            </span>
          </div>

          <div className="my-1">
            <div className="text-[26px] font-bold text-[#166534]">
              {health.total_match_runs}
              <span className="text-[12px] font-medium text-[#7D766C] ml-2">Executed</span>
            </div>
          </div>

          <div className="text-[11.5px] text-[#7D766C]">
            Total rule-based matching runs recorded in DB
          </div>
        </div>

        {/* Information Releases */}
        <div className="bg-white rounded-[22px] p-5 border border-[#E9E4DC] shadow-xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D766C]">
              Approved Releases
            </span>
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E9E4DC] text-[#7D766C]">
              Snapshots
            </span>
          </div>

          <div className="my-1">
            <div className="text-[26px] font-bold text-[#2F3E51]">
              {health.total_releases}
              <span className="text-[12px] font-medium text-[#7D766C] ml-2">Dossiers</span>
            </div>
          </div>

          <div className="text-[11.5px] text-[#7D766C]">
            Controlled snapshots released to staff
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          POOL DEMOGRAPHICS BREAKDOWN (Filters: Occupation, Education, Location, Sect, Income)
      ════════════════════════════════════════════════════════════════ */}
      <DemographicsChart demographics={data?.demographics} />

      {/* ════════════════════════════════════════════════════════════════
          MAIN WORKSPACE
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        
        {/* ─── LEFT COLUMN: Team Performance (8 Cols) ─── */}
        <div className="xl:col-span-8 space-y-7">
          
          <div className="bg-white rounded-[24px] p-6 border border-[#E9E4DC] shadow-xs">
            
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EBE2] pb-4 mb-4">
              <div>
                <h2 className="text-[16px] font-bold text-[#1F3B34] tracking-tight">
                  Team Operations & Queues
                </h2>
                <p className="text-[12px] text-[#7D766C] mt-0.5">
                  Review response times, pending queues and staff activity
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#FAF8F5] p-1 rounded-full flex items-center border border-[#E9E4DC]">
                  <button
                    onClick={() => setActiveTab('MANAGERS')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'MANAGERS'
                        ? 'bg-[#1F3B34] text-white shadow-xs'
                        : 'text-[#7D766C] hover:text-[#1F3B34]'
                    }`}
                  >
                    Managers ({managers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('AGENTS')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'AGENTS'
                        ? 'bg-[#1F3B34] text-white shadow-xs'
                        : 'text-[#7D766C] hover:text-[#1F3B34]'
                    }`}
                  >
                    Staff Members ({agents.length})
                  </button>
                </div>

                <Link
                  href="/directory"
                  className="hidden sm:inline-flex items-center gap-1 text-[11.5px] font-bold text-[#1F3B34] hover:underline"
                >
                  <span>Directory</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* TAB 1: MANAGERS */}
            {activeTab === 'MANAGERS' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#F0EBE2] text-[10.5px] font-bold text-[#7D766C] uppercase tracking-wider">
                      <th className="py-3 px-3">Manager</th>
                      <th className="py-3 px-3">Pending Queue</th>
                      <th className="py-3 px-3">Match Runs</th>
                      <th className="py-3 px-3">Releases</th>
                      <th className="py-3 px-3 text-right">Avg Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE2]">
                    {managers.map((mgr) => (
                      <tr
                        key={mgr.id}
                        onClick={() => router.push('/directory')}
                        className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#1E2022]">{mgr.name}</div>
                          <div className="text-[11px] text-[#7D766C]">{mgr.email}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF8F5] border border-[#E9E4DC] text-[#1E2022]">
                            {mgr.pending_requests} pending
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-medium text-[#1E2022]">
                          {mgr.official_match_runs}
                        </td>

                        <td className="py-3.5 px-3 font-medium text-[#166534]">
                          {mgr.releases_approved}
                        </td>

                        <td className="py-3.5 px-3 text-right font-medium text-[#1F3B34]">
                          {mgr.avg_turnaround_hours}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: STAFF */}
            {activeTab === 'AGENTS' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#F0EBE2] text-[10.5px] font-bold text-[#7D766C] uppercase tracking-wider">
                      <th className="py-3 px-3">Staff</th>
                      <th className="py-3 px-3">Assigned Clients</th>
                      <th className="py-3 px-3">Drafts</th>
                      <th className="py-3 px-3 text-right">Requests Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE2]">
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        onClick={() => router.push('/directory')}
                        className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#1E2022]">{agent.name}</div>
                          <div className="text-[10.5px] text-[#7D766C]">{agent.email}</div>
                        </td>

                        <td className="py-3.5 px-3 font-medium text-[#1E2022]">
                          {agent.currently_owned}
                        </td>

                        <td className="py-3.5 px-3">
                          {agent.stuck_in_draft > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#FEF3C7] text-[#8B6122]">
                              {agent.stuck_in_draft} Drafts
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#166534]">0</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-medium text-[#7D766C]">
                          {agent.requests_submitted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Difficult to Match Profiles */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E9E4DC] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-3">
              <div>
                <h3 className="text-[14.5px] font-bold text-[#1F3B34]">
                  Profiles with Low Matches
                </h3>
                <p className="text-[11px] text-[#7D766C]">
                  Few or no matches found — partner criteria may be too restrictive:
                </p>
              </div>

              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E9E4DC] text-[#7D766C]">
                {mockZeroCandidateProfiles.length} Profiles
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mockZeroCandidateProfiles.map((zc) => (
                <div
                  key={zc.id}
                  className="p-3.5 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] space-y-2 text-[12px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E2022]">{zc.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#E9E4DC] text-[#991B1B]">
                        {zc.candidates_found} matches
                      </span>
                    </div>

                    <div className="text-[10.5px] text-[#7D766C] mt-0.5">
                      {zc.age}y • {zc.city}
                    </div>

                    <div className="mt-2 text-[10.5px] text-[#7D766C] space-y-0.5">
                      {zc.strict_filters.map((f, i) => (
                        <div key={i} className="truncate">• {f}</div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#EAE2D5] text-[10px] text-[#1F3B34]">
                    Advice: {zc.manager_recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Common Rejection Reasons & Activity (4 Cols) ─── */}
        <div className="xl:col-span-4 space-y-7">
          
          {/* Common Rejection Reasons (Dummy fallback until match feedback logging is implemented) */}
          <div className="bg-white rounded-[24px] p-5 border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="border-b border-[#F0EBE2] pb-3">
              <h3 className="text-[14px] font-bold text-[#1F3B34]">
                Common Rejection Reasons
              </h3>
              <p className="text-[11px] text-[#7D766C]">
                Primary reasons reported when proposals decline:
              </p>
            </div>

            <HorizontalBarRank items={mockRejectionReasons} />
          </div>

          {/* Recent System Activity (Real from audit_logs table) */}
          <div className="bg-white rounded-[24px] p-5 border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="border-b border-[#F0EBE2] pb-3">
              <h3 className="text-[14px] font-bold text-[#1F3B34]">
                Recent System Activity
              </h3>
              <p className="text-[11px] text-[#7D766C]">
                Latest actions logged by managers and staff:
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-[#7D766C] text-xs">
                No recent system logs found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] space-y-1 text-[11.5px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E2022]">{log.actor_name}</span>
                      <span className="text-[10px] text-[#A49C8F]">{log.created_at_relative}</span>
                    </div>
                    <p className="text-[#7D766C] leading-snug">
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
