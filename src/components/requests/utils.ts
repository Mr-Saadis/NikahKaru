import type { RequestItem } from './types';
import type { MatchResult } from '@/lib/matching/types';

export type ProfileGroup = [string, [string, string][]];

export function getMatchProfileGroups(match: any): ProfileGroup[] {
  const d = match.fullProfile || match.candidateData;
  if (!d) return [];

  return [
    ["Basic Information", [
      ["Full name", d.full_name || 'N/A'], 
      ["Phone", d.primary_phone || 'N/A'], 
      ["DOB", d.date_of_birth ? new Date(d.date_of_birth).toLocaleDateString() : 'N/A'], 
      ["Marital status", d.marital_status || 'N/A'],
      ["Children", d.number_of_children !== null && d.number_of_children !== undefined ? String(d.number_of_children) : 'N/A']
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
      ["Beard", d.beard || 'N/A'], 
      ["Hijab", d.hijab || 'N/A'], 
      ["Smoking", d.smoking || 'N/A']
    ]]
  ];
}


export function getProfileGroups(item: RequestItem): ProfileGroup[] {
  const d = item.profileData;
  if (!d) return [];

  return [
    ["Basic Information", [
      ["Full name", d.full_name || item.name], 
      ["Phone", d.primary_phone || item.phone], 
      ["CNIC", d.cnic || item.cnic], 
      ["DOB", d.date_of_birth ? new Date(d.date_of_birth).toLocaleDateString() : 'N/A'], 
      ["Marital status", d.marital_status || 'N/A'],
      ["Children", d.number_of_children !== null ? String(d.number_of_children) : 'N/A']
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
      ["Beard", d.beard || 'N/A'], 
      ["Hijab", d.hijab || 'N/A'], 
      ["Smoking", d.smoking || 'N/A']
    ]],
    ["Partner Preferences", [
      ["Note", "View full profile to see detailed partner preferences"]
    ]]
  ];
}
