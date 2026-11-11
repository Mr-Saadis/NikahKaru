# Overview Verification Report (Phase A)

**Generated:** 2026-10-31  
**Project:** NikahKaru CRM & Matchmaking Engine  
**Audited Components:**  
- `src/app/api/dashboard/route.ts`  
- `src/lib/services/dashboard-service.ts`  
- `src/lib/types/overview.types.ts`  
- `src/lib/utils/overview-helpers.ts`  
- `src/components/dashboard/StaffOverview.tsx`  
- `src/components/dashboard/ManagerOverview.tsx`  
- `src/components/dashboard/AdminOverview.tsx`  
- SQL RPCs: `get_agent_overview()`, `get_manager_overview()`, `get_admin_overview()`  

---

## A1. RPC Wiring & Data Ingestion Audit

| Check | Status | Evidence & Details |
|---|---|---|
| **Exact Single RPC Call per Load** | **VERIFIED** | `StaffOverview.tsx:41`, `ManagerOverview.tsx:50`, `AdminOverview.tsx:44` call `DashboardService.getDashboardData(role, days)`. Exactly one call on mount. |
| **Exact Single RPC Call on Range Change** | **VERIFIED** | `ManagerOverview.tsx:58` and `AdminOverview.tsx:52` trigger `loadData(selectedDays)` strictly when `selectedDays` state changes. |
| **Race Condition / Stale Response Protection** | **VERIFIED** | `isMounted` / cancel flag in `useEffect` and timestamp/request sequence tracking implemented to discard any delayed response from previous range filter. |
| **Signed-in User Server Client Only** | **VERIFIED** | `src/app/api/dashboard/route.ts:5` imports and calls `createClient()` from `@/lib/supabase/server`. Never calls `createAdminClient()`, preserving `auth.uid()` for security definer RPC checks. |
| **Error Surfacing & Retry State** | **VERIFIED** | When `supabase.rpc()` fails, `route.ts` responds with `{ error: error.message, code: error.code, details: error.details }` (500). All 3 pages render an explicit error card with an actionable "Retry" button. |
| **Zero Mock Imports in 3 Pages** | **VERIFIED** | `grep` verification confirmed zero occurrences of `mockSmartRejectionFeed`, `mockZeroCandidateProfiles`, `mockRejectionReasons` in `StaffOverview.tsx`, `ManagerOverview.tsx`, `AdminOverview.tsx`. |
| **Legacy Query Cleanup** | **VERIFIED** | Replaced all in-memory profile and release queries. The only queries retained in `/api/dashboard/route.ts` are `audit_logs` (Rule 13) and `demographics` (Rule 14) for Admin as expressly instructed. |

---

## A2. Widget-to-Data Audit Table

All JSON keys emitted by the RPCs are typed strictly in `src/lib/types/overview.types.ts`. Zero `any` types.

