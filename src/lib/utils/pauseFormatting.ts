import type { ProfilePauseInfo } from '@/lib/types/database.types';

/**
 * Formats an ISO timestamp as a crisp display date in Asia/Karachi timezone (e.g. "27 Nov 2026").
 */
export function formatPauseDate(iso: string | null | undefined): string {
  if (!iso) return 'No end timer';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns true when a pause reminder deadline has passed.
 */
export function isPauseReminderDue(pauseInfo?: ProfilePauseInfo | null): boolean {
  if (!pauseInfo?.pause_until) return false;
  const ts = new Date(pauseInfo.pause_until).getTime();
  if (isNaN(ts)) return false;
  return ts <= Date.now();
}

/**
 * Returns whole days remaining until pause_until (can be <= 0 when due), or null if indefinite.
 */
export function getPauseDaysRemaining(pauseInfo?: ProfilePauseInfo | null): number | null {
  if (!pauseInfo?.pause_until) return null;
  const ts = new Date(pauseInfo.pause_until).getTime();
  if (isNaN(ts)) return null;
  const diffMs = ts - Date.now();
  return Math.ceil(diffMs / 86_400_000);
}

/**
 * Formats compact badge text and state for Kanban cards, Directory cards, and banners.
 */
export function formatPauseBadge(pauseInfo?: ProfilePauseInfo | null): {
  label: string;
  isDue: boolean;
  isIndefinite: boolean;
} {
  if (!pauseInfo || !pauseInfo.pause_until) {
    return { label: 'Paused', isDue: false, isIndefinite: true };
  }

  if (isPauseReminderDue(pauseInfo)) {
    return { label: 'Reminder Due', isDue: true, isIndefinite: false };
  }

  const days = getPauseDaysRemaining(pauseInfo);
  if (days === null) {
    return { label: 'Paused', isDue: false, isIndefinite: true };
  }
  if (days <= 0) {
    return { label: 'Due Today', isDue: false, isIndefinite: false };
  }
  return { label: `${days}d left`, isDue: false, isIndefinite: false };
}

