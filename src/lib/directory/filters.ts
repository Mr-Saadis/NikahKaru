import type {
  DirectoryEntry,
  ActiveFilterValues,
  FilterMode,
  FilterMatchDetail,
  EntryWithSimilarMatch,
  NumericFilterValue,
} from './types';
import { FILTER_CONFIGS } from './config';

// Normalization helper for resilient value matching
export const norm = (s: string) => (s || '').toLowerCase().replace(/[\s_\-]/g, '');

export const STATUS_MAP: Record<string, string> = {
  NEVER_MARRIED: 'Never Married',
  MARRIED: 'Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
  SEPARATED: 'Separated',
  ANNULLED: 'Annulled',
};

export const PRAYER_MAP: Record<string, string> = {
  HIGHLY_PRACTICING: 'Highly Practicing',
  PRACTICING: 'Practicing',
  MODERATE: 'Moderate',
  OTHER: 'Other',
};

export const SMOKING_MAP: Record<string, string> = {
  NO: 'No',
  YES: 'Yes',
  OCCASIONALLY: 'Occasionally',
};

export const FAMILY_MAP: Record<string, string> = {
  JOINT: 'Joint',
  SEPARATE: 'Separate',
};

export const ENUM_OPTIONS: Record<string, string[]> = {
  gender: ['Male', 'Female'],
  maritalStatus: ['Never Married', 'Married', 'Divorced', 'Widowed', 'Separated'],
  complexion: ['Very Fair', 'Fair', 'Whitish', 'Wheatish', 'Wheatish Brown', 'Brown', 'Dark Brown', 'Dark'],
  prayer: ['Highly Practicing', 'Practicing', 'Moderate', 'Other'],
  beardHijab: ['Yes', 'No'],
  smoking: ['No', 'Yes', 'Occasionally'],
  familyType: ['Joint', 'Separate'],
};

export interface FilterReferenceData {
  countries?: { id: number; name_en: string }[];
  cities?: { id: number; country_id?: number | null; name_en: string }[];
  sects?: { id: number; name_en: string }[];
  castes?: { id: number; name_en: string }[];
  motherTongues?: { id: number; name_en: string }[];
  educationLevels?: { id: number; name_en: string }[];
  occupations?: { id: number; name_en: string }[];
}

/**
 * Format height inches to standard "5′ 9″" display string
 */
export function formatHeight(inches: number | null): string {
  if (inches === null || inches === undefined || isNaN(inches)) return 'Any';
  const feet = Math.floor(inches / 12);
  const rem = inches % 12;
  return `${feet}′ ${rem}″`;
}

/**
 * Parse various height input strings into total inches
 * Supports: "5 9", "5'9", "5'9\"", "5.9", "5ft 9", "69"
 */
