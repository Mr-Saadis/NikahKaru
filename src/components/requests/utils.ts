import type { RequestItem } from './types';
import type { MatchResult } from '@/lib/matching/types';

export type ProfileField = [string, string, string?]; // [label, value, field_path]
export type ProfileGroup = [string, ProfileField[]];

export function getMatchProfileGroups(match: any): ProfileGroup[] {
  const d = match.fullProfile || match.candidateData;
  if (!d) return [];

  return [
    ["Basic Information", [
      ["Profile picture", "Include", "personal_information.profile_picture"],
      ["Full name", d.full_name || 'N/A', "personal_information.full_name"], 
      ...(d.gender ? [["Gender", d.gender, "profiles.gender"] as ProfileField] : []),
      ["Phone", d.phone || d.primary_phone || 'N/A', "personal_information.phone"], 
      ["CNIC", d.cnic || 'N/A', "personal_information.cnic"],
      ["DOB", d.date_of_birth ? new Date(d.date_of_birth).toLocaleDateString() : 'N/A', "personal_information.date_of_birth"], 
      ["Marital status", d.marital_status || 'N/A', "personal_information.marital_status"],
      ...(d.marital_status !== 'NEVER_MARRIED' ? [["Children", d.number_of_children !== null && d.number_of_children !== undefined ? String(d.number_of_children) : 'N/A', "personal_information.number_of_children"] as ProfileField] : [])
    ]],
    ["Physical Attributes", [
      ["Height", d.height_cm ? `${d.height_cm} cm` : 'N/A', "physical_information.height_cm"], 
      ["Weight", d.weight_kg ? `${d.weight_kg} kg` : 'N/A', "physical_information.weight_kg"], 
      ["Complexion", d.complexion || 'N/A', "physical_information.complexion"],
      ["Disability", d.has_disability ? `Yes - ${d.disability_details}` : "No", "physical_information.has_disability"]
    ]],
    ["Education & Profession", [
      ["Education Level", d.qualification || 'N/A', "education_records"], 
      ["Field of Study", d.field_of_study || 'N/A', "education_records"], 
      ["Job Title", d.job_title || 'N/A', "employment_records"], 
      ["Income", d.monthly_income_min ? `Rs ${d.monthly_income_min} - ${d.monthly_income_max}` : 'N/A', "income_information.monthly_income_min"]
    ]],
    ["Religion & Culture", [
      ["Religion", d.religion_name_en || 'Islam', "religion_information.religion_id"], 
      ["Sect", d.sect_name_en || 'N/A', "religion_information.sect_id"], 
      ["Caste", d.caste_name_en || 'N/A', "religion_information.caste_id"], 
      ["Mother tongue", d.mother_tongue_name_en || 'N/A', "personal_information.mother_tongue_id"]
    ]],
    ["Location & Residency", [
      ...(d.current_country_name_en || d.current_country ? [["Current country", d.current_country_name_en || d.current_country, "profile_locations.current_country_id"] as ProfileField] : []),
      ["Current city", d.current_city_name_en || d.current_location_text || 'N/A', "profile_locations.current_city_id"], 
      ["Permanent city", d.permanent_city_name_en || d.permanent_location_text || 'N/A', "profile_locations.permanent_city_id"], 
      ["Residency", d.nationality_country_name_en || 'N/A', "residency_information.house_status"]
    ]],
    ["Family Details", [
      ["Profession", d.family_profession_business || 'N/A', "family_information.family_profession_business"], 
      ["Social Background", d.social_background || 'N/A', "family_information.social_background"], 
      ["Family Setup", d.family_setup || 'N/A', "residency_information.family_setup"], 
      ["Living With", d.living_with || 'N/A', "residency_information.living_with"]
    ]],
    ["Lifestyle", [
      ["Prayer", d.religious_practice || 'N/A', "lifestyle_information.religious_practice"], 
      ...(d.gender !== 'FEMALE' ? [["Beard", d.beard || 'N/A', "lifestyle_information.beard"] as ProfileField] : []), 
      ...(d.gender !== 'MALE' ? [["Hijab", d.hijab || 'N/A', "lifestyle_information.hijab"] as ProfileField] : []), 
      ["Smoking", d.smoking || 'N/A', "lifestyle_information.smoking"]
    ]]
  ];
}


