---
name: database-types-enums
description: TypeScript type definitions mirroring the complete PostgreSQL schema v2 — all tables, enums, relationships, and utility types.
---

# Database Types & Enums

## Overview
All TypeScript types MUST exactly mirror the PostgreSQL schema defined in `NikaahKaro_Phase_1_Database_Schema_v2.sql`. This skill defines every type needed.

## Implementation File
Create: `src/lib/types/database.types.ts`

## All Enums (from Schema Section 1)

```typescript
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ProfileGender = 'MALE' | 'FEMALE';
export type ProfileStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'INACTIVE' | 'ARCHIVED';
export type MaritalStatus = 'NEVER_MARRIED' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';
export type ParentStatus = 'ALIVE' | 'DECEASED';
export type EmploymentType = 'GOVERNMENT' | 'PRIVATE' | 'BUSINESS' | 'SELF_EMPLOYED' | 'FREELANCER' | 'STUDENT' | 'UNEMPLOYED' | 'OTHER';
export type HouseStatus = 'OWN' | 'RENTED' | 'FAMILY_HOUSE' | 'OTHER';
export type PropertyType = 'HOUSE' | 'APARTMENT' | 'OTHER';
export type FamilySetup = 'JOINT' | 'SEPARATE';
export type LivingWith = 'PARENTS' | 'FATHER' | 'MOTHER' | 'SIBLINGS' | 'ALONE' | 'OTHER';
export type SiblingGender = 'MALE' | 'FEMALE';
export type RelationshipStatus = 'MARRIED' | 'UNMARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'OTHER';
export type ReligiousPracticeLevel = 'HIGHLY_PRACTICING' | 'PRACTICING' | 'MODERATE' | 'OTHER';
export type SmokingStatus = 'NO' | 'YES' | 'OCCASIONALLY';
export type YesNo = 'YES' | 'NO';
export type PreferenceImportance = 'MANDATORY' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PreferenceMatchMode = 'EXACT' | 'RANGE' | 'INCLUDES' | 'EXCLUDES' | 'MINIMUM' | 'MAXIMUM' | 'PREFERRED';
export type MatchRelationshipStatus = 'IN_PROGRESS' | 'REJECTED' | 'ACCEPTED' | 'CLOSED' | 'REOPENED';
export type RequestStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type AssignmentStatus = 'ACTIVE' | 'ENDED';
export type FeedbackType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
export type FeedbackImportance = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReleaseStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'ASSIGN' | 'UNASSIGN' | 'APPROVE' | 'REJECT' | 'RELEASE' | 'STATUS_CHANGE' | 'MATCH_RUN';
export type NotificationType = 'INFO' | 'REQUEST' | 'MATCH' | 'ASSIGNMENT' | 'SYSTEM' | 'ALERT';
```

## All Table Types

