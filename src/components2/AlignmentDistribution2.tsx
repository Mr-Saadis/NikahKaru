import React from 'react';

export default function AlignmentDistribution2() {
  return (
    <section aria-labelledby="status-breakdown-heading" className="xl:col-span-5 bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-[14.5px] font-bold text-[#1F1E1B]" id="status-breakdown-heading">Criteria Alignment Distribution</h3>
          <p className="text-[11px] text-[#867E72]">Algorithmic weights across candidate prerequisites</p>
        </div>
        <button aria-label="Status details menu" className="text-[#A49C8F] hover:text-[#232326] p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 12h.01M12 12h.01M19 12h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
      </div>
      
      {/* Three Mini Numeric Headers (Paid / Due / Awaiting in the inspiration design) */}
      <div className="grid grid-cols-3 gap-2 my-2 border-b border-[#F4EFE6] pb-2 text-left">
        <div>
          <span className="text-[11px] font-medium text-[#877E71] block">Mandatory</span>
          <span className="text-[17px] font-extrabold text-[#222]">100%</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[#877E71] block">Preference</span>
          <span className="text-[17px] font-extrabold text-[#222]">88.5%</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[#877E71] block">Tolerance</span>
          <span className="text-[17px] font-extrabold text-[#222]">76.0%</span>
        </div>
      </div>
      
      {/* Capsule Bars Grid: Vertical pills with color distribution mimicking the reference design */}
      <div className="flex items-end justify-between gap-1.5 pt-2 pb-1 h-20" title="Attribute Matching Breakdown">
        {/* Capsule Group 1: Golden Pills (Deen & Shariah Hard Filter) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Fiqh / Religious Values: 100%">
          <div className="w-full bg-[#F5C770] rounded-full h-[88%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#8F7435]">Fiqh</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Family Background: 95%">
          <div className="w-full bg-[#F5C770] rounded-full h-[82%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#8F7435]">Lineage</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Marital Status Filter: 100%">
          <div className="w-full bg-[#F5C770] rounded-full h-[94%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#8F7435]">Status</span>
        </div>
        
        {/* Capsule Group 2: Soft Coral / Rose Pills (Lifestyle, Education & Demographics) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Education: 90%">
          <div className="w-full bg-[#F6A398] rounded-full h-[76%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#B35246]">Edu</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Career Alignment: 85%">
          <div className="w-full bg-[#F6A398] rounded-full h-[70%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#B35246]">Career</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Age Preference: 88%">
          <div className="w-full bg-[#F6A398] rounded-full h-[74%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#B35246]">Age</span>
        </div>
        
        {/* Capsule Group 3: Soft Muted Slate Pills (Location & Relocation Flexibility) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Living Setup (Independent / Joint): 68%">
          <div className="w-full bg-[#D4DDD8] rounded-full h-[58%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#66726D]">Living</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="City Relocation: 60%">
          <div className="w-full bg-[#D4DDD8] rounded-full h-[50%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#66726D]">City</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end" title="Relocation Abroad: 45%">
          <div className="w-full bg-[#E5ECE8] rounded-full h-[38%] capsule-bar"></div>
          <span className="text-[9.5px] font-semibold text-[#838E8A]">Global</span>
        </div>
      </div>
    </section>
  );
}
