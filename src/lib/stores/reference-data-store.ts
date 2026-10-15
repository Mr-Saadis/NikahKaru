import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type {
  Country,
  Province,
  City,
  Religion,
  Sect,
  Caste,
  MotherTongue,
  EducationLevel,
  Occupation,
  RejectionReason,
} from '@/lib/types/database.types';

// ============================================================
// REFERENCE DATA STORE — Zustand
// ALL 10 lookup tables loaded ONCE at app init.
// After loading, ALL dropdowns/lookups read from here.
// ZERO API calls for reference data after initialization.
// ============================================================

interface ReferenceDataState {
  // Data
  countries: Country[];
  provinces: Province[];
  cities: City[];
  religions: Religion[];
  sects: Sect[];
  castes: Caste[];
  motherTongues: MotherTongue[];
  educationLevels: EducationLevel[];
  occupations: Occupation[];
  rejectionReasons: RejectionReason[];

  // State
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAll: () => Promise<void>;
  reset: () => void;

  // ============================================================
  // HELPER FUNCTIONS — Filter cached data in-memory. NO API calls.
  // ============================================================

  // Country helpers
  getCountryById: (id: number) => Country | undefined;
  getActiveCountries: () => Country[];

  // Province helpers — cascade from country
  getProvinceById: (id: number) => Province | undefined;
  getProvincesByCountry: (countryId: number) => Province[];

  // City helpers — cascade from province or country
  getCityById: (id: number) => City | undefined;
  getCitiesByProvince: (provinceId: number) => City[];
  getCitiesByCountry: (countryId: number) => City[];

  // Religion helpers
  getReligionById: (id: number) => Religion | undefined;

  // Sect helpers — cascade from religion
  getSectById: (id: number) => Sect | undefined;
  getSectsByReligion: (religionId: number) => Sect[];

  // Caste helpers
  getCasteById: (id: number) => Caste | undefined;

  // Mother tongue helpers
  getMotherTongueById: (id: number) => MotherTongue | undefined;

  // Education level helpers
  getEducationLevelById: (id: number) => EducationLevel | undefined;

  // Occupation helpers
  getOccupationById: (id: number) => Occupation | undefined;

  // Rejection reason helpers
  getRejectionReasonById: (id: number) => RejectionReason | undefined;
  getRejectionReasonByCode: (code: string) => RejectionReason | undefined;

  // Generic label resolver — get name_en for any reference ID
  resolveLabel: (table: ReferenceTableName, id: number) => string | undefined;
}

export type ReferenceTableName =
  | 'countries'
  | 'provinces'
  | 'cities'
  | 'religions'
  | 'sects'
  | 'castes'
  | 'motherTongues'
  | 'educationLevels'
  | 'occupations'
  | 'rejectionReasons';

const initialState = {
  countries: [] as Country[],
  provinces: [] as Province[],
  cities: [] as City[],
  religions: [] as Religion[],
  sects: [] as Sect[],
  castes: [] as Caste[],
  motherTongues: [] as MotherTongue[],
  educationLevels: [] as EducationLevel[],
  occupations: [] as Occupation[],
  rejectionReasons: [] as RejectionReason[],
  isLoaded: false,
  isLoading: false,
  error: null as string | null,
};

