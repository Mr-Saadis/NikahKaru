---
name: notifications-audit
description: Notification system (in-app notifications with read/unread tracking) and audit logging (append-only action history for all important operations).
---

# Notifications & Audit System

## Notifications

### Types (from Schema)
```
INFO       — General information
REQUEST    — New request submitted/updated
MATCH      — Match status change
ASSIGNMENT — Profile/request assignment
SYSTEM     — System-level alerts
ALERT      — Urgent notifications
```

### When Notifications Are Created
| Event | Recipient | Type |
|-------|-----------|------|
| Agent submits information request | Manager(s) | REQUEST |
| Manager starts review | Requesting Agent | REQUEST |
| Manager approves/rejects request | Requesting Agent | REQUEST |
| Manager creates release | Target Agent | REQUEST |
| Profile assigned to Agent | Target Agent | ASSIGNMENT |
| Profile reassigned | New Agent | ASSIGNMENT |
| Request reassigned | New Agent | ASSIGNMENT |
| Match status changes | Relevant Agent(s) | MATCH |
| Match rejected | Relevant Agent(s) | MATCH |
| System alert | All relevant users | SYSTEM |

### Implementation
```typescript
// src/lib/services/notification-service.ts

// Create notification (called internally by other services)
createNotification(data: {
  userId: string;        // who receives it
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;   // e.g., 'information_request', 'match'
  entityId?: string;     // ID of related entity
}): Promise<void>

// User reads notifications
getMyNotifications(options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]>
getUnreadCount(): Promise<number>
markAsRead(notificationId: string): Promise<void>
markAllAsRead(): Promise<void>
```

### Real-Time Option
- Use Supabase Realtime subscriptions on `notifications` table
- Filter by `user_id = currentUser.id`
- Auto-update notification bell count

### UI Component
Notification bell in Header:
```
- Bell icon: w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC]
- Red dot: absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white
- Dropdown panel: bg-white rounded-[22px] border shadow-lg
- Each notification: clickable, navigates to relevant entity
```

---

## Audit Logs

### Actions (from Schema)
```
CREATE, UPDATE, DELETE, VIEW, ASSIGN, UNASSIGN,
APPROVE, REJECT, RELEASE, STATUS_CHANGE, MATCH_RUN
```

### What Gets Audited
| Action | Entity Type | Details |
|--------|-------------|---------|
| Profile created | profile | New profile data |
| Profile updated | profile | Old/new values |
| Profile status changed | profile | Old/new status |
| Profile assigned | profile_assignment | Agent details |
| Match engine run | match_run | Run parameters |
| Match created | match | Pair details |
| Match status changed | match | Old/new status, reason |
| Request created | information_request | Request details |
| Request reviewed | information_request | Manager action |
| Release created | information_release | Released fields |
| User created | user | User details |
| Role assigned | user_role | Role details |

### Implementation
```typescript
// src/lib/services/audit-service.ts

createAuditLog(data: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldData?: any;      // Previous state (for updates)
  newData?: any;       // New state
  metadata?: any;      // Additional context
}): Promise<void>

// Admin queries
getAuditLogs(filters: {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<AuditLog>>
```

### Security
- Audit logs are APPEND-ONLY from application roles
- Only HIGH_LEVEL_ADMIN can READ audit logs (enforced by RLS)
- Normal users cannot delete or modify audit entries
- Include `actor_user_id` automatically from auth context

### Audit Log Viewer (Admin Only)
Page: `src/app/(dashboard)/admin/audit/page.tsx`
- Filterable by: entity type, action, actor, date range
- Paginated table
- Expandable rows showing old_data/new_data JSON diffs

## API Call Optimization
- Notification count: Real-time subscription (no polling)
- Notification list: 1 paginated call, cached until new notification arrives
- Audit creation: Bundled within transactions (no separate API call)
- Audit query (admin): 1 paginated call with server-side filtering
