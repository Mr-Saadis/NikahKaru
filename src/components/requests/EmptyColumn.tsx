'use client';

import { SwapIcon, CloudIcon, UsersIcon, CalendarIcon } from './icons';

// ============================================================
// EmptyColumn — Hatched placeholder for empty columns
// ============================================================

export default function EmptyColumn() {
  return (
    <div
      style={{
        height: 120,
        borderRadius: 20,
        background: `repeating-linear-gradient(135deg, transparent 0px, transparent 6px, rgba(31,59,52,0.05) 6px, rgba(31,59,52,0.05) 7px), #F2EDE1`, // Cannoli Cream background with Pine Grove hatched lines
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: 'rgba(31,59,52,0.25)', // Pine Grove faded
      }}
    >
      <SwapIcon size={18} />
      <CloudIcon size={18} />
      <UsersIcon size={18} />
      <CalendarIcon size={18} />
    </div>
  );
}
