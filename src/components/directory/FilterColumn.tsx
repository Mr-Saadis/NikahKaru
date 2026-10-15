'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type {
  ActiveFilterValues,
  DirectoryEntry,
  NumericFilterValue,
} from '@/lib/directory/types';
import { FILTER_CONFIGS } from '@/lib/directory/config';
import {
  getFilterOptionCounts,
  isFilterActive,
  countActiveFilters,
} from '@/lib/directory/filters';
import { useReferenceData } from '@/lib/hooks/useReferenceData';
import { TextFilter } from './TextFilter';
import { SelectFilter } from './SelectFilter';
import { NumericFilter } from './NumericFilter';

// Brand card colour — Deep Slate Navy
const CARD_BG = '#2F3E51';
const CARD_RADIUS = 28;

// Useful keyword aliases for natural search in English & Roman Urdu
const FILTER_ALIASES: Record<string, string[]> = {
  search: ['name', 'phone', 'cnic', 'contact', 'number', 'mobile'],
  age: ['dob', 'date of birth', 'years', 'old', 'umer'],
  gender: ['sex', 'male', 'female', 'jins'],
  maritalStatus: ['marriage', 'single', 'divorced', 'widowed', 'shaadi'],
  profession: ['job', 'work', 'career', 'occupation', 'title', 'company', 'pesha'],
  caste: ['zaat', 'biradari', 'clan', 'qaum'],
  country: ['mulk', 'location', 'nation'],
  city: ['shehr', 'town', 'distt'],
  degree: ['education', 'qualification', 'study', 'bachelor', 'master', 'taleem'],
  height: ['tall', 'short', 'qad', 'ft', 'inches'],
  income: ['salary', 'earnings', 'pkr', 'money', 'tankhwah', 'aamdani'],
  sect: ['maslak', 'sunni', 'shia', 'firqa', 'deobandi', 'barelvi', 'ahle hadees'],
  prayer: ['namaz', 'salah', 'religious', 'practice'],
  motherTongue: ['language', 'zaban', 'urdu', 'punjabi', 'pashto', 'sindhi'],
  complexion: ['skin', 'color', 'rangat', 'fair', 'wheatish'],
  institute: ['university', 'college', 'school', 'idara'],
  employer: ['company', 'organization', 'office', 'firm'],
  permanentCity: ['home town', 'native city', 'permanent', 'mustaqil shehr'],
  familyType: ['joint', 'nuclear', 'family setup', 'khandan'],
  fatherProfession: ['father job', 'father occupation', 'walid'],
  beardHijab: ['beard', 'hijab', 'darhi', 'parda', 'niqab', 'sunnah'],
  smoking: ['smoke', 'cigarette', 'tobacco', 'noshi'],
  dislikedCaste: ['caste exclusion', 'not allowed caste'],
  dislikedSect: ['sect exclusion'],
  dislikedCity: ['city exclusion'],
};

