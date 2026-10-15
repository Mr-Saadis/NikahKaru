import React from 'react';
import type { RequestItem } from './types';
import { getProfileGroups, ProfileGroup } from './utils';

interface ProfileSectionProps {
  item: RequestItem;
  preferences?: any;
  isLoadingPrefs?: boolean;
}

function renderFieldValue(val: string) {
  if (!val || val === 'N/A') return <span className="text-[#8d8c86]">N/A</span>;
  if (val === "Doesn't Matter") {
    return <span className="text-[#8A968C] font-normal text-[13px]">Doesn&apos;t Matter</span>;
  }

  const match = val.match(/^(.*?)\s*\((Must Have|High|Medium|Low|Doesn't Matter)\)$/i);
  if (match) {
    const mainVal = match[1];
    const imp = match[2];
    let badgeClass = 'bg-[#8A968C]/15 text-[#6B756D] border-[#8A968C]/30';
    if (/must have/i.test(imp)) {
      badgeClass = 'bg-[#064e3b]/10 text-[#064e3b] border-[#064e3b]/25';
    } else if (/high/i.test(imp)) {
      badgeClass = 'bg-[#C86A4A]/10 text-[#C86A4A] border-[#C86A4A]/25';
    } else if (/medium/i.test(imp)) {
      badgeClass = 'bg-[#D4AF37]/15 text-[#927318] border-[#D4AF37]/30';
    } else if (/low/i.test(imp)) {
      badgeClass = 'bg-[#A3B18A]/20 text-[#465c40] border-[#A3B18A]/35';
    }

    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span>{mainVal}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide ${badgeClass}`}>
          {imp}
        </span>
      </span>
    );
  }

  return <span>{val}</span>;
}

export function ProfileSection({ item, preferences, isLoadingPrefs }: ProfileSectionProps) {
  const PR: ProfileGroup[] = getProfileGroups(item, preferences, isLoadingPrefs);

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
                <b className="block text-[14px] font-[600] mt-[2px]">{renderFieldValue(r[1])}</b>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
