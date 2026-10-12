'use client';
import { Suspense } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import RequestsBoard from '@/components/requests/RequestsBoard';
import { COLUMNS } from '@/components/requests/constants';
import { fetchBoardRequests, fetchColumnRequests, fetchAgentNames, markRequestAsRead } from '@/lib/actions/requests';

// ============================================================
// /requests — Manager Request Operations board
// Protected: MANAGER + HIGH_LEVEL_ADMIN only
// ============================================================

export default function RequestsPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#8d8c86] text-sm">Loading...</div>
      </div>
    );
  }

  if (role !== 'MANAGER' && role !== 'HIGH_LEVEL_ADMIN') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg font-bold text-[#1F1E1B] mb-2">Access Denied</div>
          <div className="text-[#8d8c86] text-sm">
            You need Manager or Admin privileges to view this page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-hidden"
      style={{
        background: 'var(--bg-app)',
        borderRadius: 26,
      }}
    >
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading board...</div>}>
        <RequestsBoard 
          columns={COLUMNS}
          fetchRequests={fetchBoardRequests}
          fetchColumnRequests={fetchColumnRequests}
          fetchNames={fetchAgentNames}
          onMarkAsRead={markRequestAsRead}
        />
      </Suspense>
    </div>
  );
}
