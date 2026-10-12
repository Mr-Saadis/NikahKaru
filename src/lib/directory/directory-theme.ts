// ============================================================
// NikaahKaro CRM — Directory Theme System
// Centralised colour mappings sourced strictly from
// DESIGN_SYSTEM.md, globals.css, and manager Requests Board.
// ============================================================

import { COLUMNS } from '@/components/requests/constants';

export type CardTintKey = 'orange' | 'navy' | 'darkGreen' | 'golden' | 'pink' | 'green' | 'beige';

/**
 * Filter card tints — matching the website's colour schema:
 * 1. Orange     — Terracotta (#C86A4A)
 * 2. Navy       — Blue Granite (#2F3E51)
 * 3. Dark Green — Pine Grove (#1F3B34)
 * 4. Golden     — Gold (#ECC066)
 * 5. Light Pink — Soft Rose (#FCE2DF)
 * 6. Light Green— Sage Whisper (#E5EFE9)
 * 7. Beige      — Amber Beige (#FDF0D8)
 */
export const DIRECTORY_FILTER_TINTS: Record<
  CardTintKey,
  { bg: string; text: string; border: string }
> = {
  orange:    { bg: '#C86A4A', text: '#FFFFFF', border: '#B55A3C' },
  navy:      { bg: '#2F3E51', text: '#FFFFFF', border: '#243142' },
  darkGreen: { bg: '#1F3B34', text: '#FFFFFF', border: '#172E29' },
  golden:    { bg: '#ECC066', text: '#1E2022', border: '#D4AF37' },
  pink:      { bg: '#FCE2DF', text: '#1E2022', border: '#F7C6C1' },
  green:     { bg: '#E5EFE9', text: '#1E2022', border: '#D1E3DC' },
  beige:     { bg: '#FDF0D8', text: '#8B6122', border: '#ECC066' },
};

export const DIRECTORY_TINT_CYCLE: CardTintKey[] = [
  'orange',
  'navy',
  'darkGreen',
  'golden',
  'pink',
  'green',
];

/**
 * 5 Soft Avatar color pairs (matching DESIGN_SYSTEM.md section 3.8)
 * Green, Amber, Red, Slate, Neutral — all WCAG AA compliant.
 */
export const DIRECTORY_AVATARS = [
  { bg: '#E5EFE9', text: '#165842' }, // Green
  { bg: '#FCE7CE', text: '#8C5216' }, // Amber
  { bg: '#FCE2DF', text: '#A6372A' }, // Red
  { bg: '#D4DDD8', text: '#1F3B34' }, // Slate
  { bg: '#F4EFE7', text: '#1E2022' }, // Neutral
] as const;

