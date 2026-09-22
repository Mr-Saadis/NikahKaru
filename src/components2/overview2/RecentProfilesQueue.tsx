import React, { useState } from 'react';
import { sharedMockProfiles } from '@/data/mockData';
import Link from 'next/link';

export default function RecentProfilesQueue() {
  const [activeFilter, setActiveFilter] = useState('All Profiles');

  const filteredProfiles = sharedMockProfiles.filter(profile => {
    if (activeFilter === 'All Profiles') return true;
    return profile.status === activeFilter;
  });
  return (
    <section aria-labelledby="queue-heading" className="bg-white rounded-[28px] border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] p-5 lg:p-7 space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE2]">
        <div>
          <h2 className="text-lg font-bold text-[#1E1F22] tracking-tight" id="queue-heading">Recent Profiles Queue</h2>
          <p className="text-[12px] text-[#78716C] mt-0.5">Verified intake registrations, Shariah audit certification, and active lifecycle tracking</p>
        </div>
        {/* Filter Pills & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setActiveFilter('All Profiles')} className={`px-3 py-1.5 text-[11.5px] font-bold rounded-full transition shadow-sm ${activeFilter === 'All Profiles' ? 'bg-[#064e3b] text-white' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}>All Profiles</button>
          <button onClick={() => setActiveFilter('Active')} className={`px-3 py-1.5 text-[11.5px] font-semibold rounded-full transition ${activeFilter === 'Active' ? 'bg-[#064e3b] text-white shadow-sm' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}>Active</button>
          <button onClick={() => setActiveFilter('In Progress')} className={`px-3 py-1.5 text-[11.5px] font-semibold rounded-full transition ${activeFilter === 'In Progress' ? 'bg-[#064e3b] text-white shadow-sm' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}>In Progress</button>
          <button onClick={() => setActiveFilter('Draft')} className={`px-3 py-1.5 text-[11.5px] font-semibold rounded-full transition ${activeFilter === 'Draft' ? 'bg-[#064e3b] text-white shadow-sm' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}>Draft</button>
        </div>
      </div>

      {/* High Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="text-[#888174] font-medium border-b border-[#F4EFE6] text-[11.5px] uppercase tracking-wider">
              <th className="py-3.5 px-3">Client ID</th>
              <th className="py-3.5 px-3">Candidate Name</th>
              <th className="py-3.5 px-3">Gender</th>
              <th className="py-3.5 px-3">Age &amp; Status</th>
              <th className="py-3.5 px-3">Career &amp; City</th>
              <th className="py-3.5 px-3">Lifecycle State</th>
              <th className="py-3.5 px-3">Assigned Agent</th>
              <th className="py-3.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F7F3EB] font-normal text-[#2A2925]">
            {filteredProfiles.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#78716C] text-[13px] font-medium border border-dashed border-[#E2DBD0] rounded-xl">
                  No profiles found for the selected filter.
                </td>
              </tr>
            )}
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-[#FAF7F2] transition">
                <td className="py-3.5 px-3 font-mono font-bold text-[#6D6558] text-[12px]">#{profile.id}</td>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full font-extrabold flex items-center justify-center text-[10px]" style={{ backgroundColor: profile.initialsBg, color: profile.initialsText }}>{profile.initials}</div>
                    <span className="font-bold text-[#1E1F22]">{profile.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3"><span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: profile.gender === 'Male' ? '#FEF3C7' : '#FCE5D8', color: profile.gender === 'Male' ? '#59440e' : '#86400F' }}>{profile.gender}</span></td>
                <td className="py-3.5 px-3"><div className="font-semibold text-[#2F2C27]">{profile.age} Yrs</div><div className="text-[11px] text-[#8A8377]">{profile.maritalStatus}</div></td>
                <td className="py-3.5 px-3"><div className="font-medium">{profile.education}</div><div className="text-[11px] text-[#8A8377]">{profile.city}</div></td>
                <td className="py-3.5 px-3">
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: profile.statusColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.statusDot }}></span> {profile.status}
                  </span>
                </td>
                <td className="py-3.5 px-3 font-medium text-[#57534E]">{profile.assignedAgent}</td>
                <td className="py-3.5 px-3 text-right">
                  <Link href="/client2" aria-label="View Confidential Dossier" className="w-7 h-7 rounded-full border border-[#E5DFD4] hover:bg-[#F2ECE1] inline-flex items-center justify-center text-[#787167] transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Footer Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#F5EFE6] text-[12px] text-[#7D766C]">
        <span>Showing {filteredProfiles.length} of {filteredProfiles.length} registered records</span>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1 rounded-xl border border-[#E2DBD0] font-semibold disabled:opacity-40" disabled>Previous</button>
          <button className="px-3 py-1 rounded-xl bg-[#064e3b] text-white font-bold shadow-sm">1</button>
          <button className="px-3 py-1 rounded-xl border border-[#E2DBD0] font-semibold disabled:opacity-40" disabled>Next</button>
        </div>
      </div>
    </section>
  );
}
