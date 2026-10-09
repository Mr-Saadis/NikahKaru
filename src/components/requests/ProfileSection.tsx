import React from 'react';
import type { RequestItem } from './types';
import { getProfileGroups, ProfileGroup } from './utils';

interface ProfileSectionProps {
  item: RequestItem;
}

export function ProfileSection({ item }: ProfileSectionProps) {
  const PR: ProfileGroup[] = getProfileGroups(item);

  return (
    <div className="flex flex-col min-w-0">
      {PR.map((g, i) => (
        <section
          key={i}
          data-sec={i}
          className="bg-transparent border-0 shadow-none rounded-none p-[22px_6px] first:pt-[6px] border-t border-[#e6e5de] first:border-t-0"
        >
          <h3 className="flex items-center gap-[10px] m-[0_0_12px] text-[15px] font-[700] tracking-[-0.2px]">
            <span className="w-[28px] h-[28px] rounded-full bg-[#111] text-white flex items-center justify-center text-[12px]">
              {i + 1}
            </span>
            {g[0]}
          </h3>
          <div className="grid grid-cols-2 gap-[6px_24px]">
            {g[1].map((r, j) => (
              <div key={j} className="p-[6px_0]">
                <small className="block text-[11px] text-[#8d8c86]">{r[0]}</small>
                <b className="block text-[14px] font-[600] mt-[2px]">{r[1]}</b>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
