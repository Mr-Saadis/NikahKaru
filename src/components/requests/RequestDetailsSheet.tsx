'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { RequestItem, ColumnDef } from './types';
import { useBottomSheet } from './useBottomSheet';
import { XIcon, PhoneIcon, CopyIcon, UserIcon, HashIcon, CalendarIcon, SparkIcon, BookmarkFilledIcon } from './icons';
import { MatchesSection } from './MatchesSection';
import { ProfileNav } from './ProfileNav';
import { ProfileSection } from './ProfileSection';
import { useScrollSpy } from './useScrollSpy';
import { useNavigationLock } from '@/lib/stores/navigation-lock-store';
import { fetchRequestReleaseHistory } from '@/lib/actions/requests';
import { ProfileAuditLogsSection } from './ProfileAuditLogsSection';
import { useAuth } from '@/lib/hooks/useAuth';
import { submitMatchRequest } from '@/lib/actions/agent-requests';

interface RequestDetailsSheetProps {
  item: RequestItem | null;
  allItems: RequestItem[];
  isOpen: boolean;
  columns: ColumnDef[];
  onClose: () => void;
  onToggleLater: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onToast: (msg: string) => void;
  onHeightChange?: (height: number) => void;
  matching: any;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const datePart = iso.split('T')[0];
  const [y, m, d] = datePart.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}

function getHeroBase(status: string, columns: ColumnDef[]): string {
  const col = columns.find((c) => c.key === status) ?? columns[0];
  const bg = col.cardBg;
  if (bg === 'transparent' || bg === '#fff' || bg === 'white') return '#e1e0d8';
  return bg;
}

function digitsOnly(s: string): string {
  return s.replace(/[^0-9]/g, '');
}

