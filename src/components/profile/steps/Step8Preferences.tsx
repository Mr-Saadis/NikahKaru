'use client';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AlertCircle, Ban, Check, MapPin, Plus, X } from 'lucide-react';

import type { PreferenceImportance, MaritalStatus, YesNo, ReligiousPracticeLevel, SmokingStatus, FamilySetup, LivingWith, EmploymentType, PreferredLocation, PreferredRelocation } from '@/lib/types/database.types';
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
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1 min-w-[140px]">{label}</span>
      <div className="flex flex-wrap gap-1">
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
  const inputClass = "w-20 sm:w-28 h-[32px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-3 py-1.5 text-[12px] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1 min-w-[130px]">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
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
  const inputClass = "w-[60px] h-[32px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-2 py-1.5 text-[12px] text-center focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none";

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
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-[12px] font-medium text-[#4E473D] flex-1 min-w-[120px]">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
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
  pref_location_country_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_location_province_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_location_city_importance: PreferenceImportance | 'DOES_NOT_MATTER' | '';
  pref_locations: Array<{
    _tempId?: string;
    id?: string;
    country_id: number;
    province_id: number | null;
    city_id: number | null;
    is_excluded?: boolean;
  }>;

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
  pref_relocations: Array<{
    _tempId?: string;
    id?: string;
    country_id: number;
    province_id: number | null;
    city_id: number | null;
    is_excluded?: boolean;
  }>;
};

interface Step8Props {
  data: Step8Data;
  onChange: (data: Step8Data) => void;
  gender?: 'MALE' | 'FEMALE';
}

