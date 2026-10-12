'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { FilterCard } from './FilterCard';
import type { MultiSelectFilterConfig } from '@/lib/directory/types';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

interface SelectFilterProps {
  config: MultiSelectFilterConfig;
  values: string[];
  options: { value: string; count: number }[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onChange: (newValues: string[]) => void;
  onClear: () => void;
  configIndex: number;
}

export function SelectFilter({
  config,
  values,
  options,
  isExpanded,
  onToggleExpand,
  onClose,
  onChange,
  onClear,
  configIndex,
}: SelectFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const isActive = values.length > 0;
  const isWhiteTint = config.tintHex.toUpperCase() === DIRECTORY_THEME.surfaces.white;

  // Control row background from theme
  const controlBg = isWhiteTint
    ? DIRECTORY_THEME.surfaces.controlBgWhiteCard
    : DIRECTORY_THEME.surfaces.controlBg;

  // Auto-focus search input with preventScroll and smooth scrollIntoView
  useEffect(() => {
    if (isExpanded) {
      cardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Filtered options based on search query
  const effectiveQuery = isExpanded ? searchQuery.trim().toLowerCase() : '';
  const filteredOptions = useMemo(() => {
    if (!effectiveQuery) return options;
    return options.filter((opt) => opt.value.toLowerCase().includes(effectiveQuery));
  }, [options, effectiveQuery]);

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== val));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        toggleOption(filteredOptions[0].value);
      }
    } else if (e.key === 'Backspace' && searchQuery === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div ref={cardContainerRef}>
      <FilterCard
        id={config.id}
        label={config.label}
        tintHex={config.tintHex}
        isActive={isActive}
        isOpen={isExpanded}
        isExpandable={true}
        onClear={onClear}
        onHeaderClick={onToggleExpand}
        configIndex={configIndex}
      >
        {/* Control Row: height 38px, radius 14px, padding 0 10px, mt 8px */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand();
            }
          }}
          className="flex items-center justify-between h-[38px] px-[10px] rounded-[14px] mt-2 cursor-pointer transition-all outline-none hover:bg-white focus:bg-white"
          style={{
            backgroundColor: isExpanded || isActive ? DIRECTORY_THEME.surfaces.white : controlBg,
            boxShadow: isExpanded
              ? `inset 0 0 0 2px ${DIRECTORY_THEME.brand.primary}`
              : isActive
              ? `inset 0 0 0 1.5px ${DIRECTORY_THEME.brand.primary}`
              : undefined,
          }}
        >
          {/* Summary items */}
          <div className="flex items-center gap-1.5 overflow-hidden pr-1">
            {values.length > 0 ? (
              <>
                {/* First pill: brand primary, white text, 11.5px, weight 600, padding 3px 10px, max-width 130px */}
                <span
                  className="inline-flex items-center h-[24px] px-[10px] rounded-full text-[11.5px] font-semibold truncate max-w-[130px]"
                  style={{
                    backgroundColor: DIRECTORY_THEME.brand.primary,
                    color: DIRECTORY_THEME.brand.text,
                  }}
                >
                  {values[0]}
                </span>

                {/* Amber-accent +N pill */}
                {values.length > 1 && (
                  <span
                    className="inline-flex items-center h-[22px] px-2 rounded-full text-[10.5px] font-bold shrink-0"
                    style={{
                      backgroundColor: DIRECTORY_THEME.amber.bg,
                      color: DIRECTORY_THEME.amber.text,
                      border: `1px solid ${DIRECTORY_THEME.amber.border}`,
                    }}
                  >
                    +{values.length - 1}
                  </span>
                )}
              </>
            ) : (
              <span
                className="text-[13px] font-medium"
                style={{ color: DIRECTORY_THEME.text.subtle }}
              >
                {config.placeholder || 'Select…'}
              </span>
            )}
          </div>

          {/* Chevron (13px) */}
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            style={{ color: DIRECTORY_THEME.text.muted }}
          />
        </div>

        {/* ── EXPANDING CONTAINER (Strict 3-tier leak-free structure) ── */}
        {/* Tier 1: Grid wrapper with 0fr -> 1fr animation */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.4s cubic-bezier(.22,1,.36,1)',
          }}
        >
          {/* Tier 2: Clip wrapper (overflow:hidden; min-height:0; NO vertical padding/margin) */}
          <div
            style={{
              overflow: 'hidden',
              minHeight: 0,
              margin: '0 -8px',
              padding: '0 8px',
            }}
          >
            {/* Tier 3: Inner wrapper with exact padding-top 10px, padding-bottom 5px */}
            <div style={{ paddingTop: '10px', paddingBottom: '5px' }}>
              {/* Selected pills row if expanded */}
              {values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-[78px] overflow-y-auto requests-scroll-hidden">
                  {values.map((val) => (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1.5 h-[24px] pl-2.5 pr-1.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: DIRECTORY_THEME.brand.primary,
                        color: DIRECTORY_THEME.brand.text,
                      }}
                    >
                      <span className="truncate max-w-[130px]">{val}</span>
                      <button
                        type="button"
                        onClick={(e) => removeValue(val, e)}
                        className="w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Type-to-find input: height 36px, radius 12px, white 85%, 14px search icon */}
              <div
                className="relative flex items-center h-[36px] rounded-[12px] bg-white px-2.5 transition-all"
                style={{
                  boxShadow: `inset 0 0 0 1px ${DIRECTORY_THEME.borders.main}`,
                }}
              >
                <Search
                  size={14}
                  className="shrink-0 mr-2 pointer-events-none"
                  style={{ color: DIRECTORY_THEME.text.subtle }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to find…"
                  style={{ color: DIRECTORY_THEME.text.body }}
                  className={`w-full h-full bg-transparent text-[13px] font-medium border-0 outline-none ${DIRECTORY_THEME.classes.placeholderSubtle}`}
                />
              </div>

              {/* Option list: max-height 226px, margin 8px -6px 0, padding 0 4px 2px */}
              <div
                className="overflow-y-auto requests-scroll-hidden flex flex-col gap-1"
                style={{
                  maxHeight: '226px',
                  margin: '8px -6px 0',
                  padding: '0 4px 2px',
                }}
              >
                {filteredOptions.length === 0 ? (
                  <div
                    className="py-4 text-center text-[12.5px]"
                    style={{ color: DIRECTORY_THEME.text.subtle }}
                  >
                    No match found
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = values.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleOption(opt.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleOption(opt.value);
                          }
                        }}
                        style={{
                          backgroundColor: isSelected ? DIRECTORY_THEME.brand.selectedHighlight : undefined,
                          color: isSelected ? DIRECTORY_THEME.brand.primary : DIRECTORY_THEME.text.body,
                        }}
                        className={`flex items-center justify-between rounded-[12px] p-[8px_10px] gap-[10px] cursor-pointer text-[13px] font-medium transition-colors ${
                          isSelected ? 'font-semibold' : 'hover:bg-white/75'
                        }`}
                      >
                        <div className="flex items-center gap-[10px] min-w-0 pr-1">
                          {/* Checkbox: 20px, radius 7px, 1.6px border */}
                          <div
                            className="w-[20px] h-[20px] rounded-[7px] border-[1.6px] flex items-center justify-center shrink-0 transition-all"
                            style={{
                              backgroundColor: isSelected ? DIRECTORY_THEME.brand.primary : DIRECTORY_THEME.surfaces.white,
                              borderColor: isSelected ? DIRECTORY_THEME.brand.primary : DIRECTORY_THEME.borders.main,
                              color: DIRECTORY_THEME.brand.text,
                            }}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className="truncate">{opt.value}</span>
                        </div>

                        {/* Entry count: 11px muted */}
                        <span
                          className="text-[11px] font-medium shrink-0"
                          style={{ color: DIRECTORY_THEME.text.subtle }}
                        >
                          {opt.count}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </FilterCard>
    </div>
  );
}
