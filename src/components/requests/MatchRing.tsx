import React from 'react';

export function MatchRing({ pct }: { pct: number }) {
  const L = 113.1; // 2 * pi * 18
  const strokeDasharray = `${(pct / 100) * L} ${L}`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 46 46" className="w-[46px] h-[46px]">
        <circle cx="23" cy="23" r="18" fill="none" stroke="#eeede6" strokeWidth="3.5" />
        <circle
          cx="23" cy="23" r="18" fill="none" stroke="#111" strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={strokeDasharray}
          transform="rotate(-90 23 23)"
        />
        <text x="23" y="27" textAnchor="middle" fontSize={pct === 100 ? "10" : "11"} fontWeight="700" fill="#111" fontFamily="inherit" letterSpacing="-0.5">
          {pct}%
        </text>
      </svg>
    </div>
  );
}
