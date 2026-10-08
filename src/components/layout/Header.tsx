'use client';

import { useState, useEffect } from 'react';
import { Bell, ArrowLeft, FileEdit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DraftsDialog from './DraftsDialog';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  idBadge?: string;
  isLive?: boolean;
  variant?: 'light' | 'dark';
}

export default function Header({
  title,
  subtitle,
  icon,
  showBackButton,
  primaryAction,
  secondaryAction,
  idBadge,
  isLive,
  variant = 'light',
}: HeaderProps) {
  const router = useRouter();
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchDraftCount = async () => {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'DRAFT')
          .eq('created_by', user.id);

        if (!error && count !== null && mounted) {
          setDraftCount(count);
        }
      } catch (err) {
        console.error('Error fetching draft count', err);
      }
    };

    fetchDraftCount();

    return () => {
      mounted = false;
    };
  }, [isDraftsOpen]);

  const isDark = variant === 'dark';
  const btnClass = "relative w-11 h-11 rounded-full bg-white border border-[#EFE9DF] hover:bg-[#F4ECE1] shadow-sm flex items-center justify-center text-[#1F3B34] transition-colors";

  const badgeBorder = isDark ? "border-[#2F3E51]" : "border-white";

  return (
    <>
      <div className="absolute top-9 right-12 flex items-center gap-3 z-[40]">
        <button 
          onClick={() => setIsDraftsOpen(true)}
          title="Saved Drafts"
          className={btnClass}
        >
          <FileEdit className="w-4 h-4" />
          {draftCount > 0 && (
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C86A4A] border-2 ${badgeBorder} flex items-center justify-center text-[9px] font-bold text-white`}>
              {draftCount}
            </div>
          )}
        </button>

        <button className={btnClass}>
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {isDraftsOpen && (
        <DraftsDialog 
          isOpen={isDraftsOpen} 
          onClose={() => setIsDraftsOpen(false)} 
        />
      )}
    </>
  );
}
