'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  DirectoryEntry,
  ActiveFilterValues,
  FilterMode,
  EntryWithSimilarMatch,
} from '@/lib/directory/types';
import { INITIAL_ACTIVE_FILTERS } from '@/lib/directory/config';
import {
  countActiveFilters,
  applyFilters,
  calculateModeCounts,
} from '@/lib/directory/filters';
import { getDirectoryEntries, serializeFiltersToParams } from '@/lib/directory/get-directory-entries';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';
import { FilterColumn } from './FilterColumn';
import { EnteredFiltersPanel } from './EnteredFiltersPanel';
import { EntryCard } from './EntryCard';
import { EmptyExactState } from './EmptyExactState';

// Existing manager sheet & matching dependencies
import RequestDetailsSheet from '@/components/requests/RequestDetailsSheet';
import { COLUMNS } from '@/components/requests/constants';
import { useMatching } from '@/components/requests/useMatching';
import { MatchProfilePanel } from '@/components/requests/MatchProfilePanel';
import { getMatchProfileGroups } from '@/components/requests/utils';
import Toast from '@/components/requests/Toast';
import type { RequestItem } from '@/components/requests/types';
import { createClient } from '@/lib/supabase/client';
import { clearDirectoryCache, getCachedEntries } from '@/lib/directory/directory-cache';

