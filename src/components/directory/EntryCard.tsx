'use client';

import React from 'react';
import type {
  DirectoryEntry,
  FilterMatchDetail,
} from '@/lib/directory/types';
import { SimilarWhy } from './SimilarWhy';
import {
  DIRECTORY_THEME,
  getDirectoryStageCardStyle,
} from '@/lib/directory/directory-theme';

interface EntryCardProps {
  entry: DirectoryEntry;
  isSelected: boolean;
  onSelect: (entry: DirectoryEntry) => void;
  index?: number;
  isSimilarMode?: boolean;
  matchedDetails?: FilterMatchDetail[];
  unmatchedLabels?: string[];
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const datePart = iso.split('T')[0];
  const [y, m, d] = datePart.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Deterministic avatar colors per person — based on first char of name */
const AVATAR_PALETTES = [
  { bg: '#E5EFE9', text: '#165842' }, // sage green
  { bg: '#FCE7CE', text: '#8C5216' }, // amber
  { bg: '#FCE2DF', text: '#A6372A' }, // rose
  { bg: '#DDE9F5', text: '#1A3A5C' }, // slate blue
  { bg: '#F4EFE7', text: '#4A3B28' }, // warm neutral
  { bg: '#EDE9FE', text: '#4C1D95' }, // violet
  { bg: '#D1FAE5', text: '#065F46' }, // emerald
] as const;

function getAvatarForName(name: string) {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

export function EntryCard({
  entry,
  isSelected,
  onSelect,
  index = 0,
  isSimilarMode = false,
  matchedDetails = [],
  unmatchedLabels = [],
}: EntryCardProps) {
  const {
    effectiveBg,
    isDarkBg,
    textColor,
    borderBottomColor,
    border,
  } = getDirectoryStageCardStyle(entry.boardStage);

  const avatar = getAvatarForName(entry.fullName);
  const staggerDelay = Math.min(index, 14) * 0.025;

  const mutedColor = isDarkBg ? 'rgba(255,255,255,0.6)' : 'rgba(31,59,52,0.55)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(entry)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(entry);
        }
      }}
      className="group text-left select-none outline-none"
      style={{
        minHeight: 178,
        borderRadius: 20,
        background: effectiveBg,
        border: isSelected
          ? `2px solid ${DIRECTORY_THEME.brand.primary}`
          : border,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isSelected
          ? DIRECTORY_THEME.shadows.entryCardSelected
          : isDarkBg
            ? DIRECTORY_THEME.shadows.entryCardDarkBase
            : '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        animation: 'cardFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${staggerDelay}s`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = isSelected
          ? DIRECTORY_THEME.shadows.entryCardSelected
          : '0 8px 24px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = isSelected
          ? DIRECTORY_THEME.shadows.entryCardSelected
          : isDarkBg
            ? DIRECTORY_THEME.shadows.entryCardDarkBase
            : '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)';
      }}
    >
      {/* Card body */}
      <div style={{ padding: '14px 16px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Top: CNIC */}
        <div style={{ fontSize: 10.5, fontWeight: 600, color: mutedColor, letterSpacing: 0.3 }}>
          {entry.cnic || '—'}
        </div>

        {/* Age · City · Profession */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: mutedColor, lineHeight: 1.5 }}>
            {[entry.age ? `${entry.age} yrs` : null, entry.currentCity || null]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {entry.jobTitle && (
            <div style={{ fontSize: 12, fontWeight: 500, color: mutedColor, lineHeight: 1.4 }}>
              {entry.jobTitle}
            </div>
          )}
        </div>

        {/* Person block */}
        <div
          className="flex items-center gap-3"
          style={{ marginTop: 'auto', paddingTop: 14 }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: isDarkBg ? 'rgba(255,255,255,0.15)' : avatar.bg,
              color: isDarkBg ? '#fff' : avatar.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {getInitials(entry.fullName)}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{
                fontSize: 15.5,
                fontWeight: 700,
                letterSpacing: -0.3,
                color: textColor,
                lineHeight: 1.2,
              }}
            >
              {entry.fullName}
            </div>
            {entry.phone && (
              <div
                style={{
                  fontSize: 11,
                  color: mutedColor,
                  lineHeight: 1.3,
                  marginTop: 1,
                }}
              >
                {entry.phone}
              </div>
            )}
          </div>
        </div>

        {/* Similar mode match reasons */}
        {isSimilarMode && matchedDetails.length > 0 && (
          <SimilarWhy
            matchedDetails={matchedDetails}
            unmatchedLabels={unmatchedLabels}
          />
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `1px solid ${borderBottomColor}`,
          }}
        >
          <span
            className="truncate max-w-[130px]"
            style={{ fontSize: 11, color: mutedColor, fontWeight: 500 }}
            title={entry.assignedStaff}
          >
            {entry.assignedStaff || 'Unassigned'}
          </span>
          <span style={{ fontSize: 11, color: mutedColor, fontWeight: 500, flexShrink: 0 }}>
            {formatDate(entry.requestDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
