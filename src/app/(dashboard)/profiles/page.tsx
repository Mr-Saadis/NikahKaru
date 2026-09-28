'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { ProfileService, type ProfileFilters } from '@/lib/services/profile-service';
import type { ProfileListItem, ProfileStatus, FullProfile } from '@/lib/types/database.types';
import Link from 'next/link';
import { useReferenceData } from '@/lib/hooks/useReferenceData';
import {
  getMockMatchResults,
  getMatchDistribution,
  getAverageScore,
  getHighestScore,
  getHighMatchCount,
  getScoreColor,
  getScoreBg,
  getScoreLabel,
  type MockMatchResult,
} from '@/lib/matching/mock-scoring';

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

const STATUS_TABS: { label: string; value: ProfileStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
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

/** Stat card (2×2 grid item at top of left panel) */
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#ECE5D9] px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${accent}`}>{icon}</div>
        <span className="text-[10.5px] font-semibold text-[#8B8479] uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-[22px] font-extrabold text-[#1E1F22] leading-none pl-0.5">{value}</span>
    </div>
  );
}

/** Section card wrapper for the detail workspace */
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
    <section className={`bg-white rounded-[20px] border border-[#ECE5D9] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#F3EEE5] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
          {icon}
        </div>
        <h3 className="text-[13px] font-bold text-[#1F1E1B]">{title}</h3>
      </div>
      <div className="px-5 py-3.5 flex-1">{children}</div>
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

  // ── Match request state (demo) ────────────────────────────────
  const [matchRequested, setMatchRequested] = useState(false);
  const [matchRequesting, setMatchRequesting] = useState(false);

  // Reset request state when profile changes
  useEffect(() => {
    setMatchRequested(false);
    setMatchRequesting(false);
  }, [selectedId]);

  // ── Mock matching data (computed from loaded profiles) ────────
  const matchData = useMemo(() => {
    if (!selectedId || profiles.length === 0) return null;

    const candidateIds = profiles.map((p) => p.id);
    const results = getMockMatchResults(selectedId, candidateIds);
    if (results.length === 0) return null;

    const distribution = getMatchDistribution(results);
    const average = getAverageScore(results);
    const highest = getHighestScore(results);
    const highCount = getHighMatchCount(results);
    // Top 5 by score, displayed in ASCENDING order
    const top5 = results.slice(0, 5).sort((a, b) => a.score - b.score);

    return { results, distribution, average, highest, highCount, totalCompared: results.length, top5 };
  }, [selectedId, profiles]);

  // ── Resolve a candidate ID to the profile list item ───────────
  const findProfile = useCallback(
    (id: string) => profiles.find((p) => p.id === id) ?? null,
    [profiles],
  );

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

  // ── Load selected profile detail ──────────────────────────────
  useEffect(() => {
    if (!selectedId) {
      setSelectedProfile(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    ProfileService.getProfileById(selectedId)
      .then((data) => {
        if (!cancelled) {
          setSelectedProfile(data as FullProfile);
          setActiveTab('overview'); // reset to overview on profile change
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
    if (!sp || !matchData) return (
      <div className="flex items-center justify-center h-full text-[#A8A296] text-[13px]">No matching data available.</div>
    );

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
      <div className="h-full flex flex-col gap-3">
        {/* Demo badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FDF0D8] text-[#92400E] border border-[#F5C770]/40">
            <Info className="w-2.5 h-2.5" /> Demo Matching — Algorithm Pending
          </span>
        </div>

        {/* ═══ Main grid: Overview (3/5) + Distribution & Request (2/5) ═══ */}
        <div className="grid grid-cols-5 gap-3 flex-1 min-h-0">

          {/* ── LEFT: Compatibility Overview ── */}
          <div className="col-span-3 flex flex-col">
            <section className="bg-white rounded-2xl border border-[#ECE5D9] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#F3EEE5] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-[12px] font-bold text-[#1F1E1B]">Compatibility Overview</h3>
                </div>
                <span className="text-[9px] text-[#8B8479] font-medium">vs {totalCompared} profiles</span>
              </div>

              <div className="px-4 py-3 flex-1 flex flex-col min-h-0">
                {/* Stat sub-cards */}
                <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
                  <div className="bg-gradient-to-br from-[#E5EFE9] to-[#D4EDDB] rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold text-[#064e3b]/60 uppercase tracking-wider">Total Compared</span>
                    <span className="text-[26px] font-extrabold text-[#064e3b] leading-none">{totalCompared}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#16a34a]" />
                      <span className="text-[8.5px] text-[#064e3b]/60 font-medium">Profiles</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#E0F2FE] to-[#CCE8FA] rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold text-[#0C4A6E]/60 uppercase tracking-wider">High Matches</span>
                    <span className="text-[26px] font-extrabold text-[#0C4A6E] leading-none">{highCount}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#0EA5E9]" />
                      <span className="text-[8.5px] text-[#0C4A6E]/60 font-medium">80%+ match</span>
                    </div>
                  </div>

                  <div className="bg-[#FAFAF8] rounded-xl p-3 border border-[#F0EBE3] flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold text-[#8B8479] uppercase tracking-wider">Score Range</span>
                    <div className="flex items-end gap-3">
                      <div>
                        <span className="text-[8px] text-[#8B8479]">Avg</span>
                        <div className="text-[18px] font-extrabold text-[#064e3b] leading-none">{average}%</div>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#8B8479]">Best</span>
                        <div className="text-[18px] font-extrabold leading-none" style={{ color: getScoreColor(highest) }}>{highest}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-[#E5EFE9] rounded-full h-1 overflow-hidden mt-0.5">
                      <div className="h-full rounded-full bg-[#064e3b] transition-all duration-500" style={{ width: `${average}%` }} />
                    </div>
                  </div>
                </div>

                {/* Individual compatibility bars */}
                <h4 className="text-[9px] font-bold text-[#8B8479] uppercase tracking-wider mb-1.5 shrink-0">Individual Compatibility</h4>
                <div className="space-y-1 flex-1 overflow-hidden">
                  {results.slice(0, 4).map((match) => {
                    const cp = findProfile(match.candidateId);
                    if (!cp) return null;
                    const name = cp.personal_information?.full_name || 'Unknown';
                    const initial = name.charAt(0).toUpperCase();
                    return (
                      <button
                        key={match.candidateId}
                        onClick={() => setSelectedId(match.candidateId)}
                        className="w-full flex items-center gap-2.5 group hover:bg-[#FAFAF8] rounded-lg px-1.5 py-1 -mx-1.5 transition-colors"
                      >
                        {cp.profile_URL ? (
                          <img src={cp.profile_URL} alt={name} className="w-7 h-7 rounded-full object-cover border border-[#ECE5D9] shrink-0" />
                        ) : (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            cp.gender === 'MALE' ? 'bg-[#E5EFE9] text-[#064e3b]' : 'bg-[#FCE2DF] text-[#A6372A]'
                          }`}>{initial}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10.5px] font-semibold text-[#1E1F22] truncate">{name}</span>
                            <span className="text-[10px] font-bold shrink-0 ml-2" style={{ color: getScoreColor(match.score) }}>{match.score}%</span>
                          </div>
                          <div className="w-full bg-[#E5EFE9] rounded-full h-1 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${match.score}%`, backgroundColor: getScoreColor(match.score) }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT: Distribution + Request (stacked) ── */}
          <div className="col-span-2 flex flex-col gap-3">

            {/* Match Distribution */}
            <section className="bg-white rounded-2xl border border-[#ECE5D9] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[#F3EEE5]">
                <div className="w-6 h-6 rounded-md bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[12px] font-bold text-[#1F1E1B]">Match Distribution</h3>
              </div>
              <div className="px-4 py-3 flex gap-4">
                <div className="flex-1 space-y-1.5">
                  {distBars.map((d) => (
                    <div key={d.label} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-[#6D6558] flex-1 truncate">{d.label}</span>
                      <span className="text-[10px] font-bold text-[#1E1F22] w-4 text-right">{d.count}</span>
                    </div>
                  ))}
                </div>
                <div className="shrink-0 flex items-center">
                  <DonutSvg pct={average} size={90} sw={8} />
                </div>
              </div>
              <div className="px-4 pb-3">
                <div className="flex rounded-full h-1.5 overflow-hidden bg-[#E5EFE9]">
                  {distBars.map((d) => (
                    d.count > 0 && (
                      <div key={d.label} className="h-full transition-all duration-500" style={{ width: `${(d.count / totalCompared) * 100}%`, backgroundColor: d.color }} />
                    )
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[8px] text-[#A8A296] font-medium">
                  <span>0</span><span>{totalCompared} profiles</span>
                </div>
              </div>
            </section>

            {/* Request Match Analysis */}
            <section className="bg-white rounded-2xl border border-[#ECE5D9] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col">
              <div className="px-4 py-3 flex-1 flex flex-col justify-center">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-[14px] font-extrabold text-[#064e3b] leading-tight">Request Match<br/>Analysis</h3>
                    <p className="text-[10.5px] text-[#8B8479] mt-1.5 leading-relaxed">
                      Request a detailed compatibility analysis for this profile.
                    </p>
                    {matchRequested ? (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E5EFE9] text-[#064e3b]">
                          <CheckCircle className="w-3 h-3" /> Recorded
                        </span>
                        <span className="text-[8px] text-[#A8A296]">Demo</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestMatch}
                        disabled={matchRequesting}
                        className="mt-2.5 inline-flex items-center gap-1.5 bg-[#064e3b] text-white hover:bg-[#0a3d2f] font-bold text-[11px] px-4 py-1.5 rounded-full shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-60"
                      >
                        {matchRequesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        {matchRequesting ? 'Submitting…' : 'Request Match'}
                      </button>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#E5EFE9] via-[#D4EDDB] to-[#FDF0D8] flex items-center justify-center shrink-0">
                    <Heart className="w-8 h-8 text-[#064e3b]/25" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ═══ Bottom: Top Matching Profiles (max 5, ascending) ═══ */}
        <div className="shrink-0">
          <h4 className="text-[9px] font-bold text-[#8B8479] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-3 h-3" /> Top Matching Profiles
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {top5.map((match) => {
              const cp = findProfile(match.candidateId);
              if (!cp) return null;
              const name = cp.personal_information?.full_name || 'Unknown';
              const initial = name.charAt(0).toUpperCase();
              const age = computeAge(cp.personal_information?.date_of_birth);
              const city = resolveCity(cp);
              const scoreColor = getScoreColor(match.score);
              const scoreLabel = getScoreLabel(match.score);
              return (
                <button
                  key={match.candidateId}
                  onClick={() => setSelectedId(match.candidateId)}
                  className="bg-white rounded-xl border border-[#ECE5D9] shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-3 flex flex-col gap-2 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    {cp.profile_URL ? (
                      <img src={cp.profile_URL} alt={name} className="w-8 h-8 rounded-full object-cover border border-[#ECE5D9] shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        cp.gender === 'MALE' ? 'bg-[#E5EFE9] text-[#064e3b]' : 'bg-[#FCE2DF] text-[#A6372A]'
                      }`}>{initial}</div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[#1F1E1B] truncate">{name}</div>
                      <div className="text-[9px] text-[#8B8479] truncate">
                        {age !== '-' ? `${age}y` : ''}{age !== '-' && city ? ' · ' : ''}{city || ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: scoreColor }} />
                    <span className="text-[9px] font-semibold" style={{ color: scoreColor }}>{scoreLabel}</span>
                    <span className="text-[10px] font-bold text-[#1E1F22] ml-auto">{match.score}%</span>
                  </div>
                  <div className="w-full bg-[#E5EFE9] rounded-full h-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${match.score}%`, backgroundColor: scoreColor }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-[#A8A296]">{cp.id.substring(0, 8).toUpperCase()}</span>
                    <Info className="w-2.5 h-2.5 text-[#d1ccc0] group-hover:text-[#8B8479] transition-colors" />
                  </div>
                </button>
              );
            })}
            {top5.length < 5 && Array.from({ length: 5 - top5.length }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-[#FAFAF8] rounded-xl border border-dashed border-[#E5DFD4] p-3 flex items-center justify-center">
                <span className="text-[9px] text-[#C5BEB2] font-medium">No match</span>
              </div>
            ))}
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'personal': return renderPersonalTab();
      case 'education': return renderEducationTab();
      case 'family': return renderFamilyTab();
      case 'lifestyle': return renderLifestyleTab();
      case 'location': return renderLocationTab();
      default: return renderOverviewTab();
    }
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <>
      <Header
        title="Profiles & Dossiers"
        subtitle="Manage and review all matrimonial profiles"
        icon={<Users className="w-5 h-5" />}
        showBackButton={false}
      />

      <div className="flex-1 flex min-h-0">
        {/* ═══════════════ LEFT PANEL: Profile Directory ═══════════════ */}
        <div className="w-[290px] min-w-[270px] shrink-0 flex flex-col border-r border-[#E5DFD4] bg-[#FAF8F5]">
          {/* ─── Stat Cards (2×2 grid) ─── */}
          <div className="p-3 grid grid-cols-2 gap-2 border-b border-[#E5DFD4]">
            <StatCard
              icon={<Users className="w-3 h-3" />}
              label="Total"
              value={stats.total}
              accent="bg-[#E5EFE9] text-[#064e3b]"
            />
            <StatCard
              icon={<CheckCircle className="w-3 h-3" />}
              label="Active"
              value={stats.active}
              accent="bg-[#DCFCE7] text-[#16a34a]"
            />
            <StatCard
              icon={<FileText className="w-3 h-3" />}
              label="Draft"
              value={stats.draft}
              accent="bg-[#FEF3C7] text-[#d97706]"
            />
            <StatCard
              icon={<PauseCircle className="w-3 h-3" />}
              label="Paused"
              value={stats.paused}
              accent="bg-[#FEE2E2] text-[#dc2626]"
            />
          </div>

          {/* ─── Directory Header ─── */}
          <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-[#E5DFD4]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#1F1E1B]">Profiles</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8479]" />
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F0EBE3] text-[#8B8479] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ─── Search (toggled) ─── */}
          {showSearch && (
            <div className="px-3 py-2 border-b border-[#E5DFD4]">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B8479]" />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                  className="w-full bg-white border border-[#E9E4DC] rounded-xl pl-8 pr-3 py-1.5 text-[11.5px] focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b] outline-none"
                />
              </form>
            </div>
          )}

          {/* ─── Status Filter Tabs ─── */}
          <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-[#E5DFD4]">
            {STATUS_TABS.map((tab) => {
              const isActive = filters.status === tab.value || (!filters.status && tab.value === 'ALL');
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-all ${
                    isActive ? 'bg-[#16382E] text-white' : 'bg-[#F0EBE3] text-[#6D6558] hover:bg-[#E5DFD4]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── Profile List (scrollable) ─── */}
          <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-14 text-[#8B8479] gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-[11px] font-medium">Loading…</span>
              </div>
            ) : profiles.length === 0 ? (
              <div className="py-14 text-center text-[#8B8479] text-[11px] font-medium">
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
                    className={`w-full text-left rounded-2xl px-3 py-2.5 flex items-center gap-2.5 transition-all group relative ${
                      isSelected
                        ? 'bg-[#064e3b] text-white shadow-lg shadow-[#064e3b]/20'
                        : 'bg-transparent hover:bg-white text-[#1E1F22] hover:shadow-sm'
                    }`}
                  >
                    {/* Avatar */}
                    {profile.profile_URL ? (
                      <img
                        src={profile.profile_URL}
                        alt={name}
                        className={`w-10 h-10 rounded-full object-cover shrink-0 border-2 ${isSelected ? 'border-white/30' : 'border-[#ECE5D9]'}`}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : profile.gender === 'MALE'
                              ? 'bg-[#E5EFE9] text-[#165842]'
                              : 'bg-[#FCE2DF] text-[#A6372A]'
                        }`}
                      >
                        {initial}
                      </div>
                    )}

                    {/* Name & subtitle */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12.5px] font-bold truncate ${isSelected ? 'text-white' : 'text-[#1E1F22]'}`}>
                        {name}
                      </div>
                      <div className={`text-[10.5px] mt-0.5 truncate ${isSelected ? 'text-white/65' : 'text-[#8B8479]'}`}>
                        {age !== '-' ? `${age} yrs` : ''}
                        {age !== '-' && city ? ' · ' : ''}
                        {city || ''}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-white/80 px-2 py-0.5 rounded-full bg-white/15">
                          {profile.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />}
                          {formatEnum(profile.status)}
                        </span>
                      ) : (
                        <StatusBadge status={profile.status} />
                      )}
                    </div>

                    {/* Chevron indicator */}
                    {isSelected && (
                      <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0 absolute right-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* ─── Pagination ─── */}
          <div className="px-3 py-2 border-t border-[#E5DFD4] flex items-center justify-between text-[10.5px] text-[#8B8479] shrink-0">
            <span className="font-medium">
              Page {filters.page}/{totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={filters.page === 1}
                onClick={() => { setSelectedId(null); setFilters((f) => ({ ...f, page: (f.page || 1) - 1 })); }}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E5DFD4] hover:bg-white text-[#787167] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                disabled={filters.page === totalPages || totalPages === 0}
                onClick={() => { setSelectedId(null); setFilters((f) => ({ ...f, page: (f.page || 1) + 1 })); }}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E5DFD4] hover:bg-white text-[#787167] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════ RIGHT PANEL: Profile Workspace ═══════════════ */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#F5F3F0]">
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
              {/* ─── Profile Header (reference-matched) ─── */}
              <div className="bg-white border-b border-[#E5DFD4] px-6 py-3 shrink-0">
                <div className="flex items-center gap-5">
                  {/* Photo / Avatar — larger, gradient ring like reference */}
                  <div className="shrink-0 rounded-2xl p-[3px] bg-gradient-to-br from-[#064e3b] via-[#16a34a] to-[#D4AF37] shadow-md">
                    {selectedProfile.profile_URL ? (
                      <img
                        src={selectedProfile.profile_URL}
                        alt={selectedProfile.personal_information?.full_name || 'Profile'}
                        className="w-[82px] h-[82px] rounded-[13px] object-cover bg-white"
                      />
                    ) : (
                      <div
                        className={`w-[82px] h-[82px] rounded-[13px] flex items-center justify-center font-extrabold text-[28px] ${
                          selectedProfile.gender === 'MALE'
                            ? 'bg-[#E5EFE9] text-[#064e3b]'
                            : 'bg-[#FCE2DF] text-[#A6372A]'
                        }`}
                      >
                        {selectedProfile.personal_information?.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Name + Meta */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[22px] font-extrabold text-[#002b17] tracking-tight leading-tight">
                      {selectedProfile.personal_information?.full_name || 'Unnamed Profile'}
                    </h2>
                    <p className="text-[12px] text-[#717972] font-medium mt-0.5">
                      {buildSubtitle(selectedProfile)}
                    </p>

                    {/* Quick-info icon row */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-[11px] text-[#717972]">
                      {selectedProfile.personal_information?.date_of_birth && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#064e3b]" />
                          {new Date(selectedProfile.personal_information.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <span className="text-[#A8A296]">({computeAge(selectedProfile.personal_information.date_of_birth)} yrs)</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <User2 className="w-3.5 h-3.5 text-[#064e3b]" />
                        <span className="font-semibold text-[#2d4035]">{formatEnum(selectedProfile.gender)}</span>
                      </span>
                      {selectedProfile.profile_locations?.current_city_id && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#064e3b]" />
                          {getCityById(selectedProfile.profile_locations.current_city_id)?.name_en || '-'}
                          {selectedProfile.profile_locations.current_country_id &&
                            `, ${getCountryById(selectedProfile.profile_locations.current_country_id)?.name_en || ''}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#064e3b]" />
                        {formatEnum(selectedProfile.personal_information?.marital_status)}
                      </span>
                      <span className="font-mono bg-[#E5EFE9] border border-[#d1e3dc] text-[10px] font-bold rounded-md px-1.5 py-0.5 text-[#064e3b]">
                        {selectedProfile.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Actions + Status Badge */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/profiles/${selectedProfile.id}`}>
                        <button className="flex items-center gap-1.5 bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[11.5px] px-4 py-2 rounded-full shadow-sm hover:-translate-y-0.5 transition-all">
                          <Eye className="w-3.5 h-3.5" /> Full View
                        </button>
                      </Link>
                      <button className="w-8 h-8 flex items-center justify-center rounded-full border border-[#E5DFD4] hover:bg-[#F0EBE3] text-[#787167] transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <StatusBadge status={selectedProfile.status} size="md" />
                  </div>
                </div>
              </div>

              {/* ─── Horizontal Navigation Tabs ─── */}
              <div className="bg-white border-b border-[#E5DFD4] px-6 shrink-0">
                <div className="flex items-center gap-1 py-1.5">
                  {PROFILE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#064e3b] text-white shadow-sm'
                          : 'text-[#6D6558] hover:bg-[#F0EBE3]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── Dashboard Workspace ─── */}
              <div className={`flex-1 p-4 ${activeTab === 'overview' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
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
