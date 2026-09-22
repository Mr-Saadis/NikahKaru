import React from 'react';

export default function OfficerPerformance() {
  return (
    <section aria-labelledby="officer-heading" className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-[#F5EFE6]">
        <div>
          <h3 className="text-[14.5px] font-bold text-[#1F1E1B]" id="officer-heading">Field Officer Performance</h3>
          <p className="text-[11px] text-[#867E72]">Intake &amp; Verification Cadre</p>
        </div>
        <span className="text-[11px] font-bold text-[#137333] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full border border-[#d1e3dc]">Active Today</span>
      </div>

      <div className="space-y-2.5">
        {/* Officer 1 */}
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EBE4D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E5EFE9] text-[#165842] font-bold text-xs flex items-center justify-center">
              FN
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-[#1E1F22] leading-tight">Fatima Noor</h4>
              <p className="text-[10.5px] text-[#867E72]">Central Lahore • 32 Profiles</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[12px] font-bold text-[#064e3b]">6 Matches</span>
            <p className="text-[10px] text-[#9E978C]">18m avg reply</p>
          </div>
        </div>

        {/* Officer 2 */}
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EBE4D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FCE7CE] text-[#8C5216] font-bold text-xs flex items-center justify-center">
              UT
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-[#1E1F22] leading-tight">Usman Tariq</h4>
              <p className="text-[10.5px] text-[#867E72]">Islamabad / RWP • 28 Profiles</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[12px] font-bold text-[#064e3b]">4 Matches</span>
            <p className="text-[10px] text-[#9E978C]">24m avg reply</p>
          </div>
        </div>

        {/* Officer 3 */}
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EBE4D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FCE2DF] text-[#A6372A] font-bold text-xs flex items-center justify-center">
              AK
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-[#1E1F22] leading-tight">Ayesha Khan</h4>
              <p className="text-[10.5px] text-[#867E72]">Karachi Metro • 41 Profiles</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[12px] font-bold text-[#064e3b]">8 Matches</span>
            <p className="text-[10px] text-[#9E978C]">12m avg reply</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[12px]">
        <span className="text-[#7C756B]">SLA Compliance: <strong className="text-[#1E1F22]">96.4%</strong></span>
        <a className="font-bold text-[#064e3b] hover:underline" href="#">View Agent Ledger →</a>
      </div>
    </section>
  );
}
