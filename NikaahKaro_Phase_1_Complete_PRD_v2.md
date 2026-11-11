# NikahKaru.com --- Phase 1 Complete PRD --- Version 2

## CRM + Rule-Based Matrimonial Matching Engine

### Supabase / PostgreSQL Architecture, Data Model, Workflows and Business Logic

**Status:** Updated Technical/Product Specification\
**Phase:** 1\
**Version:** 2 --- aligned with finalized Agent/Manager workflow and
Database Schema v2\
**Database:** PostgreSQL via Supabase\
**Authentication:** Supabase Auth\
**Roles:** High-Level Admin, Manager, Agent\
**Matching:** Deterministic, rule-based, two-way compatibility\
**Default recommendation count:** Top 5\
**ML:** Not implemented in Phase 1\
**Languages:** English + Urdu

------------------------------------------------------------------------

# 1. Purpose

NikahKaru is an internal CRM and matrimonial matching system for an
authorized organization. Its purpose is to let Agents collect structured
matrimonial information, record partner requirements, generate suitable
candidates, request controlled candidate information from the Manager,
track pair progress, record structured feedback, and preserve historical
data for future analytics/ML.

The supplied project requirements define profile sections covering basic
information, physical information, education/profession/income,
religion/culture, location, residency/family, lifestyle, relocation and
desired-partner preferences. They also require hard filters, soft
scoring, range matching, two-way compatibility, ranked results,
structured rejection feedback, duplicate-pair prevention, English/Urdu
support and future ML readiness.

Phase 1 is **not** an ML recommendation system. Matching is
deterministic and explainable.

------------------------------------------------------------------------

# 2. Scope

## Included

-   Supabase authentication.
-   Role-based access.
-   High-Level Admin, Manager and Agent workflows.
-   Male/female matrimonial profiles.
-   Detailed personal and family data.
-   Partner preferences.
-   Mandatory vs soft criteria.
-   Range-based criteria.
-   Hard filtering.
-   Soft scoring.
-   Two-way matching.
-   Top-5 ranked results.
-   Match score breakdown.
-   Match lifecycle/history.
-   Pair-level rejection.
-   Structured rejection reasons.
-   Information requests.
-   Manager review.
-   Individual field-level information approval.
-   Information-release snapshots.
-   Notifications.
-   Audit logs.
-   English/Urdu structured display.
-   Basic dashboards.
-   RLS/security foundation.
-   Future analytics/ML-ready history.

## Excluded

-   ML recommendation models.
-   Predictive marriage-success models.
-   Automatically learned weights.
-   Advanced LLM assistant.
-   WhatsApp/telephony automation.
-   Native mobile apps.
-   Payment/subscription system.
-   Public matrimonial marketplace.
-   Advanced BI/data warehouse.
-   Marriage-success guarantees.

------------------------------------------------------------------------

# 3. Core Architectural Decisions

## 3.1 One person = one matrimonial profile

Every male/female person has one matrimonial profile.

`profiles` is the central/root entity.

There is deliberately no "master mapping table" containing IDs of all
section tables. Every section references `profiles.id`.

``` text
profiles
 ├── personal_information
 ├── physical_information
 ├── education_records
 ├── employment_records
 ├── religion_information
 ├── profile_locations
 ├── residency_information
 ├── parents
 ├── siblings
 ├── children
 ├── previous_marriages
 ├── family_information
 ├── lifestyle_information
 └── relocation_information
```

This keeps identity centralized and relationships explicit.

## 3.2 Profile, Match and Request statuses are separate

A profile can be `ACTIVE` while one match is `REJECTED` and another is
`IN_PROGRESS`.

A request can be `PENDING` while its underlying match remains
`SHORTLISTED`.

Do not use one status field for all three domains.

## 3.3 Creator and current Agent are separate

`created_by` answers "who created this profile?"

`current_agent_id` answers "who currently owns/handles it?"

`profile_agent_assignments` preserves the full assignment history.

## 3.4 One active IN_PROGRESS pair per profile

Phase 1 should normally allow only one active `IN_PROGRESS` relationship
for a person. Top-5 recommendations can still exist; the restriction is
on progressing multiple relationships simultaneously.

The limit should remain configurable in application logic.

## 3.5 Manager controls information release

Being able to see a candidate in a match list does not mean an Agent can
access every candidate field.

The Manager selects individual fields.

Approved information is stored as a release snapshot so later profile
edits do not rewrite what was actually released.

## 3.6 Structured preference model

Phase 1 uses typed preference tables rather than a generic
criterion/value/operator table.

This is intentional because the Phase-1 criteria are known and
structured. Typed columns provide stronger validation, simpler SQL,
better matching performance and easier reporting.

## 3.7 Language-neutral structured data

Store:

``` text
city_id = 42
religion_id = 1
education_level_id = 5
```

and display:

``` text
name_en
name_ur
```

Do not translate structured IDs through an external API.

Free-text may be translated separately while preserving the original.

------------------------------------------------------------------------

# 4. Role Model

NikahKaru Phase 1 has three operational roles. The terminology below is
final for the product specification.

## 4.1 High-Level Admin / CU Admin

The High-Level Admin has system-wide visibility and administrative
control.

Responsibilities:

-   Manage authorized users and roles.
-   Monitor overall system activity.
-   Review system-wide dashboards and analytics.
-   Review Agent and Manager workload/performance.
-   Review matching statistics and outcomes.
-   Review request/release activity.
-   Review audit logs.
-   Monitor operational and security exceptions.
-   Configure/maintain approved reference data where permitted.

The High-Level Admin is not required to participate in every individual
matching operation.

## 4.2 Manager

The Manager is the operational decision-maker for candidate information
and official matching runs.

Responsibilities:

-   Receive Agent information requests.
-   Review the requesting Agent and source profile.
-   Run the official matching engine for the requested source profile.
-   Persist the official matching run and its candidate results.
-   Review candidate score breakdowns.
-   Select which candidate profiles should proceed.
-   Select individual fields that may be released.
-   Approve, partially approve, or reject information release.
-   Reassign/referral a request to another Agent when operationally
    needed.
-   Monitor active matrimonial relationships and outcomes.
-   Review structured feedback and rejection history.

Important: the Manager does not manually alter the matching score or
override the deterministic matching criteria as part of the normal
Phase-1 workflow. Re-matching means running the same matching engine
again against the current eligible data.

## 4.3 Agent / Staff

The Agent is the primary data-entry and client-facing operational role.

Responsibilities:

-   Collect profile information from the client/family.
-   Create and maintain the client's matrimonial profile.
-   Enter desired-partner preferences.
-   Run a non-persistent matching preview for client presentation.
-   View candidate ranking, score and permitted basic preview fields.
-   Use the preview to explain possible candidates to the client.
-   Submit an information request for the Agent's source profile to the
    Manager after the client is interested.
-   Receive only Manager-approved candidate information.
-   Generate/download an approved-information PDF.
-   Share approved information with the original client/family.
-   Record relevant operational feedback/outcomes where permitted.

### Critical Agent/Manager boundary

The Agent's matching preview is a presentation/search operation only.

It does NOT:

-   create a `match_runs` row;
-   create `match_run_results`;
-   create persistent score-breakdown rows;
-   create an actual `matches` relationship;
-   create a candidate-information request for selected candidate
    profiles;
-   give the Agent access to sensitive candidate fields.

After client interest, the Agent requests processing of the Agent's
source profile from the Manager. The Manager then runs the official
matching engine and controls disclosure.

## 4.4 Requester vs Current Assignee

The system must distinguish:

``` text
requested_by
    = Agent who originally submitted the request

current_assignee
    = Agent currently responsible for operational handling
```

These can be different.

Example:

``` text
Agent A creates Male A
        |
        | information request
        v
Manager receives request
        |
        | reassign/referral
        v
Agent B becomes current handler
```

The original requester remains historically identifiable.

# 5. Authentication and Authorization

Supabase Auth is the authentication source:

``` text
auth.users
    ↓
public.users
    ↓
user_roles
    ↓
roles
    ↓
permissions
```

`auth.users` is not replaced by the application `users` table.

`public.users` contains application-specific information.

RLS must enforce authorization at the database layer. Frontend hiding is
not sufficient for sensitive matrimonial information.

