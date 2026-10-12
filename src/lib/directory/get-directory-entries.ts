import type { DirectoryEntry } from './types';
import { MOCK_DIRECTORY_ENTRIES } from './mock-data';

/**
 * Single data-access function for directory entries.
 * Can be swapped in the future for database/API query without modifying UI code.
 */
export async function getDirectoryEntries(): Promise<DirectoryEntry[]> {
  // Pure in-memory mock return, ready for async DB query replacement
  return MOCK_DIRECTORY_ENTRIES;
}
