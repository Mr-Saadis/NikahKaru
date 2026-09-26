'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Users, Search, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { ProfileService, type ProfileFilters } from '@/lib/services/profile-service';
import type { ProfileListItem, ProfileStatus } from '@/lib/types/database.types';
import Link from 'next/link';
import { useReferenceData } from '@/lib/hooks/useReferenceData';

const STATUS_TABS: { label: string; value: ProfileStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export default function ProfilesListPage() {
  const { getCityById } = useReferenceData();
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  
  const [filters, setFilters] = useState<ProfileFilters>({
    page: 1,
    limit: 10,
    status: undefined,
    search: undefined
  });

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await ProfileService.getProfilesList(filters);
      setProfiles(res.data);
      setTotalCount(res.count);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(f => ({ ...f, search: searchInput || undefined, page: 1 }));
  };

  const handleTabChange = (status: ProfileStatus | 'ALL') => {
    setFilters(f => ({ ...f, status: status === 'ALL' ? undefined : status as ProfileStatus, page: 1 }));
  };

  const getStatusBadge = (status: ProfileStatus) => {
    switch(status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]"><span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>Active</span>;
      case 'DRAFT': return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F4EFE7] text-[#696256]">Draft</span>;
      case 'PAUSED': return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F6E1BA]">Paused</span>;
      case 'ARCHIVED': return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/40">Archived</span>;
      default: return <span className="text-[11px] font-bold text-[#696256]">{status}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / (filters.limit || 10));

  return (
    <>
      <Header
        title="Profiles & Dossiers"
        subtitle="Manage and review all matrimonial profiles"
        icon={<Users className="w-5 h-5" />}
        showBackButton={false}
      />
      
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-7">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-sm">
          
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map(tab => {
              const isActive = (filters.status === tab.value) || (!filters.status && tab.value === 'ALL');
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all ${isActive ? 'bg-[#16382E] text-white' : 'bg-[#F4EFE7] text-[#696256] hover:bg-[#ECE4D8]'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSearch} className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888174]" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[#FCF9F4] border border-[#E9E4DC] rounded-xl pl-9 pr-4 py-2 text-[12px] focus:ring-1 focus:ring-[#064e3b]/20 focus:border-[#064e3b] outline-none"
            />
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[28px] border border-[#ECE5D9] p-5 lg:p-6 shadow-sm overflow-hidden flex flex-col">
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1E1F22]">Match Ledger</h2>
              <p className="text-[12px] text-[#78716C]">Showing {profiles.length} of {totalCount} profiles</p>
            </div>
            <button className="flex items-center gap-2 bg-white border border-[#E9E4DC] text-[#24211D] font-bold text-[12.5px] px-4 py-2 rounded-full hover:bg-[#F4ECE1] transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-[#F5EFE6]">
                  <th className="text-[#888174] font-medium text-[11.5px] uppercase tracking-wider py-3.5 px-3">Profile ID</th>
                  <th className="text-[#888174] font-medium text-[11.5px] uppercase tracking-wider py-3.5 px-3">Client</th>
                  <th className="text-[#888174] font-medium text-[11.5px] uppercase tracking-wider py-3.5 px-3">Age & Gender</th>
                  <th className="text-[#888174] font-medium text-[11.5px] uppercase tracking-wider py-3.5 px-3">Location</th>
                  <th className="text-[#888174] font-medium text-[11.5px] uppercase tracking-wider py-3.5 px-3">Status</th>
                  <th className="text-[#888174] font-medium text-[11.5px] uppercase tracking-wider py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F3EB]">
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-[#888174] text-sm font-medium">Loading profiles...</td></tr>
                ) : profiles.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-[#888174] text-sm font-medium">No profiles found.</td></tr>
                ) : (
                  profiles.map(profile => {
                    const dob = profile.personal_information?.date_of_birth;
                    let age = '-';
                    if (dob) {
                      const ageNum = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                      age = `${ageNum} yrs`;
                    }
                    
                    let city = 'Unknown';
                    if (profile.profile_locations?.current_city_id) {
                       const c = getCityById(profile.profile_locations.current_city_id);
                       if (c) city = c.name_en;
                    }

                    return (
                      <tr key={profile.id} className="hover:bg-[#FAF7F2] transition-colors group">
                        <td className="py-4 px-3 font-mono font-bold text-[#6D6558] text-[12px]">
                          {profile.id.substring(0,8).toUpperCase()}
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs ${profile.gender === 'MALE' ? 'bg-[#E5EFE9] text-[#165842]' : 'bg-[#FCE2DF] text-[#A6372A]'}`}>
                              {profile.personal_information?.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-bold text-[#1E1F22] text-[13px]">{profile.personal_information?.full_name || 'Unnamed'}</div>
                              <div className="text-[11px] text-[#7C756B] capitalize">{profile.personal_information?.marital_status?.replace(/_/g, ' ').toLowerCase() || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-[13px] text-[#2A2925]">
                          <div className="font-medium">{age}</div>
                          <div className="text-[11px] text-[#7C756B] capitalize">{profile.gender.toLowerCase()}</div>
                        </td>
                        <td className="py-4 px-3 text-[13px] text-[#2A2925] font-medium">{city}</td>
                        <td className="py-4 px-3">
                          {getStatusBadge(profile.status)}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full border border-[#E5DFD4] hover:bg-[#F2ECE1] text-[#787167]">
                              <Download className="w-4 h-4" />
                            </button>
                            <Link href={`/profiles/${profile.id}`}>
                              <button className="bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold px-4 py-1.5 rounded-full text-[12px] transition-transform hover:-translate-y-0.5">
                                View Dossier
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 pt-4 border-t border-[#F5EFE6] flex items-center justify-between text-[12px] text-[#7D766C]">
            <div>Page {filters.page} of {totalPages || 1}</div>
            <div className="flex gap-2">
              <button 
                disabled={filters.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
                className="flex items-center px-3 py-1.5 rounded-xl border border-[#E2DBD0] hover:bg-[#FAF7F2] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </button>
              <button 
                disabled={filters.page === totalPages || totalPages === 0}
                onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
                className="flex items-center px-3 py-1.5 rounded-xl border border-[#E2DBD0] hover:bg-[#FAF7F2] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