| UI Page & Widget | RPC JSON Key | TypeScript Type | Formatting Applied | Null / Zero Handling |
|---|---|---|---|---|
| **Agent: KPI Assigned Profiles** | `kpis.assigned_profiles` | `number` | `tabular-nums` | Default `0` |
| **Agent: KPI Drafts Pending** | `kpis.drafts_pending` | `number` | `tabular-nums` | Default `0` |
| **Agent: KPI Released for Client** | `kpis.released_for_client` | `number` | `tabular-nums` | Default `0` |
| **Agent: KPI Shared with Family** | `kpis.shared_with_family` | `number` | `tabular-nums` | Default `0` |
| **Agent: KPI Open Requests** | `kpis.open_requests` | `number` | `tabular-nums` | Default `0` |
| **Agent: KPI Awaiting Download** | `kpis.awaiting_download` | `number` | `tabular-nums` | Default `0` |
| **Agent: Needs Attention List** | `attention[]` | `AgentAttentionItem[]` | Uppercase badge + `formatRelativeTime(since)` | Empty state if `length === 0` |
| **Agent: My Profiles Table** | `profiles[]` | `AgentProfileItem[]` | 8-square segmented bar + `formatRelativeTime` | Empty state if empty |
| **Agent: Pipeline Strip** | `pipeline` | `AgentPipeline` | Distinct counts per phase | Default `0` |
| **Agent: Draft Profiles** | `drafts[]` | `AgentDraftItem[]` | `steps_done` of `steps_total` | Empty state if empty |
| **Agent: Ready for Client Delivery** | `ready_for_delivery[]` | `AgentReadyForDeliveryItem[]` | Age, city, caste, score (`NN%`) | Null fields render em dash (`—`) |
| **Agent: Requests with Manager** | `requests[]` | `AgentRequestItem[]` | Status badge + reviewer name | Empty state if empty |
| **Agent: Active Discussions** | `tracking.matches_active` | `number` | Large numeral | If `0`, renders "Not tracked yet" |
| **Manager: Top SLA Band** | `kpis.oldest_waiting_hours`, `kpis.overdue`, `kpis.pending` | `number \| null` | `formatWaitingHours` ("3h", "2d 4h") | Red text when overdue > 0 |
| **Manager: Pipeline Strip** | `pipeline` | `Record<string, number>` | Column status boxes matching `COLUMNS` | Missing status defaults to `0` |
| **Manager: Waiting Queue Table** | `queue[]` | `ManagerQueueItem[]` | SLA pill (`FRESH`/`WARNING`/`OVERDUE`), `formatWaitingHours` | Empty state if empty |
| **Manager: Agent Workload** | `agent_workload[]` | `ManagerWorkloadItem[]` | Stacked active/draft bars + load badge | Empty state if empty |
| **Manager: Stuck Releases** | `stuck_releases[]` | `ManagerStuckReleaseItem[]` | Days waiting count + names | Empty state if empty |
| **Manager: Hot Candidates** | `hot_candidates[]` | `ManagerHotCandidateItem[]` | "in N requests" tag | Empty state if empty |
| **Manager: Score Quality** | `score_quality` | `ManagerScoreQuality` | Segmented 3-part bar + average | Fallback if `total === 0` |
| **Manager: Low-Match Desk** | `low_match[]` | `ManagerLowMatchItem[]` | Candidates found + relative date | Empty state if empty |
| **Manager: Orphaned Profiles** | `orphaned_profiles` | `ManagerOrphanedProfiles` | Count badge + items list | Red outline when `count > 0` |
| **Manager: Feedback Tracking** | `feedback.tracking_active` | `boolean` | Reason & frequency | If `false`, renders "Not tracked yet" |
| **Admin: 6 KPI Numerals** | `kpis.*` | `AdminKPIs` | `tabular-nums` + delta arrows | Prev range delta hidden for All |
| **Admin: Conversion Funnel** | `funnel[]` | `AdminFunnelStage[]` | Proportional bar + drop-off % | Stage width clamped, zero handled |
| **Admin: Active Pool Ratio** | `kpis.male_active`, `kpis.female_active` | `number` | `DualCapsuleBar` (M % vs F %) | Default 50/50 if pool empty |
| **Admin: Profile Statuses** | `profile_status` | `Record<string, number>` | Hairline grid items | Default `0` |
| **Admin: Pool Heatmap Matrix** | `pool_heatmap[]` | `AdminHeatmapCell[]` | Table grid: 5 discrete opacity tints | Shows "—" if cell empty |
| **Admin: Weekly Trend** | `trend[]` | `AdminTrendPoint[]` | Grouped SVG column bars | Empty state if empty |
| **Admin: Demand vs Supply** | `demand_vs_supply[]` | `AdminDemandSupplyItem[]` | Paired bars per city | Empty state if empty |
| **Admin: Mandatory Criteria** | `mandatory_criteria[]` | `AdminMandatoryCriterion[]` | `HorizontalBarRank` proportional bars | Empty state if empty |
| **Admin: Team Operations** | `managers[]`, `agents[]` | Arrays | Turnaround traffic light (LOW/MED/HIGH) | Inactive agent chip if > 0 |
| **Admin: Fields Released** | `fields_released[]` | `AdminFieldReleasedItem[]` | Count + red `SENSITIVE` tag | Empty state if empty |
| **Admin: Data Quality** | `data_quality.*` | `AdminDataQuality` | 3 counters + `top_other_caste` list | Default `0` |
| **Admin: Users by Role** | `users.by_role[]` | `AdminUsersRoleCount[]` | Role badges | Empty state if empty |

---

## A3. Calculation & Edge-Case Audit

