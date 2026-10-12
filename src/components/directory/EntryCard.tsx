'use client';

import React from 'react';
import type {
  DirectoryEntry,
  FilterMatchDetail,
} from '@/lib/directory/types';
import { SimilarWhy } from './SimilarWhy';
import {
  DIRECTORY_THEME,
  DIRECTORY_AVATARS,
  getDirectoryStageCardStyle,
} from '@/lib/directory/directory-theme';

interface EntryCardProps {
  entry: DirectoryEntry;
  isSelected: boolean;
  onSelect: (entry: DirectoryEntry) => void;
  index?: number;
  // If in Similar mode:
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
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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

  const avatar = DIRECTORY_AVATARS[index % DIRECTORY_AVATARS.length];
  const staggerDelay = Math.min(index, 14) * 0.02;

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
      className="group text-left select-none outline-none transition-all duration-200 hover:-translate-y-[3px]"
      style={{
        minHeight: 182,
        padding: 16,
        borderRadius: 22,
        background: effectiveBg,
        border,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isSelected
          ? DIRECTORY_THEME.shadows.entryCardSelected
          : isDarkBg
          ? DIRECTORY_THEME.shadows.entryCardDarkBase
          : DIRECTORY_THEME.shadows.entryCardLightBase,
        cursor: 'pointer',
        position: 'relative',
        animation: 'cardFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${staggerDelay}s`,
      }}
    >
      {/* Top line: CNIC */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10.5, fontWeight: 600, color: textColor }}>
          {entry.cnic}
        </span>
      </div>

      {/* Subtitle: "age yrs · city" then profession on next line: 12px, weight 500, line-height 1.5, opacity .75, margin-top 10px */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.5,
            opacity: 0.75,
            color: textColor,
          }}
        >
          {entry.age} yrs · {entry.currentCity}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.5,
            opacity: 0.75,
            color: textColor,
          }}
        >
          {entry.jobTitle}
        </div>
      </div>

      {/* Person block pushed to bottom (margin-top:auto; padding-top:16px) */}
      <div
        className="flex items-center gap-2.5"
        style={{ marginTop: 'auto', paddingTop: 16 }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: avatar.bg,
            color: avatar.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: DIRECTORY_THEME.shadows.avatar,
          }}
        >
          {getInitials(entry.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="truncate"
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: textColor,
              lineHeight: 1.2,
            }}
          >
            {entry.fullName}
          </div>
          <div
            style={{
              fontSize: 11.5,
              opacity: 0.65,
              color: textColor,
              lineHeight: 1.3,
              marginTop: 1,
            }}
          >
            {entry.phone}
          </div>
        </div>
      </div>

      {/* Similar Mode Why section (below person block) */}
      {isSimilarMode && matchedDetails.length > 0 && (
        <SimilarWhy
          matchedDetails={matchedDetails}
          unmatchedLabels={unmatchedLabels}
        />
      )}

      {/* Footer: staff left and date right (dd.mm.yy) */}
      <div
        className="flex items-center justify-between"
        style={{
          marginTop: 13,
          paddingTop: 11,
          borderTop: `1px solid ${borderBottomColor}`,
          fontSize: 11,
          opacity: 0.7,
          color: textColor,
        }}
      >
        <span className="truncate max-w-[130px]" title={entry.assignedStaff}>
          {entry.assignedStaff}
        </span>
        <span className="shrink-0">{formatDate(entry.requestDate)}</span>
      </div>
    </div>
  );
}
