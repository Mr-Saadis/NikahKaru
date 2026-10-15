'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { HouseStatus, PropertyType, FamilySetup, LivingWith } from '@/lib/types/database.types';

type Step5Data = {
  current_country_id: number | '';
  current_province_id: number | '';
  current_city_id: number | '';
  current_province_text?: string;
  current_city_text?: string;
  permanent_country_id: number | '';
  permanent_province_id: number | '';
  permanent_city_id: number | '';
  permanent_province_text?: string;
  permanent_city_text?: string;
  current_location_text: string;
  permanent_location_text: string;
  house_status: HouseStatus | '';
  property_type: PropertyType | '';
  family_setup: FamilySetup | '';
  living_with: LivingWith | '';
  living_with_other_details?: string;
};

interface Step5Props {
  data: Step5Data;
  onChange: (data: Step5Data) => void;
}

export type { Step5Data };

function LocationRow({
  label,
  headerRight,
  countryVal, onCountry,
  provinceOptions, provinceVal, onProvince,
  cityOptions, cityVal, onCity,
  provinceText, onProvinceTextChange,
  cityText, onCityTextChange,
  locationText, onLocationTextChange,
  isMandatory,
}: {
  label: string;
  headerRight?: React.ReactNode;
  countryVal: number | ''; onCountry: (v: number | '') => void;
  provinceOptions: { id: number; name_en: string }[]; provinceVal: number | ''; onProvince: (v: number | '') => void;
  cityOptions: { id: number; name_en: string }[]; cityVal: number | ''; onCity: (v: number | '') => void;
  provinceText?: string; onProvinceTextChange?: (v: string) => void;
  cityText?: string; onCityTextChange?: (v: string) => void;
  locationText: string; onLocationTextChange: (v: string) => void;
  isMandatory?: boolean;
}) {
  const { countries } = useReferenceData();
  const isPakistan = Number(countryVal) === 131;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#888174]">
          {label} {isMandatory && <span className="text-red-500">*</span>}
        </p>
        {headerRight}
      </div>
      <div className="grid grid-cols-3 gap-4 lg:gap-6">
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">
            Country {isMandatory && <span className="text-red-500">*</span>}
          </label>
          <SearchableSelect
            value={countryVal ? String(countryVal) : ''}
            onChange={(val) => onCountry(val ? Number(val) : '')}
            options={countries.map(c => ({ label: c.name_en, value: String(c.id) }))}
            placeholder="Select"
            className=""
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">
            Province / State {isMandatory && isPakistan && <span className="text-red-500">*</span>}
          </label>
          {isPakistan ? (
            <SearchableSelect
              value={provinceVal ? String(provinceVal) : ''}
              onChange={(val) => onProvince(val ? Number(val) : '')}
              options={provinceOptions.map(p => ({ label: p.name_en, value: String(p.id) }))}
              placeholder="Select"
              disabled={!provinceOptions.length}
              className=""
            />
          ) : (
            <input
              type="text"
              value={provinceText || ''}
              onChange={(e) => onProvinceTextChange?.(e.target.value)}
              placeholder="State / Province"
              className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none disabled:opacity-50"
              disabled={!countryVal}
            />
          )}
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">
            City {isMandatory && isPakistan && <span className="text-red-500">*</span>}
          </label>
          {isPakistan ? (
            <SearchableSelect
              value={cityVal ? String(cityVal) : ''}
              onChange={(val) => onCity(val ? Number(val) : '')}
              options={cityOptions.map(c => ({ label: c.name_en, value: String(c.id) }))}
              placeholder="Select"
              disabled={!cityOptions.length}
              className=""
            />
          ) : (
            <input
              type="text"
              value={cityText || ''}
              onChange={(e) => onCityTextChange?.(e.target.value)}
              placeholder="City name"
              className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none disabled:opacity-50"
              disabled={!countryVal}
            />
          )}
        </div>
      </div>
      <div className="pt-2">
        <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">
          Address / Area Details {isMandatory && !isPakistan && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={locationText || ''}
          onChange={(e) => onLocationTextChange(e.target.value)}
          placeholder="e.g. DHA Phase 5, Lahore"
          className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
        />
      </div>
    </div>
  );
}

