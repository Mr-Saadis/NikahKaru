'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { useReferenceData } from '@/lib/hooks/useReferenceData';

type Step4Data = {
  religion_id: number | '';
  sect_id: number | '';
  caste_id: number | '';
  other_caste_text: string;
};

interface Step4Props {
  data: Step4Data;
  onChange: (data: Step4Data) => void;
}

export type { Step4Data };

export default function Step4ReligionCulture({ data, onChange }: Step4Props) {
  const { religions, castes, getSectsByReligion } = useReferenceData();

  const availableSects = data.religion_id ? getSectsByReligion(Number(data.religion_id)) : [];

  const set = (field: keyof Step4Data, value: Step4Data[keyof Step4Data]) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Religion & Culture</h3>
        <p className="text-[12px] text-[#7D766C]">Religious and cultural background details.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 lg:gap-12">
        {/* Religion */}
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Religion <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            value={data.religion_id ? String(data.religion_id) : ''}
            onChange={(val) => onChange({ ...data, religion_id: val ? Number(val) : '', sect_id: '' })}
            options={religions.map(r => ({ label: r.name_en, value: String(r.id) }))}
            placeholder="Select religion"
            className=""
            disabled={true}
          />
        </div>

        {/* Sect */}
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Fiqah / Sect <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            value={data.sect_id ? String(data.sect_id) : ''}
            onChange={(val) => set('sect_id', val ? Number(val) : '')}
            options={availableSects.map(s => ({ label: s.name_en, value: String(s.id) }))}
            placeholder={!data.religion_id ? 'Select Religion first' : availableSects.length === 0 ? 'No sects defined' : 'Select sect'}
            disabled={!data.religion_id || availableSects.length === 0}
            className=""
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 lg:gap-12">
        {/* Caste */}
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Caste / Lineage <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            value={data.caste_id ? String(data.caste_id) : ''}
            onChange={(val) => set('caste_id', val ? Number(val) : '')}
            options={castes.map(c => ({ label: c.name_en, value: String(c.id) }))}
            placeholder="Select caste (optional)"
            className=""
          />
        </div>

        {/* Other caste text */}
        {!data.caste_id && (
          <div className="space-y-2">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156] truncate">
              Other Caste (if not listed) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={data.other_caste_text}
              onChange={(e) => set('other_caste_text', e.target.value)}
              placeholder="Enter caste name"
              className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
