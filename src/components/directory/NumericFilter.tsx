
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { FilterCard } from './FilterCard';
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
  const isWhiteTint = config.tintHex.toUpperCase() === DIRECTORY_THEME.surfaces.white;
  const controlBg = isWhiteTint
    ? DIRECTORY_THEME.surfaces.controlBgWhiteCard
    : DIRECTORY_THEME.surfaces.controlBg;

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
          className="flex items-center justify-between h-[38px] px-[10px] rounded-[14px] mt-2 cursor-pointer transition-all outline-none hover:bg-white focus:bg-white"
          style={{
            backgroundColor: isExpanded || isActive ? DIRECTORY_THEME.surfaces.white : controlBg,
            boxShadow: isExpanded
              ? `inset 0 0 0 2px ${DIRECTORY_THEME.brand.primary}`
              : isActive
              ? `inset 0 0 0 1.5px ${DIRECTORY_THEME.brand.primary}`
              : undefined,
          }}
        >
          <span
            className={`text-[13px] truncate ${isActive ? 'font-bold' : 'font-medium'}`}
            style={{
              color: isActive ? DIRECTORY_THEME.brand.darkestText : DIRECTORY_THEME.text.subtle,
            }}
          >
            {summary}
          </span>

          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            style={{ color: DIRECTORY_THEME.text.muted }}
          />
        </div>

        {/* ── EXPANDING CONTAINER (Strict 3-tier leak-free structure) ── */}
        {/* Tier 1: Grid wrapper with 0fr -> 1fr animation */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.4s cubic-bezier(.22,1,.36,1)',
          }}
        >
          {/* Tier 2: Clip wrapper (overflow:hidden; min-height:0; NO vertical padding/margin) */}
          <div
            style={{
              overflow: 'hidden',
              minHeight: 0,
              margin: '0 -8px',
              padding: '0 8px',
            }}
          >
            {/* Tier 3: Inner wrapper with exact padding-top 10px, padding-bottom 5px */}
            <div style={{ paddingTop: '10px', paddingBottom: '5px' }}>
              <div className="flex flex-col gap-2">
                {/* Min Row */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{ letterSpacing: '0.6px', color: DIRECTORY_THEME.text.muted }}
                  >
                    Min
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Stepper - */}
                    <button
                      type="button"
                      onClick={() => handleMinStep(-1)}
                      style={{
                        backgroundColor: DIRECTORY_THEME.surfaces.stepperCircle,
                        color: DIRECTORY_THEME.brand.primary,
                        boxShadow: DIRECTORY_THEME.shadows.stepper,
                      }}
                      className={`w-[36px] h-[36px] rounded-full ${DIRECTORY_THEME.classes.hoverBrandPrimaryBg} hover:text-white hover:scale-[1.08] active:scale-[0.92] flex items-center justify-center text-[19px] leading-none transition-all focus:outline-none`}
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
                        backgroundColor: DIRECTORY_THEME.surfaces.white,
                        color: DIRECTORY_THEME.text.body,
                        boxShadow: `inset 0 0 0 1px ${DIRECTORY_THEME.borders.main}`,
                      }}
                      className={`w-[76px] h-[36px] text-center rounded-[12px] text-[14px] font-semibold border-0 outline-none ${DIRECTORY_THEME.classes.focusBrandRing} transition-all ${DIRECTORY_THEME.classes.placeholderSubtle}`}
                    />

                    {/* Stepper + */}
                    <button
                      type="button"
                      onClick={() => handleMinStep(1)}
                      style={{
                        backgroundColor: DIRECTORY_THEME.surfaces.stepperCircle,
                        color: DIRECTORY_THEME.brand.primary,
                        boxShadow: DIRECTORY_THEME.shadows.stepper,
                      }}
                      className={`w-[36px] h-[36px] rounded-full ${DIRECTORY_THEME.classes.hoverBrandPrimaryBg} hover:text-white hover:scale-[1.08] active:scale-[0.92] flex items-center justify-center text-[19px] leading-none transition-all focus:outline-none`}
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
                    style={{ letterSpacing: '0.6px', color: DIRECTORY_THEME.text.muted }}
                  >
                    Max
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Stepper - */}
                    <button
                      type="button"
                      onClick={() => handleMaxStep(-1)}
                      style={{
                        backgroundColor: DIRECTORY_THEME.surfaces.stepperCircle,
                        color: DIRECTORY_THEME.brand.primary,
                        boxShadow: DIRECTORY_THEME.shadows.stepper,
                      }}
                      className={`w-[36px] h-[36px] rounded-full ${DIRECTORY_THEME.classes.hoverBrandPrimaryBg} hover:text-white hover:scale-[1.08] active:scale-[0.92] flex items-center justify-center text-[19px] leading-none transition-all focus:outline-none`}
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
                        backgroundColor: DIRECTORY_THEME.surfaces.white,
                        color: DIRECTORY_THEME.text.body,
                        boxShadow: `inset 0 0 0 1px ${DIRECTORY_THEME.borders.main}`,
                      }}
                      className={`w-[76px] h-[36px] text-center rounded-[12px] text-[14px] font-semibold border-0 outline-none ${DIRECTORY_THEME.classes.focusBrandRing} transition-all ${DIRECTORY_THEME.classes.placeholderSubtle}`}
                    />

                    {/* Stepper + */}
                    <button
                      type="button"
                      onClick={() => handleMaxStep(1)}
                      style={{
                        backgroundColor: DIRECTORY_THEME.surfaces.stepperCircle,
                        color: DIRECTORY_THEME.brand.primary,
                        boxShadow: DIRECTORY_THEME.shadows.stepper,
                      }}
                      className={`w-[36px] h-[36px] rounded-full ${DIRECTORY_THEME.classes.hoverBrandPrimaryBg} hover:text-white hover:scale-[1.08] active:scale-[0.92] flex items-center justify-center text-[19px] leading-none transition-all focus:outline-none`}
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
