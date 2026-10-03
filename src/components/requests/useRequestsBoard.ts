'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { RequestItem, FilterState, ExpandedFilter, RequestStatus } from './types';
import { getRequests } from './mock-data';
import { COLUMNS, STAFF_NAMES } from './constants';

// ============================================================
// useRequestsBoard — All board state & logic in one hook
// ============================================================

export function useRequestsBoard() {
  const [allItems, setAllItems] = useState<RequestItem[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateFrom: '',
    dateTo: '',
    staff: '',
  });
  const [expandedFilter, setExpandedFilter] = useState<ExpandedFilter>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Load data once
  useEffect(() => {
    let mounted = true;
    getRequests().then((data) => {
      if (mounted) setAllItems(data);
    });
    return () => { mounted = false; };
  }, []);

  // ── Filtering ─────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.cnic.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Date range (inclusive, either bound optional)
      if (filters.dateFrom && item.date < filters.dateFrom) return false;
      if (filters.dateTo && item.date > filters.dateTo) return false;
      // Staff exact match
      if (filters.staff && item.staff !== filters.staff) return false;
      return true;
    });
  }, [allItems, filters]);

  // ── Column data ───────────────────────────────────────────
  const columnCards = useMemo(() => {
    const map = new Map<RequestStatus, RequestItem[]>();
    for (const col of COLUMNS) {
      map.set(col.key, []);
    }
    for (const item of filteredItems) {
      if (!item.later) {
        map.get(item.status)?.push(item);
      }
    }
    return map;
  }, [filteredItems]);

  const laterCards = useMemo(() => {
    return filteredItems.filter((i) => i.later);
  }, [filteredItems]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const later = laterCards.length;
    const staffSet = new Set<string>();
    for (const item of filteredItems) {
      staffSet.add(item.staff);
    }
    return { total, later, staffInvolved: staffSet.size };
  }, [filteredItems, laterCards]);

  // ── Active filters (for indicator dots) ───────────────────
  const activeFilters = useMemo(() => ({
    search: filters.search.length > 0,
    date: filters.dateFrom.length > 0 || filters.dateTo.length > 0,
    staff: filters.staff.length > 0,
  }), [filters]);

  // ── Actions ───────────────────────────────────────────────
  const sendToLater = useCallback((id: string) => {
    setAllItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, later: true } : item))
    );
  }, []);

  const returnFromLater = useCallback((id: string) => {
    setAllItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, later: false } : item))
    );
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: '', dateFrom: '', dateTo: '', staff: '' });
    setExpandedFilter(null);
  }, []);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleFilter = useCallback((filter: ExpandedFilter) => {
    setExpandedFilter((prev) => (prev === filter ? null : filter));
  }, []);

  const closeFilter = useCallback(() => {
    setExpandedFilter(null);
  }, []);

  return {
    // Data
    filteredItems,
    columnCards,
    laterCards,
    stats,
    activeFilters,

    // Filter state
    filters,
    expandedFilter,
    updateFilter,
    toggleFilter,
    closeFilter,
    resetFilters,

    // DnD
    draggedId,
    setDraggedId,
    sendToLater,
    returnFromLater,

    // Staff list (for filter dropdown)
    staffNames: STAFF_NAMES,
  };
}
