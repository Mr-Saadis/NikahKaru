import React, { useEffect, useState } from 'react';

interface RadialProgressRingProps {
  stepsDone: number;
  stepsTotal: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  missing?: string[];
  showLabel?: boolean;
  className?: string;
}

export function RadialProgressRing({
  stepsDone,
  stepsTotal = 8,
  size = 34,
  strokeWidth = 3.5,
  color = '#1F3B34',
  trackColor = '#E9E4DC',
  missing,
  showLabel = true,
  className = '',
}: RadialProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState<number>(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedDone = Math.max(0, Math.min(stepsDone, stepsTotal));
  const targetPct = stepsTotal > 0 ? clampedDone / stepsTotal : 0;

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const timer = setTimeout(() => {
        setAnimatedProgress(targetPct);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setAnimatedProgress(targetPct);
    }, 40);

    return () => clearTimeout(timer);
  }, [targetPct]);

  const strokeDashoffset = circumference - animatedProgress * circumference;
  const tooltipText =
    missing && missing.length > 0
      ? `Completion: ${stepsDone}/${stepsTotal} (Missing: ${missing.join(', ')})`
      : `Completion: ${stepsDone}/${stepsTotal} (Complete)`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 cursor-help ${className}`}
      title={tooltipText}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] overflow-visible"
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-[#1E2022] select-none">
          {clampedDone}/{stepsTotal}
        </span>
      )}
    </div>
  );
}

