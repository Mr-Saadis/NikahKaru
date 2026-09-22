import React from 'react';
import { sharedMockProfiles } from '@/data/mockData';

export default function PrimaryCandidate2() {
  // Dynamically filter top match based on the primary candidate's gender
  const mainCandidate = sharedMockProfiles[0];
  const topMatch = sharedMockProfiles.find(profile => profile.gender !== mainCandidate.gender) || sharedMockProfiles[1];

  const handleDummyAction = (e: React.MouseEvent, actionName: string) => {
    e.preventDefault();
    alert(`${actionName} feature is under development.`);
  };

  return (
    <section aria-labelledby="primary-proposal-heading" className="xl:col-span-7 space-y-3">
      <h2 className="text-[15px] font-bold text-[#232326] tracking-tight" id="primary-proposal-heading">Primary Recommended Candidate</h2>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Golden Highlight Card (The Visa Card analog in reference) */}
        <div className="sm:col-span-8 relative bg-[#F7F3EA] border border-[#ECC066]/60 rounded-[28px] p-6 text-[#1c1c19] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between min-h-[196px]">
          <div className="absolute right-0 top-3 bottom-3 w-2.5 bg-[#064e3b] rounded-l-md opacity-90 pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#725b24] bg-[#FEF3C7] border border-[#F6E1BA] px-2.5 py-0.5 rounded-full backdrop-blur-sm">Top Algorithmic Match</span>
              <h3 className="text-xl font-extrabold text-[#002b17] mt-1.5 tracking-tight">{topMatch.name}</h3>
              <p className="text-[12px] font-semibold text-[#59440e]">{topMatch.education} • {topMatch.city}</p>
            </div>
            <div className="w-10 h-7 rounded-md bg-white border border-[#ECC066] flex items-center justify-center shadow-sm">
              <span className="text-[9px] font-black text-[#064e3b] tracking-tighter">{topMatch.affinity}%</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#DFD6C5] flex items-end justify-between relative z-10">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#725b24] tracking-wider">Candidate Registry ID</div>
              <div className="text-[15px] font-bold text-[#002b17] tracking-wide font-mono">#{topMatch.id} • Sunni Hanafi</div>
            </div>
            <div className="flex items-center gap-1.5 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: topMatch.statusColor }}>
              <span>{topMatch.status}</span>
            </div>
          </div>
        </div>

        {/* Secondary Action Box: "+ Add Candidate to Shortlist" (analogous to the "+ Add method" box) */}
        <div onClick={(e) => handleDummyAction(e, 'Request Information')} className="sm:col-span-4 bg-[#F7F3EA] hover:bg-[#F0E9DC] border-2 border-dashed border-[#DFD6C5] rounded-[28px] p-4 flex flex-col items-center justify-center text-center cursor-pointer transition group">
          <div className="w-11 h-11 rounded-full bg-white text-[#19191B] flex items-center justify-center shadow-sm group-hover:scale-105 transition mb-2">
            <svg className="w-5 h-5 text-[#2A2925]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <span className="text-[13px] font-bold text-[#24211D]">Request Information</span>
          <span className="text-[11px] text-[#7E776D] mt-0.5">Submit request to Manager</span>
        </div>
      </div>
    </section>
  );
}
