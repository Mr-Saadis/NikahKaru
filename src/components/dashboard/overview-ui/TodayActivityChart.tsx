'use client';

import React from 'react';

// ─── Exported Types as required by STEP 1 ───
export interface TodayActivityItem {
  key: string;
  label: string;
  count: number;
}

export interface TodayActivity {
  day_start: string;
  total: number;
  items: TodayActivityItem[];
}

export interface TodayActivityChartProps {
  data?: TodayActivity | null;
  isLoading?: boolean;
  error?: {
    message: string;
    code?: string;
    details?: string;
  } | null;
  onRetry?: () => void;
  className?: string;
}

// ─── Flat Brand Green Palette (Darkest → Lightest) ───
// Flat solid colours — no gradients (strict rule)
export const ARC_COLORS = [
  '#064E3B', // 1st (outermost, largest count): Deep Forest Green
  '#166534', // 2nd: Forest Green
  '#15803D', // 3rd: Medium Forest Green
  '#16A34A', // 4th: Emerald Green
  '#4ADE80', // 5th (innermost, smallest count): Light Sage Green
] as const;

export const TRACK_COLOR = '#F3F4F6'; // Flat light grey background track
export const ZERO_SWATCH_COLOR = '#D1D5DB'; // Muted grey square swatch for 0 count

// ─── 5 Fixed Keys in Order ───
export const FIXED_ACTIVITY_KEYS = [
  'profiles_added',
  'new_requests',
  'second_requests',
  'responded',
  'completed',
] as const;

export const DEFAULT_ACTIVITY_LABELS: Record<string, string> = {
  profiles_added: 'Profiles added',
  new_requests: 'Requests sent',
  second_requests: 'Second requests',
  responded: 'Manager responded',
  completed: 'Completed',
};

/**
 * Format day_start strictly in Asia/Karachi timezone
 * Example: "Sunday, 1 November"
 * Uses day_start only — NEVER browser local date
 */
export function formatKarachiDateFromDayStart(dayStart?: string | null): string {
  if (!dayStart) return '—';
  try {
    const d = new Date(dayStart);
    if (isNaN(d.getTime())) return '—';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).formatToParts(d);
    const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    return `${weekday}, ${day} ${month}`;
  } catch {
    return '—';
  }
}

/**
 * Polar coordinate conversion for SVG arcs starting at 12 o'clock and moving clockwise.
 * 0° = 12 o'clock (top)
 * 90° = 3 o'clock (right)
 * 180° = 6 o'clock (bottom)
 * 270° = 9 o'clock (left)
 */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  };
}

/**
 * Generate SVG path for an arc starting at 12 o'clock (cx, cy - r)
 * sweeping clockwise by sweepDeg (up to 270 degrees).
 */
