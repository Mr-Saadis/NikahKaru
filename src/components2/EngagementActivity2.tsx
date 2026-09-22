import React from 'react';
import { sharedMockProfiles } from '@/data/mockData';

export default function EngagementActivity2() {
  const mainCandidate = sharedMockProfiles[0];

  return (
    <section aria-labelledby="activity-heading" className="xl:col-span-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#232326] tracking-tight" id="activity-heading">Recent Engagement Activity</h2>
        <a className="text-[11.5px] font-bold text-[#115E49] hover:underline" href="#all-activity">View all</a>
      </div>
      {/* Activity List Card */}
      <div className="bg-white rounded-[26px] p-4 border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] space-y-3">
        {/* Log Item 1 */}
        <div className="flex items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FCE7CE] text-[#8C5216] font-bold flex items-center justify-center text-xs">
              {mainCandidate.wali.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h5 className="font-bold text-[#222]">{mainCandidate.wali}</h5>
              <p className="text-[10.5px] text-[#867E72]">Outcome Recorded: Interested</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-[#115E49] text-[12px]">Completed</span>
            <p className="text-[10px] text-[#9E978C]">Today, 10:45 AM</p>
          </div>
        </div>
        {/* Log Item 2 */}
        <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-[#F7F4EE]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E5EFE9] text-[#165842] font-bold flex items-center justify-center text-xs">
              {mainCandidate.assignedAgent.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h5 className="font-bold text-[#222]">{mainCandidate.assignedAgent}</h5>
              <p className="text-[10.5px] text-[#867E72]">Request Info (Tier 2)</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-[#C26715] text-[12px]">Pending</span>
            <p className="text-[10px] text-[#9E978C]">Yesterday, 3:17 PM</p>
          </div>
        </div>
        {/* Log Item 3 */}
        <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-[#F7F4EE]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FCE2DF] text-[#A6372A] font-bold flex items-center justify-center text-xs">
              SY
            </div>
            <div>
              <h5 className="font-bold text-[#222]">System Auto-Match</h5>
              <p className="text-[10.5px] text-[#867E72]">Compatibility Check</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-[#4B5563] text-[12px]">Completed</span>
            <p className="text-[10px] text-[#9E978C]">Oct 18, 9:15 AM</p>
          </div>
        </div>
      </div>
    </section>
  );
}
