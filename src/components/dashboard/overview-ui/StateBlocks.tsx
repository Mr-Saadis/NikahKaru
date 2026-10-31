import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export function SkeletonBlock({
  className = '',
  height = 'h-4',
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`bg-[#E9E4DC] rounded-xl ${height} ${className}`}
      aria-hidden="true"
    />
  );
}

export function OverviewSkeleton() {
  return (
    <div className="w-full min-w-0 space-y-5" aria-label="Loading overview data">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-5 border-b border-[#E9E4DC]/60">
        <div className="h-8 w-44 bg-[#E9E4DC] rounded-full" />
        <div className="h-8 w-60 bg-[#E9E4DC] rounded-full" />
      </div>

      {/* KPI Cards row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 space-y-3"
          >
            <div className="h-4 w-20 bg-[#E9E4DC] rounded-md" />
            <div className="h-8 w-16 bg-[#E9E4DC] rounded-md" />
            <div className="h-3 w-28 bg-[#E9E4DC] rounded-md" />
          </div>
        ))}
      </div>

      {/* Main cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 space-y-4">
          <div className="h-6 w-36 bg-[#E9E4DC] rounded-md" />
          <div className="h-48 w-full bg-[#FAF8F5] rounded-xl" />
        </div>
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 space-y-4">
          <div className="h-6 w-36 bg-[#E9E4DC] rounded-md" />
          <div className="h-48 w-full bg-[#FAF8F5] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function EmptyBlock({
  message = 'No data available',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`py-8 text-center text-xs md:text-sm text-[#7D766C] font-medium ${className}`}
    >
      {message}
    </div>
  );
}

export function ErrorBlock({
  message = 'Failed to load data',
  onRetry,
  className = '',
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-rose-200 bg-rose-50/60 p-6 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="text-sm font-semibold text-rose-800">{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full px-4 py-1.5 text-xs font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 shadow-2xs transition-colors duration-120"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

export function UntrackedBox({
  message = 'Not tracked yet',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-[#E9E4DC] bg-[#FAF8F5] p-6 text-center text-xs text-[#7D766C] font-medium ${className}`}
    >
      {message}
    </div>
  );
}

