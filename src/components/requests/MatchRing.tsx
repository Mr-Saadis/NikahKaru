import React from 'react';

export function MatchRing({ pct }: { pct: number }) {
  const L = 100.53; // 2 * pi * 16 = 100.53
  const strokeDasharray = `${(pct / 100) * L} ${L}`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 44 44" className="w-[46px] h-[46px]">
        <circle cx="22" cy="22" r="16" fill="none" stroke="#eeede6" strokeWidth="4.5" />
        <circle
          cx="22" cy="22" r="16" fill="none" stroke="#111" strokeWidth="4.5"
          strokeLinecap="round" strokeDasharray={strokeDasharray}
          transform="rotate(-90 22 22)"
        />
        <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#111">
          {pct}%
        </text>
      </svg>
    </div>
  );
}
