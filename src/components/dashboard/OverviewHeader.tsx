'use client';

import React from 'react';
import NotificationDropdown from '@/components/NotificationDropdown';

interface OverviewHeaderProps {
  title: string;
  subtitle?: string;
  stats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
}

export default function OverviewHeader({
  title,
  subtitle,
  stats,
}: OverviewHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E9E4DC]">
      {/* Left Title + Subtitle */}
      <div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: -0.6,
            color: '#1F3B34',
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[#7D766C] font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Stats Row + Notification Icon (Native Document Flow) */}
      <div className="flex items-end gap-6 shrink-0">
        {stats && stats.length > 0 && (
          <div className="hidden min-[900px]:flex items-end gap-[32px]">
            {stats.map((item) => (
              <div key={item.label} className="text-right">
                <div style={{ fontSize: 11, color: '#A3B18A', fontWeight: 500 }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: -0.8,
                    lineHeight: 1.1,
                    color: item.color || '#1F3B34',
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="hidden min-[900px]:block pb-0.5 border-l border-[#E9E4DC] pl-5">
          <NotificationDropdown
            btnClass="group flex items-center justify-center cursor-pointer text-[#1F3B34] hover:opacity-75 transition-opacity bg-transparent border-none relative w-9 h-9 rounded-full hover:bg-[#1F3B34]/5"
            iconClass="animate-ding-dong-hover"
            iconSize={21}
          />
        </div>
      </div>
    </div>
  );
}
