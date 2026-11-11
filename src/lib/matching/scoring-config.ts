/**
 * ═══════════════════════════════════════════════════════════════
 * NikahKaru Matching Engine — Scoring Configuration
 * ═══════════════════════════════════════════════════════════════
 * 
 * SINGLE SOURCE OF TRUTH for all scoring constants.
 * Change values here — no other file needs to be touched.
 * 
 * Categories:
 *   1. RANGE      — Age, Height, Weight (both boundaries matter)
 *   2. MIN_THRESH  — Religious Practice, Income, Education (higher = better)
 *   3. MAX_THRESH  — Smoking (lower = better)
 *   4. EXACT       — Religion, Sect, Caste, Marital, Family, Location, etc.
 */

import type { PreferenceImportance } from '../types/database.types';

// ═══════════════════════════════════════════════════════════════
// 1. IMPORTANCE WEIGHTS (for final weighted average)
// ═══════════════════════════════════════════════════════════════
export const IMPORTANCE_WEIGHTS: Record<PreferenceImportance, number> = {
  MANDATORY: 0,   // Handled by hardFilters, not scored
  HIGH: 3.0,
  MEDIUM: 2.0,
  LOW: 1.0,
  DOES_NOT_MATTER: 0,
};

// ═══════════════════════════════════════════════════════════════
// 2. RANGE CRITERIA — Grace Periods & Decay Steps
// ═══════════════════════════════════════════════════════════════
// 
// Formula: score = max(0, 1.0 - diff * step)
// If diff > maxGrace → score = 0
//
// Example (AGE, HIGH, maxGrace=2, step=0.25):
//   In range → 1.0
//   +1 year  → 0.75
//   +2 years → 0.50
//   +3 years → 0 (exceeds maxGrace)

interface GraceConfig {
  maxGrace: number;  // maximum units of grace
  step: number;      // decay per unit
}

