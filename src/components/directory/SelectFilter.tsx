'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { FilterCard, DARK_CARD } from './FilterCard';
import type { MultiSelectFilterConfig } from '@/lib/directory/types';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

// ── How many options before we switch from inline pills → dropdown ──
const INLINE_THRESHOLD = 6;

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

  // If total possible options are small → render inline pills (no dropdown)
  const isInlineMode = options.length > 0 && options.length <= INLINE_THRESHOLD;

  useEffect(() => {
    if (!isInlineMode && isExpanded) {
      cardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, isInlineMode]);

  const effectiveQuery = (!isInlineMode && isExpanded)
    ? searchQuery.trim().toLowerCase()
    : '';
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) toggleOption(filteredOptions[0].value);
    } else if (e.key === 'Backspace' && searchQuery === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  // ══════════════════════════════════════════════════════════════
  // INLINE MODE — show options as a 2-col pill grid, no dropdown
  // ══════════════════════════════════════════════════════════════
  if (isInlineMode) {
    return (
      <div ref={cardContainerRef}>
        <FilterCard
          id={config.id}
          label={config.label}
          tintHex={config.tintHex}
          isActive={isActive}
          isOpen={false}
          isExpandable={false}
          onClear={onClear}
          configIndex={configIndex}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 7,
            }}
          >
            {options.map((opt) => {
              const isSelected = values.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className="flex items-center justify-between transition-all active:scale-95 focus:outline-none"
                  style={{
                    height: 38,
                    borderRadius: 9999,
                    padding: '0 12px',
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.92)'
                      : DARK_CARD.controlBg,
                    border: `1px solid ${
                      isSelected
                        ? 'rgba(255,255,255,0.0)'
                        : DARK_CARD.controlBorder
                    }`,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="text-[13px] font-semibold truncate"
                    style={{
                      color: isSelected ? '#2F3E51' : DARK_CARD.textMuted,
                    }}
                  >
                    {opt.value}
                  </span>
                  <span
                    className="text-[11px] font-medium ml-1.5 shrink-0"
                    style={{
                      color: isSelected
                        ? 'rgba(47,62,81,0.55)'
                        : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {opt.count}
                  </span>
                </button>
              );
            })}
          </div>
        </FilterCard>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // DROPDOWN MODE — pill control row + dark expandable list
  // ══════════════════════════════════════════════════════════════
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
        {/* ── Pill Control Row ── */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(); }
          }}
          className="flex items-center justify-between h-[40px] px-[12px] cursor-pointer transition-all outline-none"
          style={{
            backgroundColor: isExpanded
              ? DARK_CARD.controlBgExpanded
              : isActive
              ? DARK_CARD.controlBgActive
              : DARK_CARD.controlBg,
            borderRadius: 9999,
            border: `1px solid ${
              isActive || isExpanded ? DARK_CARD.controlBorderActive : DARK_CARD.controlBorder
            }`,
          }}
        >
          {/* Summary */}
          <div className="flex items-center gap-1.5 overflow-hidden pr-1 min-w-0">
            {values.length > 0 ? (
              <>
                <span
                  className="inline-flex items-center h-[22px] px-[9px] text-[11.5px] font-semibold truncate max-w-[140px]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: DARK_CARD.textPrimary,
                    borderRadius: 9999,
                    border: `1px solid rgba(255,255,255,0.20)`,
                  }}
                >
                  {values[0]}
                </span>
                {values.length > 1 && (
                  <span
                    className="inline-flex items-center h-[20px] px-2 text-[10.5px] font-bold shrink-0"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.70)',
                      borderRadius: 9999,
                      border: `1px solid rgba(255,255,255,0.14)`,
                    }}
                  >
                    +{values.length - 1}
                  </span>
                )}
              </>
            ) : (
              <span
                className="text-[13px] font-medium"
                style={{ color: DARK_CARD.textMuted }}
              >
                {config.placeholder || 'Select…'}
              </span>
            )}
          </div>

          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: DARK_CARD.iconMuted }}
          />
        </div>

        {/* ── Dark Expanding dropdown ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.35s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div
              style={{
                marginTop: 8,
                borderRadius: 18,
                backgroundColor: 'rgba(0,0,0,0.22)',
                border: `1px solid rgba(255,255,255,0.10)`,
                overflow: 'hidden',
                padding: '8px 8px 6px',
              }}
            >
              {/* Selected pills row */}
              {values.length > 0 && (
                <div
                  className="flex flex-wrap gap-1.5 max-h-[68px] overflow-y-auto requests-scroll-hidden"
                  style={{ marginBottom: 8 }}
                >
                  {values.map((val) => (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 h-[22px] pl-2.5 pr-1.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.20)',
                        color: DARK_CARD.textPrimary,
                        borderRadius: 9999,
                        border: `1px solid rgba(255,255,255,0.18)`,
                      }}
                    >
                      <span className="truncate max-w-[110px]">{val}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(values.filter((v) => v !== val));
                        }}
                        className="w-3 h-3 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}
                      >
                        <X size={8} strokeWidth={3} color="white" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Dark search input */}
              <div
                className="relative flex items-center h-[34px] px-3 mb-1"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.20)',
                  borderRadius: 9999,
                  border: `1px solid rgba(255,255,255,0.10)`,
                }}
              >
                <Search size={12} className="shrink-0 mr-2" style={{ color: DARK_CARD.iconMuted }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to find…"
                  style={{ color: DARK_CARD.textPrimary, caretColor: 'rgba(255,255,255,0.8)' }}
                  className="w-full h-full bg-transparent text-[12.5px] font-medium border-0 outline-none placeholder:text-[rgba(255,255,255,0.35)]"
                />
              </div>

              {/* Dark option list */}
              <div
                className="overflow-y-auto requests-scroll-hidden flex flex-col"
                style={{ maxHeight: 200, padding: '2px 0' }}
              >
                {filteredOptions.length === 0 ? (
                  <div
                    className="py-3 text-center text-[12px]"
                    style={{ color: DARK_CARD.textMuted }}
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
                        className="flex items-center justify-between rounded-[10px] px-2.5 py-[7px] gap-2 cursor-pointer text-[12.5px] transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.14)'
                            : undefined,
                          color: isSelected ? DARK_CARD.textPrimary : 'rgba(255,255,255,0.72)',
                          fontWeight: isSelected ? 600 : 500,
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Dot indicator instead of checkbox */}
                          <div
                            className="w-[7px] h-[7px] rounded-full shrink-0 transition-all"
                            style={{
                              backgroundColor: isSelected
                                ? DARK_CARD.textPrimary
                                : 'rgba(255,255,255,0.20)',
                            }}
                          />
                          <span className="truncate">{opt.value}</span>
                        </div>
                        <span
                          className="text-[11px] shrink-0"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
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
