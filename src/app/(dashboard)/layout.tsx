'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import ReferenceDataProvider from '@/components/providers/ReferenceDataProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOverview = pathname === '/overview' || pathname === '/';
  
  // Extract the active page id for the sidebar (e.g. /overview -> overview, /admin/users -> admin-users)
  const activePage = pathname.split('/')[1] === 'admin' 
    ? `admin-${pathname.split('/')[2]}` 
    : pathname.split('/')[1] || 'overview';

  return (
    <ReferenceDataProvider>
      <div className="fixed inset-0 z-50 flex flex-col md:flex-row w-full max-w-full bg-[#FAF8F5] text-[#1E2022] overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar activePage={activePage} />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden hide-scrollbar">
          {isOverview ? (
            children
          ) : (
            <>
              {/* Mobile View Gate: Non-overview workspaces require Tablet / Laptop / Desktop (>= 768px) */}
              <div className="flex md:hidden flex-1 items-center justify-center p-6 text-center">
                <div className="max-w-sm bg-white border border-[#E5DED3] rounded-[28px] p-7 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E5DED3] text-[#1F3B34] flex items-center justify-center mx-auto mb-4">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <h2 className="text-[17px] font-bold text-[#1F1E1B] mb-2">
                    Desktop or Tablet View Required
                  </h2>
                  <p className="text-[13px] text-[#696256] leading-relaxed mb-5">
                    This workspace is designed for Laptop, Desktop, and Tablet screens. Please switch your browser to Desktop view or return to Overview.
                  </p>
                  <Link
                    href="/overview"
                    className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-[#1F3B34] text-white text-[13px] font-semibold hover:bg-[#172D28] transition-colors"
                  >
                    Go to Overview
                  </Link>
                </div>
              </div>

              {/* Tablet / Laptop / Desktop Content */}
              <div className="hidden md:flex md:flex-col md:flex-1 md:min-h-0">
                {children}
              </div>
            </>
          )}
        </main>
        
      </div>
    </ReferenceDataProvider>
  );
}
