import React, { useMemo, useState, useEffect } from 'react';
import type { MatchResult } from '@/lib/matching/types';
import { CheckBox } from './CheckBox';
import { MatchRing } from './MatchRing';
import { CheckIcon, SendIcon, ChevronRightIcon } from './icons';
import type { RequestItem } from './types';
import { fetchProfileCompleteReleaseHistory } from '@/lib/actions/requests';

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '').slice(0, 2).toUpperCase();
}

const AVC = ["#f3b9a4","#b9d9c0","#f4d58b","#b9c8ee","#e3b6dc"];

interface MatchesSectionProps {
  item: RequestItem;
  matches: MatchResult[];
  sent: MatchResult[];
  page: number;
  setPage: (id: string, page: number) => void;
  chosen: Map<string, Set<string>> | undefined;
  openProfile: { candidateId: string; requestId: string } | null;
  setOpenProfile: (p: { candidateId: string; requestId: string } | null) => void;
  toggleSelection: (reqId: string, candidateId: string, keys: string[]) => void;
  sendSelected: (item: RequestItem) => void;
  releaseHistory?: any[];
  keysOf?: any; // Mock keys no longer needed
}

export function MatchesSection({
  item,
  matches,
  sent,
  page,
  setPage,
  chosen,
  openProfile,
  setOpenProfile,
  toggleSelection,
  sendSelected,
  releaseHistory = [],
}: MatchesSectionProps) {
  const [completeHistory, setCompleteHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeMatch = useMemo(() => {
    if (!openProfile || openProfile.requestId !== item.id) return null;
    return matches.find(m => m.candidateProfileId === openProfile.candidateId) || null;
  }, [openProfile, matches, item.id]);

  useEffect(() => {
    if (activeMatch) {
      setLoadingHistory(true);
      fetchProfileCompleteReleaseHistory(activeMatch.candidateProfileId)
        .then(res => {
          setCompleteHistory(res || []);
          setLoadingHistory(false);
        })
        .catch(err => {
          console.error(err);
          setCompleteHistory([]);
          setLoadingHistory(false);
        });
    } else {
      setCompleteHistory([]);
    }
  }, [activeMatch?.candidateProfileId]);

  const a = page * 5;
  const pageMatches = useMemo(() => matches.slice(a, a + 5), [matches, a]);
  const rem = Math.min(5, matches.length - a - 5);
  let n = 0;
  if (chosen) {
    for (const [candidateId, keys] of chosen.entries()) {
      const releaseData = releaseHistory.find(r => r.candidate_profile_id === candidateId);
      const isAlreadySent = sent.some(s => s.candidateProfileId === candidateId) || !!releaseData;
      if (!isAlreadySent) {
        n++;
      }
    }
  }

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const datePart = iso.split('T')[0];
    const [y, m, d] = datePart.split('-');
    return `${d}.${m}.${y.slice(2)}`;
  };



  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-4 mt-4 animate-[rise_.6s_cubic-bezier(.22,1,.36,1)_both]">
      {/* LEFT BOX */}
      <div className="bg-white border border-[#eeede6] shadow-[0_6px_18px_rgba(30,30,50,.05)] rounded-[24px] p-[18px_20px]">
        <div className="flex items-center justify-between gap-[10px] mb-3">
          <h4 className="flex items-baseline gap-2 m-0 text-[14px] font-[700] tracking-[-0.2px]">
            Matches <small className="text-[#8d8c86] text-[11px] font-[500]">{matches.length} found · highest match first</small>
          </h4>
          <button
            type="button"
            disabled={n === 0}
            onClick={() => sendSelected(item)}
            title={`Send selected profiles to ${item.name}`}
            className={`inline-flex items-center gap-2 h-[38px] px-[18px] border-0 rounded-full font-inherit text-[12.5px] font-[600] whitespace-nowrap transition-all duration-220
              ${n === 0
                ? 'bg-[#e4e3dc] text-[#9a9992] cursor-default'
                : 'bg-[#111] text-white cursor-pointer hover:-translate-y-[2px] hover:shadow-[0_10px_20px_rgba(0,0,0,.22)]'
              }`}
          >
            <SendIcon size={14} />
            Send{n > 0 ? ` (${n})` : ''}
          </button>
        </div>

        {pageMatches.map((m, i) => {
          const isChosen = chosen?.has(m.candidateProfileId) || false;
          const isOpen = openProfile?.requestId === item.id && openProfile.candidateId === m.candidateProfileId;
          const releaseData = releaseHistory.find(r => r.candidate_profile_id === m.candidateProfileId);
          const isSent = sent.some(s => s.candidateProfileId === m.candidateProfileId) || !!releaseData;

          const p = (m as any).fullProfile || m.candidateData;
          const cName = p?.full_name || p?.personal_information?.full_name || 'Unknown';
          const dob = p?.date_of_birth || p?.personal_information?.date_of_birth;
          const cAge = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : 'N/A';
          const cCity = p?.current_city_name_en || p?.location?.current_city?.name_en || 'Unknown City';
          const cJob = p?.job_title || p?.education_profession?.job_title || 'Unknown Job';

          return (
            <div
              key={m.candidateProfileId}
              tabIndex={0}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                setOpenProfile({ candidateId: m.candidateProfileId, requestId: item.id });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !(e.target as HTMLElement).closest('[role="checkbox"]')) {
                  setOpenProfile({ candidateId: m.candidateProfileId, requestId: item.id });
                }
              }}
              className={`flex items-center gap-3 w-full border border-[#eeede6] bg-white rounded-[20px] p-[10px_14px_10px_10px] mb-[10px] text-left cursor-pointer animate-[rise_.5s_cubic-bezier(.22,1,.36,1)_both] transition-all duration-[220ms] last:mb-0
                hover:-translate-y-[2px] hover:shadow-[0_10px_22px_rgba(30,30,50,.09)]
                ${isOpen ? 'border-[#111] ring-1 ring-[#111]' : ''}
                ${isChosen ? 'bg-[#faf9f4] border-[#cfcec6]' : ''}
              `}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <CheckBox
                checked={isChosen || isSent}
                disabled={isSent}
                className="-mr-[2px]"
                aria-label={`Select ${cName}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelection(item.id, m.candidateProfileId, ['All']); // Sending 'All' for simplicity
                  if (!chosen?.has(m.candidateProfileId)) {
                    // Became selected
                    setOpenProfile({ candidateId: m.candidateProfileId, requestId: item.id });
                  } else {
                    // Became unselected
                    if (openProfile?.candidateId === m.candidateProfileId) {
                      setOpenProfile(null);
                    }
                  }
                }}
              />
              
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center font-[700] text-[#111] text-[13px] shrink-0"
                style={{ background: AVC[m.candidateProfileId.charCodeAt(0) % 5] }}
              >
                {getInitials(cName)}
              </div>

              <div className="flex-1 min-w-0">
                <b className="block text-[14.5px] font-[600] tracking-[-0.2px]">
                  {cName}
                  {isSent && (
                    <span className="inline-flex items-center gap-1 ml-2 align-[1px] bg-[#e3f4e8] text-[#2d7a4b] rounded-full px-[8px] py-[2px] text-[10px] font-[700]">
                      <CheckIcon size={10} strokeWidth={3} />
                      Sent
                    </span>
                  )}
                </b>
                <small className="block mt-[2px] text-[#8d8c86] text-[11px] font-[500]">
                  {cAge} yrs · {cCity} · {cJob}
                </small>
              </div>

              <div className="flex flex-col items-center">
                <MatchRing pct={Math.round(m.finalScore)} />
                <small className="text-[#8d8c86] text-[9.5px] -mt-[2px]">match</small>
              </div>

              <ChevronRightIcon className="text-[#a9a8a0]" size={16} />
            </div>
          );
        })}

        <div className="flex items-center justify-between mt-[14px] pt-[12px] border-t border-[#eeede6]">
          <small className="text-[#8d8c86] text-[11px] font-[500]">
            Showing {a + 1}–{Math.min(a + 5, matches.length)} of {matches.length}
          </small>
          <div>
            <button
              id="pv"
              disabled={page === 0}
              onClick={() => setPage(item.id, page - 1)}
              className="h-[38px] rounded-full border-0 px-[18px] ml-2 font-inherit text-[12.5px] font-[600] cursor-pointer bg-[#f1f0ea] text-[#111] transition-all duration-[200ms] disabled:opacity-[.35] disabled:cursor-default hover:not(:disabled):-translate-y-[2px] hover:not(:disabled):shadow-[0_8px_16px_rgba(0,0,0,.14)]"
            >
              Previous
            </button>
            <button
              id="pn"
              disabled={rem <= 0}
              onClick={() => setPage(item.id, page + 1)}
              className="h-[38px] rounded-full border-0 px-[18px] ml-2 font-inherit text-[12.5px] font-[600] cursor-pointer bg-[#111] text-white transition-all duration-[200ms] disabled:opacity-[.35] disabled:cursor-default hover:not(:disabled):-translate-y-[2px] hover:not(:disabled):shadow-[0_8px_16px_rgba(0,0,0,.14)]"
            >
              {rem > 0 ? `Next ${rem}` : 'No more'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT BOX */}
      <div className="bg-white border border-[#eeede6] shadow-[0_6px_18px_rgba(30,30,50,.05)] rounded-[24px] p-[18px_20px] flex flex-col">
        {!activeMatch ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="flex items-baseline gap-2 m-0 text-[14px] font-[700] tracking-[-0.2px]">
                Sent history
              </h4>
            </div>
            <div className="text-[#8d8c86] text-center text-[12px] pt-[48px] m-auto">
              Select a match to see who they were sent to before.
            </div>
          </>
        ) : (
          <>
            <h4 className="flex items-baseline gap-2 m-0 text-[14px] font-[700] tracking-[-0.2px] mb-3">
              Sent history for <small className="text-[#8d8c86] text-[11px] font-[500] truncate max-w-[120px]">{activeMatch.candidateData?.personal_information?.full_name || 'Candidate'}</small>
            </h4>
            
            {(() => {
              const releaseData = releaseHistory.find(r => r.candidate_profile_id === activeMatch.candidateProfileId);
              const isSentCurrent = sent.some(s => s.candidateProfileId === activeMatch.candidateProfileId) || !!releaseData;
              
              if (loadingHistory) {
                return <div className="text-[#8d8c86] text-center text-[12px] pt-[48px] m-auto">Loading history...</div>;
              }
              
              if (completeHistory.length === 0 && !isSentCurrent) {
                return (
                  <div className="text-[#8d8c86] text-center text-[12px] pt-[48px] m-auto">
                    This profile has no past sent history.
                  </div>
                );
              }
              
              return (
                <div className="flex flex-col min-h-0 overflow-y-auto pr-1">
                  {completeHistory.map((h, i) => (
                    <div key={h.release_id || i} className="flex items-center gap-[10px] w-[calc(100%+16px)] border-0 bg-transparent text-left rounded-[14px] p-[8px] -mx-[8px] border-t border-[#eeede6] first:border-transparent mt-[4px] pt-[12px] first:mt-0 first:pt-2">
                      <div
                        className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-[700] text-[#111] text-[11px] shrink-0"
                        style={{ background: AVC[(h.other_profile_id || '').charCodeAt(0) % 5] || AVC[0] }}
                      >
                        {getInitials(h.other_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <b className="block text-[13.5px] font-[600] truncate">{h.other_name}</b>
                      </div>
                      <em className="ml-auto not-italic text-[11px] text-[#8d8c86] whitespace-nowrap pl-2">
                        {formatDate(h.released_at)}
                      </em>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