------------------------------------------------------------------------

# 6. Database Tables and Why They Exist

## 6.1 `roles`

Defines:

-   `id` --- stable role identity.
-   `name` --- `HIGH_LEVEL_ADMIN`, `MANAGER`, `AGENT`.
-   `description` --- human-readable purpose.
-   `created_at` --- creation history.

## 6.2 `permissions`

Defines granular capabilities.

Attributes:

-   `id` --- permission identity.
-   `code` --- stable application permission code.
-   `description` --- meaning.
-   `created_at` --- creation history.

## 6.3 `role_permissions`

Many-to-many role/permission mapping.

Attributes:

-   `role_id` --- role receiving permission.
-   `permission_id` --- granted permission.

Composite PK prevents duplicate grants.

## 6.4 `users`

Application user record.

Attributes:

-   `id` --- references `auth.users.id`.
-   `full_name` --- displayed user name.
-   `email` --- application email.
-   `phone` --- organizational contact.
-   `status` --- `ACTIVE`, `INACTIVE`, `SUSPENDED`.
-   `created_at` --- account creation.
-   `updated_at` --- last change.

## 6.5 `user_roles`

Attributes:

-   `user_id` --- user.
-   `role_id` --- role.
-   `assigned_by` --- who granted the role.
-   `assigned_at` --- when granted.

This makes role assignment auditable.

------------------------------------------------------------------------

# 7. Reference/Lookup Tables

The system uses controlled reference data for values that need
consistent matching.

## `countries`

-   `id` --- identity.
-   `code` --- code.
-   `name_en` --- English label.
-   `name_ur` --- Urdu label.
-   `is_active` --- allows retirement without deleting history.

## `provinces`

-   `id` --- identity.
-   `country_id` --- parent country.
-   `name_en`, `name_ur` --- bilingual labels.
-   `is_active` --- selectable/not selectable.

## `cities`

-   `id` --- identity.
-   `province_id` --- province where applicable.
-   `country_id` --- country.
-   `name_en`, `name_ur` --- bilingual labels.
-   `is_active` --- current availability.

## `religions`

-   `id`
-   `name_en`
-   `name_ur`
-   `is_active`

## `sects`

-   `id`
-   `religion_id`
-   `name_en`
-   `name_ur`
-   `is_active`

## `castes`

-   `id`
-   `name_en`
-   `name_ur`
-   `is_active`

## `mother_tongues`

-   `id`
-   `name_en`
-   `name_ur`
-   `is_active`

## `education_levels`

-   `id`
-   `name_en`
-   `name_ur`
-   `sort_order` --- lets the matching engine understand educational
    progression.
-   `is_active`

## `occupations`

-   `id`
-   `name_en`
-   `name_ur`
-   `is_active`

## `rejection_reasons`

-   `id`
-   `code` --- stable machine-readable reason.
-   `name_en`
-   `name_ur`
-   `is_active`

Reference rows should normally be deactivated rather than physically
deleted because historical profiles/matches may use them.

------------------------------------------------------------------------

# 8. Core Profile Model

## `profiles`

This is the central matrimonial identity.

Attributes:

### `id`

Unique UUID. Every related table references it.

### `gender`

`MALE` or `FEMALE`.

Required by the matching engine to construct the opposite-gender
candidate pool.

### `status`

`DRAFT`, `ACTIVE`, `PAUSED`, `INACTIVE`, `ARCHIVED`.

This describes the availability/state of the person, not a specific
match.

### `created_by`

The original creator.

Used for ownership and analytics.

### `current_agent_id`

The currently responsible Agent.

This can differ from the creator.

### `created_at`

Profile creation time.

### `updated_at`

Last profile-level update.

### `archived_at`

When the profile was archived.

------------------------------------------------------------------------

# 9. Profile Assignment

## `profile_agent_assignments`

Why it exists:

`current_agent_id` only tells the current state. This table preserves
history.

Attributes:

-   `id` --- assignment record identity.
-   `profile_id` --- assigned profile.
-   `agent_id` --- responsible Agent.
-   `assigned_by` --- user who made the assignment.
-   `status` --- `ACTIVE` or `ENDED`.
-   `assigned_at` --- assignment start.
-   `ended_at` --- assignment end.
-   `notes` --- context/reason.

Example:

``` text
Agent A → Agent B → Agent C
```

can be reconstructed from history.

------------------------------------------------------------------------

# 10. Profile Information Tables

## 10.1 `personal_information`

Attributes:

-   `profile_id` --- one-to-one link to profile.
-   `full_name` --- identity/name used in candidate display and approved
    releases.
-   `date_of_birth` --- exact birth date where available.
-   `age` --- not stored as a source-of-truth field in the v2 schema;
    calculate/display age from `date_of_birth`.
-   `marital_status` --- matching criterion.
-   `number_of_children` --- matching/display criterion.
-   `nationality_country_id` --- nationality is distinct from current
    residence.
-   `mother_tongue_id` --- cultural/language matching.
-   `created_at`, `updated_at` --- maintenance/history.

### Important normalization note

`age` is derivable from DOB. A final production schema should choose one
source of truth. Recommended:

``` text
date_of_birth = source of truth
age = calculated
```

unless business requirements specifically require a manually recorded
age.

------------------------------------------------------------------------

## 10.2 `physical_information`

Attributes:

-   `profile_id` --- one-to-one owner.
-   `height_cm` --- numeric representation for range matching.
-   `weight_kg` --- numeric representation for range matching.
-   `complexion` --- structured/current complexion.
-   `has_disability` --- determines whether disability detail is
    relevant.
-   `disability_details` --- conditional detail.
-   timestamps.

Centimeters are preferred over strings such as `5'5"` because numerical
range comparison is easier.

------------------------------------------------------------------------

## 10.3 `education_records`

One profile can have many records.

Attributes:

-   `id` --- education record.
-   `profile_id` --- owner.
-   `education_level_id` --- standardized education level.
-   `qualification` --- exact qualification.
-   `institution_name` --- institution.
-   `field_of_study` --- field.
-   `start_year` --- history.
-   `end_year` --- completion.
-   `is_highest_qualification` --- identifies primary qualification.
-   `details` --- additional information.
-   `created_at`.

One-to-many is necessary because a person can have Bachelor + Master +
certifications.

------------------------------------------------------------------------

## 10.4 `employment_records`

One profile can have many records.

Attributes:

-   `id`
-   `profile_id`
-   `occupation_id`
-   `job_title`
-   `organization_name`
-   `employment_type`
-   `start_date`
-   `end_date`
-   `is_current`
-   `details`
-   `created_at`

The occupation category supports matching; job title and organization
preserve detail.

------------------------------------------------------------------------

## 10.5 `income_information`

Attributes:

-   `profile_id`
-   `monthly_income_min`
-   `monthly_income_max`
-   `currency_code`
-   `income_period`
-   timestamps

Ranges are supported because income may be approximate or variable.

------------------------------------------------------------------------

## 10.6 `religion_information`

Attributes:

-   `profile_id`
-   `religion_id`
-   `sect_id`
-   `caste_id`
-   `other_caste_text`
-   timestamps

Structured IDs improve matching. `other_caste_text` prevents the system
from being blocked by a reference list that does not contain a
real-world value.

------------------------------------------------------------------------

## 10.7 `profile_locations`

Stores both current and permanent location.

Attributes:

-   `profile_id`
-   `current_country_id`
-   `current_province_id`
-   `current_city_id`
-   `permanent_country_id`
-   `permanent_province_id`
-   `permanent_city_id`
-   `current_location_text`
-   `permanent_location_text`
-   timestamps

Current and permanent locations are deliberately separate because a
person can live in one city while belonging permanently to another.

------------------------------------------------------------------------

## 10.8 `residency_information`

Attributes:

-   `profile_id`
-   `house_status`
-   `property_type`
-   `family_setup`
-   `living_with`
-   `living_with_other_details`
-   timestamps

Each answers a different matching question.

------------------------------------------------------------------------

## 10.9 `parents`

One profile can have up to two logical parent records: Father and
Mother.

Attributes:

