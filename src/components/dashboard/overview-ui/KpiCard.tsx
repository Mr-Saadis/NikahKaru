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
      className={`bg-white/85 backdrop-blur-md rounded-[26px] border border-[#E9E4DC]/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03),0_1px_4px_rgba(0,0,0,0.02)] p-5 sm:p-6 transition-all duration-200 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)] flex flex-col justify-between min-w-0 ${
        isClickable
          ? 'cursor-pointer hover:border-[#1F3B34]/40 active:scale-98'
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
            className={`inline-flex items-center gap-1 text-[11.5px] font-bold tabular-nums shrink-0 ${
              delta.isZero
                ? 'text-[#7D766C]'
                : delta.isPositive
                ? 'text-[#1F3B34]'
                : 'text-[#C86A4A]'
            }`}
          >
            {delta.isZero ? (
              <Minus className="w-3 h-3" />
            ) : delta.isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{delta.text}</span>
          </div>
        )}
      </div>

      {/* Middle row: Large numeral with count-up animation */}
      <div
        className={`text-2xl md:text-3xl font-bold tabular-nums tracking-tight mt-3 mb-1 truncate ${
          isAlert
            ? alertColor === 'red'
              ? 'text-[#C86A4A]'
              : 'text-[#D4AF37]'
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
