---
name: implementation-workflow
description: Complete Phase 1 implementation order — 6 stages from foundation to deployment. Detailed task breakdown with dependencies, expected files, and acceptance criteria per stage.
---

# NikaahKaro Phase 1 — Complete Implementation Workflow

## Stage Overview

```
Stage 1: Foundation        → Auth, Types, Providers, Layout
Stage 2: Profile Module    → CRUD, Multi-step Form, Listing, Detail
Stage 3: Matching Engine   → Hard filters, Soft scoring, Two-way, Preview
Stage 4: Operations        → Requests, Releases, Match Lifecycle, Feedback
Stage 5: Dashboards        → Agent, Manager, Admin views
Stage 6: Polish & Security → RLS, Testing, PDF, Optimization
```

---

## Stage 1: Foundation (Week 1)

### Task 1.1: TypeScript Types & Enums
- **Skill**: `13-database-types-enums`
- **Create**: `src/lib/types/database.types.ts`
- **All** database enums and table interfaces
- **Acceptance**: Every PostgreSQL table has a corresponding TypeScript interface

### Task 1.2: Supabase Client Setup
- **Files**: Already created in `src/lib/supabase/`
- **Verify**: server.ts, client.ts, middleware.ts work correctly
- **Create**: `src/middleware.ts` (Next.js middleware for auth)

### Task 1.3: Auth Store & Provider
- **Skill**: `01-authentication-setup`
- **Create**:
  - `src/lib/stores/auth-store.ts` — Zustand store for user/role/permissions
  - `src/components/providers/AuthProvider.tsx` — Session initialization
  - `src/lib/hooks/useAuth.ts` — Hook to access cached auth data
- **API calls**: 1 at login (user + role + permissions), then ZERO
- **Acceptance**: User role available everywhere via `useAuth()` without API calls

### Task 1.4: Reference Data Provider
- **Skill**: `02-reference-data-provider`
- **Create**:
  - `src/lib/stores/reference-data-store.ts` — All 10 reference tables
  - `src/components/providers/ReferenceDataProvider.tsx` — Load on app init
  - `src/lib/hooks/useReferenceData.ts` — Access cached data
- **API calls**: 10 parallel calls at app init, then ZERO
- **Acceptance**: All dropdowns populated from cache

### Task 1.5: Login Page
- **Skill**: `01-authentication-setup`
- **Create**: `src/app/(auth)/login/page.tsx`
- **Design**: Follow DESIGN_SYSTEM.md Section 8.15 EXACTLY
- **Acceptance**: Login works, redirects based on role

### Task 1.6: Layout & Navigation
- **Skill**: `03-layout-and-navigation`
- **Create**:
  - `src/app/(dashboard)/layout.tsx` — Dashboard layout with providers
  - `src/components/layout/Sidebar.tsx` — Per DESIGN_SYSTEM.md Section 8.1
  - `src/components/layout/Header.tsx` — Per Section 8.2 + 9
- **Acceptance**: Sidebar shows role-based nav, header with title/actions

### Task 1.7: Root Layout & Global Styles
- **Update**: `src/app/layout.tsx` — Plus Jakarta Sans font
- **Update**: `src/app/globals.css` — Custom scrollbar, base styles
- **Acceptance**: Font loaded, scrollbar styled, warm neutral background

---

## Stage 2: Profile Module (Week 2-3)

### Task 2.1: Profile Service
- **Skill**: `04-profile-management`
- **Create**: `src/lib/services/profile-service.ts`
- **All** CRUD operations for profiles and sub-tables
- **Acceptance**: Can create, read, update profile via service

### Task 2.2: Multi-Step Profile Form
- **Skill**: `04-profile-management`
- **Create**:
  - `src/app/(dashboard)/add-profile/page.tsx` — Container page
  - `src/components/profile/AddProfileForm.tsx` — Main form wrapper
  - `src/components/profile/steps/Step1BasicInfo.tsx`
  - `src/components/profile/steps/Step2MaritalPhysical.tsx`
  - `src/components/profile/steps/Step3EducationProfession.tsx`
  - `src/components/profile/steps/Step4ReligionCulture.tsx`
  - `src/components/profile/steps/Step5LocationResidency.tsx`
  - `src/components/profile/steps/Step6FamilyDetails.tsx`
  - `src/components/profile/steps/Step7Lifestyle.tsx`
  - `src/components/profile/steps/Step8Preferences.tsx`
  - `src/components/profile/steps/Step9Review.tsx`
  - `src/components/profile/HorizontalStepper.tsx` — Per Section 8.9
  - `src/components/profile/ProfileSidebar.tsx` — Per Section 8.10
