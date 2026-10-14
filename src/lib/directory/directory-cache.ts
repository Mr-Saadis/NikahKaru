import type { DirectoryEntry } from './types';

// In-memory session cache for directory queries
const directoryCache = new Map<string, DirectoryEntry[]>();

/**
 * Get cached entries for a given query string key
 */
export function getCachedEntries(key: string): DirectoryEntry[] | null {
  return directoryCache.get(key) || null;
}

/**
 * Store entries in cache
 */
export function setCachedEntries(key: string, data: DirectoryEntry[]): void {
  directoryCache.set(key, data);
}

/**
 * Invalidate / clear entire directory cache (e.g. on Supabase Realtime INSERT/UPDATE/DELETE)
 */
export function clearDirectoryCache(): void {
  directoryCache.clear();
}