export const RANGE_GRACE: Record<string, Record<'HIGH' | 'MEDIUM' | 'LOW', GraceConfig>> = {
  AGE: {
    HIGH:   { maxGrace: 2, step: 0.25 },   // +1yr=0.75, +2yr=0.50
    MEDIUM: { maxGrace: 3, step: 0.25 },   // +1yr=0.75, +2yr=0.50, +3yr=0.25
    LOW:    { maxGrace: 4, step: 0.20 },   // +1yr=0.80, +2yr=0.60, +3yr=0.40, +4yr=0.20
  },
  HEIGHT: {  // in cm — step is per cm
    HIGH:   { maxGrace: 5,  step: 0.20 },   // 1cm=0.80, 2cm=0.60, 3cm=0.40, 4cm=0.20, 5cm=0
    MEDIUM: { maxGrace: 10, step: 0.10 },   // 1cm=0.90, 5cm=0.50, 10cm=0
    LOW:    { maxGrace: 15, step: 0.067 },   // 1cm≈0.93, 5cm≈0.67, 10cm≈0.33, 15cm≈0
  },
  WEIGHT: {  // in kg — step is per kg
    HIGH:   { maxGrace: 5,  step: 0.20 },
    MEDIUM: { maxGrace: 10, step: 0.10 },
    LOW:    { maxGrace: 15, step: 0.067 },
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. MIN THRESHOLD HIERARCHIES (Higher = Better)
// ═══════════════════════════════════════════════════════════════
//
// If candidate level >= preferred level → score = 1.0 (exceeds = full marks)
// If candidate level < preferred level  → decay per level below
//
// Example: wants PRACTICING, gets HIGHLY_PRACTICING → 1.0 (better!)
//          wants PRACTICING, gets MODERATE            → 0.5 (1 level below)

export const MIN_THRESHOLD_LEVELS: Record<string, string[]> = {
  RELIGIOUS_PRACTICE: ['OTHER', 'MODERATE', 'PRACTICING', 'HIGHLY_PRACTICING'],
  // Education uses numeric IDs — higher id = higher level (handled in scoring.ts)
};

// Decay per level below the preferred level (for MIN threshold)
export const MIN_THRESHOLD_DECAY = 0.5;

// ═══════════════════════════════════════════════════════════════
// 4. MAX THRESHOLD HIERARCHIES (Lower = Better)
// ═══════════════════════════════════════════════════════════════
//
// If candidate level <= preferred level → score = 1.0 (better = full marks)
// If candidate level > preferred level  → decay per level above
//
// Example: wants NO, gets OCCASIONALLY → 0.5 (1 level worse)
//          wants OCCASIONALLY, gets NO  → 1.0 (better!)

export const MAX_THRESHOLD_LEVELS: Record<string, string[]> = {
  SMOKING: ['NO', 'OCCASIONALLY', 'YES'],   // NO is best (index 0)
};

// Decay per level above the preferred level (for MAX threshold)
export const MAX_THRESHOLD_DECAY = 0.5;

// ═══════════════════════════════════════════════════════════════
// 5. HELPER: Calculate graduated score for RANGE criteria
// ═══════════════════════════════════════════════════════════════
/**
 * Calculates a graduated score for range-based criteria.
 * @param diff - absolute difference from nearest boundary (always positive)
 * @param criterionKey - e.g. 'AGE', 'HEIGHT', 'WEIGHT'
 * @param importance - 'HIGH' | 'MEDIUM' | 'LOW'
 * @returns score between 0 and 1
 */
export function calculateRangeGraceScore(
  diff: number,
  criterionKey: string,
  importance: 'HIGH' | 'MEDIUM' | 'LOW'
): number {
  const config = RANGE_GRACE[criterionKey]?.[importance];
  if (!config) return 0;

  if (diff <= 0) return 1.0;                      // Within range
  if (diff > config.maxGrace) return 0;            // Beyond grace period

  // Graduated decay: score = 1.0 - (diff × step)
  // AGE HIGH: diff=1yr → 1.0 - 1×0.25 = 0.75, diff=2yr → 0.50
  // HEIGHT MEDIUM: diff=5cm → 1.0 - 5×0.10 = 0.50
  const score = Math.max(0, 1.0 - diff * config.step);
  return Math.round(score * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════
// 6. HELPER: Calculate MIN threshold score
// ═══════════════════════════════════════════════════════════════
/**
 * For criteria where higher is better (e.g. Religious Practice).
 * If candidate meets or exceeds → 1.0
 * If candidate is below → decayed score
 */
export function calculateMinThresholdScore(
  candidateLevel: string | null,
  preferredLevel: string,
  hierarchyKey: string
): number {
  const levels = MIN_THRESHOLD_LEVELS[hierarchyKey];
  if (!levels) return 0;

  const candIdx = levels.indexOf(candidateLevel || '');
  const prefIdx = levels.indexOf(preferredLevel);

  if (candIdx < 0 || prefIdx < 0) return 0;      // Unknown level
  if (candIdx >= prefIdx) return 1.0;              // Meets or exceeds!

  const levelsBehind = prefIdx - candIdx;
  return Math.max(0, 1.0 - levelsBehind * MIN_THRESHOLD_DECAY);
}

// ═══════════════════════════════════════════════════════════════
// 7. HELPER: Calculate MAX threshold score
// ═══════════════════════════════════════════════════════════════
/**
 * For criteria where lower is better (e.g. Smoking).
 * If candidate is at or below preferred → 1.0
 * If candidate is above → decayed score
 */
export function calculateMaxThresholdScore(
  candidateLevel: string | null,
  preferredLevel: string,
  hierarchyKey: string
): number {
  const levels = MAX_THRESHOLD_LEVELS[hierarchyKey];
  if (!levels) return 0;

  const candIdx = levels.indexOf(candidateLevel || '');
  const prefIdx = levels.indexOf(preferredLevel);

  if (candIdx < 0 || prefIdx < 0) return 0;      // Unknown level
  if (candIdx <= prefIdx) return 1.0;              // Meets or better!

  const levelsAbove = candIdx - prefIdx;
  return Math.max(0, 1.0 - levelsAbove * MAX_THRESHOLD_DECAY);
}
