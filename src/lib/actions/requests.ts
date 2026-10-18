'use server';

import type { FilterState, RequestItem } from '@/components/requests/types';
import { 
  fetchBoardRequests as apiFetchBoardRequests, 
  fetchColumnRequests as apiFetchColumnRequests,
  fetchAgentNames as apiFetchAgentNames, 
  markRequestAsRead as apiMarkRequestAsRead,
  markRequestAsDownloaded as apiMarkRequestAsDownloaded,
  deleteSentProfiles as apiDeleteSentProfiles,
  fetchRequestReleaseHistory as apiFetchRequestReleaseHistory,
  fetchSentProfilesForRequest as apiFetchSentProfilesForRequest,
  fetchProfileCompleteReleaseHistory as apiFetchProfileCompleteReleaseHistory,
  fetchProfileAuditLogs as apiFetchProfileAuditLogs,
  fetchProfileActivePreferences as apiFetchProfileActivePreferences,
  fetchAgentsList as apiFetchAgentsList,
  assignProfileToAgent as apiAssignProfileToAgent,
  type ProfileAuditLogItem,
  type AgentOption,
} from '@/api/requests';

export type { ProfileAuditLogItem, AgentOption };

export async function deleteSentProfiles(
  requestId: string,
  candidateProfileIds: string[]
): Promise<{ success: boolean; error?: string; remainingCount?: number }> {
  return apiDeleteSentProfiles(requestId, candidateProfileIds);
}

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

export async function markRequestAsDownloaded(requestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  return apiMarkRequestAsDownloaded(requestId);
}

export async function fetchRequestReleaseHistory(requestId: string): Promise<any[]> {
  return apiFetchRequestReleaseHistory(requestId);
}

export async function fetchSentProfilesForRequest(
  requestId: string,
  sourceProfileId?: string
): Promise<{ history: any[]; fullProfiles: any[]; viewResults: any[] }> {
  return apiFetchSentProfilesForRequest(requestId, sourceProfileId);
}

export async function fetchProfileCompleteReleaseHistory(profileId: string): Promise<any[]> {
  return apiFetchProfileCompleteReleaseHistory(profileId);
}

export async function fetchProfileAuditLogs(profileId: string): Promise<ProfileAuditLogItem[]> {
  return apiFetchProfileAuditLogs(profileId);
}

export async function fetchProfileActivePreferences(profileId: string): Promise<any | null> {
  return apiFetchProfileActivePreferences(profileId);
}

export async function fetchAgentsList(): Promise<AgentOption[]> {
  return apiFetchAgentsList();
}

export async function assignProfileToAgent(params: {
  profileId: string;
  requestId?: string;
  targetAgentId: string;
  targetAgentName: string;
  profileName: string;
  previousAgentName?: string;
}): Promise<{ success: boolean; error?: string }> {
  return apiAssignProfileToAgent(params);
}

