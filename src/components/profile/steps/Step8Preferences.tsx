'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

import type { PreferenceImportance, MaritalStatus, YesNo, ReligiousPracticeLevel, SmokingStatus, FamilySetup, LivingWith, EmploymentType } from '@/lib/types/database.types';
import { useReferenceData } from '@/lib/hooks/useReferenceData';

// ── Importance selector ──────────────────────────────────────
const IMPORTANCE_OPTS: { value: PreferenceImportance; label: string; color: string }[] = [
  { value: 'MANDATORY', label: 'Must Have', color: 'bg-white border-[#E5DFD3] text-[#064e3b] hover:bg-[#064e3b]/5 data-[active]:bg-[#064e3b] data-[active]:text-white data-[active]:border-[#064e3b]' },
  { value: 'HIGH', label: 'High', color: 'bg-white border-[#E5DFD3] text-[#C86A4A] hover:bg-[#C86A4A]/5 data-[active]:bg-[#C86A4A] data-[active]:text-white data-[active]:border-[#C86A4A]' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-white border-[#E5DFD3] text-[#D4AF37] hover:bg-[#D4AF37]/5 data-[active]:bg-[#D4AF37] data-[active]:text-white data-[active]:border-[#D4AF37]' },
  { value: 'LOW', label: 'Low', color: 'bg-white border-[#E5DFD3] text-[#A3B18A] hover:bg-[#A3B18A]/5 data-[active]:bg-[#A3B18A] data-[active]:text-white data-[active]:border-[#A3B18A]' },
];

const DOESNT_MATTER_VALUE = 'DOES_NOT_MATTER' as const;

function ImportanceRow({ label, value, onChange, hideMandatory }: {
  label: React.ReactNode;
  value: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  onChange: (v: PreferenceImportance | 'DOES_NOT_MATTER' | '') => void;
  hideMandatory?: boolean;
}) {
  const opts = hideMandatory ? IMPORTANCE_OPTS.filter(o => o.value !== 'MANDATORY') : IMPORTANCE_OPTS;
  const isDoesntMatter = value === DOESNT_MATTER_VALUE;
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1">{label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          data-active={isDoesntMatter ? '' : undefined}
          onClick={() => onChange(isDoesntMatter ? '' : DOESNT_MATTER_VALUE)}
          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-all bg-white border-[#E5DFD3] text-[#8A968C] hover:bg-[#8A968C]/5 data-[active]:bg-[#8A968C] data-[active]:text-white data-[active]:border-[#8A968C]`}
        >
          Doesn&apos;t Matter
        </button>
        {opts.map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-active={value === opt.value ? '' : undefined}
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-all ${opt.color}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeRow({ label, minVal, maxVal, onMin, onMax, suffix = '' }: {
  label: React.ReactNode; minVal: number | ''; maxVal: number | '';
  onMin: (v: number | '') => void; onMax: (v: number | '') => void;
  suffix?: string;
}) {
  const inputClass = "w-28 h-[40px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-3 py-1.5 text-[12px] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none";
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <input type="text" inputMode="numeric" value={minVal === '' ? '' : minVal} onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          onMin(val ? Number(val) : '');
        }} placeholder="Min" className={inputClass} />
        <span className="text-[11px] text-[#888174]">—</span>
        <input type="text" inputMode="numeric" value={maxVal === '' ? '' : maxVal} onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          onMax(val ? Number(val) : '');
        }} placeholder="Max" className={inputClass} />
        {suffix && <span className="text-[11px] text-[#888174]">{suffix}</span>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FAF8F5] rounded-[22px] border border-[#E9E4DC]">
      <div className="px-5 py-3 border-b border-[#EFE9DF] bg-white rounded-t-[22px]">
        <h4 className="text-[12.5px] font-bold text-[#232326]">{title}</h4>
      </div>
      <div className="px-5 divide-y divide-[#F0EBE2]">{children}</div>
    </div>
  );
}

function HeightRangeRow({ label, minCm, maxCm, onMin, onMax }: {
  label: React.ReactNode; minCm: number | ''; maxCm: number | '';
  onMin: (v: number | '') => void; onMax: (v: number | '') => void;
}) {
  const inputClass = "w-[60px] h-[40px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-2 py-1.5 text-[12px] text-center focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none";

  const parseCm = (cm: number | '') => {
    if (!cm) return { ft: '', in: '' };
    const totalInches = Math.round(cm / 2.54);
    return { ft: Math.floor(totalInches / 12), in: totalInches % 12 };
  };

  const min = parseCm(minCm);
  const max = parseCm(maxCm);

  const handleChange = (type: 'min' | 'max', field: 'ft' | 'in', val: string) => {
    const current = type === 'min' ? min : max;
    const update = { ...current, [field]: val ? Number(val) : '' };

    if (update.ft === '' && update.in === '') {
      type === 'min' ? onMin('') : onMax('');
      return;
    }
    const ft = update.ft === '' ? 0 : Number(update.ft);
    const inc = update.in === '' ? 0 : Number(update.in);
    const cm = Math.round((ft * 12 + inc) * 2.54);
    type === 'min' ? onMin(cm) : onMax(cm);
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1">
          <input type="text" inputMode="numeric" value={min.ft === '' ? '' : min.ft} onChange={e => handleChange('min', 'ft', e.target.value.replace(/[^0-9]/g, ''))} placeholder="ft" className={inputClass} />
          <span className="text-[11px] text-[#888174]">'</span>
          <input type="text" inputMode="numeric" value={min.in === '' ? '' : min.in} onChange={e => handleChange('min', 'in', e.target.value.replace(/[^0-9]/g, ''))} placeholder="in" className={inputClass} />
          <span className="text-[11px] text-[#888174]">"</span>
        </div>
        <span className="text-[11px] text-[#888174] mx-1">—</span>
        <div className="flex items-center gap-1">
          <input type="text" inputMode="numeric" value={max.ft === '' ? '' : max.ft} onChange={e => handleChange('max', 'ft', e.target.value.replace(/[^0-9]/g, ''))} placeholder="ft" className={inputClass} />
          <span className="text-[11px] text-[#888174]">'</span>
          <input type="text" inputMode="numeric" value={max.in === '' ? '' : max.in} onChange={e => handleChange('max', 'in', e.target.value.replace(/[^0-9]/g, ''))} placeholder="in" className={inputClass} />
          <span className="text-[11px] text-[#888174]">"</span>
        </div>
      </div>
    </div>
  );
}

export type Step8Data = {
  // Basic
  pref_min_age: number | '';
  pref_max_age: number | '';
  pref_age_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_marital_status: MaritalStatus | '';
  pref_marital_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_children_allowed: YesNo | '';
  pref_children_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  
  // Physical
  pref_min_height: number | '';
  pref_max_height: number | '';
  pref_height_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_min_weight: number | '';
  pref_max_weight: number | '';
  pref_weight_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_complexion: string;
  pref_complexion_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_disability_allowed: YesNo | '';
  pref_disability_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_beard: YesNo | '';
  pref_beard_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_hijab: YesNo | '';
  pref_hijab_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';

  // Education
  pref_education_level_id: number | '';
  pref_education_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_field_of_study: string;
  pref_field_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';

  // Profession
  pref_occupation_id: number | '';
  pref_occupation_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_employment_type: string;
  pref_employment_type_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_min_income: number | '';
  pref_max_income: number | '';
  pref_income_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';

  // Religion
  pref_religion_id: number | '';
  pref_religion_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_sect_id: number | '';
  pref_sect_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_caste_id: number | '';
  pref_caste_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_religious_practice: ReligiousPracticeLevel | '';
  pref_religious_practice_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';

  // Location
  pref_location_country_id: number | '';
  pref_location_country_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_location_province_id: number | '';
  pref_location_province_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_location_city_id: number | '';
  pref_location_city_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';

  // Family
  pref_family_setup: FamilySetup | '';
  pref_family_setup_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_living_with: LivingWith | '';
  pref_living_with_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_parents_status: string;
  pref_parents_status_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';

  // Lifestyle
  pref_smoking: SmokingStatus | '';
  pref_smoking_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_additional_lifestyle: string;
  
  // Relocation
  pref_willing_to_relocate_required: YesNo | '';
  pref_relocation_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_relocate_country_id: number | '';
  pref_relocate_province_id: number | '';
  pref_relocate_city_id: number | '';
};

interface Step8Props {
  data: Step8Data;
  onChange: (data: Step8Data) => void;
}

export default function Step8Preferences({ data, onChange }: Step8Props) {
  const { religions, castes, countries, provinces, cities, getSectsByReligion, educationLevels, occupations } = useReferenceData();
  const availableSects = data.pref_religion_id ? getSectsByReligion(Number(data.pref_religion_id)) : [];
  
  const locProvinces = data.pref_location_country_id ? provinces.filter(p => p.country_id === data.pref_location_country_id) : [];
  const locCities = data.pref_location_province_id ? cities.filter(c => c.province_id === data.pref_location_province_id) : (data.pref_location_country_id ? cities.filter(c => c.country_id === data.pref_location_country_id) : []);

  const relProvinces = data.pref_relocate_country_id ? provinces.filter(p => p.country_id === data.pref_relocate_country_id) : [];
  const relCities = data.pref_relocate_province_id ? cities.filter(c => c.province_id === data.pref_relocate_province_id) : (data.pref_relocate_country_id ? cities.filter(c => c.country_id === data.pref_relocate_country_id) : []);

  const set = (field: keyof Step8Data, value: Step8Data[keyof Step8Data]) =>
    onChange({ ...data, [field]: value });

  const handleImportanceChange = (
    field: keyof Step8Data, 
    value: PreferenceImportance | 'DOES_NOT_MATTER' | '', 
    clearFields: (keyof Step8Data)[]
  ) => {
    if (value === DOESNT_MATTER_VALUE) {
      const updates = { [field]: value } as any;
      clearFields.forEach(f => updates[f] = '');
      onChange({ ...data, ...updates });
    } else {
      set(field, value as any);
    }
  };

  const selectClass = "bg-white border border-[#EFE9DF] rounded-lg px-3 py-1.5 text-[12px] focus:border-[#064e3b] focus:outline-none min-w-[120px]";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Partner Preferences</h3>
        <p className="text-[12px] text-[#7D766C]">Define desired partner criteria and their importance level.</p>
      </div>

      {/* Basic */}
      <SectionCard title="Age & Marital Status">
        <ImportanceRow label={<>Age Importance <span className="text-red-500">*</span></>} value={data.pref_age_importance} onChange={(v) => handleImportanceChange('pref_age_importance', v, ['pref_min_age', 'pref_max_age'])} />
        {data.pref_age_importance !== DOESNT_MATTER_VALUE && (
          <RangeRow label={<>Age Range <span className="text-red-500">*</span></>} minVal={data.pref_min_age} maxVal={data.pref_max_age}
            onMin={(v) => set('pref_min_age', v)} onMax={(v) => set('pref_max_age', v)} suffix="yrs" />
        )}

        <ImportanceRow label={<>Marital Status Importance <span className="text-red-500">*</span></>} value={data.pref_marital_importance} onChange={(v) => handleImportanceChange('pref_marital_importance', v, ['pref_marital_status', 'pref_children_allowed', 'pref_children_importance'])} />
        {data.pref_marital_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Marital Status <span className="text-red-500">*</span></span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_marital_status || ''}
                onChange={(val) => {
                  const newStatus = val as MaritalStatus;
                  const needsChildren = ['DIVORCED', 'WIDOWED', 'SEPARATED'].includes(newStatus);
                  onChange({
                    ...data,
                    pref_marital_status: newStatus,
                    ...(!needsChildren ? { pref_children_allowed: '', pref_children_importance: '' } : {})
                  });
                }}
                options={[{ label: 'Any', value: 'none' }, ...['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'].map(s => ({ label: s.replace(/_/g, ' '), value: s }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}

        {data.pref_marital_importance !== DOESNT_MATTER_VALUE && ['DIVORCED', 'WIDOWED', 'SEPARATED'].includes(data.pref_marital_status as string) && (
          <>
            <ImportanceRow label={<>Children Importance <span className="text-red-500">*</span></>} value={data.pref_children_importance} onChange={(v) => handleImportanceChange('pref_children_importance', v, ['pref_children_allowed'])} />
            {data.pref_children_importance !== DOESNT_MATTER_VALUE && (
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="text-[12px] font-medium text-[#4E473D] flex-1">Children Allowed <span className="text-red-500">*</span></span>
                <div className="flex gap-1.5">
                  {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => set('pref_children_allowed', data.pref_children_allowed === v ? '' : v as YesNo)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_children_allowed === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* Physical */}
      <SectionCard title="Physical">
        <ImportanceRow label={<>Height Importance <span className="text-red-500">*</span></>} value={data.pref_height_importance} onChange={(v) => handleImportanceChange('pref_height_importance', v, ['pref_min_height', 'pref_max_height'])} />
        {data.pref_height_importance !== DOESNT_MATTER_VALUE && (
          <HeightRangeRow label={<>Height <span className="text-red-500">*</span></>} minCm={data.pref_min_height} maxCm={data.pref_max_height}
            onMin={(v) => set('pref_min_height', v)} onMax={(v) => set('pref_max_height', v)} />
        )}
        
        <ImportanceRow label={<>Weight Importance</>} value={data.pref_weight_importance} onChange={(v) => handleImportanceChange('pref_weight_importance', v, ['pref_min_weight', 'pref_max_weight'])} />
        {data.pref_weight_importance !== DOESNT_MATTER_VALUE && (
          <RangeRow label={<>Weight Range</>} minVal={data.pref_min_weight} maxVal={data.pref_max_weight}
            onMin={(v) => set('pref_min_weight', v)} onMax={(v) => set('pref_max_weight', v)} suffix="kg" />
        )}

        <ImportanceRow label={<>Complexion Importance</>} value={data.pref_complexion_importance} onChange={(v) => handleImportanceChange('pref_complexion_importance', v, ['pref_complexion'])} />
        {data.pref_complexion_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Complexion</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_complexion || ''}
                onChange={(val) => set('pref_complexion', val)}
                options={['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Brown', 'Dark Brown', 'Dark'].map(c => ({ label: c, value: c }))}
                placeholder="Select Complexion"
                className=""
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label={<>Disability Importance <span className="text-red-500">*</span></>} value={data.pref_disability_importance} onChange={(v) => handleImportanceChange('pref_disability_importance', v, ['pref_disability_allowed'])} />
        {data.pref_disability_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Disability Allowed <span className="text-red-500">*</span></span>
            <div className="flex gap-1.5">
              {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('pref_disability_allowed', data.pref_disability_allowed === v ? '' : v as YesNo)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_disability_allowed === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
              ))}
            </div>
          </div>
        )}
        
        <ImportanceRow label={<>Beard Preference Importance</>} value={data.pref_beard_importance} onChange={(v) => handleImportanceChange('pref_beard_importance', v, ['pref_beard'])} />
        {data.pref_beard_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Beard Required?</span>
            <div className="flex gap-1.5">
              {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('pref_beard', data.pref_beard === v ? '' : v as YesNo)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_beard === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
              ))}
            </div>
          </div>
        )}
        
        <ImportanceRow label={<>Hijab Preference Importance</>} value={data.pref_hijab_importance} onChange={(v) => handleImportanceChange('pref_hijab_importance', v, ['pref_hijab'])} />
        {data.pref_hijab_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Hijab Required?</span>
            <div className="flex gap-1.5">
              {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('pref_hijab', data.pref_hijab === v ? '' : v as YesNo)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_hijab === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Education */}
      <SectionCard title="Education">
        <ImportanceRow label="Education Level Importance" value={data.pref_education_importance} onChange={(v) => handleImportanceChange('pref_education_importance', v, ['pref_education_level_id'])} />
        {data.pref_education_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Minimum Education</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_education_level_id ? String(data.pref_education_level_id) : ''}
                onChange={(val) => set('pref_education_level_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...educationLevels.map(e => ({ label: e.name_en, value: String(e.id) }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
        <ImportanceRow label="Field of Study Importance" value={data.pref_field_importance} onChange={(v) => handleImportanceChange('pref_field_importance', v, ['pref_field_of_study'])} />
        {data.pref_field_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Field</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_field_of_study || ''}
                onChange={(val) => set('pref_field_of_study', val)}
                options={['Computer Science', 'Engineering', 'Medicine', 'Business/Commerce', 'Arts/Humanities', 'Science', 'Law', 'Other'].map(f => ({ label: f, value: f }))}
                placeholder="Select Field of Study"
                className=""
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Profession */}
      <SectionCard title="Profession & Income">
        <ImportanceRow label="Occupation Importance" value={data.pref_occupation_importance} onChange={(v) => handleImportanceChange('pref_occupation_importance', v, ['pref_occupation_id'])} />
        {data.pref_occupation_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Occupation</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_occupation_id ? String(data.pref_occupation_id) : ''}
                onChange={(val) => set('pref_occupation_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...occupations.map(o => ({ label: o.name_en, value: String(o.id) }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label="Employment Type Importance" value={data.pref_employment_type_importance} onChange={(v) => handleImportanceChange('pref_employment_type_importance', v, ['pref_employment_type'])} />
        {data.pref_employment_type_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Employment Type</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_employment_type || ''}
                onChange={(val) => set('pref_employment_type', val === 'none' ? '' : val)}
                options={[{ label: 'Any', value: 'none' }, ...['GOVERNMENT', 'PRIVATE', 'BUSINESS', 'SELF_EMPLOYED', 'FREELANCER'].map(s => ({ label: s.replace(/_/g, ' '), value: s }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label={<>Income Importance</>} value={data.pref_income_importance} onChange={(v) => handleImportanceChange('pref_income_importance', v, ['pref_min_income', 'pref_max_income'])} />
        {data.pref_income_importance !== DOESNT_MATTER_VALUE && (
          <RangeRow label={<>Monthly Income (PKR)</>} minVal={data.pref_min_income} maxVal={data.pref_max_income}
            onMin={(v) => set('pref_min_income', v)} onMax={(v) => set('pref_max_income', v)} />
        )}
      </SectionCard>

      {/* Religion & Culture */}
      <SectionCard title="Religion & Culture">
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Religion</span>
          <div className="w-[220px]">
            <SearchableSelect
              value={data.pref_religion_id ? String(data.pref_religion_id) : ''}
              onChange={(val) => onChange({ ...data, pref_religion_id: val && val !== 'none' ? Number(val) : '', pref_sect_id: '' })}
              options={[{ label: 'Any', value: 'none' }, ...religions.map(r => ({ label: r.name_en, value: String(r.id) }))]}
              placeholder="Any"
              className="bg-gray-50 border-[#EFE9DF] h-[32px] px-3 py-1.5 text-[12px] rounded-lg cursor-not-allowed opacity-70"
              disabled={true}
            />
          </div>
        </div>
        {availableSects.length > 0 && (
          <>
            <ImportanceRow label="Sect Importance" value={data.pref_sect_importance} onChange={(v) => handleImportanceChange('pref_sect_importance', v, ['pref_sect_id'])} />
            {data.pref_sect_importance !== DOESNT_MATTER_VALUE && (
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="text-[12px] font-medium text-[#4E473D] flex-1">Sect</span>
                <div className="w-[220px]">
                  <SearchableSelect
                    value={data.pref_sect_id ? String(data.pref_sect_id) : ''}
                    onChange={(val) => set('pref_sect_id', val && val !== 'none' ? Number(val) : '')}
                    options={[{ label: 'Any', value: 'none' }, ...availableSects.map(s => ({ label: s.name_en, value: String(s.id) }))]}
                    placeholder="Any"
                    className=""
                  />
                </div>
              </div>
            )}
          </>
        )}
        <ImportanceRow label={<>Caste Importance <span className="text-red-500">*</span></>} value={data.pref_caste_importance} onChange={(v) => handleImportanceChange('pref_caste_importance', v, ['pref_caste_id'])} />
        {data.pref_caste_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Caste <span className="text-red-500">*</span></span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_caste_id ? String(data.pref_caste_id) : ''}
                onChange={(val) => set('pref_caste_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...castes.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
        <ImportanceRow label={<>Practice Importance <span className="text-red-500">*</span></>} value={data.pref_religious_practice_importance} onChange={(v) => handleImportanceChange('pref_religious_practice_importance', v, ['pref_religious_practice'])} />
        {data.pref_religious_practice_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Religious Practice <span className="text-red-500">*</span></span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_religious_practice || ''}
                onChange={(val) => set('pref_religious_practice', val as ReligiousPracticeLevel)}
                options={[{ label: 'Any', value: 'none' }, ...['HIGHLY_PRACTICING', 'PRACTICING', 'MODERATE', 'OTHER'].map(v => ({ label: v.replace(/_/g, ' '), value: v }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Location */}
      <SectionCard title="Location">
        <ImportanceRow label={<>Country Importance <span className="text-red-500">*</span></>} value={data.pref_location_country_importance} onChange={(v) => handleImportanceChange('pref_location_country_importance', v, ['pref_location_country_id'])} />
        {data.pref_location_country_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Country <span className="text-red-500">*</span></span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_location_country_id ? String(data.pref_location_country_id) : ''}
                onChange={(val) => set('pref_location_country_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...countries.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label={<>Province Importance</>} value={data.pref_location_province_importance} onChange={(v) => handleImportanceChange('pref_location_province_importance', v, ['pref_location_province_id'])} />
        {data.pref_location_province_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Province</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_location_province_id ? String(data.pref_location_province_id) : ''}
                onChange={(val) => set('pref_location_province_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...locProvinces.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}

        <ImportanceRow label={<>City Importance</>} value={data.pref_location_city_importance} onChange={(v) => handleImportanceChange('pref_location_city_importance', v, ['pref_location_city_id'])} />
        {data.pref_location_city_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred City</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_location_city_id ? String(data.pref_location_city_id) : ''}
                onChange={(val) => set('pref_location_city_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...locCities.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Relocation */}
      <SectionCard title="Relocation Preferences">
        <ImportanceRow label="Relocation Importance" value={data.pref_relocation_importance} onChange={(v) => handleImportanceChange('pref_relocation_importance', v, ['pref_willing_to_relocate_required', 'pref_relocate_country_id', 'pref_relocate_province_id', 'pref_relocate_city_id'])} />
        {data.pref_relocation_importance !== DOESNT_MATTER_VALUE && (
          <>
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">Must be willing to relocate?</span>
              <div className="flex gap-1.5">
                {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('pref_willing_to_relocate_required', data.pref_willing_to_relocate_required === v ? '' : v as YesNo)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_willing_to_relocate_required === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">To Country</span>
              <div className="w-[220px]">
                <SearchableSelect
                  value={data.pref_relocate_country_id ? String(data.pref_relocate_country_id) : ''}
                  onChange={(val) => set('pref_relocate_country_id', val && val !== 'none' ? Number(val) : '')}
                  options={[{ label: 'Any', value: 'none' }, ...countries.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                  placeholder="Any"
                  className=""
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">To Province</span>
              <div className="w-[220px]">
                <SearchableSelect
                  value={data.pref_relocate_province_id ? String(data.pref_relocate_province_id) : ''}
                  onChange={(val) => set('pref_relocate_province_id', val && val !== 'none' ? Number(val) : '')}
                  options={[{ label: 'Any', value: 'none' }, ...relProvinces.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                  placeholder="Any"
                  className=""
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">To City</span>
              <div className="w-[220px]">
                <SearchableSelect
                  value={data.pref_relocate_city_id ? String(data.pref_relocate_city_id) : ''}
                  onChange={(val) => set('pref_relocate_city_id', val && val !== 'none' ? Number(val) : '')}
                  options={[{ label: 'Any', value: 'none' }, ...relCities.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                  placeholder="Any"
                  className=""
                />
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* Family */}
      <SectionCard title="Family Preferences">
        <ImportanceRow label={<>Family Setup Importance <span className="text-red-500">*</span></>} value={data.pref_family_setup_importance} onChange={(v) => handleImportanceChange('pref_family_setup_importance', v, ['pref_family_setup'])} />
        {data.pref_family_setup_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Family Setup <span className="text-red-500">*</span></span>
            <div className="flex gap-1.5">
              {[['JOINT', 'Joint'], ['SEPARATE', 'Separate']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('pref_family_setup', data.pref_family_setup === v ? '' : v as FamilySetup)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_family_setup === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
              ))}
            </div>
          </div>
        )}
        
        <ImportanceRow label="Living With Importance" value={data.pref_living_with_importance} onChange={(v) => handleImportanceChange('pref_living_with_importance', v, ['pref_living_with'])} />
        {data.pref_living_with_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Living With</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_living_with || ''}
                onChange={(val) => set('pref_living_with', val === 'none' ? '' : val as LivingWith)}
                options={[{ label: 'Any', value: 'none' }, ...['PARENTS', 'FATHER', 'MOTHER', 'SIBLINGS', 'ALONE', 'OTHER'].map(s => ({ label: s.replace(/_/g, ' '), value: s }))]}
                placeholder="Any"
                className=""
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label="Parents Status Importance" value={data.pref_parents_status_importance} onChange={(v) => handleImportanceChange('pref_parents_status_importance', v, ['pref_parents_status'])} />
        {data.pref_parents_status_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Parents Status</span>
            <div className="w-[220px]">
              <SearchableSelect
                value={data.pref_parents_status || ''}
                onChange={(val) => set('pref_parents_status', val)}
                options={['Both Alive', 'Father Deceased', 'Mother Deceased', 'Both Deceased'].map(s => ({ label: s, value: s }))}
                placeholder="Select Parents Status"
                className=""
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Lifestyle pref */}
      <SectionCard title="Lifestyle">
        <ImportanceRow label={<>Smoking Importance <span className="text-red-500">*</span></>} value={data.pref_smoking_importance} onChange={(v) => handleImportanceChange('pref_smoking_importance', v, ['pref_smoking'])} />
        {data.pref_smoking_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Smoking Preference <span className="text-red-500">*</span></span>
            <div className="flex gap-1.5">
              {[['NO', 'Non-smoker'], ['YES', 'Smoker'], ['OCCASIONALLY', 'Occasional']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('pref_smoking', data.pref_smoking === v ? '' : v as SmokingStatus)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_smoking === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
              ))}
            </div>
          </div>
        )}
        

      </SectionCard>
    </div>
  );
}
