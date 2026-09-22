import React from 'react';
import { sharedMockMatches } from '@/data/mockData';

export default function ClientsQueueList({ selectedIndex = 0, onSelect = () => {}, activeFilter = 'All' }: { selectedIndex?: number, onSelect?: (index: number) => void, activeFilter?: string }) {
  const filteredMatches = sharedMockMatches.map((match, i) => ({ match, originalIndex: i })).filter(({ match }) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Urgent Sign-off') return match.statusText === 'Assigned' || match.statusText === 'Review';
    if (activeFilter === 'Tier-1 Phone Only') return match.statusText.includes('Tier-1');
    if (activeFilter === 'Tier-2 Full Dossier') return match.statusText.includes('Tier-2');
    return true;
  });
  return (
    <section className="w-[38%] border-r border-[#EFE9DF] bg-white flex flex-col shrink-0 overflow-hidden">
      {/* List Header Bar */}
      <div className="px-4 py-2.5 border-b border-[#EFE9DF] bg-[#FAF8F5] flex items-center justify-between text-[11px] font-semibold text-[#888174]">
        <span>PENDING AUTHORIZATIONS ({filteredMatches.length})</span>
        <span className="text-[#064e3b] font-bold">Priority: SLA Order</span>
      </div>
      
      {/* Queue Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F4EFE7]">
        {filteredMatches.length === 0 && (
          <div className="p-8 text-center text-[#78716C] text-[13px] font-medium">
            No requests found.
          </div>
        )}
        {filteredMatches.map(({ match, originalIndex }) => (
          <div key={originalIndex} onClick={() => onSelect(originalIndex)} className={`p-4 hover:bg-[#FAF8F5] transition cursor-pointer flex items-start gap-3 ${selectedIndex === originalIndex ? 'bg-[#F7FAF8] border-l-4 border-[#064e3b]' : ''}`}>
            <input checked={selectedIndex === originalIndex} readOnly className="mt-1 text-[#064e3b] border-[#E9E4DC] focus:ring-[#064e3b]/20 focus:ring-2" name="selectedCandidate" type="radio" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <h4 className="text-[13px] font-bold text-[#002b17] truncate">{match.maleProfile.name.split('•')[1]?.trim() || match.maleProfile.name} &amp; {match.femaleProfile.name.split('•')[1]?.trim() || match.femaleProfile.name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight shrink-0 border" style={{ backgroundColor: match.statusBadgeBg, color: match.statusBadgeColor, borderColor: match.statusBadgeBorder || 'transparent' }}>{match.statusText}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-[#78716C] mb-1.5">
                <span className="font-mono bg-[#FAF8F5] border border-[#E9E4DC] px-1.5 py-0.5 rounded text-[#24211D] font-semibold">GEN: {match.maleProfile.id}</span>
                <span className="font-mono bg-[#FAF8F5] border border-[#E9E4DC] px-1.5 py-0.5 rounded text-[#24211D]">MAN: TIER-2</span>
                <span className="text-[#A49C8F]">•</span>
                <span>Affinity: <strong className="text-[#064e3b]">{match.affinity}%</strong></span>
              </div>
              <div className="flex items-center justify-between text-[10.5px] text-[#A49C8F]">
                <span>By: {match.statusAgent}</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
