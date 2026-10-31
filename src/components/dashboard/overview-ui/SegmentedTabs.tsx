import React from 'react';

export interface TabItem<T = string | number> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedTabsProps<T = string | number> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedTabs<T extends string | number>({
  tabs,
  activeId,
  onChange,
  className = '',
  size = 'sm',
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`rounded-full bg-[#F4EFE7] p-1 inline-flex items-center gap-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={String(tab.id)}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`rounded-full transition-all duration-120 flex items-center gap-1.5 shrink-0 ${
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs'
            } ${
              isActive
                ? 'bg-white text-[#1E2022] font-semibold shadow-xs'
                : 'text-[#7D766C] hover:text-[#1E2022] font-medium'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-semibold leading-none ${
                  isActive ? 'bg-[#FAF8F5] text-[#1F3B34]' : 'bg-[#E9E4DC] text-[#7D766C]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

