import { useState, useCallback } from 'react';
import type { RequestItem } from './types';
import { createBrowserClient } from '@supabase/ssr';
import { runMatching } from '@/lib/matching/engine';
import type { MatchResult } from '@/lib/matching/types';
import { getMatchProfileGroups } from './utils';

export function useMatching() {
  const [matchesOn, setMatchesOn] = useState<Record<string, boolean>>({});
  const [matchPage, setMatchPage] = useState<Record<string, number>>({});
  const [chosen, setChosen] = useState<Record<string, Map<string, Set<string>>>>({});
  const [sentExtra, setSentExtra] = useState<Record<string, Record<string, string>>>({});
  const [openProfile, setOpenProfile] = useState<{ candidateId: string; requestId: string } | null>(null);
  
  // Real DB matches state
  const [realMatches, setRealMatches] = useState<Record<string, MatchResult[]>>({});
  const [matchingLoading, setMatchingLoading] = useState<Record<string, boolean>>({});

  const toggleMatches = useCallback(async (item: RequestItem) => {
    const requestId = item.id;
    setMatchesOn((prev) => {
      const isCurrentlyOn = prev[requestId];
      if (isCurrentlyOn) {
        setOpenProfile((curr) => (curr?.requestId === requestId ? null : curr));
        return { ...prev, [requestId]: false };
      }
      return { ...prev, [requestId]: true };
    });

    // If we already have matches, no need to fetch again immediately
    if (realMatches[requestId] || matchesOn[requestId]) return;

    // Fetch real matches
    setMatchingLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const sourceProfileId = item.profileData?.profile_id;
      if (!sourceProfileId) throw new Error("No source profile ID found for this request");

      const results = await runMatching(supabase, sourceProfileId, { 
        limit: 50,
        persist: false,
        executedBy: 'frontend-preview',
        requestId: item.id
      });
      
      if (results.length > 0) {
        const ids = results.map(r => r.candidateProfileId);
        const { data: fullProfiles } = await supabase
          .from('vw_profile_core')
          .select('*')
          .in('profile_id', ids);
          
        if (fullProfiles) {
          results.forEach(r => {
            (r as any).fullProfile = fullProfiles.find(p => p.profile_id === r.candidateProfileId);
          });
        }
      }
      
      setRealMatches(prev => ({ ...prev, [requestId]: results }));
    } catch (e) {
      console.error('Error fetching matches:', e);
    } finally {
      setMatchingLoading(prev => ({ ...prev, [requestId]: false }));
    }
  }, [realMatches, matchesOn]);

  const setPage = useCallback((requestId: string, page: number) => {
    setMatchPage((prev) => ({ ...prev, [requestId]: page }));
  }, []);

  const toggleSelection = useCallback((requestId: string, candidateId: string, keys: string[]) => {
    setChosen((prev) => {
      const newChosen = { ...prev };
      if (!newChosen[requestId]) {
        newChosen[requestId] = new Map();
      }
      const requestMap = new Map(newChosen[requestId]);
      
      if (requestMap.has(candidateId)) {
        requestMap.delete(candidateId);
      } else {
        requestMap.set(candidateId, new Set(keys));
      }
      
      newChosen[requestId] = requestMap;
      return newChosen;
    });
  }, []);

  const updateSelectionKeys = useCallback((requestId: string, candidateId: string, keys: Set<string>) => {
    setChosen((prev) => {
      const newChosen = { ...prev };
      if (!newChosen[requestId]) {
        newChosen[requestId] = new Map();
      }
      const requestMap = new Map(newChosen[requestId]);
      
      if (keys.size === 0) {
        requestMap.delete(candidateId);
      } else {
        requestMap.set(candidateId, keys);
      }
      
      newChosen[requestId] = requestMap;
      return newChosen;
    });
  }, []);

  const sendSelected = useCallback(
    async (
      item: RequestItem,
      onToast: (msg: string) => void,
      openPanel: (candidateId: string, requestId: string) => void,
      closePanel: () => void,
    ) => {
      const reqChosen = chosen[item.id];
      if (!reqChosen || reqChosen.size === 0) return;

      const results = realMatches[item.id] || [];
      const releasesData = [];
      
      for (const [candidateId, set] of reqChosen.entries()) {
        if (set.size === 0) {
          const profile = results.find((x) => x.candidateProfileId === candidateId);
          onToast(`Select at least one detail for ${profile?.candidateData?.personal_information?.full_name || 'candidate'}`);
          openPanel(candidateId, item.id);
          return;
        }

        const profile = results.find((x) => x.candidateProfileId === candidateId);
        if (!profile) continue;

        const groups = getMatchProfileGroups(profile);
        const fields_data: { field_name: string; value: string }[] = [];

        // If UI selected 'All' via checkbox directly from board
        if (set.has('All')) {
          groups.forEach(g => {
            g[1].forEach(f => fields_data.push({ field_name: f[0], value: f[1] }));
          });
        } else {
          for (const key of set.values()) {
            const [groupIndex, fieldIndex] = key.split(':').map(Number);
            const fieldTuple = groups[groupIndex]?.[1]?.[fieldIndex];
            if (fieldTuple) {
              fields_data.push({ field_name: fieldTuple[0], value: String(fieldTuple[1]) });
            }
          }
        }

        releasesData.push({ candidate_profile_id: candidateId, fields_data });
      }

      onToast('Sending matches...');

      try {
        const res = await fetch(`/api/requests/${item.id}/release`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ releasesData })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'API failed');
        }

        const n = reqChosen.size;
        const t = new Date().toISOString().slice(0, 10);
        
        setSentExtra((prev) => {
          const newSentExtra = { ...prev };
          const reqSentExtra = { ...(newSentExtra[item.id] || {}) };
          for (const [candidateId] of reqChosen.entries()) {
            reqSentExtra[candidateId] = t;
          }
          newSentExtra[item.id] = reqSentExtra;
          return newSentExtra;
        });

        setChosen((prev) => {
          const newChosen = { ...prev };
          delete newChosen[item.id];
          return newChosen;
        });
        
        closePanel();
        onToast(`Sent details to ${n} candidate${n > 1 ? 's' : ''}`);

        // Note: To fully remove the card from the board, we could either force a refetch or trigger a local state update
        // to move it to 'Completed'. For now, marking it as sent will show the checkmarks.

      } catch (e: any) {
        console.error(e);
        onToast(e.message || 'Failed to send matches. Please try again.');
      }
    },
    [chosen, realMatches, sentExtra]
  );

  return {
    matchesOn,
    matchPage,
    chosen,
    sentExtra,
    openProfile,
    realMatches,
    matchingLoading,
    setOpenProfile,
    toggleMatches,
    setPage,
    toggleSelection,
    updateSelectionKeys,
    sendSelected,
  };
}
