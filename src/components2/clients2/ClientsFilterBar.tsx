import React from 'react';

export default function ClientsFilterBar({ activeFilter = 'All', onFilterChange = () => {} }: { activeFilter?: string, onFilterChange?: (filter: string) => void }) {
  return (
    <section className="px-6 py-4 bg-white border-b border-[#EFE9DF] shrink-0">
      {/* Title & Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-lg border border-[#E9E4DC] hover:bg-[#F2ECE1] flex items-center justify-center text-[#676156] transition">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-xl font-black text-[#002b17] tracking-tight flex items-center gap-2">
            <span>RELEASE REQUESTS RECORD</span>
          </h1>
          <div className="flex items-center bg-[#F4EFE7] p-0.5 rounded-md text-[11px] font-semibold text-[#676156]">
            <span className="px-2.5 py-0.5 rounded text-[#676156]">Today</span>
            <span className="px-2.5 py-0.5 rounded bg-white shadow-sm text-[#002b17] font-bold">ALL</span>
          </div>
        </div>
        
        {/* Download Action */}
        <button className="flex items-center gap-1.5 bg-[#064e3b] hover:bg-[#0f4229] text-white px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide shadow-sm transition">
          <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          <span>DOWNLOAD REPORT</span>
        </button>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 text-[11.5px] items-center">
        {/* Search Box */}
        <div className="relative md:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A49C8F] mb-0.5">Search Box</label>
          <div className="relative">
            <input className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E9E4DC] bg-[#FCF9F4] text-[12px] placeholder:text-[#A49C8F] focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition" placeholder="Candidate, ID, Wali Phone..." type="text" />
            <svg className="w-[16px] h-[16px] absolute left-2 top-2 text-[#A49C8F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        {/* From Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A49C8F] mb-0.5">From Date</label>
          <input className="w-full py-1.5 px-2.5 rounded-lg border border-[#E9E4DC] bg-[#FCF9F4] text-[11.5px] text-[#1E2022] transition focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" type="date" defaultValue="2026-09-01" />
        </div>
        {/* To Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A49C8F] mb-0.5">To Date</label>
          <input className="w-full py-1.5 px-2.5 rounded-lg border border-[#E9E4DC] bg-[#FCF9F4] text-[11.5px] text-[#1E2022] transition focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" type="date" defaultValue="2026-09-21" />
        </div>
        {/* Category Select */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A49C8F] mb-0.5">Select Tier</label>
          <select className="w-full py-1.5 px-2 rounded-lg border border-[#E9E4DC] bg-white text-[11.5px] font-medium text-[#1E2022] focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition">
            <option>All Tiers</option>
            <option>Tier-1 Phone</option>
            <option>Tier-2 Full Dossier</option>
          </select>
        </div>
        {/* Liaison Select */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A49C8F] mb-0.5">Assigned Liaison</label>
          <select className="w-full py-1.5 px-2 rounded-lg border border-[#E9E4DC] bg-white text-[11.5px] font-medium text-[#1E2022] focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition">
            <option>All Liaisons</option>
            <option>Hamza Rasheed</option>
            <option>Sara Mansoor</option>
            <option>Bilal Ahmed</option>
          </select>
        </div>
      </div>

      {/* Filter Target Pills */}
      <div className="flex items-center gap-4 pt-2.5 text-[11.5px] text-[#676156] font-medium">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A49C8F]">Filter Target:</span>
        <label className="inline-flex items-center gap-1.5 cursor-pointer group">
          <input checked={activeFilter === 'All'} onChange={() => onFilterChange('All')} className="text-[#064e3b] focus:ring-0 border-[#E9E4DC]" name="targetFilter" type="radio" />
          <span className={`group-hover:text-[#064e3b] ${activeFilter === 'All' ? 'font-bold text-[#002b17]' : ''}`}>All</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer group">
          <input checked={activeFilter === 'Urgent Sign-off'} onChange={() => onFilterChange('Urgent Sign-off')} className="text-[#064e3b] focus:ring-0 border-[#E9E4DC]" name="targetFilter" type="radio" />
          <span className={`group-hover:text-[#064e3b] ${activeFilter === 'Urgent Sign-off' ? 'font-bold text-[#002b17]' : ''}`}>Urgent Sign-off</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer group">
          <input checked={activeFilter === 'Tier-1 Phone Only'} onChange={() => onFilterChange('Tier-1 Phone Only')} className="text-[#064e3b] focus:ring-0 border-[#E9E4DC]" name="targetFilter" type="radio" />
          <span className={`group-hover:text-[#064e3b] ${activeFilter === 'Tier-1 Phone Only' ? 'font-bold text-[#002b17]' : ''}`}>Tier-1 Phone Only</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer group">
          <input checked={activeFilter === 'Tier-2 Full Dossier'} onChange={() => onFilterChange('Tier-2 Full Dossier')} className="text-[#064e3b] focus:ring-0 border-[#E9E4DC]" name="targetFilter" type="radio" />
          <span className={`group-hover:text-[#064e3b] ${activeFilter === 'Tier-2 Full Dossier' ? 'font-bold text-[#002b17]' : ''}`}>Tier-2 Full Dossier</span>
        </label>
      </div>
    </section>
  );
}