export function parseHeightInput(input: string): number | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase().replace(/["”]/g, '');

  if (clean === 'any' || clean === '') return null;

  // Direct number check (e.g. "69" total inches)
  const directNum = Number(clean);
  if (!isNaN(directNum) && directNum >= 55 && directNum <= 80) {
    return directNum;
  }

  // Regex matches: 5'9, 5 9, 5.9, 5ft 9, 5ft9
  const match = clean.match(/^(\d{1})[\s'’.ft\-]+(\d{1,2})$/);
  if (match) {
    const feet = parseInt(match[1], 10);
    const inches = parseInt(match[2], 10);
    if (feet >= 4 && feet <= 7 && inches >= 0 && inches < 12) {
      return feet * 12 + inches;
    }
  }

  // Just feet e.g. "5'", "5ft", "6"
  const feetOnlyMatch = clean.match(/^(\d{1})(?:'|ft)?$/);
  if (feetOnlyMatch) {
    const feet = parseInt(feetOnlyMatch[1], 10);
    if (feet >= 4 && feet <= 7) {
      return feet * 12;
    }
  }

  return null;
}

/**
 * Format numeric filter collapsed summary text
 */
export function formatNumericSummary(
  val: NumericFilterValue,
  unit: string,
  isHeight?: boolean,
  isIncome?: boolean
): string {
  const { min, max } = val;

  if (min === null && max === null) return 'Any';
  if (min !== null && max !== null) {
    if (isHeight) return `${formatHeight(min)} – ${formatHeight(max)}`;
    if (isIncome) return `Rs ${min}k – ${max}k`;
    return `${min} – ${max} ${unit}`;
  }
  if (min !== null) {
    if (isHeight) return `From ${formatHeight(min)}`;
    if (isIncome) return `From Rs ${min}k`;
    return `From ${min} ${unit}`;
  }
  if (max !== null) {
    if (isHeight) return `Up to ${formatHeight(max)}`;
    if (isIncome) return `Up to Rs ${max}k`;
    return `Up to ${max} ${unit}`;
  }

  return 'Any';
}

/**
 * Check if a filter has active criteria
 */
export function isFilterActive(filterId: keyof ActiveFilterValues, filters: ActiveFilterValues): boolean {
  const val = filters[filterId];
  if (val === undefined || val === null) return false;

  if (typeof val === 'string') {
    return val.trim().length > 0;
  }
  if (Array.isArray(val)) {
    return val.length > 0;
  }
  if (typeof val === 'object' && 'min' in val && 'max' in val) {
    return val.min !== null || val.max !== null;
  }
  return false;
}

/**
 * Count total number of currently active filters
 */
export function countActiveFilters(filters: ActiveFilterValues): number {
  return FILTER_CONFIGS.reduce((count, config) => {
    return count + (isFilterActive(config.id as keyof ActiveFilterValues, filters) ? 1 : 0);
  }, 0);
}

/**
 * Clean search query: lowercase and remove spaces and dashes
 */
export function normalizeSearchString(s: string): string {
  return (s || '').toLowerCase().replace(/[\s\-]/g, '');
}

/**
 * Check if an entry satisfies an individual filter criteria
 */
export function matchSingleFilter(
  entry: DirectoryEntry,
  filterId: keyof ActiveFilterValues,
  filters: ActiveFilterValues
): { matches: boolean; detail?: FilterMatchDetail } {
  const cfg = FILTER_CONFIGS.find((c) => c.id === filterId);
  if (!cfg) return { matches: true };

  const val = filters[filterId];

  switch (filterId) {
    case 'search': {
      const q = normalizeSearchString(val as string);
      if (!q) return { matches: true };
      const nameMatch = normalizeSearchString(entry.fullName).includes(q);
      const cnicMatch = normalizeSearchString(entry.cnic).includes(q);
      const phoneMatch = normalizeSearchString(entry.phone).includes(q);
      const ok = nameMatch || cnicMatch || phoneMatch;
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Search', valueDisplay: (val as string).trim() } : undefined,
      };
    }

    case 'age': {
      const numVal = val as NumericFilterValue;
      if (numVal.min === null && numVal.max === null) return { matches: true };
      const minOk = numVal.min === null || entry.age >= numVal.min;
      const maxOk = numVal.max === null || entry.age <= numVal.max;
      const ok = minOk && maxOk;
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Age', valueDisplay: `${entry.age} yrs` } : undefined,
      };
    }

    case 'gender': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const entryGenderDisplay = entry.gender === 'MALE' ? 'Male' : 'Female';
      const ok = list.some((g) => norm(g) === norm(entry.gender) || norm(g) === norm(entryGenderDisplay));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Gender', valueDisplay: entryGenderDisplay } : undefined,
      };
    }

    case 'maritalStatus': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const displayStatus = STATUS_MAP[entry.maritalStatus] || entry.maritalStatus;
      const ok = list.some((s) => norm(s) === norm(entry.maritalStatus) || norm(s) === norm(displayStatus));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Marital status', valueDisplay: displayStatus } : undefined,
      };
    }

    case 'profession': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((p) => {
        const np = norm(p);
        const nj = norm(entry.jobTitle);
        return nj.includes(np) || np.includes(nj);
      });
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Profession', valueDisplay: entry.jobTitle } : undefined,
      };
    }

    case 'caste': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((c) => norm(c) === norm(entry.casteName));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Caste', valueDisplay: entry.casteName } : undefined,
      };
    }

    case 'country': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((c) => norm(c) === norm(entry.currentCountry));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Country', valueDisplay: entry.currentCountry } : undefined,
      };
    }

    case 'city': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((c) => norm(c) === norm(entry.currentCity));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'City', valueDisplay: entry.currentCity } : undefined,
      };
    }

    case 'degree': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((d) => {
        const nd = norm(d);
        const nq = norm(entry.qualification);
        return nq.includes(nd) || nd.includes(nq);
      });
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Degree', valueDisplay: entry.qualification } : undefined,
      };
    }

    case 'height': {
      const numVal = val as NumericFilterValue;
      if (numVal.min === null && numVal.max === null) return { matches: true };
      const minOk = numVal.min === null || entry.heightInches >= numVal.min;
      const maxOk = numVal.max === null || entry.heightInches <= numVal.max;
      const ok = minOk && maxOk;
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Height', valueDisplay: formatHeight(entry.heightInches) } : undefined,
      };
    }

    case 'income': {
      const numVal = val as NumericFilterValue;
      if (numVal.min === null && numVal.max === null) return { matches: true };
      const minOk = numVal.min === null || entry.monthlyIncomeMax >= numVal.min;
      const maxOk = numVal.max === null || entry.monthlyIncomeMin <= numVal.max;
      const ok = minOk && maxOk;
      return {
        matches: ok,
        detail: ok
          ? {
              filterId,
              filterLabel: 'Income',
              valueDisplay: `Rs ${entry.monthlyIncomeMin}k - ${entry.monthlyIncomeMax}k`,
            }
          : undefined,
      };
    }

    case 'sect': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((s) => norm(s) === norm(entry.sectName));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Sect', valueDisplay: entry.sectName } : undefined,
      };
    }

    case 'prayer': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const displayPrayer = PRAYER_MAP[entry.prayer] || entry.prayer;
      const ok = list.some((p) => norm(p) === norm(entry.prayer) || norm(p) === norm(displayPrayer));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Prayer', valueDisplay: displayPrayer } : undefined,
      };
    }

    case 'motherTongue': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((m) => norm(m) === norm(entry.motherTongue));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Mother tongue', valueDisplay: entry.motherTongue } : undefined,
      };
    }

    case 'complexion': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((c) => norm(c) === norm(entry.complexion));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Complexion', valueDisplay: entry.complexion } : undefined,
      };
    }

    case 'institute': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((i) => {
        const ni = norm(i);
        const nInst = norm(entry.institutionName);
        return nInst.includes(ni) || ni.includes(nInst);
      });
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Institute', valueDisplay: entry.institutionName } : undefined,
      };
    }

    case 'employer': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((e) => {
        const ne = norm(e);
        const nEmp = norm(entry.organizationName);
        return nEmp.includes(ne) || ne.includes(nEmp);
      });
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Employer', valueDisplay: entry.organizationName } : undefined,
      };
    }

    case 'permanentCity': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((c) => norm(c) === norm(entry.permanentCity));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Permanent city', valueDisplay: entry.permanentCity } : undefined,
      };
    }

    case 'familyType': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const displayFam = FAMILY_MAP[entry.familyType] || entry.familyType;
      const ok = list.some((f) => norm(f) === norm(entry.familyType) || norm(f) === norm(displayFam));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Family type', valueDisplay: displayFam } : undefined,
      };
    }

    case 'fatherProfession': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const ok = list.some((f) => {
        const nf = norm(f);
        const nProf = norm(entry.fatherProfession);
        return nProf.includes(nf) || nf.includes(nProf);
      });
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: "Father's profession", valueDisplay: entry.fatherProfession } : undefined,
      };
    }

    case 'beardHijab': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const checkVal = entry.gender === 'MALE' ? entry.beard : entry.hijab;
      const displayVal = checkVal === 'YES' ? 'Yes' : checkVal === 'NO' ? 'No' : checkVal;
      const ok = list.some((b) => norm(b) === norm(checkVal) || norm(b) === norm(displayVal));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Beard / Hijab', valueDisplay: displayVal } : undefined,
      };
    }

    case 'smoking': {
      const list = val as string[];
      if (!list || list.length === 0) return { matches: true };
      const displaySmoking = SMOKING_MAP[entry.smoking] || entry.smoking;
      const ok = list.some((s) => norm(s) === norm(entry.smoking) || norm(s) === norm(displaySmoking));
      return {
        matches: ok,
        detail: ok ? { filterId, filterLabel: 'Smoking', valueDisplay: displaySmoking } : undefined,
      };
    }

    default:
      return { matches: true };
  }
}

