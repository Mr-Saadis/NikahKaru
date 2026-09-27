'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, User } from 'lucide-react';
import { useRef } from 'react';
import CustomDatePicker from '@/components/ui/custom-date-picker';

import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { PersonalInformation, ProfileGender, MaritalStatus } from '@/lib/types/database.types';

type Step1Data = {
  gender: ProfileGender | '';
  full_name: string;
  date_of_birth: string;
  marital_status: MaritalStatus | '';
  number_of_children?: number | '';
  children_living_with?: '' | 'YES' | 'NO' | 'SOMETIMES';
  nationality_country_id: number | '';
  mother_tongue_id: number | '';
  profile_picture?: string;
};

interface Step1Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

const MARITAL_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'NEVER_MARRIED', label: 'Never Married' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
  { value: 'SEPARATED', label: 'Separated' },
];

export type { Step1Data };

export default function Step1BasicInfo({ data, onChange }: Step1Props) {
  const { countries, motherTongues } = useReferenceData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof Step1Data, value: Step1Data[keyof Step1Data]) =>
    onChange({ ...data, [field]: value });

  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        set('profile_picture', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Basic Information</h3>
        <p className="text-[12px] text-[#7D766C]">Enter the person's core identity details.</p>
      </div>

      {/* Full Name & Avatar */}
      <div className="flex gap-4 items-end">
        <div className="flex-shrink-0">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-[52px] h-[52px] rounded-full bg-[#F7F3EA] border border-[#ECC066]/60 flex flex-col items-center justify-center text-[#725b24] overflow-hidden hover:border-[#ECC066] transition-colors shadow-sm"
          >
            {data.profile_picture ? (
              <img src={data.profile_picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 opacity-70" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
        
        <div className="flex-1 space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            placeholder="Enter full name"
            className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Gender <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {(['MALE', 'FEMALE'] as ProfileGender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set('gender', data.gender === g ? '' : g)}
              className={`flex-1 py-3 rounded-xl text-[13px] font-semibold border transition-all flex items-center justify-center gap-2 ${
                data.gender === g
                  ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm'
                  : 'bg-white border-[#E9E4DC] text-[#4E473D] hover:border-[#064e3b]/30 hover:bg-[#F7FAF8]'
              }`}
            >
              {g === 'MALE' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="14" r="7"/>
                  <line x1="15" y1="9" x2="21" y2="3"/>
                  <line x1="16" y1="3" x2="21" y2="3"/>
                  <line x1="21" y1="3" x2="21" y2="8"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="7"/>
                  <line x1="12" y1="17" x2="12" y2="23"/>
                  <line x1="9" y1="20" x2="15" y2="20"/>
                </svg>
              )}
              {g === 'MALE' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Date of Birth & Age */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Date of Birth
          </label>
          <CustomDatePicker
            value={data.date_of_birth}
            onChange={(val) => set('date_of_birth', val)}
            placeholder="dd/mm/yyyy"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Age
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={data.date_of_birth ? `${calculateAge(data.date_of_birth)} years` : ''}
              placeholder="Auto-calculated"
              className="w-full h-[46px] bg-[#FBF9F5] border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#888174] font-medium cursor-not-allowed outline-none"
            />
          </div>
        </div>
      </div>

      {/* Marital Status (Full Row) */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Marital Status <span className="text-red-500">*</span>
        </label>
        <Select
          value={data.marital_status}
          onValueChange={(val) => {
            const newStatus = val as MaritalStatus;
            const newData = { ...data, marital_status: newStatus };
            // Reset children count and living status if they switch to NEVER_MARRIED
            if (newStatus === 'NEVER_MARRIED') {
              newData.number_of_children = '';
              newData.children_living_with = '';
            }
            onChange(newData);
          }}
        >
          <SelectTrigger className="w-full h-[46px] bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all shadow-none">
            <SelectValue placeholder="Select marital status" />
          </SelectTrigger>
          <SelectContent>
            {MARITAL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Children Row - Only show if not NEVER_MARRIED */}
      {data.marital_status && data.marital_status !== 'NEVER_MARRIED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
              Number of Children
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={data.number_of_children === undefined ? '' : data.number_of_children}
              onChange={(e) => {
                const count = e.target.value === '' ? '' : Number(e.target.value);
                const newData = { ...data, number_of_children: count };
                if (count === 0 || count === '') {
                  newData.children_living_with = '';
                }
                onChange(newData);
              }}
              placeholder="e.g. 2 (Leave empty if none)"
              className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
            />
          </div>

          {/* Living With - Only show if number_of_children > 0 */}
          {typeof data.number_of_children === 'number' && data.number_of_children > 0 && (
            <div className="space-y-2 animate-in fade-in zoom-in duration-300">
              <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
                Children Living With You?
              </label>
              <Select
                value={data.children_living_with || ''}
                onValueChange={(val) => set('children_living_with', val as any)}
              >
                <SelectTrigger className="w-full h-[46px] bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all shadow-none">
                  <SelectValue placeholder="Select arrangement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">Yes</SelectItem>
                  <SelectItem value="NO">No</SelectItem>
                  <SelectItem value="SOMETIMES">Sometimes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Nationality */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Nationality
          </label>
          <Select
            value={data.nationality_country_id ? String(data.nationality_country_id) : undefined}
            onValueChange={(val) => set('nationality_country_id', val ? Number(val) : '')}
          >
            <SelectTrigger className="w-full h-[46px] bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all shadow-none">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Mother Tongue
          </label>
          <Select
            value={data.mother_tongue_id ? String(data.mother_tongue_id) : undefined}
            onValueChange={(val) => set('mother_tongue_id', val ? Number(val) : '')}
          >
            <SelectTrigger className="w-full h-[46px] bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all shadow-none">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {motherTongues.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
