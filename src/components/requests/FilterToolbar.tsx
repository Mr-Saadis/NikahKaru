'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { FilterState, ExpandedFilter } from './types';
import {
  SearchIcon,
  CalendarIcon,
  UsersIcon,
  ResetIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from './icons';

// ============================================================
// FilterToolbar — Expandable filter pills + scroll buttons
// ============================================================

interface FilterToolbarProps {
  filters: FilterState;
  expandedFilter: ExpandedFilter;
  activeFilters: { search: boolean; date: boolean; staff: boolean };
  staffNames: string[];
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleFilter: (filter: ExpandedFilter) => void;
  onCloseFilter: () => void;
  onReset: () => void;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
}

/** Active-filter indicator using Terracotta Clay */
function ActiveDot() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 6,
        right: 6,
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: '#C86A4A', // Terracotta Clay
        border: '2px solid #fff',
        zIndex: 2,
      }}
    />
  );
}

export default function FilterToolbar({
  filters,
  expandedFilter,
  activeFilters,
  staffNames,
  onUpdateFilter,
  onToggleFilter,
  onCloseFilter,
  onReset,
  scrollerRef,
}: FilterToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!expandedFilter) return;
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onCloseFilter();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expandedFilter, onCloseFilter]);

  // Close on Escape
  useEffect(() => {
    if (!expandedFilter) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseFilter();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [expandedFilter, onCloseFilter]);

  // Autofocus search input ~180ms after opening
  useEffect(() => {
    if (expandedFilter === 'search') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [expandedFilter]);

  const scrollBoard = useCallback(
    (dir: number) => {
      scrollerRef.current?.scrollBy({ left: dir * 520, behavior: 'smooth' });
    },
    [scrollerRef],
  );

  const pillBase: React.CSSProperties = {
    height: 40,
    borderRadius: 9999,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)',
    overflow: 'hidden',
    transition: 'width .35s cubic-bezier(.4,0,.2,1), box-shadow .25s',
  };

  const iconBtnBase: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    position: 'relative',
    color: '#1F3B34', // Pine Grove
  };

  const inputBase: React.CSSProperties = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 12,
    color: '#1F3B34',
    fontWeight: 500,
  };

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateFilter('search', e.target.value);
    },
    [onUpdateFilter],
  );

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateFilter('dateFrom', e.target.value);
    },
    [onUpdateFilter],
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateFilter('dateTo', e.target.value);
    },
    [onUpdateFilter],
  );

  const handleStaffChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateFilter('staff', e.target.value);
    },
    [onUpdateFilter],
  );

  return (
    <div ref={toolbarRef} className="flex items-center gap-[8px]">
      {/* ── SEARCH ────────────────────────────────── */}
      <div
        style={{
          ...pillBase,
          width: expandedFilter === 'search' ? 220 : 40,
          boxShadow:
            expandedFilter === 'search'
              ? '0 0 0 2px #1F3B34, 0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)'
              : pillBase.boxShadow,
        }}
      >
        <button
          type="button"
          aria-label="Search requests"
          aria-expanded={expandedFilter === 'search'}
          style={iconBtnBase}
          onClick={() => onToggleFilter('search')}
        >
          <SearchIcon size={18} />
          {activeFilters.search && <ActiveDot />}
        </button>
        {expandedFilter === 'search' && (
          <input
            ref={searchInputRef}
            type="text"
            placeholder="CNIC, name or phone"
            value={filters.search}
            onChange={handleSearchChange}
            style={{
              ...inputBase,
              flex: 1,
              paddingRight: 12,
              opacity: expandedFilter === 'search' ? 1 : 0,
              transition: 'opacity .25s',
            }}
          />
        )}
      </div>

      {/* ── DATE RANGE ────────────────────────────── */}
      <div
        style={{
          ...pillBase,
          width: expandedFilter === 'date' ? 330 : 40,
          boxShadow:
            expandedFilter === 'date'
              ? '0 0 0 2px #1F3B34, 0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)'
              : pillBase.boxShadow,
        }}
      >
        <button
          type="button"
          aria-label="Filter by date range"
          aria-expanded={expandedFilter === 'date'}
          style={iconBtnBase}
          onClick={() => onToggleFilter('date')}
        >
          <CalendarIcon size={18} />
          {activeFilters.date && <ActiveDot />}
        </button>
        {expandedFilter === 'date' && (
          <div
            className="flex items-center gap-[6px] pr-[10px]"
            style={{
              opacity: 1,
              transition: 'opacity .25s',
            }}
          >
            <span style={{ fontSize: 11, color: '#A3B18A', fontWeight: 500, whiteSpace: 'nowrap' }}>
              From
            </span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={handleDateFromChange}
              style={{
                ...inputBase,
                width: 118,
                background: '#F2EDE1', // Cannoli Cream
                borderRadius: 9999,
                padding: '6px 10px',
              }}
            />
            <span style={{ fontSize: 11, color: '#A3B18A', fontWeight: 500, whiteSpace: 'nowrap' }}>
              To
            </span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={handleDateToChange}
              style={{
                ...inputBase,
                width: 118,
                background: '#F2EDE1', // Cannoli Cream
                borderRadius: 9999,
                padding: '6px 10px',
              }}
            />
          </div>
        )}
      </div>

      {/* ── STAFF ─────────────────────────────────── */}
      <div
        style={{
          ...pillBase,
          width: expandedFilter === 'staff' ? 180 : 40,
          boxShadow:
            expandedFilter === 'staff'
              ? '0 0 0 2px #1F3B34, 0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)'
              : pillBase.boxShadow,
        }}
      >
        <button
          type="button"
          aria-label="Filter by staff"
          aria-expanded={expandedFilter === 'staff'}
          style={iconBtnBase}
          onClick={() => onToggleFilter('staff')}
        >
          <UsersIcon size={18} />
          {activeFilters.staff && <ActiveDot />}
        </button>
        {expandedFilter === 'staff' && (
          <select
            className="requests-filter-select"
            value={filters.staff}
            onChange={handleStaffChange}
            style={{
              ...inputBase,
              flex: 1,
              paddingRight: 12,
              cursor: 'pointer',
              appearance: 'none' as const,
              backgroundImage: 'none',
            }}
          >
            <option value="">All staff</option>
            {staffNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── RESET ─────────────────────────────────── */}
      <button
        type="button"
        aria-label="Reset all filters"
        onClick={onReset}
        style={{
          ...iconBtnBase,
          background: '#1F3B34', // Pine Grove
          color: '#fff',
        }}
      >
        <ResetIcon size={18} />
      </button>

      {/* ── SEPARATOR ────────────────────────────── */}
      <div style={{ width: 1, height: 22, background: '#d3d2ca', flexShrink: 0 }} />

      {/* ── SCROLL BUTTONS ────────────────────────── */}
      <button
        type="button"
        aria-label="Scroll board left"
        onClick={() => scrollBoard(-1)}
        style={{
          ...iconBtnBase,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)',
        }}
      >
        <ArrowLeftIcon size={18} />
      </button>
      <button
        type="button"
        aria-label="Scroll board right"
        onClick={() => scrollBoard(1)}
        style={{
          ...iconBtnBase,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)',
        }}
      >
        <ArrowRightIcon size={18} />
      </button>
    </div>
  );
}
