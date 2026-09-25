---
name: preference-management
description: Partner preference system — structured preference tables with importance levels, preference versioning, preference form UI for Step 8 of profile creation.
---

# Partner Preference Management

## Overview
Each profile has desired-partner preferences organized in typed tables. Preferences have importance levels (MANDATORY, HIGH, MEDIUM, LOW) that drive the matching engine's hard-filter and soft-scoring behavior.

## Preference Architecture (from Schema v2)

```
preference_sets (versioned container)
├── basic_preferences         (age, marital status, children, gender)
├── physical_preferences      (height, weight, complexion, disability, beard, hijab)
├── education_preferences     (min education level, field of study)
├── profession_preferences    (occupation, employment type, income range)
├── religion_preferences      (religion, sect, caste, religious practice)
├── location_preferences      (country, province, city)
├── family_preferences        (family setup, living with, parents status)
├── lifestyle_preferences     (smoking, religious practice, beard, hijab)
└── relocation_preferences    (willingness, preferred location)
```

## Importance Levels
```
MANDATORY  → Hard filter. Candidate EXCLUDED if no match. Non-negotiable.
HIGH       → Large scoring weight. Strong preference.
MEDIUM     → Normal scoring weight.
LOW        → Small scoring weight. Weak preference.
```

## Preference Versioning
- Each `preference_sets` row has a `version` number
- `is_current = true` marks the active preference set
- When preferences change → create new version, set `is_current = true`, old becomes `false`
- This ensures match history knows EXACTLY which preferences were used

## Implementation

### Step 1: Types
```typescript
// src/lib/types/preference.types.ts

export type PreferenceImportance = 'MANDATORY' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface BasicPreferences {
  min_age: number | null;
  max_age: number | null;
  age_importance: PreferenceImportance | null;
  preferred_marital_status: MaritalStatus | null;
  marital_status_importance: PreferenceImportance | null;
  children_allowed: YesNo | null;
  children_importance: PreferenceImportance | null;
  preferred_gender: ProfileGender | null;  // opposite gender
  gender_importance: PreferenceImportance | null;
}

// ... similar for all 9 preference tables
```

### Step 2: Preference Service
```typescript
// src/lib/services/preference-service.ts

savePreferences(profileId: string, data: AllPreferences): Promise<void>
// 1. Create preference_sets row (or new version)
// 2. Insert/update all 9 preference sub-tables
// 3. Mark this as is_current = true

getCurrentPreferences(profileId: string): Promise<AllPreferences | null>
// 1. Get preference_sets where profile_id = X and is_current = true
// 2. Fetch all 9 sub-tables by preference_set_id
// Return combined result

getPreferenceHistory(profileId: string): Promise<PreferenceSet[]>
// All versions for analytics/audit
```

### Step 3: Preference Form UI (Step 8 of Add Profile)
Design pattern per preference group:
```
┌─────────────────────────────────────────┐
│ Age Preference                          │
│ ┌──────────┐  ┌──────────┐  ┌────────┐ │
│ │ Min: 22  │  │ Max: 28  │  │ HIGH ▼ │ │
│ └──────────┘  └──────────┘  └────────┘ │
├─────────────────────────────────────────┤
│ Marital Status                          │
│ ┌─────────────────────┐  ┌───────────┐ │
│ │ Never Married     ▼ │  │ MANDATORY │ │
│ └─────────────────────┘  └───────────┘ │
└─────────────────────────────────────────┘
```

Each preference field has:
1. The value input (dropdown, number input, range slider)
2. An importance selector (MANDATORY / HIGH / MEDIUM / LOW / Doesn't Matter)

### Step 4: "Doesn't Matter" Handling
- If user selects "Doesn't Matter" → set importance to null or don't store
- In matching: skip this criterion entirely (no positive or negative score)
- Do NOT inflate/deflate the scoring denominator

## Dropdown Data Sources (ALL from cached reference data)
- Countries → `useReferenceData().countries`
- Provinces → `useReferenceData().getProvincesByCountry(countryId)`
- Cities → `useReferenceData().getCitiesByProvince(provinceId)`
- Religions → `useReferenceData().religions`
- Sects → `useReferenceData().getSectsByReligion(religionId)`
- Castes → `useReferenceData().castes`
- Education Levels → `useReferenceData().educationLevels` (sorted by sort_order)
- Occupations → `useReferenceData().occupations`

**ALL dropdowns populated from cache. ZERO API calls.**

## API Call Count
- Save preferences: 1 call to create preference_sets + 9 parallel calls for sub-tables (or 1 RPC function)
- Load preferences: 1 call to get preference_set + 1 call per sub-table (or 1 combined query)
- Dropdown data: 0 API calls (all from cache)
