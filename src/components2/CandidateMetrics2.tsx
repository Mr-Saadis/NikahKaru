import React from 'react';

export default function CandidateMetrics2() {
  return (
    <section aria-labelledby="metrics-heading" className="xl:col-span-7 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#232326] tracking-tight" id="metrics-heading">Candidate Metrics &amp; Readiness</h2>
        <span className="text-[12px] font-medium text-[#7C756B]">Updated 24 mins ago</span>
      </div>
      
      {/* 3 Rounded Metric Cards matching Paid/Due/Balance layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: Profile Completeness (Warm Light Amber Card) */}
        <div className="bg-[#FDF0D8] rounded-[24px] p-5 border border-[#F6E1BA]/60 flex flex-col justify-between h-[134px]">
          <span className="text-[12.5px] font-medium text-[#78643C]">Profile Completion</span>
          <div>
            <div className="text-[26px] font-extrabold text-[#241E15] tracking-tight leading-none">96.4%</div>
            <div className="text-[11.5px] font-semibold text-[#166534] mt-2 flex items-center gap-1">
              <span>All mandatory fields complete</span>
            </div>
          </div>
        </div>
        
        {/* Metric 2: Active Matches in Pool (Warm Soft Card) */}
        <div className="bg-[#F8F4EC] rounded-[24px] p-5 border border-[#E9E2D4] flex flex-col justify-between h-[134px]">
          <span className="text-[12.5px] font-medium text-[#766E61]">Mutual Candidates</span>
          <div>
            <div className="text-[26px] font-extrabold text-[#24211D] tracking-tight leading-none">14 Profiles</div>
            <div className="text-[11.5px] font-semibold text-[#166534] mt-2 flex items-center gap-1">
              <span>+3 new this week</span>
            </div>
          </div>
        </div>
        
        {/* Metric 3: Active Stage (Warm Card with subtle status tone) */}
        <div className="bg-[#F8F4EC] rounded-[24px] p-5 border border-[#E9E2D4] flex flex-col justify-between h-[134px]">
          <span className="text-[12.5px] font-medium text-[#766E61]">Profile Status</span>
          <div>
            <div className="text-[24px] font-extrabold text-[#24211D] tracking-tight leading-none">In Progress</div>
            <div className="text-[11.5px] font-semibold text-[#8B6122] mt-2 flex items-center gap-1">
              <span>Active Proposal Ongoing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