-   `id` --- parent record.
-   `profile_id` --- owner.
-   `parent_type` --- `FATHER`/`MOTHER`.
-   `status` --- `ALIVE`/`DECEASED`.
-   `full_name`
-   `age`
-   `profession`
-   `education`
-   `country_id`
-   `city_id`
-   `living_arrangement`
-   `social_background`
-   `additional_details`
-   timestamps.

The parent status controls which additional fields are relevant.

------------------------------------------------------------------------

## 10.10 `siblings`

One-to-many.

Attributes:

-   `id`
-   `profile_id`
-   `gender`
-   `full_name`
-   `age`
-   `marital_status`
-   `profession`
-   `education`
-   `country_id`
-   `city_id`
-   timestamps.

This avoids repeating columns such as `brother_1`, `brother_2`, etc.

------------------------------------------------------------------------

## 10.11 `children`

One-to-many.

Attributes:

-   `id`
-   `profile_id`
-   `gender`
-   `age`
-   `living_with_profile`
-   `additional_details`
-   `created_at`

Children can influence both personal and partner matching.

------------------------------------------------------------------------

## 10.12 `previous_marriages`

One-to-many.

Attributes:

-   `id`
-   `profile_id`
-   `marriage_number`
-   `marriage_status`
-   `marriage_year`
-   `end_year`
-   `reason_for_end`
-   `children_count`
-   `sons_count`
-   `daughters_count`
-   `children_live_with_profile`
-   `additional_details`
-   `created_at`

This preserves historical marriage context instead of collapsing
everything into one marital-status field.

------------------------------------------------------------------------

## 10.13 `family_information`

Attributes:

-   `profile_id`
-   `family_profession_business`
-   `social_background`
-   `family_values`
-   `family_introduction`
-   `important_family_circumstances`
-   `additional_details`
-   timestamps

Family information is intentionally separated from personal information
because it describes the household/family context rather than the person
alone.

------------------------------------------------------------------------

## 10.14 `lifestyle_information`

Attributes:

-   `profile_id`
-   `beard`
-   `hijab`
-   `religious_practice`
-   `smoking`
-   `other_lifestyle_information`
-   timestamps

These values are used in partner preference comparison.

------------------------------------------------------------------------

## 10.15 `relocation_information`

Attributes:

-   `profile_id`
-   `willing_to_relocate`
-   `preferred_country_id`
-   `preferred_province_id`
-   `preferred_city_id`
-   `relocation_details`
-   timestamps

Willingness and preferred destination are separate concepts.

------------------------------------------------------------------------

# 11. Preference Architecture

``` text
preference_sets
 ├── basic_preferences
 ├── physical_preferences
 ├── education_preferences
 ├── profession_preferences
 ├── religion_preferences
 ├── location_preferences
 ├── family_preferences
 ├── lifestyle_preferences
 └── relocation_preferences
```

The database uses typed tables rather than a completely generic
criterion/value model.

Why:

-   Strong type safety.
-   Easier validation.
-   Easier SQL.
-   Easier matching functions.
-   Easier reporting.
-   Better maintainability for known Phase-1 criteria.

A generic rule engine may be introduced later if business requirements
become highly dynamic.

------------------------------------------------------------------------

# 12. `preference_sets`

Attributes:

-   `id` --- preference set identity.
-   `profile_id` --- owner.
-   `version` --- preference version.
-   `is_current` --- current set.
-   `created_by` --- who defined it.
-   `created_at`.

Why version preferences?

If a family changes:

``` text
Lahore = mandatory
```

to:

``` text
Lahore = preferred
Islamabad = acceptable
```

future matching must know which version was used.

------------------------------------------------------------------------

# 13. Preference Importance

Phase 1 uses:

``` text
MANDATORY
HIGH
MEDIUM
LOW
```

Meaning:

### MANDATORY

Non-negotiable; normally hard-filtered.

### HIGH

Strong preference; large scoring contribution.

### MEDIUM

Normal preference.

### LOW

Weak preference.

Exact numeric weights must be finalized as business configuration.

Do not let arbitrary frontend percentages silently redefine matching
behavior.

------------------------------------------------------------------------

# 14. Preference Tables

## `basic_preferences`

-   `preference_set_id`
-   `min_age`
-   `max_age`
-   `age_importance`
-   `preferred_marital_status`
-   `marital_status_importance`
-   `children_allowed`
-   `children_importance`
-   `preferred_gender`
-   `gender_importance`

Purpose: basic eligibility and compatibility.

## `physical_preferences`

-   min/max height
-   height importance
-   min/max weight
-   weight importance
-   preferred complexion
-   complexion importance
-   disability acceptance
-   disability importance
-   beard preference/importance
-   hijab preference/importance

Purpose: structured physical/lifestyle criteria.

## `education_preferences`

-   `preference_set_id`
-   `minimum_education_level_id`
-   `education_importance`
-   `preferred_field_of_study`
-   `field_importance`

Purpose: minimum and preferred educational requirements.

## `profession_preferences`

-   preferred occupation
-   occupation importance
-   employment type
-   employment importance
-   minimum income
-   maximum income
-   income importance

Purpose: professional/income matching.

## `religion_preferences`

-   religion
-   religion importance
-   sect
-   sect importance
-   caste
-   caste importance
-   religious practice
-   religious practice importance

Purpose: religion/culture matching.

## `location_preferences`

-   country
-   country importance
-   province
-   province importance
-   city
-   city importance
-   location details

Purpose: geographic preference.

If multiple countries/cities become a core requirement, add normalized
child preference tables rather than forcing multiple values into one
scalar column.

## `family_preferences`

-   family setup
-   family setup importance
-   living with
-   living-with importance
-   parent status preference
-   parent status importance

## `lifestyle_preferences`

-   smoking
-   smoking importance
-   religious practice
-   religious practice importance
-   beard preference/importance
-   hijab preference/importance
-   additional preferences

## `relocation_preferences`

-   willingness requirement
-   relocation importance
-   preferred country/country importance
-   province/province importance
-   city/city importance

------------------------------------------------------------------------

# 15. Matching Engine

Matching has two layers:

``` text
Layer 1: Hard filters
Layer 2: Soft scoring
```

Then it evaluates both directions:

``` text
A preferences → B profile
B preferences → A profile
```

and combines the results.

This implements the required two-way compatibility model.

------------------------------------------------------------------------

# 16. Hard Filter Logic

Mandatory requirements are evaluated first.

Examples:

-   Required gender.
-   Mandatory age.
-   Mandatory marital status.
-   Mandatory religion.
-   Mandatory location.
-   Mandatory disability requirement.
-   Mandatory relocation requirement.

If a candidate fails a mandatory criterion:

``` text
candidate excluded
```

Soft score cannot restore that candidate.

------------------------------------------------------------------------

# 17. Soft Scoring

Soft criteria contribute to a score but do not automatically eliminate a
candidate.

Example:

``` text
Preferred height = 5'5–5'7
Candidate = 5'8
Importance = MEDIUM
```

Candidate may receive partial score.

This prevents a small soft mismatch from eliminating an otherwise strong
candidate.

------------------------------------------------------------------------

# 18. "Doesn't Matter"

If a criterion is explicitly:

``` text
Doesn't Matter
```

it should not negatively affect the score.

It should also not unfairly inflate/deflate the denominator of
normalized scoring.

------------------------------------------------------------------------

# 19. Range Matching

Range criteria include:

-   age,
-   height,
-   weight,
-   income.

Conceptual model:

``` text
inside preferred range → high/full score
near range → partial score
far outside → low/zero score
```

Exact tolerance is a business rule and must be documented before
production.

------------------------------------------------------------------------

# 20. Two-Way Scoring

Example:

``` text
Male A preferences → Female B = 91
Female B preferences → Male A = 83
```

The final score is calculated according to approved Phase-1 combination
rules.

A score must be explainable and must not be presented as probability of
marriage success.

------------------------------------------------------------------------

# 21. `match_runs`

`match_runs` stores only **official Manager matching executions**.

Agent preview matching is deliberately not persisted.

## 21.1 Why `match_runs` exists

A Manager run is a business decision point and must be reproducible.

The database should preserve:

-   which source profile was matched;
-   who ran the official matching operation;
-   when it ran;
-   which preference version was used;
-   which algorithm version was used;
-   requested candidate limit;
-   run status;
-   execution metadata where required.

## 21.2 Agent preview is different

