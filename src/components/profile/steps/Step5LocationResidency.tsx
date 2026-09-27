'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  permanent_location_text: string;
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

function LocationRow({
  label,
  headerRight,
  countryVal, onCountry,
  provinceOptions, provinceVal, onProvince,
  cityOptions, cityVal, onCity,
  locationText, onLocationTextChange,
}: {
  label: string;
  headerRight?: React.ReactNode;
  countryVal: number | ''; onCountry: (v: number | '') => void;
  provinceOptions: {id: number; name_en: string}[]; provinceVal: number | ''; onProvince: (v: number | '') => void;
  cityOptions: {id: number; name_en: string}[]; cityVal: number | ''; onCity: (v: number | '') => void;
  locationText: string; onLocationTextChange: (v: string) => void;
}) {
  const { countries } = useReferenceData();
  
  return (
    <div className="space-y-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#888174]">{label}</p>
        {headerRight}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">Country</label>
          <Select value={countryVal ? String(countryVal) : ''} onValueChange={(val) => onCountry(val ? Number(val) : '')}>
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">Province</label>
          <Select value={provinceVal ? String(provinceVal) : ''} onValueChange={(val) => onProvince(val ? Number(val) : '')} disabled={!provinceOptions.length}>
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {provinceOptions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">City</label>
          <Select value={cityVal ? String(cityVal) : ''} onValueChange={(val) => onCity(val ? Number(val) : '')} disabled={!cityOptions.length}>
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="pt-2">
        <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A8A296] mb-1.5">
          Address / Area Details
        </label>
        <input
          type="text"
          value={locationText || ''}
          onChange={(e) => onLocationTextChange(e.target.value)}
          placeholder="e.g. DHA Phase 5, Lahore"
          className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all"
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
        countryVal={data.current_country_id}
        onCountry={(v) => onChange({ ...data, current_country_id: v, current_province_id: '', current_city_id: '' })}
        provinceOptions={currentProvinces}
        provinceVal={data.current_province_id}
        onProvince={(v) => onChange({ ...data, current_province_id: v, current_city_id: '' })}
        cityOptions={currentCities}
        cityVal={data.current_city_id}
        onCity={(v) => set('current_city_id', v)}
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
                    permanent_location_text: data.current_location_text,
                  });
                } else {
                  onChange({
                    ...data,
                    permanent_country_id: '',
                    permanent_province_id: '',
                    permanent_city_id: '',
                    permanent_location_text: '',
                  });
                }
              }}
            />
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#064e3b]">Same as Current</span>
          </label>
        }
        countryVal={data.permanent_country_id}
        onCountry={(v) => onChange({ ...data, permanent_country_id: v, permanent_province_id: '', permanent_city_id: '' })}
        provinceOptions={permProvinces}
        provinceVal={data.permanent_province_id}
        onProvince={(v) => onChange({ ...data, permanent_province_id: v, permanent_city_id: '' })}
        cityOptions={permCities}
        cityVal={data.permanent_city_id}
        onCity={(v) => set('permanent_city_id', v)}
        locationText={data.permanent_location_text}
        onLocationTextChange={(v) => set('permanent_location_text', v)}
      />

      {/* Residency Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">House Status</label>
          <Select value={data.house_status || ''} onValueChange={(val) => set('house_status', val as HouseStatus)}>
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[['OWN','Own'], ['RENTED','Rented'], ['FAMILY_HOUSE','Family House'], ['OTHER','Other']].map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Property Type</label>
          <Select value={data.property_type || ''} onValueChange={(val) => set('property_type', val as PropertyType)}>
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[['HOUSE','House'], ['APARTMENT','Apartment'], ['OTHER','Other']].map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Family Setup</label>
          <Select value={data.family_setup || ''} onValueChange={(val) => set('family_setup', val as FamilySetup)}>
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[['JOINT','Joint Family'], ['SEPARATE','Separate / Nuclear']].map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Living With</label>
          <Select value={data.living_with || ''} onValueChange={(val) => set('living_with', val as LivingWith)}>
            <SelectTrigger className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] text-[#24211D] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all h-[46px] shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[['PARENTS','Parents'], ['FATHER','Father'], ['MOTHER','Mother'], ['SIBLINGS','Siblings'], ['ALONE','Alone'], ['OTHER','Other']].map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
