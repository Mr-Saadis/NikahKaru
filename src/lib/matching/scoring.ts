import { AllPreferences, PreferenceImportance } from '../types/database.types';
import { ScoreBreakdownDetail, IMPORTANCE_WEIGHTS, CriterionScore } from './types';

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
 * Returns null if importance is null/empty (ignored) or MANDATORY (handled by hardFilters).
 */
export function scoreCriterion(
  criterionCode: string,
  candidateValue: any,
  preferredValue: any,
  importance: PreferenceImportance | null,
  matchMode: string,
  rawScoreFn: () => { score: number; explanation: string }
): ScoreBreakdownDetail | null {
  if (!importance || importance === 'MANDATORY') {
    // MANDATORY is handled by hardFilters, not scored here.
    // null importance means "Doesn't Matter" -> completely excluded from scoring.
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

/**
 * Evaluates ALL soft scoring criteria for a candidate against preferences.
 * Only criteria with HIGH, MEDIUM, or LOW importance are scored here.
 * MANDATORY criteria are already validated by hardFilters.
 */
export function evaluateSoftScoring(
  candidate: any,
  prefs: AllPreferences,
  direction: 'MALE' | 'FEMALE'
): ScoreBreakdownDetail[] {
  const breakdowns: ScoreBreakdownDetail[] = [];

  // ── 1. Age (RANGE) ────────────────────────────────────────────
  if (prefs.basic?.age_importance) {
    const min = prefs.basic.min_age ?? 18;
    const max = prefs.basic.max_age ?? 60;
    const candidateAge = calculateAge(candidate.personal_information?.date_of_birth);
    
    const b = scoreCriterion(
      'AGE',
      candidateAge,
      `${min}-${max}`,
      prefs.basic.age_importance,
      'RANGE',
      () => {
        if (candidateAge >= min && candidateAge <= max) {
          return { score: 1.0, explanation: `Age ${candidateAge} is within preferred range ${min}-${max}` };
        }
        const diff = Math.min(Math.abs(candidateAge - min), Math.abs(candidateAge - max));
        if (diff <= 3) {
          return { score: 0.5, explanation: `Age ${candidateAge} is slightly outside range (within 3 years)` };
        }
        return { score: 0, explanation: `Age ${candidateAge} is outside acceptable range` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 2. Marital Status (EXACT) ─────────────────────────────────
  if (prefs.basic?.marital_status_importance && prefs.basic.preferred_marital_status) {
    const candStatus = candidate.personal_information?.marital_status;
    const b = scoreCriterion(
      'MARITAL_STATUS',
      candStatus,
      prefs.basic.preferred_marital_status,
      prefs.basic.marital_status_importance,
      'EXACT',
      () => {
        if (candStatus === prefs.basic?.preferred_marital_status) {
          return { score: 1.0, explanation: `Exact match for marital status: ${candStatus}` };
        }
        return { score: 0, explanation: `Candidate is ${candStatus}, expected ${prefs.basic?.preferred_marital_status}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 3. Children Allowed (EXACT) ───────────────────────────────
  if (prefs.basic?.children_importance && prefs.basic.children_allowed) {
    const candidateChildren = candidate.personal_information?.number_of_children ?? 0;
    const b = scoreCriterion(
      'CHILDREN',
      candidateChildren,
      prefs.basic.children_allowed,
      prefs.basic.children_importance,
      'EXACT',
      () => {
        if (prefs.basic?.children_allowed === 'YES') {
          return { score: 1.0, explanation: 'Children are acceptable' };
        }
        // children_allowed = NO
        if (candidateChildren === 0) {
          return { score: 1.0, explanation: 'No children — matches preference' };
        }
        return { score: 0, explanation: `Candidate has ${candidateChildren} children, preference is NO children` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 4. Height (RANGE) ─────────────────────────────────────────
  if (prefs.physical?.height_importance) {
    const min = prefs.physical.min_height_cm ?? 80;
    const max = prefs.physical.max_height_cm ?? 250;
    const candHeight = candidate.physical_information?.height_cm;
    const b = scoreCriterion(
      'HEIGHT',
      candHeight,
      `${min}-${max} cm`,
      prefs.physical.height_importance,
      'RANGE',
      () => {
        if (!candHeight) return { score: 0, explanation: 'Height not provided' };
        if (candHeight >= min && candHeight <= max) {
          return { score: 1.0, explanation: `Height ${candHeight}cm is within preferred range` };
        }
        const diff = Math.min(Math.abs(candHeight - min), Math.abs(candHeight - max));
        if (diff <= 10) return { score: 0.5, explanation: `Height ${candHeight}cm is slightly outside range (within 10cm)` };
        return { score: 0, explanation: `Height ${candHeight}cm is outside acceptable range` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 5. Weight (RANGE) ─────────────────────────────────────────
  if (prefs.physical?.weight_importance) {
    const min = prefs.physical.min_weight_kg ?? 20;
    const max = prefs.physical.max_weight_kg ?? 300;
    const candWeight = candidate.physical_information?.weight_kg;
    const b = scoreCriterion(
      'WEIGHT',
      candWeight,
      `${min}-${max} kg`,
      prefs.physical.weight_importance,
      'RANGE',
      () => {
        if (!candWeight) return { score: 0, explanation: 'Weight not provided' };
        if (candWeight >= min && candWeight <= max) {
          return { score: 1.0, explanation: `Weight ${candWeight}kg is within preferred range` };
        }
        const diff = Math.min(Math.abs(candWeight - min), Math.abs(candWeight - max));
        if (diff <= 10) return { score: 0.5, explanation: `Weight ${candWeight}kg is slightly outside range` };
        return { score: 0, explanation: `Weight ${candWeight}kg is outside acceptable range` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 6. Disability (EXACT) ─────────────────────────────────────
  if (prefs.physical?.disability_importance && prefs.physical.disability_allowed) {
    const candDisability = candidate.physical_information?.has_disability;
    const b = scoreCriterion(
      'DISABILITY',
      candDisability ? 'YES' : 'NO',
      prefs.physical.disability_allowed,
      prefs.physical.disability_importance,
      'EXACT',
      () => {
        if (prefs.physical?.disability_allowed === 'YES') {
          return { score: 1.0, explanation: 'Disability is acceptable' };
        }
        if (!candDisability) {
          return { score: 1.0, explanation: 'No disability — matches preference' };
        }
        return { score: 0, explanation: 'Candidate has disability, preference is NO' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 7. Complexion (EXACT) ─────────────────────────────────────
  if (prefs.physical?.complexion_importance && prefs.physical.preferred_complexion) {
    const candComplexion = candidate.physical_information?.complexion;
    const b = scoreCriterion(
      'COMPLEXION',
      candComplexion,
      prefs.physical.preferred_complexion,
      prefs.physical.complexion_importance,
      'EXACT',
      () => {
        if (candComplexion === prefs.physical?.preferred_complexion) {
          return { score: 1.0, explanation: `Complexion matches: ${candComplexion}` };
        }
        return { score: 0, explanation: `Complexion is ${candComplexion}, expected ${prefs.physical?.preferred_complexion}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 8. Religion (EXACT) ───────────────────────────────────────
  if (prefs.religion?.religion_importance && prefs.religion.religion_id) {
    const candReligion = candidate.religion_information?.religion_id;
    const b = scoreCriterion(
      'RELIGION',
      candReligion,
      prefs.religion.religion_id,
      prefs.religion.religion_importance,
      'EXACT',
      () => {
        if (candReligion === prefs.religion?.religion_id) {
          return { score: 1.0, explanation: 'Religion matches' };
        }
        return { score: 0, explanation: 'Religion does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 9. Sect (EXACT) ───────────────────────────────────────────
  if (prefs.religion?.sect_importance && prefs.religion.sect_id) {
    const candSect = candidate.religion_information?.sect_id;
    const b = scoreCriterion(
      'SECT',
      candSect,
      prefs.religion.sect_id,
      prefs.religion.sect_importance,
      'EXACT',
      () => {
        if (candSect === prefs.religion?.sect_id) {
          return { score: 1.0, explanation: 'Sect matches' };
        }
        return { score: 0, explanation: 'Sect does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 10. Caste (EXACT) ─────────────────────────────────────────
  if (prefs.religion?.caste_importance && prefs.religion.caste_id) {
    const candCaste = candidate.religion_information?.caste_id;
    const b = scoreCriterion(
      'CASTE',
      candCaste,
      prefs.religion.caste_id,
      prefs.religion.caste_importance,
      'EXACT',
      () => {
        if (candCaste === prefs.religion?.caste_id) {
          return { score: 1.0, explanation: 'Caste matches' };
        }
        return { score: 0, explanation: 'Caste does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 11. Religious Practice (EXACT) ────────────────────────────
  if (prefs.religion?.religious_practice_importance && prefs.religion.religious_practice) {
    const candPractice = candidate.lifestyle_information?.religious_practice;
    const b = scoreCriterion(
      'RELIGIOUS_PRACTICE',
      candPractice,
      prefs.religion.religious_practice,
      prefs.religion.religious_practice_importance,
      'EXACT',
      () => {
        if (candPractice === prefs.religion?.religious_practice) {
          return { score: 1.0, explanation: `Religious practice matches: ${candPractice}` };
        }
        // Partial match: HIGHLY_PRACTICING vs PRACTICING
        const levels = ['OTHER', 'MODERATE', 'PRACTICING', 'HIGHLY_PRACTICING'];
        const prefIdx = levels.indexOf(prefs.religion?.religious_practice || '');
        const candIdx = levels.indexOf(candPractice || '');
        if (prefIdx >= 0 && candIdx >= 0 && Math.abs(prefIdx - candIdx) === 1) {
          return { score: 0.5, explanation: `Religious practice ${candPractice} is close to preferred ${prefs.religion?.religious_practice}` };
        }
        return { score: 0, explanation: `Religious practice is ${candPractice}, expected ${prefs.religion?.religious_practice}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 12. Smoking (EXACT) ───────────────────────────────────────
  if (prefs.lifestyle?.smoking_importance && prefs.lifestyle.smoking) {
    const candidateSmoking = candidate.lifestyle_information?.smoking ||
                             candidate.lifestyle_information?.smoking_status; // seed uses smoking_status
    const b = scoreCriterion(
      'SMOKING',
      candidateSmoking,
      prefs.lifestyle.smoking,
      prefs.lifestyle.smoking_importance,
      'EXACT',
      () => {
        if (candidateSmoking === prefs.lifestyle?.smoking) {
          return { score: 1.0, explanation: `Smoking status matches: ${candidateSmoking}` };
        }
        // Partial: OCCASIONALLY vs NO
        if ((candidateSmoking === 'OCCASIONALLY' && prefs.lifestyle?.smoking === 'NO') ||
            (candidateSmoking === 'NO' && prefs.lifestyle?.smoking === 'OCCASIONALLY')) {
          return { score: 0.5, explanation: `Smoking is ${candidateSmoking}, preferred ${prefs.lifestyle?.smoking} (close match)` };
        }
        return { score: 0, explanation: `Smoking is ${candidateSmoking}, expected ${prefs.lifestyle?.smoking}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 13. Income (RANGE) ────────────────────────────────────────
  if (prefs.profession?.income_importance) {
    const candIncomeMin = candidate.income_information?.monthly_income_min ?? 0;
    const candIncomeMax = candidate.income_information?.monthly_income_max ?? candIncomeMin;
    const prefMin = prefs.profession.minimum_monthly_income ?? 0;
    const prefMax = prefs.profession.maximum_monthly_income ?? Infinity;
    const b = scoreCriterion(
      'INCOME',
      `${candIncomeMin}-${candIncomeMax}`,
      `${prefMin}-${prefMax}`,
      prefs.profession.income_importance,
      'RANGE',
      () => {
        // Check overlap: candidate's range should overlap with preferred range
        if (candIncomeMax >= prefMin && candIncomeMin <= prefMax) {
          return { score: 1.0, explanation: `Income range ${candIncomeMin}-${candIncomeMax} overlaps with preferred ${prefMin}-${prefMax}` };
        }
        // Close: within 20% of boundary
        const gap = Math.min(Math.abs(candIncomeMax - prefMin), Math.abs(candIncomeMin - prefMax));
        if (gap <= prefMin * 0.2) {
          return { score: 0.5, explanation: `Income is close to preferred range (within 20%)` };
        }
        return { score: 0, explanation: `Income range ${candIncomeMin}-${candIncomeMax} is outside preferred range ${prefMin}-${prefMax}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 14. Country (EXACT) ───────────────────────────────────────
  if (prefs.location?.country_importance && prefs.location.country_id) {
    const candCountry = Array.isArray(candidate.profile_locations)
      ? candidate.profile_locations[0]?.current_country_id
      : candidate.profile_locations?.current_country_id;
    const b = scoreCriterion(
      'COUNTRY',
      candCountry,
      prefs.location.country_id,
      prefs.location.country_importance,
      'EXACT',
      () => {
        if (candCountry === prefs.location?.country_id) {
          return { score: 1.0, explanation: 'Country matches' };
        }
        return { score: 0, explanation: 'Country does not match' };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 15. Family Setup (EXACT) ──────────────────────────────────
  if (prefs.family?.family_setup_importance && prefs.family.family_setup) {
    const candSetup = candidate.residency_information?.family_setup;
    const b = scoreCriterion(
      'FAMILY_SETUP',
      candSetup,
      prefs.family.family_setup,
      prefs.family.family_setup_importance,
      'EXACT',
      () => {
        if (candSetup === prefs.family?.family_setup) {
          return { score: 1.0, explanation: `Family setup matches: ${candSetup}` };
        }
        return { score: 0, explanation: `Family setup is ${candSetup}, expected ${prefs.family?.family_setup}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 16. Beard (EXACT) ─────────────────────────────────────────
  if (prefs.lifestyle?.beard_importance && prefs.lifestyle.beard_preference) {
    const candBeard = candidate.lifestyle_information?.beard;
    const b = scoreCriterion(
      'BEARD',
      candBeard,
      prefs.lifestyle.beard_preference,
      prefs.lifestyle.beard_importance,
      'EXACT',
      () => {
        if (candBeard === prefs.lifestyle?.beard_preference) {
          return { score: 1.0, explanation: `Beard preference matches: ${candBeard}` };
        }
        return { score: 0, explanation: `Beard is ${candBeard}, expected ${prefs.lifestyle?.beard_preference}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  // ── 17. Hijab (EXACT) ─────────────────────────────────────────
  if (prefs.lifestyle?.hijab_importance && prefs.lifestyle.hijab_preference) {
    const candHijab = candidate.lifestyle_information?.hijab;
    const b = scoreCriterion(
      'HIJAB',
      candHijab,
      prefs.lifestyle.hijab_preference,
      prefs.lifestyle.hijab_importance,
      'EXACT',
      () => {
        if (candHijab === prefs.lifestyle?.hijab_preference) {
          return { score: 1.0, explanation: `Hijab preference matches: ${candHijab}` };
        }
        return { score: 0, explanation: `Hijab is ${candHijab}, expected ${prefs.lifestyle?.hijab_preference}` };
      }
    );
    if (b) breakdowns.push(b);
  }

  return breakdowns;
}

export function calculateTotalScore(breakdowns: ScoreBreakdownDetail[]): number {
  let totalWeightedScore = 0;
  let maxPossibleWeight = 0;

  for (const b of breakdowns) {
    totalWeightedScore += b.weighted_score;
    maxPossibleWeight += b.weight; // Max raw_score is 1.0, so max possible is just the weight
  }

  if (maxPossibleWeight === 0) return 0;
  
  // Return as percentage (0-100)
  return Math.round((totalWeightedScore / maxPossibleWeight) * 100);
}
