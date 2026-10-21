'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import OverviewHeader from './OverviewHeader';
import { DashboardService, type StaffDashboardData, type ReleaseItem } from '@/lib/services/dashboard-service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StaffOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StaffDashboardData | null>(null);

  // Pagination for Ready for Client Delivery (5-7 limit)
  const [releasesPage, setReleasesPage] = useState<number>(1);
  const [releasesPageSize, setReleasesPageSize] = useState<number>(5);

  // Pagination for Requests with Manager (5-7 limit)
  const [requestsPage, setRequestsPage] = useState<number>(1);
  const [requestsPageSize, setRequestsPageSize] = useState<number>(5);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await DashboardService.getDashboardData('AGENT');
        if (isMounted) {
          setData(res as StaffDashboardData);
        }
      } catch (err: any) {
        console.error('Error loading staff dashboard:', err);
        toast.error('Failed to load dashboard data');
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
          <span>Loading staff overview...</span>
        </div>
      </div>
    );
  }

  const releases = data?.releases || [];
  const requests = data?.requestsPipeline || [];
  const drafts = data?.drafts || [];
  const stats = data?.stats || {
    assignedProfiles: 0,
    releasedForClient: 0,
    activeInTalks: 0,
    draftsPending: 0,
  };

  // Sliced data for pagination
  const totalReleasePages = Math.max(1, Math.ceil(releases.length / releasesPageSize));
  const releaseStartIndex = (releasesPage - 1) * releasesPageSize;
  const paginatedReleases = releases.slice(releaseStartIndex, releaseStartIndex + releasesPageSize);

  const totalRequestPages = Math.max(1, Math.ceil(requests.length / requestsPageSize));
  const requestStartIndex = (requestsPage - 1) * requestsPageSize;
  const paginatedRequests = requests.slice(requestStartIndex, requestStartIndex + requestsPageSize);

  return (
    <div className="space-y-7">
      
      {/* ════════════════════════════════════════════════════════════════
          PAGE HEADER (Native Notification Flow & Real DB Stats)
      ════════════════════════════════════════════════════════════════ */}
      <OverviewHeader
        title="Overview"
        subtitle="Your assigned profiles, released candidates & relationship progress"
        stats={[
          { label: 'Assigned Profiles', value: stats.assignedProfiles },
          { label: 'Released for Client', value: stats.releasedForClient, color: '#2F3E51' },
          { label: 'Active in Talks', value: stats.activeInTalks, color: '#1F3B34' },
          { label: 'Drafts Pending', value: stats.draftsPending, color: '#C86A4A' },
        ]}
      />

      {/* ════════════════════════════════════════════════════════════════
          MAIN 2-COLUMN WORKSPACE
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        
        {/* ─── LEFT COLUMN: Core Workflows (8 Cols) ─── */}
        <div className="xl:col-span-8 space-y-7">
          
          {/* Section 1: Ready for Client Delivery */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E9E4DC] shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-4">
              <div>
                <h2 className="text-[16px] font-bold text-[#1F3B34] tracking-tight">
                  Ready for Client Delivery
                </h2>
                <p className="text-[12px] text-[#7D766C] mt-0.5">
                  The manager has reviewed and released these candidates. Download the PDF dossier to share with the family:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E5EFE9] text-[#1F3B34]">
                  {releases.length} Candidates
                </span>
                <Link
                  href="/agent-requests"
                  className="hidden sm:inline-flex items-center gap-1 text-[11.5px] font-bold text-[#1F3B34] hover:underline"
                >
                  <span>Requests Board</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {releases.length === 0 ? (
              <div className="py-12 text-center bg-[#FAF8F5] rounded-2xl border border-[#E9E4DC] text-[#7D766C] text-[13px] space-y-2">
                <div className="font-semibold text-[#1F3B34]">No pending releases right now</div>
                <p className="text-xs text-[#A49C8F]">
                  Once the manager reviews and approves candidate dossiers for your requests, they will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    href="/agent-requests"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#1F3B34] text-white text-xs font-bold hover:bg-[#172E29] transition-colors"
                  >
                    <span>View Requests Board</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {paginatedReleases.map((rel: ReleaseItem) => (
                  <div
                    key={rel.id}
                    className="p-5 rounded-[20px] bg-[#FAF8F5] border border-[#E9E4DC] hover:border-[#1F3B34]/30 transition-all space-y-3.5"
                  >
                    {/* Header info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[14.5px] text-[#1F3B34]">
                            {rel.source_profile.full_name}
                          </span>
                          <span className="text-[#A49C8F] text-xs">for</span>
                          <span className="font-bold text-[14.5px] text-[#1E2022]">
                            {rel.candidate_profile.full_name}
                          </span>
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E9E4DC] text-[#1F3B34]">
                            {rel.compatibility_score}% Match
                          </span>
                        </div>

                        <div className="text-[12px] text-[#7D766C] mt-1 flex items-center gap-2 flex-wrap">
                          <span>{rel.candidate_profile.age} yrs</span>
                          <span>•</span>
                          <span>{rel.candidate_profile.city}</span>
                          <span>•</span>
                          <span className="font-medium text-[#1E2022]">{rel.candidate_profile.caste}</span>
                          <span>•</span>
                          <span>{rel.candidate_profile.education}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#7D766C] md:text-right">
                        <span>Approved by <strong>{rel.approved_by_manager}</strong></span>
                        <div className="text-[10.5px] text-[#A49C8F] mt-0.5">{rel.approved_at_relative}</div>
                      </div>
                    </div>

                    {/* Actions — Pure Redirections to Original Working Pages */}
                    <div className="pt-3 border-t border-[#EAE2D5] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push('/agent-requests')}
                          className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F2EDE1] border border-[#E9E4DC] text-[#1F3B34] text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View on Requests Board</span>
                        </button>

                        <button
                          onClick={() => router.push('/agent-requests')}
                          className="px-3.5 py-1.5 rounded-full bg-[#1F3B34] hover:bg-[#172E29] text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Dossier</span>
                        </button>
                      </div>

                      <button
                        onClick={() => router.push('/agent-requests')}
                        className="px-4 py-1.5 rounded-full bg-white hover:bg-[#E5EFE9] border border-[#1F3B34] text-[#1F3B34] text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-[#1F3B34]/20" />
                        <span>Manage in Requests</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* ─── PAGINATION BAR FOR RELEASES (5-7 Limit as requested) ─── */}
                {releases.length > 0 && (
                  <div className="pt-3 border-t border-[#F0EBE2] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]">
                    
                    {/* Counter & Limit Selector */}
                    <div className="flex items-center gap-3 text-[#7D766C]">
                      <span>
                        Showing <strong className="text-[#1E2022]">{releaseStartIndex + 1}</strong>–<strong className="text-[#1E2022]">{Math.min(releaseStartIndex + releasesPageSize, releases.length)}</strong> of <strong className="text-[#1E2022]">{releases.length}</strong>
                      </span>
                      
                      <div className="h-3.5 w-px bg-[#E9E4DC]" />

                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span>Per page:</span>
                        {[5, 7].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setReleasesPageSize(size);
                              setReleasesPage(1);
                            }}
                            className={`px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                              releasesPageSize === size
                                ? 'bg-[#1F3B34] text-white shadow-xs'
                                : 'bg-[#FAF8F5] text-[#7D766C] hover:text-[#1F3B34] border border-[#E9E4DC]'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pagination Nav Buttons */}
                    {totalReleasePages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setReleasesPage((p) => Math.max(p - 1, 1))}
                          disabled={releasesPage === 1}
                          className="p-1.5 rounded-full border border-[#E9E4DC] hover:bg-[#FAF8F5] text-[#1E2022] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalReleasePages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setReleasesPage(page)}
                              className={`w-7 h-7 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                                releasesPage === page
                                ? 'bg-[#1F3B34] text-white shadow-xs'
                                : 'text-[#7D766C] hover:bg-[#FAF8F5] hover:text-[#1E2022]'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setReleasesPage((p) => Math.min(p + 1, totalReleasePages))}
                          disabled={releasesPage === totalReleasePages}
                          className="p-1.5 rounded-full border border-[#E9E4DC] hover:bg-[#FAF8F5] text-[#1E2022] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Next page"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Active Discussions (In-Progress) */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-4">
              <div>
                <h2 className="text-[16px] font-bold text-[#1F3B34] tracking-tight">
                  Active Client Discussions
                </h2>
                <p className="text-[12px] text-[#7D766C] mt-0.5">
                  Keep notes updated. Record whether families agreed to proceed or declined:
                </p>
              </div>

              <Link
                href="/profiles"
                className="text-[11.5px] font-bold text-[#1F3B34] hover:underline flex items-center gap-1"
              >
                <span>Profiles Directory</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="py-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#E9E4DC] text-[#7D766C] text-[13px] space-y-2">
              <div className="font-semibold text-[#1F3B34]">No active match discussions yet</div>
              <p className="text-xs text-[#A49C8F]">
                When families start direct communication on released candidates, tracking appears here.
              </p>
              <div className="pt-2">
                <Link
                  href="/agent-requests"
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-white border border-[#E9E4DC] text-[#1F3B34] text-xs font-bold hover:bg-[#FAF8F5] transition-colors"
                >
                  <span>Open Requests Board</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Requests & Incomplete Profiles (4 Cols) ─── */}
        <div className="xl:col-span-4 space-y-7">
          
          {/* Requests Status */}
          <div className="bg-white rounded-[24px] p-5 border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F3B34]">
                  Requests with Manager
                </h3>
                <p className="text-[11px] text-[#7D766C]">
                  Track progress of submitted requests
                </p>
              </div>

              <Link
                href="/agent-requests"
                className="text-[11px] font-bold text-[#1F3B34] flex items-center gap-1 hover:underline"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="py-6 text-center text-[#7D766C] text-xs">
                No active requests submitted yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedRequests.map((req: any) => (
                  <div
                    key={req.id}
                    onClick={() => router.push('/agent-requests')}
                    className="p-3 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] hover:border-[#1F3B34]/30 transition-all flex items-center justify-between gap-3 text-[12px] cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[#1E2022] truncate">
                        {req.profile_name}
                      </div>
                      <div className="text-[10.5px] text-[#7D766C] mt-0.5">
                        {req.submitted_date} • {req.assigned_manager}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        req.status === 'COMPLETED' || req.status === 'DOWNLOADED'
                          ? 'bg-[#E5EFE9] text-[#166534]'
                          : req.status === 'IN_REVIEW'
                          ? 'bg-[#F2EDE1] text-[#2F3E51]'
                          : 'bg-[#FEF3C7] text-[#8B6122]'
                      }`}
                    >
                      {req.status === 'PENDING' ? 'With Manager' : req.status === 'IN_REVIEW' ? 'Matching Ready' : req.status === 'DOWNLOADED' ? 'Downloaded' : 'Completed'}
                    </span>
                  </div>
                ))}

                {/* ─── PAGINATION BAR FOR REQUESTS (5-7 Limit as requested) ─── */}
                {requests.length > requestsPageSize && (
                  <div className="pt-2 border-t border-[#F0EBE2] flex items-center justify-between text-[11px] text-[#7D766C]">
                    <div className="flex items-center gap-1.5">
                      <span>Per page:</span>
                      {[5, 7].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setRequestsPageSize(size);
                            setRequestsPage(1);
                          }}
                          className={`px-1.5 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                            requestsPageSize === size
                              ? 'bg-[#1F3B34] text-white shadow-xs'
                              : 'bg-[#FAF8F5] text-[#7D766C] hover:text-[#1F3B34] border border-[#E9E4DC]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRequestsPage((p) => Math.max(p - 1, 1))}
                        disabled={requestsPage === 1}
                        className="p-1 rounded-full border border-[#E9E4DC] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-[#1E2022] px-1">
                        {requestsPage} / {totalRequestPages}
                      </span>
                      <button
                        onClick={() => setRequestsPage((p) => Math.min(p + 1, totalRequestPages))}
                        disabled={requestsPage === totalRequestPages}
                        className="p-1 rounded-full border border-[#E9E4DC] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Next page"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Incomplete Profiles (Drafts) */}
          <div className="bg-white rounded-[24px] p-5 border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F3B34]">
                  Draft Profiles
                </h3>
                <p className="text-[11px] text-[#7D766C]">
                  Finish required details to enable matching
                </p>
              </div>

              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#8B6122]">
                {drafts.length} Pending
              </span>
            </div>

            {drafts.length === 0 ? (
              <div className="py-6 text-center text-[#7D766C] text-xs">
                No draft profiles pending completion.
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft: any) => (
                  <div
                    key={draft.id}
                    className="p-3.5 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] space-y-2 text-[12px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E2022]">{draft.name}</span>
                      <span className="text-[10.5px] text-[#A49C8F]">{draft.updated_at}</span>
                    </div>

                    <div className="text-[11px] text-[#7D766C]">
                      {draft.age}y • {draft.city} • <span className="font-medium text-[#1F3B34]">{draft.step_name}</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10.5px] text-[#7D766C]">
                        Step {draft.current_step} of {draft.total_steps}
                      </span>
                      <button
                        onClick={() => router.push('/add-profile')}
                        className="px-3 py-1 rounded-full bg-[#1F3B34] hover:bg-[#172E29] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                      >
                        Continue
                      </button>
                    </div>
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
