import { useState, useCallback } from 'react';
import { cands, MatchProfile } from './mock-matching';
import type { RequestItem } from './types';

export function useMatching() {
  const [matchesOn, setMatchesOn] = useState<Record<string, boolean>>({});
  const [matchPage, setMatchPage] = useState<Record<string, number>>({});
  const [chosen, setChosen] = useState<Record<string, Map<number, Set<string>>>>({});
  const [sentExtra, setSentExtra] = useState<Record<string, Record<string, string>>>({});
  const [openProfile, setOpenProfile] = useState<{ seed: number; requestId: string } | null>(null);

  const toggleMatches = useCallback((requestId: string) => {
    setMatchesOn((prev) => {
      const isCurrentlyOn = prev[requestId];
      if (isCurrentlyOn) {
        // If turning off, close the panel if open for this request
        setOpenProfile((curr) => (curr?.requestId === requestId ? null : curr));
      }
      return { ...prev, [requestId]: !isCurrentlyOn };
    });
  }, []);

  const setPage = useCallback((requestId: string, page: number) => {
    setMatchPage((prev) => ({ ...prev, [requestId]: page }));
  }, []);

  const toggleSelection = useCallback((requestId: string, m: MatchProfile, keys: string[]) => {
    setChosen((prev) => {
      const newChosen = { ...prev };
      if (!newChosen[requestId]) {
        newChosen[requestId] = new Map();
      }
      const requestMap = new Map(newChosen[requestId]);
      
      if (requestMap.has(m.seed)) {
        requestMap.delete(m.seed);
      } else {
        requestMap.set(m.seed, new Set(keys));
      }
      
      newChosen[requestId] = requestMap;
      return newChosen;
    });
  }, []);

  const updateSelectionKeys = useCallback((requestId: string, seed: number, keys: Set<string>) => {
    setChosen((prev) => {
      const newChosen = { ...prev };
      if (!newChosen[requestId]) return prev;
      const requestMap = new Map(newChosen[requestId]);
      if (requestMap.has(seed)) {
        requestMap.set(seed, new Set(keys));
        newChosen[requestId] = requestMap;
        return newChosen;
      }
      return prev;
    });
  }, []);

  const sendSelected = useCallback(
    (
      item: RequestItem,
      onToast: (msg: string) => void,
      openPanel: (seed: number, requestId: string) => void,
      closePanel: () => void,
    ) => {
      const reqChosen = chosen[item.id];
      if (!reqChosen || reqChosen.size === 0) return;

      const [M] = cands(item, sentExtra[item.id] || {});
      
      for (const [seed, set] of reqChosen.entries()) {
        if (set.size === 0) {
          const profile = M.find((x) => x.seed === seed);
          onToast(`Select at least one detail for ${profile?.name}`);
          openPanel(seed, item.id);
          return;
        }
      }

      const n = reqChosen.size;
      const t = new Date().toISOString().slice(0, 10);
      
      setSentExtra((prev) => {
        const newSentExtra = { ...prev };
        const reqSentExtra = { ...(newSentExtra[item.id] || {}) };
        
        for (const [seed] of reqChosen.entries()) {
          reqSentExtra[seed.toString()] = t;
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
      onToast(`Sent ${n} ${n > 1 ? 'profiles' : 'profile'} to ${item.name}`);
    },
    [chosen, sentExtra]
  );

  return {
    matchesOn,
    matchPage,
    chosen,
    sentExtra,
    openProfile,
    setOpenProfile,
    toggleMatches,
    setPage,
    toggleSelection,
    updateSelectionKeys,
    sendSelected,
  };
}
