import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface GaugeSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  dotColor?: string;
  delta?: {
    text: string;
    isPositive: boolean;
    isZero: boolean;
  };
}

interface SemiCircleGaugeProps {
  total: number | string;
  totalCaption?: string;
  segments: GaugeSegment[];
  className?: string;
  ariaLabel?: string;
}

export function SemiCircleGauge({
  total,
  totalCaption,
  segments,
  className = '',
  ariaLabel = 'Gauge distribution chart',
}: SemiCircleGaugeProps) {
  const sumValues = segments.reduce((acc, s) => acc + (s.value || 0), 0);
  const R = 75;
  const cx = 110;
  const cy = 95;
  const arcLength = Math.PI * R; // ~235.619

  // Calculate segment stroke dashes
  let accumulatedLength = 0;
  const renderedSegments = segments.map((seg) => {
    const fraction = sumValues > 0 ? (seg.value || 0) / sumValues : 0;
    const segLength = fraction * arcLength;
    const dashOffset = -accumulatedLength;
    accumulatedLength += segLength;

    return {
      ...seg,
      dashArray: `${Math.max(0, segLength)} ${Math.max(0, arcLength - segLength)}`,
      dashOffset,
    };
  });

  // Base arc path from 180deg (left) to 0deg (right)
  const arcPath = `M ${cx - R},${cy} A ${R},${R} 0 0,1 ${cx + R},${cy}`;

  return (
    <div className={`flex flex-col items-center min-w-0 ${className}`}>
      {/* Semi-circle SVG */}
      <div className="relative w-[220px] h-[115px] shrink-0" aria-label={ariaLabel} role="img">
        <svg viewBox="0 0 220 115" className="w-full h-full overflow-visible">
          {/* Background track arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="#F4EFE7"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Render segments */}
          {sumValues > 0 &&
            renderedSegments.map((seg) => (
              <path
                key={seg.id}
                d={arcPath}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            ))}
        </svg>

        {/* Center Total Content */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
          <span className="text-2xl md:text-3xl font-bold tabular-nums text-[#1E2022] leading-none">
            {total}
          </span>
          {totalCaption && (
            <span className="text-[11px] text-[#7D766C] mt-1 font-medium truncate max-w-[160px]">
              {totalCaption}
            </span>
          )}
        </div>
      </div>

      {/* Rounded Legend Box below */}
      <div className="w-full mt-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#E9E4DC]/80 p-3.5 space-y-2.5 shadow-2xs">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="flex items-center justify-between text-xs gap-2 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.dotColor || seg.color }}
              />
              <span className="text-[#1E2022] font-semibold truncate text-[12.5px]">{seg.label}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-[#1E2022] tabular-nums text-sm">
                {seg.value.toLocaleString()}
              </span>
              {seg.delta && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${
                    seg.delta.isZero
                      ? 'text-[#7D766C]'
                      : seg.delta.isPositive
                      ? 'text-[#1F3B34]'
                      : 'text-[#C86A4A]'
                  }`}
                >
                  {seg.delta.isZero ? (
                    <Minus className="w-2.5 h-2.5" />
                  ) : seg.delta.isPositive ? (
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  ) : (
                    <ArrowDownRight className="w-2.5 h-2.5" />
                  )}
                  {seg.delta.text}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

