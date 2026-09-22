import React, { useState } from 'react';
import { sharedMockProfiles } from '@/data/mockData';

export default function MatchLedger2() {
  const [activeFilter, setActiveFilter] = useState('All Matches');

  const mainCandidate = sharedMockProfiles[0];
  const compatibleMatches = sharedMockProfiles.filter(profile => {
    if (profile.gender === mainCandidate.gender) return false;
    if (activeFilter === 'High Affinity (>90%)') return profile.affinity > 90;
    if (activeFilter === 'Admin Sign-off Pending') return profile.status === 'In Progress';
    return true;
  });

  const handleDummyAction = (e: React.MouseEvent, actionName: string) => {
    e.preventDefault();
    alert(`${actionName} feature is under development.`);
  };

  return (
    <section aria-labelledby="ledger-heading" className="bg-white rounded-[28px] border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] p-5 lg:p-6">
      {/* Table Header Controls: Title, Filter Pills, and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F0EBE2]">
        <div>
          <h2 className="text-lg font-bold text-[#1E1F22]" id="ledger-heading">Compatible Match Ledger</h2>
          <p className="text-[12px] text-[#78716C] mt-0.5">Showing verified profiles meeting strict family and Shariah guidelines</p>
        </div>
        {/* Filter Tabs matching the reference clean aesthetic */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setActiveFilter('All Matches')} className={`px-3.5 py-1.5 text-[12px] font-bold rounded-full transition ${activeFilter === 'All Matches' ? 'bg-[#16382E] text-white' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}>
            All Matches (14)
          </button>
          <button onClick={() => setActiveFilter('High Affinity (>90%)')} className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-full transition ${activeFilter === 'High Affinity (>90%)' ? 'bg-[#16382E] text-white' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}>
            High Affinity (&gt;90%)
          </button>
          <button onClick={() => setActiveFilter('Admin Sign-off Pending')} className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-full transition ${activeFilter === 'Admin Sign-off Pending' ? 'bg-[#16382E] text-white' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}>
            Admin Sign-off Pending (3)
          </button>
        </div>
      </div>
      
      {/* Table Wrapper */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left border-collapse text-[13px]" data-purpose="match-matrix-table">
          {/* Column Headings */}
          <thead>
            <tr className="text-[#888174] font-medium border-b border-[#F4EFE6] text-[11.5px] uppercase tracking-wider">
              <th className="py-3.5 px-3">Profile ID</th>
              <th className="py-3.5 px-3">Candidate &amp; Guardian</th>
              <th className="py-3.5 px-3">Age / City</th>
              <th className="py-3.5 px-3">Education &amp; Profession</th>
              <th className="py-3.5 px-3">Affinity</th>
              <th className="py-3.5 px-3">Proposal Status</th>
              <th className="py-3.5 px-3 text-right">Desk Action</th>
            </tr>
          </thead>
          
          {/* Body Rows with distinct status pills & warm action buttons */}
          <tbody className="divide-y divide-[#F7F3EB] font-normal text-[#2A2925]">
            {compatibleMatches.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#78716C] text-[13px] font-medium border border-dashed border-[#E2DBD0] rounded-xl">
                  No matches found for the selected filter.
                </td>
              </tr>
            )}
            {compatibleMatches.map((profile) => (
              <tr key={profile.id} className="hover:bg-[#FAF7F2] transition">
                <td className="py-4 px-3 font-mono font-bold text-[#6D6558] text-[12px]">{profile.id}</td>
                <td className="py-4 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full font-extrabold flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: profile.initialsBg, color: profile.initialsText }}>
                      {profile.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#1E1F22]">{profile.name}</div>
                      <div className="text-[11px] text-[#7C756B]">Wali: {profile.wali}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-3">
                  <div className="font-semibold text-[#2F2C27]">{profile.age} Yrs</div>
                  <div className="text-[11px] text-[#8A8377]">{profile.city}</div>
                </td>
                <td className="py-4 px-3">
                  <div className="font-medium">{profile.education}</div>
                  <div className="text-[11px] text-[#8A8377]">{profile.profession}</div>
                </td>
                <td className="py-4 px-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-bold" style={{ backgroundColor: profile.statusBg, color: profile.statusColor }}>
                    {profile.affinity}% Score
                  </span>
                </td>
                <td className="py-4 px-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: profile.statusColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.statusDot }}></span>
                    {profile.status}
                  </span>
                </td>
                <td className="py-4 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={(e) => handleDummyAction(e, 'View Dossier')} className="text-white font-bold px-4 py-1.5 rounded-full text-[12px] shadow-xs transition" style={{ backgroundColor: profile.statusColor }}>View Dossier</button>
                    <button onClick={(e) => handleDummyAction(e, 'Download Candidate Bio-Data')} aria-label="Download Candidate Bio-Data Dossier" className="w-8 h-8 rounded-full border border-[#E5DFD4] hover:bg-[#F2ECE1] flex items-center justify-center text-[#787167] transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Bottom Footer Pagination / Status count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-[#F5EFE6] text-[12px] text-[#7D766C]">
        <span>Showing 3 of 14 high compatibility profiles</span>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-xl border border-[#E2DBD0] hover:bg-[#FAF7F2] font-semibold disabled:opacity-40">Previous</button>
          <span className="px-2 font-bold text-[#1E1F22]">1 of 5</span>
          <button className="px-3 py-1 rounded-xl border border-[#E2DBD0] hover:bg-[#FAF7F2] font-semibold">Next</button>
        </div>
      </div>
    </section>
  );
}
