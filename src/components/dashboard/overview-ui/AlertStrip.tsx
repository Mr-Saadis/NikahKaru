import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export type AlertStripVariant = 'emerald' | 'amber' | 'rose';

interface AlertStripProps {
  icon: LucideIcon;
  message: React.ReactNode;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: AlertStripVariant;
  className?: string;
}

export function AlertStrip({
  icon: Icon,
  message,
  actionText,
  actionHref,
  onAction,
  variant = 'amber',
  className = '',
}: AlertStripProps) {
  const variantStyles = {
    emerald: {
      container: 'bg-white border-[#E5DED3] text-[#1F1E1B] shadow-[0_2px_10px_rgba(0,0,0,0.03)]',
      iconBox: 'bg-[#E5EFE9] text-[#064e3b]',
      button: 'bg-[#1F3B34] hover:bg-[#172D28] text-white',
    },
    amber: {
      container: 'bg-white border-[#E5DED3] text-[#1F1E1B] shadow-[0_2px_10px_rgba(0,0,0,0.03)]',
      iconBox: 'bg-[#FBF0EC] text-[#C86A4A]',
      button: 'bg-[#1F3B34] hover:bg-[#172D28] text-white',
    },
    rose: {
      container: 'bg-white border-[#E5DED3] text-[#1F1E1B] shadow-[0_2px_10px_rgba(0,0,0,0.03)]',
      iconBox: 'bg-[#FBF0EC] text-[#991B1B]',
      button: 'bg-[#1F1E1B] hover:bg-[#33312C] text-white',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`w-full rounded-[18px] border p-3 md:px-4 md:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${currentVariant.container} ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${currentVariant.iconBox}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="truncate">{message}</div>
      </div>

      {actionText && (actionHref || onAction) && (
        <div className="shrink-0 self-end sm:self-auto">
          {actionHref ? (
            <Link
              href={actionHref}
              className={`rounded-full px-3 py-1 font-semibold text-[11px] inline-flex items-center gap-1 transition-all duration-120 active:scale-98 ${currentVariant.button}`}
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className={`rounded-full px-3 py-1 font-semibold text-[11px] inline-flex items-center gap-1 transition-all duration-120 active:scale-98 cursor-pointer ${currentVariant.button}`}
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

