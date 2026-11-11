'use client';

import { useState, useEffect } from 'react';
import type { RequestItem, ColumnDef } from './types';
import RequestCard from './RequestCard';
import EmptyColumn from './EmptyColumn';

// ============================================================
// BoardColumn — Single Kanban column with header + card list
// ============================================================

interface BoardColumnProps {
  column: ColumnDef;
  cards: RequestItem[];
  /** Global offset for avatar color cycling */
  globalOffset: number;
  onSendToLater: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export default function BoardColumn({
  column,
  cards,
  globalOffset,
  onSendToLater,
  onDragStart,
  onDragEnd,
  selectedId,
  onSelect,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: BoardColumnProps) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    }
  };

  const visibleCards = cards;

  return (
    <div
      id={`board-column-${column.key}`}
      data-column-key={column.key}
      style={{
        width: 232,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        scrollSnapAlign: 'start',
        minHeight: 0,
      }}
    >
      {/* Top color line */}
      <div
        style={{
          height: 4,
          borderRadius: 3,
          background: column.color,
        }}
      />

      {/* Column header */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1F3B34' }}>
          {column.label}
        </span>
        <div
          style={{
            minWidth: 24,
            height: 22,
            borderRadius: 9999,
            background: '#1F3B34',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 7px',
          }}
        >
          {cards.length}
        </div>
      </div>

      {/* Card list */}
      <div
        className="requests-scroll-hidden"
        onScroll={handleScroll}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: selectedId ? 'hidden' : 'auto',
          padding: '2px 2px 48px', // Increased bottom padding to prevent hover shadow clipping
          minHeight: 0,
        }}
      >
        {visibleCards.length === 0 ? (
          <EmptyColumn />
        ) : (
          visibleCards.map((card, i) => (
            <RequestCard
              key={card.id}
              item={card}
              index={i}
              globalIndex={globalOffset + i}
              column={column}
              onSendToLater={onSendToLater}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onSelect={onSelect}
              isSelected={card.id === selectedId}
            />
          ))
        )}
        
        {isLoadingMore && (
          <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center space-x-2">
            <div className="w-3 h-3 border-2 border-[#1F3B34] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
