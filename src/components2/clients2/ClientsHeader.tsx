import React from 'react';

export default function ClientsHeader() {
  return (
    <header className="h-16 px-6 bg-white border-b border-[#EFE9DF] flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E9E4DC] hover:bg-[#F2ECE1] text-[12px] font-semibold text-[#676156] transition">
          <svg className="w-[17px] h-[17px] text-[#888174]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
          <span>Filter Data</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-full hover:bg-[#F2ECE1] flex items-center justify-center text-[#414942] border border-[#E9E4DC] transition">
          <svg className="w-[19px] h-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
        </button>
        <div className="w-9 h-9 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-[#E0EEE8]">
          FT
        </div>
      </div>
    </header>
  );
}
