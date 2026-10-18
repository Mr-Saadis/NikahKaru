'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { RequestItem, ColumnDef } from './types';
import { useBottomSheet } from './useBottomSheet';
import { XIcon, PhoneIcon, CopyIcon, UserIcon, HashIcon, CalendarIcon, SparkIcon, BookmarkFilledIcon } from './icons';
import { FileDown, UserCheck, ChevronDown, Search, Trash2, Pencil } from 'lucide-react';
import DeleteProfileDialog from './DeleteProfileDialog';
import { MatchesSection } from './MatchesSection';
import { ProfileNav } from './ProfileNav';
import { ProfileSection } from './ProfileSection';
import { useScrollSpy } from './useScrollSpy';
import { useNavigationLock } from '@/lib/stores/navigation-lock-store';
import { 
  fetchRequestReleaseHistory, 
  fetchProfileActivePreferences,
  fetchAgentsList,
  assignProfileToAgent,
  type AgentOption,
} from '@/lib/actions/requests';
import { ProfileAuditLogsSection } from './ProfileAuditLogsSection';
import { useAuth } from '@/lib/hooks/useAuth';
import { submitMatchRequest } from '@/lib/actions/agent-requests';
import { generateSingleProfilePDF, generateReleasedProfilesPDF } from '@/lib/utils/pdfExport';
import { notificationService } from '@/lib/services/notification-service';
import { createBrowserClient } from '@supabase/ssr';

