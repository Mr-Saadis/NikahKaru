import React, { useEffect, useState } from 'react';
import type { AdminFunnelStage } from '@/lib/types/overview.types';
import { ArrowDown } from 'lucide-react';

interface FunnelBarsProps {
  stages: AdminFunnelStage[];
  className?: string;
}

export function FunnelBars({ stages, className = '' }: FunnelBarsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Stagger / delay mount for animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!stages || stages.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#7D766C]">
        No conversion funnel stages recorded.
      </div>
    );
  }

  const maxVal = Math.max(...stages.map((s) => s.n), 1);

  return (
    <div className={`space-y-3 ${className}`}>
      {stages.map((stage, idx) => {
        const prevN = idx > 0 ? stages[idx - 1].n : null;
        const dropOffPct =
          prevN !== null && prevN > 0 && stage.n < prevN
            ? Math.round(((prevN - stage.n) / prevN) * 100)
            : null;

        const targetWidth = Math.max(8, Math.round((stage.n / maxVal) * 100));
        const currentWidth = mounted ? targetWidth : 8;

        return (
          <div key={stage.stage} className="space-y-1">
            {/* Optional Drop-off chip between stages */}
            {dropOffPct !== null && (
              <div className="flex items-center gap-2 pl-3 text-[10px] text-[#7D766C] font-medium">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#F4EFE7] border border-[#E5DED3] text-[#5C5449] font-semibold">
                  <ArrowDown className="w-2.5 h-2.5 text-[#C86A4A]" />
                  <span>{dropOffPct}% drop-off</span>
                </span>
                <span className="text-[#A49C8F]">from previous stage</span>
              </div>
            )}

            {/* Tall rounded bar (compact on mobile, h-9 on sm+) */}
            <div className="w-full bg-[#FAF8F5] rounded-xl h-7 sm:h-9 overflow-hidden border border-[#E9E4DC]/80 p-0.5 flex relative">
              <div
                className="h-full min-w-[105px] sm:min-w-[115px] rounded-lg bg-[#1F3B34] flex items-center justify-between px-2.5 sm:px-3 text-white transition-all duration-700 ease-out"
                style={{ width: `${currentWidth}%` }}
              >
                <span className="font-semibold text-[11px] sm:text-xs tracking-tight truncate mr-2 select-none">
                  {stage.stage}
                </span>
                <span className="font-bold text-[11px] sm:text-xs tabular-nums select-none shrink-0">
                  {stage.n.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