Agent preview:

``` text
Agent
  ↓
current profile + current preferences
  ↓
matching engine
  ↓
temporary ranked results
  ↓
screen presentation
```

No persistent matching-run records are created.

This avoids polluting the historical dataset with every exploratory
search made during client discussions.

## 21.3 Manager official run

Manager run:

``` text
Manager
  ↓
source profile
  ↓
same deterministic matching engine
  ↓
official ranked results
  ↓
persist match_runs
  ↓
persist match_run_results
  ↓
persist score breakdowns
```

The Manager run is therefore the authoritative Phase-1 matching result
used for subsequent candidate selection and information release.

# 22. `match_run_results`

`match_run_results` contains the persisted candidate rows produced by
one official Manager `match_runs` execution.

Each result identifies:

-   `match_run_id`;
-   candidate profile;
-   rank;
-   final two-way score;
-   eligibility/result status;
-   relevant metadata needed for reproducibility.

Example:

``` text
Manager Run #501

Rank  Candidate  Score
1     Female B   92
2     Female C   88
3     Female D   84
4     Female E   81
5     Female F   77
...
```

The result belongs to the run. It is not itself an actual relationship.

This distinction is essential:

``` text
match_run_results
    = "this candidate was returned by this official search"

matches
    = "these two people are actually in a matrimonial relationship
       lifecycle"
```

# 23. `match_score_breakdowns`

Score breakdowns belong to a persisted `match_run_result`.

For every meaningful criterion, the system can preserve:

-   criterion name/code;
-   source value;
-   candidate value;
-   importance level;
-   criterion score;
-   criterion weight;
-   contribution;
-   explanation;
-   algorithm version.

Example:

``` text
Candidate: Female B
Final score: 92

Age:
  requested: 22-25
  candidate: 23
  importance: HIGH
  score: 100

Education:
  requested: Bachelor's+
  candidate: Bachelor's
  importance: HIGH
  score: 100

Location:
  requested: Lahore preferred
  candidate: Lahore
  importance: MEDIUM
  score: 100

Religious practice:
  requested: Highly Preferred
  candidate: matching
  score: 100
```

The explanation is generated from structured facts. It must not claim
that a match guarantees compatibility or marriage success.

# 24. `matches` --- Actual Relationship Entity

`matches` does **not** represent every candidate returned by a search.

It represents an actual male-female relationship lifecycle after the
organization/families move beyond simple candidate discovery.

A row should be created when actual communication/proposal consideration
begins, not merely because a candidate appeared in a preview or Manager
run.

Core references include:

-   male profile;
-   female profile;
-   optional source `match_run_result_id`;
-   current relationship status;
-   timestamps;
-   lifecycle metadata.

## 24.1 Initial relationship state

When actual communication/proposal consideration starts:

``` text
IN_PROGRESS
```

This is the explicit business meaning of `IN_PROGRESS`.

A candidate shown in a Manager run is not automatically `IN_PROGRESS`.

## 24.2 Pair uniqueness

The database must prevent duplicate male/female relationship rows for
the same active lifecycle.

The logical pair is:

``` text
Male A ↔ Female B
```

and should not be duplicated as:

``` text
Male A ↔ Female B
Female B ↔ Male A
```

The database representation remains one normalized pair.

# 25. Match Relationship Statuses

Phase 1 relationship statuses are:

``` text
IN_PROGRESS
REJECTED
ACCEPTED
CLOSED
REOPENED
```

These statuses describe the relationship itself.

They are separate from:

``` text
profile.status
information_request.status
match_run.status
```

## IN_PROGRESS

Actual communication/proposal consideration has started.

While a profile is in an active `IN_PROGRESS` relationship, the matching
engine must normally exclude it from starting another new active
relationship.

## REJECTED

The pair has been explicitly rejected.

The rejection applies to the pair, not globally to either person.

## ACCEPTED

The pair has reached the organization's defined accepted state.

## CLOSED

The relationship lifecycle is closed for operational reasons.

## REOPENED

A previously closed/rejected relationship is explicitly reopened where
business rules allow it.

# 26. `match_status_history` and `match_feedback`

`match_status_history` preserves every important relationship
transition.

Example:

``` text
IN_PROGRESS
    ↓
REJECTED
```

or:

``` text
IN_PROGRESS
    ↓
ACCEPTED
    ↓
CLOSED
```

`match_feedback` stores structured outcome information.

A rejection should contain machine-readable information such as:

``` text
reason = Job timing
importance = HIGH
note = Family prefers a different work schedule
```

The system must use pair-level rejection history to prevent the same
pair from being automatically suggested again unless that pair is
explicitly reopened.

Feedback is historical evidence for future analytics/ML; it is not an ML
model in Phase 1.

# 27. Information Request Architecture

The Phase-1 information request is intentionally simple.

The Agent does **not** request individual candidate profiles directly.

The request means:

``` text
"Manager, please process the source profile I am handling and run the
official matching workflow so that approved candidate information can
later be released."
```

## 27.1 Request source

An information request contains:

-   requester (`requested_by`);
-   source profile (`source_profile_id`);
-   current operational assignment;
-   request status;
-   timestamps;
-   notes/metadata where needed.

## 27.2 Candidate selection happens after the Manager run

The workflow is:

``` text
Agent request
    ↓
Manager
    ↓
official matching run
    ↓
saved match_run_results
    ↓
Manager chooses candidate(s)
    ↓
Manager selects fields
    ↓
release snapshot
```

There is no Agent-submitted list such as:

``` text
candidate_profile_id = Female B
candidate_profile_id = Female C
```

inside the original information request.

The Manager derives candidate choices from the official saved run.

# 28. `information_requests`

`information_requests` is the operational request from an Agent to the
Manager.

Important fields:

-   `requested_by`
-   `source_profile_id`
-   `status`
-   `created_at`
-   `updated_at`
-   completion/cancellation metadata where applicable

The source profile is the Agent's client profile.

Example:

``` text
requested_by = Agent A
source_profile_id = Male A
```

This does not mean that Agent A is requesting unrestricted access to all
female profiles.

# 29. Request Statuses

Phase 1 uses:

``` text
PENDING
IN_REVIEW
COMPLETED
CANCELLED
```

These statuses track the operational request only.

They do not represent:

-   profile state;
-   candidate relationship state;
-   approval of a marriage;
-   change of matrimonial status.

## PENDING

Request has been submitted and awaits Manager processing.

## IN_REVIEW

Manager has opened/started processing the request.

## COMPLETED

The Manager has completed the request workflow. This may include one or
more approved releases.

## CANCELLED

The request is no longer being processed.

# 30. `information_request_assignments`

This table preserves operational handling history.

It exists because:

``` text
requested_by
```

and:

``` text
current handler
```

may differ.

Example:

``` text
requested_by = Agent A
assigned_to  = Agent B
```

The assignment history should preserve:

-   assigned Agent;
-   assigned by;
-   assignment status;
-   start/end timestamps;
-   notes.

This is operational routing, not candidate selection.

# 31. Manager Official Run and Candidate Selection

After opening a request, the Manager runs the same deterministic
matching engine used by the Agent preview.

The key difference is persistence:

``` text
Agent preview:
  calculate → display → discard

Manager official:
  calculate → save → review → select → release
```

The Manager can select one or more candidates from the persisted
`match_run_results`.

The selected candidate is represented by its run-result reference when
creating an information release.

No manual score override is required.

# 32. `information_releases`

`information_releases` represents an actual Manager-approved disclosure.

It references:

-   the request;
-   the official Manager `match_run_result`;
-   candidate profile;
-   releasing Manager;
-   release status;
-   release timestamps;
-   optional expiry/revocation information.

The release answers:

``` text
"Which candidate, from which official run, was approved for disclosure?"
```

The database should also preserve the Agent who receives the release
when the operational recipient can differ from the original requester.

Recommended field:

``` text
released_to
```

This avoids ambiguity when a request is reassigned.

# 33. `information_release_fields`

The Manager selects individual fields.

Example:

``` text
APPROVED
- Full Name
- Age
- Education
- Profession
- City
- Family Introduction

NOT APPROVED
- Phone
- Exact Address
- Sensitive Family Details
- Any other restricted field
```

Each approved field is stored as a historical snapshot:

