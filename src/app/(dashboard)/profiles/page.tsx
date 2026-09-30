'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from '@/components/layout/Header';
import {
  Users,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Calendar,
  Heart,
  Home,
  User2,
  Eye,
  Edit2,
  MoreHorizontal,
  Loader2,
  UserCircle,
  Ruler,
  BookOpen,
  Sparkles,
  GraduationCap,
  CheckCircle,
  FileText,
  PauseCircle,
  Archive,
  Globe,
  Briefcase,
  Info,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  Send,
  Award,
  Mars,
  Venus,
} from 'lucide-react';
import { ProfileService, type ProfileFilters } from '@/lib/services/profile-service';
import type { ProfileListItem, ProfileStatus, FullProfile } from '@/lib/types/database.types';
import Link from 'next/link';
import { useReferenceData } from '@/lib/hooks/useReferenceData';
import { runMatching } from '@/lib/matching/engine';
import { createClient } from '@/lib/supabase/client';
import {
  getMockMatchResults,
  getMatchDistribution,
  getAverageScore,
  getHighestScore,
  getHighMatchCount,
  getScoreColor,
  getScoreBg,
  getScoreLabel,
  getMockMatchBreakdown,
  type MockMatchResult,
  type MockBreakdown,
} from '@/lib/matching/mock-scoring';
import { useNavigationLock } from '@/lib/stores/navigation-lock-store';

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

const STATUS_TABS: { label: string; value: ProfileStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal' },
  { id: 'education', label: 'Education' },
  { id: 'family', label: 'Family' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'location', label: 'Location' },
];

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function computeAge(dob: string | null | undefined): string {
  if (!dob) return '-';
  const ageNum = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  return `${ageNum}`;
}

