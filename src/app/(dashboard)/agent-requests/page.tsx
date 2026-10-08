'use client';
import { Suspense } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import RequestsBoard from '@/components/requests/RequestsBoard';
import { AGENT_COLUMNS } from '@/components/requests/constants';
import { fetchAgentRequests, fetchAgentNames } from '@/lib/actions/agent-requests';
import { markRequestAsRead } from '@/lib/actions/requests';

// ============================================================
// /agent-requests — Agent Request Operations board
// Protected: AGENT only (or accessible to managers too)
// ============================================================

export default function AgentRequestsPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#8d8c86] text-sm">Loading...</div>
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
          fetchNames={fetchAgentNames}
          hideStaffFilter={true}
        />
      </Suspense>
    </div>
  );
}
