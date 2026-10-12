import React from 'react';
import type { FilterMode } from '@/lib/directory/types';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

interface ModeToggleProps {
  mode: FilterMode;
  onChangeMode: (newMode: FilterMode) => void;
  hasActiveFilters: boolean;
  allCount: number;
  exactCount: number;
  similarCount: number;
}

export function ModeToggle({
  mode,
  onChangeMode,
  hasActiveFilters,
  allCount,
  exactCount,
  similarCount,
}: ModeToggleProps) {
  const isExactDisabled = !hasActiveFilters;
  const isSimilarDisabled = !hasActiveFilters;

  const renderButton = (
    btnMode: FilterMode,
    label: string,
    count: number,
    disabled: boolean
  ) => {
    const isActive = mode === btnMode;

    return (
      <div className="relative group">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeMode(btnMode)}
          className={`flex items-center rounded-full text-[13px] font-semibold transition-all select-none focus:outline-none ${
            disabled ? 'cursor-not-allowed opacity-[0.38]' : ''
          }`}
          style={{
            height: '38px',
            padding: '0 7px 0 18px',
            gap: '9px',
            backgroundColor: isActive ? DIRECTORY_THEME.brand.primary : 'transparent',
            color: isActive ? DIRECTORY_THEME.brand.text : DIRECTORY_THEME.text.muted,
            boxShadow: isActive ? DIRECTORY_THEME.shadows.btnBrand : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span>{label}</span>
          <span
            className="flex items-center justify-center rounded-full text-[11px] font-bold leading-none shrink-0"
            style={{
              minWidth: '26px',
              height: '24px',
              padding: '0 7px',
              backgroundColor: isActive
                ? DIRECTORY_THEME.amber.bg
                : DIRECTORY_THEME.surfaces.white,
              color: isActive
                ? DIRECTORY_THEME.amber.badgeText
                : DIRECTORY_THEME.text.body,
              transition: 'all 0.25s ease',
            }}
          >
            {disabled ? '–' : count}
          </span>
        </button>

        {disabled && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-9 hidden group-hover:block text-[11px] font-medium py-1 px-2.5 rounded-md whitespace-nowrap shadow-md pointer-events-none z-30"
            style={{
              backgroundColor: DIRECTORY_THEME.brand.primary,
              color: DIRECTORY_THEME.brand.text,
            }}
          >
            Enter a filter first
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3.5 flex-wrap">
      {/* Pill Container: warm light grey, padding 4px, gap 2px */}
      <div
        className="inline-flex items-center rounded-full"
        style={{
          backgroundColor: DIRECTORY_THEME.surfaces.toggleTrack,
          padding: '4px',
          gap: '2px',
        }}
      >
        {renderButton('all', 'All', allCount, false)}
        {renderButton('exact', 'Exact', exactCount, isExactDisabled)}
        {renderButton('similar', 'Similar', similarCount, isSimilarDisabled)}
      </div>

      {/* Helper text note next to toggle: 12px muted, hidden once a filter exists */}
      {!hasActiveFilters && (
        <span
          className="text-[12px] font-medium select-none"
          style={{ color: DIRECTORY_THEME.text.muted }}
        >
          Exact and Similar unlock once you enter a filter
        </span>
      )}
    </div>
  );
}
