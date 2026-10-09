// ============================================================
// NIKAAHKARO — COMPLETE DATABASE TYPES & ENUMS
// Mirrors: NikaahKaro_Phase_1_Database_Schema_v2.sql
// ============================================================

// ============================================================
// 1. ENUMS (mirror PostgreSQL enums exactly)
// ============================================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type ProfileGender = 'MALE' | 'FEMALE';

export type ProfileStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'INACTIVE' | 'ARCHIVED';

export type MaritalStatus = 'NEVER_MARRIED' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';

export type ParentType = 'FATHER' | 'MOTHER';

export type ParentStatus = 'ALIVE' | 'DECEASED';

export type EmploymentType =
  | 'GOVERNMENT'
  | 'PRIVATE'
  | 'BUSINESS'
  | 'SELF_EMPLOYED'
  | 'FREELANCER'
  | 'STUDENT'
  | 'UNEMPLOYED'
  | 'OTHER';

export type HouseStatus = 'OWN' | 'RENTED' | 'FAMILY_HOUSE' | 'OTHER';

export type PropertyType = 'HOUSE' | 'APARTMENT' | 'OTHER';

export type FamilySetup = 'JOINT' | 'SEPARATE';

export type LivingWith = 'PARENTS' | 'FATHER' | 'MOTHER' | 'SIBLINGS' | 'ALONE' | 'OTHER';

export type SiblingGender = 'MALE' | 'FEMALE';

export type RelationshipStatus =
  | 'MARRIED'
  | 'UNMARRIED'
  | 'DIVORCED'
  | 'WIDOWED'
  | 'SEPARATED'
  | 'OTHER';

export type ReligiousPracticeLevel = 'HIGHLY_PRACTICING' | 'PRACTICING' | 'MODERATE' | 'OTHER';

export type SmokingStatus = 'NO' | 'YES' | 'OCCASIONALLY';

export type YesNo = 'YES' | 'NO';

export type PreferenceImportance = 'MANDATORY' | 'HIGH' | 'MEDIUM' | 'LOW' | 'DOES_NOT_MATTER';

export type PreferenceMatchMode =
  | 'EXACT'
  | 'RANGE'
  | 'INCLUDES'
  | 'EXCLUDES'
  | 'MINIMUM'
  | 'MAXIMUM'
  | 'PREFERRED';

export type MatchRelationshipStatus =
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'CLOSED'
  | 'REOPENED';

export type RequestStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';

export type AssignmentStatus = 'ACTIVE' | 'ENDED';

export type FeedbackType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export type FeedbackImportance = 'LOW' | 'MEDIUM' | 'HIGH';

export type ReleaseStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'APPROVE'
  | 'REJECT'
  | 'RELEASE'
  | 'STATUS_CHANGE'
  | 'MATCH_RUN';

export type NotificationType = 'INFO' | 'REQUEST' | 'MATCH' | 'ASSIGNMENT' | 'SYSTEM' | 'ALERT';

// ============================================================
// 2. ROLES & AUTH TABLES
// ============================================================

