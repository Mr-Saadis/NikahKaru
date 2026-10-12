'use client';

import React from 'react';
import type {
  ActiveFilterValues,
  DirectoryEntry,
  NumericFilterValue,
} from '@/lib/directory/types';
import { FILTER_CONFIGS } from '@/lib/directory/config';
import { getFilterOptionCounts } from '@/lib/directory/filters';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';
import { TextFilter } from './TextFilter';
import { SelectFilter } from './SelectFilter';
import { NumericFilter } from './NumericFilter';

interface FilterColumnProps {
  entries: DirectoryEntry[];
  filters: ActiveFilterValues;
  onUpdateFilter: <K extends keyof ActiveFilterValues>(key: K, value: ActiveFilterValues[K]) => void;
  onClearFilter: (key: keyof ActiveFilterValues) => void;
  expandedCardId: string | null;
  setExpandedCardId: React.Dispatch<React.SetStateAction<string | null>>;
  sheetBottomPadding: number;
}

export function FilterColumn({
  entries,
  filters,
  onUpdateFilter,
  onClearFilter,
  expandedCardId,
  setExpandedCardId,
  sheetBottomPadding,
}: FilterColumnProps) {
  const isCountryActive = filters.country.length > 0;

  // Split into Key Filters and More Filters
  const keyConfigs = FILTER_CONFIGS.filter((c) => c.section === 'key');
  const moreConfigs = FILTER_CONFIGS.filter((c) => c.section === 'more');

  return (
    <div className="w-full min-[900px]:w-[296px] shrink-0 flex flex-col h-full relative">
      {/* ── Left Column Header (Spec C15) ── */}
      <div className="shrink-0 mb-4 px-1">
        <div>
          <span
            className="block text-[11.5px] font-medium leading-tight mb-1"
            style={{
              letterSpacing: '0.3px',
              color: DIRECTORY_THEME.text.muted,
            }}
          >
            Admin &amp; Manager Console
          </span>
          <h1
            className="text-[26px] font-bold leading-none"
            style={{
              letterSpacing: '-0.6px',
              color: DIRECTORY_THEME.text.title,
            }}
          >
            Directory
          </h1>
        </div>
      </div>

      {/* ── Filter Cards Column (Spec A1, A2, A3) ── */}
      <div
        className="flex-1 overflow-y-auto requests-scroll-hidden flex flex-col"
        style={{
          padding: '4px 4px 34px 2px',
          paddingBottom: Math.max(34, sheetBottomPadding),
          overscrollBehavior: 'contain',
          gap: '12px',
          maskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)',
        }}
      >
        {/* Section label: Key filters (padding 8px 8px 0) */}
        <div
          style={{
            padding: '8px 8px 0',
            color: DIRECTORY_THEME.text.subtle,
          }}
          className="text-[11px] font-bold uppercase"
        >
          <span style={{ letterSpacing: '0.9px' }}>Key filters</span>
        </div>

        {keyConfigs.map((cfg) => {
          // City depends on Country: hide if no country selected
          if (cfg.id === 'city' && !isCountryActive) {
            return null;
          }

          // Fixed config index for parity / stagger
          const configIndex = FILTER_CONFIGS.findIndex((c) => c.id === cfg.id);

          if (cfg.type === 'text') {
            return (
              <TextFilter
                key={cfg.id}
                config={cfg}
                value={filters[cfg.id as keyof ActiveFilterValues] as string}
                onChange={(val) => onUpdateFilter(cfg.id as keyof ActiveFilterValues, val)}
                onClear={() => onClearFilter(cfg.id as keyof ActiveFilterValues)}
                configIndex={configIndex}
              />
            );
          }

          if (cfg.type === 'multi') {
            const options = getFilterOptionCounts(
              entries,
              cfg.id as keyof ActiveFilterValues,
              filters
            );

            return (
              <SelectFilter
                key={cfg.id}
                config={cfg}
                values={(filters[cfg.id as keyof ActiveFilterValues] as string[]) || []}
                options={options}
                isExpanded={expandedCardId === cfg.id}
                onToggleExpand={() =>
                  setExpandedCardId((prev) => (prev === cfg.id ? null : cfg.id))
                }
                onClose={() => setExpandedCardId(null)}
                onChange={(newVals) =>
                  onUpdateFilter(cfg.id as keyof ActiveFilterValues, newVals)
                }
                onClear={() => onClearFilter(cfg.id as keyof ActiveFilterValues)}
                configIndex={configIndex}
              />
            );
          }

          if (cfg.type === 'number') {
            return (
              <NumericFilter
                key={cfg.id}
                config={cfg}
                value={
                  (filters[cfg.id as keyof ActiveFilterValues] as NumericFilterValue) || {
                    min: null,
                    max: null,
                  }
                }
                isExpanded={expandedCardId === cfg.id}
                onToggleExpand={() =>
                  setExpandedCardId((prev) => (prev === cfg.id ? null : cfg.id))
                }
                onClose={() => setExpandedCardId(null)}
                onChange={(newVal) =>
                  onUpdateFilter(cfg.id as keyof ActiveFilterValues, newVal)
                }
                onClear={() => onClearFilter(cfg.id as keyof ActiveFilterValues)}
                configIndex={configIndex}
              />
            );
          }

          return null;
        })}

        {/* Section label: More filters (padding 16px 8px 0) */}
        <div
          style={{
            padding: '16px 8px 0',
            color: DIRECTORY_THEME.text.subtle,
          }}
          className="text-[11px] font-bold uppercase"
        >
          <span style={{ letterSpacing: '0.9px' }}>More filters</span>
        </div>

        {moreConfigs.map((cfg) => {
          const configIndex = FILTER_CONFIGS.findIndex((c) => c.id === cfg.id);

          if (cfg.type === 'multi') {
            const options = getFilterOptionCounts(
              entries,
              cfg.id as keyof ActiveFilterValues,
              filters
            );

            return (
              <SelectFilter
                key={cfg.id}
                config={cfg}
                values={(filters[cfg.id as keyof ActiveFilterValues] as string[]) || []}
                options={options}
                isExpanded={expandedCardId === cfg.id}
                onToggleExpand={() =>
                  setExpandedCardId((prev) => (prev === cfg.id ? null : cfg.id))
                }
                onClose={() => setExpandedCardId(null)}
                onChange={(newVals) =>
                  onUpdateFilter(cfg.id as keyof ActiveFilterValues, newVals)
                }
                onClear={() => onClearFilter(cfg.id as keyof ActiveFilterValues)}
                configIndex={configIndex}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
