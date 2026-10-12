import React from 'react';
import { Check } from 'lucide-react';
import type { FilterMatchDetail } from '@/lib/directory/types';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

interface SimilarWhyProps {
  matchedDetails: FilterMatchDetail[];
  unmatchedLabels: string[];
}

export function SimilarWhy({ matchedDetails, unmatchedLabels }: SimilarWhyProps) {
  const unmatchedCount = unmatchedLabels.length;

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px solid ${DIRECTORY_THEME.borders.divider}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          color: DIRECTORY_THEME.text.muted,
          marginBottom: 8,
        }}
      >
        Shown because
      </div>

      {/* Row of matched chips + unmatched count at the end */}
      <div className="flex flex-wrap items-center gap-1.5">
        {matchedDetails.map((detail) => (
          <span
            key={detail.filterId}
            className="inline-flex items-center gap-1.5 rounded-full"
            style={{
              padding: '5px 12px 5px 9px',
              fontSize: 11.5,
              fontWeight: 600,
              backgroundColor: DIRECTORY_THEME.brand.primary,
              color: DIRECTORY_THEME.brand.text,
            }}
          >
            <Check
              size={12}
              strokeWidth={3}
              style={{ color: DIRECTORY_THEME.amber.iconOnDark }}
              className="shrink-0"
            />
            <span style={{ opacity: 0.65, fontWeight: 500 }}>{detail.filterLabel}</span>
            <span>{detail.valueDisplay}</span>
          </span>
        ))}

        {unmatchedCount > 0 && (
          <div className="relative group inline-flex items-center">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: DIRECTORY_THEME.text.muted,
                cursor: 'help',
              }}
            >
              +{unmatchedCount} not matched
            </span>
            <div
              className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block text-[11px] font-medium py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-30"
              style={{
                backgroundColor: DIRECTORY_THEME.brand.primary,
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
