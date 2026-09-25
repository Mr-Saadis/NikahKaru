'use client';

import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { PersonalInformation, ProfileGender, MaritalStatus } from '@/lib/types/database.types';

type Step1Data = {
  gender: ProfileGender | '';
  full_name: string;
  date_of_birth: string;
  marital_status: MaritalStatus | '';
  nationality_country_id: number | '';
  mother_tongue_id: number | '';
};

interface Step1Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

const MARITAL_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'NEVER_MARRIED', label: 'Never Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
  { value: 'SEPARATED', label: 'Separated' },
];

export type { Step1Data };

export default function Step1BasicInfo({ data, onChange }: Step1Props) {
  const { countries, motherTongues } = useReferenceData();

  const set = (field: keyof Step1Data, value: Step1Data[keyof Step1Data]) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Basic Information</h3>
        <p className="text-[12px] text-[#7D766C]">Enter the person's core identity details.</p>
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
              onClick={() => set('gender', g)}
              className={`flex-1 py-3 rounded-xl text-[13px] font-semibold border transition-all ${
                data.gender === g
                  ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm'
                  : 'bg-white border-[#E9E4DC] text-[#4E473D] hover:border-[#064e3b]/30 hover:bg-[#F7FAF8]'
              }`}
            >
              {g === 'MALE' ? '👨 Male' : '👩 Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
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

      {/* Date of Birth */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Date of Birth
        </label>
        <input
          type="date"
          value={data.date_of_birth}
          onChange={(e) => set('date_of_birth', e.target.value)}
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
        />
      </div>

      {/* Marital Status */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Marital Status <span className="text-red-500">*</span>
        </label>
        <select
          value={data.marital_status}
          onChange={(e) => set('marital_status', e.target.value as MaritalStatus)}
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
        >
          <option value="">Select marital status</option>
          {MARITAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Nationality */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Nationality
          </label>
          <select
            value={data.nationality_country_id}
            onChange={(e) => set('nationality_country_id', e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name_en}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Mother Tongue
          </label>
          <select
            value={data.mother_tongue_id}
            onChange={(e) => set('mother_tongue_id', e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
          >
            <option value="">Select language</option>
            {motherTongues.map((m) => (
              <option key={m.id} value={m.id}>{m.name_en}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
