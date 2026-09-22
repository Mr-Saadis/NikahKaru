import React from 'react';
import Link from 'next/link';

export default function Sidebar2({ activePage = 'profiles' }: { activePage?: string }) {
  const handleDummyClick = (e: React.MouseEvent, actionName: string) => {
    e.preventDefault();
    alert(`${actionName} feature is under development.`);
  };

  return (
    <aside className="w-full md:w-[260px] lg:w-[280px] bg-[#FBF9F5] border-r border-[#EFE9DF] p-6 flex flex-col justify-between flex-shrink-0" data-purpose="main-navigation-sidebar">
      {/* Top Brand & Navigation Links */}
      <div className="space-y-7">
        {/* Logo & Organization Title */}
        <div className="flex items-center gap-3.5 px-2">
          <img alt="NikaahKaro Brandmark" className="w-10 h-10 object-contain rounded-xl drop-shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl-Maec7kHf8-BHv2s6yAiVqRLiOM3EvrCF08odbdqMnrJ8FdA5caVPIt2Cwf4Eksojn8s72ei2Z4Du0TJhwLpKWgEGki_64VzodTdKVGeO-5xe5VoUJ37kE3nWG8VYwiBYZPzPfzoOntM_VAJ2-0lQpq_-8ZxnzEqovhnIOZRK3YvKmWhwinJ4jwKz-7c3Bf8uzFtAOLcTxY1S-JYQy31lwSGNqt1JC8v38C135TRnlEupxGmOTQhMzdNgCZa1mzyoA" />
          <div>
            <div className="text-[17px] font-bold tracking-tight text-[#16382E] flex items-center gap-1.5 leading-tight">
              <span>NikaahKaro</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-[#E5EFE9] text-[#125740]">CRM</span>
            </div>
            <p className="text-[11px] font-medium text-[#7D766C]">Matrimonial Platform</p>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav aria-label="Sidebar Menu" className="space-y-1.5">
          {/* Home / Overview */}
          <Link aria-current={activePage === 'overview' ? 'page' : undefined} className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] transition-all ${activePage === 'overview' ? 'font-semibold text-white bg-[#064e3b] shadow-sm py-3 text-[14px]' : 'font-medium text-[#676156] hover:bg-[#F2ECE1]'}`} href="/overview2">
            <svg className={`w-5 h-5 ${activePage === 'overview' ? 'text-white' : 'text-[#888174]'}`} fill="none" stroke="currentColor" strokeWidth={activePage === 'overview' ? "2" : "1.8"} viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Overview</span>
          </Link>
          
          {/* Candidate Profiles & Dossiers */}
          <Link aria-current={activePage === 'profiles' ? 'page' : undefined} className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] transition-all ${activePage === 'profiles' ? 'font-semibold text-white bg-[#064e3b] shadow-sm py-3 text-[14px]' : 'font-medium text-[#676156] hover:bg-[#F2ECE1]'}`} href="/client2">
            <svg className={`w-5 h-5 ${activePage === 'profiles' ? 'text-white' : 'text-[#888174]'}`} fill="none" stroke="currentColor" strokeWidth={activePage === 'profiles' ? "2" : "1.8"} viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Profiles &amp; Dossiers</span>
          </Link>
          
          {/* Add New Profile */}
          <Link aria-current={activePage === 'add-new' ? 'page' : undefined} className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] transition-all ${activePage === 'add-new' ? 'font-semibold text-white bg-[#064e3b] shadow-sm py-3 text-[14px]' : 'font-medium text-[#676156] hover:bg-[#F2ECE1]'}`} href="/add-new2">
            <svg className={`w-5 h-5 ${activePage === 'add-new' ? 'text-white' : 'text-[#888174]'}`} fill="none" stroke="currentColor" strokeWidth={activePage === 'add-new' ? "2" : "1.8"} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Add New Profile</span>
          </Link>
          
          {/* Matching Engine */}
          <a onClick={(e) => handleDummyClick(e, 'Matching Engine')} className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1] transition-all cursor-pointer" href="#matching">
            <svg className="w-5 h-5 text-[#888174]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Matching Engine</span>
          </a>
          
          {/* Release Requests with Count Badge */}
          <Link aria-current={activePage === 'release-requests' ? 'page' : undefined} className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-[13.5px] transition-all ${activePage === 'release-requests' ? 'font-semibold text-white bg-[#064e3b] shadow-sm py-3 text-[14px]' : 'font-medium text-[#676156] hover:bg-[#F2ECE1]'}`} href="/clients2">
            <div className="flex items-center gap-3.5">
              <svg className={`w-5 h-5 ${activePage === 'release-requests' ? 'text-white' : 'text-[#888174]'}`} fill="none" stroke="currentColor" strokeWidth={activePage === 'release-requests' ? "2" : "1.8"} viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Release Requests</span>
            </div>
            <span className={`${activePage === 'release-requests' ? 'bg-white text-[#064e3b]' : 'bg-[#EAE2D5] text-[#4E473D]'} text-[11px] font-bold px-2 py-0.5 rounded-full`}>18</span>
          </Link>
          
          {/* Proposals in Progress */}
          <a onClick={(e) => handleDummyClick(e, 'Proposals in Progress')} className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1] transition-all cursor-pointer" href="#proposals">
            <svg className="w-5 h-5 text-[#888174]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Proposals in Progress</span>
          </a>
          
          {/* Rejection & Feedback */}
          <a onClick={(e) => handleDummyClick(e, 'Rejection Feedback')} className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1] transition-all cursor-pointer" href="#feedback">
            <svg className="w-5 h-5 text-[#888174]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Rejection Feedback</span>
          </a>
          
          {/* Documents & Verifications */}
          <a onClick={(e) => handleDummyClick(e, 'Dossier Verifications')} className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1] transition-all cursor-pointer" href="#verifications">
            <svg className="w-5 h-5 text-[#888174]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Dossier Verifications</span>
          </a>
        </nav>
      </div>
      
      {/* Bottom User Profile Pill */}
      <div className="mt-8 bg-white border border-[#EBE4D8] rounded-[22px] p-2.5 flex items-center justify-between shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 pl-1">
          <div className="w-10 h-10 rounded-full bg-[#115E49] text-white font-bold flex items-center justify-center text-sm ring-2 ring-[#E0EEE8]">
            FT
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-[#1E2022] leading-tight">Fatima Tariq</h4>
            <span className="inline-block mt-0.5 text-[10px] font-semibold bg-[#F7E7CE] text-[#825418] px-2 py-0.2 rounded-full">
              Manager
            </span>
          </div>
        </div>
        
        {/* Logout action icon pill */}
        <button onClick={(e) => handleDummyClick(e, 'Logout')} aria-label="Sign out" className="w-8 h-8 rounded-full flex items-center justify-center text-[#8D867C] hover:text-[#115E49] hover:bg-[#F6F2EA] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
      </div>
    </aside>
  );
}
