---
name: reference-data-provider
description: Global reference data loading and caching for lookup tables — countries, provinces, cities, religions, sects, castes, mother_tongues, education_levels, occupations, rejection_reasons. Loaded ONCE at app init, reused everywhere.
---

# Reference Data Provider & Caching

## Overview
Reference/lookup data (countries, provinces, cities, etc.) changes VERY RARELY. Load ALL of it ONCE at application initialization and make it available globally. This eliminates hundreds of redundant API calls throughout the app.

## Reference Tables (from Schema v2)

| Table | Key Fields | Bilingual |
|---|---|---|
| `countries` | id, code, name_en, name_ur, is_active | ✅ |
| `provinces` | id, country_id, name_en, name_ur, is_active | ✅ |
| `cities` | id, province_id, country_id, name_en, name_ur, is_active | ✅ |
| `religions` | id, name_en, name_ur, is_active | ✅ |
| `sects` | id, religion_id, name_en, name_ur, is_active | ✅ |
| `castes` | id, name_en, name_ur, is_active | ✅ |
| `mother_tongues` | id, name_en, name_ur, is_active | ✅ |
| `education_levels` | id, name_en, name_ur, sort_order, is_active | ✅ |
| `occupations` | id, name_en, name_ur, is_active | ✅ |
| `rejection_reasons` | id, code, name_en, name_ur, is_active | ✅ |

## Implementation

### Step 1: Type Definitions
Create `src/lib/types/reference-data.types.ts`:

```typescript
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

// ... same pattern for religions, sects, castes, mother_tongues, education_levels, occupations, rejection_reasons
```

### Step 2: Reference Data Store
Create `src/lib/stores/reference-data-store.ts`:

```typescript
// Using Zustand or React Context
interface ReferenceDataState {
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
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAll: () => Promise<void>;
  
  // Helpers (READ from cache, NO API call)
  getCountryById: (id: number) => Country | undefined;
  getProvincesByCountry: (countryId: number) => Province[];
  getCitiesByProvince: (provinceId: number) => City[];
  getSectsByReligion: (religionId: number) => Sect[];
  getActiveCountries: () => Country[];
  // ... more helpers
}
```

### Step 3: Data Loading (ONE batch call)
```typescript
async function loadAllReferenceData() {
  // Single batch of parallel calls — executed ONCE
  const [
    countries,
    provinces,
    cities,
    religions,
    sects,
    castes,
    motherTongues,
    educationLevels,
    occupations,
    rejectionReasons
  ] = await Promise.all([
    supabase.from('countries').select('*').eq('is_active', true),
    supabase.from('provinces').select('*').eq('is_active', true),
    supabase.from('cities').select('*').eq('is_active', true),
    supabase.from('religions').select('*').eq('is_active', true),
    supabase.from('sects').select('*').eq('is_active', true),
    supabase.from('castes').select('*').eq('is_active', true),
    supabase.from('mother_tongues').select('*').eq('is_active', true),
    supabase.from('education_levels').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('occupations').select('*').eq('is_active', true),
    supabase.from('rejection_reasons').select('*').eq('is_active', true),
  ]);
  
  // Store ALL in state — no more API calls for reference data
}
```

### Step 4: Provider Wrapper
Create `src/components/providers/ReferenceDataProvider.tsx`:
```typescript
// Wraps the entire authenticated app
// Loads reference data on mount
// Shows loading spinner until ready
// Children can use useReferenceData() hook to access cached data
```

### Step 5: Usage Throughout App (ZERO API calls)
```typescript
// In any component:
const { countries, getProvincesByCountry, getCitiesByProvince } = useReferenceData();

// Dropdown for country selection:
<select>
  {countries.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
</select>

// Cascade: country → provinces → cities
// ALL from cache. ZERO API calls.
```

### Step 6: Cascade Logic for Dropdowns
```
User selects Country
    ↓ (filter from cached provinces)
Show provinces for selected country
    ↓ (filter from cached cities)
Show cities for selected province

User selects Religion
    ↓ (filter from cached sects)
Show sects for selected religion
```

**ALL filtering happens in-memory from cached data. NO API calls.**

## Cache Invalidation
- Reference data changes are RARE (admin-only action)
- If admin changes reference data → trigger `referenceDataStore.loadAll()` again
- Normal users will NEVER need to re-fetch reference data during a session

## API Call Count
- **App initialization**: 10 parallel calls (one per reference table)
- **Rest of session**: 0 calls for reference data
- **Without this pattern**: Potentially 100+ duplicate calls across pages/forms
