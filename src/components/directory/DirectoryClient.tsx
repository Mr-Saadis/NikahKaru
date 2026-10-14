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
import { getDirectoryEntries } from '@/lib/directory/get-directory-entries';
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

export function DirectoryClient() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<ActiveFilterValues>(INITIAL_ACTIVE_FILTERS);
  const [mode, setMode] = useState<FilterMode>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const matching = useMatching();

  // Load entries via single typed data-access function
  useEffect(() => {
    let mounted = true;
    getDirectoryEntries()
      .then((data) => {
        if (mounted) {
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

  // Calculate live counts for mode toggle badges
  const { allCount, exactCount, similarCount } = useMemo(
    () => calculateModeCounts(entries, filters),
    [entries, filters]
  );

  // Filtered results based on effective mode
  const displayedResults = useMemo(() => {
    return applyFilters(entries, filters, effectiveMode);
  }, [entries, filters, effectiveMode]);

  const showingCount = displayedResults.length;

  // Map directory entries to RequestItem for the shared RequestDetailsSheet
  const requestItemsMap = useMemo(() => {
    const map = new Map<string, RequestItem>();
    for (const e of entries) {
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
  }, [entries]);

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

      {/* ── LEFT COLUMN: Filter Cards Stack (296px) ── */}
      <FilterColumn
        entries={entries}
        filters={filters}
        onUpdateFilter={handleUpdateFilter}
        onClearFilter={handleClearFilter}
        expandedCardId={expandedCardId}
        setExpandedCardId={setExpandedCardId}
        sheetBottomPadding={sheetBottomPadding}
      />

      {/* ── RIGHT COLUMN: Entered Filters + Results Area ── */}
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
            <div className="grid grid-cols-1 min-[1200px]:grid-cols-2 gap-[12px] auto-rows-fr">
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-[14px]">
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