``` text
field_path
field_value
```

This is intentional historical denormalization.

If the candidate later changes:

``` text
city
profession
education
```

the historical release still records exactly what the Manager approved
at that time.

The PDF must be generated from this release snapshot, not by reading the
candidate's full current profile.

# 34. Information Disclosure Security Model

Visibility is divided into three levels.

## Level 1 --- Agent preview visibility

The Agent can see only the fields explicitly allowed for candidate
preview, such as:

-   name or approved display identifier;
-   basic age;
-   basic education;
-   basic profession;
-   score;
-   score explanation;
-   other non-sensitive fields defined by business rules.

## Level 2 --- Manager visibility

The Manager can inspect the detailed information needed to make an
approval decision, subject to role permissions.

## Level 3 --- Released information

The Agent sees only the exact fields included in the Manager's release
snapshot.

Frontend hiding is not sufficient. RLS and/or secure server-side
functions must enforce this boundary.

# 35. Complete Agent Workflow

## Step 1 --- Login

Agent authenticates through Supabase Auth.

## Step 2 --- Create or Open Source Profile

Agent creates the matrimonial profile for the client.

The system records:

``` text
created_by = current Agent
current_agent_id = current Agent
```

The profile may remain `DRAFT` until validation is complete.

## Step 3 --- Enter Profile Data

Agent completes the approved Phase-1 sections:

``` text
Basic / Personal
Physical
Education
Profession / Employment
Income
Religion & Culture
Location
Residency & Family
Parents
Siblings
Children
Previous Marriages
Family Information
Lifestyle
Relocation
```

## Step 4 --- Enter Desired-Partner Preferences

Agent records the client's requirements using the structured Phase-1
preference model.

Preferences can include:

-   mandatory criteria;
-   high/strong preferences;
-   preferred criteria;
-   flexible/optional criteria;
-   range values where applicable.

## Step 5 --- Validation

System validates:

-   required fields;
-   conditional fields;
-   valid reference IDs;
-   logical ranges;
-   gender-specific rules;
-   date consistency;
-   preference consistency.

## Step 6 --- Activate Profile

After required information is complete:

``` text
profiles.status = ACTIVE
```

Only eligible active profiles participate in matching.

## Step 7 --- Agent Matching Preview

Agent clicks:

``` text
Find Matches
```

The system calculates a temporary ranked result.

It:

1.  loads the source profile;
2.  loads current preferences;
3.  selects eligible opposite-gender profiles;
4.  excludes inactive/ineligible profiles;
5.  excludes self-pairs;
6.  excludes pair-level rejected relationships;
7.  excludes profiles already blocked by active relationship rules;
8.  applies hard filters;
9.  calculates soft criterion scores;
10. calculates source → candidate compatibility;
11. calculates candidate → source compatibility;
12. combines the two directions;
13. ranks the candidates;
14. returns the configured preview list.

### Critical rule

The Agent preview result is not saved as an official match run.

No persistent `match_runs`, `match_run_results`, `matches` or score
breakdown records are created by this action.

The preview exists to help the Agent explain potential candidates to the
client.

## Step 8 --- Client Discussion / Convincing

The Agent discusses the preview with the client/family.

The Agent can use:

``` text
Candidate name/basic identifier
Age
Education
Profession
Location/basic details
Match percentage
Score explanation
```

according to configured preview visibility.

Sensitive candidate information remains hidden.

## Step 9 --- Agent Submits Information Request

Once the client is interested in proceeding, the Agent submits:

``` text
source_profile_id = client's profile
requested_by = current Agent
```

The Agent does not submit candidate-profile IDs as the request itself.

## Step 10 --- Manager Receives Request

The Manager sees:

-   requesting Agent;
-   source profile;
-   request history;
-   relevant operational notes;
-   current assignment;
-   request status.

## Step 11 --- Manager Runs Official Matching

Manager runs the same matching engine.

This execution is persisted:

``` text
match_runs
match_run_results
match_score_breakdowns
```

The official run becomes the source from which candidate information can
be selected.

## Step 12 --- Manager Selects Candidate(s)

Manager reviews the saved ranked results and chooses the candidate or
candidates that should proceed.

## Step 13 --- Manager Selects Individual Fields

For each selected candidate, the Manager chooses the exact fields that
may be released.

Example:

``` text
Name       ✓
Age        ✓
Education  ✓
Profession ✓
City       ✓
Phone      ✗
Income     ✗
Address    ✗
```

The actual allowed set is controlled by business/security rules.

## Step 14 --- Release Snapshot

System creates:

``` text
information_releases
information_release_fields
```

with exact values at the moment of approval.

## Step 15 --- Agent Receives Approved Information

The intended Agent receives only the approved snapshot.

The Agent cannot query the candidate's unrestricted profile to bypass
the release.

## Step 16 --- PDF Generation

The Agent can generate/download a PDF from the release snapshot.

The PDF contains only approved fields.

## Step 17 --- Family Communication

The Agent shares the approved information with the original
client/family through the organization's permitted external process.

## Step 18 --- Actual Communication / Proposal

If the two families actually begin communication/proposal consideration,
the system creates the actual `matches` relationship:

``` text
Male A ↔ Female B
status = IN_PROGRESS
```

This is the point at which `IN_PROGRESS` begins.

## Step 19 --- Outcome

The relationship may become:

``` text
REJECTED
ACCEPTED
CLOSED
REOPENED
```

Structured feedback is recorded.

## Step 20 --- Future Matching

If A ↔ B is rejected, that pair is excluded from future automatic
recommendations unless explicitly reopened.

Male A can still be matched with other eligible females.

Female B remains eligible for other eligible males.

# 36. Complete Manager Workflow

## 36.1 Login

Manager sees:

-   pending information requests;
-   requests currently under review;
-   active relationships;
-   recent official matching runs;
-   operational workload;
-   relevant notifications.

## 36.2 Open Request

Manager sees:

-   requesting Agent;
-   source profile;
-   current request status;
-   assignment history;
-   relevant previous processing history.

The Manager is not presented with a preselected candidate list from the
Agent request because the Agent did not submit one.

## 36.3 Run Official Match

Manager runs the deterministic engine for the source profile.

The run is persisted.

## 36.4 Review Results

Manager sees:

-   ranked candidates;
-   final two-way score;
-   criterion-level breakdown;
-   hard-filter outcome;
-   soft-preference contributions;
-   previous pair history;
-   candidate eligibility.

## 36.5 Select Candidate

Manager selects candidate(s) from the saved official run.

## 36.6 Select Fields

Manager selects individual fields for each candidate.

## 36.7 Approve / Partially Approve / Reject

The system creates releases only for approved information.

A rejected request produces no information release.

A partially approved workflow produces only approved release fields.

## 36.8 Assign / Reassign

Manager can route the request to another Agent.

The system preserves:

``` text
original requester
current assignee
assignment history
```

If a release recipient differs from the original requester, the release
records the actual recipient.

## 36.9 Monitor Relationship Progress

Manager can monitor:

``` text
IN_PROGRESS
REJECTED
ACCEPTED
CLOSED
REOPENED
```

and related feedback.

# 37. Complete High-Level Admin Workflow

## Login

Admin sees system-wide operational information.

## User Management

-   Create/disable authorized users.
-   Assign roles.
-   Review account status.

## Profile Analytics

-   Total profiles.
-   Active/draft/archived profiles.
-   Male/female counts.
-   Agent workload.
-   Assignment history.

## Matching Analytics

-   Official Manager match runs.
-   Candidate counts.
-   Score distributions.
-   Match outcomes.
-   Rejection patterns.
-   Pair-level history.

Agent previews are not treated as official persisted match runs.

## Request Analytics

-   Pending requests.
-   Requests under review.
-   Completed/cancelled requests.
-   Manager workload.
-   Assignment/reassignment activity.
-   Release activity.

## Audit

Admin can inspect important actions such as:

-   profile creation/update;
-   assignment;
-   official matching run;
-   candidate selection;
-   information release;
-   relationship status changes;
-   user/role changes;
-   security-sensitive actions.

# 38. End-to-End Example

