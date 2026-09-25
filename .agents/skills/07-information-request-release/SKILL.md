---
name: information-request-release
description: Information request workflow — Agent submits request for source profile, Manager reviews, runs official matching, selects candidates, selects individual fields, creates release snapshot. Includes request assignment/reassignment.
---

# Information Request & Release System

## Overview
The information request is the bridge between Agent and Manager. The Agent requests processing of their source profile. The Manager runs official matching, selects candidates, approves individual fields, and creates immutable release snapshots.

## CRITICAL WORKFLOW RULE
> The Agent does NOT request individual candidate profiles.
> The Agent requests processing of THEIR OWN SOURCE PROFILE.
> The Manager then runs matching and selects candidates.

## Complete Request → Release Flow

```
Agent A handles Male A (source profile)
    ↓
Agent clicks "Request Information" on Male A's profile
    ↓
System creates information_requests row:
  - requested_by = Agent A
  - source_profile_id = Male A
  - status = PENDING
    ↓
Manager receives notification
    ↓
Manager opens request → status = IN_REVIEW
    ↓
Manager runs OFFICIAL matching for Male A
    ↓
System persists: match_runs + match_run_results + match_score_breakdowns
    ↓
Manager reviews ranked results with score breakdowns
    ↓
Manager selects candidate(s) (e.g., Female B, Female D)
    ↓
For each selected candidate, Manager selects individual fields:
  ✓ Full Name
  ✓ Age
  ✓ Education
  ✓ Profession
  ✓ City
  ✓ Family Introduction
  ✗ Phone
  ✗ Income Details
  ✗ Exact Address
    ↓
System creates information_releases row per candidate
    ↓
System creates information_release_fields rows (immutable snapshots)
    ↓
Request status → COMPLETED
    ↓
Agent receives notification
    ↓
Agent sees ONLY approved fields from release snapshot
    ↓
Agent can generate PDF from approved fields ONLY
```

## Database Tables

### information_requests
```sql
id, requested_by, source_profile_id, status, reviewed_by, reviewed_at, manager_notes, created_at, updated_at
```
Statuses: `PENDING` → `IN_REVIEW` → `COMPLETED` / `CANCELLED`

### information_request_assignments
```sql
id, request_id, assigned_to, assigned_by, status, assigned_at, ended_at, notes
```
- Tracks who is currently handling the request
- `requested_by` (original requester) may differ from `assigned_to` (current handler)

### information_releases
```sql
id, request_id, match_run_result_id, candidate_profile_id, released_by, release_status, released_at, expires_at, notes
```
- Links to the specific match_run_result the candidate came from
- release_status: `ACTIVE`, `EXPIRED`, `REVOKED`

### information_release_fields
```sql
id, release_id, field_path, field_value, created_at
```
- **IMMUTABLE SNAPSHOT** — stores exact values at approval time
- If candidate later changes city from Lahore to Islamabad, the release still shows Lahore
- PDF is generated from THIS table, NOT from the live profile

## Implementation

### Step 1: Request Service
```typescript
// src/lib/services/request-service.ts

// Agent submits request
createRequest(sourceProfileId: string): Promise<InformationRequest>

// Manager views requests
getPendingRequests(): Promise<InformationRequest[]>
getRequestById(id: string): Promise<RequestDetail>  // includes source profile, requester info

// Manager actions
startReview(requestId: string): Promise<void>  // status → IN_REVIEW
completeRequest(requestId: string): Promise<void>  // status → COMPLETED
cancelRequest(requestId: string): Promise<void>  // status → CANCELLED

// Assignment
assignRequest(requestId: string, agentId: string): Promise<void>
reassignRequest(requestId: string, newAgentId: string, notes: string): Promise<void>
```

### Step 2: Release Service
```typescript
// src/lib/services/release-service.ts

// Manager creates release (after selecting candidate + fields)
createRelease(data: {
  requestId: string;
  matchRunResultId: string;
  candidateProfileId: string;
  selectedFields: FieldSelection[];  // [{field_path, field_value}]
}): Promise<InformationRelease>

// Agent views their releases
getReleasesForRequest(requestId: string): Promise<InformationRelease[]>
getReleaseDetail(releaseId: string): Promise<ReleaseWithFields>

// Manager can revoke/expire
revokeRelease(releaseId: string): Promise<void>
```

### Step 3: Field Selection UI (Manager)
Manager sees a checklist of all candidate fields:

```
┌─────────────────────────────────────────────────┐
│ Release Fields for: Female B                     │
│                                                  │
│ ☑ Full Name: Fatima Ahmed                       │
│ ☑ Age: 24                                       │
│ ☑ Education: BSc Computer Science               │
│ ☑ Profession: Software Engineer                 │
│ ☑ City: Lahore                                  │
│ ☑ Family Introduction: Well-educated family...  │
│ ☐ Phone: 0300-XXXXXXX                           │
│ ☐ Monthly Income: 150,000 PKR                   │
│ ☐ Exact Address: House 42, Street 7...          │
│ ☐ Disability Details: N/A                       │
│                                                  │
│ [Cancel]                      [Approve Release]  │
└─────────────────────────────────────────────────┘
```

### Step 4: Snapshot Creation
When Manager approves:
```typescript
async function createReleaseSnapshot(candidateProfileId, selectedFieldPaths) {
  // For each selected field:
  // 1. Read CURRENT value from candidate profile tables
  // 2. Store as { field_path: "personal_information.full_name", field_value: "Fatima Ahmed" }
  // 3. This snapshot is IMMUTABLE
  
  // All in a transaction:
  // - Create information_releases row
  // - Create information_release_fields rows
  // - Create audit_log entry
  // - Create notification for Agent
}
```

### Step 5: Agent Release View
Agent sees a card with ONLY the approved fields:
```
┌─────────────────────────────────┐
│ Candidate Information           │
│ Release #REL-0042               │
│                                 │
│ Name: Fatima Ahmed              │
│ Age: 24                         │
│ Education: BSc Computer Science │
│ Profession: Software Engineer   │
│ City: Lahore                    │
│ Family: Well-educated family... │
│                                 │
│ [Download PDF]                  │
└─────────────────────────────────┘
```

No other fields are accessible.

### Step 6: PDF Generation (from PRD Section 50)
```
Source: information_release_fields ONLY
NOT from complete profile tables
Format: Bilingual (English + Urdu field names)
Contains: Only Manager-approved fields
Security: Never generate full profile PDF and hide fields visually
```

## Manager Request Queue UI
Design follows DESIGN_SYSTEM.md Section 8.13 (ReleaseDesk):
```
- Icon box: w-8 h-8 rounded-xl bg-[#064e3b] text-white
- Request items: p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]
- URGENT badge: bg-[#FEE2E2] text-[#991b1b]
- Approve button: bg-[#064e3b] text-white rounded-full
- Reassign button: bg-white border border-[#E2DBD0] rounded-full
```

## API Call Optimization
- Request list for Manager: 1 paginated call
- Request detail: 1 call with JOINs (requester info, source profile summary)
- Match results for a request: Loaded from persisted match_run_results (no re-computation)
- Release creation: 1 transaction (release + fields + audit + notification)
- Agent release view: 1 call for release_fields (cached per release)
