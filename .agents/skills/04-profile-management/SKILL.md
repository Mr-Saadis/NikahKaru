---
name: profile-management
description: Complete profile CRUD — create, read, update, archive profiles. Multi-step form (9 steps), profile listing, profile detail view, status management, and agent assignment.
---

# Profile Management System

## Overview
The profile is the central entity of NikahKaru. Each person has ONE matrimonial profile with 15+ related data sections. Profile creation uses a 9-step wizard form.

## Profile Entity Structure (from Schema v2)

```
profiles (ROOT)
├── personal_information      (1:1)
├── physical_information      (1:1)
├── education_records         (1:many)
├── employment_records        (1:many)
├── income_information        (1:1)
├── religion_information      (1:1)
├── profile_locations         (1:1)
├── residency_information     (1:1)
├── parents                   (1:many, max 2 — FATHER/MOTHER)
├── siblings                  (1:many)
├── children                  (1:many)
├── previous_marriages        (1:many)
├── family_information        (1:1)
├── lifestyle_information     (1:1)
└── relocation_information    (1:1)
```

## Profile Statuses (Lifecycle)
```
DRAFT → ACTIVE → PAUSED → ACTIVE → INACTIVE → ARCHIVED
```

## Multi-Step Form (9 Steps — from DESIGN_SYSTEM.md Section 12)

| Step | Name | DB Tables | Type |
|------|------|-----------|------|
| 1 | Basic Information | profiles + personal_information | Gender, Name, DOB, marital status, nationality, mother tongue |
| 2 | Marital & Physical | physical_information + children + previous_marriages | Height, weight, complexion, disability, previous marriages |
| 3 | Education & Profession | education_records + employment_records + income_information | Education, employment, income |
| 4 | Religion & Culture | religion_information | Religion, sect, caste |
| 5 | Location & Residency | profile_locations + residency_information | Current/permanent location, house status, family setup |
| 6 | Family Details | parents + siblings + family_information | Father, mother, siblings, family background |
| 7 | Lifestyle | lifestyle_information + relocation_information | Beard, hijab, smoking, religious practice, relocation |
| 8 | Partner Preferences | preference_sets + all preference tables | Desired partner requirements with importance levels |
| 9 | Review | (read-only) | Confirm all data and save |

## Implementation Steps

### Step 1: Type Definitions
Create `src/lib/types/profile.types.ts`:
- Mirror ALL database table structures exactly
- Include all enums from schema (profile_gender, profile_status, marital_status, etc.)
- Create form-specific types for each step

### Step 2: Profile Service
Create `src/lib/services/profile-service.ts`:

```typescript
// CREATE — Step by step (Agent creates profile first, then saves each section)
createProfile(gender: ProfileGender): Promise<Profile>
savePersonalInfo(profileId: string, data: PersonalInfo): Promise<void>
savePhysicalInfo(profileId: string, data: PhysicalInfo): Promise<void>
saveEducationRecords(profileId: string, records: EducationRecord[]): Promise<void>
saveEmploymentRecords(profileId: string, records: EmploymentRecord[]): Promise<void>
saveIncomeInfo(profileId: string, data: IncomeInfo): Promise<void>
saveReligionInfo(profileId: string, data: ReligionInfo): Promise<void>
saveLocations(profileId: string, data: ProfileLocations): Promise<void>
saveResidencyInfo(profileId: string, data: ResidencyInfo): Promise<void>
saveParents(profileId: string, parents: Parent[]): Promise<void>
saveSiblings(profileId: string, siblings: Sibling[]): Promise<void>
saveChildren(profileId: string, children: Child[]): Promise<void>
savePreviousMarriages(profileId: string, marriages: PreviousMarriage[]): Promise<void>
saveFamilyInfo(profileId: string, data: FamilyInfo): Promise<void>
saveLifestyleInfo(profileId: string, data: LifestyleInfo): Promise<void>
saveRelocationInfo(profileId: string, data: RelocationInfo): Promise<void>
savePreferences(profileId: string, data: AllPreferences): Promise<void>

// READ
getProfileById(id: string): Promise<FullProfile>
getProfilesList(filters: ProfileFilters): Promise<ProfileListItem[]>

// UPDATE
updateProfileStatus(id: string, status: ProfileStatus): Promise<void>
activateProfile(id: string): Promise<void>  // validates all required sections first

// ASSIGNMENT
assignProfileToAgent(profileId: string, agentId: string, assignedBy: string): Promise<void>
```

### Step 3: Multi-Step Form Component
Create `src/components/profile/AddProfileForm.tsx`:

**Design Specs (from DESIGN_SYSTEM.md Section 8.9, 8.10, 12):**
- Form card: `bg-white rounded-[32px] p-8 shadow border border-[#E9E4DC]` (lg:col-span-8)
- Summary sidebar: `lg:col-span-4 sticky top-8`
- HorizontalStepper at top with progress tracking
- ProfileSidebar on right showing completion status

**Form State Management:**
```typescript
// Use React state or form library (react-hook-form recommended)
// Store form data in local state during creation
// Save to DB per-step or on final review
// Track which steps are completed
```

### Step 4: Profile List Page
Create `src/app/(dashboard)/profiles/page.tsx`:

**Features:**
- Search by name, gender, status, city, age range
- Filter tabs: All, Active, Draft, Paused, Archived
- Sortable table with columns: ID, Name, Gender, Age, City, Status, Agent, Actions
- Pagination
- "View Dossier" button per row

**Design Specs (from DESIGN_SYSTEM.md Section 8.6):**
- Table: `bg-white rounded-[28px] border border-[#ECE5D9] p-5`
- Filter Pills: Active `bg-[#16382E] text-white`, Inactive `bg-[#F4EFE7] text-[#696256]`
- Table headers: `text-[#888174] font-medium text-[11.5px] uppercase tracking-wider`
- Rows: `hover:bg-[#FAF7F2] divide-y divide-[#F7F3EB]`

### Step 5: Profile Detail/Dossier View
Create `src/app/(dashboard)/profiles/[id]/page.tsx`:
- Full profile display with all sections
- Status badge
- Agent assignment info
- Action buttons: Edit, Pause, Archive, Assign
- Match history (if any)

## Validation Rules (from PRD Section 35, Step 5)
- Required fields per step
- Conditional fields (e.g., disability_details only if has_disability=true)
- Valid reference IDs (from cached reference data — NO API call)
- Logical ranges (DOB, height 80-250cm, weight 20-400kg)
- Gender-specific rules (beard for male, hijab for female)
- Date consistency (start_year <= end_year)
- Parent uniqueness (max 1 FATHER, 1 MOTHER per profile)

## API Call Optimization
- **Profile creation**: 1 call to create profiles row, then 1 call per step save
- **Profile list**: 1 paginated call with server-side filtering
- **Profile detail**: 1 call with JOINs to get full profile (OR parallel calls for each section)
- **Reference data for dropdowns**: FROM CACHE — 0 API calls
- **Form re-visits**: If navigating back to a step, show data from local state (NOT re-fetched from DB unless explicitly reloading)

## Important Notes
- Age is CALCULATED from date_of_birth, never stored
- `created_by` = Agent who creates the profile
- `current_agent_id` = Agent currently handling the profile (can differ from creator)
- Profile can be saved as DRAFT at any step
- Only ACTIVE profiles participate in matching
