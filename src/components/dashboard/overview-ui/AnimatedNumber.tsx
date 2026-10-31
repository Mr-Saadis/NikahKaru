import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number | null | undefined;
  duration?: number;
  formatFn?: (val: number) => string;
  className?: string;
  fallback?: string;
}

export function AnimatedNumber({
  value,
  duration = 600,
  formatFn,
  className = '',
  fallback = '—',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const currentValRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === null || value === undefined) {
      return;
    }

    const startVal = currentValRef.current;
    let startTime: number | null = null;

    // Check prefers-reduced-motion
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      animFrameRef.current = requestAnimationFrame(() => {
        currentValRef.current = value;
        setDisplayValue(value);
      });
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (value - startVal) * easeOut);

      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Guarantee exact final value on last frame (M1 requirement)
        currentValRef.current = value;
        setDisplayValue(value);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  if (value === null || value === undefined) {
    return <span className={`tabular-nums ${className}`}>{fallback}</span>;
  }

  const formatted = formatFn ? formatFn(displayValue) : displayValue.toLocaleString();

  return <span className={`tabular-nums ${className}`}>{formatted}</span>;
}

