import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface OverviewCardProps {
  icon?: LucideIcon;
  title?: string;
  badge?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function OverviewCard({
  icon: Icon,
  title,
  badge,
  rightAction,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}: OverviewCardProps) {
  const hasHeader = Boolean(title || Icon || rightAction);

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md flex flex-col min-w-0 ${className}`}
    >
      {hasHeader && (
        <div className={`flex items-center justify-between gap-3 mb-4 shrink-0 ${headerClassName}`}>
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <div className="w-6 h-6 rounded-full bg-[#FAF8F5] flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#7D766C]" />
              </div>
            )}
            {title && (
              <h2 className="text-[14px] md:text-[15px] font-semibold text-[#1E2022] tracking-tight truncate">
                {title}
              </h2>
            )}
            {badge}
          </div>
          {rightAction && <div className="flex items-center gap-2 shrink-0">{rightAction}</div>}
        </div>
      )}
      <div className={`flex-1 min-w-0 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
