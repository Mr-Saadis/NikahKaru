-- ============================================================
-- NIKAAHKARO.COM - PHASE 1
-- SUPABASE / POSTGRESQL DATABASE SCHEMA v2
--
-- IMPORTANT WORKFLOW CHANGE IN v2:
-- 1. AGENT PREVIEW MATCHING IS NOT PERSISTED.
--    It is only a UI/convincing operation.
-- 2. AGENT DOES NOT select candidate profiles and request them.
--    Agent requests THEIR SOURCE PROFILE from the Manager.
-- 3. MANAGER runs the real matching engine.
--    Manager runs ARE persisted.
-- 4. Manager may choose any candidates from a saved Manager run
--    and release selected fields to the Agent.
-- 5. PDF is generated from the approved release snapshot.
-- 6. matches represents an actual relationship/pair lifecycle,
--    not a temporary Agent search result.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. ENUMS
-- ============================================================

create type public.user_status as enum ('ACTIVE','INACTIVE','SUSPENDED');
create type public.profile_gender as enum ('MALE','FEMALE');
create type public.profile_status as enum ('DRAFT','ACTIVE','PAUSED','INACTIVE','ARCHIVED');
create type public.marital_status as enum ('NEVER_MARRIED','MARRIED','DIVORCED','WIDOWED','SEPARATED');
create type public.parent_status as enum ('ALIVE','DECEASED');
create type public.employment_type as enum ('GOVERNMENT','PRIVATE','BUSINESS','SELF_EMPLOYED','FREELANCER','STUDENT','UNEMPLOYED','OTHER');
create type public.house_status as enum ('OWN','RENTED','FAMILY_HOUSE','OTHER');
create type public.property_type as enum ('HOUSE','APARTMENT','OTHER');
create type public.family_setup as enum ('JOINT','SEPARATE');
create type public.living_with as enum ('PARENTS','FATHER','MOTHER','SIBLINGS','ALONE','OTHER');
create type public.sibling_gender as enum ('MALE','FEMALE');
create type public.relationship_status as enum ('MARRIED','UNMARRIED','DIVORCED','WIDOWED','SEPARATED','OTHER');
create type public.religious_practice_level as enum ('HIGHLY_PRACTICING','PRACTICING','MODERATE','OTHER');
create type public.smoking_status as enum ('NO','YES','OCCASIONALLY');
create type public.yes_no as enum ('YES','NO');
create type public.preference_importance as enum ('MANDATORY','HIGH','MEDIUM','LOW', 'DOESNT_MATTER');
create type public.preference_match_mode as enum ('EXACT','RANGE','INCLUDES','EXCLUDES','MINIMUM','MAXIMUM','PREFERRED');

-- Agent preview is intentionally NOT represented by a DB status.
-- Only manager-generated persisted runs create match_run_results.
create type public.match_relationship_status as enum ('IN_PROGRESS','REJECTED','ACCEPTED','CLOSED','REOPENED');

create type public.request_status as enum ('PENDING','IN_REVIEW','COMPLETED','CANCELLED');
create type public.assignment_status as enum ('ACTIVE','ENDED');
create type public.feedback_type as enum ('POSITIVE','NEGATIVE','NEUTRAL');
create type public.feedback_importance as enum ('LOW','MEDIUM','HIGH');
create type public.release_status as enum ('ACTIVE','EXPIRED','REVOKED');
create type public.audit_action as enum ('CREATE','UPDATE','DELETE','VIEW','ASSIGN','UNASSIGN','APPROVE','REJECT','RELEASE','STATUS_CHANGE','MATCH_RUN');
create type public.notification_type as enum ('INFO','REQUEST','MATCH','ASSIGNMENT','SYSTEM','ALERT');

-- ============================================================
-- 2. ROLES
-- ============================================================

create table public.roles (
    id uuid primary key default gen_random_uuid(),
    name varchar(50) not null unique,
    description text,
    created_at timestamptz not null default now()
);

insert into public.roles (name, description) values
('HIGH_LEVEL_ADMIN','System-wide administrative access'),
('MANAGER','Operational manager responsible for reviewing profile requests and running official matching'),
('AGENT','Staff member responsible for collecting profile data and communicating with clients')
on conflict (name) do nothing;

create table public.permissions (
    id uuid primary key default gen_random_uuid(),
    code varchar(100) not null unique,
    description text,
    created_at timestamptz not null default now()
);

create table public.role_permissions (
    role_id uuid not null references public.roles(id) on delete cascade,
    permission_id uuid not null references public.permissions(id) on delete cascade,
    primary key (role_id, permission_id)
);

-- ============================================================
-- 3. USERS / AUTH
-- ============================================================

create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name varchar(200) not null,
    email varchar(320),
    phone varchar(30),
    status public.user_status not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.user_roles (
    user_id uuid not null references public.users(id) on delete cascade,
    role_id uuid not null references public.roles(id) on delete restrict,
    assigned_by uuid references public.users(id) on delete set null,
    assigned_at timestamptz not null default now(),
    primary key (user_id, role_id)
);

-- ============================================================
-- 4. REFERENCE TABLES
-- ============================================================

create table public.countries (
    id bigint generated always as identity primary key,
    code varchar(10) unique,
    name_en varchar(150) not null,
    name_ur varchar(150),
    is_active boolean not null default true
);

create table public.provinces (
    id bigint generated always as identity primary key,
    country_id bigint not null references public.countries(id) on delete restrict,
    name_en varchar(150) not null,
    name_ur varchar(150),
    is_active boolean not null default true,
    unique(country_id,name_en)
);

create table public.cities (
    id bigint generated always as identity primary key,
    province_id bigint references public.provinces(id) on delete restrict,
    country_id bigint not null references public.countries(id) on delete restrict,
    name_en varchar(150) not null,
    name_ur varchar(150),
    is_active boolean not null default true,
    unique(country_id,province_id,name_en)
);

create table public.religions (
    id bigint generated always as identity primary key,
    name_en varchar(100) not null unique,
    name_ur varchar(100),
    is_active boolean not null default true
);

create table public.sects (
    id bigint generated always as identity primary key,
    religion_id bigint references public.religions(id) on delete restrict,
    name_en varchar(100) not null,
    name_ur varchar(100),
    is_active boolean not null default true,
    unique(religion_id,name_en)
);

create table public.castes (
    id bigint generated always as identity primary key,
    name_en varchar(150) not null unique,
    name_ur varchar(150),
    is_active boolean not null default true
);

create table public.mother_tongues (
    id bigint generated always as identity primary key,
    name_en varchar(100) not null unique,
    name_ur varchar(100),
    is_active boolean not null default true
);

