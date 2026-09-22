# NikaahKaro CRM — Agent Rules & Behavioral Guidelines

This file defines the behavioral rules, coding conventions, and architectural constraints for any AI agent working on this codebase.

---

## 1. Project Context

NikaahKaro is an **internal Matrimonial CRM** for Quba Foundation. It is NOT a public-facing client app. All users are internal staff (Admin, Manager / Manager, and Field Agents). The system manages:
- Client matrimonial profile creation and management
- Two-way compatibility matching engine
- Tiered information release workflow (Agent → Manager → Agent)
- Audit logging and analytics

**Read `prd.md` and `workflow.md` before making any feature changes.**

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 (via CDN on prototype pages, installed for production) |
| Font | Plus Jakarta Sans (Google Fonts) |
| State | React hooks (useState, useEffect) — no Redux for now |
| Icons | Inline SVG (heroicons style) — no external icon libraries unless already installed |
| Package Manager | npm |

---

## 3. Design System Rules (CRITICAL — DO NOT VIOLATE)

The project uses a **bespoke warm-cream premium design language**. ALL new components MUST follow these tokens:

### Color Tokens
```
Background (page):     #FAF8F5
Background (sidebar):  #FBF9F5
Background (card):     #FFFFFF
Background (inset):    #FCF9F4 / #FAF7F2 / #F7F3EA
Background (hover):    #F2ECE1 / #F0E9DC / #F4ECE1
Border (default):      #ECE5D9 / #EFE9DF / #E9E4DC / #DFD6C5
Border (strong):       #EAE2D5 / #EBE4D8
Text (heading):        #002b17 / #1E2022 / #1F1E1B / #16382E / #232326
Text (body):           #24211D / #4E473D / #1c1c19 / #2A2925
Text (muted):          #676156 / #7C756B / #888174 / #717972 / #7D766C / #867E72 / #7E776D
Text (placeholder):    #A49C8F
Brand Primary:         #064e3b / #115E49
Brand Hover:           #0f4229
Accent Gold:           #F6C365 / #ECC066 / #F6E1BA
Success:               #137333 / #16A34A
Warning / Alert:       #B45309 / #92400E / #725b24 / #59440e
Warning Background:    #FEF3C7
Error:                 #991B1B
```

### Component Rules
- Buttons: ALWAYS use `rounded-full` (pill shape) — NEVER `rounded-lg` for primary CTAs
- Cards: Use `rounded-[22px]`, `rounded-[24px]`, `rounded-[26px]`, `rounded-[28px]`, or `rounded-[32px]` with `border border-[#ECE5D9]`
- Shadow token: `shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]`
- Sidebar: `md:w-[260px] lg:w-[280px]` responsive fixed width, cream background, NOT dark
- Scrollbars: Always apply the custom slim scrollbar style (see `Sidebar2.tsx` for reference)

### Typography
- Font: `Plus_Jakarta_Sans` imported via `next/font/google`
- Headings: `font-extrabold` or `font-bold` tracking-tight (sizes from `text-[14.5px]` up to `text-[28px]`)
- Labels: `text-[9px]` to `text-[11px]` `font-bold` or `font-extrabold` `uppercase tracking-wider`
- Body: `text-[11px]` to `text-[15px]` (e.g. `text-[11.5px]`, `text-[12px]`, `text-[13.5px]`)

---

## 4. Folder Structure Rules

```
src/
├── app/                    # Next.js App Router pages
│   ├── client2/            # Candidate Profiles & Dossier view
│   ├── add-new2/           # New Profile Creation form
│   ├── overview2/          # Admin/Manager Dashboard
│   └── clients2/           # Release Requests Record (Master-Detail)
│
├── components2/            # ALL new components go HERE (not components/)
│   ├── Sidebar2.tsx        # Shared sidebar — single source of truth
│   ├── Header2.tsx         # Shared header (used on client2)
│   ├── overview2/          # Dashboard-specific components
│   ├── clients2/           # Release Requests page components
│   └── add-new2/           # Profile form components
│
└── components/             # OLD components — do not modify
```

**NEVER put new components in `src/components/`. Always use `src/components2/`.**

---

## 5. Navigation & Active State

The `Sidebar2` component accepts an `activePage` prop:
```tsx
<Sidebar2 activePage="overview" />
```

Valid `activePage` values and their routes:
| activePage value | Route | Label |
|---|---|---|
| `overview` | `/overview2` | Overview |
| `profiles` | `/client2` | Profiles & Dossiers |
| `add-new` | `/add-new2` | Add New Profile |
| `release-requests` | `/clients2` | Release Requests |
| `matching` | `/matching2` (future) | Matching Engine |
| `proposals` | `/proposals2` (future) | Proposals in Progress |
| `feedback` | `/feedback2` (future) | Rejection Feedback |
| `verifications` | `/verifications2` (future) | Dossier Verifications |

When creating a new page, ALWAYS pass the correct `activePage` prop to `Sidebar2`.

---

## 6. Workflow-Aware Coding Rules

Before adding any UI element, understand which role sees it:

| Role | Can See | Cannot See |
|---|---|---|
| High-Level Admin | Everything | N/A |
| Manager | Requests, Matching, Release controls | Not in data entry |
| Agent | Their own profiles, match results (limited), approved info | Sensitive contact info before approval |

When building components, use comments like:
```tsx
{/* AGENT VIEW: Shows limited match info — no CNIC or contact */}
{/* Manager VIEW: Full profile + release controls visible */}
```

---

## 7. Data Sensitivity Rules (MUST FOLLOW)

The following fields are **SENSITIVE** and must NEVER be shown without Manager approval:
- CNIC number
- Full residential address
- Guardian/Wali phone numbers
- Any Tier-2 level information

In UI, represent encrypted/locked fields as:
```tsx
<span className="font-mono text-[#064e3b]">0300-8429*** (Encrypted AES-256)</span>
```

---

## 8. Status Concepts (Three Separate Entities)

**DO NOT conflate these three statuses:**

1. **Profile Status**: `Active` | `In Progress` | `Married` | `Closed/Deactivated`
2. **Match/Pair Status**: `Suggested` | `Requested` | `Referred` | `In Progress` | `Accepted` | `Rejected`
3. **Request Status**: `Pending` | `Under Review` | `Approved` | `Rejected` | `Assigned` | `Completed`

Each has its own badge colors — see `data-models.md` for full mapping.

---

## 9. Code Quality Rules

- All components must be typed with TypeScript interfaces
- Never use `any` type
- Use `"use client"` directive only on components that need browser APIs or React hooks
- Server components (no directive) for static/display-only components
- Always add `aria-label` or `aria-current` on interactive navigation elements
- Form inputs must always have associated `<label>` elements

---

## 10. Reference Files

| File | Purpose |
|---|---|
| `.agents/prd.md` | Full Product Requirements Document |
| `.agents/workflow.md` | Detailed operational workflow (18 phases) |
| `.agents/data-models.md` | Profile fields, status enums, data structure |
| `.agents/matching-engine.md` | Two-way compatibility scoring rules |
| `.agents/roles-permissions.md` | Role-based access control matrix |
