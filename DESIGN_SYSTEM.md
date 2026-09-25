# NikaahKaro CRM — Complete Design System & UI/UX Blueprint

> **یہ file مکمل design reference ہے۔** اگر project delete ہو جائے یا نیا project شروع کرنا ہو، یہ file پڑھ کر بالکل same design, colours, fonts, اور UI/UX recreate کر سکتے ہیں۔

---

## 1. TECH STACK & FRAMEWORK

| Layer | Technology |
|---|---|
| Framework | **Next.js** (App Router) |
| Language | **TypeScript** (.tsx files) |
| Styling | **Tailwind CSS v4** (inline class-based) |
| Font | **Plus Jakarta Sans** (Google Fonts) |
| Icon Library | **Lucide React** (Check, User, ChevronRight etc.) |
| UI Components | **Shadcn/UI** (base components, customized) |
| Image | `next/image` component |

---

## 2. FONT SYSTEM

### Primary Font: Plus Jakarta Sans

```tsx
// Every page mein yeh import karo:
import { Plus_Jakarta_Sans } from "next/font/google";
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

// Root div mein apply karo:
<div className={`... ${plusJakartaSans.className} antialiased`}>
```

### Font Size Scale (Exact values used)

| Use Case | Size | Weight |
|---|---|---|
| Page main heading h1 | text-2xl / text-[26px] / text-[28px] | font-extrabold |
| Section heading h2 | text-lg / text-[15px] | font-bold |
| Card heading h3 | text-[14.5px] | font-bold |
| Sub-heading h4 | text-[13.5px] / text-[14px] | font-bold / font-semibold |
| Body text | text-[13px] | font-medium |
| Small labels | text-[12px] / text-[12.5px] | font-medium |
| Micro labels / badges | text-[11px] / text-[11.5px] | font-semibold / font-bold |
| Tiny captions | text-[10px] / text-[10.5px] | font-medium |
| Stat numbers KPI | text-[26px] / text-[28px] | font-extrabold |
| Sidebar links | text-[13.5px] | font-medium inactive / font-semibold active |
| Uppercase labels | text-[10px] to text-[12px] + uppercase tracking-wider | font-bold |

