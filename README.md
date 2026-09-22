# NikaahKaro CRM — Project Overview

**Platform:** NikaahKaro Matrimonial CRM
**Organization:** Quba Foundation
**Type:** Internal Web Application (Staff-Only)
**Tech Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS

---

## What is this project?

An internal CRM for managing a halal matrimonial matching service. Field agents collect client information and preferences, the system runs compatibility matching, and a supervisory Manager role controls what information gets released to agents after reviewing matches.

Clients do NOT use this system. All interactions are internal.

---

## Quick Start

```bash
npm install
npm run dev
# App runs at http://localhost:3000
```

## Key Routes (Built)

| URL | Description |
|---|---|
| `/overview2` | Operations Dashboard |
| `/client2` | Profiles & Dossiers |
| `/add-new2` | Add New Profile Form |
| `/clients2` | Release Requests (Manager workspace) |

---

## Documentation Index

All project documentation is in the `.agents/` folder:

| File | Description |
|---|---|
| `.agents/AGENTS.md` | Coding rules, design tokens, architecture constraints |
| `.agents/prd.md` | Full Product Requirements Document |
| `.agents/workflow.md` | Complete operational workflow (18 phases) |
| `.agents/data-models.md` | All profile fields, status enums, data models |
| `.agents/matching-engine.md` | Two-way compatibility scoring specification |
| `.agents/roles-permissions.md` | Role-based access control matrix |
| `.agents/ui-component-map.md` | Page layouts, components, and data sources |

---

## Design System

The app uses a premium warm-cream design language. Key rules:
- Background: `#FAF8F5`
- Brand: `#064e3b`
- Buttons: Always `rounded-full` (pill shape)
- Cards: `rounded-[22px]` or `rounded-[26px]`
- Shadow: `shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04)]`

**DO NOT use:** Dark sidebars, blue/purple themes, Tailwind defaults without customization.

See `.agents/AGENTS.md` for complete design token reference.

---

## Folder Structure

```
src/
├── app/              # Pages (App Router)
│   ├── client2/      # Profiles view
│   ├── add-new2/     # Profile creation form
│   ├── overview2/    # Dashboard
│   └── clients2/     # Release requests
└── components2/      # All new components (NOT components/)
    ├── Sidebar2.tsx   # Shared navigation sidebar
    ├── Header2.tsx    # Shared header
    ├── overview2/     # Dashboard widgets
    ├── clients2/      # Release request components
    └── add-new2/      # Form components
```

---

## Three Critical Status Concepts

**Do NOT merge these three:**

1. **Profile Status** — `active` | `in_progress` | `married` | `closed`
2. **Match/Pair Status** — `suggested` | `requested` | `referred` | `in_progress` | `accepted` | `rejected`
3. **Request Status** — `pending` | `under_review` | `approved` | `rejected` | `assigned` | `completed`
