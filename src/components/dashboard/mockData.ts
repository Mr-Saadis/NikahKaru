// ============================================================================
// NikahKaru CRM — Feedback & Rejection Fallback Data
// NOTE: Kept dummy for Phase 1 as match feedback/rejection logging is not yet
// fully implemented in the database backend. All other entities (profiles,
// requests, releases, staff/manager metrics, audit logs) use live database APIs.
// ============================================================================

export interface RejectionReasonStat {
  id: number;
  code: string;
  name_en: string;
  name_ur: string;
  percentage: number;
  count: number;
  color: string;
}

export interface ZeroCandidateAlert {
  id: string;
  profile_code: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  city: string;
  strict_filters: string[];
  candidates_found: number;
  manager_recommendation: string;
}

export interface SmartRejectionItem {
  id: string;
  male_name: string;
  female_name: string;
  rejection_reason_en: string;
  rejection_reason_ur: string;
  agent_notes: string;
  time_relative: string;
  suggested_candidate_name: string;
  suggested_compatibility: number;
}

// ────────────────────────────────────────────────────────────────────────────
// REJECTION REASONS ANALYTICS (ADMIN)
// ────────────────────────────────────────────────────────────────────────────
export const mockRejectionReasons: RejectionReasonStat[] = [
  {
    id: 1,
    code: 'LOCATION_MISMATCH',
    name_en: 'Location / Relocation Mismatch',
    name_ur: 'شہر یا منتقلی پر عدم اتفاق',
    percentage: 36,
    count: 42,
    color: '#C86A4A',
  },
  {
    id: 2,
    code: 'FINANCIAL_EXPECTATIONS',
    name_en: 'Income & Financial Expectations',
    name_ur: 'مالی یا آمدنی کے مطالبات',
    percentage: 25,
    count: 29,
    color: '#D4AF37',
  },
  {
    id: 3,
    code: 'FAMILY_SETUP',
    name_en: 'Family Setup (Joint vs Nuclear)',
    name_ur: 'مشترکہ بمقابلہ الگ رہائش',
    percentage: 18,
    count: 21,
    color: '#1F3B34',
  },
  {
    id: 4,
    code: 'AGE_HEIGHT_GAP',
    name_en: 'Age or Height Difference',
    name_ur: 'عمر یا قد کا واضح فرق',
    percentage: 12,
    count: 14,
    color: '#825418',
  },
  {
    id: 5,
    code: 'SECT_PRACTICE_GAP',
    name_en: 'Religious Practice / Sectarian Gap',
    name_ur: 'دینی یا مسلکی نقطہ نظر کا فرق',
    percentage: 9,
    count: 11,
    color: '#5B7065',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// SMART REJECTION FEED (MANAGER)
// ────────────────────────────────────────────────────────────────────────────
export const mockSmartRejectionFeed: SmartRejectionItem[] = [
  {
    id: 'srf-1',
    male_name: 'Usman Ali (PK-3901)',
    female_name: 'Zahra Fatima (PK-2184)',
    rejection_reason_en: 'Joint Family Setup Declined',
    rejection_reason_ur: 'مشترکہ خاندانی نظام پر اعتراض',
    agent_notes: 'Girl’s family requested independent living near Model Town.',
    time_relative: '3 hours ago',
    suggested_candidate_name: 'Maryam Sheikh (Separate House)',
    suggested_compatibility: 91,
  },
  {
    id: 'srf-2',
    male_name: 'Farhan Zaidi (PK-1029)',
    female_name: 'Sana Batool (PK-8830)',
    rejection_reason_en: 'Relocation to Gulf Not Feasible',
    rejection_reason_ur: 'خلیجی ممالک منتقلی سے معذرت',
    agent_notes: 'Boy is settled in Dubai; girl’s parents prefer resident in Islamabad.',
    time_relative: 'Yesterday',
    suggested_candidate_name: 'Hina Rizvi (Willing to Relocate)',
    suggested_compatibility: 94,
  },
  {
    id: 'srf-3',
    male_name: 'Dr. Tariq Bilal (PK-4011)',
    female_name: 'Dr. Ayesha Qazi (PK-5510)',
    rejection_reason_en: 'Post-Graduation Specialty Conflict',
    rejection_reason_ur: 'شعبہ جاتی تربیتی دورانیہ',
    agent_notes: 'Female doctor starting 4-year FCPS residency in Karachi.',
    time_relative: '2 days ago',
    suggested_candidate_name: 'Dr. Mahnoor Malik (Lahore-based)',
    suggested_compatibility: 89,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// DIFFICULT TO MATCH PROFILES (ADMIN)
// ────────────────────────────────────────────────────────────────────────────
export const mockZeroCandidateProfiles: ZeroCandidateAlert[] = [
  {
    id: 'zc-1',
    profile_code: 'PK-3021',
    name: 'Dr. Shahbaz Alam',
    age: 34,
    gender: 'MALE',
    city: 'Lahore',
    strict_filters: ['Doctor (MBBS/FCPS) only', 'Caste Syed only', 'Age 22-24 strictly'],
    candidates_found: 0,
    manager_recommendation: 'Relax age limit to 26 and allow Allied Healthcare degrees',
  },
  {
    id: 'zc-2',
    profile_code: 'PK-4109',
    name: 'Hina Qureshi',
    age: 31,
    gender: 'FEMALE',
    city: 'Karachi',
    strict_filters: ['Must relocate to UK/USA only', 'Govt Grade 18+ officer', 'Never Married strictly'],
    candidates_found: 1,
    manager_recommendation: 'Recommend expanding relocation to Canada/Gulf regions',
  },
  {
    id: 'zc-3',
    profile_code: 'PK-5912',
    name: 'Hamza Farooq',
    age: 36,
    gender: 'MALE',
    city: 'Rawalpindi',
    strict_filters: ['Caste Raja/Janjua only', 'Height 5ft 8in+ minimum', 'Master degree minimum'],
    candidates_found: 2,
    manager_recommendation: 'Caste flexibility could double matching pool in Twin Cities',
  },
];