### Typography Rules
- Letter tracking: tracking-tight for headings, tracking-wider for uppercase labels
- Page titles: always text-[#002b17] color
- Section titles: text-[#1E1F22] or text-[#232326]
- Muted / supporting text: text-[#717972] or text-[#7C756B]
- antialiased class always on root container

---

## 3. COLOUR SYSTEM — Complete Reference

### 3.1 Brand Primary (Deep Forest Green)

```
Primary Action:     #064e3b   (main buttons, active nav, accents)
Primary Hover:      #0f4229   (hover state for primary buttons)
Dark Brand:         #16382E   (login panel bg, strong brand)
Deep Brand:         #115E49   (user avatar bg, completed status)
Darkest Text:       #002b17   (page titles, most important text)
```

### 3.2 Background Colors

```
App Root / Page BG:     #FAF8F5   (main background — all pages)
Sidebar BG:             #FBF9F5   (slightly different warm white)
Header BG:              #FCF9F4   (top header bars)
Alternate BG:           #F4EFE7   (clients2 main bg)
Cards on Main BG:       #F8F4EC   (neutral metric cards)
Warm Highlight Card:    #FDF0D8   (golden/amber metric cards)
Primary Candidate Card: #F7F3EA   (gold tinted highlight card)
Release Desk BG:        #FAF7F2   (info notice bg)
Request Item BG:        #FAF8F5   (queue items, pending cards)
```

### 3.3 White Cards & Surfaces

```
Card White:     #FFFFFF / bg-white
Used for:
  - MatchLedger section
  - AlignmentDistribution
  - EngagementActivity
  - Detail view panels
  - Form inputs
  - Sidebar bottom user pill
```

### 3.4 Border Colors

```
Main borders:       #E9E4DC   (card borders, input borders)
Softer border:      #ECE5D9   (white card borders)
Sidebar border:     #EFE9DF   (sidebar right border)
Divider lines:      #F0EBE2 / #F4EFE6 / #F5EFE6 / #F7F3EB
Header bottom:      #E9E4DC   (header bottom border)
Warm accent border: #ECC066 / #F6E1BA  (gold highlight cards)
```

### 3.5 Text Colors

```
Darkest heading:    #002b17   (page titles)
Main text:          #1E2022   (body text, table data)
Dark text:          #24211D   (card stats, row data)
Dark neutral:       #232326   (section headings)
Medium text:        #4E473D   (secondary info)
Muted text:         #676156   (nav links inactive, labels)
Sidebar text:       #7D766C / #7C756B  (supporting info)
Icon muted:         #888174   (inactive icons, muted labels)
Header subtitle:    #717972   (subtitle under page title)
Table header:       #888174   (uppercase column labels)
Timestamp:          #A49C8F   (very muted, timestamps)
```

### 3.6 Status / Semantic Colors

```
SUCCESS Green:
  bg:   #E5EFE9 / #E6F4EA
  text: #064e3b / #137333 / #166534
  dot:  #16a34a

WARNING Amber:
  bg:   #FEF3C7 / #FDF0D8
  text: #8B6122 / #92400E / #725b24
  border: #F6E1BA

ERROR / REJECT Red:
  bg:   #FEE2E2
  text: #991B1B / #ba1a1a
  border: #FCA5A5

INFO Teal:
  bg:   #F7FAF8
  text: #064e3b
  border: #D1E3DC

NEUTRAL:
  bg:   #F4EFE7 / #EAE2D5
  text: #4E473D / #696256

BADGE Live Active:
  bg:   #E5EFE9
  text: #064e3b
  dot:  #16a34a pulsing green dot
```

### 3.7 Capsule Bar Chart Colors

```
Group 1 — GOLD Mandatory/Deen:   #F5C770   text: #8F7435
Group 2 — CORAL Education/Career: #F6A398   text: #B35246
Group 3 — SLATE Location:         #D4DDD8   text: #66726D
Group 3B — LIGHTER SLATE:         #E5ECE8   text: #838E8A
```

### 3.8 Avatar / Initials Colors

```
Green avatar bg:    #E5EFE9  text: #165842   (agents)
Amber avatar bg:    #FCE7CE  text: #8C5216   (walis/guardians)
Red avatar bg:      #FCE2DF  text: #A6372A   (system)
User pill avatar:   #115E49  text: white     (sidebar user)
```

### 3.9 Gold Divider Login Page

```
#D4AF37   (horizontal divider line between brand name and tagline)
```

---

## 4. BORDER RADIUS SYSTEM

```
Tiny badges/pills:     rounded-full  (fully rounded)
Filter tabs:           rounded-full  (pill buttons)
Navigation links:      rounded-2xl   (sidebar nav items)
Small buttons:         rounded-full  (CTA buttons)
Icon buttons:          rounded-2xl / rounded-lg / rounded-full
Card containers:       rounded-[22px] / rounded-[24px] / rounded-[26px] / rounded-[28px] / rounded-[32px]
Form inputs:           rounded-lg / rounded-xl
Stepper dots:          rounded-full
Table pagination:      rounded-xl
User pill sidebar:     rounded-[22px]
Profile sidebar card:  rounded-[32px]
Form content card:     rounded-[32px]
```

---

## 5. SHADOW SYSTEM

```
Standard card shadow:
  shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]

Small shadow: shadow-sm

CTA button hover shadow login:
  shadow-[0_4px_14px_0_rgba(22,56,46,0.39)]
  hover: shadow-[0_6px_20px_rgba(22,56,46,0.23)]
```

---

## 6. SCROLLBAR STYLING

Yeh CSS har page ke root div mein inject hoti hai via dangerouslySetInnerHTML:

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2dcd2; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #c8c0b4; }
```

---

## 7. LAYOUT SYSTEM

### 7.1 Root Page Layout Pattern

```tsx
"use client";
import { Plus_Jakarta_Sans } from "next/font/google";
import Sidebar2 from "../../components2/Sidebar2";
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function MyPage() {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col md:flex-row bg-[#FAF8F5] text-[#1E2022] ${plusJakartaSans.className} antialiased overflow-hidden`}>
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2dcd2; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #c8c0b4; }
      `}} />
      <Sidebar2 activePage="..." />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-[#FCF9F4] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E4DC]">
          <h1 className="text-2xl lg:text-[28px] font-extrabold text-[#002b17] tracking-tight">Page Title</h1>
        </header>
        <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto w-full">
          {/* content */}
        </div>
      </main>
    </div>
  );
}
```

### 7.2 Sidebar Dimensions
- Width desktop: w-[260px] to w-[280px]
- Width mobile: w-full (stacks on top)
- Background: #FBF9F5
- Right border: border-r border-[#EFE9DF]
- Padding: p-6

### 7.3 Dashboard Content
- Max width: max-w-7xl
- Padding: p-6 lg:p-8
- Gap between sections: space-y-7

### 7.4 Grid Patterns
- KPI Cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5
- Main 2-col: grid-cols-1 xl:grid-cols-12 gap-7 (left: col-span-8, right: col-span-4)
- Metric cards: grid-cols-1 sm:grid-cols-3 gap-3.5
- Form + sidebar: grid-cols-1 lg:grid-cols-12 (left: 8, right: 4)

### 7.5 Clients2 Master-Detail Layout
- Header: sticky top-0 h-16 bg-white
- FilterBar: shrink-0
- Body: flex-1 flex (Left Queue ~38%, Right Detail ~62%)

---

## 8. COMPONENT SPECS

### 8.1 Sidebar2

```
Container: aside w-full md:w-[260px] lg:w-[280px] bg-[#FBF9F5] border-r border-[#EFE9DF] p-6

Logo: w-10 h-10 rounded-xl drop-shadow-sm
Brand name: text-[17px] font-bold tracking-tight text-[#16382E]
CRM badge: bg-[#E5EFE9] text-[#125740] text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full
Tagline: text-[11px] font-medium text-[#7D766C]

Nav Links INACTIVE: flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1]
Nav Links ACTIVE: font-semibold text-white bg-[#064e3b] shadow-sm py-3 text-[14px] rounded-2xl
Nav Icons INACTIVE: text-[#888174]
Nav Icons ACTIVE: text-white

Badge INACTIVE: bg-[#EAE2D5] text-[#4E473D] text-[11px] font-bold px-2 py-0.5 rounded-full
Badge ACTIVE: bg-white text-[#064e3b]

User Pill: bg-white border border-[#EBE4D8] rounded-[22px] p-2.5
Avatar: w-10 h-10 rounded-full bg-[#115E49] text-white font-bold ring-2 ring-[#E0EEE8]
Role badge: bg-[#F7E7CE] text-[#825418] text-[10px] font-semibold rounded-full
Logout: text-[#8D867C] hover:text-[#115E49] hover:bg-[#F6F2EA]
```

### 8.2 Header2 Dossier Header

```
header bg-[#FCF9F4] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between border-b border-[#E9E4DC]

Back button: w-10 h-10 rounded-2xl bg-white hover:bg-[#F4ECE1] border border-[#E9E4DC] shadow-sm text-[#064e3b]

h1: text-2xl lg:text-[28px] font-extrabold text-[#002b17] tracking-tight
ID badge: bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc] text-[12px] font-bold px-2.5 py-0.5 rounded-full
Subtitle: text-[13px] font-medium text-[#717972]

Icon buttons: w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] shadow-sm
Notification dot: absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white

Primary CTA: bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[13px] px-5 py-2.5 rounded-full shadow-sm hover:-translate-y-0.5
```

### 8.3 KPI Metric Cards overview2

```
Height: h-[138px]  Radius: rounded-[24px]  Padding: p-5  Shadow: shadow-sm

TYPE A — AMBER:
  bg: #FDF0D8  border: border-[#F6E1BA]/60
  Label: text-[12px] font-bold text-[#78643C] uppercase tracking-wider
  Number: text-[28px] font-extrabold text-[#241E15]
  Growth badge: bg-[#FEF3C7] border border-[#F6E1BA] text-[#166534]

TYPE B — NEUTRAL:
  bg: #F8F4EC  border: border-[#E9E2D4]
  Label: text-[12px] font-bold text-[#766E61] uppercase tracking-wider
  Number: text-[28px] font-extrabold text-[#24211D]
  Sub: text-[11.5px] text-[#7C756B]

URGENT: bg-[#FEE2E2] text-[#991b1b] text-[11px] font-extrabold px-2 py-0.5 rounded-full
```

### 8.4 Client Metric Cards client2

```
Height: h-[134px]  Same pattern as 8.3 but numbers: text-[26px] font-extrabold
```

### 8.5 White Cards General

```
bg-white rounded-[26px] p-5 border border-[#ECE5D9]
shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]

Heading: text-[14.5px] font-bold text-[#1F1E1B]
Subheading: text-[11px] text-[#867E72]
Divider: border-b border-[#F5EFE6]
```

### 8.6 MatchLedger Table client2

```
bg-white rounded-[28px] border border-[#ECE5D9] p-5 lg:p-6

Table heading: text-lg font-bold text-[#1E1F22]
Sub: text-[12px] text-[#78716C]

Filter Pills Active: bg-[#16382E] text-white rounded-full px-3.5 py-1.5 text-[12px] font-bold
Filter Pills Inactive: bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]

Table headers: text-[#888174] font-medium text-[11.5px] uppercase tracking-wider py-3.5 px-3
Table rows: text-[13px] text-[#2A2925] divide-y divide-[#F7F3EB] hover:bg-[#FAF7F2]

ID cell: font-mono font-bold text-[#6D6558] text-[12px]
Avatar: w-9 h-9 rounded-full font-extrabold text-xs
Name: font-bold text-[#1E1F22]
Guardian: text-[11px] text-[#7C756B]

View Dossier button: text-white font-bold px-4 py-1.5 rounded-full text-[12px]
Download button: w-8 h-8 rounded-full border border-[#E5DFD4] hover:bg-[#F2ECE1] text-[#787167]

Pagination: border-t border-[#F5EFE6] text-[12px] text-[#7D766C]
Buttons: px-3 py-1 rounded-xl border border-[#E2DBD0] hover:bg-[#FAF7F2] font-semibold
```

### 8.7 AlignmentDistribution Capsule Bar Chart

```
bg-white rounded-[26px] p-5 border border-[#ECE5D9]

Bars container: flex items-end justify-between gap-1.5 pt-2 pb-1 h-20
Each group: flex flex-col items-center gap-1.5 flex-1 h-full justify-end
Bar: w-full rounded-full h-[XX%]   height equals percentage

Hover animation: CSS class .capsule-bar
  transition: transform 0.2s ease, opacity 0.2s ease
  hover: transform scaleY(1.04) opacity 0.92

Bar colors:
  GOLD  Fiqh/Lineage/Status:  #F5C770  text: #8F7435
  CORAL Edu/Career/Age:       #F6A398  text: #B35246
  SLATE Living/City:          #D4DDD8  text: #66726D
  LIGHT Global:               #E5ECE8  text: #838E8A

Bar labels: text-[9.5px] font-semibold
```

### 8.8 PrimaryCandidate2 Golden Card

```
Big card: bg-[#F7F3EA] border border-[#ECC066]/60 rounded-[28px] p-6 min-h-[196px]

Green accent strip: absolute right-0 top-3 bottom-3 w-2.5 bg-[#064e3b] rounded-l-md opacity-90

Top badge: bg-[#FEF3C7] border border-[#F6E1BA] text-[#725b24] text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full

Title: text-xl font-extrabold text-[#002b17] tracking-tight
Sub: text-[12px] font-semibold text-[#59440e]

Affinity box: w-10 h-7 rounded-md bg-white border border-[#ECC066] text-[9px] font-black text-[#064e3b]
Bottom divider: border-t border-[#DFD6C5]

Registry label: text-[10px] uppercase font-bold text-[#725b24] tracking-wider
Registry value: text-[15px] font-bold text-[#002b17] tracking-wide font-mono

Add box dashed: bg-[#F7F3EA] hover:bg-[#F0E9DC] border-2 border-dashed border-[#DFD6C5] rounded-[28px]
Icon: w-11 h-11 rounded-full bg-white shadow-sm group-hover:scale-105
```

### 8.9 HorizontalStepper add-new2

```
Background track: h-[2px] bg-[#EFE9DF]
Progress track: h-[2px] bg-[#064e3b] transition-all duration-500 ease-in-out
Width: currentStep-1 divided by steps.length-1 times 100%

Circle ACTIVE/COMPLETE: w-7 h-7 rounded-full bg-[#064e3b] text-white shadow-sm
Circle INACTIVE: bg-white border border-[#E9E4DC] text-[#888174]

Label ACTIVE: text-[#064e3b] text-[11px] font-medium
Label INACTIVE: text-[#888174]

Active underline: absolute top-[4.5rem] w-full h-[2px] bg-[#064e3b]
Completed icon: Check size=14 strokeWidth=3
```

### 8.10 ProfileSidebar add-new2

```
Container: bg-[#FBF9F5] rounded-[32px] p-6 border border-[#064e3b]/10

Avatar: w-12 h-12 rounded-full bg-[#F7F3EA] border border-[#ECC066]/60 text-[#725b24]

Vertical connector: before:absolute before:inset-y-4 before:left-[22px] before:w-px before:bg-[#E9E4DC]

Step button: w-full text-left flex items-start gap-4 p-2 rounded-2xl hover:bg-white/50

Number ACTIVE: bg-[#064e3b] text-white shadow-md shadow-[#064e3b]/20
Number COMPLETE: bg-[#E5EFE9] text-[#064e3b]
Number INACTIVE: bg-[#FBF9F5] border border-[#E9E4DC] text-[#888174]

Progress badge partial: bg-[#FEF3C7] text-[#9A6014] text-[10px] rounded-md
Progress badge complete: bg-[#064e3b]/10 text-[#064e3b] text-[10px] rounded-md

Name ACTIVE: text-[#002b17] text-[13px] font-semibold
Name INACTIVE: text-[#4E473D] text-[13px] font-semibold
Description: text-[11px] text-[#888174] leading-snug
```

### 8.11 ClientsHeader clients2

```
h-16 px-6 bg-white border-b border-[#EFE9DF] flex items-center justify-between sticky top-0 z-30

Filter button: px-3 py-1.5 rounded-lg border border-[#E9E4DC] hover:bg-[#F2ECE1] text-[12px] font-semibold text-[#676156]

Bell: relative w-9 h-9 rounded-full hover:bg-[#F2ECE1] border border-[#E9E4DC]
Notification dot: absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]

User avatar: w-9 h-9 rounded-full bg-[#064e3b] text-white font-bold text-xs shadow-sm ring-2 ring-[#E0EEE8]
```

### 8.12 ClientsFilterBar clients2

```
px-6 py-4 bg-white border-b border-[#EFE9DF] shrink-0

Back: w-8 h-8 rounded-lg border border-[#E9E4DC] hover:bg-[#F2ECE1] text-[#676156]
Title: text-xl font-black text-[#002b17] tracking-tight

Download: bg-[#064e3b] hover:bg-[#0f4229] text-white px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide

Field labels: text-[10px] font-bold uppercase tracking-wider text-[#A49C8F]

Text inputs: rounded-lg border border-[#E9E4DC] bg-[#FCF9F4] text-[12px] focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b]
Select inputs: rounded-lg border border-[#E9E4DC] bg-white text-[11.5px] font-medium focus:ring-1 focus:ring-[#064e3b]/20

Radio labels: text-[11.5px] text-[#676156] font-medium
Radio active: font-bold text-[#002b17]
Radio inputs: text-[#064e3b] focus:ring-0
```

### 8.13 ReleaseDesk overview2 sidebar

```
bg-white rounded-[26px] p-5 border border-[#ECE5D9]

Icon box: w-8 h-8 rounded-xl bg-[#064e3b] text-white shadow-sm
Heading: text-[14.5px] font-bold text-[#1F1E1B]
Sub: text-[11px] text-[#867E72]
Count badge: bg-[#FEF3C7] text-[#92400E] border border-[#F6E1BA] text-[11px] font-extrabold rounded-full

Protocol notice: p-3 rounded-2xl bg-[#FAF7F2] border border-[#EBE4D8] text-[11.5px] text-[#59440e]

Request item: p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D5] space-y-2
ID: font-mono text-[11.5px] font-bold text-[#002b17]
URGENT badge: bg-[#FEE2E2] text-[#991b1b] text-[10px] font-bold rounded-full
APPROVED badge: bg-[#E6F4EA] text-[#137333] text-[10px] font-bold rounded-full

Item divider: border-t border-[#EFE8DC]
Reassign: px-3 py-1 rounded-full bg-white border border-[#E2DBD0] hover:bg-[#F5EFE6] text-[11px] font-bold
Approve: px-3 py-1 rounded-full bg-[#064e3b] hover:bg-[#0f4229] text-white text-[11px] font-bold

View All: w-full py-2.5 rounded-full border border-[#E2DBD0] hover:bg-[#FAF7F2] text-[12px] font-bold text-[#24211D]
```

### 8.14 ClientsDetailView clients2

```
bg-[#FAF8F5] overflow-y-auto p-6 space-y-6

h2: text-xl font-extrabold text-[#002b17] tracking-tight
Match arrow: text-[#064e3b] font-normal
REL- ID: font-mono bg-white border border-[#E9E4DC] text-[11px] font-bold rounded shadow-sm
PENDING: bg-[#FEE2E2] text-[#991B1B] text-[11px] font-bold uppercase border border-[#FCA5A5]/40 rounded

Action icons: w-8 h-8 rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#F2ECE1] shadow-sm
Reject icon hover: bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]

Summary cards: bg-white p-5 rounded-[22px] border border-[#ECE5D9]
Groom dot: bg-[#064e3b]
Bride dot: bg-[#B45309]
Label: font-bold uppercase tracking-wider text-[11px]
Name: text-[14.5px] font-bold text-[#002b17]

Phone box: font-mono text-[#064e3b] font-bold bg-[#F7FAF8] p-1.5 rounded-lg border border-[#D1E3DC]

Action toolbar: p-4 bg-white rounded-[22px] border border-[#ECE5D9]
Approve: bg-[#064e3b] hover:bg-[#0f4229] text-white font-bold text-[13px] px-6 py-3 rounded-full
Secondary: bg-white hover:bg-[#F2ECE1] text-[#4E473D] border border-[#E9E4DC] font-bold text-[13px] px-5 py-3 rounded-full
Reject: text-[#991B1B] hover:bg-[#FEE2E2] font-bold text-[13px] px-5 py-3 rounded-full

Audit table: bg-white rounded-[22px] border border-[#ECE5D9] p-5
Headers: text-[#A49C8F] font-semibold text-[10.5px] uppercase tracking-wider
Rows: hover:bg-[#FAF8F5] divide-y divide-[#F4EFE7]
ID cell: font-mono text-[#064e3b] font-bold
Timestamp: text-[#A49C8F]
```

### 8.15 Login Page

```
Root: min-h-screen flex w-full bg-[#FAF8F5]

LEFT PANEL:
  w-[45%] bg-[#16382E] flex-col justify-center items-center overflow-hidden
  Radial glow: absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,...)] from-white via-transparent

  Logo box: w-40 h-40 bg-white/5 rounded-3xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl
  Brand: text-4xl font-extrabold tracking-tight text-white uppercase
  Gold bar: w-16 h-1 bg-[#D4AF37] mx-auto rounded-full
  Tagline: text-[#EFE9DF] text-sm uppercase tracking-[0.2em] font-medium

RIGHT PANEL:
  flex-1 flex-col justify-center items-center p-8 sm:p-12 lg:p-20

  Welcome: text-3xl font-bold text-[#16382E]
  Subtitle: text-[15px] text-[#7D766C]
  Labels: text-[11px] uppercase font-bold tracking-wider text-[#676156]

  Inputs: bg-white border border-[#EFE9DF] rounded-xl px-4 py-3.5 text-[14px]
    placeholder:text-[#A8A296] focus:border-[#115E49] focus:ring-1 focus:ring-[#115E49] shadow-sm

  Submit: w-full bg-[#16382E] hover:bg-[#064e3b] text-white font-semibold py-3.5 rounded-xl
    shadow-[0_4px_14px_0_rgba(22,56,46,0.39)] hover:shadow-[0_6px_20px_rgba(22,56,46,0.23)]
    hover:-translate-y-0.5 active:translate-y-0

  Footer: text-[12px] text-[#A8A296] font-medium absolute bottom-8
```

---

## 9. OVERVIEW2 PAGE HEADER PATTERN

```
bg-[#FCF9F4] border-b border-[#E9E4DC]
Inner: max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between

Icon box: w-11 h-11 rounded-2xl bg-white border border-[#E9E4DC] shadow-sm text-[#064e3b]

h1: text-2xl lg:text-[26px] font-extrabold text-[#002b17] tracking-tight

Live badge: bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]
  text-[11px] font-bold px-2.5 py-0.5 rounded-full
  Green dot: w-2 h-2 rounded-full bg-[#16a34a]

Subtitle: text-[13px] font-medium text-[#717972]
Separator dot: w-1 h-1 rounded-full bg-[#717972]

Secondary button: bg-white hover:bg-[#F4ECE1] text-[#24211D] border border-[#E9E4DC] font-bold text-[12.5px] px-4 py-2.5 rounded-full shadow-sm
Primary button: bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[12.5px] px-5 py-2.5 rounded-full shadow-sm hover:-translate-y-0.5
```

---

## 10. INTERACTIVE STATES & MICRO-ANIMATIONS

| Element | Interaction |
|---|---|
| Primary CTA button | hover:-translate-y-0.5 lift effect |
| Icon buttons | transition color change |
| Nav links | hover:bg-[#F2ECE1] background |
| Table rows | hover:bg-[#FAF7F2] |
| Capsule bars | scaleY(1.04) on hover |
| Profile step buttons | hover:bg-white/50 |
| Add candidate box | group-hover:scale-105 on icon |
| Stepper progress | transition-all duration-500 ease-in-out |
| Login submit | hover:-translate-y-0.5 active:translate-y-0 |
| Input focus | focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b] |
| Back button | active:scale-95 |

---

## 11. STATUS BADGE PATTERNS

```
GREEN Active/Approved:
  bg-[#E6F4EA] text-[#137333]  OR  bg-[#E5EFE9] text-[#064e3b]

AMBER Pending/Warning:
  bg-[#FEF3C7] text-[#92400E]  OR  bg-[#FDF0D8] text-[#8B6122]

RED Urgent/Rejected:
  bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/40

FILTER ACTIVE:
  bg-[#16382E] text-white (main active filter)

FILTER INACTIVE:
  bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]
```

---

## 12. ADD-NEW2 MULTI-STEP FORM STEPS

```
Step 1: Basic Information      — Name, gender, DOB, contact, CNIC
Step 2: Marital & Physical     — Marital status, height, weight
Step 3: Education & Profession — Education, occupation, income
Step 4: Religion & Culture     — Religion, fiqah, caste, language
Step 5: Location & Residency   — Current & permanent address
Step 6: Family Details         — Parents, siblings, family background
Step 7: Lifestyle              — Habits, relocation preferences
Step 8: Partner Preferences    — Must Have, Highly Preferred
Step 9: Review                 — Confirm and save profile

Form card:    bg-white rounded-[32px] p-8 shadow border border-[#E9E4DC] (lg:col-span-8)
Summary card: lg:col-span-4 sticky top-8
```

---

## 13. NAVIGATION STRUCTURE — Sidebar2

```
Overview              →  /overview2    activePage: "overview"
Profiles & Dossiers   →  /client2      activePage: "profiles"
Add New Profile       →  /add-new2     activePage: "add-new"
Matching Engine       →  #matching     under development
Release Requests      →  /clients2     activePage: "release-requests"
Proposals In Progress →  #proposals    under development
Rejection Feedback    →  #feedback     under development
Dossier Verifications →  #verifications under development
```

---

## 14. RESPONSIVE BREAKPOINTS

```
Mobile-first layout.
md:  Sidebar becomes horizontal, headers go full layout
lg:  Form steps use 12-col grid, max-widths kick in
xl:  KPI expands to 5 cols, main content uses 8/4 split

Sidebar:
  Mobile: w-full stacks above
  Desktop: w-[260px] lg:w-[280px] fixed side
```

---

## 15. QUICK-COPY CODE SNIPPETS

### White Card Template

```tsx
<section className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]">
  <div className="flex items-center justify-between pb-1 border-b border-[#F5EFE6]">
    <h3 className="text-[14.5px] font-bold text-[#1F1E1B]">Card Title</h3>
    <p className="text-[11px] text-[#867E72]">Subtitle</p>
  </div>
</section>
```

### Primary CTA Button

```tsx
<button className="flex items-center gap-2 bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[13px] px-5 py-2.5 rounded-full shadow-sm transition duration-150 transform hover:-translate-y-0.5">
  Action Label
</button>
```

### Secondary Button

```tsx
<button className="flex items-center gap-2 bg-white hover:bg-[#F4ECE1] text-[#24211D] border border-[#E9E4DC] font-bold text-[12.5px] px-4 py-2.5 rounded-full shadow-sm transition">
  Secondary Action
</button>
```

### Metric Card Amber

```tsx
<div className="bg-[#FDF0D8] rounded-[24px] p-5 border border-[#F6E1BA]/60 flex flex-col justify-between h-[138px] shadow-sm">
  <div className="flex items-center justify-between">
    <span className="text-[12px] font-bold text-[#78643C] uppercase tracking-wider">LABEL</span>
    <span className="text-[11px] font-bold text-[#166534] bg-[#FEF3C7] border border-[#F6E1BA] px-2 py-0.5 rounded-full">+8.4%</span>
  </div>
  <div>
    <div className="text-[28px] font-extrabold text-[#241E15] tracking-tight leading-none">3,480</div>
    <div className="text-[11.5px] font-semibold text-[#6D6558] mt-2">Sub info here</div>
  </div>
</div>
```

### Metric Card Neutral

```tsx
<div className="bg-[#F8F4EC] rounded-[24px] p-5 border border-[#E9E2D4] flex flex-col justify-between h-[138px] shadow-sm">
  <span className="text-[12px] font-bold text-[#766E61] uppercase tracking-wider">LABEL</span>
  <div>
    <div className="text-[28px] font-extrabold text-[#24211D] tracking-tight leading-none">142</div>
    <div className="text-[11.5px] font-medium text-[#7C756B] mt-2">Sub info</div>
  </div>
</div>
```

### Green Status Badge with Dot

```tsx
<span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]">
  <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
  Live Active
</span>
```

### Section Heading Pattern

```tsx
<div className="flex items-center justify-between">
  <h2 className="text-[15px] font-bold text-[#232326] tracking-tight">Section Name</h2>
  <a className="text-[11.5px] font-bold text-[#115E49] hover:underline" href="#">View all</a>
</div>
```

---

## 16. DESIGN PHILOSOPHY — 10 Core Principles

1. **Warm Neutral Palette** — Sand/cream/warm white backgrounds. Never pure grey or cold blue-grey. Everything feels warm.

2. **Deep Forest Green as Brand** — #064e3b is THE brand color. Active nav, primary CTA, badges, progress, avatar backgrounds.

3. **Amber Gold as Accent** — #F5C770 / #D4AF37 / #FDF0D8 for highlights, premium cards. Creates a premium matrimonial feel.

4. **Rounded Everything** — No sharp corners. Cards: rounded-[22px] to rounded-[32px]. Buttons: rounded-full. Forms: rounded-xl.

5. **Subtle Shadows** — Never harsh. rgba(0,0,0,0.04) max opacity. Cards float gently.

6. **Micro-Animations** — Hover lifts on CTA, transitions on nav, scale on interactive elements.

7. **Information Density** — Data-dense but readable. Very small font sizes (9.5px-13px) with weight hierarchy for legibility.

8. **Serif-free Zone** — Only Plus Jakarta Sans. A premium geometric sans-serif that feels modern and culturally neutral.

9. **Status at a Glance** — Every record has a colored dot/badge for instant status communication (green/amber/red).

10. **Fixed Viewport App** — Entire app is fixed inset-0. Never scrolls at window level. Only main content area scrolls.

---

*Generated from codebase: NikaahKaro CRM*
*Pages analyzed: overview2, client2, clients2, add-new2, login2*
*Components: Sidebar2, Header2, KPIMetricsGrid, CandidateMetrics2, AlignmentDistribution2, MatchLedger2, PrimaryCandidate2, EngagementActivity2, HorizontalStepper, ProfileSidebar, ClientsHeader, ClientsFilterBar, ClientsQueueList, ClientsDetailView, ReleaseDesk, RejectionAnalytics, OfficerPerformance*
*Date: September 2026*