export default function Step8Preferences({ data, onChange, gender }: Step8Props) {
  const { religions, castes, countries, provinces, cities, getSectsByReligion, educationLevels, occupations } = useReferenceData();
  const availableSects = data.pref_religion_id ? getSectsByReligion(Number(data.pref_religion_id)) : [];

  // Local modes for Include vs Exclude
  const [locMode, setLocMode] = useState<'INCLUDE' | 'EXCLUDE'>('INCLUDE');
  const [relocMode, setRelocMode] = useState<'INCLUDE' | 'EXCLUDE'>('INCLUDE');

  // Local states for adding region
  const [locAddCountryId, setLocAddCountryId] = useState<number | ''>('');
  const [locAddProvinceId, setLocAddProvinceId] = useState<number | ''>('');
  const [relocAddCountryId, setRelocAddCountryId] = useState<number | ''>('');
  const [relocAddProvinceId, setRelocAddProvinceId] = useState<number | ''>('');

  const locFilterProvinces = locAddCountryId ? provinces.filter(p => p.country_id === locAddCountryId) : [];
  const relocFilterProvinces = relocAddCountryId ? provinces.filter(p => p.country_id === relocAddCountryId) : [];

  const set = (field: keyof Step8Data, value: Step8Data[keyof Step8Data]) =>
    onChange({ ...data, [field]: value });

  // Memoized city options with auto-resolved (Province, Country) labels
  const cityOptions = useMemo(() => {
    return [
      { label: 'Choose or search city...', value: 'none' },
      ...cities.map(c => {
        const p = provinces.find(pr => pr.id === c.province_id);
        const k = countries.find(co => co.id === c.country_id);
        const sub = [p?.name_en, k?.name_en].filter(Boolean).join(', ');
        return {
          label: sub ? `${c.name_en} (${sub})` : c.name_en,
          value: String(c.id),
        };
      })
    ];
  }, [cities, provinces, countries]);

  // Helper to format a location chip
  const formatLocationLabel = (loc: { country_id: number; province_id: number | null; city_id: number | null }) => {
    const c = countries.find(k => k.id === loc.country_id);
    const p = loc.province_id ? provinces.find(pr => pr.id === loc.province_id) : null;
    const ct = loc.city_id ? cities.find(ci => ci.id === loc.city_id) : null;

    if (ct) {
      const parts = [p?.name_en, c?.name_en].filter(Boolean).join(', ');
      return { main: ct.name_en, sub: parts };
    }
    if (p) {
      return { main: p.name_en, sub: c?.name_en ? `${c.name_en} (Province)` : 'Province' };
    }
    return { main: c?.name_en || `Country #${loc.country_id}`, sub: 'Entire Country' };
  };

  const addLocationByCity = (cityIdStr: string) => {
    if (!cityIdStr || cityIdStr === 'none') return;
    const cid = Number(cityIdStr);
    const city = cities.find(c => c.id === cid);
    if (!city) return;
    const current = data.pref_locations || [];
    const isExcluded = locMode === 'EXCLUDE';
    const existingIndex = current.findIndex(l => l.city_id === cid);
    if (existingIndex >= 0) {
      if (Boolean(current[existingIndex].is_excluded) === isExcluded) return;
      const updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], is_excluded: isExcluded };
      set('pref_locations', updated);
      return;
    }
    const newEntry = {
      _tempId: crypto.randomUUID(),
      country_id: city.country_id,
      province_id: city.province_id || null,
      city_id: city.id,
      is_excluded: isExcluded,
    };
    set('pref_locations', [...current, newEntry]);
  };

  const addLocationByCountry = (countryId: number, provinceId?: number | null) => {
    const current = data.pref_locations || [];
    const isExcluded = locMode === 'EXCLUDE';
    if (provinceId) {
      const existingIndex = current.findIndex(l => l.province_id === provinceId && !l.city_id);
      if (existingIndex >= 0) {
        if (Boolean(current[existingIndex].is_excluded) === isExcluded) return;
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], is_excluded: isExcluded };
        set('pref_locations', updated);
        return;
      }
      set('pref_locations', [...current, {
        _tempId: crypto.randomUUID(),
        country_id: countryId,
        province_id: provinceId,
        city_id: null,
        is_excluded: isExcluded,
      }]);
    } else {
      const existingIndex = current.findIndex(l => l.country_id === countryId && !l.province_id && !l.city_id);
      if (existingIndex >= 0) {
        if (Boolean(current[existingIndex].is_excluded) === isExcluded) return;
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], is_excluded: isExcluded };
        set('pref_locations', updated);
        return;
      }
      set('pref_locations', [...current, {
        _tempId: crypto.randomUUID(),
        country_id: countryId,
        province_id: null,
        city_id: null,
        is_excluded: isExcluded,
      }]);
    }
  };

  const removeLocation = (index: number) => {
    const current = data.pref_locations || [];
    set('pref_locations', current.filter((_, i) => i !== index));
  };

  const addRelocationByCity = (cityIdStr: string) => {
    if (!cityIdStr || cityIdStr === 'none') return;
    const cid = Number(cityIdStr);
    const city = cities.find(c => c.id === cid);
    if (!city) return;
    const current = data.pref_relocations || [];
    const isExcluded = relocMode === 'EXCLUDE';
    const existingIndex = current.findIndex(l => l.city_id === cid);
    if (existingIndex >= 0) {
      if (Boolean(current[existingIndex].is_excluded) === isExcluded) return;
      const updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], is_excluded: isExcluded };
      set('pref_relocations', updated);
      return;
    }
    const newEntry = {
      _tempId: crypto.randomUUID(),
      country_id: city.country_id,
      province_id: city.province_id || null,
      city_id: city.id,
      is_excluded: isExcluded,
    };
    set('pref_relocations', [...current, newEntry]);
  };

  const addRelocationByCountry = (countryId: number, provinceId?: number | null) => {
    const current = data.pref_relocations || [];
    const isExcluded = relocMode === 'EXCLUDE';
    if (provinceId) {
      const existingIndex = current.findIndex(l => l.province_id === provinceId && !l.city_id);
      if (existingIndex >= 0) {
        if (Boolean(current[existingIndex].is_excluded) === isExcluded) return;
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], is_excluded: isExcluded };
        set('pref_relocations', updated);
        return;
      }
      set('pref_relocations', [...current, {
        _tempId: crypto.randomUUID(),
        country_id: countryId,
        province_id: provinceId,
        city_id: null,
        is_excluded: isExcluded,
      }]);
    } else {
      const existingIndex = current.findIndex(l => l.country_id === countryId && !l.province_id && !l.city_id);
      if (existingIndex >= 0) {
        if (Boolean(current[existingIndex].is_excluded) === isExcluded) return;
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], is_excluded: isExcluded };
        set('pref_relocations', updated);
        return;
      }
      set('pref_relocations', [...current, {
        _tempId: crypto.randomUUID(),
        country_id: countryId,
        province_id: null,
        city_id: null,
        is_excluded: isExcluded,
      }]);
    }
  };

  const removeRelocation = (index: number) => {
    const current = data.pref_relocations || [];
    set('pref_relocations', current.filter((_, i) => i !== index));
  };

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

  const isLocationActive = Boolean(
    (data.pref_location_country_importance && data.pref_location_country_importance !== DOESNT_MATTER_VALUE) ||
    (data.pref_location_province_importance && data.pref_location_province_importance !== DOESNT_MATTER_VALUE) ||
    (data.pref_location_city_importance && data.pref_location_city_importance !== DOESNT_MATTER_VALUE)
  );

  const handleLocationImportance = (
    field: 'pref_location_country_importance' | 'pref_location_province_importance' | 'pref_location_city_importance',
    val: PreferenceImportance | 'DOES_NOT_MATTER' | ''
  ) => {
    const updated = { ...data, [field]: val };
    const allDoesntMatter =
      (field === 'pref_location_country_importance' ? val : updated.pref_location_country_importance) === DOESNT_MATTER_VALUE &&
      (field === 'pref_location_province_importance' ? val : updated.pref_location_province_importance) === DOESNT_MATTER_VALUE &&
      (field === 'pref_location_city_importance' ? val : updated.pref_location_city_importance) === DOESNT_MATTER_VALUE;

    if (allDoesntMatter) {
      updated.pref_locations = [];
    }
    onChange(updated);
  };

  const selectClass = "bg-white border border-[#EFE9DF] rounded-lg px-3 py-1.5 text-[12px] focus:border-[#064e3b] focus:outline-none min-w-[120px]";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Partner Preferences</h3>
        <p className="text-[12px] text-[#7D766C]">Define desired partner criteria and their importance level.</p>
      </div>

      {/* Important Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFF9F2] border border-[#F5C770]/80 shadow-xs">
        <AlertCircle size={20} className="shrink-0 text-[#C86A4A] mt-0.5" />
        <div>
          <h4 className="text-[13px] font-bold text-[#2F3E51]">This section is very important</h4>
          <p className="text-[12px] text-[#7A6B58] mt-0.5 leading-relaxed">
            Please fill out this section carefully. The matching system uses these partner preferences to find and suggest the most suitable matches for this profile.
          </p>
        </div>
      </div>

      {/* Basic */}
      <SectionCard title="Age & Marital Status">
        <ImportanceRow label={<>Age Importance <span className="text-red-500">*</span></>} value={data.pref_age_importance} onChange={(v) => handleImportanceChange('pref_age_importance', v, ['pref_min_age', 'pref_max_age'])} />
        {data.pref_age_importance !== DOESNT_MATTER_VALUE && (
          <RangeRow label={<>Age Range <span className="text-red-500">*</span></>} minVal={data.pref_min_age} maxVal={data.pref_max_age}
            onMin={(v) => set('pref_min_age', v)} onMax={(v) => set('pref_max_age', v)} suffix="yrs" />
        )}

        <ImportanceRow label="Marital Status Importance" value={data.pref_marital_importance} onChange={(v) => handleImportanceChange('pref_marital_importance', v, ['pref_marital_status', 'pref_children_allowed', 'pref_children_importance'])} />
        {data.pref_marital_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Marital Status</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_marital_status || ''}
                onChange={(val) => {
                  const newStatus = (val === 'none' ? '' : val) as MaritalStatus | '';
                  const needsChildren = ['DIVORCED', 'WIDOWED', 'SEPARATED'].includes(newStatus as string);
                  onChange({
                    ...data,
                    pref_marital_status: newStatus,
                    ...(!needsChildren ? { pref_children_allowed: '', pref_children_importance: '' } : {})
                  });
                }}
                options={[{ label: 'Any', value: 'none' }, ...['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'].map(s => ({ label: s.replace(/_/g, ' '), value: s }))]}
                placeholder="Any"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}

        {data.pref_marital_importance !== DOESNT_MATTER_VALUE && ['DIVORCED', 'WIDOWED', 'SEPARATED'].includes(data.pref_marital_status as string) && (
          <>
            <ImportanceRow label="Children Importance" value={data.pref_children_importance} onChange={(v) => handleImportanceChange('pref_children_importance', v, ['pref_children_allowed'])} />
            {data.pref_children_importance !== DOESNT_MATTER_VALUE && (
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
                <span className="text-[12px] font-medium text-[#4E473D] flex-1">Children Allowed</span>
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
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Complexion</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_complexion || ''}
                onChange={(val) => set('pref_complexion', val === 'none' ? '' : val)}
                options={['Very Fair', 'Fair', 'Whitish', 'Wheatish', 'Wheatish Brown', 'Brown', 'Dark Brown', 'Dark'].map(c => ({ label: c, value: c }))}
                placeholder="Select Complexion"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label="Disability Importance" value={data.pref_disability_importance} onChange={(v) => handleImportanceChange('pref_disability_importance', v, ['pref_disability_allowed'])} />
        {data.pref_disability_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Disability Allowed</span>
            <div className="flex gap-1.5">
              {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('pref_disability_allowed', data.pref_disability_allowed === v ? '' : v as YesNo)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_disability_allowed === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
              ))}
            </div>
          </div>
        )}
        
        {gender !== 'MALE' && (
          <>
            <ImportanceRow label={<>Beard Preference Importance</>} value={data.pref_beard_importance} onChange={(v) => handleImportanceChange('pref_beard_importance', v, ['pref_beard'])} />
            {data.pref_beard_importance !== DOESNT_MATTER_VALUE && (
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
                <span className="text-[12px] font-medium text-[#4E473D] flex-1">Beard Required?</span>
                <div className="flex gap-1.5">
                  {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => set('pref_beard', data.pref_beard === v ? '' : v as YesNo)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_beard === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {gender !== 'FEMALE' && (
          <>
            <ImportanceRow label={<>Hijab Preference Importance</>} value={data.pref_hijab_importance} onChange={(v) => handleImportanceChange('pref_hijab_importance', v, ['pref_hijab'])} />
            {data.pref_hijab_importance !== DOESNT_MATTER_VALUE && (
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
                <span className="text-[12px] font-medium text-[#4E473D] flex-1">Hijab Required?</span>
                <div className="flex gap-1.5">
                  {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => set('pref_hijab', data.pref_hijab === v ? '' : v as YesNo)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${data.pref_hijab === v ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-[#E9E4DC] text-[#676156]'}`}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* Education */}
      <SectionCard title="Education">
        <ImportanceRow label="Education Level Importance" value={data.pref_education_importance} onChange={(v) => handleImportanceChange('pref_education_importance', v, ['pref_education_level_id'])} />
        {data.pref_education_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Minimum Education</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_education_level_id ? String(data.pref_education_level_id) : ''}
                onChange={(val) => set('pref_education_level_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...educationLevels.map(e => ({ label: e.name_en, value: String(e.id) }))]}
                placeholder="Any"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
        <ImportanceRow label="Field of Study Importance" value={data.pref_field_importance} onChange={(v) => handleImportanceChange('pref_field_importance', v, ['pref_field_of_study'])} />
        {data.pref_field_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Field</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_field_of_study || ''}
                onChange={(val) => set('pref_field_of_study', val === 'none' ? '' : val)}
                options={['Computer Science', 'Engineering', 'Medicine', 'Business/Commerce', 'Arts/Humanities', 'Science', 'Law', 'Other'].map(f => ({ label: f, value: f }))}
                placeholder="Select Field of Study"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Profession */}
      <SectionCard title="Profession & Income">
        <ImportanceRow label="Occupation Importance" value={data.pref_occupation_importance} onChange={(v) => handleImportanceChange('pref_occupation_importance', v, ['pref_occupation_id'])} />
        {data.pref_occupation_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Preferred Occupation</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_occupation_id ? String(data.pref_occupation_id) : ''}
                onChange={(val) => set('pref_occupation_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...occupations.map(o => ({ label: o.name_en, value: String(o.id) }))]}
                placeholder="Any"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label="Employment Type Importance" value={data.pref_employment_type_importance} onChange={(v) => handleImportanceChange('pref_employment_type_importance', v, ['pref_employment_type'])} />
        {data.pref_employment_type_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Employment Type</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_employment_type || ''}
                onChange={(val) => set('pref_employment_type', val === 'none' ? '' : val)}
                options={[{ label: 'Any', value: 'none' }, ...['GOVERNMENT', 'PRIVATE', 'BUSINESS', 'SELF_EMPLOYED', 'FREELANCER'].map(s => ({ label: s.replace(/_/g, ' '), value: s }))]}
                placeholder="Any"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
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
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
          <span className="text-[12px] font-medium text-[#4E473D] flex-1">Religion</span>
          <div className="w-full sm:w-[190px] xl:w-[220px]">
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
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
                <span className="text-[12px] font-medium text-[#4E473D] flex-1">Sect</span>
                <div className="w-full sm:w-[190px] xl:w-[220px]">
                  <SearchableSelect
                    value={data.pref_sect_id ? String(data.pref_sect_id) : ''}
                    onChange={(val) => set('pref_sect_id', val && val !== 'none' ? Number(val) : '')}
                    options={[{ label: 'Any', value: 'none' }, ...availableSects.map(s => ({ label: s.name_en, value: String(s.id) }))]}
                    placeholder="Any"
                    className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
                  />
                </div>
              </div>
            )}
          </>
        )}
        <ImportanceRow label="Caste Importance" value={data.pref_caste_importance} onChange={(v) => handleImportanceChange('pref_caste_importance', v, ['pref_caste_id'])} />
        {data.pref_caste_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Caste</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_caste_id ? String(data.pref_caste_id) : ''}
                onChange={(val) => set('pref_caste_id', val && val !== 'none' ? Number(val) : '')}
                options={[{ label: 'Any', value: 'none' }, ...castes.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                placeholder="Any"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
        <ImportanceRow label="Practice Importance" value={data.pref_religious_practice_importance} onChange={(v) => handleImportanceChange('pref_religious_practice_importance', v, ['pref_religious_practice'])} />
        {data.pref_religious_practice_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Religious Practice</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_religious_practice || ''}
                onChange={(val) => set('pref_religious_practice', (val === 'none' ? '' : val) as ReligiousPracticeLevel)}
                options={[{ label: 'Any', value: 'none' }, ...['HIGHLY_PRACTICING', 'PRACTICING', 'MODERATE', 'OTHER'].map(v => ({ label: v.replace(/_/g, ' '), value: v }))]}
                placeholder="Any"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Location */}
      <SectionCard title="Location Preferences">
        <ImportanceRow
          label={<>Country Importance</>}
          value={data.pref_location_country_importance}
          onChange={(v) => handleLocationImportance('pref_location_country_importance', v)}
        />
        <ImportanceRow
          label={<>Province Importance</>}
          value={data.pref_location_province_importance}
          onChange={(v) => handleLocationImportance('pref_location_province_importance', v)}
        />
        <ImportanceRow
          label={<>City Importance</>}
          value={data.pref_location_city_importance}
          onChange={(v) => handleLocationImportance('pref_location_city_importance', v)}
        />

        {isLocationActive && (
          <div className="pt-3 border-t border-[#EFE9DF] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-[#2F3E51]">Preferred Locations</span>
                <p className="text-[11px] text-[#8A968C]">
                  Search cities (province & country auto-resolve) or add an entire country/province.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#064e3b] bg-[#064e3b]/10 px-2.5 py-0.5 rounded-full">
                {(data.pref_locations || []).length} added
              </span>
            </div>

            {/* Include / Exclude Mode Switcher */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-semibold text-[#4E473D]">Action:</span>
                <div className="inline-flex p-0.5 bg-[#F4EFE6] border border-[#E5DFD3] rounded-full">
                  <button
                    type="button"
                    onClick={() => setLocMode('INCLUDE')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      locMode === 'INCLUDE'
                        ? 'bg-[#064e3b] text-white shadow-xs'
                        : 'text-[#676156] hover:text-[#064e3b]'
                    }`}
                  >
                    <Check size={12} />
                    Include
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocMode('EXCLUDE')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      locMode === 'EXCLUDE'
                        ? 'bg-[#DC2626] text-white shadow-xs'
                        : 'text-[#676156] hover:text-[#DC2626]'
                    }`}
                  >
                    <Ban size={12} />
                    Exclude
                  </button>
                </div>
              </div>
              <span className="text-[11px] font-semibold">
                {locMode === 'INCLUDE' ? (
                  <span className="text-[#064e3b]">Add desired locations (Allowed)</span>
                ) : (
                  <span className="text-[#DC2626]">Add locations to exclude / filter out</span>
                )}
              </span>
            </div>

            {/* Quick Add City (Auto-resolves Province & Country) */}
            <div className="space-y-1.5 bg-[#FAF8F5] p-3 rounded-[16px] border border-[#EFE9DF]">
              <label className="block text-[11px] font-semibold text-[#4E473D]">
                Quick Add by City <span className="text-[10px] text-[#8A968C] font-normal">(Province & Country detected automatically)</span>
              </label>
              <SearchableSelect
                value=""
                onChange={(val) => {
                  if (val && val !== 'none') {
                    addLocationByCity(val);
                  }
                }}
                options={cityOptions}
                placeholder={locMode === 'INCLUDE' ? "Search city to INCLUDE e.g. Lahore, Islamabad, London..." : "Search city to EXCLUDE e.g. Gujrat, Faisalabad..."}
                className="!h-[36px] text-[12px] bg-white"
              />
            </div>

            {/* Or Add Entire Country / Province */}
            <div className="bg-[#FAF8F5] p-3 rounded-[16px] border border-[#EFE9DF] space-y-2">
              <label className="block text-[11px] font-semibold text-[#4E473D]">
                Or Add Entire Region <span className="text-[10px] text-[#8A968C] font-normal">(Country or Province)</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={locAddCountryId ? String(locAddCountryId) : ''}
                    onChange={(val) => {
                      const cid = val && val !== 'none' ? Number(val) : '';
                      setLocAddCountryId(cid);
                      setLocAddProvinceId('');
                    }}
                    options={[{ label: 'Select Country', value: 'none' }, ...countries.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                    placeholder="Select Country"
                    className="!h-[34px] text-[12px] bg-white"
                  />
                </div>
                <div className="flex-1">
                  <SearchableSelect
                    value={locAddProvinceId ? String(locAddProvinceId) : ''}
                    onChange={(val) => setLocAddProvinceId(val && val !== 'none' ? Number(val) : '')}
                    options={[{ label: 'Any Province (All)', value: 'none' }, ...locFilterProvinces.map(p => ({ label: p.name_en, value: String(p.id) }))]}
                    placeholder="Any Province"
                    disabled={!locAddCountryId}
                    className="!h-[34px] text-[12px] bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (locAddCountryId) {
                      addLocationByCountry(Number(locAddCountryId), locAddProvinceId ? Number(locAddProvinceId) : null);
                      setLocAddCountryId('');
                      setLocAddProvinceId('');
                    }
                  }}
                  disabled={!locAddCountryId}
                  className={`px-3.5 h-[34px] rounded-full text-[11px] font-bold text-white transition-all shrink-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    locMode === 'EXCLUDE'
                      ? 'bg-[#DC2626] hover:bg-[#DC2626]/90'
                      : 'bg-[#064e3b] hover:bg-[#064e3b]/90'
                  }`}
                >
                  {locMode === 'EXCLUDE' ? <Ban size={13} /> : <Plus size={13} />}
                  {locMode === 'EXCLUDE' ? 'Exclude Region' : 'Add Region'}
                </button>
              </div>
            </div>

            {/* List of Added Locations */}
            <div className="space-y-1.5 pt-1">
              {(!data.pref_locations || data.pref_locations.length === 0) ? (
                <div className="p-3 rounded-xl bg-white border border-dashed border-[#E9E4DC] text-center text-[11.5px] text-[#8A968C]">
                  No preferred locations added yet. Search cities or add regions above.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.pref_locations.map((loc, idx) => {
                    const label = formatLocationLabel(loc);
                    const isExcluded = Boolean(loc.is_excluded);
                    return (
                      <div
                        key={loc._tempId || loc.id || idx}
                        className={`inline-flex items-center gap-1.5 shadow-xs px-3 py-1.5 rounded-full text-[12px] transition-all border ${
                          isExcluded
                            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B] hover:border-red-400'
                            : 'bg-[#F0FDF4] border-[#86EFAC] text-[#14532D] hover:border-emerald-400'
                        }`}
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isExcluded ? 'bg-[#DC2626] text-white' : 'bg-[#064e3b] text-white'
                          }`}
                        >
                          {isExcluded ? 'Exclude' : 'Include'}
                        </span>
                        <MapPin size={12} className={isExcluded ? 'text-[#DC2626] shrink-0' : 'text-[#064e3b] shrink-0'} />
                        <span className={`font-semibold ${isExcluded ? 'line-through decoration-[#DC2626]/60' : ''}`}>
                          {label.main}
                        </span>
                        {label.sub && (
                          <span className={`text-[10px] ${isExcluded ? 'text-[#B91C1C]' : 'text-[#166534]'}`}>
                            ({label.sub})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeLocation(idx)}
                          className="text-[#8A968C] hover:text-red-600 hover:bg-red-100/60 rounded-full p-0.5 ml-0.5 transition-colors"
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Relocation */}
      <SectionCard title="Relocation Preferences">
        <ImportanceRow
          label="Relocation Importance"
          value={data.pref_relocation_importance}
          onChange={(v) => {
            if (v === DOESNT_MATTER_VALUE) {
              onChange({
                ...data,
                pref_relocation_importance: v,
                pref_willing_to_relocate_required: '',
                pref_relocations: [],
              });
            } else {
              set('pref_relocation_importance', v);
            }
          }}
        />
        {data.pref_relocation_importance !== DOESNT_MATTER_VALUE && Boolean(data.pref_relocation_importance) && (
          <div className="space-y-3">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
              <span className="text-[12px] font-medium text-[#4E473D] flex-1">Must be willing to relocate?</span>
              <div className="flex gap-1.5">
                {[['YES', 'Yes'], ['NO', 'No']].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const newVal = data.pref_willing_to_relocate_required === v ? '' : (v as YesNo);
                      onChange({
                        ...data,
                        pref_willing_to_relocate_required: newVal,
                        pref_relocations: newVal !== 'YES' ? [] : (data.pref_relocations || []),
                      });
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                      data.pref_willing_to_relocate_required === v
                        ? 'bg-[#064e3b] text-white border-[#064e3b]'
                        : 'bg-white border-[#E9E4DC] text-[#676156]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {data.pref_willing_to_relocate_required === 'YES' && (
              <div className="pt-2 border-t border-[#EFE9DF] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[12px] font-bold text-[#2F3E51]">Preferred Relocation Destinations</span>
                    <p className="text-[11px] text-[#8A968C]">
                      Where would you consider relocating? Add specific cities or entire countries.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#064e3b] bg-[#064e3b]/10 px-2.5 py-0.5 rounded-full">
                    {(data.pref_relocations || []).length} added
                  </span>
                </div>

                {/* Include / Exclude Mode Switcher for Relocation */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-[#4E473D]">Action:</span>
                    <div className="inline-flex p-0.5 bg-[#F4EFE6] border border-[#E5DFD3] rounded-full">
                      <button
                        type="button"
                        onClick={() => setRelocMode('INCLUDE')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          relocMode === 'INCLUDE'
                            ? 'bg-[#064e3b] text-white shadow-xs'
                            : 'text-[#676156] hover:text-[#064e3b]'
                        }`}
                      >
                        <Check size={12} />
                        Include
                      </button>
                      <button
                        type="button"
                        onClick={() => setRelocMode('EXCLUDE')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          relocMode === 'EXCLUDE'
                            ? 'bg-[#DC2626] text-white shadow-xs'
                            : 'text-[#676156] hover:text-[#DC2626]'
                        }`}
                      >
                        <Ban size={12} />
                        Exclude
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold">
                    {relocMode === 'INCLUDE' ? (
                      <span className="text-[#064e3b]">Add desired destination</span>
                    ) : (
                      <span className="text-[#DC2626]">Add destination to avoid / exclude</span>
                    )}
                  </span>
                </div>

                {/* Quick Add City */}
                <div className="space-y-1.5 bg-[#FAF8F5] p-3 rounded-[16px] border border-[#EFE9DF]">
                  <label className="block text-[11px] font-semibold text-[#4E473D]">
                    Quick Add Destination City <span className="text-[10px] text-[#8A968C] font-normal">(Province & Country detected automatically)</span>
                  </label>
                  <SearchableSelect
                    value=""
                    onChange={(val) => {
                      if (val && val !== 'none') {
                        addRelocationByCity(val);
                      }
                    }}
                    options={cityOptions}
                    placeholder={relocMode === 'INCLUDE' ? "Search city to INCLUDE e.g. Dubai, London, Toronto, Islamabad..." : "Search city to EXCLUDE..."}
                    className="!h-[36px] text-[12px] bg-white"
                  />
                </div>

                {/* Or Add Entire Country / Province */}
                <div className="bg-[#FAF8F5] p-3 rounded-[16px] border border-[#EFE9DF] space-y-2">
                  <label className="block text-[11px] font-semibold text-[#4E473D]">
                    Or Add Destination Country / Region
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SearchableSelect
                        value={relocAddCountryId ? String(relocAddCountryId) : ''}
                        onChange={(val) => {
                          const cid = val && val !== 'none' ? Number(val) : '';
                          setRelocAddCountryId(cid);
                          setRelocAddProvinceId('');
                        }}
                        options={[{ label: 'Select Country', value: 'none' }, ...countries.map(c => ({ label: c.name_en, value: String(c.id) }))]}
                        placeholder="Select Country"
                        className="!h-[34px] text-[12px] bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <SearchableSelect
                        value={relocAddProvinceId ? String(relocAddProvinceId) : ''}
                        onChange={(val) => setRelocAddProvinceId(val && val !== 'none' ? Number(val) : '')}
                        options={[{ label: 'Any Province (All)', value: 'none' }, ...relocFilterProvinces.map(p => ({ label: p.name_en, value: String(p.id) }))]}
                        placeholder="Any Province"
                        disabled={!relocAddCountryId}
                        className="!h-[34px] text-[12px] bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (relocAddCountryId) {
                          addRelocationByCountry(Number(relocAddCountryId), relocAddProvinceId ? Number(relocAddProvinceId) : null);
                          setRelocAddCountryId('');
                          setRelocAddProvinceId('');
                        }
                      }}
                      disabled={!relocAddCountryId}
                      className={`px-3.5 h-[34px] rounded-full text-[11px] font-bold text-white transition-all shrink-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                        relocMode === 'EXCLUDE'
                          ? 'bg-[#DC2626] hover:bg-[#DC2626]/90'
                          : 'bg-[#064e3b] hover:bg-[#064e3b]/90'
                      }`}
                    >
                      {relocMode === 'EXCLUDE' ? <Ban size={13} /> : <Plus size={13} />}
                      {relocMode === 'EXCLUDE' ? 'Exclude Region' : 'Add Region'}
                    </button>
                  </div>
                </div>

                {/* List of Added Relocations */}
                <div className="space-y-1.5 pt-1">
                  {(!data.pref_relocations || data.pref_relocations.length === 0) ? (
                    <div className="p-3 rounded-xl bg-white border border-dashed border-[#E9E4DC] text-center text-[11.5px] text-[#8A968C]">
                      No specific destination added yet (open to anywhere or general).
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {data.pref_relocations.map((rel, idx) => {
                        const label = formatLocationLabel(rel);
                        const isExcluded = Boolean(rel.is_excluded);
                        return (
                          <div
                            key={rel._tempId || rel.id || idx}
                            className={`inline-flex items-center gap-1.5 shadow-xs px-3 py-1.5 rounded-full text-[12px] transition-all border ${
                              isExcluded
                                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B] hover:border-red-400'
                                : 'bg-[#F0FDF4] border-[#86EFAC] text-[#14532D] hover:border-emerald-400'
                            }`}
                          >
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isExcluded ? 'bg-[#DC2626] text-white' : 'bg-[#064e3b] text-white'
                              }`}
                            >
                              {isExcluded ? 'Exclude' : 'Include'}
                            </span>
                            <MapPin size={12} className={isExcluded ? 'text-[#DC2626] shrink-0' : 'text-[#064e3b] shrink-0'} />
                            <span className={`font-semibold ${isExcluded ? 'line-through decoration-[#DC2626]/60' : ''}`}>
                              {label.main}
                            </span>
                            {label.sub && (
                              <span className={`text-[10px] ${isExcluded ? 'text-[#B91C1C]' : 'text-[#166534]'}`}>
                                ({label.sub})
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeRelocation(idx)}
                              className="text-[#8A968C] hover:text-red-600 hover:bg-red-100/60 rounded-full p-0.5 ml-0.5 transition-colors"
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Family */}
      <SectionCard title="Family Preferences">
        <ImportanceRow label="Family Setup Importance" value={data.pref_family_setup_importance} onChange={(v) => handleImportanceChange('pref_family_setup_importance', v, ['pref_family_setup'])} />
        {data.pref_family_setup_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Family Setup</span>
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
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Living With</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_living_with || ''}
                onChange={(val) => set('pref_living_with', val === 'none' ? '' : val as LivingWith)}
                options={[{ label: 'Any', value: 'none' }, ...['PARENTS', 'FATHER', 'MOTHER', 'SIBLINGS', 'ALONE', 'OTHER'].map(s => ({ label: s.replace(/_/g, ' '), value: s }))]}
                placeholder="Any"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
        
        <ImportanceRow label="Parents Status Importance" value={data.pref_parents_status_importance} onChange={(v) => handleImportanceChange('pref_parents_status_importance', v, ['pref_parents_status'])} />
        {data.pref_parents_status_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Parents Status</span>
            <div className="w-full sm:w-[190px] xl:w-[220px]">
              <SearchableSelect
                value={data.pref_parents_status || ''}
                onChange={(val) => set('pref_parents_status', val)}
                options={['Both Alive', 'Father Deceased', 'Mother Deceased', 'Both Deceased'].map(s => ({ label: s, value: s }))}
                placeholder="Select Parents Status"
                className="!h-[32px] !min-h-[32px] !py-1 text-[12px]"
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Lifestyle pref */}
      <SectionCard title="Lifestyle">
        <ImportanceRow label="Smoking Importance" value={data.pref_smoking_importance} onChange={(v) => handleImportanceChange('pref_smoking_importance', v, ['pref_smoking'])} />
        {data.pref_smoking_importance !== DOESNT_MATTER_VALUE && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-2">
            <span className="text-[12px] font-medium text-[#4E473D] flex-1">Smoking Preference</span>
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