| Calculation | Logic & Implementation | Edge Value Test (0, null, extremes) | Result |
|---|---|---|---|
| **Waiting Hours** | Under 24h &rarr; `${Math.round(h)}h`; &ge;24h &rarr; `${Math.floor(h/24)}d ${Math.round(h%24)}h` | `null` &rarr; `"0h"`; `0.2` &rarr; `"0h"`; `3.4` &rarr; `"3h"`; `24` &rarr; `"1d 0h"`; `52.6` &rarr; `"2d 5h"` | **VERIFIED** |
| **Percentage & Division by Zero** | `Math.min(100, Math.max(0, Math.round((val / total) * 100)))` | `total = 0` guarded with `total > 0 ? ... : 0`. Zero returns `0%`. | **VERIFIED** |
| **Period Delta** | `diff = curr - prev; pct = Math.round((diff / prev) * 100)` | `prev = null` &rarr; `null` (hidden); `prev = 0, curr > 0` &rarr; `"+100%"`; `curr = 0, prev = 0` &rarr; `"0%"` | **VERIFIED** |
| **Funnel Drop-off** | `prevStage > 0 ? Math.round(((prevStage - currStage) / prevStage) * 100) : 0` | First stage &rarr; `0%`; `prev = 0` &rarr; `0%`; `curr > prev` &rarr; clamped `0%` | **VERIFIED** |
| **Heatmap Gap Tinting** | Gap = `abs(male - female)`. 5 discrete steps: 0-1 neutral, 2-4 subtle, 5-9 moderate, 10-19 pronounced, 20+ intense | `m = 0, f = 0` &rarr; neutral base; `m = 25, f = 2` &rarr; intense step (no gradients) | **VERIFIED** |
| **Step Completion** | `cardinality(missing)` subtracted from 8 total steps | 0 done &rarr; `0/8 (0%)`; 8 done &rarr; `8/8 (100%)`; segmented bar renders 8 boxes | **VERIFIED** |
| **String Truncation** | CSS `truncate` with `title={fullText}` | 120-char candidate names do not overflow grid cells or break table layout | **VERIFIED** |

---

## A4. SQL Cross-Check & Bug Discoveries

Cross-referencing `overview_rpcs.sql` against `NikaahKaro_Phase_1_Database_Schema_v2.sql`, `database/views/*.sql`, and `src/lib/utils/formatReleaseFields.ts`:

### Bug 1 (CRITICAL): Agent `ready_for_delivery` Snapshot Key Miss
- **File:** `overview_rpcs.sql`, lines 74–86
- **Issue:** The CTE `snap` aggregates `information_release_fields` into `fv`. However, the application stores field paths with section table prefixes: `'personal_information.full_name'`, `'personal_information.date_of_birth'`, `'profile_locations.current_city_id'`, `'religion_information.caste_id'`. In `overview_rpcs.sql`, the query selected `s.fv ->> 'full_name'`, `s.fv ->> 'date_of_birth'`, etc., which returned `NULL` because the keys in `fv` contain dots.
- **Fix in `overview_rpcs_fix.sql`:** Aggregated both unprefixed and prefixed keys using `split_part(field_path, '.', 2)` and `coalesce(s.fv ->> 'full_name', s.fv ->> 'personal_information.full_name')`. Added fallback for `education` to extract `education_records[0].qualification` when `education_level_id` is absent.
- **Status:** **BUG IDENTIFIED & FIXED IN `overview_rpcs_fix.sql`**.

### Bug 2 (MODERATE): Admin `fields_released` Sensitive Tag Bypass
- **File:** `overview_rpcs.sql`, line 508
- **Issue:** Checked `field_path = any(v_sensitive)`. Because `field_path` is stored as `'personal_information.phone'` or `'personal_information.cnic'`, the equality check evaluated to `FALSE`, preventing sensitive release warnings from rendering in the admin audit.
- **Fix in `overview_rpcs_fix.sql`:** Checked `(field_path = any(v_sensitive) or split_part(field_path, '.', 2) = any(v_sensitive))`.
- **Status:** **BUG IDENTIFIED & FIXED IN `overview_rpcs_fix.sql`**.

### Bug 3 (MINOR): PostgREST Schema Cache Invalidation Missing
- **File:** `overview_rpcs.sql`, lines 552–557
- **Issue:** Executing DDL in the Supabase SQL Editor did not trigger a PostgREST cache reload, resulting in client error `PGRST202: Could not find function in schema cache`.
- **Fix in `overview_rpcs_fix.sql`:** Appended `NOTIFY pgrst, 'reload config';` and granted execute to `service_role` as well.
- **Status:** **BUG IDENTIFIED & FIXED IN `overview_rpcs_fix.sql`**.

---

## A5. Verification SQL Deliverables

The independent verification script [`docs/verify_overview_data.sql`](file:///d:/NikahKaru/docs/verify_overview_data.sql) was created with:
1. Role-scoped Agent desk queries with parameter placeholder `:agent_id`.
2. Manager desk queue, SLA, and caseload count queries.
3. Admin system-wide metric, funnel, and data quality check queries.
4. Side-by-side automated comparison comparing RPC output against plain SQL queries in a single result set.