export const DIRECTORY_THEME = {
  // ── Brand Primary (Deep Forest Green) ──
  brand: {
    primary: '#1F3B34',
    hover: '#172E29',
    text: '#FFFFFF',
    darkestText: '#002b17',
    ring: '#1F3B34',
    selectedHighlight: 'rgba(31,59,52,0.08)',
    logoGradient: 'linear-gradient(135deg, #1F3B34 0%, #172E29 100%)',
  },

  // ── Amber Accent Family ──
  amber: {
    bg: '#FDF0D8',
    text: '#8B6122',
    border: '#ECC066',
    iconOnDark: '#F5C770',
    badgeText: '#8B6122',
  },

  // ── Surfaces & Backgrounds ──
  surfaces: {
    app: '#FAF8F5',
    white: '#FFFFFF',
    controlBg: '#FFFFFF',
    controlBgWhiteCard: '#FFFFFF',
    controlBgExpanded: '#FFFFFF',
    toggleTrack: '#F4EFE7',
    stepperCircle: '#FFFFFF',
    tagBg: '#FFFFFF',
    frostedTag: 'rgba(255,255,255,0.85)',
  },

  // ── Text Tokens ──
  text: {
    title: '#002b17',
    body: '#1E2022',
    muted: '#717972',
    subtle: '#888174',
    inverted: '#FFFFFF',
    darkCardMuted: 'rgba(255,255,255,0.7)',
  },

  // ── Borders & Outlines ──
  borders: {
    main: '#E9E4DC',
    soft: '#ECE5D9',
    divider: '#F0EBE2',
    inputRing: '#1F3B34',
    chipRing: 'rgba(31,59,52,0.12)',
    archiveOutline: '1.5px solid #E9E4DC',
    cardOutline: '1px solid #E9E4DC',
    transCardBorder: '1.5px solid #ECE5D9',
    pillRemoveRing: 'inset 0 0 0 1.5px rgba(31,59,52,0.35)',
  },

  // ── Success & State Tokens ──
  state: {
    successGreen: '#137333',
    successBg: '#E5EFE9',
    successText: '#1F3B34',
  },

  // ── Neutral Card Shadows (Alpha max 0.04 - 0.08) ──
  shadows: {
    cardBase: '0 1px 2px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04)',
    cardHover: '0 12px 24px rgba(0,0,0,0.06)',
    cardActive: '0 0 0 2px #1F3B34, 0 10px 22px rgba(0,0,0,0.07)',
    cardOpen: '0 0 0 2px #1F3B34, 0 14px 28px rgba(0,0,0,0.08)',
    panel: '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)',
    btnBrand: '0 4px 12px rgba(31,59,52,0.18)',
    stepper: '0 1px 3px rgba(0,0,0,0.06)',
    waitingPill: '0 2px 8px rgba(0,0,0,0.04)',
    logo: '0 6px 14px rgba(31,59,52,0.22)',
    entryCardSelected: '0 0 0 2px #1F3B34, 0 14px 28px rgba(31,59,52,0.14)',
    entryCardDarkBase: '0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 6px rgba(0,0,0,0.06)',
    entryCardLightBase: '0 1px 0 rgba(255,255,255,0.5) inset, 0 2px 6px rgba(0,0,0,0.04)',
    avatar: '0 2px 6px rgba(0,0,0,0.06)',
    emptyCard: '0 1px 2px rgba(0,0,0,0.04)',
  },

  // ── Reusable CSS Classes ──
  classes: {
    placeholderSubtle: 'placeholder:text-[#888174]',
    hoverBrandBg: 'hover:bg-[#172E29]',
    hoverBrandPrimaryBg: 'hover:bg-[#1F3B34]',
    hoverWarmNeutralBg: 'hover:bg-[#EAE2D5]',
    focusBrandRing: 'focus:shadow-[inset_0_0_0_2px_#1F3B34]',
  },
} as const;

/**
 * Returns the card styling for an entry based on its board stage,
 * exactly matching the real manager RequestCard logic.
 */
export function getDirectoryStageCardStyle(boardStage: string) {
  const isArchive = boardStage === 'archive';
  const column = COLUMNS.find((c) => c.key === boardStage);
  const rawBg = column?.cardBg || '#F2EDE1';

  const isTransparent = isArchive || rawBg === 'transparent';
  const effectiveBg = isTransparent ? 'transparent' : rawBg;

  // Dark background contrast check from manager RequestCard
  const isDarkBg =
    effectiveBg !== 'transparent' &&
    ['#2F3E51', '#1F3B34', '#C86A4A'].includes(effectiveBg);

  const textColor = isDarkBg ? '#FFFFFF' : '#1F3B34';
  const mutedColor = isDarkBg ? 'rgba(255,255,255,0.7)' : 'rgba(31,59,52,0.65)';
  const borderBottomColor = isDarkBg ? 'rgba(255,255,255,0.15)' : 'rgba(31,59,52,0.09)';

  const border = isTransparent ? `1.5px solid ${column?.color || '#E9E4DC'}` : 'none';

  return {
    effectiveBg,
    isDarkBg,
    textColor,
    mutedColor,
    borderBottomColor,
    border,
  };
}
