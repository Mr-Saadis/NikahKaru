"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import Sidebar2 from "../../components2/Sidebar2";
import KPIMetricsGrid from "@/components2/overview2/KPIMetricsGrid";
import MatchingEngineLedger from "@/components2/overview2/MatchingEngineLedger";
import RecentProfilesQueue from "@/components2/overview2/RecentProfilesQueue";
import ReleaseDesk from "@/components2/overview2/ReleaseDesk";
import RejectionAnalytics from "@/components2/overview2/RejectionAnalytics";
import OfficerPerformance from "@/components2/overview2/OfficerPerformance";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function Overview2Page() {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col md:flex-row bg-[#FAF8F5] text-[#1E2022] ${plusJakartaSans.className} antialiased overflow-hidden`}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Subtle custom scrollbars */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #e2dcd2;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #c8c0b4;
        }
      `}} />

      {/* BEGIN: LeftSidebar */}
      <Sidebar2 activePage="overview" />
      
      {/* BEGIN: MainContentArea */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Executive Operations Sub-bar Header */}
        <div className="bg-[#FCF9F4] border-b border-[#E9E4DC]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4" data-purpose="overview-header-bar">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[#E9E4DC] shadow-sm flex items-center justify-center text-[#064e3b] flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-[#064e3b]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl lg:text-[26px] font-extrabold text-[#002b17] tracking-tight">Operations &amp; Matching Overview</h1>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
                    Live Engine Active
                  </span>
                </div>
                <p className="text-[13px] font-medium text-[#717972] mt-0.5 flex items-center gap-2">
                  <span>Quba Foundation Matrimonial Platform</span>
                  <span className="w-1 h-1 rounded-full bg-[#717972] inline-block"></span>
                  <span>Two-way compatibility ledger &amp; confidential identity data governance</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 bg-white hover:bg-[#F4ECE1] text-[#24211D] border border-[#E9E4DC] font-bold text-[12.5px] px-4 py-2.5 rounded-full shadow-sm transition duration-150">
                <svg className="w-4 h-4 text-[#717972]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span>Export Audit Report</span>
              </button>
              <button className="flex items-center gap-2 bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[12.5px] px-5 py-2.5 rounded-full shadow-sm transition duration-150 transform hover:-translate-y-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span>Run Two-Way Engine</span>
              </button>
            </div>
          </div>
        </div>

        {/* BEGIN: DashboardBodyContainer */}
        <div className="max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-7">
          
          <KPIMetricsGrid />

          {/* Main Content Two-Column Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
            
            {/* Left Column (7 cols) */}
            <div className="xl:col-span-8 space-y-7">
              <MatchingEngineLedger />
              <RecentProfilesQueue />
            </div>

            {/* Right Column (5 cols) */}
            <div className="xl:col-span-4 space-y-7">
              <ReleaseDesk />
              <RejectionAnalytics />
              <OfficerPerformance />
            </div>

          </div>
        </div>
        {/* END: DashboardBodyContainer */}
      </main>
      {/* END: MainContentArea */}
    </div>
  );
}
