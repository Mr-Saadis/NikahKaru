'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

import type { YesNo, ReligiousPracticeLevel, SmokingStatus } from '@/lib/types/database.types';
import { useReferenceData } from '@/lib/hooks/useReferenceData';

type Step7Data = {
  beard: YesNo | '';
  hijab: YesNo | '';
  religious_practice: ReligiousPracticeLevel | '';
  smoking: SmokingStatus | '';
  other_lifestyle_information: string;
  willing_to_relocate: YesNo | '';
  preferred_country_id: number | '';
  preferred_province_id: number | '';
  preferred_city_id: number | '';
  relocation_details: string;
};

interface Step7Props {
  data: Step7Data;
  onChange: (data: Step7Data) => void;
  gender?: 'MALE' | 'FEMALE' | '';
}

export type { Step7Data };

function ToggleGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: React.ReactNode;
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T | '') => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition-all ${
              value === opt.value
                ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm'
                : 'bg-white border-[#E9E4DC] text-[#4E473D] hover:border-[#064e3b]/30'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Step7Lifestyle({ data, onChange, gender }: Step7Props) {
  const { countries, getProvincesByCountry, getCitiesByProvince } = useReferenceData();

  const set = (field: keyof Step7Data, value: Step7Data[keyof Step7Data]) =>
    onChange({ ...data, [field]: value });

  const prefProvinces = data.preferred_country_id ? getProvincesByCountry(Number(data.preferred_country_id)) : [];
  const prefCities = data.preferred_province_id ? getCitiesByProvince(Number(data.preferred_province_id)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Lifestyle</h3>
        <p className="text-[12px] text-[#7D766C]">Religious practice, personal habits, and relocation preferences.</p>
      </div>

      {/* Religious Practice */}
      <ToggleGroup
        label={<>Religious Practice Level <span className="text-red-500">*</span></>}
        value={data.religious_practice}
        onChange={(v) => set('religious_practice', v)}
        options={[
          { value: 'HIGHLY_PRACTICING', label: 'Highly Practicing' },
          { value: 'PRACTICING', label: 'Practicing' },
          { value: 'MODERATE', label: 'Moderate' },
          { value: 'OTHER', label: 'Other' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Smoking */}
        <div>
          <ToggleGroup
            label={<>Smoking <span className="text-red-500">*</span></>}
            value={data.smoking}
            onChange={(v) => set('smoking', v)}
            options={[
              { value: 'NO', label: 'No' },
              { value: 'YES', label: 'Yes' },
              { value: 'OCCASIONALLY', label: 'Occasionally' },
            ]}
          />
        </div>

        {/* Gender Specific */}
        <div>
          {gender === 'MALE' && (
            <ToggleGroup
              label="Beard"
              value={data.beard}
              onChange={(v) => set('beard', v)}
              options={[{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }]}
            />
          )}
          {gender === 'FEMALE' && (
            <ToggleGroup
              label="Hijab"
              value={data.hijab}
              onChange={(v) => set('hijab', v)}
              options={[{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }]}
            />
          )}
        </div>
      </div>

      {/* Other lifestyle */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Additional Lifestyle Information
        </label>
        <textarea
          rows={3}
          value={data.other_lifestyle_information}
          onChange={(e) => set('other_lifestyle_information', e.target.value)}
          placeholder="Any other relevant lifestyle details..."
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all resize-none"
        />
      </div>

      {/* Relocation */}
      <div className="space-y-4 pt-2 border-t border-[#F0EBE2]">
        <h4 className="text-[13px] font-bold text-[#232326]">Relocation Preferences</h4>

        <ToggleGroup
          label="Willing to Relocate?"
          value={data.willing_to_relocate}
          onChange={(v) => set('willing_to_relocate', v)}
          options={[{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }]}
        />

        {data.willing_to_relocate === 'YES' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Preferred Country</label>
              <SearchableSelect
                value={data.preferred_country_id ? String(data.preferred_country_id) : ''}
                onChange={(val) => onChange({ ...data, preferred_country_id: val && val !== 'none' ? Number(val) : '', preferred_province_id: '', preferred_city_id: '' })}
                options={[{ label: 'Any', value: 'none' }, ...countries.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                placeholder="Any"
                className="bg-white border-[#EFE9DF] h-[42px] px-3 py-2.5 text-[12px] rounded-xl"
                direction="up"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Province</label>
              <SearchableSelect
                value={data.preferred_province_id ? String(data.preferred_province_id) : ''}
                onChange={(val) => onChange({ ...data, preferred_province_id: val && val !== 'none' ? Number(val) : '', preferred_city_id: '' })}
                options={[{ label: 'Any', value: 'none' }, ...prefProvinces.map(p => ({ label: p.name_en, value: String(p.id) }))]}
                placeholder="Any"
                disabled={!prefProvinces.length}
                className="bg-white border-[#EFE9DF] h-[42px] px-3 py-2.5 text-[12px] rounded-xl"
                direction="up"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">City</label>
              <SearchableSelect
                value={data.preferred_city_id ? String(data.preferred_city_id) : ''}
                onChange={(val) => set('preferred_city_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...prefCities.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                placeholder="Any"
                disabled={!prefCities.length}
                className="bg-white border-[#EFE9DF] h-[42px] px-3 py-2.5 text-[12px] rounded-xl"
                direction="up"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
