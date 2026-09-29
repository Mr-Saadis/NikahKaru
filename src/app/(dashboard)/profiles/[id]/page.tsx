'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, PauseCircle, CheckCircle, Trash2, Download } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import type { FullProfile, ProfileStatus } from '@/lib/types/database.types';
import Link from 'next/link';

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await ProfileService.getProfileById(profileId);
        setProfile(data as FullProfile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (profileId) loadProfile();
  }, [profileId]);

  const handleStatusChange = async (newStatus: ProfileStatus) => {
    try {
      await ProfileService.updateProfileStatus(profileId, newStatus);
      setProfile(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: ProfileStatus) => {
    switch(status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc]"><span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>Active</span>;
      case 'DRAFT': return <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#F4EFE7] text-[#696256]">Draft</span>;
      case 'PAUSED': return <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F6E1BA]">Paused</span>;
      case 'ARCHIVED': return <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/40">Archived</span>;
      default: return <span className="text-[12px] font-bold text-[#696256]">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#78716C] font-medium">Loading dossier...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-600 font-medium">Profile not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF8F5]">
      {/* Main Content Area mapping to the concept's .main container but full width here */}
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col">
        
        {/* Concept Header */}
        <header className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#064e3b] text-white flex items-center justify-center text-[44px] font-light tracking-tight flex-shrink-0 shadow-inner">
            {profile.personal_information?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-[32px] font-extrabold text-[#002b17] tracking-tight leading-none mb-2">
              {profile.personal_information?.full_name || 'Unnamed Profile'}
            </h1>
            <p className="text-[13px] text-[#717972] font-medium">
              {profile.personal_information?.date_of_birth || 'DOB unknown'} · {profile.personal_information?.marital_status || 'Status unknown'}
            </p>
            <p className="text-[13px] text-[#717972] mt-1 font-medium">Verified matrimonial dossier, managed securely on the platform.</p>
          </div>
          <div className="ml-auto flex items-center gap-2 self-start md:self-auto">
            {getStatusBadge(profile.status)}
            <span className="px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#F4EFE7] text-[#4E473D] border border-[#E9E4DC]">Matrimonial</span>
          </div>
        </header>

        {/* Action Bar & Tabs */}
        <div className="flex items-center gap-2 pb-4 border-b border-[#E9E4DC] mt-8 flex-wrap">
          <Link href={`/add-profile?edit=${profile.id}`}>
            <button className="w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC] shadow-sm text-[#064e3b] flex items-center justify-center hover:bg-[#F4ECE1] transition-all" title="Edit Profile">
              <Edit2 className="w-[18px] h-[18px]" />
            </button>
          </Link>
          {profile.status !== 'ACTIVE' && (
            <button onClick={() => handleStatusChange('ACTIVE')} className="w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC] shadow-sm text-[#064e3b] flex items-center justify-center hover:bg-[#F4ECE1] transition-all" title="Activate">
              <CheckCircle className="w-[18px] h-[18px]" />
            </button>
          )}
          {profile.status === 'ACTIVE' && (
            <button onClick={() => handleStatusChange('PAUSED')} className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#92400E] border border-[#F6E1BA] shadow-sm flex items-center justify-center hover:bg-[#FDE68A] transition-all" title="Pause">
              <PauseCircle className="w-[18px] h-[18px]" />
            </button>
          )}
          <button onClick={() => handleStatusChange('ARCHIVED')} className="w-10 h-10 rounded-2xl bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]/40 shadow-sm flex items-center justify-center hover:bg-[#FECACA] transition-all" title="Archive">
            <Trash2 className="w-[18px] h-[18px]" />
          </button>

          <span className="ml-2 lg:ml-4 px-4 py-2 bg-white rounded-full text-[11px] font-bold text-[#6D6558] border border-[#E9E4DC] shadow-sm">
            ID: {profile.id.substring(0,8).toUpperCase()}
          </span>
          
          <nav className="flex gap-5 ml-4 lg:ml-8 text-[13px] font-medium text-[#717972] mt-3 sm:mt-0 w-full sm:w-auto overflow-x-auto">
            <span className="text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-2 cursor-pointer pt-2 whitespace-nowrap">Overview</span>
            <span className="pb-2 cursor-pointer pt-2 hover:text-[#4E473D] whitespace-nowrap">Personal</span>
            <span className="pb-2 cursor-pointer pt-2 hover:text-[#4E473D] whitespace-nowrap">Education</span>
            <span className="pb-2 cursor-pointer pt-2 hover:text-[#4E473D] whitespace-nowrap">Family</span>
            <span className="pb-2 cursor-pointer pt-2 hover:text-[#4E473D] whitespace-nowrap">Lifestyle</span>
          </nav>
        </div>

        {/* Two Column Body */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 xl:gap-8 items-start mt-6">
          
          {/* Left Column: Data Rows */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[15px] font-bold text-[#002b17] tracking-tight">Profile Data Overview</h2>
              <span className="text-[11px] font-bold text-[#717972] bg-white px-3 py-1.5 rounded-full border border-[#E9E4DC] shadow-sm">4 Sections</span>
            </div>

            {/* Row 1: Personal */}
            <div className="bg-white rounded-[26px] p-5 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
              <div>
                <b className="text-[14px] font-bold text-[#002b17] block mb-1">Personal Information</b>
                <small className="block text-[#717972] text-[12px] font-medium">Basic details & status</small>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Full Name</span> 
                  <span className="font-bold text-[#1E2022]">{profile.personal_information?.full_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Date of Birth</span> 
                  <span className="font-bold text-[#1E2022]">{profile.personal_information?.date_of_birth}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Marital Status</span> 
                  <span className="font-bold text-[#1E2022]">{profile.personal_information?.marital_status}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Children</span> 
                  <span className="font-bold text-[#1E2022]">{profile.personal_information?.number_of_children}</span>
                </div>
              </div>
            </div>

            {/* Row 2: Physical */}
            <div className="bg-white rounded-[26px] p-5 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
              <div>
                <b className="text-[14px] font-bold text-[#002b17] block mb-1">Physical Attributes</b>
                <small className="block text-[#717972] text-[12px] font-medium">Height, weight, etc.</small>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Height</span> 
                  <span className="font-bold text-[#1E2022]">{profile.physical_information?.height_cm} cm</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Weight</span> 
                  <span className="font-bold text-[#1E2022]">{profile.physical_information?.weight_kg} kg</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Complexion</span> 
                  <span className="font-bold text-[#1E2022]">{profile.physical_information?.complexion || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Disability</span> 
                  <span className="font-bold text-[#1E2022]">{profile.physical_information?.has_disability ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Row 3: Education */}
            <div className="bg-white rounded-[26px] p-5 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
              <div>
                <b className="text-[14px] font-bold text-[#002b17] block mb-1">Education & Career</b>
                <small className="block text-[#717972] text-[12px] font-medium">Qualifications and jobs</small>
              </div>
              <div className="flex flex-col gap-5 text-[13px] w-full">
                <div>
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-2 block">Education</span>
                  {profile.education_records && profile.education_records.length > 0 ? (
                    <ul className="space-y-2">
                      {profile.education_records.map(edu => (
                        <li key={edu.id} className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E9E4DC]">
                          <div className="font-bold text-[#1E2022]">{edu.qualification} - {edu.field_of_study}</div>
                          <div className="text-[#7D766C] text-[11.5px] font-medium mt-1">{edu.institution_name}</div>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-[12px] text-[#A8A296] italic font-medium">No education records.</div>}
                </div>
                <div className="border-t border-[#F5EFE6] pt-4">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-2 block">Employment</span>
                  {profile.employment_records && profile.employment_records.length > 0 ? (
                    <ul className="space-y-2">
                      {profile.employment_records.map(emp => (
                        <li key={emp.id} className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E9E4DC]">
                          <div className="font-bold text-[#1E2022]">{emp.job_title}</div>
                          <div className="text-[#7D766C] text-[11.5px] font-medium mt-1">{emp.organization_name} • {emp.employment_type}</div>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-[12px] text-[#A8A296] italic font-medium">No employment records.</div>}
                </div>
              </div>
            </div>

            {/* Row 4: Location */}
            <div className="bg-white rounded-[26px] p-5 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
              <div>
                <b className="text-[14px] font-bold text-[#002b17] block mb-1">Location & Residency</b>
                <small className="block text-[#717972] text-[12px] font-medium">Addresses and setup</small>
              </div>
              <div className="grid grid-cols-1 gap-y-4 text-[13px]">
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Current Location</span> 
                  <span className="font-bold text-[#1E2022]">{profile.profile_locations?.current_location_text || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Permanent Location</span> 
                  <span className="font-bold text-[#1E2022]">{profile.profile_locations?.permanent_location_text || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-2 pt-4 border-t border-[#F5EFE6]">
                   <div className="flex flex-col">
                     <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">House Status</span> 
                     <span className="font-bold text-[#1E2022]">{profile.residency_information?.house_status || '-'}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[#888174] text-[10.5px] uppercase tracking-wider font-bold mb-1">Family Setup</span> 
                     <span className="font-bold text-[#1E2022]">{profile.residency_information?.family_setup || '-'}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Asides */}
          <aside className="flex flex-col gap-4">
            
            {/* Dark Brand Card (maps to .blue / .pine) */}
            <div className="bg-[#115E49] text-white rounded-[28px] p-[22px] shadow-[0_4px_14px_0_rgba(22,56,46,0.39)]">
              <h4 className="text-[15px] font-bold tracking-tight text-white/90">Status Distribution</h4>
              <div className="text-[44px] font-extrabold tracking-tight mt-2 mb-1 leading-none">
                {profile.status === 'ACTIVE' ? 'Active' : profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}
              </div>
              <small className="opacity-70 text-[11px] font-medium block mb-5 leading-relaxed">
                Current visibility state of the profile within the matrimonial network.
              </small>
              
              <div className="flex items-center gap-3 p-3.5 bg-white/10 rounded-2xl text-[12px] font-medium backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-full bg-[#064e3b] shadow-inner flex items-center justify-center text-[10px] font-bold">ID</div>
                <b className="ml-auto font-mono text-[13px] tracking-wide">{profile.id.substring(0,8).toUpperCase()}</b>
              </div>
            </div>
            
            {/* Highlight Accent Card (maps to PrimaryCandidate2 / .lime / .clay) */}
            <div className="bg-[#F7F3EA] border border-[#ECC066]/60 rounded-[28px] p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-4 bottom-4 w-2 bg-[#064e3b] rounded-l-md opacity-90"></div>
              
              <h4 className="text-[15px] font-extrabold text-[#002b17] tracking-tight">Match Analysis</h4>
              <p className="text-[12px] font-semibold text-[#59440e] mt-1 mb-5">
                Run matching engine to find potential partners for this candidate.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="bg-white/60 border border-[#ECC066]/40 rounded-2xl p-3.5 text-[11px] shadow-sm">
                  <b className="block text-[26px] font-extrabold text-[#002b17] tracking-tight leading-none mb-1">0</b>
                  <span className="text-[#725b24] font-bold uppercase tracking-wider text-[10px]">Matches</span>
                </div>
                <div className="bg-white/60 border border-[#ECC066]/40 rounded-2xl p-3.5 text-[11px] shadow-sm">
                  <b className="block text-[26px] font-extrabold text-[#002b17] tracking-tight leading-none mb-1">0</b>
                  <span className="text-[#725b24] font-bold uppercase tracking-wider text-[10px]">Requests</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 h-[44px] rounded-full bg-[#064e3b] text-white flex items-center justify-center gap-2 font-bold text-[13px] shadow-sm hover:bg-[#0f4229] hover:-translate-y-0.5 transition-all duration-150">
                   Request Match Report
                </button>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
