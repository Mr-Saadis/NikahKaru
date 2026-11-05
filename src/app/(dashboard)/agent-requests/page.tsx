'use client';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import RequestsBoard from '@/components/requests/RequestsBoard';
import { AGENT_COLUMNS } from '@/components/requests/constants';
import { fetchAgentRequests, fetchAgentColumnRequests, fetchAgentNames } from '@/lib/actions/agent-requests';
import { markRequestAsRead } from '@/lib/actions/requests';

// ============================================================
// /agent-requests — Agent Request Operations board
// Protected: AGENT only
// ============================================================

export default function AgentRequestsPage() {
  const router = useRouter();
  const { role, isLoading, isInitialized } = useAuth();

  const isAgent = role === 'AGENT';

  useEffect(() => {
    if (isInitialized && !isAgent) {
      router.replace(role === 'MANAGER' || role === 'HIGH_LEVEL_ADMIN' ? '/requests' : '/overview');
    }
  }, [isInitialized, isAgent, role, router]);

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#8d8c86] text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAgent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg font-bold text-[#1F1E1B] mb-2">Access Denied</div>
          <div className="text-[#8d8c86] text-sm">
            This workspace is dedicated to Agents only.
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
          columns={AGENT_COLUMNS}
          fetchRequests={fetchAgentRequests}
          fetchColumnRequests={fetchAgentColumnRequests}
          fetchNames={fetchAgentNames}
          hideStaffFilter={true}
        />
      </Suspense>
    </div>
  );
}
