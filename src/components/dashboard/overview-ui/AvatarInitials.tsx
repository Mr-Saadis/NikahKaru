import React from 'react';

interface AvatarInitialsProps {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarInitials({
  name,
  size = 'sm',
  className = '',
}: AvatarInitialsProps) {
  const getInitials = (n?: string | null): string => {
    if (!n || typeof n !== 'string') return '—';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Subtle palette from brand / neutrals
  const palettes = [
    'bg-[#E5ECE8] text-[#1F3B34]',
    'bg-[#FDF0D8] text-[#8B6122]',
    'bg-[#EBF2F7] text-[#2F3E51]',
    'bg-[#F4EFE7] text-[#4E473D]',
  ];

  const charCode = (name || '').charCodeAt(0) || 0;
  const palette = palettes[charCode % palettes.length];

  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7 text-[11px]'
      : size === 'lg'
      ? 'w-11 h-11 text-[13.5px] font-bold shadow-2xs'
      : 'w-8 h-8 text-xs';

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 select-none border border-[#E9E4DC]/50 ${palette} ${sizeClasses} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

