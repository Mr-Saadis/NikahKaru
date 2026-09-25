'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import ReferenceDataProvider from '@/components/providers/ReferenceDataProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Extract the active page id for the sidebar (e.g. /overview -> overview, /admin/users -> admin-users)
  const activePage = pathname.split('/')[1] === 'admin' 
    ? `admin-${pathname.split('/')[2]}` 
    : pathname.split('/')[1] || 'overview';

  return (
    <ReferenceDataProvider>
      <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#FAF8F5] text-[#1E2022] overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar activePage={activePage} />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
        
      </div>
    </ReferenceDataProvider>
  );
}
