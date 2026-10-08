'use server';

import type { FilterState, RequestItem } from '@/components/requests/types';
import { 
  fetchAgentRequests as apiFetchAgentRequests, 
  fetchAgentNames as apiFetchAgentNames 
} from '@/api/agent-requests';

export async function fetchAgentRequests(filters: FilterState): Promise<RequestItem[]> {
  return apiFetchAgentRequests(filters);
}

export async function fetchAgentNames(): Promise<string[]> {
  return apiFetchAgentNames();
}
