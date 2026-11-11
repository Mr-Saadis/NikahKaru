'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 4,
    width: 44,
    opacity: 0,
  });
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const updateIndicator = () => {
      const currentBtn = buttonRefs.current[String(activeId)];
      if (currentBtn) {
        setIndicatorStyle({
          left: currentBtn.offsetLeft,
          width: currentBtn.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 40);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeId, tabs]);

  return (
    <div
      role="tablist"
      className={`relative inline-flex items-center p-1 rounded-full bg-[#EFEAE2] border border-[#DDD6C8] shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.06)] ${className}`}
    >
      {/* Smooth Gliding Sunken Pill Indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-[#E1DAD0] shadow-[inset_0_2px_4px_rgba(0,0,0,0.14),inset_0_1px_1px_rgba(0,0,0,0.06)] border border-[#C5BAA7] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0.85,0.25,1)]"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
        }}
      />

      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={String(tab.id)}
            ref={(el) => {
              buttonRefs.current[String(tab.id)] = el;
            }}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 rounded-full transition-colors duration-200 flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer ${
              size === 'sm' ? 'px-3.5 py-1 text-xs' : 'px-4 py-1.5 text-xs'
            } ${
              isActive
                ? 'text-[#1E2022] font-bold'
                : 'text-[#8C8477] hover:text-[#1E2022] font-medium'
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

