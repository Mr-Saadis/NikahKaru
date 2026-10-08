'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// useBottomSheet — Height management, drag, scroll-to-resize
// ============================================================

interface UseBottomSheetOptions {
  isOpen: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

interface UseBottomSheetReturn {
  height: number;
  minH: number;
  maxH: number;
  isDragging: boolean;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  grabHandleProps: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
  heroPointerProps: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
  isSnapping: boolean;
}

export function useBottomSheet({
  isOpen,
  containerRef,
  onClose,
}: UseBottomSheetOptions): UseBottomSheetReturn {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [height, setHeight] = useState(0);
  const [minH, setMinH] = useState(0);
  const [maxH, setMaxH] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);

  // Track touch Y for touchmove delta
  const lastTouchY = useRef(0);

  // ── Compute limits ──────────────────────────────────────────
  const computeLimits = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { min: 400, max: 600 };
    const H = el.clientHeight;
    return { min: Math.round(H * 0.6), max: H - 76 };
  }, [containerRef]);

  // ── Open: set initial height ────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const { min, max } = computeLimits();
    setMinH(min);
    setMaxH(max);
    setHeight(min);
  }, [isOpen, computeLimits]);

  // ── Resize handler ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      const { min, max } = computeLimits();
      setMinH(min);
      setMaxH(max);
      setHeight((prev) => Math.min(Math.max(prev, min), max));
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isOpen, computeLimits]);

  // ── Scroll-to-resize (wheel + touch) ────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleWheel = (e: WheelEvent) => {
      const { min, max } = computeLimits();
      const scroll = scrollRef.current;
      const scrollTop = scroll?.scrollTop ?? 0;

      if (e.deltaY > 0) {
        // Scrolling down → grow sheet
        setHeight((prev) => {
          if (prev < max) {
            e.preventDefault();
            return Math.min(prev + Math.abs(e.deltaY), max);
          }
          return prev; // at max, let native scroll
        });
      } else {
        // Scrolling up → if content is at top, shrink sheet
        setHeight((prev) => {
          if (scrollTop <= 0 && prev > min) {
            e.preventDefault();
            return Math.max(prev - Math.abs(e.deltaY), min);
          }
          return prev;
        });
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const { min, max } = computeLimits();
      const scroll = scrollRef.current;
      const scrollTop = scroll?.scrollTop ?? 0;
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY.current - currentY; // positive = finger moving up = scroll down
      lastTouchY.current = currentY;

      if (deltaY > 0) {
        setHeight((prev) => {
          if (prev < max) {
            e.preventDefault();
            return Math.min(prev + Math.abs(deltaY), max);
          }
          return prev;
        });
      } else {
        setHeight((prev) => {
          if (scrollTop <= 0 && prev > min) {
            e.preventDefault();
            return Math.max(prev - Math.abs(deltaY), min);
          }
          return prev;
        });
      }
    };

    sheet.addEventListener('wheel', handleWheel, { passive: false });
    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      sheet.removeEventListener('wheel', handleWheel);
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, computeLimits]);

  // ── Drag handle ─────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't drag from buttons or links
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) return;

      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      setIsDragging(true);
      setIsSnapping(false);

      const startY = e.clientY;
      const startHeight = height;
      const { min, max } = computeLimits();
      const minDrag = Math.round((containerRef.current?.clientHeight ?? 600) * 0.25);

      const onMove = (me: PointerEvent) => {
        const delta = startY - me.clientY;
        const newH = Math.max(minDrag, Math.min(startHeight + delta, max));
        setHeight(newH);
      };

      const onUp = (ue: PointerEvent) => {
        el.releasePointerCapture(ue.pointerId);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        setIsDragging(false);

        const finalH = startHeight + (startY - ue.clientY);
        if (finalH < min * 0.72) {
          onClose();
        } else {
          setIsSnapping(true);
          const mid = (min + max) / 2;
          setHeight(finalH > mid ? max : min);
          setTimeout(() => setIsSnapping(false), 500);
        }
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
    },
    [height, computeLimits, containerRef, onClose],
  );

  return {
    height,
    minH,
    maxH,
    isDragging,
    sheetRef,
    scrollRef,
    grabHandleProps: { onPointerDown },
    heroPointerProps: { onPointerDown },
    isSnapping,
  };
}