/**
 * Get distinct options with entry counts for a multi-select filter.
 * Combines reference data / enums from add-profile with real entry counts.
 */
export function getFilterOptionCounts(
  entries: DirectoryEntry[],
  filterId: keyof ActiveFilterValues,
  activeFilters?: ActiveFilterValues,
  referenceData?: FilterReferenceData
): { value: string; count: number }[] {
  const countsMap = new Map<string, number>();

  // Helper to initialize an option in the map with 0 count
  const initOption = (val: string) => {
    if (val && val.trim().length > 0 && !countsMap.has(val)) {
      countsMap.set(val, 0);
    }
  };

  // 1. Prepopulate options from enums or reference tables (from add-profile schema)
  if (ENUM_OPTIONS[filterId]) {
    for (const opt of ENUM_OPTIONS[filterId]) {
      initOption(opt);
    }
  } else if (referenceData) {
    switch (filterId) {
      case 'country':
        referenceData.countries?.forEach((c) => initOption(c.name_en));
        break;
      case 'city': {
        if (activeFilters && activeFilters.country && activeFilters.country.length > 0) {
          const selectedCountryNames = activeFilters.country.map((c) => norm(c));
          const matchingCountryIds = new Set(
            referenceData.countries
              ?.filter((c) => selectedCountryNames.includes(norm(c.name_en)))
              .map((c) => c.id) || []
          );
          referenceData.cities
            ?.filter((ct) => ct.country_id != null && matchingCountryIds.has(ct.country_id))
            .forEach((ct) => initOption(ct.name_en));
        } else {
          referenceData.cities?.forEach((ct) => initOption(ct.name_en));
        }
        break;
      }
      case 'permanentCity':
        referenceData.cities?.forEach((ct) => initOption(ct.name_en));
        break;
      case 'sect':
        referenceData.sects?.forEach((s) => initOption(s.name_en));
        break;
      case 'caste':
        referenceData.castes?.forEach((c) => initOption(c.name_en));
        break;
      case 'motherTongue':
        referenceData.motherTongues?.forEach((m) => initOption(m.name_en));
        break;
      case 'degree':
        referenceData.educationLevels?.forEach((e) => initOption(e.name_en));
        break;
      case 'profession':
        referenceData.occupations?.forEach((o) => initOption(o.name_en));
        break;
    }
  }

  // 2. Count matching entries
  let targetEntries = entries;
  if (filterId === 'city' && activeFilters && activeFilters.country.length > 0) {
    targetEntries = entries.filter((e) =>
      activeFilters.country.some((c) => norm(c) === norm(e.currentCountry))
    );
  }

  for (const entry of targetEntries) {
    let val: string | null = null;
    switch (filterId) {
      case 'gender':
        val = entry.gender === 'MALE' ? 'Male' : 'Female';
        break;
      case 'maritalStatus':
        val = STATUS_MAP[entry.maritalStatus] || entry.maritalStatus;
        break;
      case 'profession':
        val = entry.jobTitle;
        break;
      case 'caste':
        val = entry.casteName;
        break;
      case 'country':
        val = entry.currentCountry;
        break;
      case 'city':
        val = entry.currentCity;
        break;
      case 'degree':
        val = entry.qualification;
        break;
      case 'sect':
        val = entry.sectName;
        break;
      case 'prayer':
        val = PRAYER_MAP[entry.prayer] || entry.prayer;
        break;
      case 'motherTongue':
        val = entry.motherTongue;
        break;
      case 'complexion':
        val = entry.complexion;
        break;
      case 'institute':
        val = entry.institutionName;
        break;
      case 'employer':
        val = entry.organizationName;
        break;
      case 'permanentCity':
        val = entry.permanentCity;
        break;
      case 'familyType':
        val = FAMILY_MAP[entry.familyType] || entry.familyType;
        break;
      case 'fatherProfession':
        val = entry.fatherProfession;
        break;
      case 'beardHijab': {
        const raw = entry.gender === 'MALE' ? entry.beard : entry.hijab;
        val = raw === 'YES' ? 'Yes' : raw === 'NO' ? 'No' : raw;
        if (val === 'N/A' || !val) val = null;
        break;
      }
      case 'smoking':
        val = SMOKING_MAP[entry.smoking] || entry.smoking;
        break;
      default:
        break;
    }

    if (val && val.trim().length > 0 && val !== 'N/A') {
      const cleanVal = val.trim();
      // Look for case-insensitive match in existing keys
      let foundKey: string | null = null;
      for (const k of countsMap.keys()) {
        if (norm(k) === norm(cleanVal)) {
          foundKey = k;
          break;
        }
      }
      const keyToUse = foundKey || cleanVal;
      countsMap.set(keyToUse, (countsMap.get(keyToUse) || 0) + 1);
    }
  }

  const result: { value: string; count: number }[] = [];
  for (const [value, count] of countsMap.entries()) {
    result.push({ value, count });
  }

  // Sort: Options with entries (count > 0) first sorted by count descending,
  // then options with 0 entries sorted alphabetically A-Z
  result.sort((a, b) => {
    if (a.count > 0 && b.count === 0) return -1;
    if (a.count === 0 && b.count > 0) return 1;
    if (b.count !== a.count) return b.count - a.count;
    return a.value.localeCompare(b.value);
  });

  return result;
}

