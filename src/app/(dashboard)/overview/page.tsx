'use client';

import React from 'react';
import AdminOverview from '@/components/dashboard/AdminOverview';
import ManagerOverview from '@/components/dashboard/ManagerOverview';
import StaffOverview from '@/components/dashboard/StaffOverview';
import { useAuth } from '@/lib/hooks/useAuth';

export default function OverviewPage() {
  const { role, isLoading, isInitialized } = useAuth();

  if (isLoading || !isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-[#7D766C] text-xs font-semibold uppercase tracking-wider">
          Loading overview...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-[#FAF8F5]">
      <div className="px-0 py-2 sm:px-5 sm:py-5 md:px-6 md:py-6 w-full min-w-0 overflow-x-hidden">
        {role === 'HIGH_LEVEL_ADMIN' && <AdminOverview />}
        {role === 'MANAGER' && <ManagerOverview />}
        {(role === 'AGENT' || !role) && <StaffOverview />}
      </div>
    </div>
  );
}