create table public.education_levels (
    id bigint generated always as identity primary key,
    name_en varchar(150) not null unique,
    name_ur varchar(150),
    sort_order integer not null default 0,
    is_active boolean not null default true
);

create table public.occupations (
    id bigint generated always as identity primary key,
    name_en varchar(150) not null unique,
    name_ur varchar(150),
    is_active boolean not null default true
);

create table public.rejection_reasons (
    id bigint generated always as identity primary key,
    code varchar(100) not null unique,
    name_en varchar(200) not null,
    name_ur varchar(200),
    is_active boolean not null default true
);

-- ============================================================
-- 5. PROFILE ROOT + AGENT ASSIGNMENT
-- ============================================================

create table public.profiles (
    id uuid primary key default gen_random_uuid(),
    gender public.profile_gender not null,
    status public.profile_status not null default 'DRAFT',
    created_by uuid not null references public.users(id) on delete restrict,
    current_agent_id uuid references public.users(id) on delete set null,
    profile_URL text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz
);

create table public.profile_agent_assignments (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    agent_id uuid not null references public.users(id) on delete restrict,
    assigned_by uuid references public.users(id) on delete set null,
    status public.assignment_status not null default 'ACTIVE',
    assigned_at timestamptz not null default now(),
    ended_at timestamptz,
    notes text,
    check((status='ACTIVE' and ended_at is null) or (status='ENDED' and ended_at is not null))
);

-- ============================================================
-- 6. PROFILE INFORMATION
-- ============================================================

create table public.personal_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    full_name varchar(250) not null,
    date_of_birth date,
    marital_status public.marital_status not null,
    number_of_children integer not null default 0,
    nationality_country_id bigint references public.countries(id) on delete restrict,
    cnic bigint,
    mother_tongue_id bigint references public.mother_tongues(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check(number_of_children >= 0)
);

-- Age is intentionally not stored: DOB is the source of truth.

create table public.physical_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    height_cm numeric(5,2),
    weight_kg numeric(6,2),
    complexion varchar(100),
    has_disability boolean not null default false,
    disability_details text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check(height_cm is null or height_cm between 80 and 250),
    check(weight_kg is null or weight_kg between 20 and 400),
    check(has_disability or disability_details is null)
);

create table public.education_records (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    education_level_id bigint references public.education_levels(id) on delete restrict,
    qualification varchar(250),
    institution_name varchar(250),
    field_of_study varchar(250),
    start_year smallint,
    end_year smallint,
    is_highest_qualification boolean not null default false,
    details text,
    created_at timestamptz not null default now(),
    check(start_year is null or start_year between 1900 and 2100),
    check(end_year is null or end_year between 1900 and 2100),
    check(start_year is null or end_year is null or end_year >= start_year)
);

create table public.employment_records (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    occupation_id bigint references public.occupations(id) on delete restrict,
    job_title varchar(200),
    organization_name varchar(250),
    employment_type public.employment_type,
    start_date date,
    end_date date,
    is_current boolean not null default false,
    details text,
    created_at timestamptz not null default now(),
    check(is_current or end_date is not null or start_date is null)
);

create table public.income_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    monthly_income_min numeric(14,2),
    monthly_income_max numeric(14,2),
    currency_code varchar(10) not null default 'PKR',
    income_period varchar(20) not null default 'MONTHLY',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check(monthly_income_min is null or monthly_income_min >= 0),
    check(monthly_income_max is null or monthly_income_max >= 0),
    check(monthly_income_min is null or monthly_income_max is null or monthly_income_max >= monthly_income_min)
);

create table public.religion_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    religion_id bigint references public.religions(id) on delete restrict,
    sect_id bigint references public.sects(id) on delete restrict,
    caste_id bigint references public.castes(id) on delete restrict,
    other_caste_text varchar(150),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.profile_locations (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    current_country_id bigint references public.countries(id) on delete restrict,
    current_province_id bigint references public.provinces(id) on delete restrict,
    current_city_id bigint references public.cities(id) on delete restrict,
    permanent_country_id bigint references public.countries(id) on delete restrict,
    permanent_province_id bigint references public.provinces(id) on delete restrict,
    permanent_city_id bigint references public.cities(id) on delete restrict,
    current_location_text varchar(250),
    permanent_location_text varchar(250),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.residency_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    house_status public.house_status,
    property_type public.property_type,
    family_setup public.family_setup,
    living_with public.living_with,
    living_with_other_details text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.parents (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    parent_type varchar(10) not null,
    status public.parent_status not null,
    full_name varchar(250),
    age integer,
    profession varchar(200),
    education varchar(200),
    country_id bigint references public.countries(id) on delete restrict,
    city_id bigint references public.cities(id) on delete restrict,
    living_arrangement varchar(250),
    social_background text,
    additional_details text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(profile_id,parent_type),
    check(parent_type in ('FATHER','MOTHER')),
    check(age is null or age between 18 and 120)
);

create table public.siblings (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    gender public.sibling_gender not null,
    full_name varchar(250),
    age integer,
    marital_status public.relationship_status,
    profession varchar(200),
    education varchar(200),
    country_id bigint references public.countries(id) on delete restrict,
    city_id bigint references public.cities(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check(age is null or age between 0 and 120)
);

create table public.children (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    gender public.sibling_gender,
    age integer,
    living_with_profile boolean,
    additional_details text,
    created_at timestamptz not null default now(),
    check(age is null or age between 0 and 120)
);

create table public.previous_marriages (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    marriage_number integer not null,
    marriage_status public.marital_status,
    marriage_year smallint,
    end_year smallint,
    reason_for_end text,
    children_count integer not null default 0,
    sons_count integer not null default 0,
    daughters_count integer not null default 0,
    children_live_with_profile boolean,
    additional_details text,
    created_at timestamptz not null default now(),
    unique(profile_id,marriage_number),
    check(marriage_number > 0),
    check(children_count >= 0 and sons_count >= 0 and daughters_count >= 0),
    check(sons_count + daughters_count <= children_count)
);

create table public.family_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    family_profession_business text,
    social_background text,
    family_values text,
    family_introduction text,
    important_family_circumstances text,
    additional_details text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.lifestyle_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    beard public.yes_no,
    hijab public.yes_no,
    religious_practice public.religious_practice_level,
    smoking public.smoking_status,
    other_lifestyle_information text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.relocation_information (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    willing_to_relocate public.yes_no,
    preferred_country_id bigint references public.countries(id) on delete restrict,
    preferred_province_id bigint references public.provinces(id) on delete restrict,
    preferred_city_id bigint references public.cities(id) on delete restrict,
    relocation_details text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. PREFERENCES
-- ============================================================

create table public.preference_sets (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    version integer not null default 1,
    is_current boolean not null default true,
    created_by uuid not null references public.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    unique(profile_id,version)
);

create table public.basic_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    min_age integer,
    max_age integer,
    age_importance public.preference_importance,
    preferred_marital_status public.marital_status,
    marital_status_importance public.preference_importance,
    children_allowed public.yes_no,
    children_importance public.preference_importance,
    preferred_gender public.profile_gender,
    gender_importance public.preference_importance,
    created_at timestamptz not null default now(),
    check(min_age is null or min_age between 18 and 100),
    check(max_age is null or max_age between 18 and 100),
    check(min_age is null or max_age is null or max_age >= min_age)
);

create table public.physical_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    min_height_cm numeric(5,2),
    max_height_cm numeric(5,2),
    height_importance public.preference_importance,
    min_weight_kg numeric(6,2),
    max_weight_kg numeric(6,2),
    weight_importance public.preference_importance,
    preferred_complexion varchar(100),
    complexion_importance public.preference_importance,
    disability_allowed public.yes_no,
    disability_importance public.preference_importance,
    beard_preference public.yes_no,
    beard_importance public.preference_importance,
    hijab_preference public.yes_no,
    hijab_importance public.preference_importance,
    created_at timestamptz not null default now(),
    check(min_height_cm is null or max_height_cm is null or max_height_cm >= min_height_cm),
    check(min_weight_kg is null or max_weight_kg is null or max_weight_kg >= min_weight_kg)
);

create table public.education_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    minimum_education_level_id bigint references public.education_levels(id) on delete restrict,
    education_importance public.preference_importance,
    preferred_field_of_study varchar(250),
    field_importance public.preference_importance,
    created_at timestamptz not null default now()
);

