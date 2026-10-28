'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Trash2, Camera, User, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { compressImage } from '@/lib/imageUtils';

import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { PersonalInformation, ProfileGender, MaritalStatus } from '@/lib/types/database.types';

type Step1Data = {
  gender: ProfileGender | '';
  full_name: string;
  cnic: string;
  phone: string;
  date_of_birth: string;
  age?: number | '';
  marital_status: MaritalStatus | '';
  number_of_children?: number | '';
  children_living_with?: '' | 'YES' | 'NO' | 'SOMETIMES';
  nationality_country_id: number | '';
  multiple_nationality?: boolean;
  mother_tongue_id: number | '';
  profile_picture?: string;
  profile_picture_file?: File;
  children: { _tempId: string; gender: string; age: string; living_with_profile: string; additional_details: string }[];
  previous_marriages: { _tempId: string; marriage_status: string; marriage_year: string; end_year: string; reason_for_end: string; children_count: string; children_live_with_profile: string }[];
};

interface Step1Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
  onImageUpload?: (compressedFile: File, previewDataUrl: string) => void;
  isUploadingImage?: boolean;
}

const MARITAL_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'NEVER_MARRIED', label: 'Never Married' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
  { value: 'SEPARATED', label: 'Separated' },
];

export type { Step1Data };

