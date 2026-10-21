'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CompactKPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendPositive?: boolean;
  variant?: 'amber' | 'neutral' | 'urgent';
  icon?: LucideIcon;
  badge?: string;
  badgeVariant?: 'urgent' | 'success' | 'amber' | 'neutral';
  onClick?: () => void;
}

export default function CompactKPICard({
  label,
  value,
  subtext,
  trend,
  trendPositive = true,
  variant = 'neutral',
  icon: Icon,
  badge,
  badgeVariant = 'neutral',
  onClick,
}: CompactKPICardProps) {
  const isAmber = variant === 'amber';
  const isUrgent = variant === 'urgent';

  const containerClasses = isUrgent
    ? 'bg-[#FEF2F2] border-[#FCA5A5]/60 hover:border-[#F87171]'
    : isAmber
    ? 'bg-[#FDF0D8] border-[#F6E1BA]/80 hover:border-[#ECC066]'
    : 'bg-[#F8F4EC] border-[#E9E2D4] hover:border-[#DFD6C5]';

  const labelColor = isUrgent
    ? 'text-[#991B1B]'
    : isAmber
    ? 'text-[#78643C]'
    : 'text-[#766E61]';

  const valueColor = isUrgent
    ? 'text-[#7F1D1D]'
    : isAmber
    ? 'text-[#241E15]'
    : 'text-[#24211D]';

  const badgeStyles = {
    urgent: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/60',
    success: 'bg-[#E5EFE9] text-[#166534] border border-[#D1E3DC]',
    amber: 'bg-[#FEF3C7] text-[#8B6122] border border-[#F6E1BA]',
    neutral: 'bg-white/80 text-[#5C5549] border border-[#E9E2D4]',
  }[badgeVariant];

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-[22px] p-4 lg:p-5 border shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] transition-all duration-200 flex flex-col justify-between min-h-[128px] ${containerClasses} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      {/* Top Row: Label & Badges / Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor} truncate`}>
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeStyles}`}>
              {badge}
            </span>
          )}
          {Icon && (
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isUrgent
                  ? 'bg-[#FEE2E2] text-[#991B1B]'
                  : isAmber
                  ? 'bg-[#F7E7CE] text-[#825418]'
                  : 'bg-white text-[#1F3B34] border border-[#E9E2D4]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Large Value */}
      <div className="my-1 flex items-baseline gap-2">
        <span className={`text-[26px] lg:text-[28px] font-black tracking-tight ${valueColor}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
              trendPositive
                ? 'bg-[#E5EFE9] text-[#166534] border border-[#D1E3DC]'
                : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Bottom Row: Subtext / Context */}
      {subtext && (
        <div className="text-[11px] font-medium text-[#7C756B] truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}
