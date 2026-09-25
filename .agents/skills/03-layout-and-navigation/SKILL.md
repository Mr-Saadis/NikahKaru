---
name: layout-and-navigation
description: App layout structure including Sidebar, Header, protected layout wrapper, and navigation routing. Follows DESIGN_SYSTEM.md exactly for Sidebar2, Header2, and page layout patterns.
---

# Layout & Navigation System

## Overview
Build the core app shell: Sidebar + Header + Content area. All authenticated pages share this layout. Login page has its own separate layout.

## Layout Architecture

```
Root Layout (src/app/layout.tsx)
├── (auth) Group — No sidebar/header
│   └── login/page.tsx
└── (dashboard) Group — With sidebar/header
    ├── layout.tsx — DashboardLayout (Sidebar + Header + Content)
    ├── overview/page.tsx
    ├── profiles/page.tsx
    ├── add-profile/page.tsx
    ├── matching/page.tsx
    ├── release-requests/page.tsx
    ├── proposals/page.tsx
    ├── feedback/page.tsx
    └── admin/
        ├── users/page.tsx
        └── analytics/page.tsx
```

## Design Specs (from DESIGN_SYSTEM.md)

### Root Page Pattern
```tsx
<div className={`fixed inset-0 z-50 flex flex-col md:flex-row bg-[#FAF8F5] text-[#1E2022] ${plusJakartaSans.className} antialiased overflow-hidden`}>
  <Sidebar activePage="..." />
  <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
    <Header title="..." subtitle="..." />
    <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto w-full">
      {/* page content */}
    </div>
  </main>
</div>
```

### Sidebar Component Specs (Section 8.1)
```
Container: aside w-full md:w-[260px] lg:w-[280px] bg-[#FBF9F5] border-r border-[#EFE9DF] p-6
Logo: w-10 h-10 rounded-xl drop-shadow-sm
Brand name: text-[17px] font-bold tracking-tight text-[#16382E]
CRM badge: bg-[#E5EFE9] text-[#125740] text-[9px] uppercase font-extrabold
Nav INACTIVE: text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1] rounded-2xl
Nav ACTIVE: font-semibold text-white bg-[#064e3b] shadow-sm py-3 rounded-2xl
User Pill: bg-white border border-[#EBE4D8] rounded-[22px] p-2.5
```

### Navigation Structure
```
Overview              → /overview        activePage: "overview"
Profiles & Dossiers   → /profiles        activePage: "profiles"
Add New Profile       → /add-profile     activePage: "add-new"
Matching Engine       → /matching        activePage: "matching"
Release Requests      → /release-requests activePage: "release-requests"
Proposals In Progress → /proposals       activePage: "proposals"
Rejection Feedback    → /feedback        activePage: "feedback"
```

Admin-only (show if role === HIGH_LEVEL_ADMIN):
```
User Management       → /admin/users
System Analytics      → /admin/analytics
```

### Header Component Specs (Section 8.2 + 9)
```
bg-[#FCF9F4] border-b border-[#E9E4DC]
h1: text-2xl lg:text-[28px] font-extrabold text-[#002b17] tracking-tight
Subtitle: text-[13px] font-medium text-[#717972]
Primary CTA: bg-[#064e3b] text-white rounded-full font-bold
Bell icon: relative with red notification dot
```

### Scrollbar Styling
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2dcd2; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #c8c0b4; }
```

## Implementation Steps

### Step 1: Dashboard Layout
Create `src/app/(dashboard)/layout.tsx`:
- Wraps all dashboard pages with AuthGuard + ReferenceDataProvider
- Renders Sidebar + main content area
- Fixed viewport: `fixed inset-0`
- Injects custom scrollbar CSS

### Step 2: Sidebar Component
Create `src/components/layout/Sidebar.tsx`:
- Props: `activePage: string`
- Read user role from auth store (cached, NO API call)
- Show/hide nav items based on role
- User pill at bottom with avatar, name, role badge, logout button
- Responsive: full-width on mobile, fixed sidebar on desktop

### Step 3: Header Component
Create `src/components/layout/Header.tsx`:
- Props: `title, subtitle, actions?, showBackButton?, showNotifications?`
- Back button, notification bell, primary CTA
- Notification count from real-time subscription (or cached count)

### Step 4: Auth Guard
Create `src/components/providers/AuthGuard.tsx`:
- Check if user is authenticated (from auth store — NO API call)
- Check if role has access to current route
- Redirect to login if not authenticated
- Show 403 if wrong role

## API Call Rules for Layout
- Sidebar user info: FROM AUTH STORE (cached at login) — 0 API calls
- Sidebar nav badge counts: 1 API call on dashboard layout mount, cache result
- Header notification count: Real-time subscription OR cached
- Role check for nav visibility: FROM AUTH STORE — 0 API calls
