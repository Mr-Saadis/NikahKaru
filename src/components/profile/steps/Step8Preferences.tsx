'use client';

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

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-[#FAF8F5] rounded-[22px] border border-[#E9E4DC] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#EFE9DF] bg-white">
        <h4 className="text-[12.5px] font-bold text-[#232326]">{title}</h4>
      </div>
      <div className="px-5 divide-y divide-[#F0EBE2]">{children}</div>
    </div>
  );

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
          <select value={data.pref_marital_status} onChange={(e) => set('pref_marital_status', e.target.value as MaritalStatus)} className={selectClass}>
            <option value="">Any</option>
            {['NEVER_MARRIED','DIVORCED','WIDOWED','SEPARATED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <ImportanceRow label="Marital Status Importance" value={data.pref_marital_importance} onChange={(v) => set('pref_marital_importance', v)} />
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
      </SectionCard>

      {/* Physical */}
      <SectionCard title="Physical">
        <RangeRow label="Height (cm)" minVal={data.pref_min_height} maxVal={data.pref_max_height}
          onMin={(v) => set('pref_min_height', v)} onMax={(v) => set('pref_max_height', v)} suffix="cm" />
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
          <select value={data.pref_religion_id} onChange={(e) => onChange({...data, pref_religion_id: e.target.value ? Number(e.target.value) : '', pref_sect_id: ''})} className={selectClass}>
            <option value="">Any</option>
            {religions.map(r => <option key={r.id} value={r.id}>{r.name_en}</option>)}
          </select>
        </div>
        <ImportanceRow label="Religion Importance" value={data.pref_religion_importance} onChange={(v) => set('pref_religion_importance', v)} />
        {availableSects.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">Sect</span>
              <select value={data.pref_sect_id} onChange={(e) => set('pref_sect_id', e.target.value ? Number(e.target.value) : '')} className={selectClass}>
                <option value="">Any</option>
                {availableSects.map(s => <option key={s.id} value={s.id}>{s.name_en}</option>)}
              </select>
            </div>
            <ImportanceRow label="Sect Importance" value={data.pref_sect_importance} onChange={(v) => set('pref_sect_importance', v)} />
          </>
        )}
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Caste</span>
          <select value={data.pref_caste_id} onChange={(e) => set('pref_caste_id', e.target.value ? Number(e.target.value) : '')} className={selectClass}>
            <option value="">Any</option>
            {castes.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
        <ImportanceRow label="Caste Importance" value={data.pref_caste_importance} onChange={(v) => set('pref_caste_importance', v)} />
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Religious Practice</span>
          <select value={data.pref_religious_practice} onChange={(e) => set('pref_religious_practice', e.target.value as ReligiousPracticeLevel)} className={selectClass}>
            <option value="">Any</option>
            {['HIGHLY_PRACTICING','PRACTICING','MODERATE','OTHER'].map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
          </select>
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
          <select value={data.pref_location_country_id} onChange={(e) => set('pref_location_country_id', e.target.value ? Number(e.target.value) : '')} className={selectClass}>
            <option value="">Any</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
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
