'use client';

import { CheckCircle, User, MapPin, GraduationCap, Heart, Home, Users, Activity, Star, Send, Pencil } from 'lucide-react';
import type { Step1Data } from './Step1BasicInfo';
import type { Step2Data } from './Step2MaritalPhysical';
import type { Step3Data } from './Step3EducationProfession';
import type { Step4Data } from './Step4ReligionCulture';
import type { Step5Data } from './Step5LocationResidency';
import type { Step6Data } from './Step6FamilyDetails';
import type { Step7Data } from './Step7Lifestyle';
import type { Step8Data } from './Step8Preferences';
import { useReferenceData } from '@/lib/hooks/useReferenceData';

interface Step9Props {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
  step7: Step7Data;
  step8: Step8Data;
  onGoToStep: (step: number) => void;
  isSaving: boolean;
}

function ReviewRow({ label, value }: { label: string; value: string | number | null | undefined | React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 group">
      <span className="text-[12px] text-[#676156] font-medium shrink-0">{label}</span>
      <span className="text-[13px] text-[#2F3E51] font-semibold text-right break-words">{value}</span>
    </div>
  );
}

function ReviewSection({ icon: Icon, title, step, onEdit, children }: {
  icon: React.ElementType; title: string; step: number;
  onEdit: (step: number) => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-transparent rounded-[20px] border border-[#E5DFD3] overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#E5DFD3]/60 bg-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E5DFD3]/40 text-[#064e3b] flex items-center justify-center">
            <Icon size={15} strokeWidth={2.5} />
          </div>
          <h4 className="text-[14px] font-bold text-[#1E1F22]">{title}</h4>
        </div>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-[12px] font-bold text-[#C86A4A] hover:text-[#b05a3e] flex items-center gap-1.5 transition-colors"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
      <div className="px-5 py-3 divide-y divide-[#E5DFD3]/40 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

export default function Step9Review({ step1, step2, step3, step4, step5, step6, step7, step8, onGoToStep, isSaving }: Step9Props) {
  const { getReligionById, getCasteById, getSectById, getCountryById, getCityById, getMotherTongueById } = useReferenceData();

  const age = step1.date_of_birth
    ? Math.floor((new Date().getTime() - new Date(step1.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Review & Confirm</h3>
        <p className="text-[12px] text-[#7D766C]">Review all information before saving. Click &quot;Edit&quot; to make changes.</p>
      </div>

      {/* Header Card */}
      <div className="bg-transparent rounded-[24px] border border-[#E5DFD3] p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-transparent border border-[#E5DFD3] flex items-center justify-center shrink-0 overflow-hidden">
          {step1.profile_picture ? (
            <img src={step1.profile_picture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={28} className="text-[#A3B18A]" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-[20px] font-extrabold text-[#1E1F22] mb-2 tracking-tight">
            {step1.full_name || 'Name not entered'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 bg-transparent border border-[#E5DFD3] text-[#2F3E51] text-[10px] uppercase font-bold px-2.5 py-1 rounded-full">
              <User size={10} />
              {step1.gender || '—'}
            </span>
            {age && (
              <span className="flex items-center gap-1.5 bg-transparent border border-[#E5DFD3] text-[#2F3E51] text-[10px] uppercase font-bold px-2.5 py-1 rounded-full">
                {age} yrs
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Basic Info */}
        <ReviewSection icon={User} title="Basic Information" step={1} onEdit={onGoToStep}>
          <ReviewRow label="Full Name" value={step1.full_name} />
          <ReviewRow label="Gender" value={step1.gender} />
          <ReviewRow label="Age" value={age ? `${age} years` : (step1.date_of_birth ? `${new Date().getFullYear() - parseInt(step1.date_of_birth.split('-')[0], 10)} years` : null)} />
          <ReviewRow label="Marital Status" value={step1.marital_status?.replace(/_/g, ' ')} />
          <ReviewRow label="Nationality" value={step1.nationality_country_id ? `${getCountryById(Number(step1.nationality_country_id))?.name_en || ''}${step1.multiple_nationality ? ' (Multiple)' : ''}` : null} />
          <ReviewRow label="Mother Tongue" value={step1.mother_tongue_id ? getMotherTongueById(Number(step1.mother_tongue_id))?.name_en : null} />
        </ReviewSection>

        {/* Physical */}
        <ReviewSection icon={Activity} title="Physical" step={2} onEdit={onGoToStep}>
          <ReviewRow label="Height" value={step2.height_cm ? `${step2.height_cm} cm` : null} />
          <ReviewRow label="Weight" value={step2.weight_kg ? `${step2.weight_kg} kg` : null} />
          <ReviewRow label="Complexion" value={step2.complexion} />
          <ReviewRow label="Has Disability" value={step2.has_disability ? 'Yes' : 'No'} />
          {step2.has_disability && <ReviewRow label="Disability Details" value={step2.disability_details} />}
        </ReviewSection>

        {/* Education */}
        <ReviewSection icon={GraduationCap} title="Education & Profession" step={3} onEdit={onGoToStep}>
          <ReviewRow label="Education Records" value={`${step3.education_records.length} record(s)`} />
          <ReviewRow label="Employment Records" value={`${step3.employment_records.length} record(s)`} />
          <ReviewRow label="Income Range (PKR)" value={step3.monthly_income_min && step3.monthly_income_max ? `${step3.monthly_income_min.toLocaleString()} – ${step3.monthly_income_max.toLocaleString()}` : null} />
        </ReviewSection>

        {/* Religion */}
        <ReviewSection icon={Star} title="Religion & Culture" step={4} onEdit={onGoToStep}>
          <ReviewRow label="Religion" value={step4.religion_id ? getReligionById(Number(step4.religion_id))?.name_en : null} />
          <ReviewRow label="Sect" value={step4.sect_id ? getSectById(Number(step4.sect_id))?.name_en : null} />
          <ReviewRow label="Caste" value={step4.caste_id ? getCasteById(Number(step4.caste_id))?.name_en : step4.other_caste_text || null} />
        </ReviewSection>

        {/* Location */}
        <ReviewSection icon={MapPin} title="Location & Residency" step={5} onEdit={onGoToStep}>
          <ReviewRow label="Current City" value={step5.current_city_id ? getCityById(Number(step5.current_city_id))?.name_en : null} />
          <ReviewRow label="Current Country" value={step5.current_country_id ? getCountryById(Number(step5.current_country_id))?.name_en : null} />
          <ReviewRow label="Address" value={step5.current_location_text} />
          <ReviewRow label="House Status" value={step5.house_status?.replace(/_/g, ' ')} />
          <ReviewRow label="Family Setup" value={step5.family_setup?.replace(/_/g, ' ')} />
          <ReviewRow label="Living With" value={step5.living_with?.replace(/_/g, ' ')} />
        </ReviewSection>

        {/* Family */}
        <ReviewSection icon={Users} title="Family Details" step={6} onEdit={onGoToStep}>
          <ReviewRow label="Parents Added" value={`${step6.parents.length}`} />
          <ReviewRow label="Siblings" value={`${step6.siblings.length}`} />
          <ReviewRow label="Family Business" value={step6.family_profession_business} />
        </ReviewSection>

        {/* Lifestyle */}
        <ReviewSection icon={Heart} title="Lifestyle" step={7} onEdit={onGoToStep}>
          <ReviewRow label="Religious Practice" value={step7.religious_practice?.replace(/_/g, ' ')} />
          {step1.gender === 'MALE' && <ReviewRow label="Beard" value={step7.beard} />}
          {step1.gender === 'FEMALE' && <ReviewRow label="Hijab" value={step7.hijab} />}
          <ReviewRow label="Smoking" value={step7.smoking} />
          <ReviewRow label="Willing to Relocate" value={step7.willing_to_relocate} />
        </ReviewSection>

        {/* Preferences summary */}
        <ReviewSection icon={Send} title="Partner Preferences" step={8} onEdit={onGoToStep}>
          <ReviewRow label="Age Range" value={(step8.pref_min_age || step8.pref_max_age) ? `${step8.pref_min_age || '?'} – ${step8.pref_max_age || '?'} yrs` : null} />
          <ReviewRow label="Income (PKR)" value={(step8.pref_min_income || step8.pref_max_income) ? `${step8.pref_min_income?.toLocaleString() || '?'} – ${step8.pref_max_income?.toLocaleString() || '?'}` : null} />
          <ReviewRow label="Religion Pref" value={step8.pref_religion_id ? getReligionById(Number(step8.pref_religion_id))?.name_en : null} />
          <ReviewRow label="Marital Status Pref" value={step8.pref_marital_status?.replace(/_/g, ' ')} />
        </ReviewSection>
      </div>
    </div>
  );
}