type FilterCategoryTab = 'all' | 'active' | 'key' | 'more';

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
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<FilterCategoryTab>('all');
  const referenceData = useReferenceData();

  const isCountryActive = filters.country.length > 0;
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Clean normalized search query
  const normalizedQuery = filterSearchQuery.trim().toLowerCase();

  // Helper to check if a filter config matches the search query
  const matchesSearch = (cfg: (typeof FILTER_CONFIGS)[number]) => {
    if (!normalizedQuery) return true;
    if (cfg.label.toLowerCase().includes(normalizedQuery)) return true;
    if (cfg.id.toLowerCase().includes(normalizedQuery)) return true;
    const aliases = FILTER_ALIASES[cfg.id];
    if (aliases && aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery))) {
      return true;
    }
    return false;
  };

  // Helper to check if a filter passes the category tab
  const matchesCategory = (cfg: (typeof FILTER_CONFIGS)[number]) => {
    if (activeCategoryTab === 'all') return true;
    if (activeCategoryTab === 'key') return cfg.section === 'key';
    if (activeCategoryTab === 'more') return cfg.section === 'more';
    if (activeCategoryTab === 'active') {
      return isFilterActive(cfg.id as keyof ActiveFilterValues, filters);
    }
    return true;
  };

  // Key configs matching both search and category
  const filteredKeyConfigs = useMemo(() => {
    return FILTER_CONFIGS.filter(
      (cfg) => cfg.section === 'key' && matchesCategory(cfg) && matchesSearch(cfg)
    );
  }, [activeCategoryTab, normalizedQuery, filters]);

  // More configs matching both search and category
  const filteredMoreConfigs = useMemo(() => {
    return FILTER_CONFIGS.filter(
      (cfg) => cfg.section === 'more' && matchesCategory(cfg) && matchesSearch(cfg)
    );
  }, [activeCategoryTab, normalizedQuery, filters]);

  // Total matching count
  const totalMatchingFilters = filteredKeyConfigs.length + filteredMoreConfigs.length;

  const renderFilter = (cfg: (typeof FILTER_CONFIGS)[number], index: number, isLast: boolean) => {
    const configIndex = FILTER_CONFIGS.findIndex((c) => c.id === cfg.id);

    if (cfg.id === 'city' && !isCountryActive) {
      if (normalizedQuery.length > 0) {
        return (
          <div
            key={cfg.id}
            className="px-3.5 py-3 mx-3 my-1 rounded-2xl border text-[11.5px] leading-relaxed select-none"
            style={{
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            <span className="font-semibold text-white/90">City filter:</span> Select a{' '}
            <span className="font-semibold text-[#F5C770]">Country</span> first to filter cities.
          </div>
        );
      }
      return null;
    }

    const showDivider = !isLast;

    if (cfg.type === 'text') {
      return (
        <div key={cfg.id}>
          <TextFilter
            config={cfg}
            value={filters[cfg.id as keyof ActiveFilterValues] as string}
            onChange={(val) => onUpdateFilter(cfg.id as keyof ActiveFilterValues, val)}
            onClear={() => onClearFilter(cfg.id as keyof ActiveFilterValues)}
            configIndex={configIndex}
          />
          {showDivider && <Divider />}
        </div>
      );
    }

    if (cfg.type === 'multi') {
      const options = getFilterOptionCounts(
        entries,
        cfg.id as keyof ActiveFilterValues,
        filters,
        referenceData
      );
      return (
        <div key={cfg.id}>
          <SelectFilter
            config={cfg}
            values={(filters[cfg.id as keyof ActiveFilterValues] as string[]) || []}
            options={options}
            isExpanded={expandedCardId === cfg.id}
            onToggleExpand={() =>
              setExpandedCardId((prev) => (prev === cfg.id ? null : cfg.id))
            }
            onClose={() => setExpandedCardId(null)}
            onChange={(newVals) => onUpdateFilter(cfg.id as keyof ActiveFilterValues, newVals)}
            onClear={() => onClearFilter(cfg.id as keyof ActiveFilterValues)}
            configIndex={configIndex}
          />
          {showDivider && <Divider />}
        </div>
      );
    }

    if (cfg.type === 'number') {
      return (
        <div key={cfg.id}>
          <NumericFilter
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
            onChange={(newVal) => onUpdateFilter(cfg.id as keyof ActiveFilterValues, newVal)}
            onClear={() => onClearFilter(cfg.id as keyof ActiveFilterValues)}
            configIndex={configIndex}
          />
          {showDivider && <Divider />}
        </div>
      );
    }

    return null;
  };

  // Category tabs list
  const categoryTabs = useMemo(() => {
    const list: { id: FilterCategoryTab; label: string; count?: number }[] = [
      { id: 'all', label: 'All' },
      { id: 'key', label: 'Key' },
      { id: 'more', label: 'More' },
    ];
    if (activeCount > 0 || activeCategoryTab === 'active') {
      list.push({ id: 'active', label: 'Active', count: activeCount });
    }
    return list;
  }, [activeCount, activeCategoryTab]);

  return (
    // ── Outer wrapper: fixed width, full height, flex column ──
    <div
      className="w-full min-[900px]:w-[320px] shrink-0 h-full"
      style={{
        backgroundColor: CARD_BG,
        borderRadius: CARD_RADIUS,
        boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Pinned Section: Search & Category Filter for Filters ── */}
      <div
        className="shrink-0 flex flex-col gap-2.5"
        style={{
          padding: '14px 14px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: CARD_BG,
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[1.2px] text-white/80">
              Filters
            </span>
          </div>
          {activeCount > 0 && (
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(245, 199, 112, 0.16)',
                color: '#F5C770',
                border: '1px solid rgba(245, 199, 112, 0.30)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C770]" />
              {activeCount} active
            </span>
          )}
        </div>

        {/* Search Input for filtering the filters */}
        <div
          className="relative flex items-center h-[40px] px-[12px] transition-all focus-within:border-white/20 focus-within:bg-[rgba(0,0,0,0.38)]"
          style={{
            backgroundColor: 'rgba(0,0,0,0.28)',
            borderRadius: 9999,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search size={14} className="shrink-0 mr-2.5 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={filterSearchQuery}
            onChange={(e) => setFilterSearchQuery(e.target.value)}
            placeholder="Search filters (e.g. age, caste)..."
            className="w-full h-full bg-transparent text-[13px] font-medium text-white placeholder:text-white/40 border-0 outline-none"
            style={{ caretColor: 'rgba(255,255,255,0.9)' }}
          />
          {filterSearchQuery && (
            <button
              type="button"
              onClick={() => setFilterSearchQuery('')}
              className="w-5 h-5 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0 transition-colors ml-1.5"
              title="Clear search"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Segmented Control Track: All | Key | More | Active */}
        <div
          className="flex items-center p-[3px] rounded-full transition-all"
          style={{
            backgroundColor: 'rgba(0,0,0,0.28)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9999,
          }}
        >
          {categoryTabs.map((tab) => {
            const isSelected = activeCategoryTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryTab(tab.id)}
                className="flex-1 h-[34px] rounded-full text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 select-none relative"
                style={{
                  borderRadius: 9999,
                  backgroundColor: isSelected
                    ? 'rgba(255, 255, 255, 0.16)'
                    : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)',
                  boxShadow: isSelected
                    ? '0 1px 3px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.12)'
                    : 'none',
                }}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected
                      ? 'bg-[#F5C770]/30 text-[#F5C770]'
                      : 'bg-white/10 text-white/60'
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Inner scroll area (scroll happens INSIDE the rounded card) ── */}
      <div
        className="flex-1 overflow-y-auto requests-scroll-hidden"
        style={{
          padding: '4px 0',
          paddingBottom: Math.max(24, sheetBottomPadding),
          overscrollBehavior: 'contain',
          maskImage: 'linear-gradient(to bottom, black calc(100% - 36px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black calc(100% - 36px), transparent 100%)',
        }}
      >
        {totalMatchingFilters === 0 ? (
          <div className="py-12 px-5 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Search size={18} className="text-white/30" />
            </div>
            <p className="text-[13px] font-semibold text-white/80 mb-1">
              No filters found
            </p>
            <p className="text-[11.5px] text-white/40 max-w-[210px] mb-4 leading-relaxed">
              {normalizedQuery
                ? `No filter matches "${filterSearchQuery}"`
                : 'No active filters to show'}
            </p>
            {(normalizedQuery || activeCategoryTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterSearchQuery('');
                  setActiveCategoryTab('all');
                }}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Reset filter view
              </button>
            )}
          </div>
        ) : (
          <>
            {/* KEY FILTERS section */}
            {filteredKeyConfigs.length > 0 && (
              <>
                <SectionLabel>
                  Key Filters {normalizedQuery ? `(${filteredKeyConfigs.length})` : ''}
                </SectionLabel>
                {filteredKeyConfigs.map((cfg, idx) =>
                  renderFilter(cfg, idx, idx === filteredKeyConfigs.length - 1 && filteredMoreConfigs.length === 0)
                )}
              </>
            )}

            {/* MORE FILTERS section */}
            {filteredMoreConfigs.length > 0 && (
              <>
                <SectionLabel style={{ marginTop: filteredKeyConfigs.length > 0 ? 8 : 0 }}>
                  More Filters {normalizedQuery ? `(${filteredMoreConfigs.length})` : ''}
                </SectionLabel>
                {filteredMoreConfigs.map((cfg, idx) =>
                  renderFilter(cfg, idx, idx === filteredMoreConfigs.length - 1)
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ padding: '10px 18px 6px', ...style }}>
      <span
        className="text-[10px] font-bold uppercase"
        style={{ letterSpacing: '1px', color: 'rgba(255,255,255,0.45)' }}
      >
        {children}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: 'rgba(255,255,255,0.10)',
        margin: '0 14px',
      }}
    />
  );
}
