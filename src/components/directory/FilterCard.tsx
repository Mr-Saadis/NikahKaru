'use client';

import React from 'react';
import { X } from 'lucide-react';

// ── Dark card design tokens (#2F3E51 navy card) ──────────────────
export const DARK_CARD = {
  // Controls — clearly darker than the #2F3E51 card (matches notification panel)
  controlBg: 'rgba(0,0,0,0.28)',           // collapsed row — visibly sunken
  controlBgActive: 'rgba(0,0,0,0.38)',     // value selected — even deeper
  controlBgExpanded: 'rgba(0,0,0,0.38)',   // expanded — same as active
  controlBorder: 'rgba(255,255,255,0.0)',  // no border — depth from bg only
  controlBorderActive: 'rgba(255,255,255,0.0)',
  textPrimary: 'rgba(255,255,255,0.90)',   // strong white — selected / filled value
  textMuted: 'rgba(255,255,255,0.42)',     // dim white — placeholder / label
  textLabel: 'rgba(255,255,255,0.58)',     // field label (slightly brighter when active)
  iconMuted: 'rgba(255,255,255,0.35)',     // icons in collapsed state
  clearBtn: 'rgba(255,255,255,0.18)',      // X clear button bg
  divider: 'rgba(255,255,255,0.07)',       // thin divider between rows
  // Expanded dropdown — also dark
  dropdownBg: 'rgba(0,0,0,0.28)',
  dropdownBorder: 'rgba(255,255,255,0.0)',
} as const;

interface FilterCardProps {
  id: string;
  label: string;
  unit?: string;
  tintHex: string;        // kept for API compat — not used for bg
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
  isActive,
  isOpen = false,
  isExpandable = false,
  onClear,
  onHeaderClick,
  children,
  className = '',
}: FilterCardProps) {
  return (
    <div
      data-filter-card={id}
      className={`select-none transition-all duration-200 ${className}`}
      style={{ padding: '10px 14px 12px' }}
    >
      {/* ── Label row ── */}
      <div
        className={`flex items-center justify-between mb-[8px] ${
          isExpandable ? 'cursor-pointer' : ''
        }`}
        onClick={isExpandable ? onHeaderClick : undefined}
      >
        <div className="flex items-center gap-1 truncate pr-1">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.8px]"
            style={{
              color: isActive ? DARK_CARD.textLabel : DARK_CARD.textMuted,
            }}
          >
            {label}
          </span>
          {unit && (
            <span
              className="text-[10px] font-medium normal-case"
              style={{ color: DARK_CARD.textMuted }}
            >
              · {unit}
            </span>
          )}
        </div>

        {/* Clear X */}
        {isActive && (
          <button
            type="button"
            aria-label={`Clear ${label} filter`}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="w-[17px] h-[17px] rounded-full flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all focus:outline-none"
            style={{
              backgroundColor: DARK_CARD.clearBtn,
              color: DARK_CARD.textPrimary,
            }}
            title="Clear filter"
          >
            <X size={9} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div>{children}</div>
    </div>
  );
}