- **Design**: Form card `bg-white rounded-[32px]`, 12-col grid
- **Acceptance**: Can create complete profile with all sections

### Task 2.3: Preference Form (Step 8)
- **Skill**: `05-preference-management`
- **Create**: `src/lib/services/preference-service.ts`
- **Within**: Step8Preferences.tsx component
- **All 9 preference sub-tables** with importance selectors
- **Acceptance**: Preferences saved with versions

### Task 2.4: Profile List Page
- **Skill**: `04-profile-management`
- **Create**: `src/app/(dashboard)/profiles/page.tsx`
- **Features**: Search, filter tabs, sortable table, pagination
- **Design**: Per Section 8.6 (MatchLedger table pattern)
- **Acceptance**: Paginated profile list with filters

### Task 2.5: Profile Detail/Dossier Page
- **Create**: `src/app/(dashboard)/profiles/[id]/page.tsx`
- **Features**: Full profile view, all sections, status management
- **Acceptance**: Complete profile visible with all related data

### Task 2.6: Profile Validation
- **Within**: AddProfileForm and profile-service
- **Rules**: Required fields, conditional fields, ranges, reference IDs
- **Acceptance**: Invalid data blocked, clear error messages

---

## Stage 3: Matching Engine (Week 3-4)

### Task 3.1: Matching Engine Core
- **Skill**: `06-matching-engine`
- **Create**:
  - `src/lib/matching/matching-engine.ts` — Core algorithm
  - `src/lib/matching/hard-filters.ts` — Mandatory criteria filters
  - `src/lib/matching/soft-scoring.ts` — Weighted scoring
  - `src/lib/matching/range-matching.ts` — Age, height, weight, income ranges
  - `src/lib/matching/two-way-scoring.ts` — Bidirectional compatibility
- **Acceptance**: Engine produces correct ranked results

### Task 3.2: Agent Preview API
- **Create**: `src/app/api/matching/preview/route.ts`
- **Non-persistent**: Returns temporary results, saves nothing
- **Acceptance**: Agent gets ranked candidates without DB side effects

### Task 3.3: Manager Official Run API
- **Create**: `src/app/api/matching/run/route.ts`
- **Persistent**: Creates match_runs + match_run_results + match_score_breakdowns
- **Transaction**: All or nothing
- **Acceptance**: Official run fully persisted and auditable

### Task 3.4: Matching Preview UI (Agent)
- **Create**: `src/app/(dashboard)/matching/page.tsx`
- **Features**: Select source profile, run preview, see candidates with scores
- **Non-sensitive fields only** for candidate display
- **Acceptance**: Agent can preview matches for any active profile

### Task 3.5: Score Breakdown Display
- **Create**: `src/components/matching/ScoreBreakdown.tsx`
- **Features**: Criterion-level detail with explanations
- **Design**: Capsule bar chart per Section 8.7
- **Acceptance**: Score explanation is clear and accurate

---

## Stage 4: Operations (Week 4-5)

### Task 4.1: Information Request System
- **Skill**: `07-information-request-release`
- **Create**:
  - `src/lib/services/request-service.ts`
  - `src/app/(dashboard)/release-requests/page.tsx` — Manager request queue
  - `src/components/requests/RequestDetail.tsx`
  - `src/components/requests/RequestList.tsx`
- **Acceptance**: Agent can submit request, Manager can review

### Task 4.2: Manager Matching & Selection
- **Within**: Request detail page
- **Features**: Manager runs official match, selects candidates
- **Acceptance**: Manager can run matching and select candidates from results

### Task 4.3: Field-Level Release System
- **Skill**: `07-information-request-release`
- **Create**:
  - `src/lib/services/release-service.ts`
  - `src/components/requests/FieldSelector.tsx` — Manager field checklist
  - `src/components/requests/ReleaseView.tsx` — Agent view of approved fields
