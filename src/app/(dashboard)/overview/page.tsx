'use client';

import React from 'react';
import AdminOverview from '@/components/dashboard/AdminOverview';
import ManagerOverview from '@/components/dashboard/ManagerOverview';
import StaffOverview from '@/components/dashboard/StaffOverview';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function OverviewPage() {
  const { role, isLoading, isInitialized } = useAuth();

  if (isLoading || !isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2.5 text-[#7D766C] text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-[#1F3B34]" />
          <span>Loading overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5]">
      {/* Main Content Area — Clean, Native Role Dashboard */}
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-7 animate-in fade-in duration-200">
        {role === 'HIGH_LEVEL_ADMIN' && <AdminOverview />}
        {role === 'MANAGER' && <ManagerOverview />}
        {(role === 'AGENT' || !role) && <StaffOverview />}
      </div>
    </div>
  );
}