export function DirectoryClient() {
  const [baseEntries, setBaseEntries] = useState<DirectoryEntry[]>([]);
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [filters, setFilters] = useState<ActiveFilterValues>(INITIAL_ACTIVE_FILTERS);
  const [mode, setMode] = useState<FilterMode>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const matching = useMatching();

  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 1. Initial load: fetch base non-draft profiles
  useEffect(() => {
    let mounted = true;
    getDirectoryEntries()
      .then((data) => {
        if (mounted) {
          setBaseEntries(data);
          setEntries(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load directory entries:', err);
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const hasActiveFilters = activeFilterCount > 0;

  // Derive effective mode: fallback to 'all' if no active filters
  const effectiveMode: FilterMode =
    !hasActiveFilters && (mode === 'exact' || mode === 'similar') ? 'all' : mode;

  // 2. Live API Filter Queries
  // Skip API call if no active filters (use baseEntries directly, Rule 2.1)
  // Check cache immediately if query already cached (instant 0ms response)
  useEffect(() => {
    if (isLoading) return;

    if (!hasActiveFilters) {
      if (baseEntries.length > 0) {
        setEntries(baseEntries);
      }
      setIsFetching(false);
      return;
    }

    const params = serializeFiltersToParams(filters, effectiveMode);
    const queryString = params.toString();

    // Instant Cache Hit check — 0ms, no debounce, no network call!
    const cached = getCachedEntries(queryString);
    if (cached) {
      setEntries(cached);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    const controller = new AbortController();

    const timer = setTimeout(() => {
      getDirectoryEntries(filters, effectiveMode, controller.signal)
        .then((data) => {
          setEntries(data);
          setIsFetching(false);
        })
        .catch((err) => {
          if (err?.name === 'AbortError') {
            // Cancelled because user clicked another filter; do not alter entries
            return;
          }
          console.error('Failed to fetch filtered directory entries:', err);
          setIsFetching(false);
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, effectiveMode, isLoading, hasActiveFilters, baseEntries]);

  // 3. Supabase Realtime Listener (Auto-sync when new data is added or modified in DB)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('directory-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          // Clear query cache so next filter actions fetch fresh DB data
          clearDirectoryCache();
          // Silently re-fetch baseline
          getDirectoryEntries().then((fresh) => {
            setBaseEntries(fresh);
            if (!hasActiveFilters) {
              setEntries(fresh);
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'information_requests' },
        () => {
          clearDirectoryCache();
          getDirectoryEntries().then((fresh) => {
            setBaseEntries(fresh);
            if (!hasActiveFilters) {
              setEntries(fresh);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasActiveFilters]);

  // Update an individual filter key
  const handleUpdateFilter = useCallback(
    <K extends keyof ActiveFilterValues>(key: K, value: ActiveFilterValues[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        // If Country is cleared, also clear City
        if (key === 'country' && Array.isArray(value) && value.length === 0) {
          next.city = [];
        }
        return next;
      });
    },
    []
  );

  // Clear an individual filter key
  const handleClearFilter = useCallback(
    (key: keyof ActiveFilterValues) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: INITIAL_ACTIVE_FILTERS[key] };
        if (key === 'country') {
          next.city = [];
        }
        return next;
      });
    },
    []
  );

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setFilters(INITIAL_ACTIVE_FILTERS);
    setExpandedCardId(null);
    setMode('all');
  }, []);

  // Calculate live counts for mode toggle badges using non-draft base population
  const { allCount, exactCount, similarCount } = useMemo(
    () => calculateModeCounts(baseEntries.length > 0 ? baseEntries : entries, filters),
    [baseEntries, entries, filters]
  );

  // Filtered results based on effective mode
  const displayedResults = useMemo(() => {
    if (effectiveMode === 'similar') {
      return applyFilters(baseEntries.length > 0 ? baseEntries : entries, filters, 'similar');
    }
    return entries;
  }, [baseEntries, entries, filters, effectiveMode]);

  const showingCount = displayedResults.length;

  // Map directory entries to RequestItem for the shared RequestDetailsSheet
  const requestItemsMap = useMemo(() => {
    const map = new Map<string, RequestItem>();
    const pool = baseEntries.length > 0 ? baseEntries : entries;
    for (const e of pool) {
      map.set(e.id, {
        id: e.id,
        name: e.fullName,
        cnic: e.cnic,
        phone: e.phone,
        staff: e.assignedStaff,
        date: e.requestDate,
        status: e.boardStage,
        later: false,
        profileData: e.profileData,
      });
    }
    return map;
  }, [baseEntries, entries]);

  const selectedRequestItem = selectedId ? requestItemsMap.get(selectedId) || null : null;
  const allRequestItems = useMemo(() => Array.from(requestItemsMap.values()), [requestItemsMap]);

  const isSheetOpen = Boolean(selectedId);
  const sheetBottomPadding = isSheetOpen ? Math.max(0, sheetHeight - 44) : 0;

  const handleSelectEntry = useCallback((entry: DirectoryEntry) => {
    setSelectedId(entry.id);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="text-sm font-medium"
          style={{ color: DIRECTORY_THEME.text.muted }}
        >
          Loading directory...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-[900px]:flex-row gap-6 h-full p-4 md:p-6 overflow-hidden relative"
      style={{
        background: DIRECTORY_THEME.surfaces.app,
        color: DIRECTORY_THEME.text.body,
      }}
    >
      <style>{`
        @keyframes cardFadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>

      {/* ── LEFT COLUMN: Filter Cards Stack (320px) ── */}
      <FilterColumn
        entries={baseEntries.length > 0 ? baseEntries : entries}
        filters={filters}
        onUpdateFilter={handleUpdateFilter}
        onClearFilter={handleClearFilter}
        expandedCardId={expandedCardId}
        setExpandedCardId={setExpandedCardId}
        sheetBottomPadding={sheetBottomPadding}
      />

      {/* ── RIGHT / MAIN COLUMN: Entered Filters + Results Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative gap-[14px]">
        {/* Entered filters panel at the top (always visible — top bar with stats/mode) */}
        <EnteredFiltersPanel
          mode={effectiveMode}
          onChangeMode={setMode}
          filters={filters}
          onUpdateFilter={handleUpdateFilter}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAllFilters}
          totalEntries={allCount}
          showingEntries={showingCount}
          activeFilterCount={activeFilterCount}
          allCount={allCount}
          exactCount={exactCount}
          similarCount={similarCount}
        />

        {/* Results Scrollable Area (scrolls independently) */}
        <div
          className="flex-1 overflow-y-auto requests-scroll-hidden relative pr-1"
          style={{
            paddingBottom: isSheetOpen ? Math.max(24, sheetBottomPadding) : 24,
          }}
        >
          {/* In "All" mode: if filters exist, show "N filters waiting" pill */}
          {effectiveMode === 'all' && hasActiveFilters && (
            <div
              className="flex items-center gap-2 mb-3.5 rounded-full w-fit"
              style={{
                backgroundColor: DIRECTORY_THEME.surfaces.white,
                border: `1px solid ${DIRECTORY_THEME.borders.soft}`,
                boxShadow: DIRECTORY_THEME.shadows.waitingPill,
                padding: '5px 6px 5px 16px',
                fontSize: 12,
              }}
            >
              <span
                className="font-semibold"
                style={{ color: DIRECTORY_THEME.text.body }}
              >
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} waiting
              </span>
              <button
                type="button"
                onClick={() => setMode('exact')}
                className={`hover:-translate-y-[1px] ${DIRECTORY_THEME.classes.hoverBrandBg} transition-all active:scale-98`}
                style={{
                  height: 30,
                  borderRadius: 9999,
                  padding: '0 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: DIRECTORY_THEME.brand.primary,
                  color: DIRECTORY_THEME.brand.text,
                }}
              >
                Exact · {exactCount}
              </button>
              <button
                type="button"
                onClick={() => setMode('similar')}
                className={`hover:-translate-y-[1px] ${DIRECTORY_THEME.classes.hoverWarmNeutralBg} transition-all active:scale-98`}
                style={{
                  height: 30,
                  borderRadius: 9999,
                  padding: '0 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: DIRECTORY_THEME.surfaces.toggleTrack,
                  color: DIRECTORY_THEME.brand.primary,
                }}
              >
                Similar · {similarCount}
              </button>
            </div>
          )}

          {/* Empty state in Exact mode */}
          {effectiveMode === 'exact' && showingCount === 0 && (
            <EmptyExactState
              similarCount={similarCount}
              onShowSimilar={() => setMode('similar')}
            />
          )}

          {/* Results Grid */}
          {effectiveMode === 'similar' ? (
            /* Similar Mode: Exactly 2 columns, gap 12px, equal row height */
            <div
              className="grid grid-cols-1 min-[1200px]:grid-cols-2 gap-[12px] auto-rows-fr"
              style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s ease' }}
            >
              {(displayedResults as EntryWithSimilarMatch[]).map((res, idx) => (
                <EntryCard
                  key={res.entry.id}
                  entry={res.entry}
                  index={idx}
                  isSelected={selectedId === res.entry.id}
                  onSelect={handleSelectEntry}
                  isSimilarMode={true}
                  matchedDetails={res.matchedDetails}
                  unmatchedLabels={res.unmatchedLabels}
                />
              ))}
            </div>
          ) : (
            /* All & Exact Mode: Auto-fill grid (min ~236px), gap 14px */
            <div
              className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-[14px]"
              style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s ease' }}
            >
              {(displayedResults as DirectoryEntry[]).map((entry, idx) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  isSelected={selectedId === entry.id}
                  onSelect={handleSelectEntry}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reused Shared Details Sheet (Rule 3) ── */}
      <RequestDetailsSheet
        item={selectedRequestItem}
        allItems={allRequestItems}
        isOpen={isSheetOpen}
        columns={COLUMNS}
        onClose={handleCloseSheet}
        onToggleLater={() => { }}
        containerRef={containerRef}
        onToast={setToastMsg}
        onHeightChange={setSheetHeight}
        matching={matching}
        hideRespondLater={true}
        rightOffset={isDesktop ? 318 : 0}
      />

      {/* Reused Match Profile Panel (if Match Now candidate opened) */}
      <MatchProfilePanel
        openProfile={matching.openProfile}
        item={selectedRequestItem}
        matchProfile={
          matching.openProfile && selectedRequestItem
            ? matching.realMatches[selectedRequestItem.id]?.find(
              (m: { candidateProfileId: string }) => m.candidateProfileId === matching.openProfile?.candidateId
            ) || null
            : null
        }
        chosenKeys={
          selectedRequestItem && matching.openProfile
            ? matching.chosen[selectedRequestItem.id]?.get(matching.openProfile.candidateId) || new Set()
            : new Set()
        }
        isSent={
          Boolean(
            selectedRequestItem &&
            matching.openProfile &&
            (matching.sentExtra[selectedRequestItem.id]?.[matching.openProfile.candidateId] ||
              (matching.releaseHistory[selectedRequestItem.id] || []).some(
                (r: { candidate_profile_id?: string }) => r.candidate_profile_id === matching.openProfile?.candidateId
              ))
          )
        }
        sentDate={
          selectedRequestItem && matching.openProfile
            ? matching.sentExtra[selectedRequestItem.id]?.[matching.openProfile.candidateId] ||
            (matching.releaseHistory[selectedRequestItem.id] || []).find(
              (r: { candidate_profile_id?: string; released_at?: string }) =>
                r.candidate_profile_id === matching.openProfile?.candidateId
            )?.released_at
            : undefined
        }
        releaseHistory={selectedRequestItem ? matching.releaseHistory[selectedRequestItem.id] || [] : []}
        onClose={() => matching.setOpenProfile(null)}
        toggleSelection={() => {
          if (!selectedRequestItem || !matching.openProfile) return;
          const matchProfile = matching.realMatches[selectedRequestItem.id]?.find(
            (m: { candidateProfileId: string }) => m.candidateProfileId === matching.openProfile?.candidateId
          );
          const groups = matchProfile ? getMatchProfileGroups(matchProfile) : [];
          const allKeys = groups.flatMap((g, idx) => g[1].map((_, j) => `${idx}:${j}`));
          matching.toggleSelection(selectedRequestItem.id, matching.openProfile.candidateId, allKeys);
        }}
        updateSelectionKeys={(keys) => {
          if (!selectedRequestItem || !matching.openProfile) return;
          matching.updateSelectionKeys(selectedRequestItem.id, matching.openProfile.candidateId, keys);
        }}
      />

      {/* Toast */}
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
    </div>
  );
}