```typescript
// Auth & Roles
export interface Role { id: string; name: string; description: string | null; created_at: string; }
export interface Permission { id: string; code: string; description: string | null; created_at: string; }
export interface RolePermission { role_id: string; permission_id: string; }
export interface User { id: string; full_name: string; email: string | null; phone: string | null; status: UserStatus; created_at: string; updated_at: string; }
export interface UserRole { user_id: string; role_id: string; assigned_by: string | null; assigned_at: string; }

// Reference Tables
export interface Country { id: number; code: string | null; name_en: string; name_ur: string | null; is_active: boolean; }
export interface Province { id: number; country_id: number; name_en: string; name_ur: string | null; is_active: boolean; }
export interface City { id: number; province_id: number | null; country_id: number; name_en: string; name_ur: string | null; is_active: boolean; }
export interface Religion { id: number; name_en: string; name_ur: string | null; is_active: boolean; }
export interface Sect { id: number; religion_id: number | null; name_en: string; name_ur: string | null; is_active: boolean; }
export interface Caste { id: number; name_en: string; name_ur: string | null; is_active: boolean; }
export interface MotherTongue { id: number; name_en: string; name_ur: string | null; is_active: boolean; }
export interface EducationLevel { id: number; name_en: string; name_ur: string | null; sort_order: number; is_active: boolean; }
export interface Occupation { id: number; name_en: string; name_ur: string | null; is_active: boolean; }
export interface RejectionReason { id: number; code: string; name_en: string; name_ur: string | null; is_active: boolean; }

// Profile
export interface Profile { id: string; gender: ProfileGender; status: ProfileStatus; created_by: string; current_agent_id: string | null; created_at: string; updated_at: string; archived_at: string | null; }
export interface ProfileAgentAssignment { id: string; profile_id: string; agent_id: string; assigned_by: string | null; status: AssignmentStatus; assigned_at: string; ended_at: string | null; notes: string | null; }

// Profile Information
export interface PersonalInformation { profile_id: string; full_name: string; date_of_birth: string | null; marital_status: MaritalStatus; number_of_children: number; nationality_country_id: number | null; mother_tongue_id: number | null; created_at: string; updated_at: string; }
export interface PhysicalInformation { profile_id: string; height_cm: number | null; weight_kg: number | null; complexion: string | null; has_disability: boolean; disability_details: string | null; created_at: string; updated_at: string; }
export interface EducationRecord { id: string; profile_id: string; education_level_id: number | null; qualification: string | null; institution_name: string | null; field_of_study: string | null; start_year: number | null; end_year: number | null; is_highest_qualification: boolean; details: string | null; created_at: string; }
export interface EmploymentRecord { id: string; profile_id: string; occupation_id: number | null; job_title: string | null; organization_name: string | null; employment_type: EmploymentType | null; start_date: string | null; end_date: string | null; is_current: boolean; details: string | null; created_at: string; }
export interface IncomeInformation { profile_id: string; monthly_income_min: number | null; monthly_income_max: number | null; currency_code: string; income_period: string; created_at: string; updated_at: string; }
export interface ReligionInformation { profile_id: string; religion_id: number | null; sect_id: number | null; caste_id: number | null; other_caste_text: string | null; created_at: string; updated_at: string; }
export interface ProfileLocation { profile_id: string; current_country_id: number | null; current_province_id: number | null; current_city_id: number | null; permanent_country_id: number | null; permanent_province_id: number | null; permanent_city_id: number | null; current_location_text: string | null; permanent_location_text: string | null; created_at: string; updated_at: string; }
export interface ResidencyInformation { profile_id: string; house_status: HouseStatus | null; property_type: PropertyType | null; family_setup: FamilySetup | null; living_with: LivingWith | null; living_with_other_details: string | null; created_at: string; updated_at: string; }
export interface Parent { id: string; profile_id: string; parent_type: 'FATHER' | 'MOTHER'; status: ParentStatus; full_name: string | null; age: number | null; profession: string | null; education: string | null; country_id: number | null; city_id: number | null; living_arrangement: string | null; social_background: string | null; additional_details: string | null; created_at: string; updated_at: string; }
export interface Sibling { id: string; profile_id: string; gender: SiblingGender; full_name: string | null; age: number | null; marital_status: RelationshipStatus | null; profession: string | null; education: string | null; country_id: number | null; city_id: number | null; created_at: string; updated_at: string; }
export interface Child { id: string; profile_id: string; gender: SiblingGender | null; age: number | null; living_with_profile: boolean | null; additional_details: string | null; created_at: string; }
export interface PreviousMarriage { id: string; profile_id: string; marriage_number: number; marriage_status: MaritalStatus | null; marriage_year: number | null; end_year: number | null; reason_for_end: string | null; children_count: number; sons_count: number; daughters_count: number; children_live_with_profile: boolean | null; additional_details: string | null; created_at: string; }
export interface FamilyInformation { profile_id: string; family_profession_business: string | null; social_background: string | null; family_values: string | null; family_introduction: string | null; important_family_circumstances: string | null; additional_details: string | null; created_at: string; updated_at: string; }
export interface LifestyleInformation { profile_id: string; beard: YesNo | null; hijab: YesNo | null; religious_practice: ReligiousPracticeLevel | null; smoking: SmokingStatus | null; other_lifestyle_information: string | null; created_at: string; updated_at: string; }
export interface RelocationInformation { profile_id: string; willing_to_relocate: YesNo | null; preferred_country_id: number | null; preferred_province_id: number | null; preferred_city_id: number | null; relocation_details: string | null; created_at: string; updated_at: string; }

// Preferences
export interface PreferenceSet { id: string; profile_id: string; version: number; is_current: boolean; created_by: string; created_at: string; }
export interface BasicPreferences { preference_set_id: string; min_age: number | null; max_age: number | null; age_importance: PreferenceImportance | null; preferred_marital_status: MaritalStatus | null; marital_status_importance: PreferenceImportance | null; children_allowed: YesNo | null; children_importance: PreferenceImportance | null; preferred_gender: ProfileGender | null; gender_importance: PreferenceImportance | null; created_at: string; }
// ... PhysicalPreferences, EducationPreferences, ProfessionPreferences, ReligionPreferences, LocationPreferences, FamilyPreferences, LifestylePreferences, RelocationPreferences — follow same pattern

// Matching
export interface MatchRun { id: string; source_profile_id: string; preference_set_id: string; executed_by: string; algorithm_version: string; candidate_limit: number; candidates_considered: number; candidates_after_hard_filter: number; executed_at: string; metadata: Record<string, any>; }
export interface MatchRunResult { id: string; match_run_id: string; candidate_profile_id: string; rank: number; source_to_candidate_score: number | null; candidate_to_source_score: number | null; final_score: number | null; passed_hard_filter: boolean; created_at: string; }
export interface MatchScoreBreakdown { id: string; match_run_result_id: string; direction: ProfileGender; criterion_code: string; candidate_value: any; preferred_value: any; importance: PreferenceImportance | null; match_mode: PreferenceMatchMode | null; raw_score: number | null; weight: number | null; weighted_score: number | null; passed_hard_filter: boolean | null; explanation: string | null; algorithm_version: string; created_at: string; }

// Matches (Actual Relationships)
export interface Match { id: string; male_profile_id: string; female_profile_id: string; source_match_run_result_id: string | null; status: MatchRelationshipStatus; final_score: number | null; created_by: string | null; first_contacted_at: string | null; in_progress_at: string | null; closed_at: string | null; created_at: string; updated_at: string; }
export interface MatchStatusHistory { id: string; match_id: string; old_status: MatchRelationshipStatus | null; new_status: MatchRelationshipStatus; changed_by: string | null; reason: string | null; created_at: string; }
export interface MatchFeedback { id: string; match_id: string; provided_by: string; feedback_type: FeedbackType; rejection_reason_id: number | null; importance: FeedbackImportance | null; notes: string | null; created_at: string; }

// Requests & Releases
export interface InformationRequest { id: string; requested_by: string; source_profile_id: string; status: RequestStatus; reviewed_by: string | null; reviewed_at: string | null; manager_notes: string | null; created_at: string; updated_at: string; }
export interface InformationRequestAssignment { id: string; request_id: string; assigned_to: string; assigned_by: string | null; status: AssignmentStatus; assigned_at: string; ended_at: string | null; notes: string | null; }
export interface InformationRelease { id: string; request_id: string; match_run_result_id: string; candidate_profile_id: string; released_by: string; release_status: ReleaseStatus; released_at: string; expires_at: string | null; notes: string | null; }
export interface InformationReleaseField { id: string; release_id: string; field_path: string; field_value: any; created_at: string; }

// Notifications & Audit
export interface Notification { id: string; user_id: string; type: NotificationType; title: string; message: string | null; entity_type: string | null; entity_id: string | null; is_read: boolean; read_at: string | null; created_at: string; }
export interface AuditLog { id: string; actor_user_id: string | null; action: AuditAction; entity_type: string; entity_id: string | null; old_data: any; new_data: any; metadata: Record<string, any>; created_at: string; }
```

## Notes
- All `id` fields for main entities are `string` (UUID)
- All reference table `id` fields are `number` (bigint identity)
- All timestamps are `string` (ISO 8601 from Supabase)
- `any` type for JSONB columns — can be refined per use case
- Age is NEVER stored — calculated from `date_of_birth`