export default function RequestDetailsSheet({
  item,
  allItems,
  isOpen,
  onClose,
  onToggleLater,
  containerRef,
  onToast,
  onHeightChange,
  columns,
  matching,
}: RequestDetailsSheetProps) {
  const {
    height,
    isDragging,
    sheetRef,
    scrollRef,
    grabHandleProps,
    heroPointerProps,
  } = useBottomSheet({ isOpen, containerRef, onClose });

  const router = useRouter();
  const { role } = useAuth();
  const isAgent = role === 'AGENT';
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [stickyVisible, setStickyVisible] = useState(false);
  const prevIdRef = useRef<string | null>(null);

  const releaseHistory = item ? (matching.releaseHistory[item.id] || []) : [];

  useEffect(() => {
    onHeightChange?.(height);
  }, [height, onHeightChange]);

  useEffect(() => {
    if (item && item.id !== prevIdRef.current) {
      prevIdRef.current = item.id;
      setStickyVisible(false);
      
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      
      // Fetch release history if item is responded or completed
      fetchRequestReleaseHistory(item.id).then((history) => {
        matching.setReleaseHistory((prev: any) => ({ ...prev, [item.id]: history }));
        if (history && history.length > 0) {
          matching.loadSentProfiles(item, history);
        }
      });
    }
  }, [item, scrollRef, matching]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (matching.openProfile) {
          matching.setOpenProfile(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, matching]);

  const addLock = useNavigationLock((s) => s.addLock);
  const removeLock = useNavigationLock((s) => s.removeLock);
  
  const isMatchesOn = item ? matching.matchesOn[item.id] : false;
  const isMatchingLoading = item ? matching.matchingLoading[item.id] : false;

  useEffect(() => {
    if (item && isMatchingLoading) {
      addLock(`req-match-${item.id}`, `Finding matches for ${item.name}`);
    } else if (item) {
      removeLock(`req-match-${item.id}`);
    }
    return () => {
      if (item) removeLock(`req-match-${item.id}`);
    };
  }, [item?.id, isMatchingLoading, addLock, removeLock, item?.name]);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen, item?.id]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setStickyVisible(top > 150);
  }, []);

  const handleCopy = useCallback(
    async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value);
        onToast(`Copied ${label}`);
      } catch {
        onToast(`Failed to copy`);
      }
    },
    [onToast]
  );

  const handleToggleLater = useCallback(() => {
    if (!item) return;
    onToggleLater(item.id);
    onToast(item.later ? 'Returned to board' : 'Moved to Respond Later');
  }, [item, onToggleLater, onToast]);

  const matchesRef = useRef<HTMLDivElement>(null);

  const handleMatchNow = useCallback(() => {
    if (!item) return;
    const isTurningOn = !matching.matchesOn[item.id];
    matching.toggleMatches(item, isTurningOn);
    
    // Scroll logic if turned on
    if (isTurningOn) {
      setTimeout(() => {
        if (matchesRef.current && scrollRef.current) {
          scrollRef.current.scrollTo({
            top: matchesRef.current.getBoundingClientRect().top - scrollRef.current.getBoundingClientRect().top + scrollRef.current.scrollTop - 74,
            behavior: 'smooth'
          });
        }
      }, 500);
    }
  }, [item, matching, scrollRef]);

  const handleRematch = useCallback(() => {
    if (!item) return;
    // Real rematch logic could reset state, but for now just toast
    onToast('Matches refreshed (from cache)');
  }, [item, onToast]);

  const handleAgentSubmitRequest = useCallback(async () => {
    if (!item) return;
    setIsSubmittingRequest(true);
    try {
      const sourceProfileId = item.profileData?.profile_id || item.profileData?.id || item.id;
      const res = await submitMatchRequest(sourceProfileId);
      if (res.success) {
        onToast('Match analysis requested successfully!');
        onClose();
        router.refresh();
      } else {
        onToast(res.error || 'Failed to submit request');
      }
    } catch (e: any) {
      onToast(e.message || 'Error submitting request');
    } finally {
      setIsSubmittingRequest(false);
    }
  }, [item, onToast, onClose, router]);

  const activeSectionIndex = useScrollSpy(scrollRef, 'section[data-sec]', [item?.id, matching.matchesOn[item?.id || '']]);

  const handleNavClick = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const section = container.querySelector(`section[data-sec="${index}"]`) as HTMLElement;
    if (section) {
      container.scrollTo({
        top: section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 74,
        behavior: 'smooth'
      });
    }
  }, [scrollRef]);

  if (!item) return null;

  const col = columns.find((c) => c.key === item.status) ?? columns[0];
  const heroBase = getHeroBase(item.status, columns);
  const requestId = item.profileData?.request_id
    ? `REQ-${item.profileData.request_id.slice(0, 8).toUpperCase()}`
    : `PROF-${item.id.slice(0, 8).toUpperCase()}`;
  const noteValue = notesMap[item.id] ?? '';
  
  const page = matching.matchPage[item.id] || 0;
  const reqChosen = matching.chosen[item.id];
  let M = matching.realMatches[item.id] || [];
  
  if (isAgent || (!isMatchesOn && releaseHistory.length > 0)) {
    // For AGENT: only show profiles released by manager from history
    M = M.filter((m: any) => releaseHistory.some((r: any) => r.candidate_profile_id === m.candidateProfileId));
  }
  
  const S = M.filter((m: any) => matching.sentExtra[item.id]?.[m.candidateProfileId]);

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-label="Request details"
      aria-modal="false"
      aria-hidden={!isOpen}
      style={{
        position: 'absolute',
        left: 0,
        right: 10,
        bottom: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg,#fff,#fbfaf6)',
        borderRadius: '34px 34px 0 0',
        boxShadow: '0 -6px 28px rgba(20,20,40,.07), 0 0 0 1px rgba(20,20,40,.04)',
        height: isOpen ? height : 0,
        transition: isDragging
          ? 'none'
          : `height .45s cubic-bezier(.22,1,.36,1), transform .65s cubic-bezier(.22,1,.36,1), visibility 0s ${isOpen ? '0s' : '.65s'}`,
        transform: isOpen ? 'translateY(0)' : 'translateY(106%)',
        visibility: isOpen ? 'visible' : 'hidden',
        overscrollBehavior: 'contain',
        willChange: 'transform, height',
        ['--sh' as any]: `${height}px`,
      }}
    >
      <div
        {...grabHandleProps}
        style={{
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          touchAction: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 46, height: 5, borderRadius: 5, background: '#d3d2ca' }} />
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="group/close absolute top-[16px] right-[20px] w-[38px] h-[38px] rounded-full bg-white border-none flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,.12)] cursor-pointer z-[10] text-[#111] transition-all duration-200 hover:bg-[#111] hover:text-white hover:rotate-90"
      >
        <XIcon size={16} />
      </button>

      <div
        ref={scrollRef}
        className="sheet-hidden-scrollbar"
        onScroll={handleScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0 22px 26px',
          overscrollBehavior: 'contain',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: 62,
            margin: '0 -22px -62px',
            padding: '0 70px 0 24px',
            zIndex: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255,255,255,.82)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(20,20,40,.06)',
            opacity: stickyVisible ? 1 : 0,
            transform: stickyVisible ? 'translateY(0)' : 'translateY(-10px)',
            pointerEvents: stickyVisible ? 'auto' : 'none',
            transition: 'opacity .3s, transform .3s',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: heroBase,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: ['#2F3E51', '#1F3B34', '#C86A4A'].includes(heroBase) ? '#fff' : '#1F3B34',
              flexShrink: 0,
            }}
          >
            {getInitials(item.name)}
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3, color: '#111' }}>
            {item.name}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#111', color: '#fff', fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 9999 }}>
              {col.label}
            </span>
          </div>
        </div>

        <div key={item.id}>
          {/* HERO */}
          <div
            {...heroPointerProps}
            className="animate-[sheet-rise_.6s_cubic-bezier(.22,1,.36,1)_both]"
            style={{
              borderRadius: 28,
              padding: '24px 26px 20px',
              display: 'grid',
              gap: 18,
              overflow: 'hidden',
              position: 'relative',
              background: `linear-gradient(135deg, ${heroBase}, color-mix(in srgb, ${heroBase} 62%, #fff))`,
              animationDelay: '.04s',
              touchAction: 'none',
              cursor: 'grab',
            }}
          >
            <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,.34)', right: -60, top: -110, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.22)', right: 150, bottom: -90, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', paddingRight: 56, position: 'relative', flexWrap: 'wrap' }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: heroBase, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, fontWeight: 700, color: ['#2F3E51', '#1F3B34', '#C86A4A'].includes(heroBase) ? '#fff' : '#1F3B34', flexShrink: 0, boxShadow: '0 0 0 4px rgba(255,255,255,.7), 0 12px 26px rgba(0,0,0,.14)' }}>
                {getInitials(item.name)}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 29, fontWeight: 700, letterSpacing: -0.9, color: ['#2F3E51', '#1F3B34', '#C86A4A'].includes(heroBase) ? '#fff' : '#111', lineHeight: 1.1 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.75, margin: '6px 0 12px', color: ['#2F3E51', '#1F3B34', '#C86A4A'].includes(heroBase) ? '#fff' : '#111' }}>
                  {item.phone}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`tel:${digitsOnly(item.phone)}`} className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[#111] text-white text-[12px] font-[600] no-underline transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,.14)]">
                    <PhoneIcon size={14} /> Call now
                  </a>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleCopy(item.phone, item.phone); }} className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[rgba(255,255,255,.75)] backdrop-blur-[8px] text-[#111] text-[12px] font-[600] border-none cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,.14)]">
                    <CopyIcon size={14} /> Copy phone
                  </button>
                </div>
              </div>

              <span className="absolute top-[2px] right-[-10px] md:static md:mt-[2px] md:ml-auto inline-flex items-center gap-[6px] bg-[#111] text-white text-[12px] font-[600] p-[7px_14px] rounded-full shadow-[0_8px_18px_rgba(0,0,0,.2)] whitespace-nowrap">
                {col.label}
              </span>
            </div>

            <div className="flex items-center gap-[24px] flex-wrap relative z-[1] mt-2">
              {[
                ['hash', 'Request ID', requestId],
                ['user', 'Assigned Staff', item.staff],
                ['cal', 'Request Date', formatDate(item.date)],
              ].map((t) => (
                <div key={t[0]} className="flex flex-col">
                  <small className={`block text-[10.5px] ${['#2F3E51', '#1F3B34', '#C86A4A'].includes(heroBase) ? 'text-white/70' : 'text-[#8d8c86]'}`}>{t[1]}</small>
                  <b className={`block text-[13.5px] font-[600] mt-[1px] ${['#2F3E51', '#1F3B34', '#C86A4A'].includes(heroBase) ? 'text-white' : 'text-[#111]'}`}>{t[2]}</b>
                </div>
              ))}
              
              {isAgent ? (
                <div className="ml-auto flex items-center gap-[10px]">
                  {item.status === 'logged' && (
                    <button
                      type="button"
                      disabled={isSubmittingRequest}
                      onClick={handleAgentSubmitRequest}
                      className="inline-flex items-center gap-[9px] h-[48px] px-[24px] border-0 rounded-full bg-[#064e3b] text-white font-inherit text-[13.5px] font-[600] cursor-pointer shadow-[0_10px_24px_rgba(6,78,59,.25)] transition-all duration-200 hover:-translate-y-[2px] disabled:opacity-50"
                    >
                      <SparkIcon size={16} className={`text-[#eddd02] ${isSubmittingRequest ? 'animate-[sheet-spin_1s_linear_infinite]' : ''}`} />
                      <span>{isSubmittingRequest ? 'Submitting…' : 'Request Matches from Manager'}</span>
                    </button>
                  )}
                  {item.status === 'requested' && (
                    <div className="inline-flex items-center gap-2 h-[44px] px-[20px] rounded-full bg-[#FDF0D8] border border-[#F5C770] text-[#92400e] text-[13px] font-[600]">
                      <span>⏳ Awaiting Manager Review</span>
                    </div>
                  )}
                  {(item.status === 'responded' || item.status === 'done') && (
                    <div className="inline-flex items-center gap-2 h-[44px] px-[20px] rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] text-[13px] font-[600]">
                      <span>✓ Matches Released ({releaseHistory.length})</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-auto flex items-center gap-[10px]">
                  {isMatchesOn && (
                    <button
                      type="button"
                      onClick={handleRematch}
                      className="inline-flex items-center justify-center h-[48px] px-[20px] border-0 rounded-full bg-[rgba(255,255,255,.72)] backdrop-blur-[8px] text-[#111] font-inherit text-[13px] font-[600] cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,.08)] transition-all duration-250 hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(0,0,0,.15)]"
                    >
                      Rematch
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleMatchNow}
                    className="inline-flex items-center gap-[9px] h-[48px] px-[26px] border-0 rounded-full bg-[#111] text-white font-inherit text-[14px] font-[600] cursor-pointer shadow-[0_10px_24px_rgba(0,0,0,.25)] transition-all duration-250 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(0,0,0,.32)]"
                  >
                    <SparkIcon size={17} className={`text-[#eddd02] ${isMatchingLoading ? 'animate-[sheet-spin_1s_linear_infinite]' : ''}`} />
                    <span>{isMatchesOn ? 'Hide Matches' : isMatchingLoading ? 'Finding matches…' : (releaseHistory.length > 0 ? 'Rematch' : 'Match Now')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div id="mt" ref={matchesRef}>
            {(isMatchesOn || releaseHistory.length > 0) && (
              <MatchesSection
                item={item}
                matches={M}
                sent={S}
                page={page}
                setPage={matching.setPage}
                chosen={reqChosen}
                openProfile={matching.openProfile}
                setOpenProfile={matching.setOpenProfile}
                toggleSelection={matching.toggleSelection}
                releaseHistory={releaseHistory}
                sendSelected={(c) => matching.sendSelected(c, onToast, (candidateId: string, reqId: string) => matching.setOpenProfile({ candidateId, requestId: reqId }), () => matching.setOpenProfile(null))}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[272px_1fr] gap-[18px] mt-[18px] items-start animate-[sheet-rise_.6s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '.12s' }}>
            <ProfileNav
              item={item}
              activeIndex={activeSectionIndex}
              onNavClick={handleNavClick}
            />
            <ProfileSection item={item} />
          </div>

          {!isAgent && (
            <div className="bg-[#fff] border border-[#eeede6] shadow-[0_6px_18px_rgba(30,30,50,.05)] rounded-[24px] p-[18px_20px] mt-[16px] animate-[sheet-rise_.6s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '.26s' }}>
              <h4 className="m-[0_0_12px] text-[13px] font-[700] tracking-[-0.1px]">Manager notes</h4>
              <textarea
                placeholder="Write a note for this request…"
                value={noteValue}
                onChange={(e) => setNotesMap((p) => ({ ...p, [item.id]: e.target.value }))}
                className="w-full min-h-[96px] border-0 rounded-[18px] bg-[#faf9f6] p-[12px_14px] font-inherit text-[13px] resize-y outline-none shadow-[inset_0_0_0_1px_#e8e7e0] focus:shadow-[0_0_0_2px_#111]"
              />
            </div>
          )}


          {/* Profile Audit Logs (kb kia, kisny kia, kia kiaa) */}
          <ProfileAuditLogsSection
            profileId={item?.profileData?.profile_id || item?.profileData?.id || item?.id}
            profileName={item?.name}
          />


          <div className="flex gap-[10px] mt-[16px] animate-[sheet-rise_.6s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '.32s' }}>
            <button
              onClick={handleToggleLater}
              className="inline-flex items-center gap-[8px] h-[46px] px-[24px] rounded-full border-0 font-inherit text-[13px] font-[600] cursor-pointer transition-all duration-200 bg-[#111] text-white hover:-translate-y-[2px] hover:shadow-[0_8px_18px_rgba(0,0,0,.22)]"
            >
              <BookmarkFilledIcon size={15} />
              <span>{item.later ? 'Return to board' : 'Respond Later'}</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-[8px] h-[46px] px-[24px] rounded-full border-0 font-inherit text-[13px] font-[600] cursor-pointer transition-all duration-200 bg-[#f1f0ea] text-[#111] hover:bg-[#e1e0d8]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
