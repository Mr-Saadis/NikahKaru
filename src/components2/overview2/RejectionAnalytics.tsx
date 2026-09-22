import React from 'react';

export default function RejectionAnalytics() {
  return (
    <section aria-labelledby="rejection-heading" className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-[#F5EFE6]">
        <div>
          <h3 className="text-[14.5px] font-bold text-[#1F1E1B]" id="rejection-heading">Rejection Analytics</h3>
          <p className="text-[11px] text-[#867E72]">Post-Contact Feedback • Last 90 Days</p>
        </div>
        <span className="text-[11px] font-semibold text-[#867E72]">N = 412 Pairs</span>
      </div>
      
      <p className="text-[11.5px] text-[#766E61] leading-relaxed">
        Root causes recorded when either party declines following referral. Declined pairings are permanently excluded from matching loops.
      </p>

      {/* Clean Progress Bars Breakdown */}
      <div className="space-y-2.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-[#24211D]">Location</span>
            <span className="font-bold text-[#002b17]">38%</span>
          </div>
          <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
            <div className="bg-[#064e3b] h-full rounded-full" style={{ width: '38%' }}></div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-[#24211D]">Age Gap</span>
            <span className="font-bold text-[#002b17]">24%</span>
          </div>
          <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
            <div className="bg-[#064e3b] h-full rounded-full opacity-80" style={{ width: '24%' }}></div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-[#24211D]">Family Setup</span>
            <span className="font-bold text-[#24211D]">19%</span>
          </div>
          <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
            <div className="bg-[#F6C365] h-full rounded-full" style={{ width: '19%' }}></div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-[#24211D]">Cultural/Caste</span>
            <span className="font-bold text-[#24211D]">12%</span>
          </div>
          <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
            <div className="bg-[#F6C365] h-full rounded-full opacity-70" style={{ width: '12%' }}></div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-[#24211D]">Personal Preference</span>
            <span className="font-bold text-[#766E61]">7%</span>
          </div>
          <div className="w-full bg-[#EAE2D5] rounded-full h-2 overflow-hidden">
            <div className="bg-[#C7BEB0] h-full rounded-full" style={{ width: '7%' }}></div>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EBE4D8] flex items-center justify-between text-[11.5px]">
        <span className="text-[#766E61]">Algorithmic weighting feedback:</span>
        <span className="font-extrabold text-[#064e3b]">Auto-calibrated</span>
      </div>
    </section>
  );
}