``` text
Agent A
  ↓
creates Male A
  ↓
profile ACTIVE
  ↓
preferences recorded
  ↓
Agent clicks Find Match
  ↓
TEMPORARY PREVIEW
  ↓
B 92%
C 89%
D 86%
E 82%
F 79%
  ↓
Agent discusses candidates with client
  ↓
Client wants to proceed
  ↓
Agent submits information request
  source_profile = Male A
  requested_by = Agent A
  ↓
Manager receives request
  ↓
Manager runs OFFICIAL matching
  ↓
Saved:
  match_runs
  match_run_results
  score_breakdowns
  ↓
Manager reviews official results
  ↓
Manager selects Female B
  ↓
Manager approves:
  Name
  Age
  Education
  Profession
  City
  Family Introduction
  ↓
Release snapshot created
  ↓
Agent receives approved fields
  ↓
Agent generates PDF
  ↓
Agent shares approved information
  ↓
Families begin actual communication
  ↓
Male A ↔ Female B
  status = IN_PROGRESS
  ↓
If rejected:
  REJECTED
  + structured reason
  ↓
A ↔ B excluded from future automatic suggestions
  ↓
Male A remains eligible for other profiles
Female B remains eligible for other profiles
```

# 35. Complete Agent Workflow

## Step 1 --- Login

Agent authenticates through Supabase Auth.

## Step 2 --- Create Profile

Agent selects Male/Female.

System creates:

``` text
profiles.status = DRAFT
created_by = current Agent
```

## Step 3 --- Enter Data

Agent completes:

``` text
Personal
Physical
Education
Profession
Income
Religion
Location
Residency
Parents
Siblings
Children
Previous marriages
Family
Lifestyle
Relocation
```

## Step 4 --- Enter Preferences

Agent records desired partner requirements and importance.

## Step 5 --- Validation

System validates required and conditional fields.

## Step 6 --- Activate

Profile becomes:

``` text
ACTIVE
```

## Step 7 --- Find Match

Agent clicks Find Match.

Engine:

1.  Loads current preference set.
2.  Selects opposite gender.
3.  Removes inactive profiles.
4.  Excludes invalid/self pairs.
5.  Excludes permanently rejected pairs.
6.  Applies hard filters.
7.  Calculates soft criteria.
8.  Calculates A→B.
9.  Calculates B→A.
10. Combines scores.
11. Displays temporary results; no match run is saved for Agent preview.
12. Displays score breakdown temporarily; no persistent score breakdown
    is created for Agent preview.
13. Ranks candidates.
14. Returns Top 5.

## Step 8 --- Client Interest

Agent discusses the temporary preview with the client; the Agent does
not persist candidate selections.

## Step 9 --- Information Request

Agent requests candidate information from Manager.

## Step 10 --- Manager Review

Manager reviews request and candidates.

## Step 11 --- Manager Field Selection

Manager individually selects allowed fields.

## Step 12 --- Release

System creates release snapshot.

## Step 13 --- Agent Receives Release

Agent sees/downloads only approved information.

## Step 14 --- Communication

If families begin actual communication/consideration:

``` text
IN_PROGRESS
```

## Step 15 --- Outcome

Possible:

``` text
REJECTED
ACCEPTED
CLOSED
```

Feedback is recorded.

------------------------------------------------------------------------

# 36. Complete Manager Workflow

## 36.1 Login

Manager sees:

-   pending requests,
-   active/in-progress matches,
-   agent workload,
-   recent activity,
-   matching activity.

## 36.2 Open Request

Manager sees:

-   requesting Agent,
-   original profile,
-   the source profile and request history,
-   match information,
-   score breakdown,
-   prior history.

## 36.3 Re-Match

Manager can run the same matching engine.

No manual score manipulation is required for normal Phase 1 workflow.

## 36.4 Select Candidate

Manager can decide which the source profile and request history should
proceed.

## 36.5 Select Fields

Manager approves individual fields.

## 36.6 Approve/Partially Approve/Reject

Request moves to the appropriate status.

## 36.7 Assignment/Reassignment

Manager can assign operational responsibility to another Agent while
preserving requester identity.

## 36.8 Monitor Progress

Manager can see:

-   shared,
-   contacted,
-   under consideration,
-   in-progress,
-   rejected,
-   accepted.

------------------------------------------------------------------------

# 37. Complete High-Level Admin Workflow

## Login

Admin sees system-wide dashboard.

## User Management

-   Create/disable users.
-   Assign roles.
-   Review status.

## Profile Analytics

-   Total profiles.
-   Active profiles.
-   Draft profiles.
-   Male/female counts.
-   Agent workload.

## Matching Analytics

-   Match runs.
-   Candidate counts.
-   Match outcomes.
-   Rejection patterns.

## Request Analytics

-   Pending.
-   Approved.
-   Rejected.
-   Fulfilled.
-   Manager workload.

## Audit

Admin can inspect:

-   who changed data,
-   who assigned profiles,
-   who released information,
-   who changed match states,
-   when actions occurred.

------------------------------------------------------------------------

# 38. End-to-End Example

``` text
Agent A
  ↓
creates Male A
  ↓
Profile ACTIVE
  ↓
preferences recorded
  ↓
Find Match
  ↓
Top 5:
B 92%
C 89%
D 86%
E 82%
F 79%
  ↓
Client selects B and D
  ↓
Information Request
  ↓
Manager
  ↓
Manager reviews
  ↓
Approves:
Name
Age
Education
Profession
City
Family introduction
  ↓
Release snapshot
  ↓
Agent receives approved information
  ↓
Family communication starts
  ↓
A ↔ B = IN_PROGRESS
  ↓
If rejected:
REJECTED + structured reason
  ↓
A ↔ B is excluded from future automatic suggestions
  ↓
A remains available for C/E/etc.
```

------------------------------------------------------------------------

# 39. Important Edge Cases

## No candidates

Return no candidates. Do not invent results.

## Fewer than five

Return the available number.

## Hard-filter mismatch

Candidate is excluded before soft scoring.

## Soft mismatch

Candidate may remain with reduced score.

## Doesn't Matter

No negative scoring.

## Rejected pair

Exclude that pair, not either profile globally.

## Profile paused

Exclude from new recommendations while preserving history.

## Profile reassigned

Matches/history remain unchanged.

## Request partially approved

Only approved fields are released.

## Request rejected

No release is generated.

## Existing pair found again

Update/use the existing pair rather than inserting duplicate A-B/B-A
records.

## Active IN_PROGRESS pair

Prevent another active IN_PROGRESS relationship for the same profile.

## Reference data changed

Deactivate reference values rather than deleting historically referenced
rows.

## Preference changed

Create/use a new preference version so future matching knows exactly
which requirements were used.

------------------------------------------------------------------------

# 40. Security

## RLS Principle

Security must be enforced in PostgreSQL/Supabase, not just frontend
code.

Agent should not be able to bypass Manager approval by querying a base
candidate table directly.

Recommended architecture:

``` text
Base profile tables
        ↓
RLS / secure RPC / controlled views
        ↓
authorized information
```

### Agent

Can access:

-   own/assigned profiles,
-   allowed match data,
-   own requests,
-   approved releases,
-   own notifications.

### Manager

Can access operational profile/matching/request data required for
review.

### High-Level Admin

Can access system-wide administrative and audit data.

Exact RLS policies must be tested table-by-table.

------------------------------------------------------------------------

# 41. Audit Logs

`audit_logs` records:

-   `id`
-   `actor_user_id`
-   `action`
-   `entity_type`
-   `entity_id`
-   `old_data`
-   `new_data`
-   `metadata`
-   `created_at`

Examples:

``` text
Profile created
Profile updated
Profile reassigned
Match generated
Match status changed
Request created
Request approved
Information released
```

Audit logs should be append-only from normal application roles.

------------------------------------------------------------------------

# 42. Notifications

`notifications` attributes:

-   `id`
-   `user_id`
-   `type`
-   `title`
-   `message`
-   `entity_type`
-   `entity_id`
-   `is_read`
-   `read_at`
-   `created_at`

Use cases:

-   New Manager request.
-   Request approved.
-   Request rejected.
-   Profile assignment.
-   Reassignment.
-   Match status update.
-   System alert.

------------------------------------------------------------------------

# 43. Indexing

Indexes should support actual high-frequency operations.

Important indexes:

