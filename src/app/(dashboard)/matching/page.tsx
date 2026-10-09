'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Search, Loader2, UserPlus, ChevronDown, ChevronUp, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { MatchResult } from '@/lib/matching/types';
import ScoreBreakdown from '@/components/matching/ScoreBreakdown';
import ProfileDataView from '@/components/matching/ProfileDataView';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function MatchingPage() {
  const { role } = useAuthStore();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  
  const [isMatching, setIsMatching] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [sourcePrefs, setSourcePrefs] = useState<any | null>(null);
  const [sourceData, setSourceData] = useState<any | null>(null);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, gender, created_at,
          personal_information (*),
          physical_information (*),
          education_records (*),
          employment_records (*),
          income_information (*),
          religion_information (*),
          profile_locations (*),
          residency_information (*),
          lifestyle_information (*)
        `)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load profiles:', error);
      } else {
        setProfiles(data || []);
      }
      setIsLoadingProfiles(false);
    }
    fetchProfiles();
  }, []);

  const handleSelectProfile = (profile: any) => {
    setSelectedProfile(profile);
    setResults(null);
    setSourcePrefs(null);
    setSourceData(null);
    setError(null);
    setExpandedCard(null);
  };

  const handleRunMatch = async (mode: 'PREVIEW' | 'OFFICIAL') => {
    if (!selectedProfile) return;
    
    if (selectedProfile.status !== 'ACTIVE') {
      setError("Matching can only be run on ACTIVE profiles. Please ensure the profile is fully approved and active first.");
      return;
    }

    setIsMatching(true);
    setError(null);
    setResults(null);
    setSourcePrefs(null);
    setSourceData(null);
    setExpandedCard(null);

    try {
      const endpoint = mode === 'PREVIEW' ? '/api/matching/preview' : '/api/matching/run';
      const body = mode === 'PREVIEW' 
        ? { sourceProfileId: selectedProfile.id }
        : { sourceProfileId: selectedProfile.id, candidateLimit: 10 };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run matching');
      }

      setResults(data.candidates);
      if (data.sourcePrefs) {
        setSourcePrefs(data.sourcePrefs);
        setSourceData(selectedProfile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsMatching(false);
    }
  };

  // Helper to extract full name
  const getFullName = (p: any) => {
    if (!p || !p.personal_information) return 'Unnamed';
    if (Array.isArray(p.personal_information)) return p.personal_information[0]?.full_name || 'Unnamed';
    return p.personal_information.full_name || 'Unnamed';
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5]">
      <Header
        title="Matching Engine"
        subtitle="Find highly compatible matches using rule-based scoring"
        icon={<Search className="w-5 h-5" />}
        showBackButton={false}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Profile List */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-[#EFE9DF] bg-white flex flex-col h-[calc(100vh-80px)]">
          <div className="p-4 border-b border-[#EFE9DF]">
            <h3 className="text-sm font-bold text-[#16382E] uppercase tracking-wider">Active Profiles</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {isLoadingProfiles ? (
              <div className="p-8 text-center text-[#A8A296]"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : profiles.length === 0 ? (
              <div className="p-8 text-center text-[#A8A296] text-sm">No active profiles found.</div>
            ) : (
              profiles.map(p => {
                const isSelected = selectedProfile?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-[#16382E] text-white shadow-md' 
                        : 'hover:bg-[#FAF8F5] text-[#16382E]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-[#EFE9DF]'}`}>
                      <User className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#7D766C]'}`} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate">
                        {getFullName(p)}
                      </p>
                      <p className={`text-xs truncate ${isSelected ? 'text-[#D4AF37]' : 'text-[#888174]'}`}>
                        {p.gender} • ID: {p.id.substring(0,6)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Matching Actions & Results */}
        <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar p-6 lg:p-8 bg-[#FAF8F5]">
          {!selectedProfile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#EFE9DF]">
                <Search className="w-8 h-8 text-[#C4BCAB]" />
              </div>
              <h2 className="text-2xl font-bold text-[#16382E] mb-2">Select a Profile</h2>
              <p className="text-[#7D766C]">Choose an active profile from the left sidebar to find compatible matches.</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto w-full space-y-6">
              
              {/* Action Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#EFE9DF] flex flex-col items-start gap-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                  <div>
                    <h3 className="text-xl font-bold text-[#16382E] mb-1">
                      Find matches for {getFullName(selectedProfile)}
                    </h3>
                    <p className="text-sm text-[#7D766C]">
                      {selectedProfile.gender} • Profile ID: {selectedProfile.id}
                    </p>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={() => handleRunMatch('PREVIEW')}
                      disabled={isMatching}
                      className="flex-1 md:flex-none bg-[#FAF8F5] hover:bg-[#F5F2EC] text-[#16382E] border border-[#EFE9DF] px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Preview Run
                    </button>
                    
                    {role !== 'AGENT' && (
                      <button
                        onClick={() => handleRunMatch('OFFICIAL')}
                        disabled={isMatching}
                        className="flex-1 md:flex-none bg-[#16382E] hover:bg-[#064e3b] text-white px-6 py-3.5 rounded-xl font-semibold text-sm shadow-[0_4px_14px_0_rgba(22,56,46,0.39)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        Official Run
                      </button>
                    )}
                  </div>
                </div>

                {/* Display Source Profile Details and Preferences IF matches were fetched */}
                {sourcePrefs && sourceData && (
                  <div className="w-full">
                    <ProfileDataView data={sourceData} prefs={sourcePrefs} isSource={true} />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              {/* Results */}
              {results && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-[#16382E]">
                      Found {results.length} Candidates
                    </h3>
                  </div>

                  {results.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE9DF]">
                      <div className="w-16 h-16 bg-[#FAF8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-[#C4BCAB]" />
                      </div>
                      <h4 className="text-lg font-bold text-[#16382E] mb-2">No Matches Found</h4>
                      <p className="text-[#7D766C]">Try adjusting the mandatory preferences of the source profile.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 pb-12">
                      {results.map((result) => {
                        const isExpanded = expandedCard === result.candidateProfileId;

                        return (
                          <div key={result.candidateProfileId} className="bg-white rounded-2xl border border-[#EFE9DF] overflow-hidden shadow-sm transition-all hover:shadow-md">
                            {/* Card Header (Summary) */}
                            <div 
                              className="p-5 flex items-center justify-between cursor-pointer select-none"
                              onClick={() => setExpandedCard(isExpanded ? null : result.candidateProfileId)}
                            >
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#16382E] font-bold text-lg border border-[#EFE9DF]">
                                  #{result.rank}
                                </div>
                                <div>
                                  <h4 className="text-[15px] font-bold text-[#16382E]">Profile ID: {result.candidateProfileId.substring(0,8).toUpperCase()}</h4>
                                  <p className="text-[13px] text-[#7D766C]">{getFullName(result.candidateData)} • Candidate</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-[#888174] uppercase tracking-wider mb-0.5">Compatibility</p>
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-2xl font-extrabold text-[#115E49]">{result.finalScore}%</span>
                                  </div>
                                </div>
                                
                                <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#16382E]">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Breakdown & Raw Data */}
                            {isExpanded && (
                              <div className="px-5 pb-5 border-t border-[#F5F2EC] pt-4 bg-[#FAF8F5] flex flex-col gap-6">
                                <ScoreBreakdown result={result} />
                                
                                {/* Display Candidate Raw Data and Preferences */}
                                <ProfileDataView data={result.candidateData} prefs={result.candidatePrefs} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
