'use client';

import React from 'react';
import type { RejectionReasonStat } from './mockData';

interface HorizontalBarRankProps {
  items: RejectionReasonStat[];
  isUrdu?: boolean;
}

export default function HorizontalBarRank({ items, isUrdu = false }: HorizontalBarRankProps) {
  const maxPct = Math.max(...items.map((i) => i.percentage), 1);

  return (
    <div className="space-y-3.5">
      {items.map((item, index) => {
        const title = isUrdu && item.name_ur ? item.name_ur : item.name_en;
        const sub = isUrdu ? item.name_en : item.name_ur;

        return (
          <div key={item.id} className="space-y-1.5 group">
            {/* Top row: Label, count, percentage */}
            <div className="flex items-center justify-between text-[12px] gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-[#F4EFE7] border border-[#E9E2D4] text-[#676156] text-[10px] font-bold flex items-center justify-center shrink-0">
                  #{index + 1}
                </span>
                <span className="font-bold text-[#1E2022] truncate group-hover:text-[#1F3B34] transition-colors">
                  {title}
                </span>
                {sub && (
                  <span className="text-[10px] text-[#888174] truncate hidden sm:inline">
                    ({sub})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-right">
                <span className="text-[11px] font-medium text-[#7C756B]">
                  {item.count} cases
                </span>
                <span className="text-[12px] font-extrabold text-[#1E2022] w-9 text-right font-mono">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Progress bar container */}
            <div className="w-full h-2.5 rounded-full bg-[#F4EFE7] border border-[#EBE4D8] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(item.percentage / maxPct) * 100}%`,
                  backgroundColor: item.color || '#1F3B34',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
