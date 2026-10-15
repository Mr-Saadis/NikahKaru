'use client';

import React from 'react';
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  Ruler,
  Calendar,
  User,
} from 'lucide-react';
import type {
  DirectoryEntry,
  FilterMatchDetail,
} from '@/lib/directory/types';
import { SimilarWhy } from './SimilarWhy';
import {
  DIRECTORY_THEME,
  getDirectoryStageCardStyle,
} from '@/lib/directory/directory-theme';
import { COLUMNS } from '@/components/requests/constants';

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

function formatHeight(inches?: number, cm?: number): string | null {
  if (inches && inches > 0) {
    const feet = Math.floor(inches / 12);
    const rem = inches % 12;
    return `${feet}'${rem}"`;
  }
  if (cm && cm > 0) {
    return `${cm} cm`;
  }
  return null;
}

function formatMaritalStatus(status?: string): string | null {
  if (!status) return null;
  const map: Record<string, string> = {
    NEVER_MARRIED: 'Single',
    MARRIED: 'Married',
    DIVORCED: 'Divorced',
    WIDOWED: 'Widowed',
    SEPARATED: 'Separated',
  };
  return map[status] || status;
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

  const mutedColor = isDarkBg ? 'rgba(255,255,255,0.7)' : 'rgba(31,59,52,0.65)';
  const stageCol = COLUMNS.find((c) => c.key === entry.boardStage);

  const formattedHeight = formatHeight(entry.heightInches, entry.heightCm);
  const maritalText = formatMaritalStatus(entry.maritalStatus);

  const subtitleParts = [
    entry.age ? `${entry.age} yrs` : null,
    entry.currentCity || null,
    maritalText,
  ].filter(Boolean);

  const hasHighlights = Boolean(
    entry.jobTitle ||
    entry.qualification ||
    entry.sectName ||
    formattedHeight ||
    (entry.cnic && entry.cnic.trim())
  );

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
        minHeight: 180,
        borderRadius: 22,
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
            : '0 1px 3px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.05)',
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
            : '0 1px 3px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.05)';
      }}
    >
      {/* Card body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>

        {/* ── 1. Top Bar: Meta / Tags & Stage Badge ── */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Gender badge / CNIC */}
          <div className="flex items-center gap-1.5 min-w-0">
            {entry.gender && (
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase shrink-0"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255,255,255,0.14)' : 'rgba(31,59,52,0.06)',
                  color: isDarkBg ? 'rgba(255,255,255,0.9)' : '#1F3B34',
                }}
              >
                {entry.gender === 'FEMALE' ? 'Female' : 'Male'}
              </span>
            )}
            {entry.cnic && (
              <span
                className="text-[10px] font-mono tracking-tight truncate"
                style={{ color: mutedColor }}
                title={`CNIC: ${entry.cnic}`}
              >
                {entry.cnic}
              </span>
            )}
          </div>

          {/* Right: Board Stage Badge */}
          {stageCol && (
            <span
              className="shrink-0 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: isDarkBg ? 'rgba(255,255,255,0.16)' : 'rgba(31,59,52,0.07)',
                color: isDarkBg ? '#FFFFFF' : '#1F3B34',
                border: isDarkBg ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(31,59,52,0.1)',
              }}
            >
              {stageCol.label}
            </span>
          )}
        </div>

        {/* ── 2. Profile Identity Row (Full Width!) ── */}
        <div className="flex items-center gap-3 min-w-0 pt-0.5">
          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isDarkBg ? 'rgba(255,255,255,0.18)' : avatar.bg,
              color: isDarkBg ? '#fff' : avatar.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.5,
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            }}
          >
            {getInitials(entry.fullName)}
          </div>

          {/* Name + Subtitle (Age · City · Status) */}
          <div className="min-w-0 flex-1">
            <h4
              className="truncate font-bold tracking-tight text-[15px]"
              style={{
                color: textColor,
                lineHeight: 1.25,
              }}
              title={entry.fullName}
            >
              {entry.fullName}
            </h4>
            <div
              className="truncate mt-0.5 text-[12px] font-medium"
              style={{ color: mutedColor }}
            >
              {subtitleParts.length > 0 ? subtitleParts.join(' · ') : 'Profile'}
            </div>
          </div>
        </div>

        {/* ── 3. Highlights / Key Attributes ── */}
        {hasHighlights && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {entry.jobTitle && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(31,59,52,0.05)',
                  color: textColor,
                }}
              >
                <Briefcase size={11} className="opacity-60 shrink-0" />
                <span className="truncate max-w-[130px]">{entry.jobTitle}</span>
              </span>
            )}

            {entry.qualification && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(31,59,52,0.05)',
                  color: textColor,
                }}
              >
                <GraduationCap size={11} className="opacity-60 shrink-0" />
                <span className="truncate max-w-[130px]">{entry.qualification}</span>
              </span>
            )}

            {entry.sectName && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(31,59,52,0.05)',
                  color: textColor,
                }}
              >
                <Sparkles size={11} className="opacity-60 shrink-0" />
                <span>{entry.sectName}</span>
              </span>
            )}

            {formattedHeight && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(31,59,52,0.05)',
                  color: textColor,
                }}
              >
                <Ruler size={11} className="opacity-60 shrink-0" />
                <span>{formattedHeight}</span>
              </span>
            )}
          </div>
        )}

        {/* ── 4. Similar Mode Match Reasons ── */}
        {isSimilarMode && matchedDetails.length > 0 && (
          <SimilarWhy
            matchedDetails={matchedDetails}
            unmatchedLabels={unmatchedLabels}
            isDarkBg={isDarkBg}
          />
        )}

        {/* ── 5. Card Footer ── */}
        <div
          className="flex items-center justify-between mt-auto pt-2.5"
          style={{
            borderTop: `1px solid ${borderBottomColor}`,
          }}
        >
          <div className="flex items-center gap-1.5 truncate max-w-[140px]">
            <User size={11} className="opacity-60 shrink-0" style={{ color: mutedColor }} />
            <span
              className="truncate text-[11px] font-medium"
              style={{ color: mutedColor }}
              title={entry.assignedStaff}
            >
              {entry.assignedStaff ? `Staff: ${entry.assignedStaff}` : 'Unassigned'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar size={11} className="opacity-60" style={{ color: mutedColor }} />
            <span className="text-[11px] font-medium" style={{ color: mutedColor }}>
              {formatDate(entry.requestDate)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
