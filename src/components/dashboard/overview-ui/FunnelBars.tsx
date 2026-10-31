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
              <div className="flex items-center gap-2 pl-4 text-[10px] text-rose-600 font-semibold">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                  <ArrowDown className="w-2.5 h-2.5" />
                  <span>{dropOffPct}% drop-off</span>
                </span>
                <span className="text-[#A49C8F]">from previous stage</span>
              </div>
            )}

            {/* Tall rounded bar (h-9) with token gradient fill */}
            <div className="w-full bg-[#FAF8F5] rounded-xl h-9 overflow-hidden border border-[#E9E4DC]/80 p-0.5 flex relative">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-[#1F3B34] to-[#1F3B34]/80 flex items-center justify-between px-3 text-white transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${currentWidth}%` }}
              >
                <span className="font-semibold text-xs tracking-tight truncate mr-2 select-none">
                  {stage.stage}
                </span>
                <span className="font-bold text-xs tabular-nums select-none shrink-0">
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

