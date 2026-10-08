/**
 * ═══════════════════════════════════════════════════════════════
 * NikaahKaro Matching Engine — Data Shape Transformers
 * ═══════════════════════════════════════════════════════════════
 *
 * Converts flat rows from:
 *   • mv_matching_profiles (materialized view)
 *   • get_matching_candidates() (RPC)
 *   • v_current_matching_preferences (view)
 *
 * Into the nested shapes expected by hardFilters.ts and scoring.ts
 * so we do NOT touch any scoring/filtering logic.
 */

import type { AllPreferences } from '../types/database.types';

// ─── Candidate / Profile Transformer ────────────────────────────
// Converts a flat row from get_matching_candidates() or mv_matching_profiles
// into the nested shape: { id, personal_information: {...}, physical_information: {...}, ... }

export function transformFlatProfileToNested(row: any): any {
  return {
    id: row.profile_id,
    gender: row.gender,
    status: row.status ?? 'ACTIVE', // RPC only returns ACTIVE candidates

    personal_information: {
      full_name: row.full_name ?? null,
      date_of_birth: row.date_of_birth ?? null,
      marital_status: row.marital_status ?? null,
      number_of_children: row.number_of_children ?? 0,
      nationality_country_id: row.nationality_country_id ?? null,
      mother_tongue_id: row.mother_tongue_id ?? null,
    },

    physical_information: {
      height_cm: row.height_cm ?? null,
      weight_kg: row.weight_kg ?? null,
      complexion: row.complexion ?? null,
      has_disability: row.has_disability ?? false,
    },

    religion_information: {
      religion_id: row.religion_id ?? null,
      sect_id: row.sect_id ?? null,
      caste_id: row.caste_id ?? null,
    },

    profile_locations: {
      current_country_id: row.current_country_id ?? null,
      current_province_id: row.current_province_id ?? null,
      current_city_id: row.current_city_id ?? null,
      permanent_country_id: row.permanent_country_id ?? null,
      permanent_province_id: row.permanent_province_id ?? null,
      permanent_city_id: row.permanent_city_id ?? null,
    },

    residency_information: {
      house_status: row.house_status ?? null,
      property_type: row.property_type ?? null,
      family_setup: row.family_setup ?? null,
      living_with: row.living_with ?? null,
    },

    lifestyle_information: {
      beard: row.beard ?? null,
      hijab: row.hijab ?? null,
      religious_practice: row.religious_practice ?? null,
      smoking: row.smoking ?? null,
    },

    relocation_information: {
      willing_to_relocate: row.willing_to_relocate ?? null,
      preferred_country_id: row.relocation_country_id ?? null,
      preferred_province_id: row.relocation_province_id ?? null,
      preferred_city_id: row.relocation_city_id ?? null,
    },

    income_information: {
      monthly_income_min: row.monthly_income_min ?? null,
      monthly_income_max: row.monthly_income_max ?? null,
      currency_code: row.currency_code ?? 'PKR',
    },

    // MV has only the highest education, wrap as single-element array
    education_records: row.education_level_id
      ? [{
          education_level_id: row.education_level_id,
          qualification: row.qualification ?? null,
          field_of_study: row.field_of_study ?? null,
        }]
      : [],

    // MV has only the current employment, wrap as single-element array
    employment_records: row.occupation_id
      ? [{
          occupation_id: row.occupation_id,
          job_title: row.job_title ?? null,
          employment_type: row.employment_type ?? null,
          is_current: true,
        }]
      : [],
  };
}


// ─── Preference View → AllPreferences Transformer ───────────────
// Converts a flat row from v_current_matching_preferences into AllPreferences

