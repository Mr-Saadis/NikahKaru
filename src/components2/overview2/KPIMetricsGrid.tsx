import React from 'react';

export default function KPIMetricsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
      {/* Metric 1: Total Registered */}
      <div className="bg-[#FDF0D8] rounded-[24px] p-5 border border-[#F6E1BA]/60 flex flex-col justify-between h-[138px] shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#78643C] uppercase tracking-wider">Total Registered</span>
          <span className="text-[11px] font-bold text-[#166534] bg-[#FEF3C7] border border-[#F6E1BA] px-2 py-0.5 rounded-full">+8.4% MoM</span>
        </div>
        <div>
          <div className="text-[28px] font-extrabold text-[#241E15] tracking-tight leading-none">3,480</div>
          <div className="text-[11.5px] font-semibold text-[#6D6558] mt-2 flex items-center justify-between">
            <span>Grooms: <strong className="text-[#241E15]">1,820</strong></span>
            <span>Brides: <strong className="text-[#241E15]">1,660</strong></span>
          </div>
        </div>
      </div>

      {/* Metric 2: Active Pool */}
      <div className="bg-[#F8F4EC] rounded-[24px] p-5 border border-[#E9E2D4] flex flex-col justify-between h-[138px] shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#766E61] uppercase tracking-wider">Active Profiles</span>
          <span className="text-[11px] font-medium text-[#7C756B]">Profiles</span>
        </div>
        <div>
          <div className="text-[28px] font-extrabold text-[#24211D] tracking-tight leading-none">2,140</div>
          <div className="text-[11.5px] font-semibold text-[#166534] mt-2 flex items-center gap-1">
            <span>Bi-directional pass rate: 91%</span>
          </div>
        </div>
      </div>

      {/* Metric 3: Locked Proposals */}
      <div className="bg-[#F8F4EC] rounded-[24px] p-5 border border-[#E9E2D4] flex flex-col justify-between h-[138px] shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#766E61] uppercase tracking-wider">In Progress Profiles</span>
          <span className="text-[11px] font-semibold text-[#8B6122]">Active Pairs</span>
        </div>
        <div>
          <div className="text-[28px] font-extrabold text-[#24211D] tracking-tight leading-none">142</div>
          <div className="text-[11.5px] font-medium text-[#7C756B] mt-2 truncate">
            <span>Shielded from duplicate offers</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Release Queue */}
      <div className="bg-[#F8F4EC] rounded-[24px] p-5 border border-[#E9E2D4] flex flex-col justify-between h-[138px] shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#766E61] uppercase tracking-wider">Release Queue</span>
          <span className="text-[11px] font-extrabold text-[#991b1b] bg-[#FEE2E2] px-2 py-0.5 rounded-full">9 Urgent</span>
        </div>
        <div>
          <div className="text-[28px] font-extrabold text-[#24211D] tracking-tight leading-none">28</div>
          <div className="text-[11.5px] font-medium text-[#7C756B] mt-2">
            <span>Manager sign-off required</span>
          </div>
        </div>
      </div>

      {/* Metric 5: Verified Unions */}
      <div className="bg-[#FDF0D8] rounded-[24px] p-5 border border-[#F6E1BA]/60 flex flex-col justify-between h-[138px] shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#78643C] uppercase tracking-wider">Married Profiles</span>
          <span className="text-[11px] font-bold text-[#166534] bg-[#FEF3C7] border border-[#F6E1BA] px-2 py-0.5 rounded-full">+14 MoM</span>
        </div>
        <div>
          <div className="text-[28px] font-extrabold text-[#002b17] tracking-tight leading-none">318</div>
          <div className="text-[11.5px] font-semibold text-[#166534] mt-2">
            <span>100% Shariah &amp; legal audited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