export default function Step5LocationResidency({ data, onChange }: Step5Props) {
  const { getProvincesByCountry, getCitiesByProvince } = useReferenceData();

  const set = (field: keyof Step5Data, value: Step5Data[keyof Step5Data]) =>
    onChange({ ...data, [field]: value });

  const currentProvinces = data.current_country_id ? getProvincesByCountry(Number(data.current_country_id)) : [];
  const currentCities = data.current_province_id ? getCitiesByProvince(Number(data.current_province_id)) : [];
  const permProvinces = data.permanent_country_id ? getProvincesByCountry(Number(data.permanent_country_id)) : [];
  const permCities = data.permanent_province_id ? getCitiesByProvince(Number(data.permanent_province_id)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Location & Residency</h3>
        <p className="text-[12px] text-[#7D766C]">Where the person currently lives and their living arrangement.</p>
      </div>

      <LocationRow
        label="Current Location"
        isMandatory={true}
        countryVal={data.current_country_id}
        onCountry={(v) => onChange({ ...data, current_country_id: v, current_province_id: '', current_city_id: '', current_province_text: '', current_city_text: '' })}
        provinceOptions={currentProvinces}
        provinceVal={data.current_province_id}
        onProvince={(v) => onChange({ ...data, current_province_id: v, current_city_id: '' })}
        cityOptions={currentCities}
        cityVal={data.current_city_id}
        onCity={(v) => set('current_city_id', v)}
        provinceText={data.current_province_text}
        onProvinceTextChange={(v) => set('current_province_text', v)}
        cityText={data.current_city_text}
        onCityTextChange={(v) => set('current_city_text', v)}
        locationText={data.current_location_text}
        onLocationTextChange={(v) => set('current_location_text', v)}
      />

      <LocationRow
        label="Permanent / Home Location"
        headerRight={
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={
                !!data.current_country_id &&
                data.permanent_country_id === data.current_country_id &&
                (data.permanent_province_id || '') === (data.current_province_id || '') &&
                (data.permanent_city_id || '') === (data.current_city_id || '') &&
                (data.permanent_location_text || '') === (data.current_location_text || '')
              }
              className="accent-[#064e3b] w-3.5 h-3.5"
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({
                    ...data,
                    permanent_country_id: data.current_country_id,
                    permanent_province_id: data.current_province_id,
                    permanent_city_id: data.current_city_id,
                    permanent_province_text: data.current_province_text,
                    permanent_city_text: data.current_city_text,
                    permanent_location_text: data.current_location_text,
                  });
                } else {
                  onChange({
                    ...data,
                    permanent_country_id: '',
                    permanent_province_id: '',
                    permanent_city_id: '',
                    permanent_province_text: '',
                    permanent_city_text: '',
                    permanent_location_text: '',
                  });
                }
              }}
            />
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#064e3b]">Same as Current</span>
          </label>
        }
        countryVal={data.permanent_country_id}
        onCountry={(v) => onChange({ ...data, permanent_country_id: v, permanent_province_id: '', permanent_city_id: '', permanent_province_text: '', permanent_city_text: '' })}
        provinceOptions={permProvinces}
        provinceVal={data.permanent_province_id}
        onProvince={(v) => onChange({ ...data, permanent_province_id: v, permanent_city_id: '' })}
        cityOptions={permCities}
        cityVal={data.permanent_city_id}
        onCity={(v) => set('permanent_city_id', v)}
        provinceText={data.permanent_province_text}
        onProvinceTextChange={(v) => set('permanent_province_text', v)}
        cityText={data.permanent_city_text}
        onCityTextChange={(v) => set('permanent_city_text', v)}
        locationText={data.permanent_location_text}
        onLocationTextChange={(v) => set('permanent_location_text', v)}
      />

      {/* Residency Info */}
      <div className="grid grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">House Status</label>
          <SearchableSelect
            value={data.house_status || ''}
            onChange={(val) => set('house_status', val as HouseStatus)}
            options={[['OWN', 'Own'], ['RENTED', 'Rented'], ['FAMILY_HOUSE', 'Family House'], ['OTHER', 'Other']].map(([v, l]) => ({ label: l, value: v }))}
            placeholder="Select"
            className=""
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Property Type</label>
          <SearchableSelect
            value={data.property_type || ''}
            onChange={(val) => set('property_type', val as PropertyType)}
            options={[['HOUSE', 'House'], ['APARTMENT', 'Apartment'], ['OTHER', 'Other']].map(([v, l]) => ({ label: l, value: v }))}
            placeholder="Select"
            className=""
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Family Setup</label>
          <SearchableSelect
            value={data.family_setup || ''}
            onChange={(val) => set('family_setup', val as FamilySetup)}
            options={[['JOINT', 'Joint Family'], ['SEPARATE', 'Separate / Nuclear']].map(([v, l]) => ({ label: l, value: v }))}
            placeholder="Select"
            className=""
            direction="up"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Living With</label>
          <SearchableSelect
            value={data.living_with || ''}
            onChange={(val) => set('living_with', val as LivingWith)}
            options={[['PARENTS', 'Parents'], ['FATHER', 'Father'], ['MOTHER', 'Mother'], ['SIBLINGS', 'Siblings'], ['ALONE', 'Alone'], ['OTHER', 'Other']].map(([v, l]) => ({ label: l, value: v }))}
            placeholder="Select"
            className=""
            direction="up"
          />
        </div>

        {data.living_with === 'OTHER' && (
          <div className="space-y-2 col-span-2">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
              Please Specify <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.living_with_other_details || ''}
              onChange={(e) => set('living_with_other_details', e.target.value)}
              placeholder="e.g. Living with Uncle"
              className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
