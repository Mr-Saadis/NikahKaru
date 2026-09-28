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
    <header className="bg-[#FAF8F5] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2 flex items-center justify-between">

        {/* Left Section: Back Button Only */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white hover:bg-[#F4ECE1] border border-[#E9E4DC] shadow-sm text-[#064e3b] flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

        </div>

        {/* Right Section: Actions & Notifications */}
        <div className="flex items-center gap-3">

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="bg-white hover:bg-[#F4ECE1] text-[#24211D] border border-[#E9E4DC] font-bold text-[12.5px] px-4 py-2.5 rounded-full shadow-sm transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[12.5px] px-5 py-2.5 rounded-full shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              {primaryAction.label}
            </button>
          )}

          <button 
            onClick={() => setIsDraftsOpen(true)}
            title="Saved Drafts"
            className="relative w-9 h-9 rounded-xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] shadow-sm flex items-center justify-center text-[#064e3b] transition-colors ml-1"
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

      </div>

      {isDraftsOpen && (
        <DraftsDialog 
          isOpen={isDraftsOpen} 
          onClose={() => setIsDraftsOpen(false)} 
        />
      )}
    </header>
  );
}