export const useReferenceDataStore = create<ReferenceDataState>((set, get) => ({
  ...initialState,

  // ============================================================
  // LOAD ALL — 10 parallel API calls, executed ONCE at app init
  // ============================================================
  loadAll: async () => {
    // Don't reload if already loaded
    if (get().isLoaded || get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();

      // All 10 queries run in PARALLEL — maximum efficiency
      const [
        countriesRes,
        provincesRes,
        citiesRes,
        religionsRes,
        sectsRes,
        castesRes,
        motherTonguesRes,
        educationLevelsRes,
        occupationsRes,
        rejectionReasonsRes,
      ] = await Promise.all([
        supabase.from('countries').select('*').eq('is_active', true).order('name_en'),
        supabase.from('provinces').select('*').eq('is_active', true).order('name_en'),
        supabase.from('cities').select('*').eq('is_active', true).order('name_en'),
        supabase.from('religions').select('*').eq('is_active', true).order('name_en'),
        supabase.from('sects').select('*').eq('is_active', true).order('name_en'),
        supabase.from('castes').select('*').eq('is_active', true).order('name_en'),
        supabase.from('mother_tongues').select('*').eq('is_active', true).order('name_en'),
        supabase
          .from('education_levels')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase.from('occupations').select('*').eq('is_active', true).order('name_en'),
        supabase.from('rejection_reasons').select('*').eq('is_active', true).order('name_en'),
      ]);

      // Check for any errors
      const errors = [
        countriesRes.error,
        provincesRes.error,
        citiesRes.error,
        religionsRes.error,
        sectsRes.error,
        castesRes.error,
        motherTonguesRes.error,
        educationLevelsRes.error,
        occupationsRes.error,
        rejectionReasonsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('Reference data load errors:', errors);
        set({
          error: `Failed to load ${errors.length} reference table(s). Some dropdowns may be empty.`,
          isLoading: false,
        });
      }

      // Store ALL data — even partial success is better than nothing
      set({
        countries: (countriesRes.data || []) as Country[],
        provinces: (provincesRes.data || []) as Province[],
        cities: (citiesRes.data || []) as City[],
        religions: (religionsRes.data || []) as Religion[],
        sects: (sectsRes.data || []) as Sect[],
        castes: (castesRes.data || []) as Caste[],
        motherTongues: (motherTonguesRes.data || []) as MotherTongue[],
        educationLevels: (educationLevelsRes.data || []) as EducationLevel[],
        occupations: (occupationsRes.data || []) as Occupation[],
        rejectionReasons: (rejectionReasonsRes.data || []) as RejectionReason[],
        isLoaded: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('Reference data load failed:', err);
      set({
        error: 'Failed to load reference data. Please refresh the page.',
        isLoading: false,
      });
    }
  },

  // Reset — only used if admin changes reference data (very rare)
  reset: () => set({ ...initialState }),

  // ============================================================
  // HELPER FUNCTIONS — All operate on cached data. ZERO API calls.
  // ============================================================

  // Country
  getCountryById: (id) => get().countries.find((c) => Number(c.id) === Number(id)),
  getActiveCountries: () => get().countries,

  // Province — cascade from country
  getProvinceById: (id) => get().provinces.find((p) => Number(p.id) === Number(id)),
  getProvincesByCountry: (countryId) =>
    get().provinces.filter((p) => Number(p.country_id) === Number(countryId)),

  // City — cascade from province or country
  getCityById: (id) => get().cities.find((c) => Number(c.id) === Number(id)),
  getCitiesByProvince: (provinceId) =>
    get().cities.filter((c) => Number(c.province_id) === Number(provinceId)),
  getCitiesByCountry: (countryId) =>
    get().cities.filter((c) => Number(c.country_id) === Number(countryId)),

  // Religion
  getReligionById: (id) => get().religions.find((r) => Number(r.id) === Number(id)),

  // Sect — cascade from religion
  getSectById: (id) => get().sects.find((s) => Number(s.id) === Number(id)),
  getSectsByReligion: (religionId) =>
    get().sects.filter((s) => Number(s.religion_id) === Number(religionId)),

  // Caste
  getCasteById: (id) => get().castes.find((c) => Number(c.id) === Number(id)),

  // Mother tongue
  getMotherTongueById: (id) => get().motherTongues.find((m) => m.id === id),

  // Education level
  getEducationLevelById: (id) => get().educationLevels.find((e) => e.id === id),

  // Occupation
  getOccupationById: (id) => get().occupations.find((o) => o.id === id),

  // Rejection reason
  getRejectionReasonById: (id) => get().rejectionReasons.find((r) => r.id === id),
  getRejectionReasonByCode: (code) => get().rejectionReasons.find((r) => r.code === code),

  // Generic label resolver
  resolveLabel: (table, id) => {
    const state = get();
    const item = (state[table] as Array<{ id: number; name_en: string }>).find(
      (entry) => entry.id === id
    );
    return item?.name_en;
  },
}));
