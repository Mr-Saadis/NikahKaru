import { useState, useCallback } from 'react';
import type { RequestItem } from './types';
import { createBrowserClient } from '@supabase/ssr';
import { runMatching } from '@/lib/matching/engine';
import type { MatchResult } from '@/lib/matching/types';
import { getMatchProfileGroups } from './utils';
import { fetchSentProfilesForRequest } from '@/lib/actions/requests';
import { useAuth } from '@/lib/hooks/useAuth';

export function useMatching() {
  const { role } = useAuth();
  const isAgent = role === 'AGENT';

  const [matchesOn, setMatchesOn] = useState<Record<string, boolean>>({});
  const [matchPage, setMatchPage] = useState<Record<string, number>>({});
  const [chosen, setChosen] = useState<Record<string, Map<string, Set<string>>>>({});
  const [sentExtra, setSentExtra] = useState<Record<string, Record<string, string>>>({});
  const [openProfile, setOpenProfile] = useState<{ candidateId: string; requestId: string } | null>(null);
  
  // Real DB matches state
  const [realMatches, setRealMatches] = useState<Record<string, MatchResult[]>>({});
  const [matchingLoading, setMatchingLoading] = useState<Record<string, boolean>>({});
  
  // Release history state
  const [releaseHistory, setReleaseHistory] = useState<Record<string, any[]>>({});

  const loadSentProfiles = useCallback(async (item: RequestItem, explicitHistory?: any[]) => {
    if (!item) return [];
    const requestId = item.id;
    try {
      const sourceProfileId = item.profileData?.profile_id || item.profileData?.source_profile_id || item.profileData?.id || item.id;
      const { history: fetchedHistory, fullProfiles, viewResults } = await fetchSentProfilesForRequest(requestId, sourceProfileId);
      const history = explicitHistory || fetchedHistory || [];
      
      setReleaseHistory(p => ({ ...p, [requestId]: history }));

      if (fullProfiles && fullProfiles.length > 0) {
        const historyMatches: MatchResult[] = history.map(h => {
          const r = viewResults?.find((vr: any) => vr.candidate_profile_id === h.candidate_profile_id);
          const p = fullProfiles.find((prof: any) => prof.profile_id === h.candidate_profile_id);
          return {
            candidateProfileId: h.candidate_profile_id,
            sourceToCandidateScore: r?.source_to_candidate_score || 0,
            candidateToSourceScore: r?.candidate_to_source_score || 0,
            finalScore: r?.final_score || 0,
            rank: r?.rank || 0,
            breakdowns: {
              sourceToCandidate: r?.score_breakdowns?.filter((b: any) => b.direction === r.source_gender) || [],
              candidateToSource: r?.score_breakdowns?.filter((b: any) => b.direction !== r.source_gender) || [],
            },
            fullProfile: p
          };
        });
        setRealMatches(p => ({ ...p, [requestId]: historyMatches }));
      } else {
        setRealMatches(p => ({ ...p, [requestId]: [] }));
      }
      return history;
    } catch (err) {
      console.error("Error loading sent profiles:", err);
      setRealMatches(p => ({ ...p, [requestId]: [] }));
      setReleaseHistory(p => ({ ...p, [requestId]: [] }));
      return [];
    }
  }, []);

  const toggleMatches = useCallback(async (item: RequestItem, forceRematch = false) => {
    const requestId = item.id;
    let isTurningOff = false;
    
    setMatchesOn((prev) => {
      const isCurrentlyOn = prev[requestId];
      if (isCurrentlyOn && !forceRematch) {
        setOpenProfile((curr) => (curr?.requestId === requestId ? null : curr));
        isTurningOff = true;
        return { ...prev, [requestId]: false };
      }
      return { ...prev, [requestId]: true };
    });

    if (isTurningOff) return;

    // For AGENT: Load sent/released profiles securely via server action!
    // Never query vw_profile_core, vw_profile_match_results or runMatching in client browser!
    if (isAgent) {
      setMatchingLoading(prev => ({ ...prev, [requestId]: true }));
      try {
        const sourceProfileId = item.profileData?.profile_id || item.profileData?.source_profile_id;
        const { history, fullProfiles, viewResults } = await fetchSentProfilesForRequest(requestId, sourceProfileId);
        
        setReleaseHistory(prev => ({ ...prev, [requestId]: history || [] }));
        
        if (history && history.length > 0) {
          const historyMatches: MatchResult[] = history.map(h => {
            const r = viewResults?.find((vr: any) => vr.candidate_profile_id === h.candidate_profile_id);
            const p = fullProfiles?.find((prof: any) => prof.profile_id === h.candidate_profile_id);
            return {
              candidateProfileId: h.candidate_profile_id,
              sourceToCandidateScore: r?.source_to_candidate_score || 0,
              candidateToSourceScore: r?.candidate_to_source_score || 0,
              finalScore: r?.final_score || 0,
              rank: r?.rank || 0,
              breakdowns: {
                sourceToCandidate: r?.score_breakdowns?.filter((b: any) => b.direction === r.source_gender) || [],
                candidateToSource: r?.score_breakdowns?.filter((b: any) => b.direction !== r.source_gender) || [],
              },
              fullProfile: p
            };
          });
          setRealMatches(prev => ({ ...prev, [requestId]: historyMatches }));
        } else {
          setRealMatches(prev => ({ ...prev, [requestId]: [] }));
        }
      } catch (e) {
        console.error('Error fetching sent profiles for agent:', e);
      } finally {
        setMatchingLoading(prev => ({ ...prev, [requestId]: false }));
      }
      return;
    }

    setMatchingLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      let sourceProfileId = item.profileData?.profile_id || item.profileData?.source_profile_id;
      if (!sourceProfileId && item.id) {
        const { data: req } = await supabase
          .from('information_requests')
          .select('source_profile_id')
          .eq('id', item.id)
          .maybeSingle();
        sourceProfileId = req?.source_profile_id || item.id;
      }
      if (!sourceProfileId) throw new Error("No source profile ID found for this request");

      let results: MatchResult[] = [];

      if (!forceRematch) {
        const { data: viewResults, error: resultsError } = await supabase
          .from('vw_profile_match_results')
          .select('*')
          .eq('source_profile_id', sourceProfileId)
          .order('final_score', { ascending: false });

        if (resultsError) console.error('Error fetching match results from view:', resultsError);

        if (viewResults && viewResults.length > 0) {
          results = viewResults.map((r: any) => ({
            candidateProfileId: r.candidate_profile_id,
            sourceToCandidateScore: r.source_to_candidate_score,
            candidateToSourceScore: r.candidate_to_source_score,
            finalScore: r.final_score,
            rank: r.rank,
            breakdowns: {
              sourceToCandidate: r.score_breakdowns?.filter((b: any) => b.direction === r.source_gender) || [],
              candidateToSource: r.score_breakdowns?.filter((b: any) => b.direction !== r.source_gender) || [],
            }
          }));
        }
      }

      if (results.length === 0) {
        try {
          results = await runMatching(supabase, sourceProfileId, {
            limit: 50,
            persist: false,
            executedBy: 'frontend-preview',
            requestId: item.id
          });
        } catch (engineErr) {
          console.error('Error running matching engine:', engineErr);
        }
      }

      // Merge history matches if they are missing from results
      setReleaseHistory(prevHistory => {
        const history = prevHistory[requestId] || [];
        if (history.length > 0) {
          history.forEach(h => {
            if (!results.some(r => r.candidateProfileId === h.candidate_profile_id)) {
              results.push({
                candidateProfileId: h.candidate_profile_id,
                sourceToCandidateScore: 0,
                candidateToSourceScore: 0,
                finalScore: 0,
                rank: 0,
                breakdowns: { sourceToCandidate: [], candidateToSource: [] }
              });
            }
          });
        }
        return prevHistory;
      });

      if (results && results.length > 0) {
        const ids = results.map(r => r.candidateProfileId);
        const { data: fullProfiles } = await supabase
          .from('vw_profile_core')
          .select('*')
          .in('profile_id', ids);
          
        if (fullProfiles) {
          results.forEach(r => {
            (r as any).fullProfile = fullProfiles.find((p: any) => p.profile_id === r.candidateProfileId);
          });
        }
      }

      const { data: ledgerData, error: ledgerError } = await supabase
        .from('vw_profile_matches_ledger')
        .select('*')
        .or(`male_profile_id.eq.${sourceProfileId},female_profile_id.eq.${sourceProfileId}`);

      if (ledgerError) console.error('Error fetching ledger from view:', ledgerError);

      if (ledgerData && ledgerData.length > 0) {
        const sentUpdates: Record<string, string> = {};
        ledgerData.forEach((l: any) => {
          const candidateId = l.male_profile_id === sourceProfileId ? l.female_profile_id : l.male_profile_id;
          sentUpdates[candidateId] = l.created_at;
        });
        setSentExtra(prev => ({
          ...prev,
          [requestId]: { ...(prev[requestId] || {}), ...sentUpdates }
        }));
      }
      
      setRealMatches(prev => ({ ...prev, [requestId]: results }));
    } catch (e) {
      console.error('Error fetching matches:', e);
    } finally {
      setMatchingLoading(prev => ({ ...prev, [requestId]: false }));
    }
  }, [matchesOn]);

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
        const isAlreadySentLocal = sentExtra[item.id]?.[candidateId];
        const isAlreadySentHistory = releaseHistory[item.id]?.some((r: any) => r.candidate_profile_id === candidateId);
        if (isAlreadySentLocal || isAlreadySentHistory) {
          continue; // Skip if already sent
        }

        if (set.size === 0) {
          const profile = results.find((x) => x.candidateProfileId === candidateId);
          onToast(`Select at least one detail for ${profile?.candidateData?.personal_information?.full_name || 'candidate'}`);
          openPanel(candidateId, item.id);
          return;
        }

        const profile = results.find((x) => x.candidateProfileId === candidateId);
        if (!profile) continue;

        const groups = getMatchProfileGroups(profile);
        const rawPaths: string[] = [];

        // 1. Collect explicitly selected field paths
        for (const key of set.values()) {
          if (key === 'All') continue;
          const [groupIndex, fieldIndex] = key.split(':').map(Number);
          if (!isNaN(groupIndex) && !isNaN(fieldIndex)) {
            const fieldTuple = groups[groupIndex]?.[1]?.[fieldIndex];
            if (fieldTuple?.[2]) {
              rawPaths.push(fieldTuple[2]);
            }
          }
        }

        // 2. Only fall back to all fields if user selected 'All' and selected no specific keys
        if (rawPaths.length === 0 && set.has('All')) {
          groups.forEach(g => {
            g[1].forEach(f => {
              if (f[2]) rawPaths.push(f[2]);
            });
          });
        }

        // Deduplicate field paths to satisfy database constraints
        const uniquePaths = Array.from(new Set(rawPaths));
        if (uniquePaths.length === 0) {
          uniquePaths.push('personal_information.full_name');
        }
        const fields_data = uniquePaths.map(fp => ({ field_path: fp }));

        // Prepare score_breakdowns with required PostgreSQL row types
        const sourceGender = item.profileData?.gender || 'MALE';
        const candidateGender = sourceGender === 'MALE' ? 'FEMALE' : 'MALE';
        const score_breakdowns: any[] = [];

        const normalizeMatchMode = (mode?: string): string => {
          if (!mode) return 'EXACT';
          const upper = String(mode).toUpperCase();
          if (upper === 'MIN_THRESHOLD') return 'MINIMUM';
          if (upper === 'MAX_THRESHOLD') return 'MAXIMUM';
          const valid = ['EXACT', 'RANGE', 'INCLUDES', 'EXCLUDES', 'MINIMUM', 'MAXIMUM', 'PREFERRED'];
          return valid.includes(upper) ? upper : 'EXACT';
        };

        const normalizeImportance = (imp?: string): string => {
          if (!imp) return 'DOESNT_MATTER';
          const upper = String(imp).toUpperCase();
          const valid = ['MANDATORY', 'HIGH', 'MEDIUM', 'LOW', 'DOESNT_MATTER'];
          return valid.includes(upper) ? upper : 'DOESNT_MATTER';
        };

        if (profile.breakdowns?.sourceToCandidate?.length) {
          for (const b of profile.breakdowns.sourceToCandidate) {
            score_breakdowns.push({
              direction: sourceGender,
              criterion_code: b.criterion_code,
              candidate_value: b.candidate_value ?? null,
              preferred_value: b.preferred_value ?? null,
              importance: normalizeImportance(b.importance),
              match_mode: normalizeMatchMode(b.match_mode),
              raw_score: Number(b.raw_score ?? 100),
              weight: Number(b.weight ?? 1),
              weighted_score: Number(b.weighted_score ?? 100),
              passed_hard_filter: Boolean(b.passed_hard_filter ?? true),
              explanation: b.explanation || 'Matched',
              algorithm_version: 'v1'
            });
          }
        }

        if (profile.breakdowns?.candidateToSource?.length) {
          for (const b of profile.breakdowns.candidateToSource) {
            score_breakdowns.push({
              direction: candidateGender,
              criterion_code: b.criterion_code,
              candidate_value: b.candidate_value ?? null,
              preferred_value: b.preferred_value ?? null,
              importance: normalizeImportance(b.importance),
              match_mode: normalizeMatchMode(b.match_mode),
              raw_score: Number(b.raw_score ?? 100),
              weight: Number(b.weight ?? 1),
              weighted_score: Number(b.weighted_score ?? 100),
              passed_hard_filter: Boolean(b.passed_hard_filter ?? true),
              explanation: b.explanation || 'Matched',
              algorithm_version: 'v1'
            });
          }
        }

        if (score_breakdowns.length === 0) {
          score_breakdowns.push({
            direction: sourceGender,
            criterion_code: 'OVERALL',
            candidate_value: null,
            preferred_value: null,
            importance: 'HIGH',
            match_mode: 'EXACT',
            raw_score: Number(profile.finalScore ?? 80),
            weight: 1,
            weighted_score: Number(profile.finalScore ?? 80),
            passed_hard_filter: true,
            explanation: 'Overall Compatibility',
            algorithm_version: 'v1'
          });
        }

        releasesData.push({ 
          candidate_profile_id: candidateId, 
          source_to_candidate_score: Number(profile.sourceToCandidateScore ?? 80),
          candidate_to_source_score: Number(profile.candidateToSourceScore ?? 80),
          final_score: Number(profile.finalScore ?? 80),
          passed_hard_filter: true,
          fields_data,
          score_breakdowns,
        });
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
    releaseHistory,
    setReleaseHistory,
    loadSentProfiles,
  };
}
