'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

import type { PreferenceImportance, MaritalStatus, YesNo, ReligiousPracticeLevel, SmokingStatus, FamilySetup, LivingWith } from '@/lib/types/database.types';
import { useReferenceData } from '@/lib/hooks/useReferenceData';

// ── Importance selector ──────────────────────────────────────
const IMPORTANCE_OPTS: { value: PreferenceImportance; label: string; color: string }[] = [
  { value: 'MANDATORY', label: 'Must Have', color: 'bg-red-50 border-red-200 text-red-700 data-[active]:bg-red-600 data-[active]:text-white data-[active]:border-red-600' },
  { value: 'HIGH',      label: 'High',      color: 'bg-amber-50 border-amber-200 text-amber-700 data-[active]:bg-amber-500 data-[active]:text-white data-[active]:border-amber-500' },
  { value: 'MEDIUM',    label: 'Medium',    color: 'bg-blue-50 border-blue-200 text-blue-700 data-[active]:bg-blue-500 data-[active]:text-white data-[active]:border-blue-500' },
  { value: 'LOW',       label: 'Low',       color: 'bg-[#F4EFE7] border-[#E9E2D4] text-[#696256] data-[active]:bg-[#16382E] data-[active]:text-white data-[active]:border-[#16382E]' },
];

function ImportanceRow({ label, value, onChange }: {
  label: string;
  value: PreferenceImportance | '';
  onChange: (v: PreferenceImportance | '') => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1">{label}</span>
      <div className="flex gap-1">
        {IMPORTANCE_OPTS.map((opt) => (
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
  label: string; minVal: number | ''; maxVal: number | '';
  onMin: (v: number | '') => void; onMax: (v: number | '') => void;
  suffix?: string;
}) {
  const inputClass = "w-24 bg-white border border-[#EFE9DF] rounded-lg px-2.5 py-1.5 text-[12px] focus:border-[#064e3b] focus:outline-none";
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <input type="number" value={minVal} onChange={(e) => onMin(e.target.value ? Number(e.target.value) : '')} placeholder="Min" className={inputClass} />
        <span className="text-[11px] text-[#888174]">—</span>
        <input type="number" value={maxVal} onChange={(e) => onMax(e.target.value ? Number(e.target.value) : '')} placeholder="Max" className={inputClass} />
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
  label: string; minCm: number | ''; maxCm: number | '';
  onMin: (v: number | '') => void; onMax: (v: number | '') => void;
}) {
  const inputClass = "w-[42px] bg-white border border-[#EFE9DF] rounded-lg px-1.5 py-1.5 text-[12px] text-center focus:border-[#064e3b] focus:outline-none";
  
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
        {/* Min */}
        <div className="flex items-center gap-1">
          <input type="number" value={min.ft} onChange={e => handleChange('min', 'ft', e.target.value)} placeholder="ft" className={inputClass} />
          <span className="text-[11px] text-[#888174]">'</span>
          <input type="number" value={min.in} onChange={e => handleChange('min', 'in', e.target.value)} placeholder="in" className={inputClass} />
          <span className="text-[11px] text-[#888174]">"</span>
        </div>
        <span className="text-[11px] text-[#888174] mx-1">—</span>
        {/* Max */}
        <div className="flex items-center gap-1">
          <input type="number" value={max.ft} onChange={e => handleChange('max', 'ft', e.target.value)} placeholder="ft" className={inputClass} />
          <span className="text-[11px] text-[#888174]">'</span>
          <input type="number" value={max.in} onChange={e => handleChange('max', 'in', e.target.value)} placeholder="in" className={inputClass} />
          <span className="text-[11px] text-[#888174]">"</span>
        </div>
      </div>
    </div>
  );
}

export type Step8Data = {
  pref_min_age: number | '';
  pref_max_age: number | '';
  pref_age_importance: PreferenceImportance | '';
  pref_marital_status: MaritalStatus | '';
  pref_marital_importance: PreferenceImportance | '';
  pref_children_allowed: YesNo | '';
  pref_children_importance: PreferenceImportance | '';
  pref_min_height: number | '';
  pref_max_height: number | '';
  pref_height_importance: PreferenceImportance | '';
  pref_disability_allowed: YesNo | '';
  pref_disability_importance: PreferenceImportance | '';
  pref_religion_id: number | '';
  pref_religion_importance: PreferenceImportance | '';
  pref_sect_id: number | '';
  pref_sect_importance: PreferenceImportance | '';
  pref_caste_id: number | '';
  pref_caste_importance: PreferenceImportance | '';
  pref_religious_practice: ReligiousPracticeLevel | '';
  pref_religious_practice_importance: PreferenceImportance | '';
  pref_min_income: number | '';
  pref_max_income: number | '';
  pref_income_importance: PreferenceImportance | '';
  pref_location_country_id: number | '';
  pref_location_importance: PreferenceImportance | '';
  pref_family_setup: FamilySetup | '';
  pref_family_setup_importance: PreferenceImportance | '';
  pref_smoking: SmokingStatus | '';
  pref_smoking_importance: PreferenceImportance | '';
};

interface Step8Props {
  data: Step8Data;
  onChange: (data: Step8Data) => void;
}

export default function Step8Preferences({ data, onChange }: Step8Props) {
  const { religions, castes, countries, getSectsByReligion } = useReferenceData();
  const availableSects = data.pref_religion_id ? getSectsByReligion(Number(data.pref_religion_id)) : [];

  const set = (field: keyof Step8Data, value: Step8Data[keyof Step8Data]) =>
    onChange({ ...data, [field]: value });

  const selectClass = "bg-white border border-[#EFE9DF] rounded-lg px-3 py-1.5 text-[12px] focus:border-[#064e3b] focus:outline-none min-w-[120px]";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Partner Preferences</h3>
        <p className="text-[12px] text-[#7D766C]">Define desired partner criteria and their importance level.</p>
      </div>

      {/* Basic */}
      <SectionCard title="Age & Marital Status">
        <RangeRow label="Age Range" minVal={data.pref_min_age} maxVal={data.pref_max_age}
          onMin={(v) => set('pref_min_age', v)} onMax={(v) => set('pref_max_age', v)} suffix="yrs" />
        <ImportanceRow label="Age Importance" value={data.pref_age_importance} onChange={(v) => set('pref_age_importance', v)} />
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Marital Status</span>
          <div className="w-[160px]">
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
              options={[{ label: 'Any', value: 'none' }, ...['NEVER_MARRIED','DIVORCED','WIDOWED','SEPARATED'].map(s => ({ label: s.replace(/_/g,' '), value: s }))]}
              placeholder="Any"
              className="bg-white border-[#EFE9DF] h-[32px] px-3 py-1.5 text-[12px] rounded-lg"
            />
          </div>
        </div>
        <ImportanceRow label="Marital Status Importance" value={data.pref_marital_importance} onChange={(v) => set('pref_marital_importance', v)} />
        
        {['DIVORCED', 'WIDOWED', 'SEPARATED'].includes(data.pref_marital_status as string) && (
          <>
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">Children Allowed</span>
              <div className="flex gap-1.5">
                {[['YES','Yes'],['NO','No']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => set('pref_children_allowed', data.pref_children_allowed === v ? '' : v as YesNo)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_children_allowed === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
                ))}
              </div>
            </div>
            <ImportanceRow label="Children Importance" value={data.pref_children_importance} onChange={(v) => set('pref_children_importance', v)} />
          </>
        )}
      </SectionCard>

      {/* Physical */}
      <SectionCard title="Physical">
        <HeightRangeRow label="Height" minCm={data.pref_min_height} maxCm={data.pref_max_height}
          onMin={(v) => set('pref_min_height', v)} onMax={(v) => set('pref_max_height', v)} />
        <ImportanceRow label="Height Importance" value={data.pref_height_importance} onChange={(v) => set('pref_height_importance', v)} />
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Disability Allowed</span>
          <div className="flex gap-1.5">
            {[['YES','Yes'],['NO','No']].map(([v,l]) => (
              <button key={v} type="button" onClick={() => set('pref_disability_allowed', data.pref_disability_allowed === v ? '' : v as YesNo)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_disability_allowed === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
            ))}
          </div>
        </div>
        <ImportanceRow label="Disability Importance" value={data.pref_disability_importance} onChange={(v) => set('pref_disability_importance', v)} />
      </SectionCard>

      {/* Religion */}
      <SectionCard title="Religion & Culture">
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Religion</span>
          <div className="w-[160px]">
            <SearchableSelect
              value={data.pref_religion_id ? String(data.pref_religion_id) : ''}
              onChange={(val) => onChange({...data, pref_religion_id: val && val !== 'none' ? Number(val) : '', pref_sect_id: ''})}
              options={[{ label: 'Any', value: 'none' }, ...religions.map(r => ({ label: r.name_en, value: String(r.id) }))]}
              placeholder="Any"
              className="bg-gray-50 border-[#EFE9DF] h-[32px] px-3 py-1.5 text-[12px] rounded-lg cursor-not-allowed opacity-70"
              disabled={true}
            />
          </div>
        </div>
        {availableSects.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">Sect</span>
              <div className="w-[160px]">
                <SearchableSelect
                  value={data.pref_sect_id ? String(data.pref_sect_id) : ''}
                  onChange={(val) => set('pref_sect_id', val && val !== 'none' ? Number(val) : '')}
                  options={[{ label: 'Any', value: 'none' }, ...availableSects.map(s => ({ label: s.name_en, value: String(s.id) }))]}
                  placeholder="Any"
                  className="bg-white border-[#EFE9DF] h-[32px] px-3 py-1.5 text-[12px] rounded-lg"
                />
              </div>
            </div>
            <ImportanceRow label="Sect Importance" value={data.pref_sect_importance} onChange={(v) => set('pref_sect_importance', v)} />
          </>
        )}
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Caste</span>
          <div className="w-[160px]">
            <SearchableSelect
              value={data.pref_caste_id ? String(data.pref_caste_id) : ''}
              onChange={(val) => set('pref_caste_id', val && val !== 'none' ? Number(val) : '')}
              options={[{ label: 'Any', value: 'none' }, ...castes.map(c => ({ label: c.name_en, value: String(c.id) }))]}
              placeholder="Any"
              className="bg-white border-[#EFE9DF] h-[32px] px-3 py-1.5 text-[12px] rounded-lg"
            />
          </div>
        </div>
        <ImportanceRow label="Caste Importance" value={data.pref_caste_importance} onChange={(v) => set('pref_caste_importance', v)} />
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Religious Practice</span>
          <div className="w-[160px]">
            <SearchableSelect
              value={data.pref_religious_practice || ''}
              onChange={(val) => set('pref_religious_practice', val as ReligiousPracticeLevel)}
              options={[{ label: 'Any', value: 'none' }, ...['HIGHLY_PRACTICING','PRACTICING','MODERATE','OTHER'].map(v => ({ label: v.replace(/_/g,' '), value: v }))]}
              placeholder="Any"
              className="bg-white border-[#EFE9DF] h-[32px] px-3 py-1.5 text-[12px] rounded-lg"
            />
          </div>
        </div>
        <ImportanceRow label="Practice Importance" value={data.pref_religious_practice_importance} onChange={(v) => set('pref_religious_practice_importance', v)} />
      </SectionCard>

      {/* Income */}
      <SectionCard title="Income & Career">
        <RangeRow label="Monthly Income (PKR)" minVal={data.pref_min_income} maxVal={data.pref_max_income}
          onMin={(v) => set('pref_min_income', v)} onMax={(v) => set('pref_max_income', v)} />
        <ImportanceRow label="Income Importance" value={data.pref_income_importance} onChange={(v) => set('pref_income_importance', v)} />
      </SectionCard>

      {/* Location */}
      <SectionCard title="Location">
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Country</span>
          <div className="w-[160px]">
            <SearchableSelect
              value={data.pref_location_country_id ? String(data.pref_location_country_id) : ''}
              onChange={(val) => set('pref_location_country_id', val && val !== 'none' ? Number(val) : '')}
              options={[{ label: 'Any', value: 'none' }, ...countries.map(c => ({ label: c.name_en, value: String(c.id) }))]}
              placeholder="Any"
              className="bg-white border-[#EFE9DF] h-[32px] px-3 py-1.5 text-[12px] rounded-lg"
            />
          </div>
        </div>
        <ImportanceRow label="Location Importance" value={data.pref_location_importance} onChange={(v) => set('pref_location_importance', v)} />
      </SectionCard>

      {/* Lifestyle pref */}
      <SectionCard title="Lifestyle">
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Family Setup</span>
          <div className="flex gap-1.5">
            {[['JOINT','Joint'],['SEPARATE','Separate']].map(([v,l]) => (
              <button key={v} type="button" onClick={() => set('pref_family_setup', data.pref_family_setup === v ? '' : v as FamilySetup)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_family_setup === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
            ))}
          </div>
        </div>
        <ImportanceRow label="Family Setup Importance" value={data.pref_family_setup_importance} onChange={(v) => set('pref_family_setup_importance', v)} />
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Smoking Preference</span>
          <div className="flex gap-1.5">
            {[['NO','Non-smoker'],['YES','Smoker'],['OCCASIONALLY','Occasional']].map(([v,l]) => (
              <button key={v} type="button" onClick={() => set('pref_smoking', data.pref_smoking === v ? '' : v as SmokingStatus)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_smoking === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
            ))}
          </div>
        </div>
        <ImportanceRow label="Smoking Importance" value={data.pref_smoking_importance} onChange={(v) => set('pref_smoking_importance', v)} />
      </SectionCard>
    </div>
  );
}
