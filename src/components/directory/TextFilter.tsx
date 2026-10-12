'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { FilterCard } from './FilterCard';
import type { TextFilterConfig } from '@/lib/directory/types';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

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
      <div
        className="relative flex items-center h-[38px] px-[10px] rounded-[14px] mt-2 transition-all"
        style={{
          backgroundColor: isActive ? DIRECTORY_THEME.surfaces.white : DIRECTORY_THEME.surfaces.controlBg,
          boxShadow: isActive
            ? `inset 0 0 0 1.5px ${DIRECTORY_THEME.brand.primary}`
            : undefined,
        }}
      >
        <Search
          size={14}
          className="shrink-0 mr-2 pointer-events-none"
          style={{ color: DIRECTORY_THEME.text.subtle }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          style={{
            color: DIRECTORY_THEME.text.body,
          }}
          className={`w-full h-full bg-transparent text-[13px] font-medium border-0 outline-none ${DIRECTORY_THEME.classes.placeholderSubtle}`}
        />
      </div>
    </FilterCard>
  );
}
