'use client';

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

      {/* Religion */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Religion
        </label>
        <select
          value={data.religion_id}
          onChange={(e) => {
            // Reset sect when religion changes
            onChange({ ...data, religion_id: e.target.value ? Number(e.target.value) : '', sect_id: '' });
          }}
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
        >
          <option value="">Select religion</option>
          {religions.map((r) => (
            <option key={r.id} value={r.id}>{r.name_en}</option>
          ))}
        </select>
      </div>

      {/* Sect — only visible if religion is selected */}
      {data.religion_id && (
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Sect / Denomination
          </label>
          {availableSects.length > 0 ? (
            <select
              value={data.sect_id}
              onChange={(e) => set('sect_id', e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
            >
              <option value="">Select sect</option>
              {availableSects.map((s) => (
                <option key={s.id} value={s.id}>{s.name_en}</option>
              ))}
            </select>
          ) : (
            <p className="text-[12px] text-[#A8A296] italic px-1">
              No sects defined for this religion.
            </p>
          )}
        </div>
      )}

      {/* Caste */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Caste / Lineage
        </label>
        <select
          value={data.caste_id}
          onChange={(e) => set('caste_id', e.target.value ? Number(e.target.value) : '')}
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
        >
          <option value="">Select caste (optional)</option>
          {castes.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>
      </div>

      {/* Other caste text */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Other Caste / Sub-caste (if not listed above)
        </label>
        <input
          type="text"
          value={data.other_caste_text}
          onChange={(e) => set('other_caste_text', e.target.value)}
          placeholder="Enter caste name if not in list"
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
        />
      </div>
    </div>
  );
}
