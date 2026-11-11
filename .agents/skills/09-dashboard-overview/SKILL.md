---
name: dashboard-overview
description: Role-based dashboard pages — KPI metrics, match ledger, alignment distribution, engagement activity, release desk, candidate cards. Follows DESIGN_SYSTEM.md exactly.
---

# Dashboard & Overview Pages

## Overview
Each role sees a dashboard tailored to their responsibilities. All dashboards follow the warm, premium NikahKaru design aesthetic.

## Role-Based Dashboard Content

### Agent Dashboard
- Total profiles assigned to me
- Active profiles count
- Pending requests count
- Active matches count
- Recent profile activity
- Upcoming tasks

### Manager Dashboard
- Total profiles in system
- Pending information requests (with URGENT badges)
- Active matches in progress
- Release desk (pending releases)
- Recent matching runs
- Agent workload overview

### High-Level Admin Dashboard
- System-wide KPIs (total profiles, active, draft, archived)
- Male/Female ratio
- Matching statistics
- Request analytics
- Agent/Manager performance
- Audit activity summary

## Design Components (from DESIGN_SYSTEM.md)

### KPI Metric Cards (Section 8.3)
Two types:

**TYPE A — AMBER (highlight metrics):**
```
bg-[#FDF0D8] rounded-[24px] p-5 border border-[#F6E1BA]/60 h-[138px]
Label: text-[12px] font-bold text-[#78643C] uppercase tracking-wider
Number: text-[28px] font-extrabold text-[#241E15]
Growth badge: bg-[#FEF3C7] border border-[#F6E1BA] text-[#166534]
```

**TYPE B — NEUTRAL (standard metrics):**
```
bg-[#F8F4EC] rounded-[24px] p-5 border border-[#E9E2D4] h-[138px]
Label: text-[12px] font-bold text-[#766E61] uppercase tracking-wider
Number: text-[28px] font-extrabold text-[#24211D]
```

### Primary Candidate Card — Golden (Section 8.8)
```
bg-[#F7F3EA] border border-[#ECC066]/60 rounded-[28px] p-6 min-h-[196px]
Green accent strip on right: bg-[#064e3b]
Top badge: bg-[#FEF3C7] text-[#725b24] uppercase
Title: text-xl font-extrabold text-[#002b17]
```

### Match Ledger Table (Section 8.6)
```
bg-white rounded-[28px] border border-[#ECE5D9] p-5
Filter pills: Active bg-[#16382E] text-white, Inactive bg-[#F4EFE7]
Table headers: text-[#888174] uppercase tracking-wider
Rows: hover:bg-[#FAF7F2] divide-y divide-[#F7F3EB]
```

### Alignment Distribution — Capsule Bar Chart (Section 8.7)
```
bg-white rounded-[26px] p-5 border border-[#ECE5D9]
GOLD bars: #F5C770 (Deen/Lineage)
CORAL bars: #F6A398 (Education/Career)
SLATE bars: #D4DDD8 (Location)
```

### Release Desk (Section 8.13)
```
bg-white rounded-[26px] p-5
Request items: p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5]
URGENT: bg-[#FEE2E2] text-[#991b1b]
Approve: bg-[#064e3b] text-white rounded-full
```

## Page Layout (Section 7)
```
Grid: max-w-7xl mx-auto
KPI Cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5
Main 2-col: grid-cols-1 xl:grid-cols-12 gap-7
  Left (content): col-span-8
  Right (sidebar): col-span-4
```

## Implementation

### Step 1: Dashboard Data Service
```typescript
// src/lib/services/dashboard-service.ts

// Agent KPIs
getAgentDashboardData(agentId: string): Promise<AgentDashboard>

// Manager KPIs
getManagerDashboardData(): Promise<ManagerDashboard>

// Admin KPIs
getAdminDashboardData(): Promise<AdminDashboard>
```

### Step 2: Overview Page
`src/app/(dashboard)/overview/page.tsx`:
- Check role from auth store (cached — NO API call)
- Render role-appropriate dashboard
- Load dashboard data (1 combined API call)

### Step 3: Reusable Dashboard Components
```
src/components/dashboard/
├── KPICard.tsx              # Amber and Neutral variants
├── MatchLedger.tsx          # Table with filters
├── AlignmentDistribution.tsx # Capsule bar chart
├── EngagementActivity.tsx   # Activity timeline
├── ReleaseDesk.tsx          # Pending releases widget
├── PrimaryCandidate.tsx     # Golden highlight card
└── DashboardGrid.tsx        # Layout wrapper
```

## API Call Strategy
- Dashboard KPIs: 1 combined query (or Supabase RPC function)
- Cache dashboard data for 30-60 seconds to avoid re-fetching on tab switches
- Invalidate on relevant mutations (new profile, new match, status change)
- Match ledger: Separate paginated query (loaded independently)
- Activity feed: Separate query, potentially real-time via Supabase subscription