// Session-level memory cache for profile active preferences (Rule 2.1)
const preferencesCache = new Map<string, any>();
const inFlightPreferencesFetches = new Set<string>();

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
  hideRespondLater?: boolean;
  isDirectory?: boolean;
  rightOffset?: number | string;
  onItemStaffUpdated?: (itemId: string, newStaff: string) => void;
  onProfileDeleted?: (profileId: string) => void;
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
  hideRespondLater = false,
  isDirectory = false,
  rightOffset = 10,
  onItemStaffUpdated,
  onProfileDeleted,
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
  const isAdmin = role === 'HIGH_LEVEL_ADMIN';
  const isManager = role === 'MANAGER';
  const canAssign = isAdmin || isManager;

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isDownloadingProfilePdf, setIsDownloadingProfilePdf] = useState(false);
  const [isDownloadingMatchesPdf, setIsDownloadingMatchesPdf] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Assignment states
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [confirmAssignAgent, setConfirmAssignAgent] = useState<AgentOption | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch agents list when sheet is open for Admin or Manager
  useEffect(() => {
    if (isOpen && canAssign && agentOptions.length === 0 && !isLoadingAgents) {
      setIsLoadingAgents(true);
      fetchAgentsList()
        .then((data) => setAgentOptions(data))
        .catch((err) => console.error('Failed to load agents list:', err))
        .finally(() => setIsLoadingAgents(false));
    }
  }, [isOpen, canAssign, agentOptions.length, isLoadingAgents]);

  // Close assign dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) {
        setIsAssignDropdownOpen(false);
      }
    }
    if (isAssignDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAssignDropdownOpen]);

  const handleSelectAgent = (agent: AgentOption) => {
    setIsAssignDropdownOpen(false);
    setConfirmAssignAgent(agent);
  };

  const handleExecuteAssignment = async () => {
    if (!confirmAssignAgent || !item) return;

    setIsAssigning(true);
    try {
      const targetProfileId = item.profileData?.profile_id || item.profileData?.source_profile_id || (item.profileData?.request_id && item.profileData?.request_id === item.id ? item.id : item.id);
      const targetRequestId = item.profileData?.request_id || (item.profileData?.request_status ? item.id : undefined);

      const res = await assignProfileToAgent({
        profileId: targetProfileId,
        requestId: targetRequestId,
        targetAgentId: confirmAssignAgent.id,
        targetAgentName: confirmAssignAgent.name,
        profileName: item.name,
        previousAgentName: item.staff,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to assign profile');
      }

      // Update local item
      item.staff = confirmAssignAgent.name;
      if (item.profileData) {
        item.profileData.current_agent_name = confirmAssignAgent.name;
        item.profileData.current_agent_id = confirmAssignAgent.id;
      }

      if (onItemStaffUpdated) {
        onItemStaffUpdated(item.id, confirmAssignAgent.name);
      }

      onToast(`Profile assigned to ${confirmAssignAgent.name}`);
      setConfirmAssignAgent(null);
    } catch (err: any) {
      console.error('Error in handleExecuteAssignment:', err);
      onToast(err.message || 'Failed to assign profile');
    } finally {
      setIsAssigning(false);
    }
  };

  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [stickyVisible, setStickyVisible] = useState(false);
  const [isLoadingReleaseData, setIsLoadingReleaseData] = useState(false);
  const prevItemIdRef = useRef<string | null>(null);

  const releaseHistory = item ? (matching.releaseHistory[item.id] || []) : [];

  // For new data, first time request, and second time request, no profiles have been released yet
  const canHaveReleases = item ? !['new', 'first', 'second', 'logged'].includes(item.status) : false;

  const isReleaseCached = !!(
    item &&
    (!canHaveReleases || (
      matching.releaseHistory[item.id] !== undefined &&
      (matching.releaseHistory[item.id].length === 0 ||
        (matching.realMatches[item.id] && matching.realMatches[item.id].length > 0))
    ))
  );

  const isActuallyLoading = canHaveReleases && (isLoadingReleaseData || (!isReleaseCached && isOpen && !!item));

  const matchingRef = useRef(matching);
  matchingRef.current = matching;
  const inFlightFetchRef = useRef<string | null>(null);

  const profileId = item?.profileData?.profile_id || item?.profileData?.source_profile_id || (item?.profileData?.request_id && item?.profileData?.request_id === item?.id ? undefined : item?.id) || item?.profileData?.id;

  const [preferences, setPreferences] = useState<any | null>(() => {
    return profileId ? (preferencesCache.get(profileId) || null) : null;
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(() => {
    return profileId ? !preferencesCache.has(profileId) : false;
  });

  useEffect(() => {
    if (!profileId || !isOpen) {
      setPreferences(null);
      setIsLoadingPrefs(false);
      return;
    }

    if (preferencesCache.has(profileId)) {
      setPreferences(preferencesCache.get(profileId));
      setIsLoadingPrefs(false);
      return;
    }

    // Reset previous preferences while loading fresh profile preferences
    setPreferences(null);
    setIsLoadingPrefs(true);

    if (inFlightPreferencesFetches.has(profileId)) return;
    inFlightPreferencesFetches.add(profileId);

    fetchProfileActivePreferences(profileId)
      .then((data) => {
        preferencesCache.set(profileId, data || null);
        setPreferences(data || null);
      })
      .catch((err) => {
        console.error('Failed to load profile preferences:', err);
      })
      .finally(() => {
        inFlightPreferencesFetches.delete(profileId);
        setIsLoadingPrefs(false);
      });
  }, [profileId, isOpen]);

  useEffect(() => {
    onHeightChange?.(height);
  }, [height, onHeightChange]);

  useEffect(() => {
    if (!item || !isOpen) return;

    if (!canHaveReleases) {
      setIsLoadingReleaseData(false);
      return;
    }

    const currentMatching = matchingRef.current;
    const cachedHistory = currentMatching.releaseHistory[item.id];
    const cachedMatches = currentMatching.realMatches[item.id];

    // Already cached: do not re-fetch
    if (cachedHistory !== undefined && (cachedHistory.length === 0 || (cachedMatches && cachedMatches.length > 0))) {
      setIsLoadingReleaseData(false);
      return;
    }

    // Already in-flight for this item: avoid concurrent duplicate requests
    if (inFlightFetchRef.current === item.id) return;

    if (item.id !== prevItemIdRef.current) {
      prevItemIdRef.current = item.id;
      setStickyVisible(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }

    inFlightFetchRef.current = item.id;
    setIsLoadingReleaseData(true);
    let isMounted = true;

    (async () => {
      try {
        await currentMatching.loadSentProfiles(item);
      } catch (err) {
        console.error('Error loading release history/profiles:', err);
      } finally {
        inFlightFetchRef.current = null;
        if (isMounted) {
          setIsLoadingReleaseData(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [item?.id, isOpen, canHaveReleases]);

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

  const isResponded = Boolean(
    item &&
    (['responded', 'downloaded', 'done'].includes(item.status) ||
      releaseHistory.length > 0 ||
      ['IN_REVIEW', 'DOWNLOADED', 'COMPLETED'].includes((item.profileData as any)?.request_status))
  );

  const isNewData = Boolean(
    item &&
    (item.status === 'new' || (item.profileData as any)?.boardStage === 'new') &&
    !(item.profileData as any)?.request_id
  );

  const handleDownloadProfilePdf = useCallback(async () => {
    if (!item) return;
    try {
      setIsDownloadingProfilePdf(true);
      onToast('Generating profile PDF...');
      await generateSingleProfilePDF({
        item,
        preferences,
      });
      onToast('Profile PDF downloaded successfully');
    } catch (err) {
      console.error('Failed to download profile PDF:', err);
      onToast('Failed to download profile PDF');
    } finally {
      setIsDownloadingProfilePdf(false);
    }
  }, [item, preferences, onToast]);

  const handleDownloadMatchesPdf = useCallback(async () => {
    if (!item) return;
    try {
      setIsDownloadingMatchesPdf(true);
      onToast('Generating matches PDF...');

      const targetRequestId = (item.profileData as any)?.request_id || (item.id.length === 36 ? item.id : undefined);
      let releaseDetails: any = null;

      if (targetRequestId) {
        try {
          releaseDetails = await notificationService.getRequestWithReleases(targetRequestId);
        } catch (e) {
          console.warn('Could not fetch via notificationService:', e);
        }
      }

      if (!releaseDetails || !releaseDetails.releases || releaseDetails.releases.length === 0) {
        const sourceProfileId = (item.profileData as any)?.profile_id || (item.profileData as any)?.id || item.id;
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: latestReq } = await supabase
          .from('information_requests')
          .select('id')
          .eq('source_profile_id', sourceProfileId)
          .in('status', ['IN_REVIEW', 'COMPLETED', 'DOWNLOADED'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestReq?.id) {
          try {
            releaseDetails = await notificationService.getRequestWithReleases(latestReq.id);
          } catch (e) {
            console.warn('Could not fetch latest request via notificationService:', e);
          }
        }
      }

      if (releaseDetails && releaseDetails.releases && releaseDetails.releases.length > 0) {
        await generateReleasedProfilesPDF({
          sourceProfile: releaseDetails.target_profile || {
            full_name: item.name,
            phone: item.phone,
            date_of_birth: (item.profileData as any)?.date_of_birth,
            marital_status: (item.profileData as any)?.marital_status,
            location: (item.profileData as any)?.current_city_name_en || (item.profileData as any)?.current_location_text,
          },
          agent: releaseDetails.agent || {
            full_name: item.staff,
            phone: 'N/A',
          },
          releases: releaseDetails.releases,
          requestId: targetRequestId,
        });
        onToast('Matches PDF downloaded successfully');
      } else {
        const currentM = matchingRef.current;
        const cachedMatches = currentM.realMatches[item.id] || [];
        const cachedHistory = currentM.releaseHistory[item.id] || [];

        if (cachedMatches.length > 0 && cachedHistory.length > 0) {
          const fallbackReleases = cachedHistory.map((h: any) => {
            const match = cachedMatches.find((m: any) => m.candidateProfileId === h.candidate_profile_id);
            const p = match?.fullProfile || match?.candidateData;
            return {
              candidate_profile_id: h.candidate_profile_id,
              candidate: {
                full_name: p?.full_name || h.candidate_name || 'Candidate',
                gender: p?.gender,
                marital_status: p?.marital_status,
              },
              score: match?.finalScore,
              rank: match?.rank,
              fields: (h.selected_fields || []).map((f: string) => ({ field_path: f, field_value: '' })),
              released_at: h.released_at,
            };
          });

          await generateReleasedProfilesPDF({
            sourceProfile: {
              full_name: item.name,
              phone: item.phone,
              date_of_birth: (item.profileData as any)?.date_of_birth,
              marital_status: (item.profileData as any)?.marital_status,
              location: (item.profileData as any)?.current_city_name_en || (item.profileData as any)?.current_location_text,
            },
            agent: {
              full_name: item.staff,
              phone: 'N/A',
            },
            releases: fallbackReleases,
            requestId: targetRequestId,
          });
          onToast('Matches PDF downloaded successfully');
        } else {
          onToast('No released matches found for this profile');
        }
      }
    } catch (err) {
      console.error('Failed to download matches PDF:', err);
      onToast('Failed to download matches PDF');
    } finally {
      setIsDownloadingMatchesPdf(false);
    }
  }, [item, onToast]);

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
        right: rightOffset,
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
          : `height .45s cubic-bezier(.22,1,.36,1), transform .65s cubic-bezier(.22,1,.36,1), right .4s cubic-bezier(.22,1,.36,1), visibility 0s ${isOpen ? '0s' : '.65s'}`,
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
        className="group/close absolute top-[16px] right-[20px] w-[38px] h-[38px] rounded-full bg-white border-none flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,.12)] cursor-pointer z-[40] text-[#111] transition-all duration-200 hover:bg-[#111] hover:text-white hover:rotate-90"
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
          {canAssign && profileId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/add-profile?edit=${profileId}`);
              }}
              title="Edit Profile"
              className="inline-flex items-center gap-1.5 h-[28px] px-2.5 rounded-full bg-white text-[#111] text-[11px] font-semibold border border-black/10 hover:bg-gray-100 transition-colors shadow-sm ml-1 cursor-pointer"
            >
              <Pencil size={11} />
              <span>Edit</span>
            </button>
          )}
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
              position: 'relative',
              zIndex: 30,
              background: `linear-gradient(135deg, ${heroBase}, color-mix(in srgb, ${heroBase} 62%, #fff))`,
              animationDelay: '.04s',
              touchAction: 'none',
              cursor: 'grab',
            }}
          >
            {/* Background Decorative Circles clipped inside */}
            <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
              <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,.34)', right: -60, top: -110 }} />
              <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.22)', right: 150, bottom: -90 }} />
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', paddingRight: 56, position: 'relative', zIndex: 40, flexWrap: 'wrap' }}>
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

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a href={`tel:${digitsOnly(item.phone)}`} className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[#111] text-white text-[12px] font-[600] no-underline transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,.14)]">
                    <PhoneIcon size={14} /> Call now
                  </a>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleCopy(item.phone, item.phone); }} className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[rgba(255,255,255,.75)] backdrop-blur-[8px] text-[#111] text-[12px] font-[600] border-none cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,.14)]">
                    <CopyIcon size={14} /> Copy phone
                  </button>

                  {/* Edit Profile Button (Admins & Managers) */}
                  {canAssign && profileId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/add-profile?edit=${profileId}`);
                      }}
                      title="Edit this profile in Add Profile form"
                      className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[rgba(255,255,255,.85)] hover:bg-white text-[#111] text-[12px] font-[600] border-none cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,.14)]"
                    >
                      <Pencil size={13} />
                      <span>Edit Profile</span>
                    </button>
                  )}

                  {/* Assign Profile Button & Dropdown (Admins & Managers) */}
                  {canAssign && (
                    <div className="relative inline-block z-[50]" ref={assignDropdownRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAssignDropdownOpen(!isAssignDropdownOpen);
                        }}
                        title="Assign profile to an agent"
                        className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[#1F3B34] text-white text-[12px] font-[600] border-none cursor-pointer shadow-[0_4px_12px_rgba(31,59,52,.2)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_18px_rgba(31,59,52,.3)]"
                      >
                        <UserCheck size={14} />
                        <span>Assign</span>
                        <ChevronDown size={13} className={`opacity-70 transition-transform duration-200 ${isAssignDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isAssignDropdownOpen && (
                        <div 
                          className="absolute top-[42px] left-0 w-[240px] max-h-[300px] bg-white rounded-[18px] shadow-[0_16px_40px_rgba(0,0,0,0.25)] border border-black/10 py-2 z-[99999] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-3 pb-2 pt-1 border-b border-black/5">
                            <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-1.5 px-1">
                              Assign To Agent
                            </div>
                            <div className="relative">
                              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search agent..."
                                value={agentSearchQuery}
                                onChange={(e) => setAgentSearchQuery(e.target.value)}
                                className="w-full h-[28px] pl-7 pr-2.5 text-[12px] rounded-full bg-gray-100 border-none outline-none focus:ring-1 focus:ring-[#064e3b]"
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto max-h-[200px] py-1 px-1.5 space-y-0.5">
                            {isLoadingAgents ? (
                              <div className="py-4 text-center text-[12px] text-gray-400">Loading agents...</div>
                            ) : (() => {
                              const filteredAgents = agentOptions.filter((ag) =>
                                ag.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
                                (ag.email && ag.email.toLowerCase().includes(agentSearchQuery.toLowerCase()))
                              );
                              if (filteredAgents.length === 0) {
                                return <div className="py-4 text-center text-[12px] text-gray-400">No agents found</div>;
                              }
                              const currentStaff = item?.staff || item?.profileData?.current_agent_name || '';
                              return filteredAgents.map((ag) => {
                                const isCurrent = currentStaff.toLowerCase() === ag.name.toLowerCase() || (item.profileData?.current_agent_id && item.profileData.current_agent_id === ag.id);
                                return (
                                  <button
                                    key={ag.id}
                                    type="button"
                                    onClick={() => handleSelectAgent(ag)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-left text-[12px] transition-colors cursor-pointer ${
                                      isCurrent 
                                        ? 'bg-[#064e3b]/10 text-[#064e3b] font-semibold' 
                                        : 'hover:bg-gray-100 text-[#222]'
                                    }`}
                                  >
                                    <span className="truncate pr-2">{ag.name}</span>
                                    {isCurrent && (
                                      <span className="shrink-0 text-[10px] bg-[#064e3b] text-white px-2 py-0.5 rounded-full font-bold">
                                        Current
                                      </span>
                                    )}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isDirectory && isAdmin && (
                    <>
                      <button
                        type="button"
                        disabled={isDownloadingProfilePdf}
                        onClick={(e) => { e.stopPropagation(); handleDownloadProfilePdf(); }}
                        title="Download complete profile dossier PDF"
                        className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[#064e3b] text-white text-[12px] font-[600] border-none cursor-pointer shadow-[0_4px_12px_rgba(6,78,59,.2)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_18px_rgba(6,78,59,.3)] disabled:opacity-50"
                      >
                        <FileDown size={14} className={isDownloadingProfilePdf ? "animate-spin" : ""} />
                        <span>{isDownloadingProfilePdf ? "Downloading..." : "Download Profile PDF"}</span>
                      </button>

                      {isResponded && (
                        <button
                          type="button"
                          disabled={isDownloadingMatchesPdf}
                          onClick={(e) => { e.stopPropagation(); handleDownloadMatchesPdf(); }}
                          title="Download PDF of sent/released matches for this profile"
                          className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-[#C86A4A] text-white text-[12px] font-[600] border-none cursor-pointer shadow-[0_4px_12px_rgba(200,106,74,.25)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_18px_rgba(200,106,74,.35)] disabled:opacity-50"
                        >
                          <FileDown size={14} className={isDownloadingMatchesPdf ? "animate-spin" : ""} />
                          <span>{isDownloadingMatchesPdf ? "Downloading..." : "Download Matches PDF"}</span>
                        </button>
                      )}

                      {isNewData && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Permanently delete profile (Only available for New Data)"
                          className="inline-flex items-center gap-[7px] h-[34px] px-[14px] rounded-full bg-red-600 hover:bg-red-700 text-white text-[12px] font-[600] border-none cursor-pointer shadow-[0_4px_12px_rgba(220,38,38,.25)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_18px_rgba(220,38,38,.35)]"
                        >
                          <Trash2 size={14} />
                          <span>Delete Profile</span>
                        </button>
                      )}
                    </>
                  )}
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
                  {(item.status === 'responded' || item.status === 'downloaded' || item.status === 'done' || releaseHistory.length > 0) && (
                    isActuallyLoading ? (
                      <div className="inline-flex items-center gap-2 h-[44px] px-[20px] rounded-full bg-[#F2EDE1] border border-[#E5DFD3] text-[#2F3E51] text-[13px] font-[600]">
                        <SparkIcon size={16} className="text-[#C86A4A] animate-[sheet-spin_1s_linear_infinite]" />
                        <span>Loading released matches…</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 h-[44px] px-[20px] rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] text-[13px] font-[600]">
                        <span>✓ Matches Released ({releaseHistory.length})</span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="ml-auto flex items-center gap-[10px]">
                  {isMatchesOn && (
                    <button
                      type="button"
                      disabled={isActuallyLoading || isMatchingLoading}
                      onClick={handleRematch}
                      className="inline-flex items-center justify-center h-[48px] px-[20px] border-0 rounded-full bg-[rgba(255,255,255,.72)] backdrop-blur-[8px] text-[#111] font-inherit text-[13px] font-[600] cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,.08)] transition-all duration-250 hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(0,0,0,.15)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Rematch
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isActuallyLoading || isMatchingLoading}
                    onClick={handleMatchNow}
                    className="inline-flex items-center gap-[9px] h-[48px] px-[26px] border-0 rounded-full bg-[#111] text-white font-inherit text-[14px] font-[600] cursor-pointer shadow-[0_10px_24px_rgba(0,0,0,.25)] transition-all duration-250 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(0,0,0,.32)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <SparkIcon size={17} className={`text-[#eddd02] ${(isActuallyLoading || isMatchingLoading) ? 'animate-[sheet-spin_1s_linear_infinite]' : ''}`} />
                    <span>
                      {isActuallyLoading
                        ? 'Loading matches…'
                        : isMatchesOn
                          ? 'Hide Matches'
                          : isMatchingLoading
                            ? 'Finding matches…'
                            : (releaseHistory.length > 0 ? 'Rematch' : 'Match Now')}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div id="mt" ref={matchesRef}>
            {!isActuallyLoading && (isMatchesOn || releaseHistory.length > 0) && (
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
                deleteSentProfiles={(c, ids) => matching.deleteSentProfiles(c, ids, onToast)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[272px_1fr] gap-[18px] mt-[18px] items-start animate-[sheet-rise_.6s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '.12s' }}>
            <ProfileNav
              item={item}
              activeIndex={activeSectionIndex}
              onNavClick={handleNavClick}
            />
            <ProfileSection 
              item={item}
              preferences={preferences}
              isLoadingPrefs={isLoadingPrefs}
            />
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


          {/* Profile Audit Logs () */}
          <ProfileAuditLogsSection
            profileId={item?.profileData?.profile_id || item?.profileData?.id || item?.id}
            profileName={item?.name}
          />


          <div className="flex gap-[10px] mt-[16px] animate-[sheet-rise_.6s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '.32s' }}>
            {!hideRespondLater && (
              <button
                onClick={handleToggleLater}
                className="inline-flex items-center gap-[8px] h-[46px] px-[24px] rounded-full border-0 font-inherit text-[13px] font-[600] cursor-pointer transition-all duration-200 bg-[#111] text-white hover:-translate-y-[2px] hover:shadow-[0_8px_18px_rgba(0,0,0,.22)]"
              >
                <BookmarkFilledIcon size={15} />
                <span>{item.later ? 'Return to board' : 'Respond Later'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-[8px] h-[46px] px-[24px] rounded-full border-0 font-inherit text-[13px] font-[600] cursor-pointer transition-all duration-200 bg-[#f1f0ea] text-[#111] hover:bg-[#e1e0d8]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ── Option A Confirmation Modal (Two-step Profile Assignment) ── */}
      {confirmAssignAgent && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isAssigning && setConfirmAssignAgent(null)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-[26px] p-6 shadow-2xl border border-black/5 text-[#1F1E1B]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#064e3b]/10 text-[#064e3b] flex items-center justify-center shrink-0">
                <UserCheck size={22} />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#111] leading-tight">Confirm Profile Assignment</h3>
                <p className="text-[12px] text-[#666] mt-0.5">Two-step verification</p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] rounded-[20px] p-4.5 border border-[#ECE7DE] mb-6 space-y-3">
              <div className="text-[14px] text-[#333] leading-relaxed">
                Do you want to assign this profile (<strong className="text-[#111]">{item.name}</strong>) to agent <strong className="text-[#064e3b]">{confirmAssignAgent.name}</strong>?
              </div>
              
              <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="block text-[10.5px] text-[#888] uppercase tracking-wider font-semibold mb-0.5">Current Agent</span>
                  <span className="font-semibold text-[#111] truncate block" title={item.staff || 'Unassigned'}>
                    {item.staff || 'Unassigned'}
                  </span>
                </div>
                <div className="text-[#064e3b] font-bold text-base px-2">➜</div>
                <div className="min-w-0 flex-1 pl-2 text-right">
                  <span className="block text-[10.5px] text-[#888] uppercase tracking-wider font-semibold mb-0.5">New Agent</span>
                  <span className="font-bold text-[#064e3b] truncate block" title={confirmAssignAgent.name}>
                    {confirmAssignAgent.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isAssigning}
                onClick={() => setConfirmAssignAgent(null)}
                className="h-[38px] px-5 rounded-full border border-black/15 text-[13px] font-semibold text-[#555] hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAssigning}
                onClick={handleExecuteAssignment}
                className="h-[38px] px-5 rounded-full bg-[#064e3b] text-white text-[13px] font-semibold shadow-md hover:bg-[#053d2e] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isAssigning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <span>Confirm Assignment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Confirmation Dialog (New Data Only) */}
      {profileId && isNewData && (
        <DeleteProfileDialog
          isOpen={isDeleteDialogOpen}
          profileId={profileId}
          profileName={item?.name || 'Profile'}
          cnic={item?.cnic}
          onClose={() => setIsDeleteDialogOpen(false)}
          onSuccess={() => {
            onProfileDeleted?.(profileId);
            onClose();
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}