function describeArc(cx: number, cy: number, r: number, sweepDeg: number): string {
  const sweep = Math.min(Math.max(sweepDeg, 0), 270);
  const end = polarToCartesian(cx, cy, r, sweep);
  const largeArcFlag = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function TodayActivityChart({
  data,
  isLoading = false,
  error = null,
  onRetry,
  className = '',
}: TodayActivityChartProps) {
  // ─── 1. SKELETON STATE (Static flat grey, no shimmer/pulse/gradients) ───
  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 flex flex-col min-w-0 w-full font-sans ${className}`}
      >
        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <div className="h-5 w-32 bg-[#E9E4DC] rounded" />
          <div className="h-4 w-44 bg-[#E9E4DC] rounded" />
        </div>
        <div className="flex flex-col min-[700px]:flex-row items-center justify-center gap-10 w-full min-w-0 py-4">
          <div className="w-full max-w-[420px] h-[300px] bg-[#FAF8F5] rounded-xl flex items-center justify-center min-w-0">
            <div className="w-48 h-48 rounded-full border-8 border-[#E9E4DC] border-t-transparent" />
          </div>
          <div className="w-full max-w-[420px] flex flex-col gap-3 min-w-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-[#FAF8F5] rounded border border-[#E9E4DC]/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. ERROR STATE (Message + Retry button) ───
  if (error) {
    return (
      <div
        className={`bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 flex flex-col min-w-0 w-full font-sans ${className}`}
      >
        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <h2 className="text-[14px] md:text-[15px] font-semibold text-[#1E2022] tracking-tight">
            Today&apos;s activity
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center min-w-0">
          <p className="text-[13px] font-medium text-[#C86A4A] mb-3">
            {error.message || 'Unable to load today’s activity'}
          </p>
          {error.details && (
            <p className="text-[11px] text-[#7D766C] mb-3 max-w-md">{error.details}</p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-full px-4 py-1.5 border border-[#1F3B34] text-[#1F3B34] hover:bg-[#1F3B34] hover:text-white text-xs font-semibold transition-colors duration-120 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── 3. DATA PROCESSING ───
  const rawItems = data?.items || [];
  const dayStart = data?.day_start || null;
  const totalActions = data?.total ?? 0;
  const formattedDate = formatKarachiDateFromDayStart(dayStart);

  // Normalize all 5 items in fixed order
  const fixedList = FIXED_ACTIVITY_KEYS.map((key, originalIndex) => {
    const found = rawItems.find((it) => it.key === key);
    return {
      key,
      label: found?.label || DEFAULT_ACTIVITY_LABELS[key] || key,
      count: found ? Math.max(0, Number(found.count) || 0) : 0,
      originalIndex,
    };
  });

  // Only items with count > 0 are drawn in the chart
  const nonZeroItems = fixedList.filter((it) => it.count > 0);

  // Sort by count descending (largest = outermost, darkest).
  // Ties broken by originalIndex for stable, deterministic ordering.
  const sortedDrawnItems = [...nonZeroItems].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.originalIndex - b.originalIndex;
  });

  // Map each drawn item to its arc color
  const itemColorMap = new Map<string, string>();
  sortedDrawnItems.forEach((it, idx) => {
    itemColorMap.set(it.key, ARC_COLORS[idx] || ARC_COLORS[ARC_COLORS.length - 1]);
  });

  // Arc length computation:
  // count / max(5, largest count) of the 270 degree track, minimum visible sweep 8 degrees
  const largestCount = sortedDrawnItems.length > 0 ? sortedDrawnItems[0].count : 0;
  const denominator = Math.max(5, largestCount);

  // SVG Geometry Constants
  // Center (cx, cy) chosen to leave ample room on the left for right-aligned labels
  const svgWidth = 420;
  const svgHeight = 340;
  const cx = 225;
  const cy = 175;
  const strokeWidth = 14;
  const gap = 6;
  const step = strokeWidth + gap; // 20px
  const baseOuterRadius = 130; // Outermost arc radius

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E9E4DC]/80 shadow-xs p-5 flex flex-col min-w-0 w-full font-sans ${className}`}
    >
      {/* ─── CARD HEADER ─── */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <h2 className="text-[14px] md:text-[15px] font-semibold text-[#1E2022] tracking-tight">
          Today&apos;s activity
        </h2>
        <div className="text-[13px] text-[#7D766C] shrink-0 font-medium">
          <span>{formattedDate}</span>
          <span className="mx-2 text-[#C4BEB4]">/</span>
          <span className="font-bold text-[#1E2022]">{totalActions} actions</span>
        </div>
      </div>

      {/* ─── CARD BODY: CHART (LEFT) + LIST (RIGHT) ─── */}
      <div className="flex flex-col min-[700px]:flex-row items-center justify-center gap-10 w-full min-w-0">
        {/* Left: Concentric 270° SVG Arcs */}
        <div className="w-full max-w-[420px] flex justify-center items-center min-w-0">
          {sortedDrawnItems.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] w-full text-center">
              <span className="text-[13px] font-medium text-[#7D766C]">No activity yet today</span>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-w-[420px] select-none"
              style={{ overflow: 'visible' }}
              aria-label="Today's Activity Radial Chart"
            >
              {sortedDrawnItems.map((item, idx) => {
                const r = baseOuterRadius - idx * step;
                const arcColor = itemColorMap.get(item.key) || ARC_COLORS[idx] || ARC_COLORS[0];
                const sweepDeg = Math.min(270, Math.max(8, (item.count / denominator) * 270));
                const labelX = cx - 14;
                const labelY = cy - r;

                return (
                  <g key={item.key}>
                    {/* Background Full Track (270 degrees, clockwise from 12 o'clock to 9 o'clock) */}
                    <path
                      d={describeArc(cx, cy, r, 270)}
                      fill="none"
                      stroke={TRACK_COLOR}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />

                    {/* Active Drawn Arc */}
                    <path
                      d={describeArc(cx, cy, r, sweepDeg)}
                      fill="none"
                      stroke={arcColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />

                    {/* Right-aligned label at the start of each arc on its left */}
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="end"
                      dominantBaseline="central"
                      className="font-sans"
                    >
                      <tspan fill="#4E473D" fontSize="11.5" fontWeight="500">
                        {item.label}
                      </tspan>
                      <tspan fill="#1E2022" fontSize="11.5" fontWeight="700">
                        {' '}{item.count}
                      </tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Right: List of all 5 items in fixed order */}
        <div className="w-full max-w-[420px] flex flex-col justify-center min-w-0 divide-y divide-[#F4EFE7]">
          {fixedList.map((item) => {
            const isDrawn = item.count > 0;
            const swatchColor = isDrawn
              ? itemColorMap.get(item.key) || ARC_COLORS[0]
              : ZERO_SWATCH_COLOR;

            return (
              <div
                key={item.key}
                className="flex items-center justify-between py-2.5 min-w-0 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Flat colour swatch square (not a circle) */}
                  <div
                    className="w-3 h-3 rounded-[2px] shrink-0"
                    style={{ backgroundColor: swatchColor }}
                  />
                  <span
                    className={`text-[13px] truncate ${
                      isDrawn ? 'font-semibold text-[#1E2022]' : 'font-medium text-[#9CA3AF]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                <span
                  className={`text-[13px] tabular-nums shrink-0 ml-3 ${
                    isDrawn ? 'font-bold text-[#1E2022]' : 'font-medium text-[#9CA3AF]'
                  }`}
                >
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
