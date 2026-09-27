'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

      <div className="grid grid-cols-2 gap-4">
        {/* Religion */}
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Religion
          </label>
          <Select
            value={data.religion_id ? String(data.religion_id) : undefined}
            onValueChange={(val) => {
              onChange({ ...data, religion_id: val ? Number(val) : '', sect_id: '' });
            }}
          >
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select religion" />
            </SelectTrigger>
            <SelectContent>
              {religions.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sect */}
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Fiqah / Sect
          </label>
          <Select
            value={data.sect_id ? String(data.sect_id) : undefined}
            onValueChange={(val) => set('sect_id', val ? Number(val) : '')}
            disabled={!data.religion_id || availableSects.length === 0}
          >
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none disabled:opacity-50">
              <SelectValue placeholder={!data.religion_id ? 'Select Religion first' : availableSects.length === 0 ? 'No sects defined' : 'Select sect'} />
            </SelectTrigger>
            <SelectContent>
              {availableSects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Caste */}
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Caste / Lineage
          </label>
          <Select
            value={data.caste_id ? String(data.caste_id) : undefined}
            onValueChange={(val) => set('caste_id', val ? Number(val) : '')}
          >
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select caste (optional)" />
            </SelectTrigger>
            <SelectContent>
              {castes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Other caste text */}
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156] truncate">
            Other Caste (if not listed)
          </label>
          <input
            type="text"
            value={data.other_caste_text}
            onChange={(e) => set('other_caste_text', e.target.value)}
            placeholder="Enter caste name"
            className="w-full h-[46px] bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}
