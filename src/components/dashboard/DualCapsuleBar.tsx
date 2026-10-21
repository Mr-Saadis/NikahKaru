'use client';

import React from 'react';

interface DualCapsuleBarProps {
  labelLeft: string;
  valueLeft: number;
  pctLeft: number;
  colorLeft?: string;
  labelRight: string;
  valueRight: number;
  pctRight: number;
  colorRight?: string;
  height?: number;
  showLabels?: boolean;
}

export default function DualCapsuleBar({
  labelLeft,
  valueLeft,
  pctLeft,
  colorLeft = '#1F3B34', // Deep Forest Green
  labelRight,
  valueRight,
  pctRight,
  colorRight = '#C86A4A', // Warm Rust/Amber
  height = 10,
  showLabels = true,
}: DualCapsuleBarProps) {
  return (
    <div className="w-full space-y-2">
      {showLabels && (
        <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#4E473D]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorLeft }} />
            <span>{labelLeft}: <strong className="text-[#1E2022]">{valueLeft}</strong> ({pctLeft}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{labelRight}: <strong className="text-[#1E2022]">{valueRight}</strong> ({pctRight}%)</span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorRight }} />
          </div>
        </div>
      )}

      {/* Dual Bar Track */}
      <div
        className="w-full rounded-full bg-[#EAE2D5] overflow-hidden flex p-0.5 border border-[#DFD6C5]/60 shadow-inner"
        style={{ height: `${height + 4}px` }}
      >
        <div
          className="h-full rounded-l-full transition-all duration-500 ease-out"
          style={{ width: `${pctLeft}%`, backgroundColor: colorLeft }}
          title={`${labelLeft}: ${pctLeft}%`}
        />
        <div
          className="h-full rounded-r-full transition-all duration-500 ease-out"
          style={{ width: `${pctRight}%`, backgroundColor: colorRight }}
          title={`${labelRight}: ${pctRight}%`}
        />
      </div>
    </div>
  );
}
