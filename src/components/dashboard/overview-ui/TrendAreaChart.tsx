import React, { useState } from 'react';
import type { AdminTrendPoint } from '@/lib/types/overview.types';
import { Calendar } from 'lucide-react';

interface TrendAreaChartProps {
  data: AdminTrendPoint[];
  className?: string;
  ariaLabel?: string;
}

export function TrendAreaChart({
  data,
  className = '',
  ariaLabel = 'Weekly activity trend chart',
}: TrendAreaChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-[#7D766C]">
        No trend data available for this range
      </div>
    );
  }

  // Calculate SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Maximum value for scaling
  const maxVal = Math.max(
    5,
    ...data.flatMap((d) => [d.profiles || 0, d.requests || 0])
  );
  const roundedMax = Math.ceil(maxVal / 5) * 5;

  const getX = (idx: number) => {
    if (data.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, roundedMax));
    return paddingTop + chartH - (clamped / roundedMax) * chartH;
  };

  // Generate SVG paths for profiles and requests
  const profilesPoints = data.map((d, i) => `${getX(i)},${getY(d.profiles || 0)}`);
  const requestsPoints = data.map((d, i) => `${getX(i)},${getY(d.requests || 0)}`);

  const profilesLine = `M ${profilesPoints.join(' L ')}`;
  const requestsLine = `M ${requestsPoints.join(' L ')}`;

  const profilesArea = `${profilesLine} L ${getX(data.length - 1)},${
    paddingTop + chartH
  } L ${getX(0)},${paddingTop + chartH} Z`;
  const requestsArea = `${requestsLine} L ${getX(data.length - 1)},${
    paddingTop + chartH
  } L ${getX(0)},${paddingTop + chartH} Z`;

  // Horizontal grid lines (4 lines)
  const gridSteps = [0, 0.33, 0.66, 1];

  const activeItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className={`relative flex flex-col min-w-0 ${className}`}>
      {/* Top Legend */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1F3B34]" />
            <span className="text-[#1E2022] font-medium">Profiles Created</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C86A4A]" />
            <span className="text-[#1E2022] font-medium">Requests Submitted</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label={ariaLabel}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Soft vertical fade gradients under lines */}
            <linearGradient id="profilesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F3B34" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1F3B34" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C86A4A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#C86A4A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & labels */}
          {gridSteps.map((step) => {
            const val = Math.round(step * roundedMax);
            const y = paddingTop + chartH - step * chartH;
            return (
              <g key={step}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E9E4DC"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#7D766C"
                  className="tabular-nums font-medium"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fills */}
          <path d={profilesArea} fill="url(#profilesGrad)" />
          <path d={requestsArea} fill="url(#requestsGrad)" />

          {/* Lines */}
          <path
            d={profilesLine}
            fill="none"
            stroke="#1F3B34"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={requestsLine}
            fill="none"
            stroke="#C86A4A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive vertical hover indicator */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={paddingTop + chartH}
                stroke="#A49C8F"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              {/* Point on profiles line */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex]?.profiles || 0)}
                r="4.5"
                fill="#1F3B34"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Point on requests line */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex]?.requests || 0)}
                r="4.5"
                fill="#C86A4A"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Transparent interactive columns for hover detection */}
          {data.map((_, i) => (
            <rect
              key={i}
              x={getX(i) - chartW / (data.length * 2)}
              y={paddingTop}
              width={chartW / data.length}
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {/* X-axis date labels */}
          {data.map((d, i) => {
            // Show every label if <= 7 items, otherwise show every 2nd or 3rd
            const showLabel = data.length <= 8 || i % 2 === 0 || i === data.length - 1;
            if (!showLabel) return null;
            const label = d.week ? new Date(d.week).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : `W${i + 1}`;
            return (
              <text
                key={i}
                x={getX(i)}
                y={svgHeight - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#7D766C"
                className="font-medium"
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeItem && hoverIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none bg-white rounded-xl border border-[#E9E4DC] shadow-md p-2.5 text-xs transition-transform duration-75"
            style={{
              left: `${Math.min(
                Math.max(10, (getX(hoverIndex) / svgWidth) * 100),
                70
              )}%`,
              top: '15px',
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[#1E2022] mb-1.5 pb-1 border-b border-[#E9E4DC]">
              <Calendar className="w-3.5 h-3.5 text-[#7D766C]" />
              <span>
                {activeItem.week
                  ? new Date(activeItem.week).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Current Period'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7D766C] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1F3B34]" />
                  Profiles:
                </span>
                <span className="font-bold text-[#1E2022] tabular-nums">
                  {activeItem.profiles || 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#7D766C] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C86A4A]" />
                  Requests:
                </span>
                <span className="font-bold text-[#1E2022] tabular-nums">
                  {activeItem.requests || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screen Reader Accessible Data Alternative */}
      <table className="sr-only">
        <caption>Weekly Activity Summary</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Profiles Created</th>
            <th scope="col">Requests Submitted</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.week}</td>
              <td>{d.profiles || 0}</td>
              <td>{d.requests || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
