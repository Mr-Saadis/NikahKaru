/**
 * ═══════════════════════════════════════════════════════════════
 * NikahKaru Matching Engine — Soft Scoring (4-Category System)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Categories:
 *   1. RANGE       — Age, Height, Weight (graduated grace by importance)
 *   2. MIN_THRESH  — Religious Practice, Income, Education (higher = better)
 *   3. MAX_THRESH  — Smoking (lower = better)
 *   4. EXACT       — Religion, Sect, Caste, Marital, Family, Location, etc.
 * 
 * All constants come from scoring-config.ts
 */

import { AllPreferences, PreferenceImportance } from '../types/database.types';
import { ScoreBreakdownDetail } from './types';
import {
  IMPORTANCE_WEIGHTS,
  calculateRangeGraceScore,
  calculateMinThresholdScore,
  calculateMaxThresholdScore,
} from './scoring-config';

// ─── Helpers ────────────────────────────────────────────────────

function calculateAge(dob: string): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Scores a single criterion with the given importance weight.
 * Returns null if importance is null/empty (= "Doesn't Matter") or MANDATORY (handled by hardFilters).
 */
export function scoreCriterion(
  criterionCode: string,
  candidateValue: any,
  preferredValue: any,
  importance: PreferenceImportance | null,
  matchMode: string,
  rawScoreFn: () => { score: number; explanation: string }
): ScoreBreakdownDetail | null {
  if (!importance || importance === 'MANDATORY' || importance === 'DOES_NOT_MATTER') {
    // MANDATORY → handled by hardFilters, not scored here
    // null/empty/DOES_NOT_MATTER → "Doesn't Matter" → completely excluded from scoring
    return null;
  }

  const { score, explanation } = rawScoreFn();
  const weight = IMPORTANCE_WEIGHTS[importance];

  return {
    criterion_code: criterionCode,
    candidate_value: candidateValue,
    preferred_value: preferredValue,
    importance,
    match_mode: matchMode,
    raw_score: score,
    weight,
    weighted_score: score * weight,
    passed_hard_filter: true,
    explanation,
  };
}

// ─── Main Scoring Function ──────────────────────────────────────

