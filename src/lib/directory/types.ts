export type FilterMode = 'all' | 'exact' | 'similar';

export type CardPastelTint = 'orange' | 'navy' | 'darkGreen' | 'golden' | 'pink' | 'green' | 'beige';

export interface DirectoryEntry {
  id: string;
  profileId: string;
  cnic: string;
  fullName: string;
  phone: string;
  assignedStaff: string;
  requestDate: string; // ISO date string
  boardStage: 'new' | 'first' | 'second' | 'responded' | 'done' | 'pause' | 'feedback' | 'archive';
  boardStageColor: string;
  cardBg: string;

  // Personal Information
  age: number;
  dob: string;
  gender: 'MALE' | 'FEMALE';
  maritalStatus: 'NEVER_MARRIED' | 'DIVORCED' | 'WIDOWED' | 'ANNULLED';
  numberOfChildren: number;
  motherTongue: string;

  // Physical Information
  heightCm: number;
  heightInches: number; // e.g. 69 for 5'9"
  weightKg: number;
  complexion: string;
  hasDisability: boolean;

  // Education Records
  qualification: string; // Degree e.g. "Bachelors in CS", "MBBS", "CA"
  institutionName: string; // Institute e.g. "LUMS", "NUST", "IBA"
  fieldOfStudy: string;

  // Employment Records
  jobTitle: string; // Profession e.g. "Software Engineer"
  organizationName: string; // Employer e.g. "TechLogix", "Habib Bank"

  // Income Information
  monthlyIncomeMin: number; // in thousands PKR e.g. 150 = 150k
  monthlyIncomeMax: number;

  // Religion Information
  religionName: string;
  sectName: string;
  casteName: string;

  // Locations
  currentCountry: string;
  currentCity: string;
  permanentCity: string;

  // Residency & Family
  familyType: 'Nuclear' | 'Joint' | 'Extended';
  fatherProfession: string;
  livingWith: string;
  houseStatus: string;

  // Lifestyle
  prayer: string; // e.g. '5 Times Daily', 'Regularly', 'Sometimes', 'Fridays Only'
  beard: string;  // e.g. 'Sunnah Beard', 'Trimmed Beard', 'Clean Shaven'
  hijab: string;  // e.g. 'Abaya & Hijab', 'Hijab Only', 'Dupatta', 'None'
  smoking: string; // e.g. 'Non-Smoker', 'Occasional', 'Regular'

  // Full raw profile payload for RequestDetailsSheet
  profileData?: Record<string, unknown>;
}

export type FilterType = 'text' | 'multi' | 'number';

export interface BaseFilterConfig {
  id: string;
  label: string;
  section: 'key' | 'more';
  tint: CardPastelTint;
  tintHex: string;
  dbColumn: string;
  helperText?: string;
}

export interface TextFilterConfig extends BaseFilterConfig {
  type: 'text';
  placeholder: string;
}

export interface MultiSelectFilterConfig extends BaseFilterConfig {
  type: 'multi';
  placeholder?: string;
  dependsOn?: string; // e.g. 'country' for 'city'
}

export interface NumericFilterConfig extends BaseFilterConfig {
  type: 'number';
  min: number;
  max: number;
  step: number;
  unit: string;
  isHeight?: boolean;
  isIncome?: boolean;
}

export type FilterConfig = TextFilterConfig | MultiSelectFilterConfig | NumericFilterConfig;

export interface NumericFilterValue {
  min: number | null;
  max: number | null;
}

export interface ActiveFilterValues {
  search: string;
  age: NumericFilterValue;
  gender: string[];
  maritalStatus: string[];
  profession: string[];
  caste: string[];
  country: string[];
  city: string[];
  degree: string[];
  height: NumericFilterValue;
  income: NumericFilterValue;
  sect: string[];
  prayer: string[];
  motherTongue: string[];
  complexion: string[];
  institute: string[];
  employer: string[];
  permanentCity: string[];
  familyType: string[];
  fatherProfession: string[];
  beardHijab: string[];
  smoking: string[];
}

export interface FilterMatchDetail {
  filterId: string;
  filterLabel: string;
  valueDisplay: string;
}

export interface EntryWithSimilarMatch {
  entry: DirectoryEntry;
  matchedCount: number;
  totalActiveFilters: number;
  matchedDetails: FilterMatchDetail[];
  unmatchedLabels: string[];
}