export function transformFlatPrefsToAllPreferences(row: any): AllPreferences {
  const setId = row.preference_set_id;

  return {
    basic: {
      preference_set_id: setId,
      min_age: row.min_age ?? null,
      max_age: row.max_age ?? null,
      age_importance: row.age_importance ?? null,
      preferred_marital_status: row.preferred_marital_status ?? null,
      marital_status_importance: row.marital_status_importance ?? null,
      children_allowed: row.children_allowed ?? null,
      children_importance: row.children_importance ?? null,
      preferred_gender: row.preferred_gender ?? null,
      gender_importance: row.gender_importance ?? null,
      created_at: '',
    },

    physical: {
      preference_set_id: setId,
      min_height_cm: row.min_height_cm ?? null,
      max_height_cm: row.max_height_cm ?? null,
      height_importance: row.height_importance ?? null,
      min_weight_kg: row.min_weight_kg ?? null,
      max_weight_kg: row.max_weight_kg ?? null,
      weight_importance: row.weight_importance ?? null,
      preferred_complexion: row.preferred_complexion ?? null,
      complexion_importance: row.complexion_importance ?? null,
      disability_allowed: row.disability_allowed ?? null,
      disability_importance: row.disability_importance ?? null,
      beard_preference: row.beard_preference ?? null,
      beard_importance: row.beard_importance ?? null,
      hijab_preference: row.hijab_preference ?? null,
      hijab_importance: row.hijab_importance ?? null,
      created_at: '',
    },

    education: {
      preference_set_id: setId,
      minimum_education_level_id: row.minimum_education_level_id ?? null,
      education_importance: row.education_importance ?? null,
      preferred_field_of_study: row.preferred_field_of_study ?? null,
      field_importance: row.field_importance ?? null,
      created_at: '',
    },

    profession: {
      preference_set_id: setId,
      preferred_occupation_id: row.preferred_occupation_id ?? null,
      occupation_importance: row.occupation_importance ?? null,
      preferred_employment_type: row.preferred_employment_type ?? null,
      employment_type_importance: row.employment_type_importance ?? null,
      minimum_monthly_income: row.minimum_monthly_income ?? null,
      maximum_monthly_income: row.maximum_monthly_income ?? null,
      income_importance: row.income_importance ?? null,
      created_at: '',
    },

    religion: {
      preference_set_id: setId,
      religion_id: row.preferred_religion_id ?? null,
      religion_importance: row.religion_importance ?? null,
      sect_id: row.preferred_sect_id ?? null,
      sect_importance: row.sect_importance ?? null,
      caste_id: row.preferred_caste_id ?? null,
      caste_importance: row.caste_importance ?? null,
      religious_practice: row.preferred_religious_practice ?? null,
      religious_practice_importance: row.religion_practice_importance ?? null,
      created_at: '',
    },

    location: {
      preference_set_id: setId,
      country_id: row.preferred_country_id ?? null,
      country_importance: row.country_importance ?? null,
      province_id: row.preferred_province_id ?? null,
      province_importance: row.province_importance ?? null,
      city_id: row.preferred_city_id ?? null,
      city_importance: row.city_importance ?? null,
      location_details: row.location_details ?? null,
      created_at: '',
    },

    family: {
      preference_set_id: setId,
      family_setup: row.preferred_family_setup ?? null,
      family_setup_importance: row.family_setup_importance ?? null,
      living_with: row.preferred_living_with ?? null,
      living_with_importance: row.living_with_importance ?? null,
      parents_status_preference: row.parents_status_preference ?? null,
      parents_status_importance: row.parents_status_importance ?? null,
      created_at: '',
    },

    lifestyle: {
      preference_set_id: setId,
      smoking: row.preferred_smoking ?? null,
      smoking_importance: row.smoking_importance ?? null,
      religious_practice: row.preferred_lifestyle_religious_practice ?? null,
      religious_practice_importance: row.lifestyle_religious_practice_importance ?? null,
      beard_preference: row.preferred_lifestyle_beard ?? null,
      beard_importance: row.lifestyle_beard_importance ?? null,
      hijab_preference: row.preferred_lifestyle_hijab ?? null,
      hijab_importance: row.lifestyle_hijab_importance ?? null,
      additional_preferences: null,
      created_at: '',
    },

    relocation: {
      preference_set_id: setId,
      willing_to_relocate_required: row.willing_to_relocate_required ?? null,
      relocation_importance: row.relocation_importance ?? null,
      country_id: row.relocation_country_id ?? null,
      country_importance: row.relocation_country_importance ?? null,
      province_id: row.relocation_province_id ?? null,
      province_importance: row.relocation_province_importance ?? null,
      city_id: row.relocation_city_id ?? null,
      city_importance: row.relocation_city_importance ?? null,
      created_at: '',
    },
  };
}
