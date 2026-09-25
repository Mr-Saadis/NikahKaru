'use client';

import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { HouseStatus, PropertyType, FamilySetup, LivingWith } from '@/lib/types/database.types';

type Step5Data = {
  current_country_id: number | '';
  current_province_id: number | '';
  current_city_id: number | '';
  permanent_country_id: number | '';
  permanent_province_id: number | '';
  permanent_city_id: number | '';
  current_location_text: string;
  house_status: HouseStatus | '';
  property_type: PropertyType | '';
  family_setup: FamilySetup | '';
  living_with: LivingWith | '';
};

interface Step5Props {
  data: Step5Data;
  onChange: (data: Step5Data) => void;
}

export type { Step5Data };

export default function Step5LocationResidency({ data, onChange }: Step5Props) {
  const { countries, getProvincesByCountry, getCitiesByProvince } = useReferenceData();

  const set = (field: keyof Step5Data, value: Step5Data[keyof Step5Data]) =>
    onChange({ ...data, [field]: value });

  const currentProvinces = data.current_country_id ? getProvincesByCountry(Number(data.current_country_id)) : [];
  const currentCities = data.current_province_id ? getCitiesByProvince(Number(data.current_province_id)) : [];
  const permProvinces = data.permanent_country_id ? getProvincesByCountry(Number(data.permanent_country_id)) : [];
  const permCities = data.permanent_province_id ? getCitiesByProvince(Number(data.permanent_province_id)) : [];

  const dropdownClass = "w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all";

  const LocationRow = ({
    label,
    countryVal, onCountry,
    provinceOptions, provinceVal, onProvince,
    cityOptions, cityVal, onCity,
  }: {
    label: string;
    countryVal: number | ''; onCountry: (v: number | '') => void;
    provinceOptions: {id: number; name_en: string}[]; provinceVal: number | ''; onProvince: (v: number | '') => void;
    cityOptions: {id: number; name_en: string}[]; cityVal: number | ''; onCity: (v: number | '') => void;
  }) => (
    <div className="space-y-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#888174]">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">Country</label>
          <select value={countryVal} onChange={(e) => onCountry(e.target.value ? Number(e.target.value) : '')} className={dropdownClass}>
            <option value="">Select</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">Province</label>
          <select value={provinceVal} onChange={(e) => onProvince(e.target.value ? Number(e.target.value) : '')} disabled={!provinceOptions.length} className={dropdownClass}>
            <option value="">Select</option>
            {provinceOptions.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">City</label>
          <select value={cityVal} onChange={(e) => onCity(e.target.value ? Number(e.target.value) : '')} disabled={!cityOptions.length} className={dropdownClass}>
            <option value="">Select</option>
            {cityOptions.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Location & Residency</h3>
        <p className="text-[12px] text-[#7D766C]">Where the person currently lives and their living arrangement.</p>
      </div>

      <LocationRow
        label="Current Location"
        countryVal={data.current_country_id}
        onCountry={(v) => onChange({ ...data, current_country_id: v, current_province_id: '', current_city_id: '' })}
        provinceOptions={currentProvinces}
        provinceVal={data.current_province_id}
        onProvince={(v) => onChange({ ...data, current_province_id: v, current_city_id: '' })}
        cityOptions={currentCities}
        cityVal={data.current_city_id}
        onCity={(v) => set('current_city_id', v)}
      />

      {/* Current location text */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
          Address / Area Details
        </label>
        <input
          type="text"
          value={data.current_location_text}
          onChange={(e) => set('current_location_text', e.target.value)}
          placeholder="e.g. DHA Phase 5, Lahore"
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
        />
      </div>

      <LocationRow
        label="Permanent / Home Location"
        countryVal={data.permanent_country_id}
        onCountry={(v) => onChange({ ...data, permanent_country_id: v, permanent_province_id: '', permanent_city_id: '' })}
        provinceOptions={permProvinces}
        provinceVal={data.permanent_province_id}
        onProvince={(v) => onChange({ ...data, permanent_province_id: v, permanent_city_id: '' })}
        cityOptions={permCities}
        cityVal={data.permanent_city_id}
        onCity={(v) => set('permanent_city_id', v)}
      />

      {/* Residency Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">House Status</label>
          <select value={data.house_status} onChange={(e) => set('house_status', e.target.value as HouseStatus)} className={dropdownClass}>
            <option value="">Select</option>
            {[['OWN','Own'], ['RENTED','Rented'], ['FAMILY_HOUSE','Family House'], ['OTHER','Other']].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Property Type</label>
          <select value={data.property_type} onChange={(e) => set('property_type', e.target.value as PropertyType)} className={dropdownClass}>
            <option value="">Select</option>
            {[['HOUSE','House'], ['APARTMENT','Apartment'], ['OTHER','Other']].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Family Setup</label>
          <select value={data.family_setup} onChange={(e) => set('family_setup', e.target.value as FamilySetup)} className={dropdownClass}>
            <option value="">Select</option>
            {[['JOINT','Joint Family'], ['SEPARATE','Separate / Nuclear']].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Living With</label>
          <select value={data.living_with} onChange={(e) => set('living_with', e.target.value as LivingWith)} className={dropdownClass}>
            <option value="">Select</option>
            {[['PARENTS','Parents'], ['FATHER','Father'], ['MOTHER','Mother'], ['SIBLINGS','Siblings'], ['ALONE','Alone'], ['OTHER','Other']].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
