---
name: authentication-setup
description: Supabase Auth setup including login, signup, logout, password reset, session management, middleware auth guard, and role-based route protection.
---

# Authentication & Session Setup

## Overview
Set up complete Supabase authentication flow with role-based access control for NikahKaru CRM.

## Prerequisites
- Supabase project configured with Auth enabled
- Environment variables set in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  ```

## Supabase Client Files (Already Created)

### Server Client (`src/lib/supabase/server.ts`)
- Uses `createServerClient` from `@supabase/ssr`
- Reads cookies from Next.js `cookies()` API
- Used in Server Components and API routes

### Browser Client (`src/lib/supabase/client.ts`)
- Uses `createBrowserClient` from `@supabase/ssr`
- Used in Client Components

### Middleware (`src/lib/supabase/middleware.ts`)
- Refreshes auth tokens on every request
- Redirects unauthenticated users to login

## Implementation Steps

### Step 1: Auth Provider Context
Create `src/lib/stores/auth-store.ts`:

```typescript
// Store user session data ONCE after login
// Includes: user object, role, permissions
// This data is CACHED for the entire session
// NEVER re-fetch role/permissions on every page mount

interface AuthState {
  user: User | null;
  role: UserRole | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

**CRITICAL**: User role and permissions are fetched ONCE at session initialization. They are then available globally without additional API calls.

### Step 2: Login Flow
```
User enters email + password
    ↓
Supabase Auth signInWithPassword()
    ↓
On success → fetch user profile from public.users
    ↓
Fetch user role from user_roles + roles
    ↓
Fetch permissions from role_permissions + permissions
    ↓
Store ALL in auth context/store
    ↓
Redirect based on role:
  - HIGH_LEVEL_ADMIN → /admin/overview
  - MANAGER → /overview
  - AGENT → /overview
```

### Step 3: Login Page UI
Follow `DESIGN_SYSTEM.md` Section 8.15 exactly:
- Left panel: `w-[45%] bg-[#16382E]` with logo, brand name, gold divider
- Right panel: Form with email + password inputs
- Submit button: `bg-[#16382E] hover:bg-[#064e3b]` with shadow lift effect
- All fonts: Plus Jakarta Sans
- Input styling: `bg-white border border-[#EFE9DF] rounded-xl px-4 py-3.5`

### Step 4: Middleware Auth Guard
```typescript
// src/middleware.ts
// Check auth on every request
// Redirect to /login if not authenticated
// Protect all routes under /(dashboard)/
// Allow /login and /api/auth/* routes
```

### Step 5: Role-Based Route Protection
```
/(dashboard)/admin/*    → HIGH_LEVEL_ADMIN only
/(dashboard)/overview   → ALL authenticated roles
/(dashboard)/profiles   → AGENT, MANAGER, HIGH_LEVEL_ADMIN
/(dashboard)/add-profile → AGENT only
/(dashboard)/matching   → ALL authenticated roles
/(dashboard)/release-requests → MANAGER, HIGH_LEVEL_ADMIN
```

### Step 6: Logout
```
Clear auth store/context
    ↓
Supabase signOut()
    ↓
Redirect to /login
```

## Database Tables Used
- `auth.users` — Supabase managed
- `public.users` — Application user profile (auto-created via trigger `on_auth_user_created`)
- `public.user_roles` — User ↔ Role mapping
- `public.roles` — Role definitions (HIGH_LEVEL_ADMIN, MANAGER, AGENT)
- `public.permissions` — Granular permission definitions
- `public.role_permissions` — Role ↔ Permission mapping

## API Call Rules
- Login auth call: 1 Supabase Auth call
- User profile + role + permissions: 1 combined query (JOIN user_roles + roles + role_permissions + permissions)
- After initial load: ZERO additional auth/role API calls
- Role check anywhere in app: Read from cached store — NO API call

## Error Handling
- Invalid credentials → Show error message
- Disabled account (status: INACTIVE/SUSPENDED) → Block login + show message
- Session expired → Redirect to login
- Network error → Show retry option
