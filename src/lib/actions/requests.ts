'use server';

import type { FilterState, RequestItem } from '@/components/requests/types';
import { 
  fetchBoardRequests as apiFetchBoardRequests, 
  fetchAgentNames as apiFetchAgentNames, 
  markRequestAsRead as apiMarkRequestAsRead 
} from '@/api/requests';

export async function fetchBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  return apiFetchBoardRequests(filters);
}

export async function fetchAgentNames(): Promise<string[]> {
  return apiFetchAgentNames();
}

export async function markRequestAsRead(requestId: string): Promise<void> {
  return apiMarkRequestAsRead(requestId);
}
