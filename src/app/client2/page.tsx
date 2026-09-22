"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import Sidebar2 from "../../components2/Sidebar2";
import Header2 from "../../components2/Header2";
import CandidateMetrics2 from "../../components2/CandidateMetrics2";
import AlignmentDistribution2 from "../../components2/AlignmentDistribution2";
import PrimaryCandidate2 from "../../components2/PrimaryCandidate2";
import EngagementActivity2 from "../../components2/EngagementActivity2";
import MatchLedger2 from "../../components2/MatchLedger2";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function Client2Page() {
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
        /* Capsule bar hover subtle effect */
        .capsule-bar {
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .capsule-bar:hover {
          transform: scaleY(1.04);
          opacity: 0.92;
        }
      `}} />

      {/* BEGIN: LeftSidebar */}
        <Sidebar2 />
        {/* END: LeftSidebar */}
        
        {/* BEGIN: MainContentArea */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* BEGIN: TopHeaderBar */}
          <Header2 />
          {/* END: TopHeaderBar */}
          
          {/* BEGIN: DashboardBodyContainer */}
          <div className="p-6 lg:p-8 space-y-7">
            {/* BEGIN: SectionMetricsAndDistribution */}
            {/* Two-column row: Left 3 summary cards + Right capsule bar status visualization */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Column (Overall Metrics Cards) - span 7 cols */}
              <CandidateMetrics2 />
              
              {/* Right Column: Capsule Bar Status Distribution */}
              <AlignmentDistribution2 />
            </div>
            {/* END: SectionMetricsAndDistribution */}
            
            {/* BEGIN: SectionProposalCardAndRecentActivity */}
            {/* Two-column row: Left High-Priority Proposal Card + Right Recent Activity / Contact logs */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Column: Primary Matched Candidate */}
              <PrimaryCandidate2 />
              
              {/* Right Column: Recent Guardian Transactions & Logs */}
              <EngagementActivity2 />
            </div>
            {/* END: SectionProposalCardAndRecentActivity */}
            
            {/* BEGIN: SectionPairingLedgerTable */}
            <MatchLedger2 />
            {/* END: SectionPairingLedgerTable */}
          </div>
          {/* END: DashboardBodyContainer */}
        </main>
        {/* END: MainContentArea */}
    </div>
  );
}