/**
 * Apply filters across all entries based on the current mode
 */
export function applyFilters(
  entries: DirectoryEntry[],
  filters: ActiveFilterValues,
  mode: FilterMode
): DirectoryEntry[] | EntryWithSimilarMatch[] {
  const activeCount = countActiveFilters(filters);

  // No active filters: show everything
  if (activeCount === 0) {
    return entries;
  }

  // In All mode: OR logic — show anyone matching AT LEAST ONE active filter
  // (same population as Similar, but without ranking/match indicators)
  if (mode === 'all') {
    const activeConfigs = FILTER_CONFIGS.filter((cfg) =>
      isFilterActive(cfg.id as keyof ActiveFilterValues, filters)
    );
    return entries.filter((entry) =>
      activeConfigs.some((cfg) => {
        const { matches } = matchSingleFilter(entry, cfg.id as keyof ActiveFilterValues, filters);
        return matches;
      })
    );
  }

  const activeConfigs = FILTER_CONFIGS.filter((cfg) =>
    isFilterActive(cfg.id as keyof ActiveFilterValues, filters)
  );

  if (mode === 'exact') {
    return entries.filter((entry) => {
      return activeConfigs.every((cfg) => {
        const { matches } = matchSingleFilter(entry, cfg.id as keyof ActiveFilterValues, filters);
        return matches;
      });
    });
  }

  // Mode === 'similar':
  // Match AT LEAST ONE active filter, sorted by matched count descending, then by id
  const similarResults: EntryWithSimilarMatch[] = [];

  for (const entry of entries) {
    const matchedDetails: FilterMatchDetail[] = [];
    const unmatchedLabels: string[] = [];

    for (const cfg of activeConfigs) {
      const res = matchSingleFilter(entry, cfg.id as keyof ActiveFilterValues, filters);
      if (res.matches && res.detail) {
        matchedDetails.push(res.detail);
      } else {
        unmatchedLabels.push(cfg.label);
      }
    }

    if (matchedDetails.length > 0) {
      similarResults.push({
        entry,
        matchedCount: matchedDetails.length,
        totalActiveFilters: activeConfigs.length,
        matchedDetails,
        unmatchedLabels,
      });
    }
  }

  // Sort by number of matched filters (descending), then by id ascending
  similarResults.sort((a, b) => {
    if (b.matchedCount !== a.matchedCount) {
      return b.matchedCount - a.matchedCount;
    }
    return a.entry.id.localeCompare(b.entry.id);
  });

  return similarResults;
}

/**
 * Calculate live counts for All, Exact, and Similar modes given active filters
 */
export function calculateModeCounts(
  entries: DirectoryEntry[],
  filters: ActiveFilterValues
): { allCount: number; exactCount: number; similarCount: number } {
  const activeCount = countActiveFilters(filters);

  // No filters active → all counts are the full list (Exact/Similar are 0)
  if (activeCount === 0) {
    return { allCount: entries.length, exactCount: 0, similarCount: 0 };
  }

  const all = applyFilters(entries, filters, 'all') as DirectoryEntry[];
  const exact = applyFilters(entries, filters, 'exact') as DirectoryEntry[];
  const similar = applyFilters(entries, filters, 'similar') as EntryWithSimilarMatch[];

  return {
    allCount: all.length,
    exactCount: exact.length,
    similarCount: similar.length,
  };
}
