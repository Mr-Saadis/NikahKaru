'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PauseCircle, Clock, Calendar, Loader2, X, Sparkles } from 'lucide-react';
import { pauseProfileAction, extendProfilePauseAction } from '@/lib/actions/profiles';
import type { ProfilePauseInfo } from '@/lib/types/database.types';
import { formatPauseDate } from '@/lib/utils/pauseFormatting';

interface PauseProfileDialogProps {
  isOpen: boolean;
  mode?: 'pause' | 'extend';
  profileId: string;
  profileName: string;
  currentPauseInfo?: ProfilePauseInfo | null;
  onClose: () => void;
  onSuccess: (result: {
    status: 'PAUSED';
    boardStage: string;
    pauseInfo: ProfilePauseInfo;
  }) => void;
  onToast?: (msg: string) => void;
}

type PresetOption = '3' | '7' | '15' | '30' | 'custom' | 'indefinite';
type CustomMode = 'days' | 'date';

const QUICK_REASONS = [
  'Family traveling',
  'Considering another proposal',
  'Temporarily unavailable',
  'Client requested hold',
];

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PauseProfileDialog({
  isOpen,
  mode = 'pause',
  profileId,
  profileName,
  currentPauseInfo,
  onClose,
  onSuccess,
  onToast,
}: PauseProfileDialogProps) {
  const [preset, setPreset] = useState<PresetOption>('7');
  const [customMode, setCustomMode] = useState<CustomMode>('days');
  const [customDays, setCustomDays] = useState<string>('10');
  const [customDate, setCustomDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (mode === 'extend' && currentPauseInfo) {
        setReason(currentPauseInfo.reason || '');
        if (currentPauseInfo.pause_days && [3, 7, 15, 30].includes(currentPauseInfo.pause_days)) {
          setPreset(String(currentPauseInfo.pause_days) as PresetOption);
        } else if (!currentPauseInfo.pause_until) {
          setPreset('7');
        } else {
          setPreset('7');
        }
      } else {
        setPreset('7');
        setCustomMode('days');
        setCustomDays('10');
        setCustomDate('');
        setReason('');
      }
    }
  }, [isOpen, mode, currentPauseInfo]);

  const previewTarget = useMemo<{ label: string; valid: boolean }>(() => {
    if (preset === 'indefinite') {
      return {
        label: 'No automatic reminder — profile stays paused until manually activated.',
        valid: true,
      };
    }

    if (preset === 'custom') {
      if (customMode === 'days') {
        const parsed = parseInt(customDays, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 365) {
          return { label: 'Enter between 1 and 365 days.', valid: false };
        }
        const dt = new Date(Date.now() + parsed * 86_400_000).toISOString();
        return {
          label: `Reminder will trigger on ${formatPauseDate(dt)} (${parsed} day${parsed === 1 ? '' : 's'}).`,
          valid: true,
        };
      } else {
        if (!customDate) {
          return { label: 'Select a reminder date.', valid: false };
        }
        const dt = new Date(`${customDate}T04:00:00.000Z`);
        if (isNaN(dt.getTime())) {
          return { label: 'Invalid date selected.', valid: false };
        }
        const todayStr = getTodayDateString();
        if (customDate < todayStr) {
          return { label: 'Reminder date cannot be in the past.', valid: false };
        }
        return {
          label: `Reminder will trigger on ${formatPauseDate(dt.toISOString())}.`,
          valid: true,
        };
      }
    }

    const days = parseInt(preset, 10);
    const dt = new Date(Date.now() + days * 86_400_000).toISOString();
    return {
      label: `Reminder will trigger on ${formatPauseDate(dt)} (${days} days).`,
      valid: true,
    };
  }, [preset, customMode, customDays, customDate]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !previewTarget.valid) return;

    let durationDays: number | null = null;
    let customUntilIso: string | null = null;

    if (preset === 'indefinite') {
      durationDays = null;
      customUntilIso = null;
    } else if (preset === 'custom') {
      if (customMode === 'days') {
        durationDays = parseInt(customDays, 10);
      } else {
        customUntilIso = customDate;
      }
    } else {
      durationDays = parseInt(preset, 10);
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const actionFn = mode === 'extend' ? extendProfilePauseAction : pauseProfileAction;
      const res = await actionFn({
        profileId,
        durationDays,
        customUntilIso,
        reason: reason.trim() || null,
      });

      if (!res.success || !res.pauseInfo) {
        const msg = res.error || 'Failed to update pause schedule.';
        setError(msg);
        onToast?.(msg);
        return;
      }

      const toastText =
        mode === 'extend'
          ? res.pauseInfo.pause_until
            ? `Reminder updated for ${formatPauseDate(res.pauseInfo.pause_until)}.`
            : 'Pause updated to indefinite (no end timer).'
          : res.pauseInfo.pause_until
            ? `Profile paused with reminder on ${formatPauseDate(res.pauseInfo.pause_until)}.`
            : 'Profile paused indefinitely.';

      onToast?.(toastText);
      onSuccess({
        status: 'PAUSED',
        boardStage: res.boardStage || 'pause',
        pauseInfo: res.pauseInfo,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Unexpected error updating pause state.';
      setError(msg);
      onToast?.(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetButtons: { key: PresetOption; label: string }[] = [
    { key: '3', label: '3 Days' },
    { key: '7', label: '7 Days' },
    { key: '15', label: '15 Days' },
    { key: '30', label: '30 Days' },
    { key: 'custom', label: 'Custom' },
    { key: 'indefinite', label: 'No Timer' },
  ];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FAF8F5] rounded-[28px] border border-[#E9E4DC] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="px-6 py-5 bg-white border-b border-[#E9E4DC] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#F7ECE6] border border-[#EBCFC1] flex items-center justify-center text-[#C86A4A] shrink-0">
              {mode === 'extend' ? <Clock className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold text-[#1F3B34] leading-snug">
                {mode === 'extend' ? 'Update Pause Reminder' : 'Pause Profile'}
              </h3>
              <p className="text-[12px] text-[#7C756B] truncate">
                Set reminder schedule for{' '}
                <span className="font-semibold text-[#1F3B34]">{profileName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7C756B] hover:text-[#1F3B34] hover:bg-[#FAF8F5] transition-colors disabled:opacity-40 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <p className="text-[12.5px] text-[#696256] leading-relaxed">
            Paused profiles are temporarily excluded from matching and moved to the{' '}
            <strong className="text-[#1F3B34]">Paused</strong> column until reactivated.
          </p>

          {/* Duration Selector */}
          <div className="bg-white rounded-[22px] p-4 border border-[#E9E4DC]">
            <label className="block text-[11px] font-extrabold text-[#7C756B] uppercase tracking-wider mb-3">
              Reminder Timer
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presetButtons.map((btn) => {
                const active = preset === btn.key;
                return (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => setPreset(btn.key)}
                    className={`h-9 px-3 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#1F3B34] text-white shadow-[0_4px_12px_rgba(31,59,52,0.18)]'
                        : 'bg-[#FAF8F5] text-[#1F3B34] border border-[#E9E4DC] hover:bg-[#F2EDE1]'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {preset === 'custom' && (
              <div className="mt-3.5 pt-3.5 border-t border-[#F0EBE2] space-y-2.5">
                <div className="flex bg-[#F2EDE1] p-1 rounded-full gap-1">
                  <button
                    type="button"
                    onClick={() => setCustomMode('days')}
                    className={`flex-1 h-7 rounded-full text-[11.5px] font-semibold transition-all cursor-pointer ${
                      customMode === 'days'
                        ? 'bg-white text-[#1F3B34] shadow-xs'
                        : 'text-[#696256] hover:text-[#1F3B34]'
                    }`}
                  >
                    Number of Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode('date');
                      if (!customDate) {
                        const nextWeek = new Date(Date.now() + 7 * 86_400_000);
                        const y = nextWeek.getFullYear();
                        const m = String(nextWeek.getMonth() + 1).padStart(2, '0');
                        const d = String(nextWeek.getDate()).padStart(2, '0');
                        setCustomDate(`${y}-${m}-${d}`);
                      }
                    }}
                    className={`flex-1 h-7 rounded-full text-[11.5px] font-semibold transition-all cursor-pointer ${
                      customMode === 'date'
                        ? 'bg-white text-[#1F3B34] shadow-xs'
                        : 'text-[#696256] hover:text-[#1F3B34]'
                    }`}
                  >
                    Specific Date
                  </button>
                </div>

                {customMode === 'days' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="e.g. 14"
                      className="w-full h-10 px-4 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC] text-[13px] font-semibold text-[#1F3B34] outline-none focus:border-[#1F3B34] focus:bg-white transition-colors"
                    />
                    <span className="text-[12px] font-semibold text-[#696256] shrink-0 pr-1">Days</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#696256] pointer-events-none" />
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC] text-[13px] font-semibold text-[#1F3B34] outline-none focus:border-[#1F3B34] focus:bg-white transition-colors"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Live Preview Banner */}
            <div
              className={`mt-3.5 rounded-2xl px-3.5 py-2.5 text-[12px] font-medium flex items-start gap-2 border ${
                !previewTarget.valid
                  ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                  : preset === 'indefinite'
                    ? 'bg-[#F4EFE7] border-[#E9E4DC] text-[#5C5449]'
                    : 'bg-[#E5EFE9]/75 border-[#D1E3DC] text-[#1F3B34]'
              }`}
            >
              <Sparkles
                size={14}
                className={`shrink-0 mt-0.5 ${
                  !previewTarget.valid
                    ? 'text-[#991B1B]'
                    : preset === 'indefinite'
                      ? 'text-[#888174]'
                      : 'text-[#1F3B34]'
                }`}
              />
              <span>{previewTarget.label}</span>
            </div>
          </div>

          {/* Reason / Note */}
          <div className="bg-white rounded-[22px] p-4 border border-[#E9E4DC]">
            <label className="block text-[11px] font-extrabold text-[#7C756B] uppercase tracking-wider mb-2.5">
              Reason / Note <span className="font-medium lowercase text-[#A49C8F]">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_REASONS.map((chip) => {
                const selected = reason.trim().toLowerCase() === chip.toLowerCase();
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setReason(selected ? '' : chip)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                      selected
                        ? 'bg-[#C86A4A] text-white border-[#C86A4A]'
                        : 'bg-[#FAF8F5] text-[#4E473D] border-[#E9E4DC] hover:bg-[#F2EDE1]'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="e.g. Client requested pause for 2 weeks..."
              className="w-full h-10 px-4 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC] text-[13px] text-[#1F3B34] placeholder:text-[#A49C8F] outline-none focus:border-[#1F3B34] focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-[12px] font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E9E4DC] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-full text-[13px] font-bold text-[#696256] hover:bg-[#FAF8F5] transition-colors disabled:opacity-40 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !previewTarget.valid}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1F3B34] hover:bg-[#172E29] text-white text-[13px] font-bold shadow-[0_6px_20px_rgba(31,59,52,0.22)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                {mode === 'extend' ? <Clock size={14} /> : <PauseCircle size={14} />}
                <span>{mode === 'extend' ? 'Save Reminder' : 'Confirm Pause'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