export default function Step1BasicInfo({ data, onChange, onImageUpload, isUploadingImage }: Step1Props) {
  const { countries, motherTongues } = useReferenceData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof Step1Data, value: Step1Data[keyof Step1Data]) =>
    onChange({ ...data, [field]: value });

  const getAgeFromDob = (dobString: string): string => {
    if (!dobString) return '';
    const yearPart = parseInt(dobString.split('-')[0], 10);
    if (!isNaN(yearPart) && yearPart > 1900) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - yearPart;
      return age > 0 ? String(age) : '';
    }
    return '';
  };

  const [ageInput, setAgeInput] = useState<string>(() => getAgeFromDob(data.date_of_birth));

  useEffect(() => {
    const derived = getAgeFromDob(data.date_of_birth);
    setAgeInput((prev) => (prev === derived ? prev : derived));
  }, [data.date_of_birth]);

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const val = raw.slice(0, 3);
    setAgeInput(val);

    if (!val) {
      set('date_of_birth', '');
      return;
    }

    const ageNum = parseInt(val, 10);
    if (!isNaN(ageNum) && ageNum >= 1 && ageNum <= 120) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - ageNum;
      set('date_of_birth', `${birthYear}-01-01`);
    } else {
      set('date_of_birth', '');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await compressImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          // Set preview immediately for UI feedback
          onChange({
            ...data,
            profile_picture: previewUrl,
          });
          // Trigger parent upload callback (handles bucket upload)
          if (onImageUpload) {
            onImageUpload(compressedFile, previewUrl);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error("Compression failed:", err);
      }
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
            disabled={isUploadingImage}
            className="group relative w-[52px] h-[52px] rounded-full bg-[#F7F3EA] border border-[#ECC066]/60 flex flex-col items-center justify-center text-[#725b24] overflow-hidden hover:border-[#ECC066] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {data.profile_picture ? (
              <img src={data.profile_picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 opacity-70" />
            )}
            {isUploadingImage ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
        </div>

        <div className="flex-1 space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.full_name}
            onChange={(e) => {
              if (/^[A-Za-z\s]*$/.test(e.target.value)) set('full_name', e.target.value);
            }}
            placeholder="Enter full name"
            className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
          />
        </div>
      </div>

      {/* CNIC & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            CNIC Number
          </label>
          <input
            type="text"
            value={data.cnic || ''}
            onChange={(e) => set('cnic', e.target.value)}
            placeholder="00000-0000000-0"
            className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Phone Number
          </label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+92 300 0000000"
            className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
          />
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Gender <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-8 lg:gap-12">
          {(['MALE', 'FEMALE'] as ProfileGender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set('gender', data.gender === g ? '' : g)}
              className={`flex-1 h-[52px] rounded-[20px] text-[14px] font-semibold border transition-all flex items-center justify-center gap-2 ${data.gender === g
                  ? 'bg-[#2F3E51] text-white border-[#2F3E51] shadow-md'
                  : 'bg-[#FAF8F5] border-[#8A968C] text-[#4E473D] hover:border-[#064e3b]/50 hover:bg-white shadow-none'
                }`}
            >
              {g === 'MALE' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="14" r="7" />
                  <line x1="15" y1="9" x2="21" y2="3" />
                  <line x1="16" y1="3" x2="21" y2="3" />
                  <line x1="21" y1="3" x2="21" y2="8" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="7" />
                  <line x1="12" y1="17" x2="12" y2="23" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                </svg>
              )}
              {g === 'MALE' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Age <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={ageInput}
              onChange={handleAgeChange}
              placeholder="e.g. 26"
              maxLength={3}
              className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] pl-5 pr-20 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#888174] pointer-events-none">
              Years
            </span>
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
              newData.children = [];
              newData.previous_marriages = [];
            }
            onChange(newData);
          }}
        >
          <SelectTrigger className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none">
            <SelectValue placeholder="Select marital status" />
          </SelectTrigger>
          <SelectContent>
            {MARITAL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.marital_status && data.marital_status !== 'NEVER_MARRIED' && (
        <div className="space-y-4 pt-4 border-t border-[#EFE9DF] animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-[13px] font-bold text-[#1E1F22]">Other / Previous Marriages</h4>
          {data.previous_marriages?.map((pm, index) => (
            <div key={pm._tempId} className="p-4 bg-white border border-[#EFE9DF] rounded-xl space-y-3 relative group">
              <button type="button" onClick={() => onChange({ ...data, previous_marriages: data.previous_marriages.filter((_, i) => i !== index) })}
                className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div className={pm.marriage_status === 'MARRIED' ? 'col-span-1' : ''}>
                  <label className="block text-[10px] font-bold text-[#888174] uppercase mb-1">Status</label>
                  <SearchableSelect
                    value={pm.marriage_status}
                    onChange={(val) => {
                      const newArr = [...data.previous_marriages];
                      newArr[index].marriage_status = val;
                      onChange({ ...data, previous_marriages: newArr });
                    }}
                    options={[
                      ...(data.gender === 'MALE' ? [{ value: 'MARRIED', label: 'Married / Existing Wife' }] : []),
                      { value: 'DIVORCED', label: 'Divorced' },
                      { value: 'WIDOWED', label: 'Widowed' },
                      { value: 'SEPARATED', label: 'Separated' }
                    ]}
                    placeholder="Status"
                    className="bg-gray-50 border-[#EFE9DF] h-[32px] px-2.5 text-[12px] rounded-lg"
                  />
                </div>
                <div className={pm.marriage_status === 'MARRIED' ? 'col-span-1 grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'}>
                  <div>
                    <label className="block text-[10px] font-bold text-[#888174] uppercase mb-1">Start Year <span className="normal-case font-medium text-[#A8A296]">(Optional)</span></label>
                    <input type="text" value={pm.marriage_year} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); const arr = [...data.previous_marriages]; arr[index].marriage_year = v; onChange({ ...data, previous_marriages: arr }); }} placeholder="YYYY" className="w-full bg-gray-50 border border-[#EFE9DF] rounded-lg px-2.5 h-[32px] text-[12px]" />
                  </div>
                  {pm.marriage_status !== 'MARRIED' && (
                    <div>
                      <label className="block text-[10px] font-bold text-[#888174] uppercase mb-1">End Year <span className="normal-case font-medium text-[#A8A296]">(Optional)</span></label>
                      <input type="text" value={pm.end_year} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); const arr = [...data.previous_marriages]; arr[index].end_year = v; onChange({ ...data, previous_marriages: arr }); }} placeholder="YYYY" className="w-full bg-gray-50 border border-[#EFE9DF] rounded-lg px-2.5 h-[32px] text-[12px]" />
                    </div>
                  )}
                </div>
                {pm.marriage_status !== 'MARRIED' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#888174] uppercase mb-1">Reason for End</label>
                    <input type="text" value={pm.reason_for_end} onChange={e => { const arr = [...data.previous_marriages]; arr[index].reason_for_end = e.target.value; onChange({ ...data, previous_marriages: arr }); }} placeholder="Reason (Optional)" className="w-full bg-gray-50 border border-[#EFE9DF] rounded-lg px-2.5 h-[32px] text-[12px]" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ ...data, previous_marriages: [...(data.previous_marriages || []), { _tempId: crypto.randomUUID(), marriage_status: '', marriage_year: '', end_year: '', reason_for_end: '', children_count: '0', children_live_with_profile: 'NO' }] })}
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#064e3b]">
            <Plus size={14} /> Add Previous Marriage
          </button>
        </div>
      )}

      {data.marital_status && data.marital_status !== 'NEVER_MARRIED' && (
        <div className="space-y-4 pt-4 border-t border-[#EFE9DF] animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156] mb-2">Number of Children</label>
            <input type="text" value={data.number_of_children === '' ? '' : data.number_of_children} onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              onChange({ ...data, number_of_children: val ? Number(val) : '' });
            }} placeholder="0" className="w-[80px] bg-white border border-[#EFE9DF] rounded-xl px-3.5 py-2 text-[13px] focus:border-[#064e3b] focus:outline-none" />
          </div>

          {data.number_of_children !== '' && Number(data.number_of_children) > 0 && (
            <div className="space-y-3">
              <h4 className="text-[13px] font-bold text-[#1E1F22]">Children Details</h4>
              {data.children?.map((child, index) => (
                <div key={child._tempId} className="flex gap-2 items-center">
                  <SearchableSelect
                    value={child.gender}
                    onChange={v => { const arr = [...data.children]; arr[index].gender = v; onChange({ ...data, children: arr }); }}
                    options={[{ value: 'MALE', label: 'Son' }, { value: 'FEMALE', label: 'Daughter' }]}
                    placeholder="Gender"
                    className="bg-white border-[#EFE9DF] h-[36px] px-3 w-[110px] text-[12px] rounded-lg"
                  />
                  <input type="text" value={child.age} onChange={e => { const arr = [...data.children]; arr[index].age = e.target.value.replace(/[^0-9]/g, ''); onChange({ ...data, children: arr }); }} placeholder="Age" className="w-[70px] bg-white border border-[#EFE9DF] rounded-lg h-[36px] px-3 text-[12px] text-center" />
                  <SearchableSelect
                    value={child.living_with_profile}
                    onChange={v => { const arr = [...data.children]; arr[index].living_with_profile = v; onChange({ ...data, children: arr }); }}
                    options={[{ value: 'YES', label: 'Lives with me' }, { value: 'NO', label: 'Does not live with me' }]}
                    placeholder="Living With"
                    className="bg-white border-[#EFE9DF] h-[36px] px-3 w-[160px] text-[12px] rounded-lg"
                  />
                  <button type="button" onClick={() => onChange({ ...data, children: data.children.filter((_, i) => i !== index) })}
                    className="text-red-500 p-2 opacity-50 hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => onChange({ ...data, children: [...(data.children || []), { _tempId: crypto.randomUUID(), gender: '', age: '', living_with_profile: 'NO', additional_details: '' }] })}
                className="flex items-center gap-1.5 text-[12px] font-bold text-[#064e3b]">
                <Plus size={14} /> Add Child Record
              </button>
            </div>
          )}
        </div>
      )}


      {/* Nationality */}
      <div className="grid grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Nationality
          </label>
          <SearchableSelect
            value={data.nationality_country_id ? String(data.nationality_country_id) : ''}
            onChange={(val) => set('nationality_country_id', val ? Number(val) : '')}
            options={countries.map(c => ({ label: c.name_en, value: String(c.id) }))}
            placeholder="Select country"
            direction="up"
          />
          <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              checked={Boolean(data.multiple_nationality)}
              onChange={(e) => set('multiple_nationality', e.target.checked)}
              className="accent-[#064e3b] w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[12px] font-medium text-[#4E473D]">
              Multiple Nationality
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Mother Tongue
          </label>
          <SearchableSelect
            value={data.mother_tongue_id ? String(data.mother_tongue_id) : ''}
            onChange={(val) => set('mother_tongue_id', val ? Number(val) : '')}
            options={motherTongues.map(m => ({ label: m.name_en, value: String(m.id) }))}
            placeholder="Select language"
            direction="up"
          />
        </div>
      </div>
    </div>
  );
}
