'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { FilterCard, DARK_CARD } from './FilterCard';
import type { TextFilterConfig } from '@/lib/directory/types';

interface TextFilterProps {
  config: TextFilterConfig;
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  configIndex: number;
}

export function TextFilter({
  config,
  value,
  onChange,
  onClear,
  configIndex,
}: TextFilterProps) {
  const isActive = Boolean(value && value.trim().length > 0);

  return (
    <FilterCard
      id={config.id}
      label={config.label}
      tintHex={config.tintHex}
      isActive={isActive}
      onClear={onClear}
      configIndex={configIndex}
    >
      {/* Pill-shaped search input — dark frosted */}
      <div
        className="relative flex items-center h-[40px] px-[12px] transition-all"
        style={{
          backgroundColor: isActive ? DARK_CARD.controlBgActive : DARK_CARD.controlBg,
          borderRadius: 9999,
          border: `1px solid ${isActive ? DARK_CARD.controlBorderActive : DARK_CARD.controlBorder}`,
        }}
      >
        <Search
          size={13}
          className="shrink-0 mr-2 pointer-events-none"
          style={{ color: isActive ? DARK_CARD.textPrimary : DARK_CARD.iconMuted }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          style={{ color: DARK_CARD.textPrimary }}
          className="w-full h-full bg-transparent text-[13px] font-medium border-0 outline-none"
          // inline style for placeholder since we can't use tailwind dynamic vars
          onFocus={(e) => { e.target.style.caretColor = 'rgba(255,255,255,0.8)'; }}
        />
        <style>{`
          [data-filter-card="${config.id}"] input::placeholder {
            color: ${DARK_CARD.textMuted};
          }
        `}</style>
      </div>
    </FilterCard>
  );
}
