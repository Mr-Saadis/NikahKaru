'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { RequestItem, FilterState, ExpandedFilter, RequestStatus } from './types';
import { getRequests } from './mock-data';
import { COLUMNS, STAFF_NAMES } from './constants';
import { useDebounce } from '@/lib/hooks/useDebounce';

export function useRequestsBoard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL parsing
  const urlSearch = searchParams.get('search') || '';
  const urlDateFrom = searchParams.get('dateFrom') || '';
  const urlDateTo = searchParams.get('dateTo') || '';
  const urlStaff = searchParams.get('staff') || '';

  const [allItems, setAllItems] = useState<RequestItem[]>([]);
  
  // Local state for immediate UI response
  const [filters, setFilters] = useState<FilterState>({
    search: urlSearch,
    dateFrom: urlDateFrom,
    dateTo: urlDateTo,
    staff: urlStaff,
  });

  const [expandedFilter, setExpandedFilter] = useState<ExpandedFilter>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // 1-second debounce for search input ONLY
  const debouncedSearch = useDebounce(filters.search, 1000);

  // Sync state to URL when debounced search or other filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');

    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    else params.delete('dateFrom');

    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    else params.delete('dateTo');

    if (filters.staff) params.set('staff', filters.staff);
    else params.delete('staff');

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    
    // Only push if there's an actual change to prevent unnecessary routing
    if (newQuery !== currentQuery) {
      router.replace(`${pathname}?${newQuery}`, { scroll: false });
    }
  }, [debouncedSearch, filters.dateFrom, filters.dateTo, filters.staff, pathname, router, searchParams]);

  // Load data once (Simulating Server Fetch)
  useEffect(() => {
    let mounted = true;
    // In a real scenario, we would pass the URL params directly to getRequests
    // to perform Server-Side Filtering and Pagination
    getRequests().then((data) => {
      if (mounted) setAllItems(data);
    });
    return () => { mounted = false; };
  }, []);

  // ── Filtering (Simulating Server-Side Logic locally) ──
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Use URL search instead of local state to ensure it respects the 1s debounce
      if (urlSearch) {
        const q = urlSearch.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.cnic.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (urlDateFrom && item.date < urlDateFrom) return false;
      if (urlDateTo && item.date > urlDateTo) return false;
      if (urlStaff && item.staff !== urlStaff) return false;
      return true;
    });
  }, [allItems, urlSearch, urlDateFrom, urlDateTo, urlStaff]);

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