``` text
profiles.gender
profiles.status
profiles.current_agent_id

personal_information.marital_status

profile_locations.current_city_id

matches.male_profile_id
matches.female_profile_id
matches.status
matches.final_score

match_runs.source_profile_id

information_requests.requested_by
information_requests.status

notifications.user_id/is_read

audit_logs.entity_type/entity_id
audit_logs.created_at
```

Do not index every column automatically.

------------------------------------------------------------------------

# 44. PostgreSQL vs Graph/Vector DB

PostgreSQL is appropriate for Phase 1 because the core data is
structured and relational.

Examples:

``` text
Profile → Preferences
Profile → Education
Profile → Matches
Match → Feedback
Request → Release
```

Graph DB is not required for this workflow.

Vector DB is not required for structured attributes such as age, city,
religion or education.

Future semantic matching of free-text can be added separately.

------------------------------------------------------------------------

# 45. Normalization / 3NF

The architecture avoids repeating groups and unnecessary transitive
duplication.

Examples:

Bad:

``` text
profile.brother_1
profile.brother_2
profile.brother_3
```

Good:

``` text
siblings
```

Bad:

``` text
profile.city_name
profile.province_name
profile.country_name
```

as repeated text.

Good:

``` text
profile_locations
    → cities
    → provinces
    → countries
```

The model is relationally normalized while intentionally using snapshot
JSON only where historical reproducibility requires it.

------------------------------------------------------------------------

# 46. Intentional Historical Snapshot

`information_release_fields.field_value` and match breakdown values are
snapshots.

This is deliberate.

If a profile changes after release:

``` text
Old release = Lahore
Current profile = Islamabad
```

the historical release must remain Lahore.

This is an audit requirement, not a replacement for normalized source
data.

------------------------------------------------------------------------

# 47. Matching History and Reproducibility

Every important matching result should be traceable to:

``` text
source_profile
preference_set_version
algorithm_version
execution_time
criterion-level breakdown
```

This allows developers to answer:

> Why did the system give this candidate 87%?

without guessing.

------------------------------------------------------------------------

# 48. Recommended Matching Service

Do not put complex matching logic in React/Next.js frontend code.

Recommended:

``` text
Frontend
   ↓
Server/API/RPC
   ↓
Matching Service
   ↓
PostgreSQL
```

The matching service should:

1.  Load source profile.
2.  Load current preference set.
3.  Build candidate pool.
4.  Apply hard filters.
5.  Calculate criterion scores.
6.  Calculate A→B.
7.  Calculate B→A.
8.  Combine scores.
9.  Persist match run.
10. Persist score breakdown.
11. Rank candidates.
12. Return Top N.

------------------------------------------------------------------------

# 49. Transaction Safety

Multi-step operations should be transactional.

Example Manager approval:

``` text
Update request
+
Create release
+
Create release fields
+
Create audit record
+
Create notification
```

Either all succeed or the operation rolls back.

This prevents inconsistent state.

------------------------------------------------------------------------

# 50. PDF Generation

Agent-facing candidate PDFs should be generated from:

``` text
information_release_fields
```

not directly from complete profile tables.

Why:

The release snapshot is the authoritative record of exactly what the
Manager approved.

Never generate a full profile PDF and merely hide fields visually.

------------------------------------------------------------------------

# 51. Search and Pagination

Structured search should support:

-   gender,
-   age,
-   city,
-   religion,
-   education,
-   profession,
-   marital status,
-   profile status.

Large lists must use pagination.

------------------------------------------------------------------------

# 52. Data Retention

Preserve:

-   profiles,
-   profile assignments,
-   preferences,
-   match runs,
-   matches,
-   score breakdowns,
-   match status history,
-   feedback,
-   requests,
-   request assignments,
-   releases,
-   audit logs.

Prefer archive/deactivation over hard deletion for operational
historical data.

------------------------------------------------------------------------

# 53. Testing Requirements

## Authentication

-   Valid login.
-   Invalid login.
-   Disabled user.
-   Logout.
-   Password reset.

## Authorization

-   Agent cannot access another Agent's restricted data.
-   Agent cannot approve releases.
-   Agent cannot read unapproved candidate fields.
-   Manager can review requests.
-   Admin can access administrative data.

## Profile

-   Create.
-   Draft.
-   Update.
-   Activate.
-   Pause.
-   Archive.
-   Assign.
-   Reassign.

## Matching

-   Hard filter.
-   Soft preference.
-   Range.
-   Mandatory.
-   Doesn't Matter.
-   Two-way scoring.
-   Top 5.
-   Fewer than 5.
-   No candidates.
-   Rejected-pair exclusion.
-   Duplicate prevention.
-   IN_PROGRESS restriction.

## Request

-   Create.
-   Review.
-   Approve.
-   Partial approval.
-   Reject.
-   Reassign.
-   Release.
-   Expire/revoke.

## Security

Test RLS independently of UI by attempting unauthorized database/API
access.

------------------------------------------------------------------------

# 54. Performance

The matching process should eliminate candidates as early as possible:

``` text
Gender
 ↓
Profile availability
 ↓
Pair exclusions
 ↓
Hard filters
 ↓
Soft scoring
 ↓
Ranking
 ↓
Top N
```

Do not run expensive scoring against obviously invalid candidates.

------------------------------------------------------------------------

# 55. Localization

Structured data:

``` text
id → bilingual lookup
```

Free text:

``` text
original text
original language
translated text
target language
provider/version
```

Never destroy the original text when translating.

Translation APIs should be used only where required.

Sensitive data should be minimized before being sent to third-party
services.

------------------------------------------------------------------------

# 56. Profile Lifecycle

``` text
DRAFT
  ↓
ACTIVE
  ↓
PAUSED
  ↓
ACTIVE
  ↓
INACTIVE
  ↓
ARCHIVED
```

A profile can be paused without destroying matches/history.

------------------------------------------------------------------------

# 57. Match Lifecycle

Typical:

``` text
SUGGESTED
  ↓
SHORTLISTED
  ↓
SHARED
  ↓
CONTACTED
  ↓
UNDER_CONSIDERATION
  ↓
IN_PROGRESS
  ↓
ACCEPTED / REJECTED / CLOSED
```

A previously closed relationship may be explicitly:

``` text
REOPENED
```

if authorized.

------------------------------------------------------------------------

# 58. Request Lifecycle

``` text
PENDING
  ↓
UNDER_REVIEW
  ↓
APPROVED
     OR
PARTIALLY_APPROVED
     OR
REJECTED
  ↓
FULFILLED
```

Cancellation can occur before completion where allowed.

------------------------------------------------------------------------

# 59. Phase-1 Matching Example

Male A:

``` text
Age: 25
City: Lahore
Education: Bachelor
Profession: Engineer
```

Preferences:

``` text
Age: 22–25
City: Lahore preferred
Education: Bachelor+
Religious practice: Practicing
```

Candidate B:

``` text
Age: 24
City: Lahore
Bachelor
Practicing
```

Candidate C:

``` text
Age: 26
City: Islamabad
Bachelor
Practicing
```

B may score higher from A's perspective.

Then the engine checks:

``` text
B preferences → A
```

The final result is based on both directions.

------------------------------------------------------------------------

# 60. Score Meaning

If UI shows:

``` text
92%
```

it means:

> 92% compatibility according to configured matching criteria.

It does not mean:

> 92% chance of marriage.

This distinction must be reflected in UI, reports and PDFs.

------------------------------------------------------------------------

# 61. Future Analytics / ML

Phase 1 creates a historical dataset containing:

``` text
Profile
Preferences
Match
Scores
Feedback
Rejection reason
Outcome
Request history
```

Future phases can use this for:

-   rejection analysis,
-   rule tuning,
-   preference effectiveness,
-   AI-assisted extraction,
-   ML ranking.

Phase 1 itself must remain deterministic.

------------------------------------------------------------------------

# 62. Recommended Implementation Order

## Week/Stage 1 --- Foundation

-   Supabase Auth.
-   Users.
-   Roles.
-   Permissions.
-   Reference data.
-   Profiles.
-   Profile information.
-   Preference modules.

## Stage 2 --- Matching

-   Match runs.
-   Candidate retrieval.
-   Hard filters.
-   Soft scoring.
-   Two-way score.
-   Score breakdown.
-   Top 5.