create table public.profession_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    preferred_occupation_id bigint references public.occupations(id) on delete restrict,
    occupation_importance public.preference_importance,
    preferred_employment_type public.employment_type,
    employment_type_importance public.preference_importance,
    minimum_monthly_income numeric(14,2),
    maximum_monthly_income numeric(14,2),
    income_importance public.preference_importance,
    created_at timestamptz not null default now(),
    check(minimum_monthly_income is null or maximum_monthly_income is null or maximum_monthly_income >= minimum_monthly_income)
);

create table public.religion_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    religion_id bigint references public.religions(id) on delete restrict,
    religion_importance public.preference_importance,
    sect_id bigint references public.sects(id) on delete restrict,
    sect_importance public.preference_importance,
    caste_id bigint references public.castes(id) on delete restrict,
    caste_importance public.preference_importance,
    religious_practice public.religious_practice_level,
    religious_practice_importance public.preference_importance,
    created_at timestamptz not null default now()
);

create table public.location_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    country_id bigint references public.countries(id) on delete restrict,
    country_importance public.preference_importance,
    province_id bigint references public.provinces(id) on delete restrict,
    province_importance public.preference_importance,
    city_id bigint references public.cities(id) on delete restrict,
    city_importance public.preference_importance,
    location_details text,
    created_at timestamptz not null default now()
);

create table public.family_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    family_setup public.family_setup,
    family_setup_importance public.preference_importance,
    living_with public.living_with,
    living_with_importance public.preference_importance,
    parents_status_preference varchar(100),
    parents_status_importance public.preference_importance,
    created_at timestamptz not null default now()
);

create table public.lifestyle_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    smoking public.smoking_status,
    smoking_importance public.preference_importance,
    religious_practice public.religious_practice_level,
    religious_practice_importance public.preference_importance,
    beard_preference public.yes_no,
    beard_importance public.preference_importance,
    hijab_preference public.yes_no,
    hijab_importance public.preference_importance,
    additional_preferences text,
    created_at timestamptz not null default now()
);

