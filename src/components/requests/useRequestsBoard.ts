'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { RequestItem, FilterState, ExpandedFilter, RequestStatus, ColumnDef } from './types';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface UseRequestsBoardProps {
  columns: ColumnDef[];
  fetchRequests: (filters: FilterState) => Promise<RequestItem[]>;
  fetchNames: () => Promise<string[]>;
}

export function useRequestsBoard({ columns, fetchRequests, fetchNames }: UseRequestsBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL parsing
  const urlSearch = searchParams.get('search') || '';
  const urlDateFrom = searchParams.get('dateFrom') || '';
  const urlDateTo = searchParams.get('dateTo') || '';
  const urlStaff = searchParams.get('staff') || '';
  const urlRequestId = searchParams.get('requestId') || searchParams.get('selectedId');
  const urlProfileId = searchParams.get('profileId');

  const autoOpenedRef = useRef<string | null>(null);

  const [allItems, setAllItems] = useState<RequestItem[]>([]);
  const [realAgentNames, setRealAgentNames] = useState<string[]>([]);
  
  // Local state for immediate UI response
  const [filters, setFilters] = useState<FilterState>({
    search: urlSearch,
    dateFrom: urlDateFrom,
    dateTo: urlDateTo,
    staff: urlStaff,
  });

  const [expandedFilter, setExpandedFilter] = useState<ExpandedFilter>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load agent names for filter dropdown (Once)
  useEffect(() => {
    let mounted = true;
    fetchNames().then((names) => {
      if (mounted) setRealAgentNames(names);
    }).catch(console.error);
    return () => { mounted = false; };
  }, [fetchNames]);

  // 1-second debounce for search input ONLY
  const debouncedSearch = useDebounce(filters.search, 1000);

  // Sync state to URL when debounced search or other filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.staff) params.set('staff', filters.staff);

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    
    // Only push if there's an actual change to prevent unnecessary routing
    if (newQuery !== currentQuery) {
      router.replace(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false });
    }
  }, [debouncedSearch, filters.dateFrom, filters.dateTo, filters.staff, pathname, router, searchParams]);

  // Load data via API (Option B style - single fetch)
  useEffect(() => {
    let mounted = true;
    
    const activeUrlFilters = {
      search: urlSearch,
      dateFrom: urlDateFrom,
      dateTo: urlDateTo,
      staff: urlStaff,
    };

    fetch('/api/requests')
      .then(res => res.json())
      .then((data: any[]) => {
        if (mounted) {
          // Process raw view data into RequestItem array
          let processedData: RequestItem[] = (data || []).map(item => ({
            id: item.board_id,
            name: item.full_name || 'Unknown',
            cnic: item.cnic || '00000-0000000-0',
            phone: item.primary_phone || 'N/A', // Adjust according to schema or keep N/A
            staff: item.current_agent_name || item.created_by_name || 'System',
            date: item.request_date,
            status: item.request_status,
            later: item.later,
            isRead: item.is_read,
            profileData: item // Attach full row for details sheet
          }));

          // Apply local filtering
          if (activeUrlFilters.search) {
            const q = activeUrlFilters.search.toLowerCase();
            processedData = processedData.filter(item => 
              item.name.toLowerCase().includes(q) || 
              item.cnic.toLowerCase().includes(q)
            );
          }
          if (activeUrlFilters.dateFrom) {
            processedData = processedData.filter(item => item.date >= activeUrlFilters.dateFrom!);
          }
          if (activeUrlFilters.dateTo) {
            processedData = processedData.filter(item => item.date <= activeUrlFilters.dateTo!);
          }
          if (activeUrlFilters.staff) {
            processedData = processedData.filter(item => item.staff === activeUrlFilters.staff);
          }

          // Apply locally stored read requests and respond later requests
          try {
            const storedRead = localStorage.getItem('agent_read_requests');
            const storedLater = localStorage.getItem('respond_later_requests');
            
            const readIds = new Set(storedRead ? JSON.parse(storedRead) : []);
            const laterIds = new Set(storedLater ? JSON.parse(storedLater) : []);
            
            processedData = processedData.map(item => ({
              ...item,
              isRead: readIds.has(item.id) ? true : item.isRead,
              later: laterIds.has(item.id) ? true : item.later
            }));
          } catch (e) {
            console.error('Failed to parse local storage states', e);
          }

          setAllItems(processedData);

          // Check if target request/profile should be opened
          let targetReqId: string | null = null;
          let targetProfId: string | null = null;

          if (typeof window !== 'undefined') {
            targetReqId = sessionStorage.getItem('target_open_request_id');
            targetProfId = sessionStorage.getItem('target_open_profile_id');
            sessionStorage.removeItem('target_open_request_id');
            sessionStorage.removeItem('target_open_profile_id');

            // If URL had query params, cleanly remove them so browser address bar stays http://localhost:3000/requests
            const paramReq = searchParams.get('requestId') || searchParams.get('selectedId');
            const paramProf = searchParams.get('profileId');
            if (paramReq || paramProf) {
              targetReqId = targetReqId || paramReq;
              targetProfId = targetProfId || paramProf;
              window.history.replaceState({}, '', pathname);
            }
          }

          if (targetReqId || targetProfId) {
            const match = processedData.find(item =>
              (targetReqId && (item.id === targetReqId || item.profileData?.request_id === targetReqId)) ||
              (targetProfId && (item.id === targetProfId || item.profileData?.profile_id === targetProfId || item.profileData?.source_profile_id === targetProfId))
            );
            if (match) {
              setSelectedId(match.id);
            }
          }
        }
      })
      .catch(console.error);

    return () => { mounted = false; };
  }, [urlSearch, urlDateFrom, urlDateTo, urlStaff]);

  // Listen for open_target_request event (e.g. from NotificationDropdown when already on /requests page)
  useEffect(() => {
    const handleOpenTarget = (e: Event) => {
      const customEvent = e as CustomEvent<{ requestId?: string; profileId?: string }>;
      const reqId = customEvent.detail?.requestId;
      const profId = customEvent.detail?.profileId;

      if (!reqId && !profId) return;

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('target_open_request_id');
        sessionStorage.removeItem('target_open_profile_id');
      }

      const findMatch = (items: RequestItem[]) =>
        items.find(
          item =>
            (reqId && (item.id === reqId || item.profileData?.request_id === reqId)) ||
            (profId && (item.id === profId || item.profileData?.profile_id === profId || item.profileData?.source_profile_id === profId))
        );

      const match = findMatch(allItems);
      if (match) {
        setSelectedId(match.id);
      } else {
        // If not found in current items (e.g. active filters or new data), reset filters and fetch fresh data
        setFilters({ search: '', dateFrom: '', dateTo: '', staff: '' });
        fetch('/api/requests')
          .then(res => res.json())
          .then((data: any[]) => {
            const processedData: RequestItem[] = (data || []).map(item => ({
              id: item.board_id,
              name: item.full_name || 'Unknown',
              cnic: item.cnic || '00000-0000000-0',
              phone: item.primary_phone || 'N/A',
              staff: item.current_agent_name || item.created_by_name || 'System',
              date: item.request_date,
              status: item.request_status,
              later: item.later,
              isRead: item.is_read,
              profileData: item
            }));

            setAllItems(processedData);
            const freshMatch = findMatch(processedData);
            if (freshMatch) {
              setSelectedId(freshMatch.id);
            }
          })
          .catch(console.error);
      }
    };

    window.addEventListener('open_target_request', handleOpenTarget);
    return () => {
      window.removeEventListener('open_target_request', handleOpenTarget);
    };
  }, [allItems]);

  // ── Filtering (Simulating Server-Side Logic locally) ──
  // Since the Server Action already filters based on URL params,
  // allItems is ALREADY filtered! But we can keep this for extra safety.
  const filteredItems = useMemo(() => {
    return allItems;
  }, [allItems]);

  // ── Column data ───────────────────────────────────────────
  const columnCards = useMemo(() => {
    const map = new Map<string, RequestItem[]>();
    for (const col of columns) {
      map.set(col.key, []);
    }
    for (const item of filteredItems) {
      if (!item.later) {
        map.get(item.status)?.push(item);
      }
    }
    return map;
  }, [filteredItems, columns]);

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
  
  const updateLaterStorage = (id: string, isLater: boolean) => {
    try {
      const stored = localStorage.getItem('respond_later_requests');
      const laterIds = new Set<string>(stored ? JSON.parse(stored) : []);
      if (isLater) {
        laterIds.add(id);
      } else {
        laterIds.delete(id);
      }
      localStorage.setItem('respond_later_requests', JSON.stringify(Array.from(laterIds)));
    } catch (e) {
      console.error('Failed to save respond later state', e);
    }
  };

  const sendToLater = useCallback((id: string) => {
    updateLaterStorage(id, true);
    setAllItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, later: true } : item))
    );
  }, []);

  const returnFromLater = useCallback((id: string) => {
    updateLaterStorage(id, false);
    setAllItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, later: false } : item))
    );
  }, []);

  // ── Sheet selection ───────────────────────────────────────
  const openSheet = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const closeSheet = useCallback(() => {
    setSelectedId(null);
  }, []);

  const toggleLater = useCallback((id: string) => {
    setAllItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (item) updateLaterStorage(id, !item.later);
      return prev.map((item) =>
        item.id === id ? { ...item, later: !item.later } : item
      );
    });
  }, []);

  const markAsReadLocal = useCallback((id: string) => {
    try {
      const stored = localStorage.getItem('agent_read_requests');
      const readIds = new Set(stored ? JSON.parse(stored) : []);
      readIds.add(id);
      localStorage.setItem('agent_read_requests', JSON.stringify(Array.from(readIds)));
    } catch (e) {
      console.error('Failed to save read requests', e);
    }
    
    setAllItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
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

  // ── Selected item ──────────────────────────────────────────
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return filteredItems.find((i) => i.id === selectedId) ?? null;
  }, [selectedId, filteredItems]);

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

    // Sheet
    selectedId,
    selectedItem,
    openSheet,
    closeSheet,
    toggleLater,
    markAsReadLocal,

    // Staff list (for filter dropdown)
    staffNames: realAgentNames,
  };
}
