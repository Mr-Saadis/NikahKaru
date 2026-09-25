---
name: match-lifecycle-feedback
description: Match relationship lifecycle management — IN_PROGRESS, REJECTED, ACCEPTED, CLOSED, REOPENED statuses. Match status history, structured rejection feedback, pair-level exclusion rules.
---

# Match Lifecycle & Feedback System

## Overview
`matches` represents an ACTUAL male-female relationship lifecycle. It is NOT a search result. A match row is created when families begin actual communication/proposal consideration.

## CRITICAL DISTINCTION
```
match_run_results  = "This candidate was returned by an official search"
matches            = "These two people are in an actual relationship lifecycle"
```

These are DIFFERENT entities. Never confuse them.

## Match Relationship Statuses

```
IN_PROGRESS → REJECTED / ACCEPTED / CLOSED
CLOSED → REOPENED → IN_PROGRESS (cycle)
```

| Status | Meaning |
|--------|---------|
| `IN_PROGRESS` | Actual communication/proposal consideration has started |
| `REJECTED` | Pair explicitly rejected (pair-level, not person-level) |
| `ACCEPTED` | Pair reached organization's defined accepted state |
| `CLOSED` | Relationship lifecycle closed for operational reasons |
| `REOPENED` | Previously closed/rejected pair explicitly reopened |

## Business Rules

### One Active IN_PROGRESS per Profile
- Phase 1: Only 1 active `IN_PROGRESS` relationship per profile
- Enforced by unique indexes `uq_one_active_male_relationship` and `uq_one_active_female_relationship`
- Top-5 recommendations can still exist; restriction is on progressing multiple simultaneously

### Pair Uniqueness
- `unique(male_profile_id, female_profile_id)` prevents duplicate pairs
- Male A ↔ Female B is ONE row (not two rows with swapped IDs)
- Gender validation trigger ensures male_profile_id references a MALE profile

### Pair-Level Rejection
- Rejecting A↔B does NOT reject A or B globally
- A can still match with C, D, E...
- B can still match with F, G, H...
- A↔B pair is excluded from future automatic suggestions (unless REOPENED)

## Database Tables

### matches
```sql
id, male_profile_id, female_profile_id, source_match_run_result_id,
status, final_score, created_by, first_contacted_at, in_progress_at,
closed_at, created_at, updated_at
```

### match_status_history (auto-populated via trigger)
```sql
id, match_id, old_status, new_status, changed_by, reason, created_at
```
- Trigger `trg_record_match_status_change` auto-records every status transition
- Append-only history

### match_feedback
```sql
id, match_id, provided_by, feedback_type (POSITIVE/NEGATIVE/NEUTRAL),
rejection_reason_id, importance (LOW/MEDIUM/HIGH), notes, created_at
```
- Structured feedback using `rejection_reasons` reference table
- Machine-readable reason codes for future analytics/ML

## Implementation

### Step 1: Match Service
```typescript
// src/lib/services/match-service.ts

// Create actual relationship (when families start communication)
createMatch(data: {
  maleProfileId: string;
  femaleProfileId: string;
  sourceMatchRunResultId?: string;
  createdBy: string;
}): Promise<Match>

// Status transitions
updateMatchStatus(matchId: string, newStatus: MatchRelationshipStatus, reason?: string): Promise<void>
rejectMatch(matchId: string, rejectionReasonId: number, notes?: string): Promise<void>
acceptMatch(matchId: string): Promise<void>
closeMatch(matchId: string, reason: string): Promise<void>
reopenMatch(matchId: string, reason: string): Promise<void>

// Feedback
addFeedback(data: MatchFeedback): Promise<void>

// Queries
getActiveMatchesForProfile(profileId: string): Promise<Match[]>
getMatchHistory(profileId: string): Promise<Match[]>
getMatchStatusHistory(matchId: string): Promise<MatchStatusHistoryEntry[]>
getMatchFeedback(matchId: string): Promise<MatchFeedbackEntry[]>
```

### Step 2: Match Detail UI
Design follows DESIGN_SYSTEM.md Section 8.14 (ClientsDetailView):
```
- h2 with match pair names
- REL- ID badge: font-mono bg-white border
- Status badge (GREEN/AMBER/RED)
- Summary cards for Groom (green dot) and Bride (amber dot)
- Action toolbar: Approve, Reject, Close buttons
- Audit table: match_status_history entries
```

### Step 3: Rejection Form
When rejecting a match:
```
┌─────────────────────────────────────┐
│ Reject Match: Male A ↔ Female B     │
│                                     │
│ Reason: [Select rejection reason ▼] │
│   (from rejection_reasons table)    │
│                                     │
│ Importance: ○ LOW ● MEDIUM ○ HIGH   │
│                                     │
│ Notes: [Free text area]             │
│                                     │
│ [Cancel]              [Confirm]     │
└─────────────────────────────────────┘
```

### Step 4: Match List / Proposals Page
Page: `src/app/(dashboard)/proposals/page.tsx`
- Filter tabs: All, In Progress, Accepted, Rejected, Closed
- Table with: Match ID, Groom, Bride, Score, Status, Last Updated, Actions
- Quick status indicator dots

## Matching Engine Integration
The matching engine must:
1. Exclude REJECTED pairs from future results
2. Exclude profiles with active IN_PROGRESS matches from new matches
3. Reference existing matches via `source_match_run_result_id`

## API Call Optimization
- Match list: 1 paginated call with filters
- Match detail: 1 call with JOINs (profiles + status history)
- Status update: 1 mutation call (trigger auto-records history)
- Feedback submission: 1 call
- Rejection reasons dropdown: FROM CACHE — 0 API calls
