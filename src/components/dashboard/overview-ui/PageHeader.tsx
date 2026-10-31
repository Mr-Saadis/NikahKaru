import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { LayoutGrid, RefreshCw } from 'lucide-react';
import { SegmentedTabs } from './SegmentedTabs';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  lastUpdated?: string;
  onRefresh?: () => void;
  selectedDays?: number;
  onRangeChange?: (days: number) => void;
  actionButton?: React.ReactNode;
  isRefreshing?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon = LayoutGrid,
  lastUpdated,
  onRefresh,
  selectedDays,
  onRangeChange,
  actionButton,
  isRefreshing = false,
}: PageHeaderProps) {
  const rangeTabs = [
    { id: 7, label: '7d' },
    { id: 30, label: '30d' },
    { id: 90, label: '90d' },
    { id: 0, label: 'All' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-[#E9E4DC]/70">
      {/* Title with muted icon & optional greeting/subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#F4EFE7] flex items-center justify-center shrink-0 border border-[#E9E4DC]/60 shadow-2xs">
          <Icon className="w-4 h-4 text-[#1F3B34]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-[#1E2022] tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <div className="text-xs text-[#7D766C] font-medium truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Controls on right side */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Range Segmented Tabs (Manager & Admin) */}
        {selectedDays !== undefined && onRangeChange && (
          <SegmentedTabs
            tabs={rangeTabs}
            activeId={selectedDays}
            onChange={onRangeChange}
            size="sm"
          />
        )}

        {/* Last updated timestamp */}
        {lastUpdated && (
          <span className="text-xs text-[#7D766C] tabular-nums whitespace-nowrap font-medium">
            Last updated {lastUpdated}
          </span>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh overview data"
            title="Refresh overview data"
            className="w-8 h-8 rounded-full border border-[#E9E4DC] bg-white hover:bg-[#F4EFE7] text-[#7D766C] hover:text-[#1E2022] flex items-center justify-center transition-all duration-120 active:scale-95 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#1F3B34]/30 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'opacity-50' : ''}`} />
          </button>
        )}

        {/* Action Button (e.g. New Profile) */}
        {actionButton}
      </div>
    </div>
  );
}