function formatEnum(val: string | null | undefined): string {
  if (!val) return '-';
  return val
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════

function StatusBadge({ status, size = 'sm' }: { status: ProfileStatus; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'text-[12px] px-3 py-1' : 'text-[10.5px] px-2 py-0.5';
  switch (status) {
    case 'ACTIVE':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc] ${cls}`}>
          <span className="w-[6px] h-[6px] rounded-full bg-[#16a34a]" />
          Active
        </span>
      );
    case 'DRAFT':
      return <span className={`inline-flex items-center font-bold rounded-full bg-[#F4EFE7] text-[#696256] ${cls}`}>Draft</span>;
    case 'PAUSED':
      return <span className={`inline-flex items-center font-bold rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F6E1BA] ${cls}`}>Paused</span>;
    case 'ARCHIVED':
      return <span className={`inline-flex items-center font-bold rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/40 ${cls}`}>Archived</span>;
    default:
      return <span className={`font-bold text-[#696256] ${cls}`}>{status}</span>;
  }
}

/** Fanned out animated stat deck (replaces 2x2 grid) */
function StatDeck({ stats }: { stats: { total: number; active: number; draft: number; paused: number; archived?: number } }) {
  return (
    <div className="relative w-full h-[170px] flex items-center justify-center group perspective-1000 overflow-visible">
      {/* Card 4: Paused (Bottom layer) */}
      <div className="absolute w-[125px] h-[75px] bg-white/5 backdrop-blur-md rounded-[20px] shadow-lg border border-white/10 flex flex-col justify-center px-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        group-hover:translate-x-[65px] group-hover:translate-y-[42px] group-hover:rotate-0 hover:bg-white/10
        translate-x-[45px] -translate-y-[5px] rotate-[12deg] z-10 cursor-default hover:!scale-105"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <PauseCircle className="w-3.5 h-3.5 text-[#C86A4A]" />
          <span className="text-[9px] font-extrabold text-white/50 uppercase tracking-widest">Paused</span>
        </div>
        <span className="text-[20px] font-black text-white leading-none">{stats.paused}</span>
      </div>

      {/* Card 3: Archived */}
      <div className="absolute w-[125px] h-[75px] bg-white/5 backdrop-blur-md rounded-[20px] shadow-lg border border-white/10 flex flex-col justify-center px-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        group-hover:translate-x-[-65px] group-hover:translate-y-[42px] group-hover:rotate-0 hover:bg-white/10
        -translate-x-[45px] translate-y-[5px] rotate-[-8deg] z-20 cursor-default hover:!scale-105"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <Archive className="w-3.5 h-3.5 text-[#991B1B]" />
          <span className="text-[9px] font-extrabold text-white/50 uppercase tracking-widest">Archived</span>
        </div>
        <span className="text-[20px] font-black text-white leading-none">{stats.archived || 0}</span>
      </div>

      {/* Card 2: Active */}
      <div className="absolute w-[125px] h-[75px] bg-white/5 backdrop-blur-md rounded-[20px] shadow-lg border border-white/10 flex flex-col justify-center px-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        group-hover:translate-x-[65px] group-hover:translate-y-[-42px] group-hover:rotate-0 hover:bg-white/10
        translate-x-[15px] translate-y-[10px] rotate-[6deg] z-30 cursor-default hover:!scale-105"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <CheckCircle className="w-3.5 h-3.5 text-[#A3B18A]" />
          <span className="text-[9px] font-extrabold text-white/50 uppercase tracking-widest">Active</span>
        </div>
        <span className="text-[20px] font-black text-white leading-none">{stats.active}</span>
      </div>

      {/* Card 1: Total (Top layer) */}
      <div className="absolute w-[125px] h-[75px] bg-white/2 backdrop-blur-md rounded-[20px] shadow-xl border border-white/20 flex flex-col justify-center px-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        group-hover:translate-x-[-65px] group-hover:translate-y-[-42px] group-hover:rotate-0 hover:bg-[#b55f41]
        -translate-x-[5px] translate-y-[20px] rotate-[-2deg] z-40 cursor-default hover:!scale-105"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <Users className="w-3.5 h-3.5 text-white/80" />
          <span className="text-[9px] font-extrabold text-white/70 uppercase tracking-widest">Total</span>
        </div>
        <span className="text-[20px] font-black text-white leading-none">{stats.total}</span>
      </div>

      {/* Hover Instruction Overlay */}
      <div className="absolute bottom-1 text-[9px] font-black text-white/30 tracking-[0.2em] uppercase opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
        Hover to view
      </div>
    </div>
  );
}

/** Section card wrapper for the detail workspace (V5 Premium Styling) */
function DetailSection({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white rounded-[24px] p-6 flex flex-col gap-5 border border-black/[0.04] shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[12px] bg-[#E3DDCB]/40 flex items-center justify-center text-[#1F3B34]">
          {icon}
        </div>
        <h3 className="text-[16px] font-bold text-[#1F3B34]">{title}</h3>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/** Key–value row */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline py-[5px]">
      <span className="text-[12px] text-[#8B8479] shrink-0">{label}</span>
      <span className="text-[12px] font-semibold text-[#1E1F22] text-right ml-3 truncate max-w-[60%]">
        {value || '-'}
      </span>
    </div>
  );
}

/** Compact summary card (bottom row) */
function CompactCard({
  icon,
  title,
  detail,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
  items: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="bg-white rounded-[18px] border border-[#ECE5D9] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#F4EFE7] flex items-center justify-center text-[#6D6558] shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold text-[#1F1E1B] truncate">{title}</div>
          {detail && <div className="text-[10.5px] text-[#8B8479] truncate">{detail}</div>}
        </div>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${item.color || 'bg-[#16a34a]'}`} />
            <span className="text-[11px] text-[#6D6558] truncate">
              <span className="font-medium">{item.label}:</span> {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════

export default function ProfilesListPage() {
  const {
    getCityById,
    getCountryById,
    getProvinceById,
    getReligionById,
    getSectById,
    getCasteById,
    getMotherTongueById,
  } = useReferenceData();

  // ── State ─────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<ProfileFilters>({
    page: 1,
    limit: 20,
    status: undefined,
    search: undefined,
  });

  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, paused: 0, archived: 0 });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<FullProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeBreakdownTab, setActiveBreakdownTab] = useState('All');
  const BREAKDOWN_TABS = ['All', 'Age & Marital Status', 'Physical', 'Religion & Culture', 'Income & Career', 'Location', 'Lifestyle'];

  const [realMatchResultsMap, setRealMatchResultsMap] = useState<Record<string, any>>({});
  const [prefetchedProfiles, setPrefetchedProfiles] = useState<Record<string, FullProfile>>({});

  // ── Match request state (demo) ────────────────────────────────
  const [matchRequested, setMatchRequested] = useState(false);
  const [matchRequesting, setMatchRequesting] = useState(false);
  const [runningMatchesMap, setRunningMatchesMap] = useState<Record<string, boolean>>({});
  const { addLock, removeLock, isLocked } = useNavigationLock();

  // Block browser tab close/refresh while algos are running
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isLocked()) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isLocked]);

  // Reset request state when profile changes
  useEffect(() => {
    setMatchRequested(false);
    setSelectedMatchId(null);
  }, [selectedId]);

  // ── Matching data (Mock or Real) ────────
  const matchData = useMemo(() => {
    if (!selectedId || profiles.length === 0) return null;

    let results = [];
    let isReal = false;

    // Use real results if available for this profile
    if (realMatchResultsMap[selectedId]) {
      results = realMatchResultsMap[selectedId];
      isReal = true;
    }
    
    if (results.length === 0) return { results: [], distribution: { excellent: 0, high: 0, good: 0, moderate: 0, lower: 0 }, average: 0, highest: 0, highCount: 0, totalCompared: 0, top5: [], isReal };

    const distribution = getMatchDistribution(results);
    const average = getAverageScore(results);
    const highest = getHighestScore(results);
    const highCount = getHighMatchCount(results);
    
    // Top 5 by score, displayed in DESCENDING order (highest first)
    const top5 = [...results].sort((a, b) => b.score - a.score).slice(0, 5);

    return { results, distribution, average, highest, highCount, totalCompared: results.length, top5, isReal };
  }, [selectedId, profiles, realMatchResultsMap]);

  // Auto-select the top match so the Detailed Analytics panel is visible by default
  useEffect(() => {
    if (matchData?.top5?.[0] && !selectedMatchId) {
      setSelectedMatchId(matchData.top5[0].candidateId);
    }
  }, [matchData, selectedMatchId]);

  // ── Resolve a candidate ID to the profile list item ───────────
  const findProfile = useCallback(
    (id: string) => {
      // Return from prefetch cache if it exists, else list
      return prefetchedProfiles[id] || (profiles.find((p) => p.id === id) ?? null);
    },
    [profiles, prefetchedProfiles],
  );

  // ── Prefetch missing profiles for top 5 matches ───────────
  useEffect(() => {
    if (!matchData?.isReal || !matchData.top5) return;

    const missingIds = matchData.top5
      .map(m => m.candidateId)
      .filter(id => !findProfile(id));

    if (missingIds.length > 0) {
      const fetchMissing = async () => {
        try {
          const promises = missingIds.map(id => ProfileService.getProfileById(id));
          const results = await Promise.all(promises);
          
          setPrefetchedProfiles(prev => {
            const newMap = { ...prev };
            results.forEach((p: any) => { if (p) newMap[p.id] = p; });
            return newMap;
          });
        } catch (e) {
          console.error("Failed to prefetch candidate profiles", e);
        }
      };
      fetchMissing();
    }
  }, [matchData, findProfile]);

  // ── Run Real Matching Algorithm ────────────────────────────────
  const handleRunMatches = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId || !selectedProfile) return;
    
    const currentId = selectedId;
    const profileName = selectedProfile?.personal_information?.full_name || 'Profile';
    setRunningMatchesMap(prev => ({ ...prev, [currentId]: true }));
    addLock(currentId, `Running match for ${profileName}`);
    try {
      const supabase = createClient();
      
      const matchResults = await runMatching(supabase, currentId, {
        persist: false,
        executedBy: 'frontend-preview',
      });
      
      const realResults = matchResults.map(res => ({
        candidateId: res.candidateProfileId,
        score: Math.round(res.finalScore),
        _realResult: res // attach full payload for breakdown UI
      }));

      setRealMatchResultsMap(prev => ({
        ...prev,
        [currentId]: realResults
      }));

    } catch (error: any) {
      console.error("Error running matches:", error);
      alert(error.message || "Failed to run algorithm. Please check if this profile has active preferences setup.");
    } finally {
      setRunningMatchesMap(prev => ({ ...prev, [currentId]: false }));
      removeLock(currentId);
    }
  };

  // ── Handle request match (demo) ───────────────────────────────
  const handleRequestMatch = async () => {
    setMatchRequesting(true);
    // Simulate network delay — no real backend call
    await new Promise((r) => setTimeout(r, 900));
    setMatchRequesting(false);
    setMatchRequested(true);
  };

  // ── Load stats (once) ─────────────────────────────────────────
  useEffect(() => {
    ProfileService.getProfileStats()
      .then(setStats)
      .catch(console.error);
  }, []);

  // ── Load profile list ─────────────────────────────────────────
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProfileService.getProfilesList(filters);
      setProfiles(res.data);
      setTotalCount(res.count);
      if (res.data.length > 0 && !selectedId) {
        setSelectedId(res.data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // ── Full profile cache (avoids re-fetch on switch back) ────────
  const fullProfileCache = useRef<Record<string, FullProfile>>({});

  // ── Load selected profile detail (from cache or network) ──────
  useEffect(() => {
    if (!selectedId) {
      setSelectedProfile(null);
      return;
    }

    // If already cached, use instantly — no loading state
    if (fullProfileCache.current[selectedId]) {
      setSelectedProfile(fullProfileCache.current[selectedId]);
      setActiveTab('overview');
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    ProfileService.getProfileById(selectedId)
      .then((data) => {
        if (!cancelled) {
          const profile = data as FullProfile;
          fullProfileCache.current[selectedId] = profile; // cache it
          setSelectedProfile(profile);
          setActiveTab('overview');
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setSelectedProfile(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // ── Background prefetch all profiles on current page ──────────
  useEffect(() => {
    if (profiles.length === 0) return;

    const uncachedIds = profiles
      .map(p => p.id)
      .filter(id => !fullProfileCache.current[id]);

    if (uncachedIds.length === 0) return;

    // Prefetch in small batches to avoid overwhelming the server
    const batchSize = 5;
    let currentBatch = 0;

    const fetchBatch = async () => {
      const batch = uncachedIds.slice(currentBatch * batchSize, (currentBatch + 1) * batchSize);
      if (batch.length === 0) return;

      try {
        const results = await Promise.all(
          batch.map(id => ProfileService.getProfileById(id).catch(() => null))
        );
        results.forEach(data => {
          if (data) {
            fullProfileCache.current[data.id] = data as FullProfile;
          }
        });
      } catch (e) {
        console.error('Background prefetch error:', e);
      }

      currentBatch++;
      if (currentBatch * batchSize < uncachedIds.length) {
        // Small delay between batches
        setTimeout(fetchBatch, 300);
      }
    };

    // Start prefetch after a short delay (don't block initial render)
    const timer = setTimeout(fetchBatch, 500);
    return () => clearTimeout(timer);
  }, [profiles]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedId(null);
    setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
  };

  const handleTabChange = (status: ProfileStatus | 'ALL') => {
    setSelectedId(null);
    setFilters((f) => ({
      ...f,
      status: status === 'ALL' ? undefined : (status as ProfileStatus),
      page: 1,
    }));
  };

  const isClickScrolling = useRef(false);
  const breakdownTabsRef = useRef<HTMLDivElement>(null);

  const scrollBreakdownTabs = (direction: 'left' | 'right') => {
    if (breakdownTabsRef.current) {
      const scrollAmount = 200;
      breakdownTabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  const smoothScrollTo = (tabId: string, retryCount = 0) => {
    const container = document.getElementById('details-scroll-container');
    const target = document.getElementById(`section-${tabId}`);

    if (!container || !target) {
      if (retryCount < 3) {
        setTimeout(() => smoothScrollTo(tabId, retryCount + 1), 50);
      }
      return;
    }

    isClickScrolling.current = true;
    const startPos = container.scrollTop;
    const distance = target.getBoundingClientRect().top - container.getBoundingClientRect().top - 20; // 20px top padding
    const duration = 1000; // 1 second duration for premium slow glide
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // easeInOutQuart easing for very smooth start and end
      const ease = progress < 0.5
        ? 8 * Math.pow(progress, 4)
        : 1 - Math.pow(-2 * progress + 2, 4) / 2;

      container.scrollTop = startPos + distance * ease;

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        isClickScrolling.current = false;
      }
    };

    requestAnimationFrame(animation);
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === 'overview') {
      setActiveTab('overview');
    } else {
      setActiveTab(tabId);
      smoothScrollTo(tabId);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeTab === 'overview' || isClickScrolling.current) return;

    const container = e.currentTarget;
    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) <= 10;
    if (isAtBottom) {
      setActiveTab(prev => prev !== 'location' ? 'location' : prev);
      return;
    }

    const sections = ['personal', 'education', 'family', 'lifestyle', 'location'];
    const containerRect = container.getBoundingClientRect();
    const targetLine = containerRect.top + 100;

    for (const id of sections) {
      const el = document.getElementById(`section-${id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > targetLine) {
          setActiveTab(prev => prev !== id ? id : prev);
          break;
        }
      }
    }
  };

  const totalPages = Math.ceil(totalCount / (filters.limit || 20));

  const resolveCity = (p: ProfileListItem) => {
    if (p.profile_locations?.current_city_id) {
      const c = getCityById(p.profile_locations.current_city_id);
      if (c) return c.name_en;
    }
    return null;
  };

  // ── Build subtitle for selected profile header ────────────────
  const buildSubtitle = (p: FullProfile): string => {
    const parts: string[] = [];
    if (p.employment_records?.length) {
      const current = p.employment_records.find((e) => e.is_current) || p.employment_records[0];
      if (current.job_title) parts.push(current.job_title);
      if (current.organization_name) parts.push(current.organization_name);
    }
    if (parts.length) return parts.join(' – ');
    if (p.education_records?.length) {
      const highest = p.education_records.find((e) => e.is_highest_qualification) || p.education_records[0];
      return [highest.qualification, highest.field_of_study].filter(Boolean).join(' in ') || 'Matrimonial Profile';
    }
    return 'Matrimonial Profile';
  };

  // ════════════════════════════════════════════════════════════════
  // WORKSPACE TAB CONTENT RENDERERS
  // ════════════════════════════════════════════════════════════════

  const sp = selectedProfile; // shorthand

  const renderOverviewTab = () => {
    if (!sp) return null;
    
    if (!matchData?.isReal) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-[#F5F0E8] rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-[#C86A4A]" />
          </div>
          <h3 className="text-[24px] font-extrabold text-[#1F1E1B] mb-3">Unlock Compatibility Insights</h3>
          <p className="text-[14px] text-[#717972] max-w-md mb-8">
            Run our advanced matching algorithm to see detailed score breakdowns, top candidate recommendations, and compatibility analytics for this profile.
          </p>
          <button
            onClick={handleRunMatches}
            disabled={runningMatchesMap[selectedId!]}
            className="flex items-center gap-3 bg-[#C86A4A] hover:bg-[#a6563b] text-white font-bold text-[15px] px-8 py-4 rounded-full shadow-lg shadow-[#C86A4A]/20 transition-all disabled:opacity-70 disabled:hover:bg-[#C86A4A]"
          >
            {runningMatchesMap[selectedId!] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {runningMatchesMap[selectedId!] ? 'Running Algorithm...' : 'Run Match Algorithm'}
          </button>
        </div>
      );
    }
    
    if (matchData.results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-[#F5F0E8] rounded-full flex items-center justify-center mb-6">
            <Info className="w-10 h-10 text-[#717972]" />
          </div>
          <h3 className="text-[24px] font-extrabold text-[#1F1E1B] mb-3">No Matches Found</h3>
          <p className="text-[14px] text-[#717972] max-w-md">
            The algorithm ran successfully but couldn't find any eligible candidates that pass the mandatory hard filters for this profile.
          </p>
        </div>
      );
    }

    const { results, distribution, average, highest, highCount, totalCompared, top5 } = matchData;

    // ── SVG Donut Chart ─────────────────────────────────────────
    const DonutSvg = ({ pct, size = 100, sw = 9, color = '#064e3b' }: { pct: number; size?: number; sw?: number; color?: string }) => {
      const r = (size - sw) / 2;
      const c = 2 * Math.PI * r;
      const off = c * (1 - pct / 100);
      const cx = size / 2;
      return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E5EFE9" strokeWidth={sw} />
            <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={sw}
              strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
              className="transition-all duration-700 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-extrabold text-[#064e3b] leading-none">{pct}</span>
            <span className="text-[9px] text-[#8B8479] font-semibold -mt-0.5">% avg</span>
          </div>
        </div>
      );
    };

    const distBars: { label: string; count: number; color: string }[] = [
      { label: 'Excellent (90%+)', count: distribution.excellent, color: '#16a34a' },
      { label: 'High (80–89%)', count: distribution.high, color: '#064e3b' },
      { label: 'Good (70–79%)', count: distribution.good, color: '#D4AF37' },
      { label: 'Moderate (60–69%)', count: distribution.moderate, color: '#ea580c' },
      { label: 'Lower (<60%)', count: distribution.lower, color: '#dc2626' },
    ];

    return (
      <div className="@container w-full max-w-[1400px]">
        <div className="flex flex-col @[1100px]:flex-row gap-6 w-full">

          {/* ═══ Left Side: Main Analytics ═══ */}
          <div className="flex flex-col gap-5 flex-1 w-full @[1100px]:max-w-[1000px]">
            {/* ═══ Main grid: Overview (3/5) + Distribution & Request (2/5) ═══ */}
            <div className="grid grid-cols-1 @[800px]:grid-cols-5 gap-5">
              {/* ── LEFT: Compatibility Overview ── */}
              <div className="@[800px]:col-span-3 flex flex-col h-full min-w-0">
                {(() => {
                  const selectedMatch = results.find((m: any) => m.candidateId === selectedMatchId) || top5[0];
                  const cp = selectedMatch ? findProfile(selectedMatch.candidateId) : null;

                  if (!selectedMatch || !cp) return null;

                  return (
                    <section className="w-full flex-1 flex flex-col rounded-[24px] p-6 lg:p-8 bg-white border border-[#E9E4DC] shadow-sm relative overflow-hidden">

                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2.5 text-[15px] font-extrabold text-[#002b17] tracking-tight">
                          <BarChart3 className="w-[20px] h-[20px] text-[#C86A4A]" />
                          <span>Compatibility Overview</span>
                        </div>
                        <button
                          onClick={() => { setSelectedId(selectedMatch.candidateId); setSelectedMatchId(null); }}
                          className="text-[11px] font-bold text-[#C86A4A] hover:text-[#a6563b] transition-colors flex items-center gap-1.5 bg-[#F5F0E8]/50 px-3 py-1.5 rounded-full border border-[#E9E4DC]/50"
                        >
                          View Full Profile <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Profile & Total Score */}
                      {/* <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
                        {cp.profile_URL ? (
                          <img src={cp.profile_URL} alt={cp.personal_information?.full_name} className="w-[64px] h-[64px] rounded-full object-cover shrink-0 shadow-sm border border-[#E9E4DC]" />
                        ) : (
                          <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center font-bold text-[24px] shrink-0 bg-[#A3B18A] text-[#1F3B34] shadow-sm">
                            {cp.personal_information?.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 gap-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[20px] font-bold text-[#1F3B34] tracking-tight leading-none">
                              {cp.personal_information?.full_name || 'Unknown'}
                            </span>
                            <span className="text-[24px] font-black text-[#A3B18A] shrink-0 leading-none">{selectedMatch.score}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-[#FAF8F5] border border-[#E9E4DC] rounded-full h-[10px] overflow-hidden shadow-inner">
                              <div className="h-full rounded-full transition-all duration-700 ease-out bg-[#A3B18A]" style={{ width: `${selectedMatch.score}%` }} />
                            </div>
                          </div>
                        </div>
                      </div> */}

                      {/* Expanded Analytics / Breakdown */}
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-1 mb-4">
                          <button 
                            onClick={() => scrollBreakdownTabs('left')} 
                            className="shrink-0 flex items-center justify-center w-6 h-6 text-[#7b8592] hover:text-[#002b17] transition-colors"
                            aria-label="Scroll left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          
                          <nav ref={breakdownTabsRef} className="flex-1 flex gap-6 text-[13px] font-medium text-[#7b8592] overflow-x-auto no-scrollbar scroll-smooth border-b border-[#E9E4DC]">
                            {BREAKDOWN_TABS.map(tab => {
                              const isActive = activeBreakdownTab === tab;
                              return (
                                <button
                                  key={tab}
                                  onClick={() => setActiveBreakdownTab(tab)}
                                  className={`pb-[6px] whitespace-nowrap cursor-pointer transition-colors duration-200 border-b-2 ${
                                    isActive 
                                      ? 'text-[#002b17] font-semibold border-[#C86A4A]' 
                                      : 'border-transparent hover:text-[#002b17]'
                                  }`}
                                >
                                  {tab}
                                </button>
                              )
                            })}
                          </nav>

                          <button 
                            onClick={() => scrollBreakdownTabs('right')} 
                            className="shrink-0 flex items-center justify-center w-6 h-6 text-[#7b8592] hover:text-[#002b17] transition-colors"
                            aria-label="Scroll right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {(() => {
                          let breakdownItems: { raw_category: string, category: string; score: number }[] = [];
                          if (matchData.isReal && selectedMatch._realResult) {
                            breakdownItems = selectedMatch._realResult.breakdowns.sourceToCandidate.map((b: any) => ({
                              raw_category: b.criterion_code,
                              category: b.criterion_code.replace('_', ' ').toUpperCase(),
                              score: Math.round(b.raw_score * 100)
                            }));
                          } else {
                            breakdownItems = getMockMatchBreakdown(selectedId!, selectedMatch.candidateId).map((b: any) => ({
                              raw_category: b.category.toUpperCase().replace(' ', '_'),
                              category: b.category.toUpperCase(),
                              score: b.score
                            }));
                          }

                          const categoryGroups = [
                            { title: 'Age & Marital Status', keys: ['AGE', 'MARITAL_STATUS', 'CHILDREN'] },
                            { title: 'Physical', keys: ['HEIGHT', 'WEIGHT', 'DISABILITY', 'COMPLEXION'] },
                            { title: 'Religion & Culture', keys: ['RELIGION', 'SECT', 'CASTE', 'RELIGIOUS_PRACTICE'] },
                            { title: 'Income & Career', keys: ['INCOME'] },
                            { title: 'Location', keys: ['COUNTRY'] },
                            { title: 'Lifestyle', keys: ['FAMILY_SETUP', 'SMOKING', 'BEARD', 'HIJAB'] },
                          ];

                          const groupedKeys = new Set(categoryGroups.flatMap(g => g.keys));
                          const otherItems = breakdownItems.filter(item => !groupedKeys.has(item.raw_category));

                          let itemsToRender: any[] = [];
                          if (activeBreakdownTab === 'All') {
                            itemsToRender = breakdownItems;
                          } else if (activeBreakdownTab === 'Other Criteria') {
                            itemsToRender = otherItems;
                          } else {
                            const group = categoryGroups.find(g => g.title === activeBreakdownTab);
                            if (group) {
                              itemsToRender = breakdownItems.filter(item => group.keys.includes(item.raw_category));
                            }
                          }

                          if (itemsToRender.length === 0) {
                             return <div className="text-[12px] text-[#A8A296] py-4">No data available for this category.</div>;
                          }

                          return (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              {itemsToRender.map((item) => {
                                const isPerfect = item.score === 100;
                                const barColor = isPerfect ? '#1F3B34' : '#A3B18A'; 
                                return (
                                  <div key={item.category} className="bg-[#FAF8F5] rounded-[20px] p-4 lg:p-5 flex flex-col justify-between h-[105px] border border-[#E9E4DC] shadow-sm relative overflow-hidden group hover:border-[#dcd5c2] transition-colors">
                                    <div className="absolute left-0 right-0 bottom-0 h-[40px] opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#1F3B34 1.5px, transparent 1.5px)', backgroundSize: '6px 6px' }} />
                                    <span className="text-[12px] font-bold text-[#717972] relative z-10 truncate" title={item.category}>{item.category}</span>
                                    <div className="flex flex-col gap-2.5 mt-auto relative z-10">
                                      <span className="text-[26px] font-light text-[#1F1E1B] leading-none tracking-tight">{item.score}%</span>
                                      <div className="w-full bg-white rounded-full h-[6px] overflow-hidden border border-[#E9E4DC]">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.score}%`, backgroundColor: barColor }} />
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </section>
                  );
                })()}
              </div>

              {/* ── RIGHT: Distribution + Request (stacked) ── */}
              <div className="@[800px]:col-span-2 flex flex-col gap-5 min-w-0">
                {/* Selected Match Summary */}
                {(() => {
                  const selectedMatch = results.find((m: any) => m.candidateId === selectedMatchId) || top5[0];
                  const cp = selectedMatch ? findProfile(selectedMatch.candidateId) : null;

                  return (
                    <section className="bg-[#2F3E51] rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[260px]">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '20px 20px' }} />

                      <div className="relative z-10 flex flex-col items-center w-full">
                        <div className="w-12 h-12 rounded-full bg-[#1F3B34]/40 flex items-center justify-center mb-4 border border-[#A3B18A]/30">
                          <Heart className="w-6 h-6 text-[#F2EDE1]" />
                        </div>

                        <h3 className="text-[12px] font-bold text-[#A3B18A] tracking-widest uppercase mb-1">Total Compatibility</h3>
                        <h4 className="text-[16px] font-bold text-white mb-6 text-center leading-tight">
                          {cp?.personal_information?.full_name || 'Selected Profile'}
                        </h4>

                        <div className="flex items-end gap-2">
                          <span className="text-[64px] font-light leading-none text-white">{selectedMatch?.score || 0}</span>
                          <span className="text-[20px] font-bold text-[#A3B18A] mb-2">%</span>
                        </div>

                        <div className="w-full bg-[#1F3B34]/50 rounded-full h-[6px] overflow-hidden mt-6 border border-[#A3B18A]/20">
                          <div className="h-full rounded-full transition-all duration-500 bg-[#A3B18A]" style={{ width: `${selectedMatch?.score || 0}%` }} />
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* Request Match Analysis */}
                <section className="bg-[#C86A4A] text-white rounded-[24px] p-6 shadow-md shadow-[#C86A4A]/20 relative overflow-hidden flex-1 shrink-0 min-h-[220px] flex flex-col justify-center">
                  <Heart className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10 -rotate-12 pointer-events-none" />
                  <div className="relative z-10">
                    <h3 className="text-[18px] font-extrabold tracking-tight leading-tight mb-2">Request Match<br />Analysis</h3>
                    <p className="text-[12px] text-white/90 font-medium leading-relaxed max-w-[85%] mb-5">
                      Request a detailed compatibility breakdown and expert insights for this profile.
                    </p>
                    {realMatchResultsMap[selectedId!] ? (
                      <div className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm shadow-sm border border-white/10">
                        <CheckCircle className="w-4 h-4" /> Algorithm Complete
                      </div>
                    ) : (
                      <button
                        onClick={handleRunMatches}
                        disabled={runningMatchesMap[selectedId!]}
                        className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-[12px] px-5 py-2.5 rounded-full backdrop-blur-sm transition-all shadow-sm disabled:opacity-70 disabled:hover:bg-white/20 border border-white/10"
                      >
                        {runningMatchesMap[selectedId!] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {runningMatchesMap[selectedId!] ? 'Running Algorithm…' : 'Run Algorithm'}
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* ═══ Right Side: Top Matching Profiles (Vertical List) ═══ */}
          <div className="w-full @[1100px]:w-[320px] shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-[11px] font-bold text-[#1F3B34] uppercase tracking-widest flex items-center gap-2">
                <Award className="w-[14px] h-[14px] text-[#C86A4A]" /> Top Matches
              </h4>
              <span className="text-[10px] font-bold bg-[#1F3B34] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Top 5
              </span>
            </div>

            <div className="grid grid-cols-1 @[600px]:grid-cols-2 @[1100px]:grid-cols-1 gap-3">
              {top5.map((match, index) => {
                const cp = findProfile(match.candidateId);
                if (!cp) return null;
                const name = cp.personal_information?.full_name || 'Unknown';
                const initial = name.charAt(0).toUpperCase();
                const age = computeAge(cp.personal_information?.date_of_birth);
                const city = resolveCity(cp);
                const scoreColor = getScoreColor(match.score);
                const scoreLabel = getScoreLabel(match.score);
                const isSelected = selectedMatchId === match.candidateId;

                return (
                  <button
                    key={match.candidateId}
                    onClick={() => setSelectedMatchId(match.candidateId)}
                    style={{ animationDelay: `${index * 80}ms` }}
                    className={`animate-fade-in-up w-full text-left rounded-[20px] p-3.5 flex items-center gap-3.5 transition-all duration-300 group relative overflow-hidden ${isSelected
                      ? 'bg-[#2F3E51] shadow-[0_8px_20px_-6px_rgba(47,62,81,0.4)] border border-[#2F3E51]'
                      : 'bg-white border border-[#E9E4DC] hover:border-[#dcd5c2] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]'
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-[40px] pointer-events-none" />
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {cp.profile_URL ? (
                        <img src={cp.profile_URL} alt={name} className="w-[46px] h-[46px] rounded-[14px] object-cover shadow-sm" />
                      ) : (
                        <div className={`w-[46px] h-[46px] rounded-[14px] flex items-center justify-center font-bold text-[18px] border shadow-sm ${isSelected ? 'bg-white/10 text-white border-white/20' : 'bg-[#A3B18A]/20 text-[#1F3B34] border-[#A3B18A]/30'}`}>
                          {initial}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm ${isSelected ? 'bg-[#2F3E51]' : 'bg-white'}`}>
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: scoreColor }} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className={`text-[13.5px] font-bold truncate tracking-tight ${isSelected ? 'text-white' : 'text-[#1F3B34]'}`}>{name}</div>
                      <div className={`text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-[#A3B18A]' : 'text-[#8B8479]'}`}>
                        {age !== '-' ? `${age}y` : ''}{age !== '-' && city ? ' · ' : ''}{city || ''}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end shrink-0 text-right ml-1">
                      <span className="text-[16px] font-black leading-none" style={{ color: scoreColor }}>{match.score}%</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: scoreColor }}>{scoreLabel}</span>
                    </div>
                  </button>
                );
              })}

              {top5.length < 5 && Array.from({ length: 5 - top5.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-[#FAF8F5] rounded-[20px] border border-dashed border-[#dcd5c2] p-4 flex items-center justify-center h-[74px]">
                  <span className="text-[11px] text-[#A8A296] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <User2 className="w-3.5 h-3.5" /> No match
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPersonalTab = () => {
    if (!sp) return null;
    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailSection title="Personal Information" icon={<User2 className="w-4 h-4" />}>
          <div className="divide-y divide-[#F5F0E8]">
            <InfoRow label="Full Name" value={sp.personal_information?.full_name} />
            <InfoRow label="Date of Birth" value={sp.personal_information?.date_of_birth ? new Date(sp.personal_information.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
            <InfoRow label="Age" value={computeAge(sp.personal_information?.date_of_birth) !== '-' ? `${computeAge(sp.personal_information?.date_of_birth)} years` : '-'} />
            <InfoRow label="Gender" value={formatEnum(sp.gender)} />
            <InfoRow label="Marital Status" value={formatEnum(sp.personal_information?.marital_status)} />
            <InfoRow label="Children" value={sp.personal_information?.number_of_children ?? '-'} />
            <InfoRow label="Nationality" value={sp.personal_information?.nationality_country_id ? getCountryById(sp.personal_information.nationality_country_id)?.name_en : '-'} />
            <InfoRow label="Mother Tongue" value={sp.personal_information?.mother_tongue_id ? getMotherTongueById(sp.personal_information.mother_tongue_id)?.name_en : '-'} />
          </div>
        </DetailSection>
        <DetailSection title="Physical Attributes" icon={<Ruler className="w-4 h-4" />}>
          <div className="divide-y divide-[#F5F0E8]">
            <InfoRow label="Height" value={sp.physical_information?.height_cm ? `${sp.physical_information.height_cm} cm` : '-'} />
            <InfoRow label="Weight" value={sp.physical_information?.weight_kg ? `${sp.physical_information.weight_kg} kg` : '-'} />
            <InfoRow label="Complexion" value={sp.physical_information?.complexion || '-'} />
            <InfoRow label="Disability" value={sp.physical_information?.has_disability ? 'Yes' : 'No'} />
            {sp.physical_information?.has_disability && sp.physical_information?.disability_details && (
              <InfoRow label="Disability Details" value={sp.physical_information.disability_details} />
            )}
          </div>
        </DetailSection>
      </div>
    );
  };

  const renderEducationTab = () => {
    if (!sp) return null;
    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailSection title="Education Records" icon={<GraduationCap className="w-4 h-4" />}>
          {sp.education_records?.length ? (
            <div className="space-y-2">
              {sp.education_records.map((edu) => (
                <div key={edu.id} className="bg-[#FAFAF8] rounded-xl px-3.5 py-2.5 border border-[#F0EBE3]">
                  <div className="text-[12px] font-bold text-[#1E1F22]">{edu.qualification || edu.field_of_study || 'Record'}</div>
                  <div className="text-[11px] text-[#8B8479] mt-0.5">{[edu.institution_name, edu.field_of_study, edu.start_year && edu.end_year ? `${edu.start_year}–${edu.end_year}` : null].filter(Boolean).join(' · ')}</div>
                  {edu.details && <div className="text-[11px] text-[#6D6558] mt-1">{edu.details}</div>}
                </div>
              ))}
            </div>
          ) : <p className="text-[11px] text-[#A8A296]">No education records.</p>}
        </DetailSection>
        <div className="flex flex-col gap-4">
          <DetailSection title="Employment Records" icon={<Briefcase className="w-4 h-4" />}>
            {sp.employment_records?.length ? (
              <div className="space-y-2">
                {sp.employment_records.map((emp) => (
                  <div key={emp.id} className="bg-[#FAFAF8] rounded-xl px-3.5 py-2.5 border border-[#F0EBE3]">
                    <div className="text-[12px] font-bold text-[#1E1F22]">{emp.job_title || 'Employment'} {emp.is_current && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E5EFE9] text-[#064e3b] ml-1">Current</span>}</div>
                    <div className="text-[11px] text-[#8B8479] mt-0.5">{[emp.organization_name, formatEnum(emp.employment_type)].filter(Boolean).join(' · ')}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-[11px] text-[#A8A296]">No employment records.</p>}
          </DetailSection>
          {sp.income_information && (
            <DetailSection title="Income Information" icon={<Briefcase className="w-4 h-4" />}>
              <div className="divide-y divide-[#F5F0E8]">
                <InfoRow label="Monthly Income" value={sp.income_information.monthly_income_min || sp.income_information.monthly_income_max ? `${sp.income_information.currency_code || 'PKR'} ${sp.income_information.monthly_income_min?.toLocaleString() || '?'} – ${sp.income_information.monthly_income_max?.toLocaleString() || '?'}` : '-'} />
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    );
  };

  const renderFamilyTab = () => {
    if (!sp) return null;
    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailSection title="Parents" icon={<Users className="w-4 h-4" />}>
          {sp.parents?.length ? (
            <div className="space-y-2">
              {sp.parents.map((p) => (
                <div key={p.id} className="bg-[#FAFAF8] rounded-xl px-3.5 py-2.5 border border-[#F0EBE3]">
                  <div className="text-[12px] font-bold text-[#1E1F22]">{formatEnum(p.parent_type)} — {p.full_name || 'N/A'}</div>
                  <div className="text-[11px] text-[#8B8479] mt-0.5">{[formatEnum(p.status), p.profession, p.education, p.age ? `${p.age} yrs` : null].filter(Boolean).join(' · ')}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-[11px] text-[#A8A296]">No parent records.</p>}
        </DetailSection>
        <div className="flex flex-col gap-4">
          <DetailSection title="Siblings" icon={<Users className="w-4 h-4" />}>
            {sp.siblings?.length ? (
              <div className="space-y-1.5">
                {sp.siblings.map((s) => (
                  <div key={s.id} className="bg-[#FAFAF8] rounded-xl px-3 py-2 border border-[#F0EBE3] text-[11.5px]">
                    <span className="font-semibold text-[#1E1F22]">{s.full_name || formatEnum(s.gender)}</span>
                    <span className="text-[#8B8479] ml-1.5">{[s.age ? `${s.age}y` : null, formatEnum(s.marital_status), s.profession].filter(Boolean).join(' · ')}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[11px] text-[#A8A296]">No sibling records.</p>}
          </DetailSection>
          {sp.family_information && (
            <DetailSection title="Family Details" icon={<Home className="w-4 h-4" />}>
              <div className="divide-y divide-[#F5F0E8]">
                {sp.family_information.family_profession_business && <InfoRow label="Family Business" value={sp.family_information.family_profession_business} />}
                {sp.family_information.social_background && <InfoRow label="Social Background" value={sp.family_information.social_background} />}
                {sp.family_information.family_values && <InfoRow label="Values" value={sp.family_information.family_values} />}
                {sp.family_information.family_introduction && <InfoRow label="Introduction" value={sp.family_information.family_introduction} />}
                {sp.family_information.important_family_circumstances && <InfoRow label="Circumstances" value={sp.family_information.important_family_circumstances} />}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    );
  };

  const renderLifestyleTab = () => {
    if (!sp) return null;
    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailSection title="Lifestyle" icon={<Sparkles className="w-4 h-4" />}>
          <div className="divide-y divide-[#F5F0E8]">
            <InfoRow label="Religious Practice" value={formatEnum(sp.lifestyle_information?.religious_practice)} />
            {sp.gender === 'MALE' && <InfoRow label="Beard" value={formatEnum(sp.lifestyle_information?.beard)} />}
            {sp.gender === 'FEMALE' && <InfoRow label="Hijab" value={formatEnum(sp.lifestyle_information?.hijab)} />}
            <InfoRow label="Smoking" value={formatEnum(sp.lifestyle_information?.smoking)} />
            {sp.lifestyle_information?.other_lifestyle_information && <InfoRow label="Other" value={sp.lifestyle_information.other_lifestyle_information} />}
          </div>
        </DetailSection>
        <DetailSection title="Religion & Culture" icon={<BookOpen className="w-4 h-4" />}>
          <div className="divide-y divide-[#F5F0E8]">
            <InfoRow label="Religion" value={sp.religion_information?.religion_id ? getReligionById(sp.religion_information.religion_id)?.name_en : '-'} />
            <InfoRow label="Sect" value={sp.religion_information?.sect_id ? getSectById(sp.religion_information.sect_id)?.name_en : '-'} />
            <InfoRow label="Caste" value={sp.religion_information?.caste_id ? getCasteById(sp.religion_information.caste_id)?.name_en : sp.religion_information?.other_caste_text || '-'} />
          </div>
        </DetailSection>
      </div>
    );
  };

  const renderLocationTab = () => {
    if (!sp) return null;
    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailSection title="Location" icon={<MapPin className="w-4 h-4" />}>
          <div className="divide-y divide-[#F5F0E8]">
            <InfoRow label="Current City" value={sp.profile_locations?.current_city_id ? getCityById(sp.profile_locations.current_city_id)?.name_en : sp.profile_locations?.current_location_text || '-'} />
            <InfoRow label="Current Province" value={sp.profile_locations?.current_province_id ? getProvinceById(sp.profile_locations.current_province_id)?.name_en : '-'} />
            <InfoRow label="Current Country" value={sp.profile_locations?.current_country_id ? getCountryById(sp.profile_locations.current_country_id)?.name_en : '-'} />
            <InfoRow label="Permanent Location" value={sp.profile_locations?.permanent_location_text || '-'} />
          </div>
        </DetailSection>
        <div className="flex flex-col gap-4">
          <DetailSection title="Residency" icon={<Home className="w-4 h-4" />}>
            <div className="divide-y divide-[#F5F0E8]">
              <InfoRow label="House Status" value={formatEnum(sp.residency_information?.house_status)} />
              <InfoRow label="Property Type" value={formatEnum(sp.residency_information?.property_type)} />
              <InfoRow label="Family Setup" value={formatEnum(sp.residency_information?.family_setup)} />
              <InfoRow label="Living With" value={formatEnum(sp.residency_information?.living_with)} />
            </div>
          </DetailSection>
          {sp.relocation_information && (
            <DetailSection title="Relocation" icon={<Globe className="w-4 h-4" />}>
              <div className="divide-y divide-[#F5F0E8]">
                <InfoRow label="Willing to Relocate" value={formatEnum(sp.relocation_information.willing_to_relocate)} />
                {sp.relocation_information.preferred_country_id && <InfoRow label="Preferred Country" value={getCountryById(sp.relocation_information.preferred_country_id)?.name_en || '-'} />}
                {sp.relocation_information.relocation_details && <InfoRow label="Details" value={sp.relocation_information.relocation_details} />}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    );
  };

  const renderDetailsScroll = () => {
    return (
      <div className="flex flex-col pb-8">
        <div id="section-personal" className="scroll-mt-5 mb-10">{renderPersonalTab()}</div>
        <div id="section-education" className="scroll-mt-5 mb-10">{renderEducationTab()}</div>
        <div id="section-family" className="scroll-mt-5 mb-10">{renderFamilyTab()}</div>
        <div id="section-lifestyle" className="scroll-mt-5 mb-10">{renderLifestyleTab()}</div>
        <div id="section-location" className="scroll-mt-5 mb-10">{renderLocationTab()}</div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'overview') return renderOverviewTab();
    return renderDetailsScroll();
  };


  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="flex-1 flex min-h-0 py-2">
        {/* ═══════════════ LEFT PANEL: Profile Directory ═══════════════ */}
        {/* Sits completely flush against the global sidebar (which now dynamically expands to touch it) */}
        <div className="w-[300px] min-w-[280px] shrink-0 flex flex-col bg-[#1F3B34] text-white border-r border-[#172D28] rounded-r-[28px] overflow-hidden ml-0 z-0 relative shadow-none">
          {/* Subtle glow in dark panel */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl pointer-events-none rounded-full" />

          {/* ─── Stat Deck (Animated Hover Spread) ─── */}
          <div className="h-[197px] px-3 flex items-center justify-center border-b border-white/[0.08] shrink-0 relative z-10">
            <StatDeck stats={stats} />
          </div>

          {/* ─── Directory Header ─── */}
          <div className="px-5 py-4 flex items-center justify-between relative z-10">
            <h2 className="text-[16px] font-bold tracking-tight">Profiles</h2>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <Search className="w-[14px] h-[14px]" />
            </button>
          </div>

          {/* ─── Search (toggled) ─── */}
          {showSearch && (
            <div className="px-4 pb-3 relative z-10">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-white/40" />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-[12px] text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20 outline-none transition-all"
                />
              </form>
            </div>
          )}

          {/* ─── Status Filter Tabs ─── */}
          <div className="flex flex-col px-4 pt-1 pb-3 shrink-0 relative z-10 gap-2">
            <nav className="flex gap-2 w-full">
              {STATUS_TABS.map((tab) => {
                const isActive = filters.status === tab.value || (!filters.status && tab.value === 'ALL');
                return (
                  <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={`flex-1 py-2 px-1 text-[11px] font-semibold rounded-full flex items-center justify-center transition-all ${isActive
                      ? 'bg-[#C86A4A] text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ─── Profile List (scrollable) ─── */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar relative z-10">
            {loading && profiles.length > 0 && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-10 bg-[#1F3B34]/80 backdrop-blur-sm">
                <Loader2 className="w-6 h-6 animate-spin text-white/80" />
              </div>
            )}

            {loading && profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-white/60 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-[12px] font-medium">Loading…</span>
              </div>
            ) : profiles.length === 0 ? (
              <div className="py-14 text-center text-white/60 text-[12px] font-medium">
                No profiles found.
              </div>
            ) : (
              profiles.map((profile) => {
                const isSelected = selectedId === profile.id;
                const name = profile.personal_information?.full_name || 'Unnamed';
                const age = computeAge(profile.personal_information?.date_of_birth);
                const city = resolveCity(profile);
                const initial = name.charAt(0).toUpperCase();

                return (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedId(profile.id)}
                    className={`w-full text-left rounded-[24px] p-4 flex flex-col gap-3 transition-all duration-300 group ${isSelected
                      ? 'bg-[#C86A4A] text-white shadow-lg'
                      : 'bg-white/5 border border-transparent hover:bg-white/10 text-white'
                      }`}
                  >
                    {/* Top Row: Avatar & Name */}
                    <div className="flex items-center gap-3 w-full">
                      {/* Avatar */}
                      {profile.profile_URL ? (
                        <img
                          src={profile.profile_URL}
                          alt={name}
                          className={`w-12 h-12 rounded-[16px] object-cover shrink-0 ${isSelected ? 'border-2 border-white' : ''}`}
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-[16px] flex items-center justify-center font-semibold text-[18px] shrink-0 transition-colors ${isSelected
                            ? 'bg-white text-[#C86A4A]'
                            : 'bg-[#A3B18A] text-[#1F3B34]'
                            }`}
                        >
                          {initial}
                        </div>
                      )}

                      {/* Name & subtitle */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-[14px] font-bold truncate mb-0.5 tracking-tight">
                          {name}
                        </div>
                        <div className={`text-[12px] truncate ${isSelected ? 'text-white/80' : 'text-white/60'}`}>
                          {age !== '-' ? `${age} yrs` : ''}
                          {age !== '-' && city ? ' · ' : ''}
                          {city || ''}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Status Pill & Message */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] mt-1">
                      {isSelected ? (
                        <span className="px-3 py-1 rounded-[12px] font-bold bg-white/20 text-white text-[10px] uppercase tracking-widest">
                          {formatEnum(profile.status)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-[12px] font-bold bg-white/10 text-white/80 text-[10px] uppercase tracking-widest">
                          {formatEnum(profile.status)}
                        </span>
                      )}

                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                        {isSelected ? 'Viewing' : 'Open'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* ─── Pagination ─── */}
          <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/50 shrink-0 relative z-10">
            <span className="font-semibold">
              Page {filters.page}/{totalPages || 1}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={filters.page === 1}
                onClick={() => { setSelectedId(null); setFilters((f) => ({ ...f, page: (f.page || 1) - 1 })); }}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={filters.page === totalPages || totalPages === 0}
                onClick={() => { setSelectedId(null); setFilters((f) => ({ ...f, page: (f.page || 1) + 1 })); }}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════ RIGHT PANEL: Profile Workspace ═══════════════ */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#FAF8F5] relative ml-2 rounded-l-[28px] shadow-[-8px_0_24px_rgba(0,0,0,0.02)] border-l border-t border-[#E9E4DC]/50">

          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center text-[#8B8479] gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[13px] font-medium">Loading profile…</span>
            </div>
          ) : !selectedProfile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#A8A296] gap-3 px-8">
              <div className="w-16 h-16 rounded-full bg-[#EDE8E0] flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-[#C5BEB2]" />
              </div>
              <p className="text-[14px] font-medium">Select a profile</p>
              <p className="text-[12px] text-center max-w-xs">
                Click on any profile in the directory to view their complete dossier here.
              </p>
            </div>
          ) : (
            <>
              {/* ─── Profile Header & Navigation Tabs (Concept V5 Layout) ─── */}
              <div className="bg-[#FAF8F5] shrink-0 relative flex flex-col border-b border-[#E9E4DC] px-6 lg:px-8 pt-6 pb-0">
                {/* Concept Header */}
                <header className="flex flex-col md:flex-row md:items-center gap-5">
                  {selectedProfile.profile_URL ? (
                    <img
                      src={selectedProfile.profile_URL}
                      alt={selectedProfile.personal_information?.full_name || 'Profile'}
                      className="w-[80px] h-[80px] rounded-[24px] object-cover flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-[80px] h-[80px] rounded-[24px] bg-[#C86A4A] text-white flex items-center justify-center text-[32px] font-semibold flex-shrink-0 shadow-sm">
                      {selectedProfile.personal_information?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-[28px] font-bold text-[#002b17] tracking-tight leading-none mb-1">
                      {selectedProfile.personal_information?.full_name || 'Unnamed Profile'}
                    </h1>
                    <p className="text-[13px] text-[#717972]">
                      {computeAge(selectedProfile.personal_information?.date_of_birth) !== '-' ? `${computeAge(selectedProfile.personal_information?.date_of_birth)} years` : 'DOB unknown'} · {formatEnum(selectedProfile.personal_information?.marital_status) || 'Status unknown'}
                    </p>
                    <p className="text-[13px] text-[#717972] mt-0.5">Verified matrimonial dossier, managed securely on the platform.</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 self-start md:self-auto">
                    <div className="scale-105 origin-right">
                      <StatusBadge status={selectedProfile.status} size="md" />
                    </div>
                    <span className="px-[12px] py-[6px] rounded-[20px] text-[11px] font-semibold bg-[#A3B18A] text-[#1F3B34] shadow-sm border border-[#91a076]/30">Matrimonial</span>
                  </div>
                </header>

                {/* Action Bar & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 mt-6 border-b border-black/[0.08] pb-0">
                  <div className="flex items-center gap-2 mb-3 md:mb-0 md:pb-3.5">
                    <Link href={`/add-profile?edit=${selectedProfile.id}`}>
                      <button className="w-10 h-10 rounded-full bg-[#C86A4A] text-white flex items-center justify-center cursor-pointer hover:bg-[#a6563b] transition-all shadow-sm" title="Edit Profile">
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                    </Link>
                    <button className="w-10 h-10 rounded-full bg-[#C86A4A] text-white flex items-center justify-center cursor-pointer hover:bg-[#a6563b] transition-all shadow-sm">
                      <Send className="w-[18px] h-[18px]" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-[#C86A4A] text-white flex items-center justify-center cursor-pointer hover:bg-[#a6563b] transition-all shadow-sm">
                      <FileText className="w-[18px] h-[18px]" />
                    </button>
                    <span className="px-[12px] py-[6px] rounded-[20px] bg-white text-[11px] font-semibold ml-2 border border-black/5 text-[#717972] shadow-sm">
                      Profile #{selectedProfile.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  {/* Horizontal Navigation Tabs */}
                  <nav className="flex gap-6 md:ml-auto text-[13px] font-medium text-[#7b8592] overflow-x-auto w-full md:w-auto mt-auto">
                    {PROFILE_TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`pb-[6px] whitespace-nowrap cursor-pointer transition-colors duration-200 border-b-2 ${isActive
                            ? 'text-[#002b17] font-semibold border-[#C86A4A]'
                            : 'border-transparent hover:text-[#002b17]'
                            }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* ─── Dashboard Workspace ─── */}
              <div id="details-scroll-container" onScroll={handleScroll} className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                {renderTabContent()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d6d0c6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b8b0a4;
        }
      `}</style>
    </>
  );
}
