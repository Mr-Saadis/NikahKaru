import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import type { FilterMatchDetail } from '@/lib/directory/types';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

interface SimilarWhyProps {
  matchedDetails: FilterMatchDetail[];
  unmatchedLabels: string[];
  isDarkBg?: boolean;
}

export function SimilarWhy({ matchedDetails, unmatchedLabels, isDarkBg = false }: SimilarWhyProps) {
  const unmatchedCount = unmatchedLabels.length;

  return (
    <div
      style={{
        marginTop: 6,
        paddingTop: 10,
        borderTop: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.12)' : DIRECTORY_THEME.borders.divider}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <CheckCircle2
          size={12}
          className="shrink-0"
          style={{ color: isDarkBg ? '#F5C770' : '#165842' }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: isDarkBg ? 'rgba(255,255,255,0.7)' : DIRECTORY_THEME.text.muted,
          }}
        >
          Matched Criteria
        </span>
      </div>

      {/* Row of matched chips + unmatched count at the end */}
      <div className="flex flex-wrap items-center gap-1.5">
        {matchedDetails.map((detail) => (
          <span
            key={detail.filterId}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.15)' : '#E7F2EC',
              color: isDarkBg ? '#FFFFFF' : '#165842',
              border: isDarkBg ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #CFE3D8',
            }}
          >
            <Check
              size={11}
              strokeWidth={2.5}
              style={{ color: isDarkBg ? '#F5C770' : '#165842' }}
              className="shrink-0"
            />
            <span style={{ opacity: isDarkBg ? 0.75 : 0.65, fontWeight: 500 }}>
              {detail.filterLabel}:
            </span>
            <span>{detail.valueDisplay}</span>
          </span>
        ))}

        {unmatchedCount > 0 && (
          <div className="relative group inline-flex items-center">
            <span
              className="rounded-full px-2 py-0.5"
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: isDarkBg ? 'rgba(255,255,255,0.65)' : DIRECTORY_THEME.text.muted,
                backgroundColor: isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                cursor: 'help',
              }}
            >
              +{unmatchedCount} not matched
            </span>
            <div
              className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block text-[11px] font-medium py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-30"
              style={{
                backgroundColor: isDarkBg ? '#111' : DIRECTORY_THEME.brand.primary,
                color: DIRECTORY_THEME.brand.text,
              }}
            >
              <div
                className="font-semibold mb-0.5 text-[10px] uppercase"
                style={{ color: DIRECTORY_THEME.text.darkCardMuted }}
              >
                Did not match:
              </div>
              {unmatchedLabels.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
