import React from 'react';

export default function OverviewHeader2() {
  return (
    <header className="bg-[#FCF9F4] border-b border-[#EFE9DF] px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" data-purpose="top-navigation-bar">
      {/* Left: Brand Logo & Organization Pill */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        <img alt="NikaahKaro Brandmark" className="w-9 h-9 object-contain rounded-xl drop-shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl-Maec7kHf8-BHv2s6yAiVqRLiOM3EvrCF08odbdqMnrJ8FdA5caVPIt2Cwf4Eksojn8s72ei2Z4Du0TJhwLpKWgEGki_64VzodTdKVGeO-5xe5VoUJ37kE3nWG8VYwiBYZPzPfzoOntM_VAJ2-0lQpq_-8ZxnzEqovhnIOZRK3YvKmWhwinJ4jwKz-7c3Bf8uzFtAOLcTxY1S-JYQy31lwSGNqt1JC8v38C135TRnlEupxGmOTQhMzdNgCZa1mzyoA"/>
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold tracking-tight text-[#002b17] leading-tight">NikaahKaro</span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]">CRM ENTERPRISE</span>
        </div>
      </div>

      {/* Center: Horizontal Navigation Tabs */}
      <nav aria-label="Primary Navigation" className="hidden xl:flex items-center gap-1.5 bg-[#F4EFE7]/80 p-1.5 rounded-full border border-[#EAE2D5]">
        <a aria-current="page" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold text-white bg-[#064e3b] shadow-sm transition-all" href="#overview">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Overview</span>
        </a>
        <a className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#676156] hover:text-[#002b17] hover:bg-white/80 transition-all" href="#matching">
          Matching Engine
        </a>
        <a className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#676156] hover:text-[#002b17] hover:bg-white/80 transition-all" href="#release-requests">
          <span>Release Requests</span>
          <span className="bg-[#EAE2D5] text-[#4E473D] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">18</span>
        </a>
        <a className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#676156] hover:text-[#002b17] hover:bg-white/80 transition-all" href="#proposals">
          Active Proposals
        </a>
        <a className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#676156] hover:text-[#002b17] hover:bg-white/80 transition-all" href="#feedback">
          Rejection Feedback
        </a>
        <a className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#676156] hover:text-[#002b17] hover:bg-white/80 transition-all" href="#verifications">
          Dossier Verifications
        </a>
      </nav>

      {/* Right: Search, Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Search Shortcut Pill */}
        <button className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E9E4DC] text-[#717972] text-[12px] font-medium hover:border-[#064e3b] transition shadow-sm">
          <svg className="w-3.5 h-3.5 text-[#888174]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Search candidate dossiers, CNIC...</span>
          <kbd className="font-mono text-[10px] bg-[#F2ECE1] text-[#676156] px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
        {/* Notification Bell with Dot */}
        <button aria-label="Notifications" className="relative w-9 h-9 rounded-full bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] flex items-center justify-center text-[#414942] shadow-sm transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
        </button>
        {/* Matchmaker User Profile Pill */}
        <div className="bg-white border border-[#EBE4D8] rounded-full p-1 pr-3.5 flex items-center gap-2.5 shadow-sm cursor-pointer hover:border-[#064e3b] transition">
          <div className="w-7 h-7 rounded-full bg-[#064e3b] text-white font-bold flex items-center justify-center text-[11px] ring-2 ring-[#E0EEE8]">
            FT
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[12px] font-bold text-[#1E2022] leading-tight">Fatima Tariq</span>
            <span className="text-[9.5px] font-semibold text-[#825418]">Head of Operations</span>
          </div>
          <svg className="w-3.5 h-3.5 text-[#8D867C] ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </div>
      </div>
    </header>
  );
}
