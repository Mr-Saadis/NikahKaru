'use client';

import { useRef, useCallback, useState } from 'react';
import { COLUMNS } from './constants';
import { useRequestsBoard } from './useRequestsBoard';
import BoardHeader from './BoardHeader';
import FilterToolbar from './FilterToolbar';
import StatsRow from './StatsRow';
import BoardColumn from './BoardColumn';
import RespondLaterPanel from './RespondLaterPanel';
import RequestDetailsSheet from './RequestDetailsSheet';
import Toast from './Toast';
import type { ColumnDef, FilterState, RequestItem } from './types';
import { useMatching } from './useMatching';
import { MatchProfilePanel } from './MatchProfilePanel';
import { getMatchProfileGroups } from './utils';

// ============================================================
// RequestsBoard — State owner and layout orchestrator
// ============================================================

export interface RequestsBoardProps {
  columns: ColumnDef[];
  fetchColumnRequests?: (status: string, filters: FilterState, offset: number, limit: number) => Promise<RequestItem[]>;
  fetchRequests?: (filters: FilterState) => Promise<RequestItem[]>;
  fetchNames: () => Promise<string[]>;
  hideStaffFilter?: boolean;
  onMarkAsRead?: (id: string) => Promise<void>;
}

export default function RequestsBoard({ columns, fetchColumnRequests, fetchRequests, fetchNames, hideStaffFilter, onMarkAsRead }: RequestsBoardProps) {
  const {
    filteredItems,
    columnCards,
    laterCards,
    stats,
    activeFilters,
    filters,
    expandedFilter,
    updateFilter,
    toggleFilter,
    closeFilter,
    resetFilters,
    draggedId,
    setDraggedId,
    sendToLater,
    returnFromLater,
    selectedId,
    selectedItem,
    openSheet,
    closeSheet,
    toggleLater,
    staffNames,
    markAsReadLocal,
    loadMoreColumn,
    isLoadingMore,
    columnHasMore,
  } = useRequestsBoard({ columns, fetchColumnRequests, fetchRequests, fetchNames });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);

  const matching = useMatching();

  const handleSelectCard = useCallback((id: string) => {
    openSheet(id);
    
    // Find card to check its status and isRead
    const card = filteredItems.find((c) => c.id === id) || laterCards.find((c) => c.id === id);
    if (!card) return;

    // Check if it's the manager's or agent's incoming request and it's unread
    if (['first', 'second', 'requested', 'responded'].includes(card.status) && !card.isRead) {
      markAsReadLocal(id);
      if (onMarkAsRead) {
        onMarkAsRead(id).catch(console.error);
      }
    }
  }, [openSheet, filteredItems, laterCards, markAsReadLocal, onMarkAsRead]);

  const handleDragStart = useCallback(
    (id: string) => {
      setDraggedId(id);
    },
    [setDraggedId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, [setDraggedId]);

  // Board area drop handler — returns cards from panel to original column
  const handleBoardDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    [],
  );

  const handleBoardDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (id) {
        returnFromLater(id);
      }
    },
    [returnFromLater],
  );

  // Calculate global offset for avatar color cycling
  let globalOffset = 0;
  const offsets: number[] = [];
  for (const col of columns) {
    offsets.push(globalOffset);
    globalOffset += (columnCards.get(col.key)?.length ?? 0);
  }

  const isSheetOpen = !!selectedId;

  return (
    <div
      className="flex h-full font-sans relative"
      style={{
        fontSize: 13,
        color: '#111',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      } as React.CSSProperties}
    >
      {/* Left content area */}
      <div
        ref={leftColRef}
        className="flex-1 flex flex-col min-w-0"
        style={{
          padding: '22px 10px 0 26px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <BoardHeader />

        {/* Toolbar row */}
        <div
          className="flex items-center justify-between"
          style={{ margin: '20px 0 18px' }}
        >
          <FilterToolbar
            filters={filters}
            expandedFilter={expandedFilter}
            activeFilters={activeFilters}
            staffNames={staffNames}
            onUpdateFilter={updateFilter}
            onToggleFilter={toggleFilter}
            onCloseFilter={closeFilter}
            onReset={resetFilters}
            scrollerRef={scrollerRef}
            hideStaffFilter={hideStaffFilter}
          />
          <StatsRow
            total={stats.total}
            later={stats.later}
            staffInvolved={stats.staffInvolved}
            hideStaffFilter={hideStaffFilter}
          />
        </div>

        {/* Board */}
        <div
          ref={scrollerRef}
          className="requests-scroll-hidden"
          onDragOver={handleBoardDragOver}
          onDrop={handleBoardDrop}
          style={{
            flex: 1,
            display: 'flex',
            gap: 14,
            overflowX: isSheetOpen ? 'hidden' : 'auto',
            overflowY: 'hidden',
            // When open, add bottom padding so columns extend under sheet
            paddingBottom: isSheetOpen ? Math.max(0, sheetHeight - 44) : 18,
            scrollSnapType: isSheetOpen ? 'none' : 'x proximity',
            minHeight: 0,
          }}
        >
          {columns.map((col, ci) => {
            const cards = columnCards.get(col.key) ?? [];
            return (
              <BoardColumn
                key={col.key}
                column={col}
                cards={cards}
                globalOffset={offsets[ci]}
                onSendToLater={sendToLater}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                selectedId={selectedId}
                onSelect={handleSelectCard}
                onLoadMore={() => loadMoreColumn(col.key)}
                hasMore={columnHasMore[col.key] ?? false}
                isLoadingMore={isLoadingMore[col.key] ?? false}
              />
            );
          })}
        </div>

        {/* ── Request Details Sheet ── */}
        <RequestDetailsSheet
          item={selectedItem}
          allItems={filteredItems}
          isOpen={isSheetOpen}
          columns={columns}
          onClose={closeSheet}
          onToggleLater={toggleLater}
          containerRef={leftColRef}
          onToast={setToastMsg}
          onHeightChange={setSheetHeight}
          matching={matching}
        />

        {/* ── Toast ── */}
        <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
      </div>

      {/* Vertical Separator */}
      <div className="hidden min-[900px]:block w-[2px] bg-[#EFE9DF] mt-[135px] mb-8 mr-[10px]" />

      {/* Right panel */}
      <RespondLaterPanel
        cards={laterCards}
        onReturnFromLater={returnFromLater}
        onSendToLater={sendToLater}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        selectedId={selectedId}
        onSelect={handleSelectCard}
        columns={columns}
      />

      <MatchProfilePanel
        openProfile={matching.openProfile}
        item={selectedItem}
        matchProfile={
          matching.openProfile && selectedItem
            ? matching.realMatches[selectedItem.id]?.find(
                (m) => m.candidateProfileId === matching.openProfile?.candidateId
              ) || null
            : null
        }
        chosenKeys={
          selectedItem && matching.openProfile
            ? matching.chosen[selectedItem.id]?.get(matching.openProfile.candidateId) || new Set()
            : new Set()
        }
        isSent={
          !!(selectedItem && matching.openProfile && (
            matching.sentExtra[selectedItem.id]?.[matching.openProfile.candidateId] ||
            (matching.releaseHistory[selectedItem.id] || []).some((r: any) => r.candidate_profile_id === matching.openProfile?.candidateId)
          ))
        }
        sentDate={
          (selectedItem && matching.openProfile)
            ? (matching.sentExtra[selectedItem.id]?.[matching.openProfile.candidateId] || 
               (matching.releaseHistory[selectedItem.id] || []).find((r: any) => r.candidate_profile_id === matching.openProfile?.candidateId)?.released_at)
            : undefined
        }
        releaseHistory={selectedItem ? (matching.releaseHistory[selectedItem.id] || []) : []}
        onClose={() => matching.setOpenProfile(null)}
        toggleSelection={() => {
          if (!selectedItem || !matching.openProfile) return;
          const matchProfile = matching.realMatches[selectedItem.id]?.find(
            (m: any) => m.candidateProfileId === matching.openProfile?.candidateId
          );
          const groups = matchProfile ? getMatchProfileGroups(matchProfile) : [];
          const allKeys = groups.flatMap((g, idx) => g[1].map((_, j) => `${idx}:${j}`));
          matching.toggleSelection(selectedItem.id, matching.openProfile.candidateId, allKeys);
        }}
        updateSelectionKeys={(keys) => {
          if (!selectedItem || !matching.openProfile) return;
          matching.updateSelectionKeys(selectedItem.id, matching.openProfile.candidateId, keys);
        }}
      />
    </div>
  );
}
