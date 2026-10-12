import React, { useEffect, useRef } from 'react';
import { XIcon, CheckIcon } from './icons';
import { CheckBox } from './CheckBox';
import { MatchRing } from './MatchRing';
import type { RequestItem } from './types';
import type { MatchResult } from '@/lib/matching/types';
import { getMatchProfileGroups, type ProfileGroup } from './utils';
import { useAuth } from '@/lib/hooks/useAuth';

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '').slice(0, 2).toUpperCase();
}

const AVC = ["#f3b9a4","#b9d9c0","#f4d58b","#b9c8ee","#e3b6dc"];

interface MatchProfilePanelProps {
  openProfile: { candidateId: string; requestId: string } | null;
  item: RequestItem | null;
  matchProfile: MatchResult | null;
  chosenKeys: Set<string>;
  onClose: () => void;
  toggleSelection: () => void;
  updateSelectionKeys: (keys: Set<string>) => void;
  isSent: boolean;
  sentDate?: string;
  releaseHistory?: any[];
}

export function MatchProfilePanel({
  openProfile,
  item,
  matchProfile,
  chosenKeys,
  onClose,
  toggleSelection,
  updateSelectionKeys,
  isSent,
  sentDate,
  releaseHistory = []
}: MatchProfilePanelProps) {
  const { role } = useAuth();
  const isAgent = role === 'AGENT';

  const isOpen = !!openProfile && openProfile.requestId === item?.id && !!matchProfile;
  const isSelected = chosenKeys.size > 0;
  
  const historyRecord = releaseHistory.find(r => r.candidate_profile_id === matchProfile?.candidateProfileId);
  const allowedFields = new Set<string>(historyRecord?.selected_fields || []);

  const p = (matchProfile as any)?.fullProfile || matchProfile?.candidateData;
  const cName = p?.full_name || p?.personal_information?.full_name || 'Candidate';

  // Role-based masking of top candidate summary attributes:
  const hasDob = allowedFields.has('personal_information.date_of_birth') || !isAgent;
  const dob = hasDob ? (p?.date_of_birth || p?.personal_information?.date_of_birth) : null;
  const cAge = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null;

  const hasCity = allowedFields.has('profile_locations.current_city_id') || !isAgent;
  const cCity = hasCity ? (p?.current_city_name_en || p?.location?.current_city?.name_en || null) : null;

  const hasJob = allowedFields.has('employment_records') || !isAgent;
  const cJob = hasJob ? (p?.job_title || p?.education_profession?.job_title || null) : null;

  const summaryParts = [
    cAge ? `${cAge} yrs` : null,
    cCity,
    cJob
  ].filter(Boolean);

  const rawGroups = matchProfile ? getMatchProfileGroups(matchProfile) : [];
  // For AGENT: Only show fields that were explicitly approved and released by the Manager!
  // Filter out any field not in allowedFields and filter out unreleased empty values
  const groups: ProfileGroup[] = isAgent
    ? rawGroups
        .map(([groupTitle, fields]) => [
            groupTitle,
            fields.filter((f) => {
              const fieldPath = f[2];
              if (!fieldPath) return false;
              if (fieldPath === 'personal_information.profile_picture') {
                return allowedFields.has(fieldPath) && !!p?.profile_url;
              }
              if (!allowedFields.has(fieldPath)) return false;
              const val = f[1];
              if (val === null || val === undefined || val === '' || val === 'N/A') return false;
              return true;
            })
          ] as ProfileGroup)
        .filter(([_, fields]) => fields.length > 0)
    : rawGroups;

  const totalKeys = groups.flatMap((g, i) => g[1].map((_, j) => `${i}:${j}`)).length;

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && matchProfile?.candidateProfileId !== prevId.current) {
      prevId.current = matchProfile?.candidateProfileId || null;
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      
      // Auto-select fields if already sent from history (for manager preview)
      if (historyRecord && historyRecord.selected_fields && groups.length > 0) {
        const next = new Set<string>();
        groups.forEach((g, i) => {
          g[1].forEach((r, j) => {
            const fieldPath = r[2];
            if (fieldPath && historyRecord.selected_fields.includes(fieldPath)) {
              next.add(`${i}:${j}`);
            }
          });
        });
        if (next.size > 0) {
          updateSelectionKeys(next);
        }
      }
    }
  }, [isOpen, matchProfile, historyRecord, groups, updateSelectionKeys]);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const datePart = iso.split('T')[0];
    const [y, m, d] = datePart.split('-');
    return `${d}.${m}.${y.slice(2)}`;
  };

  return (
    <div
      role="dialog"
      aria-label="Match profile details"
      aria-modal="false"
      aria-hidden={!isOpen}
      className={`absolute top-[14px] right-[14px] bottom-[14px] w-[292px] z-60 bg-white rounded-[28px] shadow-[0_18px_50px_rgba(30,30,50,.2),_0_0_0_1px_rgba(20,20,40,.05)] flex flex-col overflow-hidden transition-all duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] hidden md:flex
        ${isOpen ? 'translate-x-0 visible delay-0' : 'translate-x-[calc(100%+40px)] invisible delay-[700ms]'}
      `}
    >
      <button
        aria-label="Close match details"
        onClick={onClose}
        className="absolute top-[14px] right-[14px] w-[36px] h-[36px] rounded-full bg-[#f1f0ea] z-[3] flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[#111] hover:text-white hover:rotate-90"
      >
        <XIcon size={16} />
      </button>

      {matchProfile && item && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-[18px_16px_20px] overscroll-contain sheet-hidden-scrollbar">
          <div className="text-center p-[10px_8px_16px] rounded-[22px] bg-gradient-to-b from-[#f3f2ec] to-white mb-3">
            <div
              className="w-[72px] h-[72px] mx-auto mb-[10px] rounded-full flex items-center justify-center font-[700] text-[#111] text-[22px] shadow-[0_0_0_4px_#fff,_0_10px_22px_rgba(0,0,0,.12)]"
              style={{ background: AVC[matchProfile.candidateProfileId.charCodeAt(0) % 5] }}
            >
              {getInitials(cName)}
            </div>
            <h3 className="m-0 text-[19px] font-[700] tracking-[-0.5px]">{cName}</h3>
            {summaryParts.length > 0 && (
              <div className="text-[#8d8c86] text-[11.5px] mt-[3px]">
                {summaryParts.join(' · ')}
              </div>
            )}
            
            <div className="flex items-center justify-center gap-[10px] mt-[12px] text-left">
              <MatchRing pct={Math.round(matchProfile.finalScore)} />
              <div>
                <b className="block text-[14px]">Match</b>
                <small className="text-[#8d8c86] text-[11px]">with {item.name}</small>
              </div>
            </div>
          </div>

          {isAgent ? (
            <div className="flex items-center justify-between p-[8px_12px] rounded-[16px] bg-[#f8f7f2] border border-[#eeede6] mb-3">
              <div className="flex items-center gap-[6px] text-[#064e3b] text-[11.5px] font-[600]">
                <CheckIcon size={13} strokeWidth={2.5} />
                <span>Released Information</span>
              </div>
              <span className="text-[11px] text-[#8d8c86] font-[600]">
                {groups.reduce((acc, g) => acc + g[1].length, 0)} fields
              </span>
            </div>
          ) : isSent ? (
            <div className="flex gap-[8px] m-[2px_4px_8px] p-[10px_12px] rounded-[14px] bg-[#e3f4e8] text-[#2d7a4b] text-[12px] font-[600]">
              <CheckIcon size={14} strokeWidth={3} />
              Already sent to {item.name} on {sentDate ? formatDate(sentDate) : 'previously'}
            </div>
          ) : (
            <div className="flex items-center gap-[8px] flex-wrap p-[6px_4px_10px]">
              <button
                type="button"
                onClick={() => {
                  const validKeys = Array.from(chosenKeys).filter(k => k !== 'All');
                  if (validKeys.length === totalKeys) {
                    updateSelectionKeys(new Set());
                  } else {
                    const allKeys = groups.flatMap((g, i) => g[1].map((_, j) => `${i}:${j}`));
                    updateSelectionKeys(new Set(allKeys));
                  }
                }}
                className={`h-[34px] px-[14px] rounded-full font-inherit text-[12px] font-[600] cursor-pointer transition-all duration-200 hover:-translate-y-[1px]
                  ${Array.from(chosenKeys).filter(k => k !== 'All').length === totalKeys ? 'bg-[#111] text-white' : 'bg-[#f1f0ea] text-[#111] hover:bg-[#e4e3dc]'}
                `}
              >
                {Array.from(chosenKeys).filter(k => k !== 'All').length === totalKeys ? 'Clear all fields' : 'Select all fields'}
              </button>
              
              {Array.from(chosenKeys).filter(k => k !== 'All').length > 0 && Array.from(chosenKeys).filter(k => k !== 'All').length < totalKeys && (
                <button
                  type="button"
                  onClick={() => updateSelectionKeys(new Set())}
                  className="border-0 bg-transparent font-inherit text-[11.5px] font-[600] text-[#8d8c86] hover:text-[#111] underline cursor-pointer p-0 ml-1"
                >
                  Clear all
                </button>
              )}

              <small className="ml-auto text-[11px] text-[#8d8c86] self-center font-[600]">
                {Array.from(chosenKeys).filter(k => k !== 'All').length}/{totalKeys} details
              </small>
            </div>
          )}

          {isAgent ? (
            <div className="space-y-3">
              {groups.length === 0 ? (
                <div className="text-center py-6 text-[#8d8c86] text-[12px]">
                  No field information was released for this candidate.
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g[0]} className="p-[10px_6px] border-t border-[#f1f0ea] first:border-t-0">
                    <h5 className="m-[0_0_8px] text-[10.5px] font-[700] tracking-[0.7px] uppercase text-[#064e3b]">
                      {g[0]}
                    </h5>
                    <div className="space-y-[4px]">
                      {g[1].map((r) => (
                        <div
                          key={r[0]}
                          className="flex items-start justify-between gap-[10px] py-[4px] px-[8px] rounded-[8px] bg-[#faf9f6] text-[12px]"
                        >
                          <span className="text-[#8d8c86] font-[500] shrink-0">{r[0]}</span>
                          <b className="text-right font-[600] text-[#111] break-words">{r[1]}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className={`transition-opacity duration-250 ${isSent ? 'pointer-events-none' : ''}`}>
              {groups.map((g, i) => {
                const groupKeys = g[1].map((_, j) => `${i}:${j}`);
                const allChecked = groupKeys.length > 0 && groupKeys.every(k => chosenKeys.has(k));

                return (
                  <div key={g[0]} className="p-[10px_4px] border-t border-[#f1f0ea] first:border-t-0">
                    <h5 className="m-[0_0_6px] flex items-center gap-[8px] text-[10.5px] font-[700] tracking-[0.7px] uppercase text-[#8d8c86]">
                      <CheckBox
                        checked={allChecked}
                        disabled={isSent}
                        className="w-[18px] h-[18px] rounded-[6px] [&>svg]:w-[10px] [&>svg]:h-[10px]"
                        onClick={() => {
                          if (isSent) return;
                          const next = new Set(chosenKeys);
                          next.delete('All');
                          if (allChecked) {
                            groupKeys.forEach(k => next.delete(k));
                          } else {
                            groupKeys.forEach(k => next.add(k));
                          }
                          updateSelectionKeys(next);
                        }}
                      />
                      {g[0]}
                    </h5>
                    
                    {g[1].map((r, j) => {
                      const key = `${i}:${j}`;
                      const checked = chosenKeys.has(key);
                      
                      return (
                        <div key={r[0]} className="flex items-start gap-[8px] p-[5px_0] text-[12.5px]">
                          <CheckBox
                            checked={checked}
                            disabled={isSent}
                            className="w-[18px] h-[18px] rounded-[6px] mt-[1px] [&>svg]:w-[10px] [&>svg]:h-[10px]"
                            onClick={() => {
                              if (isSent) return;
                              const next = new Set(chosenKeys);
                              next.delete('All');
                              if (checked) next.delete(key);
                              else next.add(key);
                              updateSelectionKeys(next);
                            }}
                          />
                          <span className="text-[#8d8c86] max-w-[42%]">{r[0]}</span>
                          <b className="flex-1 min-w-0 text-right font-[600]">{r[1]}</b>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
