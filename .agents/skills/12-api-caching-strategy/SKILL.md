---
name: api-caching-strategy
description: CRITICAL — API call optimization patterns, caching tiers, cache invalidation rules, and data flow architecture. Read this BEFORE writing ANY data-fetching code.
---

# API Caching Strategy — MANDATORY READING

> [!CAUTION]
> This is the MOST CRITICAL skill for NikaahKaro. Every developer/agent MUST follow these rules. Duplicate API calls are UNACCEPTABLE.

## Core Principle
```
If data was fetched once → use the cached version
Only re-fetch when data is KNOWN to be stale
NEVER make the same API call twice in a single user session without reason
```

## Three-Tier Caching Architecture

### Tier 1: Session-Permanent Cache
**Loaded ONCE at login/app init. NEVER re-fetched during session.**

| Data | When Loaded | When Invalidated |
|------|-------------|-------------------|
| User profile (name, email, phone) | Login | Logout or explicit profile edit |
| User role (HIGH_LEVEL_ADMIN/MANAGER/AGENT) | Login | Never (requires re-login) |
| User permissions array | Login | Never (requires re-login) |
| Countries list | App init | Admin changes ref data (rare) |
| Provinces list | App init | Admin changes ref data (rare) |
| Cities list | App init | Admin changes ref data (rare) |
| Religions list | App init | Admin changes ref data (rare) |
| Sects list | App init | Admin changes ref data (rare) |
| Castes list | App init | Admin changes ref data (rare) |
| Mother tongues list | App init | Admin changes ref data (rare) |
| Education levels list | App init | Admin changes ref data (rare) |
| Occupations list | App init | Admin changes ref data (rare) |
| Rejection reasons list | App init | Admin changes ref data (rare) |

**Implementation**: Zustand store or React Context loaded in root layout.

### Tier 2: Page-Level Cache
**Loaded when page mounts. Cached for the page lifecycle. Invalidated on mutations.**

| Data | When Loaded | When Invalidated |
|------|-------------|-------------------|
| Profile list | Profiles page mount | Profile created/updated/deleted |
| Dashboard KPIs | Dashboard mount | Relevant mutations (30-60s stale time OK) |
| Request list (Manager) | Requests page mount | New request/status change |
| Match list | Matches page mount | New match/status change |
| Agent list (for dropdowns) | First need | User created/status changed |

**Implementation**: React Query (TanStack Query) with staleTime and cache keys, OR SWR.

### Tier 3: Fresh Data (Always Fetch)
**Data that must always be current.**

| Data | Why Always Fresh |
|------|-----------------|
| Notification count/list | Real-time via Supabase subscription |
| Match run results | Computed on-demand, never cached |
| Release field data | Critical accuracy |

## Concrete Patterns

### Pattern 1: Role Check (ZERO API calls after login)
```typescript
// ❌ WRONG — fetches role on every page
useEffect(() => {
  const role = await supabase.from('user_roles').select('*').eq('user_id', userId);
  setRole(role);
}, []);

// ✅ CORRECT — reads from cached auth store
const { role } = useAuthStore();
if (role === 'MANAGER') { ... }
```

### Pattern 2: Reference Data Dropdown (ZERO API calls)
```typescript
// ❌ WRONG — fetches countries on every form render
useEffect(() => {
  const { data } = await supabase.from('countries').select('*');
  setCountries(data);
}, []);

// ✅ CORRECT — reads from cached reference store
const { countries, getProvincesByCountry } = useReferenceData();
```

### Pattern 3: Cascade Dropdown (ZERO API calls)
```typescript
// ❌ WRONG — fetches provinces from API when country changes
const onCountryChange = async (countryId) => {
  const { data } = await supabase.from('provinces').select('*').eq('country_id', countryId);
  setProvinces(data);
};

// ✅ CORRECT — filters cached data in memory
const onCountryChange = (countryId) => {
  const provinces = getProvincesByCountry(countryId); // from cache
  setFilteredProvinces(provinces);
};
```

### Pattern 4: Profile List (Single API call with server-side filtering)
```typescript
// ❌ WRONG — fetches all profiles, filters client-side
const { data } = await supabase.from('profiles').select('*');
const filtered = data.filter(p => p.status === 'ACTIVE');

// ✅ CORRECT — server-side filtering with pagination
const { data } = await supabase
  .from('profiles')
  .select('*, personal_information(full_name, date_of_birth)')
  .eq('status', 'ACTIVE')
  .range(page * limit, (page + 1) * limit - 1)
  .order('created_at', { ascending: false });
```

### Pattern 5: Multi-Step Form (preserve state across steps)
```typescript
// ❌ WRONG — re-fetches profile data when navigating between form steps
useEffect(() => {
  const data = await loadStep1Data(profileId);
  setFormData(data);
}, [currentStep]);

// ✅ CORRECT — keep form data in local state, only fetch once on initial load
const [formData, setFormData] = useState<FormData>(initialFormData);
// Update formData as user fills steps
// Only save to DB per-step or on final review
```

### Pattern 6: Dashboard Data (short cache, invalidate on mutations)
```typescript
// Use React Query / SWR pattern:
const { data: dashboardData } = useQuery({
  queryKey: ['dashboard', role],
  queryFn: () => dashboardService.getDashboardData(role),
  staleTime: 60000,  // Consider fresh for 60 seconds
  cacheTime: 300000,  // Keep in cache for 5 minutes
});

// After creating a profile:
queryClient.invalidateQueries(['dashboard']);  // Dashboard will re-fetch
```

## Cache Invalidation Matrix

| Mutation | Invalidates |
|----------|-------------|
| Create profile | Profile list, Dashboard KPIs |
| Update profile | Profile detail, Profile list |
| Change profile status | Profile list, Dashboard KPIs |
| Run matching (Manager) | Match results for that profile |
| Create information request | Request list, Dashboard KPIs |
| Approve/reject request | Request list, Agent notifications |
| Create release | Release data, Request detail |
| Change match status | Match list, Dashboard KPIs |
| Create user (Admin) | User list, Agent/Manager dropdowns |

## Implementation Files
```
src/lib/stores/
├── auth-store.ts           # Tier 1: User + role + permissions
├── reference-data-store.ts # Tier 1: All reference tables
└── query-client.ts         # Tier 2: React Query config

src/lib/hooks/
├── useAuth.ts              # Access cached auth data
├── useReferenceData.ts     # Access cached reference data
├── useProfiles.ts          # Paginated profile queries
├── useDashboard.ts         # Dashboard data with staleTime
├── useRequests.ts          # Request list queries
└── useMatches.ts           # Match list queries
```

## API Call Budget Per Page

| Page | Expected API Calls | Notes |
|------|-------------------|-------|
| Login | 1 (auth) + 1 (user+role+permissions) | Then cached |
| App Init | 10 (reference data in parallel) | Then cached |
| Dashboard | 1 (KPIs) | Cached 60s |
| Profile List | 1 (paginated) | Cache per page |
| Profile Detail | 1-2 (profile + sections) | Cache per profile |
| Add Profile Form | 0 (reference data from cache) | Saves per step |
| Matching Preview | 1 (compute) | Never cached |
| Request List | 1 (paginated) | Cache per page |
| Match List | 1 (paginated) | Cache per page |
| Admin Users | 1 (paginated) | Cache per page |

**Total session overhead: ~14 API calls at start, then 1 per page visit.**
