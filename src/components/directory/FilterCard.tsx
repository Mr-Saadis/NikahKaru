'use client';

import React from 'react';
import { X } from 'lucide-react';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

interface FilterCardProps {
  id: string;
  label: string;
  unit?: string;
  tintHex: string;
  isActive: boolean;
  isOpen?: boolean;
  isExpandable?: boolean;
  onClear: () => void;
  onHeaderClick?: () => void;
  children: React.ReactNode;
  configIndex: number;
  className?: string;
}

export function FilterCard({
  id,
  label,
  unit,
  tintHex,
  isActive,
  isOpen = false,
  isExpandable = false,
  onClear,
  onHeaderClick,
  children,
  configIndex,
  className = '',
}: FilterCardProps) {
  const isEven = configIndex % 2 === 0;

  // Box shadow states as per spec
  let currentShadow: string = DIRECTORY_THEME.shadows.cardBase;
  if (isOpen) {
    currentShadow = DIRECTORY_THEME.shadows.cardOpen;
  } else if (isActive) {
    currentShadow = DIRECTORY_THEME.shadows.cardActive;
  }

  // Detect dark background matching RequestCard.tsx logic
  const isDark = ['#2F3E51', '#1F3B34', '#C86A4A'].includes(tintHex);

  return (
    <div
      data-filter-card={id}
      className={`group relative select-none transition-all duration-200 motion-reduce:transition-none hover:-translate-y-[2px] motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        backgroundColor: tintHex,
        minHeight: '94px',
        borderRadius: '26px',
        padding: '13px 15px 15px',
        boxShadow: currentShadow,
        // Exact horizontal stagger: Even -> margin-right 18px; Odd -> margin-left 18px
        marginRight: isEven ? '18px' : '0px',
        marginLeft: !isEven ? '18px' : '0px',
        width: 'calc(100% - 18px)',
        animation: 'cardFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Card Header row: height 20px, label 10.5px / weight 700 / letter-spacing .7px / uppercase */}
      <div
        className={`flex items-center justify-between h-[20px] mb-2 ${
          isExpandable ? 'cursor-pointer' : ''
        }`}
        onClick={isExpandable ? onHeaderClick : undefined}
      >
        <div className="flex items-center truncate pr-1">
          <span
            className="text-[10.5px] font-bold uppercase"
            style={{
              letterSpacing: '0.7px',
              color: isDark ? '#FFFFFF' : DIRECTORY_THEME.text.muted,
            }}
          >
            {label}
          </span>
          {unit && (
            <span
              className="text-[10px] font-medium tracking-normal ml-1 normal-case"
              style={{ color: isDark ? 'rgba(255,255,255,0.75)' : DIRECTORY_THEME.text.subtle }}
            >
              · {unit}
            </span>
          )}
        </div>

        {/* Clear button */}
        {isActive && (
          <button
            type="button"
            aria-label={`Clear ${label} filter`}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all focus:outline-none"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : DIRECTORY_THEME.brand.primary,
              color: '#FFFFFF',
            }}
            title="Clear filter"
          >
            <X size={10} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Filter Body */}
      <div>{children}</div>
    </div>
  );
}
