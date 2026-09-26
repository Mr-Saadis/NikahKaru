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
    <div className="flex flex-col min-h-full">
      {/* Dossier Header */}
      <header className="bg-[#FCF9F4] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E4DC]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-[#F4ECE1] border border-[#E9E4DC] shadow-sm text-[#064e3b] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-[28px] font-extrabold text-[#002b17] tracking-tight">{profile.personal_information?.full_name || 'Unnamed Profile'}</h1>
              <span className="font-mono bg-white border border-[#E9E4DC] text-[11px] font-bold rounded shadow-sm px-2 py-0.5 text-[#6D6558]">
                ID: {profile.id.substring(0,8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[13px] font-medium text-[#717972]">
              <span>Gender: <strong className="text-[#4E473D]">{profile.gender}</strong></span>
              <span className="w-1 h-1 rounded-full bg-[#717972]"></span>
              <span>Created: <strong className="text-[#4E473D]">{new Date(profile.created_at).toLocaleDateString()}</strong></span>
              <span className="w-1 h-1 rounded-full bg-[#717972]"></span>
              {getStatusBadge(profile.status)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] shadow-sm text-[#4E473D] transition-all">
            <Download className="w-4 h-4" />
          </button>
          {profile.status !== 'ACTIVE' && (
            <button onClick={() => handleStatusChange('ACTIVE')} className="flex items-center gap-2 bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[13px] px-5 py-2.5 rounded-full shadow-sm hover:-translate-y-0.5 transition-all">
              <CheckCircle className="w-4 h-4" /> Activate
            </button>
          )}
          {profile.status === 'ACTIVE' && (
            <button onClick={() => handleStatusChange('PAUSED')} className="flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] border border-[#F6E1BA] hover:bg-[#FDE68A] font-bold text-[13px] px-5 py-2.5 rounded-full shadow-sm hover:-translate-y-0.5 transition-all">
              <PauseCircle className="w-4 h-4" /> Pause
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Action Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-[#ECE5D9] shadow-sm flex items-center justify-between">
          <div className="text-[13px] font-bold text-[#1F1E1B]">Profile Management Options</div>
          <div className="flex items-center gap-2">
            <Link href={`/add-profile?edit=${profile.id}`}>
              <button className="flex items-center gap-2 bg-white hover:bg-[#F2ECE1] text-[#4E473D] border border-[#E9E4DC] font-bold text-[13px] px-5 py-2 rounded-full shadow-sm transition">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </Link>
            <button 
              onClick={() => handleStatusChange('ARCHIVED')}
              className="flex items-center gap-2 text-[#991B1B] hover:bg-[#FEE2E2] font-bold text-[13px] px-5 py-2 rounded-full transition"
            >
              <Trash2 className="w-4 h-4" /> Archive
            </button>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Personal Info */}
          <section className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6] mb-4">
              <h3 className="text-[14.5px] font-bold text-[#1F1E1B]">Personal Information</h3>
            </div>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-[#867E72]">Full Name</span> <span className="font-bold text-[#1E1F22]">{profile.personal_information?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">DOB</span> <span className="font-bold text-[#1E1F22]">{profile.personal_information?.date_of_birth}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Marital Status</span> <span className="font-bold text-[#1E1F22]">{profile.personal_information?.marital_status}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Children</span> <span className="font-bold text-[#1E1F22]">{profile.personal_information?.number_of_children}</span></div>
            </div>
          </section>

          {/* Physical Info */}
          <section className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6] mb-4">
              <h3 className="text-[14.5px] font-bold text-[#1F1E1B]">Physical Information</h3>
            </div>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-[#867E72]">Height</span> <span className="font-bold text-[#1E1F22]">{profile.physical_information?.height_cm} cm</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Weight</span> <span className="font-bold text-[#1E1F22]">{profile.physical_information?.weight_kg} kg</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Complexion</span> <span className="font-bold text-[#1E1F22]">{profile.physical_information?.complexion || '-'}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Disability</span> <span className="font-bold text-[#1E1F22]">{profile.physical_information?.has_disability ? 'Yes' : 'No'}</span></div>
            </div>
          </section>

          {/* Education & Employment */}
          <section className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6] mb-4">
              <h3 className="text-[14.5px] font-bold text-[#1F1E1B]">Education & Employment</h3>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-[#867E72] uppercase tracking-wider mb-2">Education</h4>
                {profile.education_records && profile.education_records.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.education_records.map(edu => (
                      <li key={edu.id} className="text-[13px]">
                        <div className="font-bold text-[#1E1F22]">{edu.qualification} - {edu.field_of_study}</div>
                        <div className="text-[#867E72] text-[11px]">{edu.institution_name}</div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-[12px] text-[#A8A296]">No education records.</div>}
              </div>
              <div className="border-t border-[#F5EFE6] pt-3">
                <h4 className="text-[11px] font-bold text-[#867E72] uppercase tracking-wider mb-2">Employment</h4>
                {profile.employment_records && profile.employment_records.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.employment_records.map(emp => (
                      <li key={emp.id} className="text-[13px]">
                        <div className="font-bold text-[#1E1F22]">{emp.job_title}</div>
                        <div className="text-[#867E72] text-[11px]">{emp.organization_name} • {emp.employment_type}</div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-[12px] text-[#A8A296]">No employment records.</div>}
              </div>
            </div>
          </section>

          {/* Location & Residency */}
          <section className="bg-white rounded-[26px] p-5 border border-[#ECE5D9] shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6] mb-4">
              <h3 className="text-[14.5px] font-bold text-[#1F1E1B]">Location & Residency</h3>
            </div>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-[#867E72]">Current Location</span> <span className="font-bold text-[#1E1F22]">{profile.profile_locations?.current_location_text || '-'}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Permanent Location</span> <span className="font-bold text-[#1E1F22]">{profile.profile_locations?.permanent_location_text || '-'}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">House Status</span> <span className="font-bold text-[#1E1F22]">{profile.residency_information?.house_status || '-'}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Living With</span> <span className="font-bold text-[#1E1F22]">{profile.residency_information?.living_with || '-'}</span></div>
              <div className="flex justify-between"><span className="text-[#867E72]">Family Setup</span> <span className="font-bold text-[#1E1F22]">{profile.residency_information?.family_setup || '-'}</span></div>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