create table public.relocation_preferences (
    preference_set_id uuid primary key references public.preference_sets(id) on delete cascade,
    willing_to_relocate_required public.yes_no,
    relocation_importance public.preference_importance,
    country_id bigint references public.countries(id) on delete restrict,
    country_importance public.preference_importance,
    province_id bigint references public.provinces(id) on delete restrict,
    province_importance public.preference_importance,
    city_id bigint references public.cities(id) on delete restrict,
    city_importance public.preference_importance,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 8. OFFICIAL MANAGER MATCH RUNS
-- Agent preview matching DOES NOT write here.
-- ============================================================

create table public.match_runs (
    id uuid primary key default gen_random_uuid(),
    source_profile_id uuid not null references public.profiles(id) on delete restrict,
    preference_set_id uuid not null references public.preference_sets(id) on delete restrict,
    executed_by uuid not null references public.users(id) on delete restrict,
    algorithm_version varchar(50) not null default 'v1',
    candidate_limit integer not null default 25,
    candidates_considered integer not null default 0,
    candidates_after_hard_filter integer not null default 0,
    executed_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    check(candidate_limit > 0)
);

-- Every persisted result belongs to exactly one Manager run.
create table public.match_run_results (
    id uuid primary key default gen_random_uuid(),
    match_run_id uuid not null references public.match_runs(id) on delete cascade,
    candidate_profile_id uuid not null references public.profiles(id) on delete restrict,
    rank integer not null,
    source_to_candidate_score numeric(5,2),
    candidate_to_source_score numeric(5,2),
    final_score numeric(5,2),
    passed_hard_filter boolean not null default true,
    created_at timestamptz not null default now(),
    unique(match_run_id,candidate_profile_id),
    unique(match_run_id,rank),
    check(rank > 0),
    check(source_to_candidate_score is null or source_to_candidate_score between 0 and 100),
    check(candidate_to_source_score is null or candidate_to_source_score between 0 and 100),
    check(final_score is null or final_score between 0 and 100)
);

create table public.match_score_breakdowns (
    id uuid primary key default gen_random_uuid(),
    match_run_result_id uuid not null references public.match_run_results(id) on delete cascade,
    direction public.profile_gender not null,
    criterion_code varchar(100) not null,
    candidate_value jsonb,
    preferred_value jsonb,
    importance public.preference_importance,
    match_mode public.preference_match_mode,
    raw_score numeric(7,4),
    weight numeric(7,4),
    weighted_score numeric(7,4),
    passed_hard_filter boolean,
    explanation text,
    algorithm_version varchar(50) not null,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 9. ACTUAL PAIR / RELATIONSHIP
-- NOT used for Agent preview results.
-- ============================================================

create table public.matches (
    id uuid primary key default gen_random_uuid(),
    male_profile_id uuid not null references public.profiles(id) on delete restrict,
    female_profile_id uuid not null references public.profiles(id) on delete restrict,
    source_match_run_result_id uuid references public.match_run_results(id) on delete set null,
    status public.match_relationship_status not null default 'IN_PROGRESS',
    final_score numeric(5,2),
    created_by uuid references public.users(id) on delete set null,
    first_contacted_at timestamptz,
    in_progress_at timestamptz,
    closed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(male_profile_id,female_profile_id),
    check(male_profile_id <> female_profile_id),
    check(final_score is null or final_score between 0 and 100)
);

create table public.match_status_history (
    id uuid primary key default gen_random_uuid(),
    match_id uuid not null references public.matches(id) on delete cascade,
    old_status public.match_relationship_status,
    new_status public.match_relationship_status not null,
    changed_by uuid references public.users(id) on delete set null,
    reason text,
    created_at timestamptz not null default now()
);

create table public.match_feedback (
    id uuid primary key default gen_random_uuid(),
    match_id uuid not null references public.matches(id) on delete cascade,
    provided_by uuid not null references public.users(id) on delete restrict,
    feedback_type public.feedback_type not null,
    rejection_reason_id bigint references public.rejection_reasons(id) on delete restrict,
    importance public.feedback_importance,
    notes text,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 10. PROFILE REQUEST TO MANAGER
-- Agent requests THEIR SOURCE PROFILE, not candidate profiles.
-- ============================================================

create table public.information_requests (
    id uuid primary key default gen_random_uuid(),
    requested_by uuid not null references public.users(id) on delete restrict,
    source_profile_id uuid not null references public.profiles(id) on delete restrict,
    status public.request_status not null default 'PENDING',
    reviewed_by uuid references public.users(id) on delete set null,
    reviewed_at timestamptz,
    manager_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Manager may reassign the operational request to another agent.
create table public.information_request_assignments (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references public.information_requests(id) on delete cascade,
    assigned_to uuid not null references public.users(id) on delete restrict,
    assigned_by uuid references public.users(id) on delete set null,
    status public.assignment_status not null default 'ACTIVE',
    assigned_at timestamptz not null default now(),
    ended_at timestamptz,
    notes text,
    check((status='ACTIVE' and ended_at is null) or (status='ENDED' and ended_at is not null))
);

-- ============================================================
-- 11. MANAGER RELEASES
-- Manager chooses candidates and individual fields.
-- No Agent-side candidate selection/request table is needed.
-- ============================================================

create table public.information_releases (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references public.information_requests(id) on delete cascade,
    match_run_result_id uuid not null references public.match_run_results(id) on delete restrict,
    candidate_profile_id uuid not null references public.profiles(id) on delete restrict,
    released_by uuid not null references public.users(id) on delete restrict,
    release_status public.release_status not null default 'ACTIVE',
    released_at timestamptz not null default now(),
    expires_at timestamptz,
    notes text,
    unique(request_id,match_run_result_id),
    check(expires_at is null or expires_at > released_at)
);

create table public.information_release_fields (
    id uuid primary key default gen_random_uuid(),
    release_id uuid not null references public.information_releases(id) on delete cascade,
    field_path varchar(250) not null,
    field_value jsonb,
    created_at timestamptz not null default now(),
    unique(release_id,field_path)
);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    type public.notification_type not null,
    title varchar(250) not null,
    message text,
    entity_type varchar(100),
    entity_id uuid,
    is_read boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 13. AUDIT LOGS
-- ============================================================

create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references public.users(id) on delete set null,
    action public.audit_action not null,
    entity_type varchar(100) not null,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 14. INDEXES
-- ============================================================

create index idx_profiles_gender on public.profiles(gender);
create index idx_profiles_status on public.profiles(status);
create index idx_profiles_current_agent on public.profiles(current_agent_id);
create index idx_profiles_created_by on public.profiles(created_by);

create index idx_personal_marital on public.personal_information(marital_status);
create index idx_personal_dob on public.personal_information(date_of_birth);
create index idx_personal_nationality on public.personal_information(nationality_country_id);

create index idx_locations_current_city on public.profile_locations(current_city_id);
create index idx_locations_permanent_city on public.profile_locations(permanent_city_id);

create index idx_education_profile on public.education_records(profile_id);
create index idx_employment_profile on public.employment_records(profile_id);
create index idx_siblings_profile on public.siblings(profile_id);
create index idx_children_profile on public.children(profile_id);
create index idx_previous_marriages_profile on public.previous_marriages(profile_id);

create index idx_preference_sets_profile on public.preference_sets(profile_id);
create index idx_preference_sets_current on public.preference_sets(profile_id,is_current);

create index idx_match_runs_source on public.match_runs(source_profile_id,executed_at desc);
create index idx_match_runs_executor on public.match_runs(executed_by,executed_at desc);
create index idx_match_results_run on public.match_run_results(match_run_id,rank);
create index idx_match_results_candidate on public.match_run_results(candidate_profile_id);
create index idx_match_results_score on public.match_run_results(final_score desc);
create index idx_match_breakdowns_result on public.match_score_breakdowns(match_run_result_id);

create index idx_matches_male on public.matches(male_profile_id);
create index idx_matches_female on public.matches(female_profile_id);
create index idx_matches_status on public.matches(status);
create index idx_matches_score on public.matches(final_score desc);

create index idx_requests_requested_by on public.information_requests(requested_by);
create index idx_requests_source_profile on public.information_requests(source_profile_id);
create index idx_requests_status on public.information_requests(status);
create index idx_request_assignments_request on public.information_request_assignments(request_id);
create index idx_request_assignments_agent on public.information_request_assignments(assigned_to);

create index idx_releases_request on public.information_releases(request_id);
create index idx_releases_candidate on public.information_releases(candidate_profile_id);
create index idx_releases_run_result on public.information_releases(match_run_result_id);
create index idx_release_fields_release on public.information_release_fields(release_id);

create index idx_notifications_user on public.notifications(user_id,is_read);
create index idx_audit_entity on public.audit_logs(entity_type,entity_id);
create index idx_audit_actor on public.audit_logs(actor_user_id);
create index idx_audit_created on public.audit_logs(created_at desc);

-- ============================================================
-- 15. BUSINESS UNIQUE INDEXES
-- ============================================================

create unique index uq_active_profile_agent_assignment
on public.profile_agent_assignments(profile_id)
where status='ACTIVE';

create unique index uq_current_preference_set
on public.preference_sets(profile_id)
where is_current=true;

create unique index uq_active_request_assignment
on public.information_request_assignments(request_id)
where status='ACTIVE';

create unique index uq_active_information_release
on public.information_releases(request_id,candidate_profile_id)
where release_status='ACTIVE';

-- One active relationship per person in Phase 1.
create unique index uq_one_active_male_relationship
on public.matches(male_profile_id)
where status='IN_PROGRESS';

create unique index uq_one_active_female_relationship
on public.matches(female_profile_id)
where status='IN_PROGRESS';

-- ============================================================
-- 16. VALIDATION FUNCTIONS / TRIGGERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
    select auth.uid();
$$;

create or replace function public.has_role(target_role varchar)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
    select exists(
        select 1
        from public.user_roles ur
        join public.roles r on r.id=ur.role_id
        where ur.user_id=auth.uid()
          and r.name=target_role
    );
$$;

create or replace function public.validate_match_genders()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
    mg public.profile_gender;
    fg public.profile_gender;
begin
    select gender into mg from public.profiles where id=new.male_profile_id;
    select gender into fg from public.profiles where id=new.female_profile_id;
    if mg <> 'MALE' then raise exception 'male_profile_id must reference a MALE profile'; end if;
    if fg <> 'FEMALE' then raise exception 'female_profile_id must reference a FEMALE profile'; end if;
    return new;
end;
$$;

create trigger trg_validate_match_genders
before insert or update on public.matches
for each row execute function public.validate_match_genders();

create or replace function public.validate_preference_gender()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare source_gender public.profile_gender;
begin
    select p.gender into source_gender
    from public.profiles p
    join public.preference_sets ps on ps.profile_id=p.id
    where ps.id=new.preference_set_id;

    if source_gender = new.preferred_gender then
        raise exception 'Preferred gender must represent the opposite gender';
    end if;
    return new;
end;
$$;

create trigger trg_validate_basic_preference_gender
before insert or update on public.basic_preferences
for each row execute function public.validate_preference_gender();

create or replace function public.sync_profile_current_agent()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
    if new.status='ACTIVE' then
        update public.profiles
        set current_agent_id=new.agent_id
        where id=new.profile_id;
    elsif new.status='ENDED' then
        update public.profiles
        set current_agent_id=null
        where id=new.profile_id and current_agent_id=new.agent_id;
    end if;
    return new;
end;
$$;

create trigger trg_sync_profile_current_agent
after insert or update on public.profile_agent_assignments
for each row execute function public.sync_profile_current_agent();

create or replace function public.record_match_status_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
    if tg_op='INSERT' then
        insert into public.match_status_history(match_id,old_status,new_status,created_at)
        values(new.id,null,new.status,now());
    elsif old.status is distinct from new.status then
        insert into public.match_status_history(match_id,old_status,new_status,created_at)
        values(new.id,old.status,new.status,now());
    end if;
    return new;
end;
$$;

create trigger trg_record_match_status_change
after insert or update on public.matches
for each row execute function public.record_match_status_change();

create or replace function public.set_match_progress_timestamp()
returns trigger
language plpgsql
as $$
begin
    if new.status='IN_PROGRESS' and old.status is distinct from 'IN_PROGRESS' then
        new.in_progress_at=coalesce(new.in_progress_at,now());
    end if;
    if new.status in ('CLOSED','REJECTED','ACCEPTED') and old.status is distinct from new.status then
        new.closed_at=coalesce(new.closed_at,now());
    end if;
    return new;
end;
$$;

create trigger trg_set_match_progress_timestamp
before update on public.matches
for each row execute function public.set_match_progress_timestamp();

-- ============================================================
-- 17. UPDATED_AT TRIGGERS
-- ============================================================

create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_personal_updated_at before update on public.personal_information for each row execute function public.set_updated_at();
create trigger trg_physical_updated_at before update on public.physical_information for each row execute function public.set_updated_at();
create trigger trg_income_updated_at before update on public.income_information for each row execute function public.set_updated_at();
create trigger trg_religion_updated_at before update on public.religion_information for each row execute function public.set_updated_at();
create trigger trg_locations_updated_at before update on public.profile_locations for each row execute function public.set_updated_at();
create trigger trg_residency_updated_at before update on public.residency_information for each row execute function public.set_updated_at();
create trigger trg_parents_updated_at before update on public.parents for each row execute function public.set_updated_at();
create trigger trg_family_updated_at before update on public.family_information for each row execute function public.set_updated_at();
create trigger trg_lifestyle_updated_at before update on public.lifestyle_information for each row execute function public.set_updated_at();
create trigger trg_relocation_updated_at before update on public.relocation_information for each row execute function public.set_updated_at();
create trigger trg_matches_updated_at before update on public.matches for each row execute function public.set_updated_at();
create trigger trg_requests_updated_at before update on public.information_requests for each row execute function public.set_updated_at();

-- ============================================================
-- 18. PROFILE / MATCH HELPERS
-- ============================================================

create or replace function public.is_profile_active(target_profile_id uuid)
returns boolean
language sql
stable
as $$
    select exists(select 1 from public.profiles where id=target_profile_id and status='ACTIVE');
$$;

create or replace function public.profile_has_active_match(target_profile_id uuid)
returns boolean
language sql
stable
as $$
    select exists(
        select 1 from public.matches m
        where m.status='IN_PROGRESS'
          and (m.male_profile_id=target_profile_id or m.female_profile_id=target_profile_id)
    );
$$;

-- ============================================================
-- 19. AUTH USER -> APPLICATION USER
-- ============================================================

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
    insert into public.users(id,email,full_name)
    values(
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name',split_part(coalesce(new.email,''),'@',1))
    )
    on conflict(id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_user_profile();

-- ============================================================
-- 20. RLS ENABLEMENT
-- ============================================================

alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

alter table public.profiles enable row level security;
alter table public.profile_agent_assignments enable row level security;

alter table public.personal_information enable row level security;
alter table public.physical_information enable row level security;
alter table public.education_records enable row level security;
alter table public.employment_records enable row level security;
alter table public.income_information enable row level security;
alter table public.religion_information enable row level security;
alter table public.profile_locations enable row level security;
alter table public.residency_information enable row level security;
alter table public.parents enable row level security;
alter table public.siblings enable row level security;
alter table public.children enable row level security;
alter table public.previous_marriages enable row level security;
alter table public.family_information enable row level security;
alter table public.lifestyle_information enable row level security;
alter table public.relocation_information enable row level security;

alter table public.preference_sets enable row level security;
alter table public.basic_preferences enable row level security;
alter table public.physical_preferences enable row level security;
alter table public.education_preferences enable row level security;
alter table public.profession_preferences enable row level security;
alter table public.religion_preferences enable row level security;
alter table public.location_preferences enable row level security;
alter table public.family_preferences enable row level security;
alter table public.lifestyle_preferences enable row level security;
alter table public.relocation_preferences enable row level security;

alter table public.match_runs enable row level security;
alter table public.match_run_results enable row level security;
alter table public.match_score_breakdowns enable row level security;
alter table public.matches enable row level security;
alter table public.match_status_history enable row level security;
alter table public.match_feedback enable row level security;

alter table public.information_requests enable row level security;
alter table public.information_request_assignments enable row level security;
alter table public.information_releases enable row level security;
alter table public.information_release_fields enable row level security;

alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================
-- 21. BASIC RLS POLICIES
--
-- NOTE: These are intentionally conservative. The application/server
-- layer should use SECURITY DEFINER RPCs for sensitive manager actions.
-- Do not rely on frontend hiding alone.
-- ============================================================

create policy users_self_select on public.users
for select to authenticated
using(id=auth.uid() or public.has_role('HIGH_LEVEL_ADMIN'));

create policy users_admin_manage on public.users
for all to authenticated
using(public.has_role('HIGH_LEVEL_ADMIN'))
with check(public.has_role('HIGH_LEVEL_ADMIN'));

create policy profiles_select on public.profiles
for select to authenticated
using(
    public.has_role('HIGH_LEVEL_ADMIN')
    or public.has_role('MANAGER')
    or current_agent_id=auth.uid()
);

create policy profiles_agent_insert on public.profiles
for insert to authenticated
with check(public.has_role('AGENT') and created_by=auth.uid());

create policy profiles_update on public.profiles
for update to authenticated
using(
    public.has_role('HIGH_LEVEL_ADMIN')
    or public.has_role('MANAGER')
    or current_agent_id=auth.uid()
)
with check(
    public.has_role('HIGH_LEVEL_ADMIN')
    or public.has_role('MANAGER')
    or current_agent_id=auth.uid()
);

create policy notifications_select_own on public.notifications
for select to authenticated using(user_id=auth.uid());

create policy notifications_update_own on public.notifications
for update to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());

create policy audit_logs_admin_select on public.audit_logs
for select to authenticated using(public.has_role('HIGH_LEVEL_ADMIN'));

-- ============================================================
-- 22. DOCUMENTATION
-- ============================================================

comment on table public.profiles is 'One matrimonial profile per person. Root entity for all profile information.';
comment on table public.match_runs is 'Persisted matching-engine executions created by Manager. Agent preview matching is not stored here.';
comment on table public.match_run_results is 'Candidate results belonging to one persisted Manager match run.';
comment on table public.match_score_breakdowns is 'Criterion-level scoring details for a persisted Manager match-run result.';
comment on table public.matches is 'Actual male-female relationship lifecycle. Not a temporary Agent preview result.';
comment on table public.information_requests is 'Agent request for Manager processing of the Agent source profile.';
comment on table public.information_releases is 'Manager-approved candidate information released in response to an Agent request.';
comment on table public.information_release_fields is 'Immutable snapshot of exact fields/values approved by Manager for release.';
comment on table public.audit_logs is 'System audit trail for important actions.';

-- ============================================================
-- END
-- ============================================================

=====================================================
-- NEW VIEWS (Added via DB modifications)
-- ============================================================

-- Note: This is an automatically reverse-engineered schema for the view 'v_current_matching_preferences'.
CREATE OR REPLACE VIEW public.v_current_matching_preferences AS
SELECT
    null::uuid AS preference_set_id,
    null::uuid AS profile_id,
    null::integer AS version,
    null::integer AS min_age,
    null::integer AS max_age,
    null::text AS age_importance,
    null::text AS preferred_marital_status,
    null::text AS marital_status_importance,
    null::text AS children_allowed,
    null::text AS children_importance,
    null::text AS preferred_gender,
    null::text AS gender_importance,
    null::numeric AS min_height_cm,
    null::numeric AS max_height_cm,
    null::text AS height_importance,
    null::numeric AS min_weight_kg,
    null::numeric AS max_weight_kg,
    null::text AS weight_importance,
    null::text AS preferred_complexion,
    null::text AS complexion_importance,
    null::text AS disability_allowed,
    null::text AS disability_importance,
    null::text AS beard_preference,
    null::text AS beard_importance,
    null::text AS hijab_preference,
    null::text AS hijab_importance,
    null::bigint AS minimum_education_level_id,
    null::text AS education_importance,
    null::text AS preferred_field_of_study,
    null::text AS field_importance,
    null::bigint AS preferred_occupation_id,
    null::text AS occupation_importance,
    null::text AS preferred_employment_type,
    null::text AS employment_type_importance,
    null::numeric AS minimum_monthly_income,
    null::numeric AS maximum_monthly_income,
    null::text AS income_importance,
    null::bigint AS preferred_religion_id,
    null::text AS religion_importance,
    null::bigint AS preferred_sect_id,
    null::text AS sect_importance,
    null::bigint AS preferred_caste_id,
    null::text AS caste_importance,
    null::text AS preferred_religious_practice,
    null::text AS religion_practice_importance,
    null::bigint AS preferred_country_id,
    null::text AS country_importance,
    null::bigint AS preferred_province_id,
    null::text AS province_importance,
    null::bigint AS preferred_city_id,
    null::text AS city_importance,
    null::text AS location_details,
    null::text AS preferred_family_setup,
    null::text AS family_setup_importance,
    null::text AS preferred_living_with,
    null::text AS living_with_importance,
    null::text AS parents_status_preference,
    null::text AS parents_status_importance,
    null::text AS preferred_smoking,
    null::text AS smoking_importance,
    null::text AS preferred_lifestyle_religious_practice,
    null::text AS lifestyle_religious_practice_importance,
    null::text AS preferred_lifestyle_beard,
    null::text AS lifestyle_beard_importance,
    null::text AS preferred_lifestyle_hijab,
    null::text AS lifestyle_hijab_importance,
    null::text AS willing_to_relocate_required,
    null::text AS relocation_importance,
    null::bigint AS relocation_country_id,
    null::text AS relocation_country_importance,
    null::bigint AS relocation_province_id,
    null::text AS relocation_province_importance,
    null::bigint AS relocation_city_id,
    null::text AS relocation_city_importance
;

-- Note: This is an automatically reverse-engineered schema for the view 'mv_matching_profiles'.
CREATE OR REPLACE MATERIALIZED VIEW public.mv_matching_profiles AS
SELECT
    null::uuid AS profile_id,
    null::text AS gender,
    null::text AS status,
    null::text AS full_name,
    null::date AS date_of_birth,
    null::text AS marital_status,
    null::integer AS number_of_children,
    null::bigint AS nationality_country_id,
    null::bigint AS mother_tongue_id,
    null::numeric AS height_cm,
    null::numeric AS weight_kg,
    null::text AS complexion,
    null::boolean AS has_disability,
    null::bigint AS religion_id,
    null::bigint AS sect_id,
    null::bigint AS caste_id,
    null::bigint AS current_country_id,
    null::bigint AS current_province_id,
    null::bigint AS current_city_id,
    null::bigint AS permanent_country_id,
    null::bigint AS permanent_province_id,
    null::bigint AS permanent_city_id,
    null::text AS house_status,
    null::text AS property_type,
    null::text AS family_setup,
    null::text AS living_with,
    null::text AS beard,
    null::text AS hijab,
    null::text AS religious_practice,
    null::text AS smoking,
    null::text AS willing_to_relocate,
    null::bigint AS relocation_country_id,
    null::bigint AS relocation_province_id,
    null::bigint AS relocation_city_id,
    null::numeric AS monthly_income_min,
    null::numeric AS monthly_income_max,
    null::text AS currency_code,
    null::bigint AS education_level_id,
    null::text AS qualification,
    null::text AS field_of_study,
    null::bigint AS occupation_id,
    null::text AS job_title,
    null::text AS employment_type,
    null::text AS family_profession_business,
    null::text AS family_social_background,
    null::text AS family_values
;
=======
-- ======================================================================================
-- OPTIMIZED MATCHING VIEWS & RPCs (Added for Performance)
-- ======================================================================================

-- =========================================================
-- 1. Add "DOESNT_MATTER" preference importance
-- =========================================================

ALTER TYPE public.preference_importance ADD VALUE IF NOT EXISTS 'DOESNT_MATTER';


-- =========================================================
-- 2. Matching Profiles Materialized View
-- =========================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_matching_profiles CASCADE;

CREATE MATERIALIZED VIEW public.mv_matching_profiles AS
SELECT
    p.id AS profile_id,
    p.gender,
    p.status,

    -- Personal
    pi.full_name,
    pi.date_of_birth,
    pi.marital_status,
    pi.number_of_children,
    pi.nationality_country_id,
    pi.mother_tongue_id,

    -- Physical
    ph.height_cm,
    ph.weight_kg,
    ph.complexion,
    ph.has_disability,

    -- Religion
    ri.religion_id,
    ri.sect_id,
    ri.caste_id,

    -- Location
    pl.current_country_id,
    pl.current_province_id,
    pl.current_city_id,
    pl.permanent_country_id,
    pl.permanent_province_id,
    pl.permanent_city_id,

    -- Residency
    res.house_status,
    res.property_type,
    res.family_setup,
    res.living_with,

    -- Lifestyle
    li.beard,
    li.hijab,
    li.religious_practice,
    li.smoking,

    -- Relocation
    rel.willing_to_relocate,
    rel.preferred_country_id AS relocation_country_id,
    rel.preferred_province_id AS relocation_province_id,
    rel.preferred_city_id AS relocation_city_id,

    -- Income
    inc.monthly_income_min,
    inc.monthly_income_max,
    inc.currency_code,

    -- Highest Education
    edu.education_level_id,
    edu.qualification,
    edu.field_of_study,

    -- Current Employment
    emp.occupation_id,
    emp.job_title,
    emp.employment_type,

    -- Family
    fam.family_profession_business,
    fam.social_background AS family_social_background,
    fam.family_values

FROM public.profiles p

LEFT JOIN public.personal_information pi
    ON pi.profile_id = p.id

LEFT JOIN public.physical_information ph
    ON ph.profile_id = p.id

LEFT JOIN public.religion_information ri
    ON ri.profile_id = p.id

LEFT JOIN public.profile_locations pl
    ON pl.profile_id = p.id

LEFT JOIN public.residency_information res
    ON res.profile_id = p.id

LEFT JOIN public.lifestyle_information li
    ON li.profile_id = p.id

LEFT JOIN public.relocation_information rel
    ON rel.profile_id = p.id

LEFT JOIN public.income_information inc
    ON inc.profile_id = p.id

LEFT JOIN public.family_information fam
    ON fam.profile_id = p.id

LEFT JOIN LATERAL (
    SELECT
        er.education_level_id,
        er.qualification,
        er.field_of_study
    FROM public.education_records er
    WHERE er.profile_id = p.id
    ORDER BY
        er.is_highest_qualification DESC,
        er.end_year DESC NULLS LAST,
        er.created_at DESC
    LIMIT 1
) edu ON TRUE

LEFT JOIN LATERAL (
    SELECT
        er.occupation_id,
        er.job_title,
        er.employment_type
    FROM public.employment_records er
    WHERE er.profile_id = p.id
      AND er.is_current = TRUE
    ORDER BY er.created_at DESC
    LIMIT 1
) emp ON TRUE

WHERE p.status = 'ACTIVE';


-- =========================================================
-- 3. Unique Index
-- =========================================================

CREATE UNIQUE INDEX idx_mv_matching_profiles_id
ON public.mv_matching_profiles(profile_id);


-- =========================================================
-- 4. Matching Profile Indexes
-- =========================================================

CREATE INDEX idx_mv_matching_profiles_gender_dob
ON public.mv_matching_profiles(gender, date_of_birth);

CREATE INDEX idx_mv_matching_profiles_city
ON public.mv_matching_profiles(current_city_id);

CREATE INDEX idx_mv_matching_profiles_religion
ON public.mv_matching_profiles(religion_id);

CREATE INDEX idx_mv_matching_profiles_education
ON public.mv_matching_profiles(education_level_id);

CREATE INDEX idx_mv_matching_profiles_marital
ON public.mv_matching_profiles(marital_status);


-- =========================================================
-- 5. Current Matching Preferences View
-- =========================================================


DROP VIEW IF EXISTS public.v_current_matching_preferences CASCADE;

CREATE VIEW public.v_current_matching_preferences AS
SELECT
    ps.id AS preference_set_id,
    ps.profile_id,
    ps.version,

    -- Basic Preferences
    bp.min_age,
    bp.max_age,
    bp.age_importance,
    bp.preferred_marital_status,
    bp.marital_status_importance,
    bp.children_allowed,
    bp.children_importance,
    bp.preferred_gender,
    bp.gender_importance,

    -- Physical Preferences
    pp.min_height_cm,
    pp.max_height_cm,
    pp.height_importance,
    pp.min_weight_kg,
    pp.max_weight_kg,
    pp.weight_importance,
    pp.preferred_complexion,
    pp.complexion_importance,
    pp.disability_allowed,
    pp.disability_importance,
    pp.beard_preference,
    pp.beard_importance,
    pp.hijab_preference,
    pp.hijab_importance,

    -- Education Preferences
    ep.minimum_education_level_id,
    ep.education_importance,
    ep.preferred_field_of_study,
    ep.field_importance,

    -- Profession Preferences
    prop.preferred_occupation_id,
    prop.occupation_importance,
    prop.preferred_employment_type,
    prop.employment_type_importance,
    prop.minimum_monthly_income,
    prop.maximum_monthly_income,
    prop.income_importance,

    -- Religion Preferences
    rp.religion_id AS preferred_religion_id,
    rp.religion_importance,
    rp.sect_id AS preferred_sect_id,
    rp.sect_importance,
    rp.caste_id AS preferred_caste_id,
    rp.caste_importance,
    rp.religious_practice AS preferred_religious_practice,
    rp.religious_practice_importance AS religion_practice_importance,

    -- Location Preferences
    lp.country_id AS preferred_country_id,
    lp.country_importance,
    lp.province_id AS preferred_province_id,
    lp.province_importance,
    lp.city_id AS preferred_city_id,
    lp.city_importance,
    lp.location_details,

    -- Family Preferences
    fp.family_setup AS preferred_family_setup,
    fp.family_setup_importance,
    fp.living_with AS preferred_living_with,
    fp.living_with_importance,
    fp.parents_status_preference,
    fp.parents_status_importance,

    -- Lifestyle Preferences
    lsp.smoking AS preferred_smoking,
    lsp.smoking_importance,

    lsp.religious_practice AS preferred_lifestyle_religious_practice,
    lsp.religious_practice_importance
        AS lifestyle_religious_practice_importance,

    lsp.beard_preference AS preferred_lifestyle_beard,
    lsp.beard_importance
        AS lifestyle_beard_importance,

    lsp.hijab_preference AS preferred_lifestyle_hijab,
    lsp.hijab_importance
        AS lifestyle_hijab_importance,

    -- Relocation Preferences
    rlp.willing_to_relocate_required,
    rlp.relocation_importance,

    rlp.country_id AS relocation_country_id,
    rlp.country_importance AS relocation_country_importance,

    rlp.province_id AS relocation_province_id,
    rlp.province_importance AS relocation_province_importance,

    rlp.city_id AS relocation_city_id,
    rlp.city_importance AS relocation_city_importance

FROM public.preference_sets ps

LEFT JOIN public.basic_preferences bp
    ON bp.preference_set_id = ps.id

LEFT JOIN public.physical_preferences pp
    ON pp.preference_set_id = ps.id

LEFT JOIN public.education_preferences ep
    ON ep.preference_set_id = ps.id

LEFT JOIN public.profession_preferences prop
    ON prop.preference_set_id = ps.id

LEFT JOIN public.religion_preferences rp
    ON rp.preference_set_id = ps.id

LEFT JOIN public.location_preferences lp
    ON lp.preference_set_id = ps.id

LEFT JOIN public.family_preferences fp
    ON fp.preference_set_id = ps.id

LEFT JOIN public.lifestyle_preferences lsp
    ON lsp.preference_set_id = ps.id

LEFT JOIN public.relocation_preferences rlp
    ON rlp.preference_set_id = ps.id

WHERE ps.is_current = TRUE;


-- =========================================================
-- 6. Candidate Matching Function
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_matching_candidates(
    p_source_profile_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    profile_id UUID,
    gender public.profile_gender,
    date_of_birth DATE,
    marital_status public.marital_status,
    number_of_children INTEGER,
    religion_id BIGINT,
    sect_id BIGINT,
    caste_id BIGINT,
    current_country_id BIGINT,
    current_province_id BIGINT,
    current_city_id BIGINT,
    education_level_id BIGINT,
    field_of_study VARCHAR,
    occupation_id BIGINT,
    employment_type public.employment_type,
    monthly_income_min NUMERIC,
    monthly_income_max NUMERIC,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    complexion VARCHAR,
    has_disability BOOLEAN,
    beard public.yes_no,
    hijab public.yes_no,
    religious_practice public.religious_practice_level,
    smoking public.smoking_status,
    family_setup public.family_setup,
    living_with public.living_with,
    willing_to_relocate public.yes_no,
    relocation_country_id BIGINT,
    relocation_province_id BIGINT,
    relocation_city_id BIGINT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $
    SELECT
        c.profile_id,
        c.gender,
        c.date_of_birth,
        c.marital_status,
        c.number_of_children,
        c.religion_id,
        c.sect_id,
        c.caste_id,
        c.current_country_id,
        c.current_province_id,
        c.current_city_id,
        c.education_level_id,
        c.field_of_study,
        c.occupation_id,
        c.employment_type,
        c.monthly_income_min,
        c.monthly_income_max,
        c.height_cm,
        c.weight_kg,
        c.complexion,
        c.has_disability,
        c.beard,
        c.hijab,
        c.religious_practice,
        c.smoking,
        c.family_setup,
        c.living_with,
        c.willing_to_relocate,
        c.relocation_country_id,
        c.relocation_province_id,
        c.relocation_city_id

    FROM public.mv_matching_profiles c

    WHERE c.profile_id <> p_source_profile_id

      AND c.gender <> (
          SELECT gender
          FROM public.profiles
          WHERE id = p_source_profile_id
      )

      AND NOT EXISTS (
          SELECT 1
          FROM public.matches m
          WHERE m.status = 'IN_PROGRESS'
            AND (
                m.male_profile_id = c.profile_id
                OR m.female_profile_id = c.profile_id
            )
      )

      AND NOT EXISTS (
          SELECT 1
          FROM public.matches m
          WHERE m.status IN ('IN_PROGRESS', 'REJECTED')
            AND (
                (
                    m.male_profile_id = p_source_profile_id
                    AND m.female_profile_id = c.profile_id
                )
                OR
                (
                    m.male_profile_id = c.profile_id
                    AND m.female_profile_id = p_source_profile_id
                )
            )
      )

    LIMIT GREATEST(p_limit, 1);
{'$'};


-- =========================================================
-- 7. Match Lookup Indexes
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_matches_active_male_pair
ON public.matches(male_profile_id, female_profile_id)
WHERE status IN ('IN_PROGRESS', 'REJECTED');

CREATE INDEX IF NOT EXISTS idx_matches_active_female_pair
ON public.matches(female_profile_id, male_profile_id)
WHERE status IN ('IN_PROGRESS', 'REJECTED');


