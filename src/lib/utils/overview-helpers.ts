// ============================================================================
// Overview Formatting Helpers — Strict Phase B Specification
// - Boxy badges (max 4px radius)
// - NO dots, bullets, or middle dots
// - Asia/Karachi local time formatting
// - Waiting hours: "3h" (<24h), "2d 4h" (>=24h)
// ============================================================================

/**
 * Format waiting hours into compact text:
 * Under 24h: "3h"
 * 24h and above: "2d 4h"
 */
export function formatWaitingHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || isNaN(hours)) return '0h';
  if (hours < 1) return '<1h';
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

/**
 * Format relative time without middle dots or special bullets
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '—';
  const timestamp = new Date(isoString).getTime();
  if (isNaN(timestamp)) return '—';
  const diff = Date.now() - timestamp;
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  // Display short date in Asia/Karachi timezone
  return formatKarachiDate(isoString, { day: '2-digit', month: 'short' });
}

/**
 * Format ISO string into Asia/Karachi date
 */
export function formatKarachiDate(
  isoString?: string | null,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }
): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      ...options,
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Format current timestamp into Asia/Karachi time "hh:mm"
 */
export function formatKarachiTime(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '--:--';
  }
}

/**
 * Period delta calculation with strict null/zero handling
 */
export function formatDelta(
  current: number,
  prev: number | null | undefined
): { text: string; isPositive: boolean; isZero: boolean } | null {
  if (prev === null || prev === undefined) return null;
  if (prev === 0) {
    if (current === 0) return { text: '0%', isPositive: true, isZero: true };
    return { text: '+100%', isPositive: true, isZero: false };
  }
  const diff = current - prev;
  const pct = Math.round((diff / prev) * 100);
  return {
    text: `${pct >= 0 ? '+' : ''}${pct}%`,
    isPositive: pct >= 0,
    isZero: pct === 0,
  };
}

/**
 * SLA Pill Badge (Flat, Rectangular, No dots)
 */
export function getSlaBadge(slaState: 'fresh' | 'warning' | 'overdue' | string) {
  switch (slaState?.toLowerCase()) {
    case 'overdue':
      return {
        label: 'OVERDUE',
        bg: 'bg-[#FEE2E2]',
        text: 'text-[#DC2626]',
        border: 'border-[#FCA5A5]',
      };
    case 'warning':
      return {
        label: 'WARNING',
        bg: 'bg-[#FEF3C7]',
        text: 'text-[#D97706]',
        border: 'border-[#FCD34D]',
      };
    case 'fresh':
    default:
      return {
        label: 'FRESH',
        bg: 'bg-[#F2EDE1]',
        text: 'text-[#4E473D]',
        border: 'border-[#E2D9C8]',
      };
  }
}

/**
 * Agent Workload Load Badge (Rectangular, No dots)
 */
export function getLoadBadge(load: 'OVERLOADED' | 'BALANCED' | 'AVAILABLE' | string) {
  switch (load?.toUpperCase()) {
    case 'OVERLOADED':
      return {
        label: 'OVERLOADED',
        bg: 'bg-[#FEE2E2]',
        text: 'text-[#991B1B]',
        border: 'border-[#FCA5A5]',
      };
    case 'BALANCED':
      return {
        label: 'BALANCED',
        bg: 'bg-[#EBF2F7]',
        text: 'text-[#2F3E51]',
        border: 'border-[#D0DFEA]',
      };
    case 'AVAILABLE':
    default:
      return {
        label: 'AVAILABLE',
        bg: 'bg-[#E5EFE9]',
        text: 'text-[#166534]',
        border: 'border-[#C2DDD0]',
      };
  }
}

/**
 * Request & Profile Status Badges (Rectangular, No dots)
 */
export function getStatusBadge(status: string | null | undefined) {
  const s = (status || '').toUpperCase();
  if (s === 'IN_REVIEW' || s === 'RESPONDED') {
    return { label: 'READY', bg: 'bg-[#EBF2F7]', text: 'text-[#2F3E51]', border: 'border-[#D0DFEA]' };
  }
  if (s === 'PENDING' || s === 'PENDING_OTHER' || s === 'FIRST' || s === 'SECOND' || s === 'NEW') {
    return { label: 'WITH MANAGER', bg: 'bg-[#FEF3C7]', text: 'text-[#8B6122]', border: 'border-[#FDE68A]' };
  }
  if (s === 'DOWNLOADED') {
    return { label: 'SHARED WITH FAMILY', bg: 'bg-[#E5EFE9]', text: 'text-[#1F3B34]', border: 'border-[#C2DDD0]' };
  }
  if (s === 'COMPLETED' || s === 'COMPLETED_OUTSIDE_SYSTEM' || s === 'DONE') {
    return { label: 'COMPLETED', bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#A7F3D0]' };
  }
  if (s === 'ACTIVE') {
    return { label: 'ACTIVE', bg: 'bg-[#E5EFE9]', text: 'text-[#166534]', border: 'border-[#C2DDD0]' };
  }
  if (s === 'DRAFT') {
    return { label: 'DRAFT', bg: 'bg-[#FEF3C7]', text: 'text-[#8B6122]', border: 'border-[#FDE68A]' };
  }
  if (s === 'PAUSED') {
    return { label: 'PAUSED', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', border: 'border-[#E5E7EB]' };
  }
  return { label: s || '—', bg: 'bg-[#FAF8F5]', text: 'text-[#7D766C]', border: 'border-[#E9E4DC]' };
}

/**
 * Turnaround Time Traffic Light Text Badge (Low / Medium / High)
 */
export function getTurnaroundBadge(hours: number | null | undefined) {
  if (hours === null || hours === undefined) {
    return { label: '—', bg: 'bg-[#FAF8F5]', text: 'text-[#7D766C]', border: 'border-[#E9E4DC]' };
  }
  if (hours < 6) {
    return { label: 'LOW', bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#A7F3D0]' };
  }
  if (hours <= 24) {
    return { label: 'MEDIUM', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#FCD34D]' };
  }
  return { label: 'HIGH', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', border: 'border-[#FCA5A5]' };
}
