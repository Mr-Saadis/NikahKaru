import type { ColumnDef } from './types';

// ============================================================
// Board column definitions — fixed order
// Updated to use the requested colour schema:
// Pine Grove: #1F3B34, Blue Granite: #2F3E51, Terracotta Clay: #C86A4A
// Sage Whisper: #A3B18A, Cannoli Cream: #F2EDE1
// ============================================================
export const COLUMNS: ColumnDef[] = [
  { label: 'New Data',              key: 'new',       color: '#1F3B34', cardBg: '#F2EDE1', filledDashes: 1 },
  { label: 'First Time Request',    key: 'first',     color: '#F2EDE1', cardBg: '#C86A4A', filledDashes: 1 },
  { label: 'Second Time Request',   key: 'second',    color: '#A3B18A', cardBg: '#2F3E51', filledDashes: 2 },
  { label: 'Requests Responded',    key: 'responded', color: '#1F3B34', cardBg: '#F2EDE1', filledDashes: 2 },
  { label: 'Completed',             key: 'done',      color: '#A3B18A', cardBg: 'transparent', filledDashes: 3 },
  { label: 'Pause',                 key: 'pause',     color: '#F2EDE1', cardBg: '#1F3B34', filledDashes: 2 },
  { label: 'Feedback',              key: 'feedback',  color: '#1F3B34', cardBg: '#F2EDE1', filledDashes: 2 },
  { label: 'Archive',               key: 'archive',   color: '#1F3B34', cardBg: '#A3B18A', filledDashes: 3 },
];

// Avatar accent colours — cycle by card index
export const AVATAR_COLORS = [
  '#F2EDE1', // Cannoli Cream
  '#A3B18A', // Sage Whisper
  '#C86A4A', // Terracotta Clay
  '#2F3E51', // Blue Granite
  '#1F3B34', // Pine Grove
];

// Staff names for mock data
export const STAFF_NAMES = [
  'Ayesha Khan',
  'Bilal Ahmed',
  'Sana Tariq',
  'Usman Ali',
  'Hina Malik',
];
