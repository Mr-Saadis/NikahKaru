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

    // Optionally set up a small interval or just rely on manual refresh
    return () => {
      mounted = false;
    };
  }, [isDraftsOpen]); // Re-fetch when drafts dialog is closed/opened

  return (
    <>
      <div className="absolute top-4 right-8 flex items-center gap-3 z-[40]">
        <button 
          onClick={() => setIsDraftsOpen(true)}
          title="Saved Drafts"
          className="relative w-9 h-9 rounded-xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] shadow-sm flex items-center justify-center text-[#064e3b] transition-colors"
        >
          <FileEdit className="w-4 h-4" />
          {draftCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ba1a1a] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
              {draftCount}
            </div>
          )}
        </button>

        <button className="relative w-9 h-9 rounded-xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] shadow-sm flex items-center justify-center text-[#4E473D] transition-colors">
          <Bell className="w-4 h-4" />
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
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
