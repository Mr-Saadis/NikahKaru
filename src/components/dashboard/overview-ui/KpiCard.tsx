import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

export interface DeltaInfo {
  text: string;
  isPositive: boolean;
  isZero: boolean;
}

interface KpiCardProps {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  numericValue?: number | null;
  formatFn?: (val: number) => string;
  delta?: DeltaInfo | null;
  caption?: React.ReactNode;
  isAlert?: boolean;
  alertColor?: 'red' | 'amber';
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  numericValue,
  formatFn,
  delta,
  caption,
  isAlert = false,
  alertColor = 'red',
  className = '',
  onClick,
}: KpiCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between min-w-0 ${
        isClickable
          ? 'cursor-pointer hover:border-[#1F3B34]/50 active:scale-98'
          : ''
      } ${className}`}
    >
      {/* Top row: Icon + Label on left, Delta Chip on right */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="w-6 h-6 rounded-full bg-[#FAF8F5] flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-[#7D766C]" />
            </div>
          )}
          <span className="text-xs font-semibold text-[#7D766C] truncate uppercase tracking-wider">
            {label}
          </span>
        </div>

        {delta && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums shrink-0 shadow-2xs ${
              delta.isZero
                ? 'bg-[#F4EFE7] text-[#7D766C]'
                : delta.isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                delta.isZero
                  ? 'bg-[#E9E4DC] text-[#7D766C]'
                  : delta.isPositive
                  ? 'bg-emerald-200/60 text-emerald-800'
                  : 'bg-rose-200/60 text-rose-800'
              }`}
            >
              {delta.isZero ? (
                <Minus className="w-2.5 h-2.5" />
              ) : delta.isPositive ? (
                <ArrowUpRight className="w-2.5 h-2.5" />
              ) : (
                <ArrowDownRight className="w-2.5 h-2.5" />
              )}
            </span>
            <span>{delta.text}</span>
          </div>
        )}
      </div>

      {/* Middle row: Large numeral with count-up animation */}
      <div
        className={`text-2xl md:text-3xl font-bold tabular-nums tracking-tight mt-3 mb-1 truncate ${
          isAlert
            ? alertColor === 'red'
              ? 'text-rose-600'
              : 'text-amber-600'
            : 'text-[#1E2022]'
        }`}
      >
        {numericValue !== undefined ? (
          <AnimatedNumber value={numericValue} formatFn={formatFn} />
        ) : (
          value
        )}
      </div>

      {/* Bottom row: One-line caption */}
      {caption && (
        <div className="text-xs text-[#7D766C] truncate flex items-center gap-1 font-medium">
          {caption}
        </div>
      )}
    </div>
  );
}