## Stage 3 --- Operations

-   Match lifecycle.
-   Feedback.
-   Requests.
-   Manager review.
-   Assignments.
-   Releases.
-   PDFs.

## Stage 4 --- Security

-   RLS.
-   Secure RPC/views.
-   Audit.
-   Permission checks.

## Stage 5 --- Dashboards

-   Agent.
-   Manager.
-   High-Level Admin.

## Stage 6 --- Testing/Deployment

-   Integration tests.
-   RLS tests.
-   Matching tests.
-   UAT.
-   Backups.
-   Production deployment.

------------------------------------------------------------------------

# 63. Acceptance Criteria

## Profile

-   Agent can create male/female profile.
-   Drafts are supported.
-   Complete profiles can become active.
-   All required profile sections are stored correctly.
-   Agent assignment works.
-   Assignment history is preserved.

## Preferences

-   Partner preferences can be captured.
-   Mandatory and soft criteria are distinct.
-   Range preferences work.
-   Importance is stored.
-   Preference versions are traceable.

## Matching

-   Opposite gender candidates are selected.
-   Inactive candidates are excluded.
-   Hard filters work.
-   Soft scores work.
-   Doesn't Matter does not penalize.
-   Two-way scoring works.
-   Score breakdown explains results.
-   Top 5 are returned.
-   Previously rejected pair is not automatically suggested again.

## Manager

-   Manager sees requests.
-   Manager can re-run matching.
-   Manager can select fields.
-   Partial approval works.
-   Release snapshot is created.
-   Agent receives only approved information.

## Lifecycle

-   Match status changes are recorded.
-   IN_PROGRESS rule is enforced.
-   Feedback is structured.
-   Historical statuses remain available.

## Security

-   RLS blocks unauthorized access.
-   Manager-only release functionality is enforced.
-   Audit events are stored.

------------------------------------------------------------------------

# 64. Final Entity Relationship Overview

The final Phase-1 architecture is:

``` text
                         ┌──────────────────────┐
                         │       users          │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │     user_roles        │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        HIGH_LEVEL_ADMIN         MANAGER             AGENT


                         ┌──────────────────────┐
                         │       profiles       │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼────────────────────────┐
             │                      │                        │
             ▼                      ▼                        ▼
     profile information     preference_sets       profile assignments
     (personal, physical,       │                    / history
      education, family,        │
      religion, etc.)           ▼
                        typed preference tables


AGENT PREVIEW
─────────────
profiles + preferences
        ↓
deterministic matching engine
        ↓
temporary results
        ↓
display only
        ↓
NO persistent match-run rows


MANAGER OFFICIAL RUN
────────────────────
information_requests
        ↓
Manager
        ↓
match_runs
        ↓
match_run_results
        ↓
match_score_breakdowns
        ↓
candidate selection
        ↓
information_releases
        ↓
information_release_fields
        ↓
Agent receives approved snapshot
        ↓
PDF


ACTUAL RELATIONSHIP
───────────────────
Male profile ↔ Female profile
        ↓
matches
        ↓
match_status_history
        ↓
match_feedback


SUPPORTING SYSTEMS
──────────────────
notifications
audit_logs

REFERENCE DATA
───────────────
countries
provinces
cities
religions
sects
castes
mother_tongues
education_levels
occupations
rejection_reasons
```

## Important Entity Distinctions

### `match_run_results`

Means:

> "This candidate was returned by this official Manager matching run."

### `matches`

Means:

> "This male/female pair entered an actual relationship lifecycle."

### `information_requests`

Means:

> "An Agent asked the Manager to process the Agent's source profile."

### `information_releases`

Means:

> "The Manager approved selected candidate information for release."

These four entities must not be collapsed into one generic "match"
table.

# 65. Final Design Principles

### Principle 1 --- `profiles` is the identity root

All matrimonial information belongs to a profile.

### Principle 2 --- Separate domains

Personal, family, preferences, matching and requests are different
domains.

### Principle 3 --- Separate statuses

Profile status, match status and request status are independent.

### Principle 4 --- Pair-level rejection

Rejecting A↔B does not reject A or B globally.

### Principle 5 --- Explainable matching

Every important score should be explainable.

### Principle 6 --- Manager-controlled disclosure

Candidate visibility and candidate information release are different
permissions.

### Principle 7 --- Preserve history

Do not destroy operational history simply because current state changes.

### Principle 8 --- Structured data first

Use relational/reference data for matching-critical attributes.

### Principle 9 --- Deterministic Phase 1

Do not claim ML where the system is rule-based.

### Principle 10 --- Future-ready, not over-engineered

Preserve clean historical data for future AI/ML without introducing
graph/vector/ML infrastructure unnecessarily in Phase 1.

------------------------------------------------------------------------

# 66. Pre-Production Decisions Still Requiring Business Sign-Off

The architecture and workflow above are fixed for Phase 1, but the
following business values should be explicitly signed off before the
production migration is frozen.

1.  Exact hard-filter criteria.
2.  Exact numerical scoring weights.
3.  Exact score-combination formula for two-way compatibility.
4.  Exact range/tolerance behavior for age, height, income and other
    numerical criteria.
5.  Exact required profile fields.
6.  Exact Agent preview fields.
7.  Exact restricted/sensitive fields.
8.  Exact Manager-visible fields.
9.  Exact releaseable fields by role/business rule.
10. Whether `released_to` must always equal the current request assignee
    or can be explicitly selected.
11. Exact preference behavior for multiple cities/countries if required
    later.
12. Exact age calculation policy from DOB.
13. Exact definition of "actual communication/proposal" that starts
    `IN_PROGRESS`.
14. Exact rule for reopening a rejected/closed pair.
15. Exact active `IN_PROGRESS` relationship limit.
16. Exact request completion behavior when multiple candidate releases
    are created.
17. Exact PDF layout and bilingual presentation.
18. Exact dashboard KPIs.
19. Exact audit event list.
20. Exact profile archive/reactivation rules.
21. Exact reference-data administration permissions.
22. Exact retention period for releases, requests, runs and audit logs.
23. Exact notification channels.
24. Exact production RLS policies and SECURITY DEFINER RPC boundaries.
25. Exact backup/recovery objectives.

These are configuration/business-policy decisions. They should not be
silently invented inside the application code.

# 67. Conclusion

NikahKaru Phase 1 is a controlled internal CRM and deterministic
matrimonial matching platform:

``` text
Authorized Users
      +
Role-Based Access
      +
Structured Matrimonial Profiles
      +
Structured Partner Preferences
      +
Agent Non-Persistent Matching Preview
      +
Manager-Persisted Official Matching Runs
      +
Two-Way Compatibility
      +
Explainable Scoring
      +
Pair-Level Relationship History
      +
Manager-Controlled Candidate Selection
      +
Field-Level Information Release
      +
Immutable Release Snapshots
      +
PDF Generation
      +
Auditability
      +
Supabase/PostgreSQL Security
      +
Future Analytics / ML Readiness
```

The most important Phase-1 architectural boundary is:

``` text
AGENT
  = collect data + preview matching + client presentation
  = no persisted candidate matching history

MANAGER
  = official matching + candidate selection + information approval
  = persisted matching history

SYSTEM
  = relationship lifecycle + feedback + audit + historical snapshots
```

This keeps exploratory Agent searches out of the official historical
dataset, makes Manager decisions reproducible, prevents unauthorized
candidate disclosure, and preserves structured historical data for
future analytics and ML.

The database schema corresponding to this PRD is:

`NikaahKaro_Phase_1_Database_Schema_v2.sql`

The PRD and schema should be treated as a pair: database entities,
workflow terminology, lifecycle semantics and security boundaries should
remain aligned.

# 67. Conclusion

NikahKaru Phase 1 is best understood as:

``` text
CRM
+
Structured Matrimonial Profiles
+
Structured Preferences
+
Deterministic Matching
+
Two-Way Compatibility
+
Explainable Scoring
+
Pair-Level History
+
Manager-Controlled Information Release
+
Supabase RLS
+
Auditability
```

The resulting PostgreSQL architecture is designed to be normalized,
queryable, secure, explainable and extensible.

It provides the operational foundation for Phase 1 while preserving the
historical data needed for future analytics and AI/ML phases.
