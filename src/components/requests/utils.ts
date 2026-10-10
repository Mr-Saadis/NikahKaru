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


export function getProfileGroups(item: RequestItem): ProfileGroup[] {
  const d = item.profileData;
  if (!d) return [];

  return [
    ["Basic Information", [
      ["Profile picture", "Include"],
      ["Full name", d.full_name || item.name], 
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
    ["Partner Preferences", [
      ["Note", "View full profile to see detailed partner preferences"]
    ]]
  ];
}