function formatImportance(imp?: string | null): string {
  if (!imp) return '';
  switch (imp.toUpperCase()) {
    case 'MANDATORY':
      return 'Must Have';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    case 'DOESNT_MATTER':
    case 'DOES_NOT_MATTER':
      return "Doesn't Matter";
    default:
      return imp.replace(/_/g, ' ');
  }
}

function formatPrefItem(
  value: string | null | undefined,
  importance?: string | null
): string {
  const impLabel = formatImportance(importance);
  const isDoesntMatterImp = impLabel === "Doesn't Matter";

  if (!value || value.trim() === '' || isDoesntMatterImp) {
    return "Doesn't Matter";
  }

  if (impLabel) {
    return `${value} (${impLabel})`;
  }

  return value;
}

function cmToFtIn(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${ft}'${inches}"`;
}

export function formatPartnerPreferences(preferences?: any, isLoadingPrefs?: boolean, gender?: string): ProfileField[] {
  if (isLoadingPrefs) {
    return [["Status", "Loading partner preferences…"]];
  }

  if (!preferences || Object.keys(preferences).length === 0) {
    return [["Preferences", "No specific partner preferences recorded"]];
  }

  const { basic, physical, education, profession, religion, location, family, lifestyle, relocation } = preferences;
  const fields: ProfileField[] = [];

  // 1. Basic Preferences
  let ageVal: string | null = null;
  if (basic?.min_age && basic?.max_age) {
    ageVal = `${basic.min_age} - ${basic.max_age} yrs`;
  } else if (basic?.min_age) {
    ageVal = `${basic.min_age}+ yrs`;
  } else if (basic?.max_age) {
    ageVal = `Up to ${basic.max_age} yrs`;
  }
  fields.push(["Desired Age", formatPrefItem(ageVal, basic?.age_importance)]);

  const prefMarital = basic?.preferred_marital_status;
  const maritalVal = prefMarital
    ? prefMarital.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;
  fields.push(["Marital Status", formatPrefItem(maritalVal, basic?.marital_status_importance)]);

  // When marital status in partner preferences is never married, do not show children allowed
  if (prefMarital !== 'NEVER_MARRIED') {
    const childrenVal = basic?.children_allowed === 'YES' ? 'Yes' : basic?.children_allowed === 'NO' ? 'No' : null;
    fields.push(["Children Allowed", formatPrefItem(childrenVal, basic?.children_importance)]);
  }

  // 2. Physical Attributes
  let heightVal: string | null = null;
  if (physical?.min_height_cm && physical?.max_height_cm) {
    heightVal = `${cmToFtIn(Number(physical.min_height_cm))} - ${cmToFtIn(Number(physical.max_height_cm))} (${physical.min_height_cm} - ${physical.max_height_cm} cm)`;
  } else if (physical?.min_height_cm) {
    heightVal = `${cmToFtIn(Number(physical.min_height_cm))}+ (${physical.min_height_cm} cm+)`;
  } else if (physical?.max_height_cm) {
    heightVal = `Up to ${cmToFtIn(Number(physical.max_height_cm))} (${physical.max_height_cm} cm)`;
  }
  fields.push(["Desired Height", formatPrefItem(heightVal, physical?.height_importance)]);

  let weightVal: string | null = null;
  if (physical?.min_weight_kg && physical?.max_weight_kg) {
    weightVal = `${physical.min_weight_kg} - ${physical.max_weight_kg} kg`;
  } else if (physical?.min_weight_kg) {
    weightVal = `${physical.min_weight_kg}+ kg`;
  } else if (physical?.max_weight_kg) {
    weightVal = `Up to ${physical.max_weight_kg} kg`;
  }
  fields.push(["Desired Weight", formatPrefItem(weightVal, physical?.weight_importance)]);

  fields.push(["Complexion", formatPrefItem(physical?.preferred_complexion, physical?.complexion_importance)]);

  const disabilityVal = physical?.disability_allowed === 'YES' ? 'Yes' : physical?.disability_allowed === 'NO' ? 'No' : null;
  fields.push(["Disability Allowed", formatPrefItem(disabilityVal, physical?.disability_importance)]);

  // For male profile (looking for female bride), do not show beard preference
  if (gender !== 'MALE') {
    const beardRaw = physical?.beard_preference || lifestyle?.beard_preference;
    const beardImp = physical?.beard_importance || lifestyle?.beard_importance;
    const beardVal = beardRaw === 'YES' ? 'Yes' : beardRaw === 'NO' ? 'No' : null;
    fields.push(["Beard Preference", formatPrefItem(beardVal, beardImp)]);
  }

  // For female profile (looking for male groom), do not show hijab preference
  if (gender !== 'FEMALE') {
    const hijabRaw = physical?.hijab_preference || lifestyle?.hijab_preference;
    const hijabImp = physical?.hijab_importance || lifestyle?.hijab_importance;
    const hijabVal = hijabRaw === 'YES' ? 'Yes' : hijabRaw === 'NO' ? 'No' : null;
    fields.push(["Hijab Preference", formatPrefItem(hijabVal, hijabImp)]);
  }

  // 3. Education & Profession
  fields.push(["Min Education", formatPrefItem(education?.minimum_education_level_name_en, education?.education_importance)]);
  fields.push(["Field of Study", formatPrefItem(education?.preferred_field_of_study, education?.field_importance)]);
  fields.push(["Preferred Profession", formatPrefItem(profession?.preferred_occupation_name_en, profession?.occupation_importance)]);

  const empTypeVal = profession?.preferred_employment_type
    ? profession.preferred_employment_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;
  fields.push(["Employment Type", formatPrefItem(empTypeVal, profession?.employment_type_importance)]);

  let incomeVal: string | null = null;
  if (profession?.minimum_monthly_income && profession?.maximum_monthly_income) {
    incomeVal = `Rs ${Number(profession.minimum_monthly_income).toLocaleString()} - ${Number(profession.maximum_monthly_income).toLocaleString()}`;
  } else if (profession?.minimum_monthly_income) {
    incomeVal = `Rs ${Number(profession.minimum_monthly_income).toLocaleString()}+`;
  } else if (profession?.maximum_monthly_income) {
    incomeVal = `Up to Rs ${Number(profession.maximum_monthly_income).toLocaleString()}`;
  }
  fields.push(["Monthly Income", formatPrefItem(incomeVal, profession?.income_importance)]);

  // 4. Religion & Culture
  fields.push(["Religion", formatPrefItem(religion?.religion_name_en, religion?.religion_importance)]);
  fields.push(["Sect", formatPrefItem(religion?.sect_name_en, religion?.sect_importance)]);
  fields.push(["Caste", formatPrefItem(religion?.caste_name_en, religion?.caste_importance)]);

  const practiceRaw = religion?.religious_practice || lifestyle?.religious_practice;
  const practiceImp = religion?.religious_practice_importance || lifestyle?.religious_practice_importance;
  const practiceVal = practiceRaw
    ? practiceRaw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;
  fields.push(["Religious Practice", formatPrefItem(practiceVal, practiceImp)]);

  // 5. Location Preferences
  fields.push(["Preferred Country", formatPrefItem(location?.country_name_en, location?.country_importance)]);
  fields.push(["Preferred Province", formatPrefItem(location?.province_name_en, location?.province_importance)]);
  fields.push(["Preferred City", formatPrefItem(location?.city_name_en, location?.city_importance)]);

  // 6. Family & Living
  const familySetupVal = family?.family_setup
    ? family.family_setup.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;
  fields.push(["Family Setup", formatPrefItem(familySetupVal, family?.family_setup_importance)]);

  const livingWithVal = family?.living_with
    ? family.living_with.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;
  fields.push(["Living Preference", formatPrefItem(livingWithVal, family?.living_with_importance)]);

  fields.push(["Parents Status", formatPrefItem(family?.parents_status_preference, family?.parents_status_importance)]);

  // 7. Lifestyle & Habits
  const smokingRaw = lifestyle?.smoking;
  let smokingVal: string | null = null;
  if (smokingRaw === 'NO' || smokingRaw === 'NON_SMOKER') {
    smokingVal = 'Non-Smoker';
  } else if (smokingRaw === 'YES' || smokingRaw === 'SMOKER') {
    smokingVal = 'Smoker';
  } else if (smokingRaw === 'OCCASIONAL') {
    smokingVal = 'Occasional Smoker';
  } else if (smokingRaw) {
    smokingVal = smokingRaw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
  fields.push(["Smoking", formatPrefItem(smokingVal, lifestyle?.smoking_importance)]);

  // 8. Relocation
  const reloRaw = relocation?.willing_to_relocate_required;
  const reloVal = reloRaw === 'YES' ? 'Must be willing to relocate' : reloRaw === 'NO' ? 'No relocation required' : null;
  fields.push(["Relocation", formatPrefItem(reloVal, relocation?.relocation_importance)]);

  const reloLoc = [relocation?.country_name_en, relocation?.province_name_en, relocation?.city_name_en].filter(Boolean).join(', ');
  fields.push(["Relocation Target", formatPrefItem(reloLoc || null, relocation?.relocation_importance)]);

  return fields;
}

export function getProfileGroups(item: RequestItem, preferences?: any, isLoadingPrefs?: boolean): ProfileGroup[] {
  const d = item.profileData;
  if (!d) return [];

  const gender = d.gender || (preferences?.basic?.preferred_gender === 'FEMALE' ? 'MALE' : preferences?.basic?.preferred_gender === 'MALE' ? 'FEMALE' : undefined);

  return [
    ["Basic Information", [
      ["Profile picture", "Include"],
      ["Full name", d.full_name || item.name], 
      ...(d.gender ? [["Gender", d.gender] as ProfileField] : []),
      ["Phone", d.primary_phone || item.phone], 
      ["CNIC", d.cnic || item.cnic], 
      ["DOB", d.date_of_birth ? new Date(d.date_of_birth).toLocaleDateString() : 'N/A'], 
      ["Marital status", d.marital_status || 'N/A'],
      ...(d.marital_status !== 'NEVER_MARRIED' ? [["Children", d.number_of_children !== null ? String(d.number_of_children) : 'N/A'] as ProfileField] : [])
    ]],
    ["Physical Attributes", [
      ["Height", d.height_cm ? `${d.height_cm} cm` : 'N/A'], 
      ["Weight", d.weight_kg ? `${d.weight_kg} kg` : 'N/A'], 
      ["Complexion", d.complexion || 'N/A'], 
      ["Disability", d.has_disability ? `Yes - ${d.disability_details}` : "No"]
    ]],
    ["Education & Profession", [
      ["Education Level", d.qualification || 'N/A'], 
      ["Field of Study", d.field_of_study || 'N/A'], 
      ["Job Title", d.job_title || 'N/A'], 
      ["Income", d.monthly_income_min ? `Rs ${d.monthly_income_min} - ${d.monthly_income_max}` : 'N/A']
    ]],
    ["Religion & Culture", [
      ["Religion", d.religion_name_en || 'Islam'], 
      ["Sect", d.sect_name_en || 'N/A'], 
      ["Caste", d.caste_name_en || 'N/A'], 
      ["Mother tongue", d.mother_tongue_name_en || 'N/A']
    ]],
    ["Location & Residency", [
      ...(d.current_country_name_en || d.current_country ? [["Current country", d.current_country_name_en || d.current_country] as ProfileField] : []),
      ["Current city", d.current_city_name_en || d.current_location_text || 'N/A'], 
      ["Permanent city", d.permanent_city_name_en || d.permanent_location_text || 'N/A'], 
      ["Residency", d.nationality_country_name_en || 'N/A']
    ]],
    ["Family Details", [
      ["Profession", d.family_profession_business || 'N/A'], 
      ["Social Background", d.social_background || 'N/A'], 
      ["Family Setup", d.family_setup || 'N/A'], 
      ["Living With", d.living_with || 'N/A']
    ]],
    ["Lifestyle", [
      ["Prayer", d.religious_practice || 'N/A'], 
      ...(d.gender !== 'FEMALE' ? [["Beard", d.beard || 'N/A'] as ProfileField] : []), 
      ...(d.gender !== 'MALE' ? [["Hijab", d.hijab || 'N/A'] as ProfileField] : []), 
      ["Smoking", d.smoking || 'N/A']
    ]],
    ["Partner Preferences", formatPartnerPreferences(preferences, isLoadingPrefs, gender)]
  ];
}

