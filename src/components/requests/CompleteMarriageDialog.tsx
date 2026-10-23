'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  Check, 
  X, 
  Loader2, 
  User2, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { finalizeMarriagePairing } from '@/lib/actions/requests';

export interface ReleasedCandidate {
  candidateProfileId: string;
  finalScore?: number;
  fullProfile?: any;
  candidateData?: any;
}

interface CompleteMarriageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceName: string;
  sourceProfileId: string;
  requestId: string;
  candidates: ReleasedCandidate[];
  onSuccess: (selectedCandidateId: string) => void;
  onToast: (msg: string) => void;
}

function computeAge(dob?: string | null): string {
  if (!dob) return '';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '';
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age > 0 ? `${age} yrs` : '';
}

export function CompleteMarriageDialog({
  isOpen,
  onClose,
  sourceName,
  sourceProfileId,
  requestId,
  candidates,
  onSuccess,
  onToast,
}: CompleteMarriageDialogProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (candidateId: string) => {
    setErrorMsg(null);
    setSelectedCandidateId((prev) => (prev === candidateId ? null : candidateId));
  };

  const handleContinue = async () => {
    if (!selectedCandidateId) {
      setErrorMsg('Please select the candidate who married this profile.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await finalizeMarriagePairing({
        requestId,
        sourceProfileId,
        candidateProfileId: selectedCandidateId,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to complete marriage pairing.');
        return;
      }

      onSuccess(selectedCandidateId);
    } catch (err: any) {
      console.error('Error completing marriage:', err);
      setErrorMsg(err?.message || 'An unexpected error occurred while completing marriage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div
        className="w-full max-w-xl bg-[#FAF8F5] rounded-[28px] border border-[#E9E4DC] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E9E4DC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E5EFE9] text-[#064e3b] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-[#064e3b]" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#1F3B34] leading-snug">
                Marriage Finalized
              </h2>
              <p className="text-[12px] text-[#7C756B]">
                Select who <span className="font-semibold text-[#1F3B34]">{sourceName || 'this profile'}</span> got married with
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7C756B] hover:text-[#1F3B34] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-[#FDF0D8]/60 border-b border-[#F5C770]/40 flex items-start gap-2.5 text-[11.5px] text-[#8B6122] leading-relaxed shrink-0">
          <Sparkles className="w-4 h-4 shrink-0 text-[#C86A4A] mt-0.5" />
          <div>
            Selecting a candidate confirms their marriage. Both profiles will be marked inactive & requests completed, and other unselected released matches will be automatically cleared.
          </div>
        </div>

        {/* Candidate List Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-[16px] bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {candidates.length === 0 ? (
            <div className="py-12 text-center text-[#8B8479]">
              <div className="w-12 h-12 rounded-full bg-[#EDE8E0] flex items-center justify-center mx-auto mb-3 text-[#A8A296]">
                <User2 className="w-6 h-6" />
              </div>
              <p className="text-[14px] font-bold text-[#1F3B34]">No Released Matches Available</p>
              <p className="text-[12px] text-[#8B8479] mt-1 max-w-sm mx-auto">
                No candidate releases were found for this profile in memory. Please ensure matches were approved and released.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C756B] px-1">
                Released Matches ({candidates.length}) — Select 1 Spouse
              </div>

              {candidates.map((c) => {
                const id = c.candidateProfileId;
                const p = c.fullProfile || c.candidateData || {};
                const name = p.full_name || 'Candidate';
                const age = computeAge(p.date_of_birth);
                const city = p.current_city_name_en || p.city || p.location || '';
                const occupation = p.occupation_name_en || p.job_title || '';
                const education = p.qualification || p.education_level_name_en || '';
                const isSelected = selectedCandidateId === id;
                const score = c.finalScore || p.final_score || 0;

                return (
                  <div
                    key={id}
                    onClick={() => !isSubmitting && handleSelect(id)}
                    className={`p-4 rounded-[20px] border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#E5EFE9]/60 border-[#064e3b] shadow-[0_4px_16px_rgba(6,78,59,0.12)] ring-1 ring-[#064e3b]'
                        : 'bg-white border-[#E9E4DC] hover:border-[#D5CEC2] hover:bg-[#FAF8F5]'
                    } ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    {/* Left: Avatar & Profile Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-[14px] flex items-center justify-center font-bold text-[15px] shrink-0 border ${
                          isSelected
                            ? 'bg-[#064e3b] text-white border-[#064e3b]'
                            : 'bg-[#F4EFE7] text-[#1F3B34] border-[#E9E2D4]'
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-[#1F3B34] truncate">
                            {name}
                          </span>
                          {score > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]">
                              {score}% Match
                            </span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11.5px] text-[#7C756B] mt-0.5">
                          {age && <span>{age}</span>}
                          {age && city && <span>•</span>}
                          {city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#A8A296]" />
                              {city}
                            </span>
                          )}
                          {(occupation || education) && <span>•</span>}
                          {occupation && (
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-[#A8A296]" />
                              {occupation}
                            </span>
                          )}
                          {!occupation && education && (
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-[#A8A296]" />
                              {education}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Checkbox */}
                    <div className="shrink-0 pl-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          isSelected
                            ? 'bg-[#064e3b] border-[#064e3b] text-white shadow-sm'
                            : 'border-[#C5BEB2] bg-white hover:border-[#1F3B34]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E9E4DC] flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-[13px] font-bold text-[#696256] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedCandidateId || isSubmitting}
            onClick={handleContinue}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#064e3b] hover:bg-[#053e2f] text-white text-[13px] font-bold shadow-[0_6px_20px_rgba(6,78,59,0.25)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Finalizing Marriage...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white" />
                <span>Confirm & Complete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
