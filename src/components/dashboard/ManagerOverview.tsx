'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  ShieldCheck,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FolderKanban,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import OverviewHeader from './OverviewHeader';
import { DashboardService, type ManagerDashboardData } from '@/lib/services/dashboard-service';
import { mockSmartRejectionFeed } from './mockData'; // Retained only for feedback as requested
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManagerOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'URGENT' | 'FIRST' | 'IN_REVIEW'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5); // 5-7 items per page
  const [staffPage, setStaffPage] = useState<number>(1);
  const [staffPageSize, setStaffPageSize] = useState<number>(5); // 5-7 items per page

  const handleFilterChange = (mode: 'ALL' | 'URGENT' | 'FIRST' | 'IN_REVIEW') => {
    setFilterMode(mode);
    setCurrentPage(1);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await DashboardService.getDashboardData('MANAGER');
        if (isMounted) {
          setData(res as ManagerDashboardData);
        }
      } catch (err: any) {
        console.error('Error loading manager dashboard:', err);
        toast.error('Failed to load manager dashboard data');
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
          <span>Loading operations overview...</span>
        </div>
      </div>
    );
  }

  const requests = data?.requests || [];
  const staffWorkload = data?.staffWorkload || [];
  const stats = data?.stats || {
    pendingRequests: 0,
    releasedToday: 0,
    activeInTalks: 0,
    staffHandled: 0,
  };

  const filteredRequests = requests.filter((r) => {
    if (filterMode === 'URGENT') return r.is_urgent;
    if (filterMode === 'FIRST') return r.status === 'PENDING';
    if (filterMode === 'IN_REVIEW') return r.status === 'IN_REVIEW';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize);

  const totalStaffPages = Math.max(1, Math.ceil(staffWorkload.length / staffPageSize));
  const staffStartIndex = (staffPage - 1) * staffPageSize;
  const paginatedStaff = staffWorkload.slice(staffStartIndex, staffStartIndex + staffPageSize);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const inReviewCount = requests.filter((r) => r.status === 'IN_REVIEW').length;
  const urgentCount = requests.filter((r) => r.is_urgent).length;

  return (
    <div className="space-y-7">
      
      {/* ════════════════════════════════════════════════════════════════
          PAGE HEADER (Native Notification Flow & Real DB Stats)
      ════════════════════════════════════════════════════════════════ */}
      <OverviewHeader
        title="Overview"
        subtitle="Incoming staff requests, matching runs & case distribution"
        stats={[
          { label: 'Pending Requests', value: stats.pendingRequests, color: '#D4AF37' },
          { label: 'Total Releases', value: stats.releasedToday, color: '#2F3E51' },
          { label: 'In Review / Ready', value: stats.activeInTalks, color: '#1F3B34' },
          { label: 'Active Staff', value: stats.staffHandled, color: '#7D766C' },
        ]}
      />

      {/* ════════════════════════════════════════════════════════════════
          MAIN 2-COLUMN WORKSPACE
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        
        {/* ─── LEFT COLUMN: Requests Queue (8 Cols) ─── */}
        <div className="xl:col-span-8 space-y-7">
          
          <div className="bg-white rounded-[24px] p-6 border border-[#E9E4DC] shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EBE2] pb-4">
              <div>
                <h2 className="text-[16px] font-bold text-[#1F3B34] tracking-tight">
                  Incoming Requests Queue
                </h2>
                <p className="text-[12px] text-[#7D766C] mt-0.5">
                  Client matching requests submitted by staff members:
                </p>
              </div>

              {/* Filter Tabs & Redirect to Board */}
              <div className="flex items-center gap-2">
                <div className="bg-[#FAF8F5] p-1 rounded-full flex items-center border border-[#E9E4DC]">
                  <button
                    onClick={() => handleFilterChange('ALL')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      filterMode === 'ALL'
                        ? 'bg-[#1F3B34] text-white shadow-xs'
                        : 'text-[#7D766C] hover:text-[#1F3B34]'
                    }`}
                  >
                    All ({requests.length})
                  </button>
                  <button
                    onClick={() => handleFilterChange('URGENT')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      filterMode === 'URGENT'
                        ? 'bg-[#991B1B] text-white shadow-xs'
                        : 'text-[#991B1B] hover:bg-[#FEE2E2]'
                    }`}
                  >
                    Urgent ({urgentCount})
                  </button>
                  <button
                    onClick={() => handleFilterChange('FIRST')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      filterMode === 'FIRST'
                        ? 'bg-[#1F3B34] text-white shadow-xs'
                        : 'text-[#7D766C] hover:text-[#1F3B34]'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => handleFilterChange('IN_REVIEW')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      filterMode === 'IN_REVIEW'
                        ? 'bg-[#2F3E51] text-white shadow-xs'
                        : 'text-[#7D766C] hover:text-[#1F3B34]'
                    }`}
                  >
                    Reviewed ({inReviewCount})
                  </button>
                </div>

                <Link
                  href="/requests"
                  className="hidden sm:inline-flex items-center gap-1 text-[11.5px] font-bold text-[#1F3B34] hover:underline"
                >
                  <span>Operations Board</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Request items */}
            {filteredRequests.length === 0 ? (
              <div className="py-12 text-center bg-[#FAF8F5] rounded-2xl border border-[#E9E4DC] text-[#7D766C] text-[13px]">
                No matching requests found in this queue.
              </div>
            ) : (
              <div className="space-y-3.5">
                {paginatedRequests.map((req) => {
                  const isPending = req.status === 'PENDING';
                  const isInReview = req.status === 'IN_REVIEW';
                  const p = req.source_profile;

                  return (
                    <div
                      key={req.id}
                      onClick={() => router.push('/requests')}
                      className="p-5 rounded-[20px] bg-[#FAF8F5] border border-[#E9E4DC] hover:border-[#1F3B34]/30 transition-all space-y-3 cursor-pointer"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[14.5px] text-[#1E2022]">
                              {p.full_name}
                            </span>
                            <span className="font-mono text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#E9E4DC] text-[#717972]">
                              {p.profile_code}
                            </span>

                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              isPending ? 'bg-[#FEF3C7] text-[#8B6122]' : 'bg-[#E5EFE9] text-[#166534]'
                            }`}>
                              {isPending ? 'Pending Match Run' : 'Scored • Ready to Release'}
                            </span>

                            {req.is_urgent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B]">
                                Waiting {req.created_at_relative}
                              </span>
                            )}
                          </div>

                          <div className="text-[12px] text-[#7D766C] mt-1 flex items-center gap-2 flex-wrap">
                            <span>{p.age} yrs</span>
                            <span>•</span>
                            <span>{p.city}</span>
                            <span>•</span>
                            <span className="font-medium text-[#1E2022]">{p.caste}</span>
                            <span>•</span>
                            <span>{p.education}</span>
                          </div>

                          <div className="text-[11px] text-[#7D766C] mt-1">
                            Requested by <strong>{req.requested_by_agent}</strong>
                            {req.notes && <span className="italic ml-2 text-[#A49C8F]">"{req.notes}"</span>}
                          </div>
                        </div>

                        {/* Action Buttons — Redirect to Original Working Page */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isPending && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push('/requests');
                              }}
                              className="px-4 py-2 rounded-full bg-[#1F3B34] hover:bg-[#172E29] text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Run Match on Board</span>
                            </button>
                          )}

                          {isInReview && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push('/requests');
                              }}
                              className="px-4 py-2 rounded-full bg-[#2F3E51] hover:bg-[#233040] text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Review & Release</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* ─── PAGINATION BAR (5-7 Limit as requested) ─── */}
                {filteredRequests.length > 0 && (
                  <div className="pt-3 border-t border-[#F0EBE2] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]">
                    
                    {/* Counter & Limit Selector */}
                    <div className="flex items-center gap-3 text-[#7D766C]">
                      <span>
                        Showing <strong className="text-[#1E2022]">{startIndex + 1}</strong>–<strong className="text-[#1E2022]">{Math.min(startIndex + pageSize, filteredRequests.length)}</strong> of <strong className="text-[#1E2022]">{filteredRequests.length}</strong>
                      </span>
                      
                      <div className="h-3.5 w-px bg-[#E9E4DC]" />

                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span>Per page:</span>
                        {[5, 7].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setPageSize(size);
                              setCurrentPage(1);
                            }}
                            className={`px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                              pageSize === size
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
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-full border border-[#E9E4DC] hover:bg-[#FAF8F5] text-[#1E2022] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-7 h-7 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                                currentPage === page
                                ? 'bg-[#1F3B34] text-white shadow-xs'
                                : 'text-[#7D766C] hover:bg-[#FAF8F5] hover:text-[#1E2022]'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
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

          {/* ─── CARD 2: STAFF OPERATIONS & REPORTING (Staff reporting to Manager) ─── */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E9E4DC] shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EBE2] pb-4">
              <div>
                <h2 className="text-[16px] font-bold text-[#1F3B34] tracking-tight">
                  Team Operations & Queues
                </h2>
                <p className="text-[12px] text-[#7D766C] mt-0.5">
                  Review response times, pending queues and staff activity
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E9E4DC] text-[#1F3B34]">
                  Staff Members ({staffWorkload.length})
                </span>
                <Link
                  href="/directory"
                  className="hidden sm:inline-flex items-center gap-1 text-[11.5px] font-bold text-[#1F3B34] hover:underline"
                >
                  <span>Directory</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* STAFF REPORTING TABLE */}
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
                  {paginatedStaff.map((agent) => (
                    <tr
                      key={agent.id}
                      onClick={() => router.push('/directory')}
                      className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#1E2022]">{agent.name}</div>
                        <div className="text-[10.5px] text-[#7D766C]">{agent.email}</div>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-[#1E2022]">
                        {agent.currently_owned}
                      </td>

                      <td className="py-3.5 px-3">
                        {agent.stuck_in_draft > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FEF3C7] text-[#8B6122]">
                            {agent.stuck_in_draft} Drafts
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#166534]">0</span>
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

            {/* ─── PAGINATION BAR FOR STAFF (5-7 Limit) ─── */}
            {staffWorkload.length > staffPageSize && (
              <div className="pt-3 border-t border-[#F0EBE2] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]">
                
                {/* Counter & Limit Selector */}
                <div className="flex items-center gap-3 text-[#7D766C]">
                  <span>
                    Showing <strong className="text-[#1E2022]">{staffStartIndex + 1}</strong>–<strong className="text-[#1E2022]">{Math.min(staffStartIndex + staffPageSize, staffWorkload.length)}</strong> of <strong className="text-[#1E2022]">{staffWorkload.length}</strong>
                  </span>
                  
                  <div className="h-3.5 w-px bg-[#E9E4DC]" />

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span>Per page:</span>
                    {[5, 7].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setStaffPageSize(size);
                          setStaffPage(1);
                        }}
                        className={`px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                          staffPageSize === size
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
                {totalStaffPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setStaffPage((p) => Math.max(p - 1, 1))}
                      disabled={staffPage === 1}
                      className="p-1.5 rounded-full border border-[#E9E4DC] hover:bg-[#FAF8F5] text-[#1E2022] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalStaffPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setStaffPage(page)}
                          className={`w-7 h-7 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                            staffPage === page
                            ? 'bg-[#1F3B34] text-white shadow-xs'
                            : 'text-[#7D766C] hover:bg-[#FAF8F5] hover:text-[#1E2022]'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setStaffPage((p) => Math.min(p + 1, totalStaffPages))}
                      disabled={staffPage === totalStaffPages}
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

        </div>

        {/* ─── RIGHT COLUMN: Operations Desk & Recent Declines (4 Cols) ─── */}
        <div className="xl:col-span-4 space-y-7">
          
          {/* Manager Operations Quick Desk */}
          <div className="bg-white rounded-[24px] p-5 border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F3B34]">
                  Manager Workflows
                </h3>
                <p className="text-[11px] text-[#7D766C]">
                  Quick navigation across matching operations
                </p>
              </div>

              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E9E4DC] text-[#7D766C]">
                Desk
              </span>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/requests"
                className="p-3 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] hover:border-[#1F3B34]/30 hover:bg-[#F3EFEA] flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E9E4DC] flex items-center justify-center text-[#1F3B34] group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[12.5px] text-[#1E2022]">
                      Matching Requests Board
                    </div>
                    <div className="text-[11px] text-[#7D766C]">
                      Run matches & approve releases
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#8B6122] text-[10.5px] font-bold">
                  {stats.pendingRequests} Pending
                </span>
              </Link>

              <Link
                href="/directory"
                className="p-3 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] hover:border-[#1F3B34]/30 hover:bg-[#F3EFEA] flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E9E4DC] flex items-center justify-center text-[#2F3E51] group-hover:scale-105 transition-transform">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[12.5px] text-[#1E2022]">
                      Candidate Directory
                    </div>
                    <div className="text-[11px] text-[#7D766C]">
                      Search & filter candidate pool
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7D766C] group-hover:text-[#1F3B34] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/add-profile"
                className="p-3 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] hover:border-[#1F3B34]/30 hover:bg-[#F3EFEA] flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E9E4DC] flex items-center justify-center text-[#166534] group-hover:scale-105 transition-transform">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[12.5px] text-[#1E2022]">
                      Register New Profile
                    </div>
                    <div className="text-[11px] text-[#7D766C]">
                      Add new client to repository
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7D766C] group-hover:text-[#1F3B34] group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Recent Family Declines (Dummy/Fallback as feedback is not implemented in DB yet) */}
          <div className="bg-white rounded-[24px] p-5 border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="border-b border-[#F0EBE2] pb-3">
              <h3 className="text-[14px] font-bold text-[#1F3B34]">
                Recent Family Feedback
              </h3>
              <p className="text-[11px] text-[#7D766C]">
                Feedback reported by families with immediate next suggestions:
              </p>
            </div>

            <div className="space-y-3">
              {mockSmartRejectionFeed.map((rej) => (
                <div
                  key={rej.id}
                  className="p-3.5 rounded-[16px] bg-[#FAF8F5] border border-[#E9E4DC] space-y-2 text-[12px]"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#991B1B]">{rej.rejection_reason_en}</span>
                    <span className="text-[#A49C8F]">{rej.time_relative}</span>
                  </div>

                  <div className="text-[12px] font-bold text-[#1E2022]">
                    {rej.male_name.split(' (')[0]} & {rej.female_name.split(' (')[0]}
                  </div>

                  <p className="text-[11px] text-[#7D766C] italic">
                    "{rej.agent_notes}"
                  </p>

                  <div className="pt-1.5 border-t border-[#EAE2D5] flex items-center justify-between">
                    <span className="text-[11px] text-[#1F3B34] font-medium truncate max-w-[170px]">
                      Next: {rej.suggested_candidate_name}
                    </span>
                    <button
                      onClick={() => router.push('/requests')}
                      className="px-2.5 py-1 rounded-full bg-[#1F3B34] hover:bg-[#172E29] text-white text-[10.5px] font-bold transition-all cursor-pointer"
                    >
                      Open Board
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
