
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { FilterCard, DARK_CARD } from './FilterCard';
import type { NumericFilterConfig, NumericFilterValue } from '@/lib/directory/types';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';
import {
  formatNumericSummary,
  formatHeight,
  parseHeightInput,
} from '@/lib/directory/filters';

interface NumericFilterProps {
  config: NumericFilterConfig;
  value: NumericFilterValue;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onChange: (newVal: NumericFilterValue) => void;
  onClear: () => void;
  configIndex: number;
}

export function NumericFilter({
  config,
  value,
  isExpanded,
  onToggleExpand,
  onClose,
  onChange,
  onClear,
  configIndex,
}: NumericFilterProps) {
  const { min, max } = value;
  const isActive = min !== null || max !== null;
  // Dark card frosted control bg
  const controlBg = isActive ? DARK_CARD.controlBgActive : DARK_CARD.controlBg;
  const borderColor = isActive ? DARK_CARD.controlBorderActive : DARK_CARD.controlBorder;

  const cardContainerRef = useRef<HTMLDivElement>(null);
  const minInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      cardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isExpanded]);

  // Local draft text states while typing
  const [minDraft, setMinDraft] = useState<string | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);

  // Derived display values when not actively typing draft
  const defaultMinText =
    min === null ? '' : config.isHeight ? formatHeight(min) : String(min);
  const defaultMaxText =
    max === null ? '' : config.isHeight ? formatHeight(max) : String(max);

  const minInputText = minDraft !== null ? minDraft : defaultMinText;
  const maxInputText = maxDraft !== null ? maxDraft : defaultMaxText;

  // Stepper handlers
  const handleMinStep = (direction: 1 | -1) => {
    setMinDraft(null);
    if (direction === 1) {
      if (min === null) {
        onChange({ ...value, min: config.min });
      } else {
        const nextMin = min + config.step;
        if (nextMin <= config.max) {
          onChange({
            min: nextMin,
            max: max !== null && max < nextMin ? nextMin : max,
          });
        }
      }
    } else {
      if (min === null) return;
      const nextMin = min - config.step;
      if (nextMin < config.min) {
        onChange({ ...value, min: null });
      } else {
        onChange({ ...value, min: nextMin });
      }
    }
  };

  const handleMaxStep = (direction: 1 | -1) => {
    setMaxDraft(null);
    if (direction === -1) {
      if (max === null) {
        onChange({ ...value, max: config.max });
      } else {
        const nextMax = max - config.step;
        if (nextMax >= config.min) {
          onChange({
            max: nextMax,
            min: min !== null && min > nextMax ? nextMax : min,
          });
        }
      }
    } else {
      if (max === null) return;
      const nextMax = max + config.step;
      if (nextMax > config.max) {
        onChange({ ...value, max: null });
      } else {
        onChange({ ...value, max: nextMax });
      }
    }
  };

  const commitMinInput = (text: string) => {
    setMinDraft(null);
    const trimmed = text.trim();
    if (!trimmed || trimmed.toLowerCase() === 'any') {
      onChange({ ...value, min: null });
      return;
    }

    if (config.isHeight) {
      const parsed = parseHeightInput(trimmed);
      if (parsed !== null && parsed >= config.min && parsed <= config.max) {
        onChange({
          min: parsed,
          max: max !== null && max < parsed ? parsed : max,
        });
      }
      return;
    }

    const n = Number(trimmed);
    if (!isNaN(n) && n >= config.min && n <= config.max) {
      onChange({
        min: n,
        max: max !== null && max < n ? n : max,
      });
    }
  };

  const commitMaxInput = (text: string) => {
    setMaxDraft(null);
    const trimmed = text.trim();
    if (!trimmed || trimmed.toLowerCase() === 'any') {
      onChange({ ...value, max: null });
      return;
    }

    if (config.isHeight) {
      const parsed = parseHeightInput(trimmed);
      if (parsed !== null && parsed >= config.min && parsed <= config.max) {
        onChange({
          max: parsed,
          min: min !== null && min > parsed ? parsed : min,
        });
      }
      return;
    }

    const n = Number(trimmed);
    if (!isNaN(n) && n >= config.min && n <= config.max) {
      onChange({
        max: n,
        min: min !== null && min > n ? n : min,
      });
    }
  };

  const summary = formatNumericSummary(
    value,
    config.unit,
    config.isHeight,
    config.isIncome
  );

  return (
    <div ref={cardContainerRef}>
      <FilterCard
        id={config.id}
        label={config.label}
        unit={config.isHeight ? undefined : config.unit}
        tintHex={config.tintHex}
        isActive={isActive}
        isOpen={isExpanded}
        isExpandable={true}
        onClear={() => {
          setMinDraft(null);
          setMaxDraft(null);
          onClear();
        }}
        onHeaderClick={onToggleExpand}
        configIndex={configIndex}
      >
        {/* Control Row: height 38px, radius 14px, padding 0 10px, mt 8px */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand();
            }
          }}
          className="flex items-center justify-between h-[40px] px-[12px] cursor-pointer transition-all outline-none"
          style={{
            backgroundColor: isExpanded ? DARK_CARD.controlBgExpanded : controlBg,
            borderRadius: 9999,
            border: `1px solid ${isExpanded ? DARK_CARD.controlBorderActive : borderColor}`,
          }}
        >
          <span
            className={`text-[13px] truncate ${isActive ? 'font-semibold' : 'font-medium'}`}
            style={{
              color: isActive ? DARK_CARD.textPrimary : DARK_CARD.textMuted,
            }}
          >
            {summary}
          </span>

          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            style={{ color: DARK_CARD.iconMuted }}
          />
        </div>

        {/* ── EXPANDING CONTAINER ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.35s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div
              style={{
                marginTop: 8,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.22)',
                border: '1px solid rgba(255,255,255,0.10)',
                padding: '12px 14px 10px',
              }}
            >
              <div className="flex flex-col gap-2">
                {/* Min Row */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{ letterSpacing: '0.6px', color: 'rgba(255,255,255,0.50)' }}
                  >
                    Min
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Stepper - */}
                    <button
                      type="button"
                      onClick={() => handleMinStep(-1)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                      className="w-[34px] h-[34px] rounded-full hover:bg-white/25 active:scale-[0.92] flex items-center justify-center text-[18px] leading-none transition-all focus:outline-none"
                      title="Decrease Min"
                    >
                      −
                    </button>

                    {/* Input: 76×36, radius 12px, centred, 14px 600 */}
                    <input
                      ref={minInputRef}
                      type="text"
                      value={minInputText}
                      placeholder="Any"
                      onChange={(e) => setMinDraft(e.target.value)}
                      onBlur={(e) => commitMinInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitMinInput(e.currentTarget.value);
                        if (e.key === 'Escape') onClose();
                      }}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.22)',
                        color: 'rgba(255,255,255,0.92)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        caretColor: 'rgba(255,255,255,0.8)',
                      }}
                      className="w-[72px] h-[34px] text-center rounded-[10px] text-[14px] font-semibold border-0 outline-none transition-all placeholder:text-[rgba(255,255,255,0.35)]"
                    />

                    {/* Stepper + */}
                    <button
                      type="button"
                      onClick={() => handleMinStep(1)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                      className="w-[34px] h-[34px] rounded-full hover:bg-white/25 active:scale-[0.92] flex items-center justify-center text-[18px] leading-none transition-all focus:outline-none"
                      title="Increase Min"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Max Row */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{ letterSpacing: '0.6px', color: 'rgba(255,255,255,0.50)' }}
                  >
                    Max
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Stepper - */}
                    <button
                      type="button"
                      onClick={() => handleMaxStep(-1)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                      className="w-[34px] h-[34px] rounded-full hover:bg-white/25 active:scale-[0.92] flex items-center justify-center text-[18px] leading-none transition-all focus:outline-none"
                      title="Decrease Max"
                    >
                      −
                    </button>

                    {/* Input: 76×36, radius 12px, centred, 14px 600 */}
                    <input
                      type="text"
                      value={maxInputText}
                      placeholder="Any"
                      onChange={(e) => setMaxDraft(e.target.value)}
                      onBlur={(e) => commitMaxInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitMaxInput(e.currentTarget.value);
                        if (e.key === 'Escape') onClose();
                      }}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.22)',
                        color: 'rgba(255,255,255,0.92)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        caretColor: 'rgba(255,255,255,0.8)',
                      }}
                      className="w-[72px] h-[34px] text-center rounded-[10px] text-[14px] font-semibold border-0 outline-none transition-all placeholder:text-[rgba(255,255,255,0.35)]"
                    />

                    {/* Stepper + */}
                    <button
                      type="button"
                      onClick={() => handleMaxStep(1)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                      className="w-[34px] h-[34px] rounded-full hover:bg-white/25 active:scale-[0.92] flex items-center justify-center text-[18px] leading-none transition-all focus:outline-none"
                      title="Increase Max"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FilterCard>
    </div>
  );
}
