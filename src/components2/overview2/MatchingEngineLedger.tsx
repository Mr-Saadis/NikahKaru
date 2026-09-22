import React, { useState } from 'react';
import { sharedMockMatches } from '@/data/mockData';
import Link from 'next/link';

export default function MatchingEngineLedger() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredMatches = sharedMockMatches.filter(match => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Fast-Track Only') return match.affinity > 90;
    if (activeFilter === 'SLA Alert') return match.statusBadgeBg === '#FEF3C7'; // Pending matches
    return true;
  });

  const handleDummyAction = (e: React.MouseEvent, actionName: string) => {
    e.preventDefault();
    alert(`${actionName} feature is under development.`);
  };
  return (
    <section aria-labelledby="engine-ledger-heading" className="bg-white rounded-[28px] border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] p-6 lg:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0EBE2]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setActiveFilter('All')} 
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition shadow-sm ${activeFilter === 'All' ? 'bg-[#064e3b] text-white' : 'border border-[#E2DBD0] text-[#676156] hover:bg-[#FAF7F2]'}`}>
              Tier 1 &amp; 2 Matches
            </button>
            <button 
              onClick={() => setActiveFilter('Fast-Track Only')} 
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition shadow-sm ${activeFilter === 'Fast-Track Only' ? 'bg-[#064e3b] text-white' : 'border border-[#E2DBD0] text-[#676156] hover:bg-[#FAF7F2]'}`}>
              Fast-Track Only
            </button>
            <button 
              onClick={() => setActiveFilter('SLA Alert')} 
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition flex items-center gap-1.5 shadow-sm ${activeFilter === 'SLA Alert' ? 'bg-[#064e3b] text-white' : 'border border-[#E2DBD0] text-[#676156] hover:bg-[#FAF7F2]'}`}>
              <span className={`w-2 h-2 rounded-full ${activeFilter === 'SLA Alert' ? 'bg-white' : 'bg-[#B45309]'}`}></span>
              <span>SLA Alert</span>
              <span className={`${activeFilter === 'SLA Alert' ? 'bg-[#0f4229] text-white' : 'bg-[#FEF3C7] text-[#B45309]'} px-1.5 py-0.5 rounded-md text-[10px] ml-1`}>2</span>
            </button>
          </div>
          <p className="text-[12.5px] text-[#78716C] mt-1">
            Bi-directional algorithmic scoring: filters strictly against mutual dealbreakers before measuring lifestyle compatibility.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={(e) => handleDummyAction(e, 'Re-index Ledger')} className="px-3.5 py-1.5 rounded-full bg-[#064e3b] text-white text-[12px] font-bold hover:bg-[#0f4229] transition shadow-sm flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Re-index Ledger</span>
          </button>
        </div>
      </div>

      {/* 3-Stage Pipeline Filter Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F8F5EE] p-3 rounded-2xl border border-[#EBE4D8]">
        <div className="bg-white p-3.5 rounded-xl border border-[#E9E2D4] shadow-sm flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#24211D] text-white flex items-center justify-center font-extrabold text-xs shrink-0">1</div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12.5px] font-bold text-[#24211D] leading-tight">Hard Filters</span>
            <span className="text-[11px] text-[#7C756B] truncate">Sect, Marital Status, City</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E9E2D4] shadow-sm flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-extrabold text-xs shrink-0">2</div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12.5px] font-bold text-[#24211D] leading-tight">Soft Preferences</span>
            <span className="text-[11px] text-[#7C756B] truncate">Age Delta, Education, Career</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E9E2D4] shadow-sm flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#725b24] text-white flex items-center justify-center font-extrabold text-xs shrink-0">3</div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12.5px] font-bold text-[#24211D] leading-tight">Bi-Directional Rank</span>
            <span className="text-[11px] text-[#7C756B] truncate">Reciprocal threshold (&gt;75%)</span>
          </div>
        </div>
      </div>

      {/* Recommended Mutual Matches Sub-list */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#766E61] uppercase tracking-wider text-[11px]">Recommended Mutual Matches</span>
          <span className="text-[#8D867C] font-medium">Real-time candidate pairing ledger</span>
        </div>

        {filteredMatches.length === 0 && (
          <div className="p-8 text-center text-[#78716C] text-[13px] font-medium border border-dashed border-[#E2DBD0] rounded-xl">
            No matches found for the selected filter.
          </div>
        )}

        {filteredMatches.map((match, index) => (
          <div key={index} className="bg-[#FBF9F5] hover:bg-[#F6F2E9] border border-[#EAE2D5] rounded-[22px] p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0" style={{ backgroundColor: match.maleProfile.initialsBg, color: match.maleProfile.initialsText }}>
                {match.maleProfile.displayId}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#002b17] font-mono">#{match.maleProfile.id}</span>
                  {match.maleProfile.verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333]">Verified</span>
                  )}
                </div>
                <span className="text-[12.5px] font-bold text-[#2A2925] truncate">{match.maleProfile.name}</span>
                <span className="text-[11px] text-[#78716C]">{match.maleProfile.city}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-1 shrink-0 self-center">
              <span className="text-lg font-black text-[#064e3b] leading-none">{match.affinity}%</span>
              <span className="text-[10px] font-extrabold text-[#766E61] uppercase tracking-wider mt-0.5">{match.affinityLabel}</span>
              <div className="w-20 bg-[#E2DBD0] rounded-full h-1.5 mt-1 overflow-hidden">
                <div className="bg-[#064e3b] h-full rounded-full" style={{ width: `${match.affinity}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-3 min-w-0 flex-1 justify-start md:justify-end text-left md:text-right">
              <div className="flex flex-col min-w-0 order-2 md:order-1">
                <div className="flex items-center gap-1.5 justify-start md:justify-end">
                  {match.femaleProfile.verified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">Verified</span>
                  )}
                  <span className="text-xs font-bold text-[#002b17] font-mono">#{match.femaleProfile.id}</span>
                </div>
                <span className="text-[12.5px] font-bold text-[#2A2925] truncate">{match.femaleProfile.name}</span>
                <span className="text-[11px] text-[#78716C]">{match.femaleProfile.city}</span>
              </div>
              <div className="w-10 h-10 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 order-1 md:order-2" style={{ backgroundColor: match.femaleProfile.initialsBg, color: match.femaleProfile.initialsText }}>
                {match.femaleProfile.displayId}
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EFE8DC]">
              <div className="text-left md:text-right">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border" style={{ backgroundColor: match.statusBadgeBg, color: match.statusBadgeColor, borderColor: match.statusBadgeBorder }}>
                  {match.statusText}
                </span>
                <p className="text-[10px] text-[#8C8478] mt-0.5">Agent: {match.statusAgent}</p>
              </div>
              <Link href="/client2" className={`px-4 py-2 rounded-full text-[11.5px] font-bold transition shadow-sm ${match.buttonStyle}`}>
                {match.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
