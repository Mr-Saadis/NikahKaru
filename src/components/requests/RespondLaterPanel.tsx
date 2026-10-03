'use client';

import { useCallback, useState } from 'react';
import type { RequestItem } from './types';
import { COLUMNS } from './constants';
import { BookmarkFilledIcon } from './icons';
import RequestCard from './RequestCard';

// ============================================================
// RespondLaterPanel — Right panel for parked cards
// ============================================================

interface RespondLaterPanelProps {
  cards: RequestItem[];
  onReturnFromLater: (id: string) => void;
  onSendToLater: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export default function RespondLaterPanel({
  cards,
  onReturnFromLater,
  onSendToLater,
  onDragStart,
  onDragEnd,
}: RespondLaterPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const id = e.dataTransfer.getData('text/plain');
      if (id) {
        onSendToLater(id);
      }
    },
    [onSendToLater],
  );

  // Handle drop on the board area (return from later)
  const handleCardDragStartFromPanel = useCallback(
    (id: string) => {
      onDragStart(id);
    },
    [onDragStart],
  );

  return (
    <div
      className="hidden min-[900px]:flex flex-col flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: 292,
        margin: '14px 14px 14px 0',
        padding: '18px 14px 14px',
        borderRadius: 28,
        background: isDragOver
          ? '#F2EDE1' // Cannoli Cream when drag over
          : 'linear-gradient(180deg, #fff, #fbfaf6)',
        boxShadow: `0 10px 30px rgba(30,30,50,0.08), inset 0 0 0 1px rgba(255,255,255,0.8)`,
        outline: isDragOver ? '2px dashed #1F3B34' : 'none', // Pine Grove dashed outline
        transition: 'background .2s, outline .2s',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-[6px]">
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1F3B34' }}>
          Respond Later
        </span>
        <div
          style={{
            minWidth: 26,
            height: 24,
            borderRadius: 9999,
            background: '#C86A4A', // Terracotta Clay
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 8px',
            boxShadow: '0 4px 10px rgba(200,106,74,0.45)',
          }}
        >
          {cards.length}
        </div>
      </div>

      {/* Helper text */}
      <div
        style={{
          fontSize: 11,
          color: '#A3B18A', // Sage Whisper
          lineHeight: 1.4,
          marginBottom: 14,
        }}
      >
        Drag a card here. It leaves its column but keeps its status.
      </div>

      {/* Card list */}
      <div
        className="requests-scroll-hidden"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto',
          padding: '4px 2px',
        }}
      >
        {cards.length === 0 ? (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ paddingTop: 40 }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                color: '#1F3B34',
              }}
            >
              <BookmarkFilledIcon size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1F3B34', marginBottom: 4 }}>
              Nothing here yet.
            </div>
            <div style={{ fontSize: 11.5, color: '#A3B18A' }}>
              Drop a card to respond later.
            </div>
          </div>
        ) : (
          cards.map((card, i) => {
            const col = COLUMNS.find((c) => c.key === card.status) ?? COLUMNS[0];
            return (
              <RequestCard
                key={card.id}
                item={card}
                index={i}
                globalIndex={i}
                column={col}
                onSendToLater={onReturnFromLater}
                onDragStart={handleCardDragStartFromPanel}
                onDragEnd={onDragEnd}
                showColumnTag
              />
            );
          })
        )}
      </div>
    </div>
  );
}
