'use client';

import { useCallback, useRef, useState } from 'react';
import type { RequestItem, ColumnDef } from './types';
import { AVATAR_COLORS } from './constants';
import { BookmarkFilledIcon } from './icons';

// ============================================================
// RequestCard — Individual draggable card
// ============================================================

interface RequestCardProps {
  item: RequestItem;
  index: number;
  globalIndex: number;
  column: ColumnDef;
  onSendToLater: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  /** If true, show the original column label pill (for panel cards) */
  showColumnTag?: boolean;
  /** Called when the card is clicked to open the details sheet */
  onSelect?: (id: string) => void;
  /** Whether this card is currently selected */
  isSelected?: boolean;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const datePart = iso.split('T')[0];
  const [y, m, d] = datePart.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function RequestCard({
  item,
  index,
  globalIndex,
  column,
  onSendToLater,
  onDragStart,
  onDragEnd,
  showColumnTag,
  onSelect,
  isSelected,
}: RequestCardProps) {
  const avatarColor = AVATAR_COLORS[globalIndex % AVATAR_COLORS.length];
  const isTransparent = column.cardBg === 'transparent';
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const effectiveBg = column.cardBg;

  // Contrast logic based on new colour schema
  const isDarkBg = ['#2F3E51', '#1F3B34', '#C86A4A'].includes(effectiveBg);
  const textColor = isDarkBg ? '#fff' : '#1F3B34'; // Pine Grove as dark default
  const mutedColor = isDarkBg ? 'rgba(255,255,255,0.7)' : 'rgba(31,59,52,0.65)';
  const dashFilled = isDarkBg ? '#fff' : '#1F3B34';
  const dashUnfilled = isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(31,59,52,0.2)';
  const isAvatarDark = ['#2F3E51', '#1F3B34', '#C86A4A'].includes(avatarColor);
  const avatarTextColor = isAvatarDark ? '#fff' : '#1F3B34';
  
  const tagBg = isDarkBg ? '#fff' : '#1F3B34';
  const tagColor = isDarkBg ? column.cardBg : '#fff';

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(item.id);
    },
    [item.id, onDragStart],
  );

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSelect) return;
      // If dragged more than 5px, don't count as click
      if (dragStartPos.current) {
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx > 5 || dy > 5) return;
      }
      onSelect(item.id);
    },
    [onSelect, item.id],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && onSelect) {
        onSelect(item.id);
      }
    },
    [onSelect, item.id],
  );

  const handleBookmark = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onSendToLater(item.id);
    },
    [item.id, onSendToLater],
  );

  // Dashes
  const totalDashes = 3;
  const filled = column.filledDashes;

  // Find original column label for panel tag
  const originalLabel = column.label;

  return (
    <div
      draggable
      tabIndex={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="request-card group"
      style={{
        minHeight: 182,
        padding: 16,
        borderRadius: 22,
        background: effectiveBg,
        border: isTransparent ? `1.5px solid ${column.color}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isSelected
          ? '0 0 0 2px #111, 0 14px 28px rgba(30,30,50,.14)'
          : isHovered
            ? '0 14px 28px rgba(30,30,50,0.12)'
            : isDarkBg
              ? '0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 6px rgba(0,0,0,0.08)'
              : '0 1px 0 rgba(255,255,255,0.5) inset, 0 2px 6px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform .2s ease, box-shadow .2s ease, opacity .2s ease',
        animationDelay: `${index * 0.05}s`,
      }}
      onFocus={() => {}}
    >
      {/* Top row: CNIC + dots */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10.5, fontWeight: 600, color: textColor }}>
          {item.cnic}
        </span>
        <span
          style={{
            opacity: 0.55,
            letterSpacing: 1.5,
            fontSize: 13,
            color: textColor,
            lineHeight: 1,
          }}
        >
          •••
        </span>
      </div>

      {/* Dashes */}
      <div
        className="flex gap-[4px]"
        style={{ width: '60%', marginTop: 11 }}
      >
        {Array.from({ length: totalDashes }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < filled ? dashFilled : dashUnfilled,
            }}
          />
        ))}
      </div>

      {/* Bookmark button — appears on hover */}
      {!item.later && (
        <button
          type="button"
          aria-label="Send to Respond Later"
          onClick={handleBookmark}
          className="opacity-0 group-hover:opacity-100"
          style={{
            position: 'absolute',
            right: 14,
            top: 46,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'opacity .2s ease',
            zIndex: 2,
            color: '#1F3B34',
          }}
        >
          <BookmarkFilledIcon size={14} />
        </button>
      )}

      {/* Bottom block — pushed down */}
      <div style={{ marginTop: 'auto' }}>
        {/* Avatar + name + phone */}
        <div className="flex items-center gap-[10px]">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 12.5,
              fontWeight: 700,
              color: avatarTextColor,
            }}
          >
            {getInitials(item.name)}
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: -0.2,
                color: textColor,
                lineHeight: 1.2,
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: mutedColor,
                lineHeight: 1.3,
              }}
            >
              {item.phone}
            </div>
          </div>
        </div>

        {/* Footer: staff + date */}
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: 13,
            paddingTop: 11,
            borderTop: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.15)' : 'rgba(31,59,52,0.09)'}`,
            fontSize: 11,
            color: mutedColor,
          }}
        >
          <span className="truncate max-w-[130px] pr-2" title={item.staff}>{item.staff}</span>
          <span className="shrink-0">{formatDate(item.date)}</span>
        </div>

        {/* Column tag (only shown in Respond Later panel) */}
        {showColumnTag && (
          <div
            style={{
              marginTop: 8,
              padding: '5px 12px',
              borderRadius: 9999,
              background: tagBg,
              color: tagColor,
              fontSize: 11,
              fontWeight: 600,
              fontStyle: 'italic',
            }}
          >
            {originalLabel}
          </div>
        )}
      </div>
    </div>
  );
}
