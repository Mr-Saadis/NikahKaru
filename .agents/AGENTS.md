# NikaahKaro CRM — Project Rules & Conventions

> These rules apply to ALL agents working on this project. Read carefully before writing ANY code.

---

## 1. PROJECT IDENTITY

- **Project**: NikaahKaro.com — Internal CRM + Matrimonial Matching Engine
- **Phase**: 1 (Deterministic, Rule-Based — NO ML)
- **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase + PostgreSQL
- **Font**: Plus Jakarta Sans (Google Fonts)
- **Icons**: Lucide React
- **UI Base**: Shadcn/UI (customized)
- **Auth**: Supabase Auth
- **Roles**: HIGH_LEVEL_ADMIN, MANAGER, AGENT

---

## 2. CRITICAL ARCHITECTURAL RULES

### 2.1 API Call Optimization — MANDATORY
> [!CAUTION]
> This is the MOST IMPORTANT rule. Violation is UNACCEPTABLE.

- **NEVER make duplicate API calls** for data already available in the current session/context.
- **Cache user payload** (role, permissions, user info) after first auth check — reuse everywhere.
- **Cache reference/lookup data** (countries, provinces, cities, religions, sects, castes, education_levels, occupations, mother_tongues, rejection_reasons) — these change RARELY.
- **Use React Context or Zustand store** for session-wide data caching.
- **Only re-fetch when**:
  - User explicitly triggers a refresh/reload
  - Data is known to be stale (e.g., after a mutation)
  - Navigation to a page that requires fresh data
- **Pattern**:
  ```
  First load → fetch → store in context/cache
  Subsequent access → read from context/cache
  Mutation → invalidate relevant cache → re-fetch
  ```
- **Role check**: User role is determined ONCE at login/session start. NEVER re-fetch user role on every page/component mount.
- **Reference data**: Load ALL reference tables once at app initialization. Store in a global provider.

### 2.2 Database Schema is FINAL
- The database schema is defined in `NikaahKaro_Phase_1_Database_Schema_v2.sql`
- **DO NOT** modify the schema without explicit user approval
- Every table, column, enum, trigger, and index is intentional
- Read the schema file BEFORE writing any data-access code

### 2.3 Agent vs Manager Boundary — CRITICAL
- **Agent Preview Matching** = NON-PERSISTENT. No `match_runs`, `match_run_results`, or `match_score_breakdowns` rows created.
- **Manager Official Matching** = PERSISTED. Creates `match_runs` + `match_run_results` + `match_score_breakdowns`.
- Agent CANNOT select candidate profiles directly. Agent requests THEIR SOURCE PROFILE from Manager.
- Manager controls ALL information release — field-by-field.

### 2.4 One Person = One Profile
- `profiles` is the central/root entity
- All section tables reference `profiles.id`
- No "master mapping table"

### 2.5 Separate Status Domains
- `profiles.status` ≠ `matches.status` ≠ `information_requests.status`
- NEVER confuse these three domains

### 2.6 Historical Data Preservation
- Prefer archive/deactivation over hard deletion
- Release snapshots are IMMUTABLE
- Match status history is APPEND-ONLY
- Preference versions are traceable

---

## 3. DESIGN SYSTEM RULES

- **ALWAYS** follow `DESIGN_SYSTEM.md` for ALL UI work
- **Primary Brand Color**: `#064e3b` (Deep Forest Green)
- **Background**: `#FAF8F5` (Warm neutral — NEVER cold grey)
- **Accent**: Amber/Gold (`#F5C770`, `#D4AF37`, `#FDF0D8`)
- **Rounded Everything**: Cards `rounded-[22px]` to `rounded-[32px]`, Buttons `rounded-full`
- **Subtle Shadows**: `rgba(0,0,0,0.04)` max — cards float gently
- **Plus Jakarta Sans ONLY** — No other fonts
- **Fixed Viewport App**: `fixed inset-0` — only main content scrolls
- Read `DESIGN_SYSTEM.md` for exact hex codes, component specs, and patterns

---

## 4. CODE CONVENTIONS

### File Naming
- Components: `PascalCase.tsx` (e.g., `Sidebar.tsx`, `ProfileForm.tsx`)
- Pages: `page.tsx` inside route folders
- Utilities: `camelCase.ts` (e.g., `matchingEngine.ts`)
- Types: `types.ts` or `*.types.ts`
- API routes: `route.ts` inside API route folders

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth routes (login, etc.)
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── overview/
│   │   ├── profiles/
│   │   ├── add-profile/
│   │   ├── matching/
│   │   ├── release-requests/
│   │   ├── proposals/
│   │   ├── feedback/
│   │   └── admin/
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Shadcn/UI base components
│   ├── layout/             # Sidebar, Header, etc.
│   ├── profile/            # Profile-related components
│   ├── matching/           # Matching-related components
│   ├── requests/           # Request/Release components
│   └── shared/             # Shared/common components
├── lib/
│   ├── supabase/           # Supabase client setup
│   ├── services/           # API service functions
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # State management (Zustand/Context)
│   ├── matching/           # Matching engine logic
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── constants/          # App constants, enums
└── proxy.ts            # Next.js proxy (auth)
```

### TypeScript
- Strict mode enabled
- No `any` types — use proper interfaces/types
- All database types must mirror the schema exactly
- Use enums matching the PostgreSQL enums

---

## 5. SUPABASE PATTERNS

### Client Usage
- **Server Components**: Use `createServerClient` from `@supabase/ssr`
- **Client Components**: Use `createBrowserClient` from `@supabase/ssr`
- **Middleware**: Auth refresh via middleware
- **NEVER expose service_role key** to client-side code

### Data Access
- Use Supabase client for CRUD operations
- Use RPC functions for complex/sensitive operations (matching, releases)
- ALWAYS respect RLS — don't bypass with service_role unless absolutely necessary
- Transaction safety: Multi-step operations use database functions

---

## 6. API CACHING STRATEGY

### Tier 1: Session-Permanent Cache (load once, reuse always)
- Current user info + role + permissions
- Reference data: countries, provinces, cities, religions, sects, castes, mother_tongues, education_levels, occupations, rejection_reasons

### Tier 2: Page-Level Cache (load per page visit, reuse within page)
- Profile list (invalidate on create/update/delete)
- Dashboard KPIs (invalidate on relevant mutations)

### Tier 3: Component-Level Fresh Data (always fetch)
- Notifications (real-time via Supabase subscriptions)
- Match results (after running matching engine)
- Release status changes

### Cache Invalidation Rules
- Profile mutation → invalidate profile list + dashboard KPIs
- Match run → invalidate match results
- Release action → invalidate request list + release data
- User role change → full session reload
- Reference data change → invalidate reference cache (rare admin action)

---

## 7. SECURITY RULES

- **RLS is mandatory** — frontend hiding is NOT sufficient
- Agent cannot access unapproved candidate fields
- Agent cannot approve releases
- Manager cannot alter matching scores
- PDF generation ONLY from `information_release_fields` snapshot
- Audit logs are append-only from application roles

---

## 8. LANGUAGE SUPPORT

- All structured data uses bilingual reference tables (`name_en`, `name_ur`)
- UI labels support English + Urdu
- Free-text: preserve original, translate separately
- NEVER translate structured IDs through external API
