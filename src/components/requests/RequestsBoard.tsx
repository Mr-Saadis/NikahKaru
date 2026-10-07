'use client';

import { useRef, useCallback } from 'react';
import { COLUMNS } from './constants';
import { useRequestsBoard } from './useRequestsBoard';
import BoardHeader from './BoardHeader';
import FilterToolbar from './FilterToolbar';
import StatsRow from './StatsRow';
import BoardColumn from './BoardColumn';
import RespondLaterPanel from './RespondLaterPanel';

// ============================================================
// RequestsBoard — State owner and layout orchestrator
// ============================================================


export default function RequestsBoard() {
  const {
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
    staffNames,
  } = useRequestsBoard();

  const scrollerRef = useRef<HTMLDivElement>(null);

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
  for (const col of COLUMNS) {
    offsets.push(globalOffset);
    globalOffset += (columnCards.get(col.key)?.length ?? 0);
  }

  return (
    <div
      className="flex h-full font-sans"
      style={{
        fontSize: 13,
        color: '#111',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      } as React.CSSProperties}
    >
      {/* Left content area */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{
          padding: '22px 18px 0 26px',
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
          />
          <StatsRow
            total={stats.total}
            later={stats.later}
            staffInvolved={stats.staffInvolved}
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
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: 18,
            scrollSnapType: 'x proximity',
            minHeight: 0,
          }}
        >
          {COLUMNS.map((col, ci) => {
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
              />
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <RespondLaterPanel
        cards={laterCards}
        onReturnFromLater={returnFromLater}
        onSendToLater={sendToLater}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