export function evaluateSoftScoring(
  candidate: any,
  prefs: AllPreferences,
  direction: 'MALE' | 'FEMALE'
): ScoreBreakdownDetail[] {
  const breakdowns: ScoreBreakdownDetail[] = [];

  // ════════════════════════════════════════════════════════════
  // CATEGORY 1: RANGE (Age, Height, Weight)
  // Graduated grace periods by importance level
  // ════════════════════════════════════════════════════════════

  // ── 1. Age (RANGE) ────────────────────────────────────────
  if (prefs.basic?.age_importance) {
    const min = prefs.basic.min_age ?? 18;
    const max = prefs.basic.max_age ?? 60;
    const candidateAge = calculateAge(candidate.personal_information?.date_of_birth);
    const importance = prefs.basic.age_importance;

    const b = scoreCriterion(
      'AGE', candidateAge, `${min}-${max}`, importance, 'RANGE',
      () => {
        if (candidateAge >= min && candidateAge <= max) {
          return { score: 1.0, explanation: `Age ${candidateAge} is within preferred range ${min}-${max}` };
        }
        const diff = Math.min(Math.abs(candidateAge - min), Math.abs(candidateAge - max));
        if (importance !== 'MANDATORY') {
          const graceScore = calculateRangeGraceScore(diff, 'AGE', importance as 'HIGH' | 'MEDIUM' | 'LOW');
          if (graceScore > 0) {
            return { score: graceScore, explanation: `Age ${candidateAge} is ${diff}yr outside range (grace score: ${(graceScore * 100).toFixed(0)}%)` };
          }
        }
        return { score: 0, explanation: `Age ${candidateAge} is outside acceptable range ${min}-${max}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 2. Height (RANGE) ─────────────────────────────────────
  if (prefs.physical?.height_importance) {
    const min = prefs.physical.min_height_cm ?? 80;
    const max = prefs.physical.max_height_cm ?? 250;
    const candHeight = candidate.physical_information?.height_cm;
    const importance = prefs.physical.height_importance;

    const b = scoreCriterion(
      'HEIGHT', candHeight, `${min}-${max} cm`, importance, 'RANGE',
      () => {
        if (!candHeight) return { score: 0, explanation: 'Height not provided' };
        if (candHeight >= min && candHeight <= max) {
          return { score: 1.0, explanation: `Height ${candHeight}cm is within preferred range` };
        }
        const diff = Math.min(Math.abs(candHeight - min), Math.abs(candHeight - max));
        if (importance !== 'MANDATORY') {
          const graceScore = calculateRangeGraceScore(diff, 'HEIGHT', importance as 'HIGH' | 'MEDIUM' | 'LOW');
          if (graceScore > 0) {
            return { score: graceScore, explanation: `Height ${candHeight}cm is ${diff}cm outside range (grace: ${(graceScore * 100).toFixed(0)}%)` };
          }
        }
        return { score: 0, explanation: `Height ${candHeight}cm is outside acceptable range` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 3. Weight (RANGE) ─────────────────────────────────────
  if (prefs.physical?.weight_importance) {
    const min = prefs.physical.min_weight_kg ?? 20;
    const max = prefs.physical.max_weight_kg ?? 300;
    const candWeight = candidate.physical_information?.weight_kg;
    const importance = prefs.physical.weight_importance;

    const b = scoreCriterion(
      'WEIGHT', candWeight, `${min}-${max} kg`, importance, 'RANGE',
      () => {
        if (!candWeight) return { score: 0, explanation: 'Weight not provided' };
        if (candWeight >= min && candWeight <= max) {
          return { score: 1.0, explanation: `Weight ${candWeight}kg is within preferred range` };
        }
        const diff = Math.min(Math.abs(candWeight - min), Math.abs(candWeight - max));
        if (importance !== 'MANDATORY') {
          const graceScore = calculateRangeGraceScore(diff, 'WEIGHT', importance as 'HIGH' | 'MEDIUM' | 'LOW');
          if (graceScore > 0) {
            return { score: graceScore, explanation: `Weight ${candWeight}kg is ${diff}kg outside range (grace: ${(graceScore * 100).toFixed(0)}%)` };
          }
        }
        return { score: 0, explanation: `Weight ${candWeight}kg is outside acceptable range` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ════════════════════════════════════════════════════════════
  // CATEGORY 2: MIN THRESHOLD (Higher = Better)
  // candidate >= preferred → 1.0 (exceeds = full score)
  // candidate <  preferred → decayed score
  // ════════════════════════════════════════════════════════════

  // ── 4. Religious Practice (MIN THRESHOLD) ─────────────────
  if (prefs.religion?.religious_practice_importance && prefs.religion.religious_practice) {
    const candPractice = candidate.lifestyle_information?.religious_practice;
    const b = scoreCriterion(
      'RELIGIOUS_PRACTICE', candPractice, prefs.religion.religious_practice,
      prefs.religion.religious_practice_importance, 'MINIMUM',
      () => {
        const score = calculateMinThresholdScore(candPractice, prefs.religion!.religious_practice!, 'RELIGIOUS_PRACTICE');
        if (score === 1.0) {
          const exceeds = candPractice !== prefs.religion!.religious_practice;
          return { score: 1.0, explanation: exceeds
            ? `${candPractice} exceeds preferred ${prefs.religion!.religious_practice} — full score`
            : `Religious practice matches: ${candPractice}` };
        }
        if (score > 0) {
          return { score, explanation: `${candPractice} is below preferred ${prefs.religion!.religious_practice} (partial: ${(score * 100).toFixed(0)}%)` };
        }
        return { score: 0, explanation: `${candPractice || 'N/A'} is too far below preferred ${prefs.religion!.religious_practice}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 5. Religious Practice from Lifestyle Prefs (MIN THRESHOLD) ──
  if (prefs.lifestyle?.religious_practice_importance && prefs.lifestyle.religious_practice) {
    // Only score if NOT already scored from religion prefs above
    const alreadyScored = breakdowns.some(b => b.criterion_code === 'RELIGIOUS_PRACTICE');
    if (!alreadyScored) {
      const candPractice = candidate.lifestyle_information?.religious_practice;
      const b = scoreCriterion(
        'RELIGIOUS_PRACTICE', candPractice, prefs.lifestyle.religious_practice,
        prefs.lifestyle.religious_practice_importance, 'MINIMUM',
        () => {
          const score = calculateMinThresholdScore(candPractice, prefs.lifestyle!.religious_practice!, 'RELIGIOUS_PRACTICE');
          if (score === 1.0) {
            return { score: 1.0, explanation: `Religious practice meets or exceeds preference` };
          }
          if (score > 0) {
            return { score, explanation: `${candPractice} is below preferred ${prefs.lifestyle!.religious_practice}` };
          }
          return { score: 0, explanation: `${candPractice || 'N/A'} is too far below preferred` };
        }
      );
      if (b) breakdowns.push(b);
    }
  }

  // ── 6. Income (MIN THRESHOLD — only minimum matters) ──────
  if (prefs.profession?.income_importance) {
    const prefMinIncome = prefs.profession.minimum_monthly_income ?? 0;
    // Candidate's income: use max if available, otherwise min
    const candIncomeMax = candidate.income_information?.monthly_income_max ??
                          candidate.income_information?.monthly_income_min ?? 0;

    const b = scoreCriterion(
      'INCOME', candIncomeMax, `Min ${prefMinIncome}`,
      prefs.profession.income_importance, 'MINIMUM',
      () => {
        if (prefMinIncome === 0) return { score: 1.0, explanation: 'No minimum income requirement' };
        if (candIncomeMax >= prefMinIncome) {
          return { score: 1.0, explanation: `Income ${candIncomeMax} meets/exceeds minimum ${prefMinIncome}` };
        }
        // How far below? Percentage-based decay
        const ratio = candIncomeMax / prefMinIncome;   // e.g. 80K/100K = 0.80
        const score = Math.max(0, ratio);
        return { score: Math.round(score * 100) / 100, explanation: `Income ${candIncomeMax} is below minimum ${prefMinIncome} (${(score * 100).toFixed(0)}%)` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 7. Education (MIN THRESHOLD — higher level = better) ──
  if (prefs.education?.education_importance && prefs.education.minimum_education_level_id) {
    const prefMinLevel = prefs.education.minimum_education_level_id;
    const candEduLevels = Array.isArray(candidate.education_records)
      ? candidate.education_records.map((e: any) => e.education_level_id).filter(Boolean)
      : [];
    const candMaxLevel = candEduLevels.length > 0 ? Math.max(...candEduLevels) : 0;

    const b = scoreCriterion(
      'EDUCATION', candMaxLevel, `Min level ${prefMinLevel}`,
      prefs.education.education_importance, 'MINIMUM',
      () => {
        if (candMaxLevel >= prefMinLevel) {
          return { score: 1.0, explanation: `Education level ${candMaxLevel} meets/exceeds minimum ${prefMinLevel}` };
        }
        if (candMaxLevel === 0) return { score: 0, explanation: 'No education record found' };
        // Partial: how close are they?
        const ratio = candMaxLevel / prefMinLevel;
        return { score: Math.max(0, Math.round(ratio * 100) / 100), explanation: `Education level ${candMaxLevel} is below minimum ${prefMinLevel}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ════════════════════════════════════════════════════════════
  // CATEGORY 3: MAX THRESHOLD (Lower = Better)
  // candidate <= preferred → 1.0 (better = full score)
  // candidate >  preferred → decayed score
  // ════════════════════════════════════════════════════════════

  // ── 8. Smoking (MAX THRESHOLD) ────────────────────────────
  if (prefs.lifestyle?.smoking_importance && prefs.lifestyle.smoking) {
    const candidateSmoking = candidate.lifestyle_information?.smoking ||
                             candidate.lifestyle_information?.smoking_status;
    const b = scoreCriterion(
      'SMOKING', candidateSmoking, prefs.lifestyle.smoking,
      prefs.lifestyle.smoking_importance, 'MAXIMUM',
      () => {
        const score = calculateMaxThresholdScore(candidateSmoking, prefs.lifestyle!.smoking!, 'SMOKING');
        if (score === 1.0) {
          const better = candidateSmoking !== prefs.lifestyle!.smoking;
          return { score: 1.0, explanation: better
            ? `${candidateSmoking} is better than preferred ${prefs.lifestyle!.smoking} — full score`
            : `Smoking status matches: ${candidateSmoking}` };
        }
        if (score > 0) {
          return { score, explanation: `${candidateSmoking} is worse than preferred ${prefs.lifestyle!.smoking} (partial: ${(score * 100).toFixed(0)}%)` };
        }
        return { score: 0, explanation: `Smoking is ${candidateSmoking}, expected ${prefs.lifestyle!.smoking}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ════════════════════════════════════════════════════════════
  // CATEGORY 4: EXACT BINARY (Match = 1.0, Mismatch = 0)
  // ════════════════════════════════════════════════════════════

  // ── 9. Marital Status (EXACT) ─────────────────────────────
  if (prefs.basic?.marital_status_importance && prefs.basic.preferred_marital_status) {
    const candStatus = candidate.personal_information?.marital_status;
    const b = scoreCriterion(
      'MARITAL_STATUS', candStatus, prefs.basic.preferred_marital_status,
      prefs.basic.marital_status_importance, 'EXACT',
      () => {
        if (candStatus === prefs.basic?.preferred_marital_status) {
          return { score: 1.0, explanation: `Marital status matches: ${candStatus}` };
        }
        return { score: 0, explanation: `Candidate is ${candStatus}, expected ${prefs.basic?.preferred_marital_status}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 10. Children Allowed (EXACT) ──────────────────────────
  if (prefs.basic?.children_importance && prefs.basic.children_allowed) {
    const candidateChildren = candidate.personal_information?.number_of_children ?? 0;
    const b = scoreCriterion(
      'CHILDREN', candidateChildren, prefs.basic.children_allowed,
      prefs.basic.children_importance, 'EXACT',
      () => {
        if (prefs.basic?.children_allowed === 'YES') {
          return { score: 1.0, explanation: 'Children are acceptable' };
        }
        if (candidateChildren === 0) {
          return { score: 1.0, explanation: 'No children — matches preference' };
        }
        return { score: 0, explanation: `Candidate has ${candidateChildren} children, preference is NO` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 11. Disability (EXACT) ────────────────────────────────
  if (prefs.physical?.disability_importance && prefs.physical.disability_allowed) {
    const candDisability = candidate.physical_information?.has_disability;
    const b = scoreCriterion(
      'DISABILITY', candDisability ? 'YES' : 'NO', prefs.physical.disability_allowed,
      prefs.physical.disability_importance, 'EXACT',
      () => {
        if (prefs.physical?.disability_allowed === 'YES') return { score: 1.0, explanation: 'Disability is acceptable' };
        if (!candDisability) return { score: 1.0, explanation: 'No disability — matches preference' };
        return { score: 0, explanation: 'Candidate has disability, preference is NO' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 12. Complexion (EXACT) ────────────────────────────────
  if (prefs.physical?.complexion_importance && prefs.physical.preferred_complexion) {
    const candComplexion = candidate.physical_information?.complexion;
    const b = scoreCriterion(
      'COMPLEXION', candComplexion, prefs.physical.preferred_complexion,
      prefs.physical.complexion_importance, 'EXACT',
      () => {
        if (candComplexion === prefs.physical?.preferred_complexion) {
          return { score: 1.0, explanation: `Complexion matches: ${candComplexion}` };
        }
        return { score: 0, explanation: `Complexion is ${candComplexion}, expected ${prefs.physical?.preferred_complexion}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 13. Religion (EXACT) ──────────────────────────────────
  if (prefs.religion?.religion_importance && prefs.religion.religion_id) {
    const candReligion = candidate.religion_information?.religion_id;
    const b = scoreCriterion(
      'RELIGION', candReligion, prefs.religion.religion_id,
      prefs.religion.religion_importance, 'EXACT',
      () => {
        if (candReligion === prefs.religion?.religion_id) return { score: 1.0, explanation: 'Religion matches' };
        return { score: 0, explanation: 'Religion does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 14. Sect (EXACT) ──────────────────────────────────────
  if (prefs.religion?.sect_importance && prefs.religion.sect_id) {
    const candSect = candidate.religion_information?.sect_id;
    const b = scoreCriterion(
      'SECT', candSect, prefs.religion.sect_id,
      prefs.religion.sect_importance, 'EXACT',
      () => {
        if (candSect === prefs.religion?.sect_id) return { score: 1.0, explanation: 'Sect matches' };
        return { score: 0, explanation: 'Sect does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 15. Caste (EXACT) ─────────────────────────────────────
  if (prefs.religion?.caste_importance && prefs.religion.caste_id) {
    const candCaste = candidate.religion_information?.caste_id;
    const b = scoreCriterion(
      'CASTE', candCaste, prefs.religion.caste_id,
      prefs.religion.caste_importance, 'EXACT',
      () => {
        if (candCaste === prefs.religion?.caste_id) return { score: 1.0, explanation: 'Caste matches' };
        return { score: 0, explanation: 'Caste does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 16. Country (EXACT) ───────────────────────────────────
  if (prefs.location?.country_importance && prefs.location.country_id) {
    const candCountry = Array.isArray(candidate.profile_locations)
      ? candidate.profile_locations[0]?.current_country_id
      : candidate.profile_locations?.current_country_id;
    const b = scoreCriterion(
      'COUNTRY', candCountry, prefs.location.country_id,
      prefs.location.country_importance, 'EXACT',
      () => {
        if (candCountry === prefs.location?.country_id) return { score: 1.0, explanation: 'Country matches' };
        return { score: 0, explanation: 'Country does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 17. Family Setup (EXACT) ──────────────────────────────
  if (prefs.family?.family_setup_importance && prefs.family.family_setup) {
    const candSetup = candidate.residency_information?.family_setup;
    const b = scoreCriterion(
      'FAMILY_SETUP', candSetup, prefs.family.family_setup,
      prefs.family.family_setup_importance, 'EXACT',
      () => {
        if (candSetup === prefs.family?.family_setup) return { score: 1.0, explanation: `Family setup matches: ${candSetup}` };
        return { score: 0, explanation: `Family setup is ${candSetup}, expected ${prefs.family?.family_setup}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 18. Beard (EXACT) ─────────────────────────────────────
  if (prefs.lifestyle?.beard_importance && prefs.lifestyle.beard_preference) {
    const candBeard = candidate.lifestyle_information?.beard;
    const b = scoreCriterion(
      'BEARD', candBeard, prefs.lifestyle.beard_preference,
      prefs.lifestyle.beard_importance, 'EXACT',
      () => {
        if (candBeard === prefs.lifestyle?.beard_preference) return { score: 1.0, explanation: `Beard preference matches: ${candBeard}` };
        return { score: 0, explanation: `Beard is ${candBeard}, expected ${prefs.lifestyle?.beard_preference}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 19. Hijab (EXACT) ─────────────────────────────────────
  if (prefs.lifestyle?.hijab_importance && prefs.lifestyle.hijab_preference) {
    const candHijab = candidate.lifestyle_information?.hijab;
    const b = scoreCriterion(
      'HIJAB', candHijab, prefs.lifestyle.hijab_preference,
      prefs.lifestyle.hijab_importance, 'EXACT',
      () => {
        if (candHijab === prefs.lifestyle?.hijab_preference) return { score: 1.0, explanation: `Hijab preference matches: ${candHijab}` };
        return { score: 0, explanation: `Hijab is ${candHijab}, expected ${prefs.lifestyle?.hijab_preference}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  return breakdowns;
}

// ─── Total Score Calculation ────────────────────────────────────

export function calculateTotalScore(breakdowns: ScoreBreakdownDetail[]): number {
  let totalWeightedScore = 0;
  let maxPossibleWeight = 0;

  for (const b of breakdowns) {
    totalWeightedScore += b.weighted_score;
    maxPossibleWeight += b.weight;
  }

  if (maxPossibleWeight === 0) return 0;

  // Return as percentage (0-100)
  return Math.round((totalWeightedScore / maxPossibleWeight) * 100);
}
