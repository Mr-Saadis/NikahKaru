---
name: admin-user-management
description: High-Level Admin features — user CRUD, role assignment, user status management, system analytics, and reference data administration.
---

# Admin & User Management

## Overview
The High-Level Admin has system-wide visibility. They manage users, assign roles, monitor system activity, and maintain reference data.

## User Management

### Database Tables
- `auth.users` — Supabase-managed (email, password)
- `public.users` — Application profile (full_name, email, phone, status)
- `public.user_roles` — User ↔ Role mapping
- `public.roles` — Role definitions

### User Statuses
```
ACTIVE    — Can login and work
INACTIVE  — Cannot login, account disabled
SUSPENDED — Temporarily blocked
```

### Admin Operations
```typescript
// src/lib/services/admin-service.ts

// User CRUD
createUser(data: { email, fullName, phone, roleId }): Promise<User>
// 1. Create auth.users via Supabase Admin API (server-side only)
// 2. Trigger auto-creates public.users row
// 3. Assign role via user_roles

updateUser(userId: string, data: Partial<User>): Promise<void>
updateUserStatus(userId: string, status: UserStatus): Promise<void>
assignRole(userId: string, roleId: string): Promise<void>
removeRole(userId: string, roleId: string): Promise<void>

// Queries
getAllUsers(filters?: UserFilters): Promise<User[]>
getUserWithRoles(userId: string): Promise<UserWithRoles>
getAgentsList(): Promise<User[]>  // For assignment dropdowns
getManagersList(): Promise<User[]>
```

### User Management UI
Page: `src/app/(dashboard)/admin/users/page.tsx`
- User table: Name, Email, Phone, Role, Status, Actions
- Create User modal/form
- Edit User modal
- Role assignment dropdown
- Status toggle (Active/Inactive/Suspended)
- Search and filter

### Design Specs
Follow general table pattern from DESIGN_SYSTEM.md Section 8.6:
- White card container with rounded corners
- Standard table styling
- Status badges: GREEN (Active), RED (Suspended), NEUTRAL (Inactive)

## System Analytics (Admin Dashboard)

### Profile Analytics
```sql
-- Total profiles by status
SELECT status, COUNT(*) FROM profiles GROUP BY status;

-- Gender distribution
SELECT gender, COUNT(*) FROM profiles WHERE status = 'ACTIVE' GROUP BY gender;

-- Agent workload
SELECT current_agent_id, COUNT(*) FROM profiles WHERE status = 'ACTIVE' GROUP BY current_agent_id;

-- Profiles created over time
SELECT DATE_TRUNC('month', created_at), COUNT(*) FROM profiles GROUP BY 1;
```

### Matching Analytics
```sql
-- Match runs count
SELECT COUNT(*) FROM match_runs;

-- Average match scores
SELECT AVG(final_score) FROM match_run_results;

-- Match outcomes
SELECT status, COUNT(*) FROM matches GROUP BY status;

-- Rejection patterns
SELECT rr.name_en, COUNT(*) FROM match_feedback mf
JOIN rejection_reasons rr ON rr.id = mf.rejection_reason_id
GROUP BY rr.name_en ORDER BY COUNT(*) DESC;
```

### Request Analytics
```sql
-- Requests by status
SELECT status, COUNT(*) FROM information_requests GROUP BY status;

-- Average processing time
SELECT AVG(reviewed_at - created_at) FROM information_requests WHERE status = 'COMPLETED';

-- Manager workload
SELECT reviewed_by, COUNT(*) FROM information_requests WHERE reviewed_by IS NOT NULL GROUP BY reviewed_by;
```

## Reference Data Administration
Admin can manage lookup tables:
- Add new countries, provinces, cities
- Add new religions, sects, castes
- Add new education levels, occupations
- Add new rejection reasons
- Deactivate (NOT delete) obsolete entries

```typescript
// Reference data CRUD (admin only)
addReferenceItem(table: string, data: ReferenceItem): Promise<void>
updateReferenceItem(table: string, id: number, data: Partial<ReferenceItem>): Promise<void>
deactivateReferenceItem(table: string, id: number): Promise<void>
// After any change → trigger reference data cache refresh for all users
```

## API Call Optimization
- User list: 1 paginated call (admin page)
- Analytics queries: 1 combined RPC call returning all KPIs
- Cache analytics for 5 minutes (admin dashboard data is not time-critical)
- Reference data CRUD: 1 call per operation, then broadcast cache invalidation
