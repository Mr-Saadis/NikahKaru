import { AllPreferences } from '../types/database.types';

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
 * Hard Filter: Checks ALL MANDATORY preferences against the candidate.
 * If ANY mandatory preference fails, the candidate is immediately rejected.
 * This runs BEFORE soft scoring — if it fails, finalScore = 0%.
 */
export function passesHardFilters(
  candidate: any,
  prefs: AllPreferences
): { passed: boolean; reason?: string } {

  // ── 1. Basic Preferences ──────────────────────────────────────
  if (prefs.basic) {
    // Age (RANGE)
    if (prefs.basic.age_importance === 'MANDATORY') {
      const age = calculateAge(candidate.personal_information?.date_of_birth);
      const minAge = prefs.basic.min_age ?? 18;
      const maxAge = prefs.basic.max_age ?? 100;
      if (age < minAge || age > maxAge) {
        return { passed: false, reason: `Age ${age} is outside mandatory range ${minAge}-${maxAge}` };
      }
    }

    // Marital Status (EXACT)
    if (prefs.basic.marital_status_importance === 'MANDATORY' && prefs.basic.preferred_marital_status) {
      if (candidate.personal_information?.marital_status !== prefs.basic.preferred_marital_status) {
        return { passed: false, reason: `Marital status must be ${prefs.basic.preferred_marital_status}, got ${candidate.personal_information?.marital_status}` };
      }
    }

    // Children Allowed (EXACT)
    if (prefs.basic.children_importance === 'MANDATORY' && prefs.basic.children_allowed) {
      const candidateChildren = candidate.personal_information?.number_of_children ?? 0;
      if (prefs.basic.children_allowed === 'NO' && candidateChildren > 0) {
        return { passed: false, reason: `Children not allowed (Mandatory), candidate has ${candidateChildren}` };
      }
    }
  }

  // ── 2. Physical Preferences ───────────────────────────────────
  if (prefs.physical) {
    // Height (RANGE)
    if (prefs.physical.height_importance === 'MANDATORY') {
      const height = candidate.physical_information?.height_cm;
      const minHeight = prefs.physical.min_height_cm ?? 80;
      const maxHeight = prefs.physical.max_height_cm ?? 250;
      if (!height || height < minHeight || height > maxHeight) {
        return { passed: false, reason: `Height ${height || 'N/A'}cm is outside mandatory range ${minHeight}-${maxHeight}cm` };
      }
    }

    // Weight (RANGE)
    if (prefs.physical.weight_importance === 'MANDATORY') {
      const weight = candidate.physical_information?.weight_kg;
      const minWeight = prefs.physical.min_weight_kg ?? 20;
      const maxWeight = prefs.physical.max_weight_kg ?? 300;
      if (!weight || weight < minWeight || weight > maxWeight) {
        return { passed: false, reason: `Weight ${weight || 'N/A'}kg is outside mandatory range ${minWeight}-${maxWeight}kg` };
      }
    }

    // Disability (EXACT)
    if (prefs.physical.disability_importance === 'MANDATORY' && prefs.physical.disability_allowed === 'NO') {
      if (candidate.physical_information?.has_disability) {
        return { passed: false, reason: 'Disability is strictly not allowed (Mandatory)' };
      }
    }

    // Complexion (EXACT)
    if (prefs.physical.complexion_importance === 'MANDATORY' && prefs.physical.preferred_complexion) {
      if (candidate.physical_information?.complexion !== prefs.physical.preferred_complexion) {
        return { passed: false, reason: `Complexion must be ${prefs.physical.preferred_complexion} (Mandatory)` };
      }
    }

    // Beard (EXACT)
    if (prefs.physical.beard_importance === 'MANDATORY' && prefs.physical.beard_preference) {
      if (candidate.lifestyle_information?.beard !== prefs.physical.beard_preference) {
        return { passed: false, reason: `Beard preference must be ${prefs.physical.beard_preference} (Mandatory)` };
      }
    }

    // Hijab (EXACT)
    if (prefs.physical.hijab_importance === 'MANDATORY' && prefs.physical.hijab_preference) {
      if (candidate.lifestyle_information?.hijab !== prefs.physical.hijab_preference) {
        return { passed: false, reason: `Hijab preference must be ${prefs.physical.hijab_preference} (Mandatory)` };
      }
    }
  }

  // ── 3. Religion Preferences ───────────────────────────────────
  if (prefs.religion) {
    // Religion (EXACT)
    if (prefs.religion.religion_importance === 'MANDATORY' && prefs.religion.religion_id) {
      if (candidate.religion_information?.religion_id !== prefs.religion.religion_id) {
        return { passed: false, reason: 'Religion mismatch (Mandatory)' };
      }
    }

    // Sect (EXACT)
    if (prefs.religion.sect_importance === 'MANDATORY' && prefs.religion.sect_id) {
      if (candidate.religion_information?.sect_id !== prefs.religion.sect_id) {
        return { passed: false, reason: 'Sect mismatch (Mandatory)' };
      }
    }

    // Caste (EXACT)
    if (prefs.religion.caste_importance === 'MANDATORY' && prefs.religion.caste_id) {
      if (candidate.religion_information?.caste_id !== prefs.religion.caste_id) {
        return { passed: false, reason: 'Caste mismatch (Mandatory)' };
      }
    }

    // Religious Practice Level (EXACT)
    if (prefs.religion.religious_practice_importance === 'MANDATORY' && prefs.religion.religious_practice) {
      if (candidate.lifestyle_information?.religious_practice !== prefs.religion.religious_practice) {
        return { passed: false, reason: `Religious practice must be ${prefs.religion.religious_practice} (Mandatory), got ${candidate.lifestyle_information?.religious_practice}` };
      }
    }
  }

  // ── 4. Location Preferences ───────────────────────────────────
  if (prefs.location) {
    // Country (EXACT)
    if (prefs.location.country_importance === 'MANDATORY' && prefs.location.country_id) {
      const countryMatches = candidate.profile_locations?.current_country_id === prefs.location.country_id ||
        (Array.isArray(candidate.profile_locations) && candidate.profile_locations.some(
          (loc: any) => loc.current_country_id === prefs.location?.country_id
        ));
      if (!countryMatches) {
        return { passed: false, reason: 'Country mismatch (Mandatory)' };
      }
    }

    // Province (EXACT)
    if (prefs.location.province_importance === 'MANDATORY' && prefs.location.province_id) {
      const provMatches = candidate.profile_locations?.current_province_id === prefs.location.province_id ||
        (Array.isArray(candidate.profile_locations) && candidate.profile_locations.some(
          (loc: any) => loc.current_province_id === prefs.location?.province_id
        ));
      if (!provMatches) {
        return { passed: false, reason: 'Province mismatch (Mandatory)' };
      }
    }

    // City (EXACT)
    if (prefs.location.city_importance === 'MANDATORY' && prefs.location.city_id) {
      const cityMatches = candidate.profile_locations?.current_city_id === prefs.location.city_id ||
        (Array.isArray(candidate.profile_locations) && candidate.profile_locations.some(
          (loc: any) => loc.current_city_id === prefs.location?.city_id
        ));
      if (!cityMatches) {
        return { passed: false, reason: 'City mismatch (Mandatory)' };
      }
    }
  }

  // ── 5. Profession / Income Preferences ────────────────────────
  if (prefs.profession) {
    // Income Range (RANGE)
    if (prefs.profession.income_importance === 'MANDATORY') {
      const candIncomeMin = candidate.income_information?.monthly_income_min ?? 0;
      const candIncomeMax = candidate.income_information?.monthly_income_max ?? candIncomeMin;
      const prefMinIncome = prefs.profession.minimum_monthly_income ?? 0;
      const prefMaxIncome = prefs.profession.maximum_monthly_income ?? Infinity;

      // Candidate's income range should overlap with preferred range
      if (candIncomeMax < prefMinIncome || candIncomeMin > prefMaxIncome) {
        return { passed: false, reason: `Income range ${candIncomeMin}-${candIncomeMax} is outside mandatory range ${prefMinIncome}-${prefMaxIncome}` };
      }
    }

    // Occupation (EXACT)
    if (prefs.profession.occupation_importance === 'MANDATORY' && prefs.profession.preferred_occupation_id) {
      const candOccupations = Array.isArray(candidate.employment_records)
        ? candidate.employment_records.map((e: any) => e.occupation_id)
        : [];
      if (!candOccupations.includes(prefs.profession.preferred_occupation_id)) {
        return { passed: false, reason: 'Occupation mismatch (Mandatory)' };
      }
    }

    // Employment Type (EXACT)
    if (prefs.profession.employment_type_importance === 'MANDATORY' && prefs.profession.preferred_employment_type) {
      const candTypes = Array.isArray(candidate.employment_records)
        ? candidate.employment_records.map((e: any) => e.employment_type)
        : [];
      if (!candTypes.includes(prefs.profession.preferred_employment_type)) {
        return { passed: false, reason: `Employment type must be ${prefs.profession.preferred_employment_type} (Mandatory)` };
      }
    }
  }

  // ── 6. Family Preferences ─────────────────────────────────────
  if (prefs.family) {
    // Family Setup (EXACT)
    if (prefs.family.family_setup_importance === 'MANDATORY' && prefs.family.family_setup) {
      if (candidate.residency_information?.family_setup !== prefs.family.family_setup) {
        return { passed: false, reason: `Family setup must be ${prefs.family.family_setup} (Mandatory), got ${candidate.residency_information?.family_setup}` };
      }
    }

    // Living With (EXACT)
    if (prefs.family.living_with_importance === 'MANDATORY' && prefs.family.living_with) {
      if (candidate.residency_information?.living_with !== prefs.family.living_with) {
        return { passed: false, reason: `Living arrangement must be ${prefs.family.living_with} (Mandatory)` };
      }
    }
  }

  // ── 7. Lifestyle Preferences (SMOKING, etc.) ──────────────────
  if (prefs.lifestyle) {
    // *** SMOKING (EXACT) — This was the missing check causing the bug ***
    if (prefs.lifestyle.smoking_importance === 'MANDATORY' && prefs.lifestyle.smoking) {
      const candidateSmoking = candidate.lifestyle_information?.smoking ||
                               candidate.lifestyle_information?.smoking_status; // seed uses smoking_status
      if (candidateSmoking !== prefs.lifestyle.smoking) {
        return { passed: false, reason: `Smoking must be ${prefs.lifestyle.smoking} (Mandatory), got ${candidateSmoking}` };
      }
    }

    // Religious Practice (EXACT) — also check from lifestyle prefs
    if (prefs.lifestyle.religious_practice_importance === 'MANDATORY' && prefs.lifestyle.religious_practice) {
      if (candidate.lifestyle_information?.religious_practice !== prefs.lifestyle.religious_practice) {
        return { passed: false, reason: `Religious practice must be ${prefs.lifestyle.religious_practice} (Mandatory), got ${candidate.lifestyle_information?.religious_practice}` };
      }
    }

    // Beard (EXACT)
    if (prefs.lifestyle.beard_importance === 'MANDATORY' && prefs.lifestyle.beard_preference) {
      if (candidate.lifestyle_information?.beard !== prefs.lifestyle.beard_preference) {
        return { passed: false, reason: `Beard must be ${prefs.lifestyle.beard_preference} (Mandatory)` };
      }
    }

    // Hijab (EXACT)
    if (prefs.lifestyle.hijab_importance === 'MANDATORY' && prefs.lifestyle.hijab_preference) {
      if (candidate.lifestyle_information?.hijab !== prefs.lifestyle.hijab_preference) {
        return { passed: false, reason: `Hijab must be ${prefs.lifestyle.hijab_preference} (Mandatory)` };
      }
    }
  }

  // ── 8. Education Preferences ──────────────────────────────────
  if (prefs.education) {
    // Minimum Education Level (EXACT or RANGE)
    if (prefs.education.education_importance === 'MANDATORY' && prefs.education.minimum_education_level_id) {
      const candEduLevels = Array.isArray(candidate.education_records)
        ? candidate.education_records.map((e: any) => e.education_level_id)
        : [];
      // Check if candidate has at least the minimum required education level
      // Since education_level_id is ordered (higher id = higher level), we check >= 
      const meetsMinimum = candEduLevels.some((id: number) => id >= prefs.education!.minimum_education_level_id!);
      if (!meetsMinimum) {
        return { passed: false, reason: 'Education level below mandatory minimum' };
      }
    }
  }

  // ── 9. Relocation Preferences ─────────────────────────────────
  if (prefs.relocation) {
    if (prefs.relocation.relocation_importance === 'MANDATORY' && prefs.relocation.willing_to_relocate_required === 'YES') {
      if (candidate.relocation_information?.willing_to_relocate !== 'YES') {
        return { passed: false, reason: 'Must be willing to relocate (Mandatory)' };
      }
    }
  }

  // All mandatory checks passed!
  return { passed: true };
}
