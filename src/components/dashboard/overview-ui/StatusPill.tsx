import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type StatusVariant = 'green' | 'brand' | 'amber' | 'red' | 'muted';

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  icon?: LucideIcon;
  size?: 'xs' | 'sm';
  className?: string;
}

export function getVariantFromStatus(status?: string | null): StatusVariant {
  const s = (status || '').toUpperCase();

  if (
    s === 'ACTIVE' ||
    s === 'APPROVED' ||
    s === 'COMPLETED' ||
    s === 'RELEASED' ||
    s === 'PAID' ||
    s === 'AVAILABLE' ||
    s === 'FRESH' ||
    s === 'LOW'
  ) {
    return 'green';
  }

  if (
    s === 'IN_PROGRESS' ||
    s === 'PREPARING' ||
    s === 'WITH_MANAGER' ||
    s === 'SUBMITTED' ||
    s === 'READY' ||
    s === 'RESPONDED' ||
    s === 'BALANCED'
  ) {
    return 'brand';
  }

  if (
    s === 'PENDING' ||
    s === 'WARNING' ||
    s === 'BORDERLINE' ||
    s === 'MEDIUM' ||
    s === 'NO PREFERENCES' ||
    s === 'REVIEWED' ||
    s === 'OVERLOADED'
  ) {
    return 'amber';
  }

  if (
    s === 'OVERDUE' ||
    s === 'REJECTED' ||
    s === 'HIGH' ||
    s === 'SENSITIVE' ||
    s === 'CRITICAL' ||
    s === 'STALE DRAFT' ||
    s === 'STALE'
  ) {
    return 'red';
  }

  return 'muted';
}

export function StatusPill({
  label,
  variant,
  icon: Icon,
  size = 'xs',
  className = '',
}: StatusPillProps) {
  const resolvedVariant = variant || getVariantFromStatus(label);

  const variantStyles: Record<StatusVariant, string> = {
    green: 'bg-emerald-600 text-white',
    brand: 'bg-[#1F3B34] text-white',
    amber: 'bg-amber-600 text-white',
    red: 'bg-rose-600 text-white',
    muted: 'bg-[#7D766C] text-white',
  };

  const sizeStyles = {
    xs: 'px-2.5 py-0.5 text-[10px] md:text-[11px]',
    sm: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`rounded-full font-semibold inline-flex items-center gap-1 uppercase tracking-wide shrink-0 shadow-2xs leading-tight ${
        variantStyles[resolvedVariant]
      } ${sizeStyles[size]} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}

