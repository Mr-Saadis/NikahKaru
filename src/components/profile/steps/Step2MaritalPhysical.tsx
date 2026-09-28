'use client';

import type { PhysicalInformation } from '@/lib/types/database.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Step2Data = {
  height_cm: number | '';
  weight_kg: number | '';
  complexion: string;
  has_disability: boolean;
  disability_details: string;
};

interface Step2Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
}

export type { Step2Data };

const COMPLEXION_OPTIONS = [
  'Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Brown', 'Dark Brown', 'Dark',
];

export default function Step2MaritalPhysical({ data, onChange }: Step2Props) {
  const set = (field: keyof Step2Data, value: Step2Data[keyof Step2Data]) =>
    onChange({ ...data, [field]: value });

  // Compute feet and inches from height_cm
  const totalInches = data.height_cm ? Math.round(Number(data.height_cm) / 2.54) : 0;
  const currentFeet = data.height_cm ? Math.floor(totalInches / 12) : '';
  const currentInches = data.height_cm ? totalInches % 12 : '';

  const handleHeightChange = (feet: number | '', inches: number | '') => {
    if (feet === '' && inches === '') {
      set('height_cm', '');
      return;
    }
    const ft = feet === '' ? 0 : feet;
    const inc = inches === '' ? 0 : inches;
    const cm = Math.round((ft * 12 + inc) * 2.54);
    set('height_cm', cm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Physical Information</h3>
        <p className="text-[12px] text-[#7D766C]">Physical attributes of the person.</p>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Height <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                inputMode="numeric"
                value={currentFeet === '' ? '' : currentFeet}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  handleHeightChange(val ? Number(val) : '', currentInches);
                }}
                placeholder="Feet"
                className="w-full bg-white border border-[#EFE9DF] rounded-xl pl-4 pr-8 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#A8A296] pointer-events-none">ft</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                inputMode="numeric"
                value={currentInches === '' ? '' : currentInches}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  handleHeightChange(currentFeet, val ? Number(val) : '');
                }}
                placeholder="Inches"
                className="w-full bg-white border border-[#EFE9DF] rounded-xl pl-4 pr-8 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#A8A296] pointer-events-none">in</span>
            </div>
          </div>
          <p className="text-[10px] text-[#A8A296]">{data.height_cm ? `Saved as ${data.height_cm} cm` : 'Enter feet and inches'}</p>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
            Weight (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={data.weight_kg === '' ? '' : data.weight_kg}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              set('weight_kg', val ? Number(val) : '');
            }}
            placeholder="e.g. 65"
            className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
          />
          <p className="text-[10px] text-[#A8A296]">Range: 20–400 kg</p>
        </div>
      </div>

      {/* Complexion */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Complexion
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COMPLEXION_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set('complexion', data.complexion === c ? '' : c)}
              className={`py-2 px-3 rounded-xl text-[12px] font-medium border transition-all ${
                data.complexion === c
                  ? 'bg-[#064e3b] text-white border-[#064e3b]'
                  : 'bg-white border-[#E9E4DC] text-[#4E473D] hover:border-[#064e3b]/30'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Disability */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E9E4DC]">
          <div>
            <p className="text-[13px] font-semibold text-[#1E2022]">Has Disability?</p>
            <p className="text-[11px] text-[#7D766C] mt-0.5">Physical or health condition</p>
          </div>
          <button
            type="button"
            onClick={() => set('has_disability', !data.has_disability)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              data.has_disability ? 'bg-[#064e3b]' : 'bg-[#E9E4DC]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                data.has_disability ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {data.has_disability && (
          <div className="space-y-2">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
              Disability Details
            </label>
            <textarea
              value={data.disability_details}
              onChange={(e) => set('disability_details', e.target.value)}
              rows={3}
              placeholder="Describe the disability or health condition..."
              className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
