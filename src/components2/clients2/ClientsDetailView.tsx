import React from 'react';
import { sharedMockMatches } from '@/data/mockData';

export default function ClientsDetailView({ selectedIndex = 0 }: { selectedIndex?: number }) {
  const activeMatch = sharedMockMatches[selectedIndex] || sharedMockMatches[0];
  const { maleProfile, femaleProfile } = activeMatch;

  return (
    <main className="flex-1 bg-[#FAF8F5] overflow-y-auto p-6 space-y-6">
      {/* Detail Header & Meta */}
      <div className="border-b border-[#EFE9DF] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#002b17] tracking-tight">
              {maleProfile.name.split('•')[0]?.trim() || maleProfile.name} <span className="text-[#064e3b] font-normal mx-1">⇄</span> {femaleProfile.name.split('•')[0]?.trim() || femaleProfile.name}
            </h2>
            <span className="font-mono bg-white border border-[#E9E4DC] text-[#4E473D] px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">
              REL-{maleProfile.id}
            </span>
            <span className="bg-[#FEE2E2] text-[#991B1B] px-2.5 py-0.5 rounded text-[11px] font-bold uppercase border border-[#FCA5A5]/40 shadow-sm">
              PENDING
            </span>
            <span className="text-[#888174] text-[11px] font-bold uppercase tracking-wider">
              TIER 2 (FULL DOSSIER)
            </span>
          </div>
          {/* Quick Record Action Icons */}
          <div className="flex items-center gap-2 text-[#676156]">
            <button className="w-8 h-8 rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#F2ECE1] flex items-center justify-center transition shadow-sm" title="Reassign Liaison">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#F2ECE1] flex items-center justify-center transition shadow-sm" title="Security Audit Receipt">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#E9E4DC] bg-white text-[#676156] hover:bg-[#FEE2E2] hover:text-[#991B1B] hover:border-[#FCA5A5] flex items-center justify-center transition shadow-sm" title="Reject &amp; Archive">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="text-[12.5px] text-[#676156] flex items-center gap-4">
          <span>Requested By: <strong className="text-[#1E2022] font-semibold">Hamza Rasheed</strong></span>
          <span className="text-[#D4CFC7]">•</span>
          <span>Match Score: <strong className="text-[#064e3b] font-bold">94%</strong></span>
        </div>
      </div>

      {/* 2. GROOM & BRIDE CONDENSED SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Groom Metadata Block */}
        <div className="bg-white p-5 rounded-[22px] border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] text-[12px] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F4EFE7]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#064e3b]"></span>
              <span className="font-bold text-[#1E2022] uppercase tracking-wider text-[11px]">Groom Summary</span>
            </div>
            <span className="font-mono text-[10.5px] font-bold text-[#A49C8F]">ID: {maleProfile.id}</span>
          </div>
          <div>
            <div className="text-[14.5px] font-bold text-[#002b17]">{maleProfile.name.split('•')[0]?.trim() || maleProfile.name}</div>
            <p className="text-[#676156] text-[12px] font-medium mt-0.5">{maleProfile.age} Yrs • {maleProfile.education} • {maleProfile.city}</p>
          </div>
          <div className="pt-2 text-[12px] text-[#676156]">
            <span className="text-[#888174]">Wali / Guardian:</span> <strong className="text-[#1E2022]">Bilal Ahmed</strong> (Father)
            <div className="font-mono text-[#064e3b] font-bold mt-1.5 flex items-center gap-1.5 bg-[#F7FAF8] p-1.5 rounded-lg border border-[#D1E3DC] inline-flex">
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span>0300-8429***</span>
            </div>
          </div>
        </div>

        {/* Bride Metadata Block */}
        <div className="bg-white p-5 rounded-[22px] border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] text-[12px] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F4EFE7]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]"></span>
              <span className="font-bold text-[#1E2022] uppercase tracking-wider text-[11px]">Bride Summary</span>
            </div>
            <span className="font-mono text-[10.5px] font-bold text-[#A49C8F]">ID: {femaleProfile.id}</span>
          </div>
          <div>
            <div className="text-[14.5px] font-bold text-[#002b17]">{femaleProfile.name.split('•')[0]?.trim() || femaleProfile.name}</div>
            <p className="text-[#676156] text-[12px] font-medium mt-0.5">{femaleProfile.age} Yrs • {femaleProfile.education} • {femaleProfile.city}</p>
          </div>
          <div className="pt-2 text-[12px] text-[#676156]">
            <span className="text-[#888174]">Wali / Guardian:</span> <strong className="text-[#1E2022]">Dr. Tariq Siddiqui</strong> (Father)
            <div className="font-mono text-[#064e3b] font-bold mt-1.5 flex items-center gap-1.5 bg-[#F7FAF8] p-1.5 rounded-lg border border-[#D1E3DC] inline-flex">
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span>0321-4912***</span>
            </div>
          </div>
        </div>
      </div>

        
      

      {/* 4. ACTION TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-[22px] border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button className="bg-[#064e3b] hover:bg-[#0f4229] text-white font-bold text-[13px] px-6 py-3 rounded-full shadow-sm transition flex items-center gap-2">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <span>Approve &amp; Refer</span>
          </button>
          <button className="bg-white hover:bg-[#F2ECE1] text-[#4E473D] border border-[#E9E4DC] font-bold text-[13px] px-5 py-3 rounded-full transition shadow-sm flex items-center gap-2">
            <svg className="w-[18px] h-[18px] text-[#A49C8F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>Request Additional Audit</span>
          </button>
        </div>
        <button className="text-[#991B1B] hover:bg-[#FEE2E2] font-bold text-[13px] px-5 py-3 rounded-full transition border border-transparent hover:border-[#FCA5A5]/60">
          Reject Referral
        </button>
      </div>

      {/* 5. COMPACT AUDIT TRAIL TABLE */}
      <div className="bg-white rounded-[22px] border border-[#ECE5D9] p-5 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F4EFE7]">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#888174]">Custody Audit &amp; Activity Ledger</h4>
          <a className="text-[11.5px] font-bold text-[#064e3b] hover:underline" href="#audit-log">View All 142 Records</a>
        </div>
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="text-[#A49C8F] font-semibold border-b border-[#F4EFE7] text-[10.5px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Action / ID</th>
              <th className="py-2.5 px-3">Matched Pairing</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Liaison</th>
              <th className="py-2.5 px-3 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4EFE7] font-medium text-[#4E473D]">
            {sharedMockMatches.slice(0, 3).map((match, index) => (
              <tr key={index} className="hover:bg-[#FAF8F5] transition">
                <td className="py-2.5 px-3 font-mono text-[#064e3b] font-bold">#REL-{match.maleProfile.id.split('-')[1]}</td>
                <td className="py-2.5 px-3 text-[#1E2022] font-semibold">{match.maleProfile.name.split('•')[0]?.trim().split(' ')[0]} &amp; {match.femaleProfile.name.split('•')[0]?.trim().split(' ')[0]}</td>
                <td className="py-2.5 px-3"><span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border" style={{ backgroundColor: match.statusBadgeBg, color: match.statusBadgeColor, borderColor: match.statusBadgeBorder || 'transparent' }}>{match.statusText}</span></td>
                <td className="py-2.5 px-3">{match.statusAgent}</td>
                <td className="py-2.5 px-3 text-right text-[#A49C8F]">Today</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
