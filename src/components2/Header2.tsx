import React from 'react';
import { sharedMockProfiles } from '@/data/mockData';
import Link from 'next/link';

export default function Header2() {
  const mainCandidate = sharedMockProfiles[0];

  const handleDummyAction = (e: React.MouseEvent, actionName: string) => {
    e.preventDefault();
    alert(`${actionName} feature is under development.`);
  };

  return (
    <header className="bg-[#FCF9F4] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E4DC]" data-purpose="dossier-header-bar">
      <div className="flex items-start gap-4">
        <Link href="/overview2" aria-label="Return to previous candidate pool" className="w-10 h-10 rounded-2xl bg-white hover:bg-[#F4ECE1] border border-[#E9E4DC] shadow-sm flex items-center justify-center text-[#064e3b] transition transform active:scale-95 flex-shrink-0 mt-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-[28px] font-extrabold text-[#002b17] tracking-tight">{mainCandidate.name}</h1>
            <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]">#{mainCandidate.id}</span>
          </div>
          <p className="text-[13px] font-medium text-[#717972] mt-0.5 flex items-center gap-2">
            <span>{mainCandidate.city}, Pakistan</span>
            <span className="w-1 h-1 rounded-full bg-[#717972] inline-block"></span>
            <span>Active Dossier &amp; Two-Way Matching Ledger</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button aria-label="Candidate Settings" className="w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] flex items-center justify-center text-[#414942] shadow-sm transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
        <button aria-label="Shariah Compatibility Guidelines" className="w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] flex items-center justify-center text-[#414942] shadow-sm transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
        <button onClick={(e) => handleDummyAction(e, 'Notifications')} aria-label="Notifications" className="relative w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] flex items-center justify-center text-[#414942] shadow-sm transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
        </button>
        <button onClick={(e) => handleDummyAction(e, 'Run New Match Query')} className="flex items-center gap-2 bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[13px] px-5 py-2.5 rounded-full shadow-sm transition duration-150 transform hover:-translate-y-0.5">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Run New Match Query</span>
        </button>
      </div>
    </header>
  );
}
