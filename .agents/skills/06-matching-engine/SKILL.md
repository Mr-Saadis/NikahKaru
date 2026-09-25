---
name: matching-engine
description: Deterministic rule-based matching engine — hard filters, soft scoring, range matching, two-way compatibility, ranked results. Agent preview (non-persistent) vs Manager official run (persistent).
---

# Matching Engine

## Overview
The matching engine is the core intelligence of NikaahKaro. It's DETERMINISTIC and EXPLAINABLE — no ML in Phase 1. It runs identically for Agent preview and Manager official runs, but differs in persistence.

## Two Modes

### Agent Preview (Non-Persistent)
```
Agent clicks "Find Matches"
    ↓
Engine calculates temporary results
    ↓
Display ranked candidates on screen
    ↓
NO database records created
    ↓
Results disappear when Agent navigates away
```
**Does NOT create**: match_runs, match_run_results, match_score_breakdowns, matches

### Manager Official Run (Persistent)
```
Manager runs matching for a source profile
    ↓
Engine calculates results
    ↓
SAVES to match_runs
    ↓
SAVES to match_run_results (each candidate)
    ↓
SAVES to match_score_breakdowns (each criterion per candidate)
    ↓
Results are permanent and auditable
```

## Matching Pipeline (14 Steps — from PRD Section 35, Step 7)

```
1.  Load source profile
2.  Load current preference set (is_current = true)
3.  Select opposite-gender ACTIVE profiles
4.  Exclude inactive/ineligible profiles (status != ACTIVE)
5.  Exclude self-pairs (source_profile_id)
6.  Exclude pair-level rejected relationships (matches where status = REJECTED for this pair)
7.  Exclude profiles with active IN_PROGRESS relationship
8.  Apply HARD FILTERS (MANDATORY preferences)
9.  Calculate SOFT criterion scores
10. Calculate Source → Candidate compatibility (A→B)
11. Calculate Candidate → Source compatibility (B→A)
12. Combine two-way scores into final score
13. Rank candidates by final_score DESC
14. Return Top N (default: 5 for Agent preview, configurable for Manager)
```

## Hard Filter Logic (Layer 1)
MANDATORY preferences are evaluated FIRST. If candidate fails ANY mandatory criterion → **EXCLUDED**.

### Hard Filter Criteria
```typescript
// These can be MANDATORY:
- Gender (always mandatory — opposite gender only)
- Age range (if age_importance = MANDATORY)
- Marital status (if marital_status_importance = MANDATORY)
- Religion (if religion_importance = MANDATORY)
- Location/City (if city_importance = MANDATORY)
- Disability acceptance (if disability_importance = MANDATORY)
- Relocation (if relocation_importance = MANDATORY)
```

### Hard Filter SQL Pattern
```sql
-- Start with opposite gender ACTIVE profiles
WHERE p.gender = opposite_gender
  AND p.status = 'ACTIVE'
  AND p.id != source_profile_id
  -- Exclude rejected pairs
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE m.status = 'REJECTED'
    AND ((m.male_profile_id = source_id AND m.female_profile_id = p.id)
      OR (m.female_profile_id = source_id AND m.male_profile_id = p.id))
  )
  -- Exclude profiles with active IN_PROGRESS
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE m.status = 'IN_PROGRESS'
    AND (m.male_profile_id = p.id OR m.female_profile_id = p.id)
  )
  -- MANDATORY filters applied dynamically based on preferences
```

## Soft Scoring (Layer 2)
Non-mandatory preferences contribute to a score. They do NOT eliminate candidates.

### Scoring Pattern Per Criterion
```typescript
function scoreCriterion(
  candidateValue: any,
  preferredValue: any,
  importance: PreferenceImportance,
  matchMode: 'EXACT' | 'RANGE' | 'MINIMUM' | 'MAXIMUM' | 'INCLUDES'
): CriterionScore {
  // Calculate raw_score (0-100)
  // Apply weight based on importance
  // Return { raw_score, weight, weighted_score }
}
```

### Importance Weights (configurable)
```
MANDATORY: N/A (hard filter, not scored)
HIGH:      weight = 3.0
MEDIUM:    weight = 2.0
LOW:       weight = 1.0
```

### Range Matching (age, height, weight, income)
```
Inside preferred range  → 100% score
Near range (within tolerance) → partial score (e.g., 60-80%)
Far outside range → 0% score
```

### "Doesn't Matter" Handling
If importance is null / "Doesn't Matter":
- Skip this criterion entirely
- Do NOT include in score numerator or denominator
- Prevents unfair inflation/deflation

## Two-Way Compatibility (from PRD Section 20)

```
Direction 1: Source preferences → Candidate profile
Direction 2: Candidate preferences → Source profile

source_to_candidate_score = weighted average of all scored criteria (Source prefs vs Candidate data)
candidate_to_source_score = weighted average of all scored criteria (Candidate prefs vs Source data)

final_score = combination formula (e.g., average, weighted average, or geometric mean)
```

### Score Breakdown Structure (stored in match_score_breakdowns)
```typescript
interface ScoreBreakdown {
  direction: 'MALE' | 'FEMALE';  // which direction this breakdown represents
  criterion_code: string;         // e.g., 'AGE', 'EDUCATION', 'RELIGION', 'CITY'
  candidate_value: any;           // what the candidate has
  preferred_value: any;           // what was preferred
  importance: PreferenceImportance;
  match_mode: string;
  raw_score: number;              // 0-100
  weight: number;
  weighted_score: number;
  passed_hard_filter: boolean;
  explanation: string;            // human-readable explanation
}
```

## Implementation

### Step 1: Matching Service
Create `src/lib/matching/matching-engine.ts`:

```typescript
// Core matching function — used by BOTH Agent preview and Manager official run
async function runMatching(
  sourceProfileId: string,
  options: { 
    limit: number;      // 5 for preview, configurable for Manager
    persist: boolean;    // false for Agent, true for Manager
    executedBy: string;  // user ID of who ran it
  }
): Promise<MatchResult[]>
```

### Step 2: Server-Side Only
- Matching logic runs on SERVER (API route or Supabase RPC function)
- NEVER put matching logic in React/frontend code
- Pattern: `Frontend → API Route → Matching Service → PostgreSQL`

### Step 3: Agent Preview API
```
POST /api/matching/preview
Body: { sourceProfileId: string }
Response: { candidates: MatchResult[], totalConsidered: number }
```
- Does NOT persist anything
- Returns temporary results

### Step 4: Manager Official Run API
```
POST /api/matching/run
Body: { sourceProfileId: string, requestId?: string, candidateLimit?: number }
Response: { matchRunId: string, candidates: MatchResult[] }
```
- Creates match_runs row
- Creates match_run_results for each candidate
- Creates match_score_breakdowns for each criterion
- All in a database transaction

## Performance Optimization (from PRD Section 54)
```
Gender filter (eliminates ~50%)
    ↓
Status filter (eliminates inactive)
    ↓
Pair exclusions (rejected/in-progress)
    ↓
Hard filters (eliminates MANDATORY mismatches)
    ↓
Soft scoring (only on remaining candidates)
    ↓
Ranking + Top N
```
Eliminate candidates as EARLY as possible. Don't score obviously invalid candidates.

## Score Display Rule (from PRD Section 60)
- "92%" means "92% compatibility according to configured criteria"
- It does NOT mean "92% chance of marriage"
- This distinction MUST be reflected in UI text
