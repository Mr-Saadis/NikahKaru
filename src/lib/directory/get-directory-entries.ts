import type { DirectoryEntry, ActiveFilterValues, FilterMode } from './types';

export function serializeFiltersToParams(
  filters?: ActiveFilterValues,
  mode?: FilterMode
): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;

  if (mode) params.set('mode', mode);

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.gender && filters.gender.length > 0) {
    params.set('gender', filters.gender.join(','));
  }

  if (filters.maritalStatus && filters.maritalStatus.length > 0) {
    params.set('maritalStatus', filters.maritalStatus.join(','));
  }

  if (filters.age) {
    if (filters.age.min !== null) params.set('minAge', filters.age.min.toString());
    if (filters.age.max !== null) params.set('maxAge', filters.age.max.toString());
  }

  if (filters.height) {
    if (filters.height.min !== null) params.set('minHeight', filters.height.min.toString());
    if (filters.height.max !== null) params.set('maxHeight', filters.height.max.toString());
  }

  if (filters.income) {
    if (filters.income.min !== null) params.set('minIncome', filters.income.min.toString());
    if (filters.income.max !== null) params.set('maxIncome', filters.income.max.toString());
  }

  const multiKeys: (keyof ActiveFilterValues)[] = [
    'country',
    'city',
    'sect',
    'caste',
    'motherTongue',
    'complexion',
    'permanentCity',
    'familyType',
    'prayer',
    'smoking',
    'beardHijab',
    'profession',
    'degree',
    'institute',
    'employer',
    'fatherProfession',
  ];

  for (const key of multiKeys) {
    const val = filters[key];
    if (Array.isArray(val) && val.length > 0) {
      params.set(key, val.join(','));
    }
  }

  return params;
}

import { getCachedEntries, setCachedEntries } from './directory-cache';

/**
 * Data-access function for directory entries.
 * Checks session query cache first (Rule 2.1).
 * Calls /api/directory with serialized active filters and mode on cache miss.
 * Excludes DRAFT profiles by default.
 */
export async function getDirectoryEntries(
  filters?: ActiveFilterValues,
  mode?: FilterMode,
  signal?: AbortSignal
): Promise<DirectoryEntry[]> {
  try {
    const params = serializeFiltersToParams(filters, mode);
    const queryString = params.toString();

    // 1. Check session cache first (Rule 2.1 — zero duplicate calls)
    const cached = getCachedEntries(queryString);
    if (cached) {
      return cached;
    }

    const url = queryString ? `/api/directory?${queryString}` : '/api/directory';

    const res = await fetch(url, { signal, cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch directory entries');
    }

    const json = await res.json();
    const data: DirectoryEntry[] = json.data || [];

    // 2. Cache successful response
    setCachedEntries(queryString, data);

    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.error('Error in getDirectoryEntries:', err);
    return [];
  }
}