- **Acceptance**: Manager selects fields, Agent sees only approved snapshot

### Task 4.4: Match Lifecycle Management
- **Skill**: `08-match-lifecycle-feedback`
- **Create**:
  - `src/lib/services/match-service.ts`
  - `src/app/(dashboard)/proposals/page.tsx` — Match list
  - `src/components/matches/MatchDetail.tsx`
  - `src/components/matches/RejectionForm.tsx`
- **Design**: Per Section 8.14 (ClientsDetailView)
- **Acceptance**: Full lifecycle: IN_PROGRESS → REJECTED/ACCEPTED/CLOSED

### Task 4.5: Notification System
- **Skill**: `10-notifications-audit`
- **Create**:
  - `src/lib/services/notification-service.ts`
  - `src/components/layout/NotificationBell.tsx`
  - `src/components/layout/NotificationPanel.tsx`
- **Acceptance**: Notifications created on events, bell shows count

### Task 4.6: Audit Logging
- **Skill**: `10-notifications-audit`
- **Create**: `src/lib/services/audit-service.ts`
- **Integrate**: Into all mutation services
- **Acceptance**: All important actions logged

---

## Stage 5: Dashboards (Week 5-6)

### Task 5.1: Dashboard Components
- **Skill**: `09-dashboard-overview`
- **Create**:
  - `src/components/dashboard/KPICard.tsx`
  - `src/components/dashboard/MatchLedger.tsx`
  - `src/components/dashboard/AlignmentDistribution.tsx`
  - `src/components/dashboard/EngagementActivity.tsx`
  - `src/components/dashboard/ReleaseDesk.tsx`
  - `src/components/dashboard/PrimaryCandidate.tsx`
- **Design**: ALL per DESIGN_SYSTEM.md exactly
- **Acceptance**: Components match design specs pixel-perfectly

### Task 5.2: Dashboard Data Service
- **Create**: `src/lib/services/dashboard-service.ts`
- **1 combined query** per role
- **Cache**: 60-second stale time
- **Acceptance**: Dashboard loads fast with correct data

### Task 5.3: Overview Page Assembly
- **Create/Update**: `src/app/(dashboard)/overview/page.tsx`
- **Role-based**: Show different content per role
- **Acceptance**: Each role sees relevant KPIs and widgets

### Task 5.4: Admin Pages
- **Skill**: `11-admin-user-management`
- **Create**:
  - `src/app/(dashboard)/admin/users/page.tsx`
  - `src/app/(dashboard)/admin/analytics/page.tsx`
- **Acceptance**: Admin can manage users and view system analytics

---

## Stage 6: Polish & Security (Week 6-7)

### Task 6.1: PDF Generation
- **Create**: `src/lib/services/pdf-service.ts`
- **Source**: ONLY from `information_release_fields`
- **Format**: Bilingual (English + Urdu)
- **Acceptance**: PDF contains only approved fields

### Task 6.2: RLS Verification
- **Verify**: All RLS policies in schema work correctly
- **Test**: Agent cannot access unapproved data
- **Test**: Manager cannot alter scores
- **Acceptance**: All role boundaries enforced at DB level

### Task 6.3: Search & Pagination
- **All list pages**: Server-side pagination
- **Profile search**: By name, gender, status, city, age
- **Acceptance**: All lists paginated, search works

### Task 6.4: Responsive Design
- **Verify**: All pages work on mobile/tablet/desktop
- **Sidebar**: Collapses on mobile
- **Forms**: Stack on small screens
- **Acceptance**: Usable on all screen sizes

### Task 6.5: Edge Cases
- **From PRD Section 39**:
  - No candidates → show empty state
  - Fewer than 5 → show available count
  - Rejected pair → excluded from future
  - Profile paused → excluded from matching
  - Existing pair → update, don't duplicate
- **Acceptance**: All edge cases handled gracefully

### Task 6.6: Performance Optimization
- **API calls audit**: Verify no duplicate calls exist
- **Bundle size**: Optimize imports
- **Loading states**: Skeleton screens per design system
- **Acceptance**: Fast page loads, smooth interactions
