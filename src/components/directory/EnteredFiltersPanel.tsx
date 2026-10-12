import React from 'react';
import { X } from 'lucide-react';
import type {
  ActiveFilterValues,
  FilterMode,
  NumericFilterValue,
} from '@/lib/directory/types';
import { FILTER_CONFIGS } from '@/lib/directory/config';
import {
  isFilterActive,
  formatHeight,
} from '@/lib/directory/filters';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';
import { ModeToggle } from './ModeToggle';

interface EnteredFiltersPanelProps {
  mode: FilterMode;
  onChangeMode: (m: FilterMode) => void;
  filters: ActiveFilterValues;
  onUpdateFilter: <K extends keyof ActiveFilterValues>(key: K, value: ActiveFilterValues[K]) => void;
  onClearFilter: (key: keyof ActiveFilterValues) => void;
  onClearAll: () => void;
  totalEntries: number;
  showingEntries: number;
  activeFilterCount: number;
  allCount: number;
  exactCount: number;
  similarCount: number;
}

export function EnteredFiltersPanel({
  mode,
  onChangeMode,
  filters,
  onUpdateFilter,
  onClearFilter,
  onClearAll,
  totalEntries,
  showingEntries,
  activeFilterCount,
  allCount,
  exactCount,
  similarCount,
}: EnteredFiltersPanelProps) {
  const hasActiveFilters = activeFilterCount > 0;

  // Render individual pills inside a chip
  const renderChipContent = (filterId: keyof ActiveFilterValues) => {
    const cfg = FILTER_CONFIGS.find((c) => c.id === filterId);
    if (!cfg) return null;

    const val = filters[filterId];

    if (cfg.type === 'text') {
      const textVal = (val as string).trim();
      if (!textVal) return null;
      return (
        <div
          key={filterId}
          className="inline-flex items-center gap-[6px] rounded-[20px] animate-[cardFadeUp_0.25s_ease_both]"
          style={{
            backgroundColor: cfg.tintHex,
            padding: '5px 6px 5px 13px',
            boxShadow: `inset 0 0 0 1px ${DIRECTORY_THEME.borders.chipRing}`,
          }}
        >
          <span
            className="text-[12px] font-semibold"
            style={{ color: DIRECTORY_THEME.text.body }}
          >
            {cfg.label}
          </span>
          <span
            className="inline-flex items-center rounded-full text-[12px] font-semibold"
            style={{
              backgroundColor: DIRECTORY_THEME.surfaces.frostedTag,
              color: DIRECTORY_THEME.text.body,
              padding: '3px 3px 3px 10px',
              maxWidth: '230px',
            }}
          >
            <span className="truncate mr-1.5">{textVal}</span>
            <button
              type="button"
              onClick={() => onClearFilter(filterId)}
              className="w-[20px] h-[20px] rounded-full flex items-center justify-center hover:scale-[1.15] transition-transform shrink-0"
              style={{
                backgroundColor: DIRECTORY_THEME.brand.primary,
                color: DIRECTORY_THEME.brand.text,
              }}
              title="Remove value"
            >
              <X size={10} strokeWidth={3} />
            </button>
          </span>
        </div>
      );
    }

    if (cfg.type === 'number') {
      const numVal = val as NumericFilterValue;
      if (numVal.min === null && numVal.max === null) return null;

      const hasMultiplePills = numVal.min !== null && numVal.max !== null;

      return (
        <div
          key={filterId}
          className="inline-flex items-center gap-[6px] rounded-[20px] animate-[cardFadeUp_0.25s_ease_both]"
          style={{
            backgroundColor: cfg.tintHex,
            padding: '5px 6px 5px 13px',
            boxShadow: `inset 0 0 0 1px ${DIRECTORY_THEME.borders.chipRing}`,
          }}
        >
          <span
            className="text-[12px] font-semibold"
            style={{ color: DIRECTORY_THEME.text.body }}
          >
            {cfg.label}
          </span>

          {numVal.min !== null && (
            <span
              className="inline-flex items-center rounded-full text-[12px] font-semibold"
              style={{
                backgroundColor: DIRECTORY_THEME.surfaces.frostedTag,
                color: DIRECTORY_THEME.text.body,
                padding: '3px 3px 3px 10px',
                maxWidth: '230px',
              }}
            >
              <span className="truncate mr-1.5">
                {cfg.isHeight
                  ? `From ${formatHeight(numVal.min)}`
                  : cfg.isIncome
                  ? `From Rs ${numVal.min}k`
                  : `From ${numVal.min} ${cfg.unit}`}
              </span>
              <button
                type="button"
                onClick={() => onUpdateFilter(filterId, { ...numVal, min: null })}
                className="w-[20px] h-[20px] rounded-full flex items-center justify-center hover:scale-[1.15] transition-transform shrink-0"
                style={{
                  backgroundColor: DIRECTORY_THEME.brand.primary,
                  color: DIRECTORY_THEME.brand.text,
                }}
                title="Remove lower bound"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          )}

          {numVal.max !== null && (
            <span
              className="inline-flex items-center rounded-full text-[12px] font-semibold"
              style={{
                backgroundColor: DIRECTORY_THEME.surfaces.frostedTag,
                color: DIRECTORY_THEME.text.body,
                padding: '3px 3px 3px 10px',
                maxWidth: '230px',
              }}
            >
              <span className="truncate mr-1.5">
                {cfg.isHeight
                  ? `To ${formatHeight(numVal.max)}`
                  : cfg.isIncome
                  ? `To Rs ${numVal.max}k`
                  : `To ${numVal.max} ${cfg.unit}`}
              </span>
              <button
                type="button"
                onClick={() => onUpdateFilter(filterId, { ...numVal, max: null })}
                className="w-[20px] h-[20px] rounded-full flex items-center justify-center hover:scale-[1.15] transition-transform shrink-0"
                style={{
                  backgroundColor: DIRECTORY_THEME.brand.primary,
                  color: DIRECTORY_THEME.brand.text,
                }}
                title="Remove upper bound"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          )}

          {/* Outlined whole-filter remove button when >1 pill */}
          {hasMultiplePills && (
            <button
              type="button"
              onClick={() => onClearFilter(filterId)}
              className={`w-[20px] h-[20px] rounded-full bg-transparent ${DIRECTORY_THEME.classes.hoverBrandPrimaryBg} hover:text-white flex items-center justify-center transition-all shrink-0 ml-0.5`}
              style={{
                boxShadow: DIRECTORY_THEME.borders.pillRemoveRing,
                color: DIRECTORY_THEME.brand.primary,
              }}
              title="Remove filter"
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
        </div>
      );
    }

    if (cfg.type === 'multi') {
      const list = val as string[];
      if (!list || list.length === 0) return null;

      const hasMultiplePills = list.length > 1;

      return (
        <div
          key={filterId}
          className="inline-flex items-center gap-[6px] rounded-[20px] animate-[cardFadeUp_0.25s_ease_both]"
          style={{
            backgroundColor: cfg.tintHex,
            padding: '5px 6px 5px 13px',
            boxShadow: `inset 0 0 0 1px ${DIRECTORY_THEME.borders.chipRing}`,
          }}
        >
          <span
            className="text-[12px] font-semibold"
            style={{ color: DIRECTORY_THEME.text.body }}
          >
            {cfg.label}
          </span>

          {list.map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-full text-[12px] font-semibold"
              style={{
                backgroundColor: DIRECTORY_THEME.surfaces.frostedTag,
                color: DIRECTORY_THEME.text.body,
                padding: '3px 3px 3px 10px',
                maxWidth: '230px',
              }}
            >
              <span className="truncate mr-1.5">{item}</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateFilter(
                    filterId,
                    list.filter((v) => v !== item)
                  )
                }
                className="w-[20px] h-[20px] rounded-full flex items-center justify-center hover:scale-[1.15] transition-transform shrink-0"
                style={{
                  backgroundColor: DIRECTORY_THEME.brand.primary,
                  color: DIRECTORY_THEME.brand.text,
                }}
                title={`Remove ${item}`}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))}

          {/* Outlined whole-filter remove button when >1 pill */}
          {hasMultiplePills && (
            <button
              type="button"
              onClick={() => onClearFilter(filterId)}
              className={`w-[20px] h-[20px] rounded-full bg-transparent ${DIRECTORY_THEME.classes.hoverBrandPrimaryBg} hover:text-white flex items-center justify-center transition-all shrink-0 ml-0.5`}
              style={{
                boxShadow: DIRECTORY_THEME.borders.pillRemoveRing,
                color: DIRECTORY_THEME.brand.primary,
              }}
              title="Remove filter"
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        backgroundColor: DIRECTORY_THEME.surfaces.white,
        borderRadius: '28px',
        padding: '22px 24px',
        boxShadow: DIRECTORY_THEME.shadows.panel,
      }}
    >
      {/* Top Row: Mode Toggle & Right Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <ModeToggle
          mode={mode}
          onChangeMode={onChangeMode}
          hasActiveFilters={hasActiveFilters}
          allCount={allCount}
          exactCount={exactCount}
          similarCount={similarCount}
        />

        {/* Stats on right: three blocks, gap 28px, right-aligned */}
        <div className="flex items-center gap-[28px] ml-auto">
          <div className="flex flex-col items-center">
            <span
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: DIRECTORY_THEME.text.subtle }}
            >
              Total Entries
            </span>
            <span
              className="text-[30px] font-semibold mt-0.5"
              style={{
                letterSpacing: '-0.8px',
                lineHeight: 1.1,
                color: DIRECTORY_THEME.text.title,
              }}
            >
              {totalEntries}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: DIRECTORY_THEME.text.subtle }}
            >
              Showing
            </span>
            <span
              className="text-[30px] font-semibold mt-0.5"
              style={{
                letterSpacing: '-0.8px',
                lineHeight: 1.1,
                color: DIRECTORY_THEME.text.title,
              }}
            >
              {showingEntries}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: DIRECTORY_THEME.text.subtle }}
            >
              Filters On
            </span>
            <span
              className="text-[30px] font-semibold mt-0.5"
              style={{
                letterSpacing: '-0.8px',
                lineHeight: 1.1,
                color: DIRECTORY_THEME.text.title,
              }}
            >
              {activeFilterCount}
            </span>
          </div>
        </div>
      </div>

      {/* Divider block: margin-top:18px; padding-top:16px; border-top:1px solid light warm grey */}
      <div
        className="flex items-center justify-between mb-3"
        style={{
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: `1px solid ${DIRECTORY_THEME.borders.divider}`,
        }}
      >
        <h2
          className="text-[13px] font-bold tracking-tight"
          style={{ color: DIRECTORY_THEME.text.body }}
        >
          Entered filters
        </h2>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[12px] font-bold underline cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: DIRECTORY_THEME.brand.primary }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Chips Area: min-height 60px, NO scroll, grows downward */}
      <div
        className="flex items-center"
        style={{
          minHeight: '60px',
        }}
      >
        {!hasActiveFilters ? (
          <p
            className="text-[12.5px] font-medium"
            style={{ color: DIRECTORY_THEME.text.subtle }}
          >
            No filters entered yet. Fill any card on the left and it shows up here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            {FILTER_CONFIGS.map((cfg) => {
              if (isFilterActive(cfg.id as keyof ActiveFilterValues, filters)) {
                return renderChipContent(cfg.id as keyof ActiveFilterValues);
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