export interface Role {
  id: string;
  name: 'HIGH_LEVEL_ADMIN' | 'MANAGER' | 'AGENT';
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  code: string;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

/** Combined user with role info — used by auth store */
export interface UserWithRole extends User {
  role: Role;
  permissions: string[];
}

// ============================================================
// 3. REFERENCE / LOOKUP TABLES
// ============================================================

export interface Country {
  id: number;
  code: string | null;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface Province {
  id: number;
  country_id: number;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface City {
  id: number;
  province_id: number | null;
  country_id: number;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface Religion {
  id: number;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface Sect {
  id: number;
  religion_id: number | null;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface Caste {
  id: number;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface MotherTongue {
  id: number;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface EducationLevel {
  id: number;
  name_en: string;
  name_ur: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Occupation {
  id: number;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

export interface RejectionReason {
  id: number;
  code: string;
  name_en: string;
  name_ur: string | null;
  is_active: boolean;
}

// ============================================================
// 4. PROFILE ROOT & AGENT ASSIGNMENT
// ============================================================

export interface Profile {
  id: string;
  gender: ProfileGender;
  status: ProfileStatus;
  created_by: string;
  current_agent_id: string | null;
  profile_URL: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface ProfileAgentAssignment {
  id: string;
  profile_id: string;
  agent_id: string;
  assigned_by: string | null;
  status: AssignmentStatus;
  assigned_at: string;
  ended_at: string | null;
  notes: string | null;
}

// ============================================================
// 5. PROFILE INFORMATION TABLES
// ============================================================

export interface PersonalInformation {
  profile_id: string;
  full_name: string;
  date_of_birth: string | null;
  marital_status: MaritalStatus;
  number_of_children: number;
  nationality_country_id: number | null;
  cnic: string | null;
  phone: string | null;
  mother_tongue_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface PhysicalInformation {
  profile_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  complexion: string | null;
  has_disability: boolean;
  disability_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface EducationRecord {
  id: string;
  profile_id: string;
  education_level_id: number | null;
  qualification: string | null;
  institution_name: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  is_highest_qualification: boolean;
  details: string | null;
  created_at: string;
}

export interface EmploymentRecord {
  id: string;
  profile_id: string;
  occupation_id: number | null;
  job_title: string | null;
  organization_name: string | null;
  employment_type: EmploymentType | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  details: string | null;
  created_at: string;
}

export interface IncomeInformation {
  profile_id: string;
  monthly_income_min: number | null;
  monthly_income_max: number | null;
  currency_code: string;
  income_period: string;
  created_at: string;
  updated_at: string;
}

export interface ReligionInformation {
  profile_id: string;
  religion_id: number | null;
  sect_id: number | null;
  caste_id: number | null;
  other_caste_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileLocation {
  profile_id: string;
  current_country_id: number | null;
  current_province_id: number | null;
  current_city_id: number | null;
  permanent_country_id: number | null;
  permanent_province_id: number | null;
  permanent_city_id: number | null;
  current_location_text: string | null;
  permanent_location_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResidencyInformation {
  profile_id: string;
  house_status: HouseStatus | null;
  property_type: PropertyType | null;
  family_setup: FamilySetup | null;
  living_with: LivingWith | null;
  living_with_other_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  profile_id: string;
  parent_type: ParentType;
  status: ParentStatus;
  full_name: string | null;
  age: number | null;
  profession: string | null;
  education: string | null;
  country_id: number | null;
  city_id: number | null;
  living_arrangement: string | null;
  social_background: string | null;
  additional_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sibling {
  id: string;
  profile_id: string;
  gender: SiblingGender;
  full_name: string | null;
  age: number | null;
  marital_status: RelationshipStatus | null;
  profession: string | null;
  education: string | null;
  country_id: number | null;
  city_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  profile_id: string;
  gender: SiblingGender | null;
  age: number | null;
  living_with_profile: boolean | null;
  additional_details: string | null;
  created_at: string;
}

export interface PreviousMarriage {
  id: string;
  profile_id: string;
  marriage_number: number;
  marriage_status: MaritalStatus | null;
  marriage_year: number | null;
  end_year: number | null;
  reason_for_end: string | null;
  children_count: number;
  sons_count: number;
  daughters_count: number;
  children_live_with_profile: boolean | null;
  additional_details: string | null;
  created_at: string;
}

export interface FamilyInformation {
  profile_id: string;
  family_profession_business: string | null;
  social_background: string | null;
  family_values: string | null;
  family_introduction: string | null;
  important_family_circumstances: string | null;
  additional_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface LifestyleInformation {
  profile_id: string;
  beard: YesNo | null;
  hijab: YesNo | null;
  religious_practice: ReligiousPracticeLevel | null;
  smoking: SmokingStatus | null;
  other_lifestyle_information: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelocationInformation {
  profile_id: string;
  willing_to_relocate: YesNo | null;
  preferred_country_id: number | null;
  preferred_province_id: number | null;
  preferred_city_id: number | null;
  relocation_details: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 6. PREFERENCE TABLES
// ============================================================

export interface PreferenceSet {
  id: string;
  profile_id: string;
  version: number;
  is_current: boolean;
  created_by: string;
  created_at: string;
}

export interface BasicPreferences {
  preference_set_id: string;
  min_age: number | null;
  max_age: number | null;
  age_importance: PreferenceImportance | null;
  preferred_marital_status: MaritalStatus | null;
  marital_status_importance: PreferenceImportance | null;
  children_allowed: YesNo | null;
  children_importance: PreferenceImportance | null;
  preferred_gender: ProfileGender | null;
  gender_importance: PreferenceImportance | null;
  created_at: string;
}

export interface PhysicalPreferences {
  preference_set_id: string;
  min_height_cm: number | null;
  max_height_cm: number | null;
  height_importance: PreferenceImportance | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  weight_importance: PreferenceImportance | null;
  preferred_complexion: string | null;
  complexion_importance: PreferenceImportance | null;
  disability_allowed: YesNo | null;
  disability_importance: PreferenceImportance | null;
  beard_preference: YesNo | null;
  beard_importance: PreferenceImportance | null;
  hijab_preference: YesNo | null;
  hijab_importance: PreferenceImportance | null;
  created_at: string;
}

export interface EducationPreferences {
  preference_set_id: string;
  minimum_education_level_id: number | null;
  education_importance: PreferenceImportance | null;
  preferred_field_of_study: string | null;
  field_importance: PreferenceImportance | null;
  created_at: string;
}

export interface ProfessionPreferences {
  preference_set_id: string;
  preferred_occupation_id: number | null;
  occupation_importance: PreferenceImportance | null;
  preferred_employment_type: EmploymentType | null;
  employment_type_importance: PreferenceImportance | null;
  minimum_monthly_income: number | null;
  maximum_monthly_income: number | null;
  income_importance: PreferenceImportance | null;
  created_at: string;
}

export interface ReligionPreferences {
  preference_set_id: string;
  religion_id: number | null;
  religion_importance: PreferenceImportance | null;
  sect_id: number | null;
  sect_importance: PreferenceImportance | null;
  caste_id: number | null;
  caste_importance: PreferenceImportance | null;
  religious_practice: ReligiousPracticeLevel | null;
  religious_practice_importance: PreferenceImportance | null;
  created_at: string;
}

export interface LocationPreferences {
  preference_set_id: string;
  country_id: number | null;
  country_importance: PreferenceImportance | null;
  province_id: number | null;
  province_importance: PreferenceImportance | null;
  city_id: number | null;
  city_importance: PreferenceImportance | null;
  location_details: string | null;
  created_at: string;
}

export interface FamilyPreferences {
  preference_set_id: string;
  family_setup: FamilySetup | null;
  family_setup_importance: PreferenceImportance | null;
  living_with: LivingWith | null;
  living_with_importance: PreferenceImportance | null;
  parents_status_preference: string | null;
  parents_status_importance: PreferenceImportance | null;
  created_at: string;
}

export interface LifestylePreferences {
  preference_set_id: string;
  smoking: SmokingStatus | null;
  smoking_importance: PreferenceImportance | null;
  religious_practice: ReligiousPracticeLevel | null;
  religious_practice_importance: PreferenceImportance | null;
  beard_preference: YesNo | null;
  beard_importance: PreferenceImportance | null;
  hijab_preference: YesNo | null;
  hijab_importance: PreferenceImportance | null;
  additional_preferences: string | null;
  created_at: string;
}

export interface RelocationPreferences {
  preference_set_id: string;
  willing_to_relocate_required: YesNo | null;
  relocation_importance: PreferenceImportance | null;
  country_id: number | null;
  country_importance: PreferenceImportance | null;
  province_id: number | null;
  province_importance: PreferenceImportance | null;
  city_id: number | null;
  city_importance: PreferenceImportance | null;
  created_at: string;
}

/** All preferences combined for a single preference set */
export interface AllPreferences {
  basic: BasicPreferences | null;
  physical: PhysicalPreferences | null;
  education: EducationPreferences | null;
  profession: ProfessionPreferences | null;
  religion: ReligionPreferences | null;
  location: LocationPreferences | null;
  family: FamilyPreferences | null;
  lifestyle: LifestylePreferences | null;
  relocation: RelocationPreferences | null;
}

// ============================================================
// 7. MATCHING TABLES
// ============================================================

export interface MatchRun {
  id: string;
  source_profile_id: string;
  preference_set_id: string;
  executed_by: string;
  algorithm_version: string;
  candidate_limit: number;
  candidates_considered: number;
  candidates_after_hard_filter: number;
  executed_at: string;
  metadata: Record<string, unknown>;
}

export interface MatchRunResult {
  id: string;
  match_run_id: string;
  candidate_profile_id: string;
  rank: number;
  source_to_candidate_score: number | null;
  candidate_to_source_score: number | null;
  final_score: number | null;
  passed_hard_filter: boolean;
  created_at: string;
}

export interface MatchScoreBreakdown {
  id: string;
  match_run_result_id: string;
  direction: ProfileGender;
  criterion_code: string;
  candidate_value: unknown;
  preferred_value: unknown;
  importance: PreferenceImportance | null;
  match_mode: PreferenceMatchMode | null;
  raw_score: number | null;
  weight: number | null;
  weighted_score: number | null;
  passed_hard_filter: boolean | null;
  explanation: string | null;
  algorithm_version: string;
  created_at: string;
}

// ============================================================
// 8. ACTUAL RELATIONSHIP (matches)
// ============================================================

export interface Match {
  id: string;
  male_profile_id: string;
  female_profile_id: string;
  source_match_run_result_id: string | null;
  status: MatchRelationshipStatus;
  final_score: number | null;
  created_by: string | null;
  first_contacted_at: string | null;
  in_progress_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchStatusHistory {
  id: string;
  match_id: string;
  old_status: MatchRelationshipStatus | null;
  new_status: MatchRelationshipStatus;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface MatchFeedback {
  id: string;
  match_id: string;
  provided_by: string;
  feedback_type: FeedbackType;
  rejection_reason_id: number | null;
  importance: FeedbackImportance | null;
  notes: string | null;
  created_at: string;
}

// ============================================================
// 9. INFORMATION REQUESTS & RELEASES
// ============================================================

export interface InformationRequest {
  id: string;
  requested_by: string;
  source_profile_id: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  manager_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InformationRequestAssignment {
  id: string;
  request_id: string;
  assigned_to: string;
  assigned_by: string | null;
  status: AssignmentStatus;
  assigned_at: string;
  ended_at: string | null;
  notes: string | null;
}

export interface InformationRelease {
  id: string;
  request_id: string;
  match_run_result_id: string;
  candidate_profile_id: string;
  released_by: string;
  release_status: ReleaseStatus;
  released_at: string;
  expires_at: string | null;
  notes: string | null;
}

export interface InformationReleaseField {
  id: string;
  release_id: string;
  field_path: string;
  field_value: unknown;
  created_at: string;
}

// ============================================================
// 10. NOTIFICATIONS & AUDIT
// ============================================================

export interface Notification {
  id: string;
  user_id: string | null;
  target_role: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_data: unknown;
  new_data: unknown;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// 11. COMPOSITE / VIEW TYPES (for UI use)
// ============================================================

/** Profile list item with basic info for tables */
export interface ProfileListItem {
  id: string;
  gender: ProfileGender;
  status: ProfileStatus;
  profile_URL: string | null;
  created_at: string;
  updated_at: string;
  current_agent_id: string | null;
  personal_information: {
    full_name: string;
    date_of_birth: string | null;
    marital_status: MaritalStatus;
  } | null;
  profile_locations: {
    current_city_id: number | null;
  } | null;
}

/** Full profile with all sections loaded */
export interface FullProfile extends Profile {
  personal_information: PersonalInformation | null;
  physical_information: PhysicalInformation | null;
  education_records: EducationRecord[];
  employment_records: EmploymentRecord[];
  income_information: IncomeInformation | null;
  religion_information: ReligionInformation | null;
  profile_locations: ProfileLocation | null;
  residency_information: ResidencyInformation | null;
  parents: Parent[];
  siblings: Sibling[];
  children: Child[];
  previous_marriages: PreviousMarriage[];
  family_information: FamilyInformation | null;
  lifestyle_information: LifestyleInformation | null;
  relocation_information: RelocationInformation | null;
  preference_sets: PreferenceSet[];
}

/** Matching result for preview/display */
export interface MatchCandidate {
  profile_id: string;
  full_name: string;
  age: number | null;
  gender: ProfileGender;
  city_name: string | null;
  education: string | null;
  profession: string | null;
  source_to_candidate_score: number;
  candidate_to_source_score: number;
  final_score: number;
  rank: number;
  passed_hard_filter: boolean;
  score_breakdown?: MatchScoreBreakdown[];
}

/** Reference data store shape */
export interface ReferenceData {
  countries: Country[];
  provinces: Province[];
  cities: City[];
  religions: Religion[];
  sects: Sect[];
  castes: Caste[];
  motherTongues: MotherTongue[];
  educationLevels: EducationLevel[];
  occupations: Occupation[];
  rejectionReasons: RejectionReason[];
}

// ============================================================
// 9. VIEWS
// ============================================================

export interface MvMatchingProfiles {
  profile_id: string | null;
  gender: string | null;
  status: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  number_of_children: number | null;
  nationality_country_id: number | null;
  mother_tongue_id: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  complexion: string | null;
  has_disability: boolean | null;
  religion_id: number | null;
  sect_id: number | null;
  caste_id: number | null;
  current_country_id: number | null;
  current_province_id: number | null;
  current_city_id: number | null;
  permanent_country_id: number | null;
  permanent_province_id: number | null;
  permanent_city_id: number | null;
  house_status: string | null;
  property_type: string | null;
  family_setup: string | null;
  living_with: string | null;
  beard: string | null;
  hijab: string | null;
  religious_practice: string | null;
  smoking: string | null;
  willing_to_relocate: string | null;
  relocation_country_id: number | null;
  relocation_province_id: number | null;
  relocation_city_id: number | null;
  monthly_income_min: number | null;
  monthly_income_max: number | null;
  currency_code: string | null;
  education_level_id: number | null;
  qualification: string | null;
  field_of_study: string | null;
  occupation_id: number | null;
  job_title: string | null;
  employment_type: string | null;
  family_profession_business: string | null;
  family_social_background: string | null;
  family_values: string | null;
}

export interface VCurrentMatchingPreferences {
  preference_set_id: string | null;
  profile_id: string | null;
  version: number | null;
  min_age: number | null;
  max_age: number | null;
  age_importance: string | null;
  preferred_marital_status: string | null;
  marital_status_importance: string | null;
  children_allowed: string | null;
  children_importance: string | null;
  preferred_gender: string | null;
  gender_importance: string | null;
  min_height_cm: number | null;
  max_height_cm: number | null;
  height_importance: string | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  weight_importance: string | null;
  preferred_complexion: string | null;
  complexion_importance: string | null;
  disability_allowed: string | null;
  disability_importance: string | null;
  beard_preference: string | null;
  beard_importance: string | null;
  hijab_preference: string | null;
  hijab_importance: string | null;
  minimum_education_level_id: number | null;
  education_importance: string | null;
  preferred_field_of_study: string | null;
  field_importance: string | null;
  preferred_occupation_id: number | null;
  occupation_importance: string | null;
  preferred_employment_type: string | null;
  employment_type_importance: string | null;
  minimum_monthly_income: number | null;
  maximum_monthly_income: number | null;
  income_importance: string | null;
  preferred_religion_id: number | null;
  religion_importance: string | null;
  preferred_sect_id: number | null;
  sect_importance: string | null;
  preferred_caste_id: number | null;
  caste_importance: string | null;
  preferred_religious_practice: string | null;
  religion_practice_importance: string | null;
  preferred_country_id: number | null;
  country_importance: string | null;
  preferred_province_id: number | null;
  province_importance: string | null;
  preferred_city_id: number | null;
  city_importance: string | null;
  location_details: string | null;
  preferred_family_setup: string | null;
  family_setup_importance: string | null;
  preferred_living_with: string | null;
  living_with_importance: string | null;
  parents_status_preference: string | null;
  parents_status_importance: string | null;
  preferred_smoking: string | null;
  smoking_importance: string | null;
  preferred_lifestyle_religious_practice: string | null;
  lifestyle_religious_practice_importance: string | null;
  preferred_lifestyle_beard: string | null;
  lifestyle_beard_importance: string | null;
  preferred_lifestyle_hijab: string | null;
  lifestyle_hijab_importance: string | null;
  willing_to_relocate_required: string | null;
  relocation_importance: string | null;
  relocation_country_id: number | null;
  relocation_country_importance: string | null;
  relocation_province_id: number | null;
  relocation_province_importance: string | null;
  relocation_city_id: number | null;
  relocation_city_importance: string | null;
}

