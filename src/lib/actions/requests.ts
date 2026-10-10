'use server';

import type { FilterState, RequestItem } from '@/components/requests/types';
import { 
  fetchBoardRequests as apiFetchBoardRequests, 
  fetchColumnRequests as apiFetchColumnRequests,
  fetchAgentNames as apiFetchAgentNames, 
  markRequestAsRead as apiMarkRequestAsRead,
  fetchRequestReleaseHistory as apiFetchRequestReleaseHistory
} from '@/api/requests';

export async function fetchBoardRequests(filters: FilterState): Promise<RequestItem[]> {
  return apiFetchBoardRequests(filters);
}

export async function fetchColumnRequests(
  status: string,
  filters: FilterState,
  offset: number = 0,
  limit: number = 20
): Promise<RequestItem[]> {
  return apiFetchColumnRequests(status, filters, offset, limit);
}

export async function fetchAgentNames(): Promise<string[]> {
  return apiFetchAgentNames();
}

export async function markRequestAsRead(requestId: string): Promise<void> {
  return apiMarkRequestAsRead(requestId);
}

export async function fetchRequestReleaseHistory(requestId: string): Promise<any[]> {
  return apiFetchRequestReleaseHistory(requestId);
}
