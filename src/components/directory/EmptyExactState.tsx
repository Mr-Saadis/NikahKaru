import React from 'react';
import { Search } from 'lucide-react';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

interface EmptyExactStateProps {
  similarCount: number;
  onShowSimilar: () => void;
}

export function EmptyExactState({ similarCount, onShowSimilar }: EmptyExactStateProps) {
  return (
    <div
      style={{
        backgroundColor: DIRECTORY_THEME.surfaces.white,
        borderRadius: 26,
        padding: 32,
        border: `1px solid ${DIRECTORY_THEME.borders.soft}`,
        boxShadow: DIRECTORY_THEME.shadows.panel,
      }}
      className="text-center flex flex-col items-center justify-center my-6"
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: DIRECTORY_THEME.surfaces.white,
          border: `1px solid ${DIRECTORY_THEME.borders.main}`,
          color: DIRECTORY_THEME.text.subtle,
          boxShadow: DIRECTORY_THEME.shadows.emptyCard,
        }}
        className="flex items-center justify-center mb-3"
      >
        <Search size={20} />
      </div>

      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: DIRECTORY_THEME.text.title,
          marginBottom: 6,
        }}
      >
        No exact matches found
      </h3>

      <p
        style={{
          fontSize: 12.5,
          color: DIRECTORY_THEME.text.muted,
          maxWidth: 360,
          marginBottom: 16,
        }}
      >
        No profiles match all of your selected filters simultaneously. You can relax criteria or explore similar profiles.
      </p>

      {similarCount > 0 && (
        <button
          type="button"
          onClick={onShowSimilar}
          style={{
            height: 38,
            padding: '0 20px',
            fontSize: 13,
            fontWeight: 600,
            backgroundColor: DIRECTORY_THEME.brand.primary,
            color: DIRECTORY_THEME.brand.text,
            boxShadow: DIRECTORY_THEME.shadows.btnBrand,
          }}
          className={`inline-flex items-center gap-2 rounded-full ${DIRECTORY_THEME.classes.hoverBrandBg} transition-all active:scale-98`}
        >
          <span>Show {similarCount} similar</span>
        </button>
      )}
    </div>
  );
}
