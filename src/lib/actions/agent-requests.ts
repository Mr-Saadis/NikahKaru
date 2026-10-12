'use server';

import type { FilterState, RequestItem } from '@/components/requests/types';
import { 
  fetchAgentBoardRequests as apiFetchAgentBoardRequests,
  fetchAgentColumnRequests as apiFetchAgentColumnRequests,
  fetchAgentRequests as apiFetchAgentRequests, 
  fetchAgentNames as apiFetchAgentNames 
} from '@/api/agent-requests';

export async function fetchAgentBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  return apiFetchAgentBoardRequests(filters);
}

export async function fetchAgentColumnRequests(
  status: string,
  filters: FilterState,
  offset: number = 0,
  limit: number = 20
): Promise<RequestItem[]> {
  return apiFetchAgentColumnRequests(status, filters, offset, limit);
}

export async function fetchAgentRequests(filters: FilterState): Promise<RequestItem[]> {
  return apiFetchAgentRequests(filters);
}

export async function fetchAgentNames(): Promise<string[]> {
  return apiFetchAgentNames();
}

export async function submitMatchRequest(sourceProfileId: string): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data, error } = await supabase.rpc('submit_information_request', {
    p_agent_id: user.id,
    p_source_profile_id: sourceProfileId,
  });

  if (error) {
    console.error('Failed to submit information request:', error);
    return { success: false, error: error.message };
  }

  return { success: true, requestId: data };
}
