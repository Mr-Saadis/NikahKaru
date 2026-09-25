import { useReferenceDataStore, type ReferenceTableName } from '@/lib/stores/reference-data-store';
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
// useReferenceData Hook — Access cached reference data
// ALL reads from Zustand store. ZERO API calls.
//
// Usage:
//   const { countries, getProvincesByCountry, getCitiesByProvince } = useReferenceData();
//
// Cascade dropdowns (country → province → city) ALL work
// from cached in-memory data. No API call needed.
// ============================================================

export function useReferenceData() {
  // Data arrays
  const countries = useReferenceDataStore((s) => s.countries);
  const provinces = useReferenceDataStore((s) => s.provinces);
  const cities = useReferenceDataStore((s) => s.cities);
  const religions = useReferenceDataStore((s) => s.religions);
  const sects = useReferenceDataStore((s) => s.sects);
  const castes = useReferenceDataStore((s) => s.castes);
  const motherTongues = useReferenceDataStore((s) => s.motherTongues);
  const educationLevels = useReferenceDataStore((s) => s.educationLevels);
  const occupations = useReferenceDataStore((s) => s.occupations);
  const rejectionReasons = useReferenceDataStore((s) => s.rejectionReasons);

  // State
  const isLoaded = useReferenceDataStore((s) => s.isLoaded);
  const isLoading = useReferenceDataStore((s) => s.isLoading);
  const error = useReferenceDataStore((s) => s.error);

  // ID-based lookups
  const getCountryById = useReferenceDataStore((s) => s.getCountryById);
  const getProvinceById = useReferenceDataStore((s) => s.getProvinceById);
  const getCityById = useReferenceDataStore((s) => s.getCityById);
  const getReligionById = useReferenceDataStore((s) => s.getReligionById);
  const getSectById = useReferenceDataStore((s) => s.getSectById);
  const getCasteById = useReferenceDataStore((s) => s.getCasteById);
  const getMotherTongueById = useReferenceDataStore((s) => s.getMotherTongueById);
  const getEducationLevelById = useReferenceDataStore((s) => s.getEducationLevelById);
  const getOccupationById = useReferenceDataStore((s) => s.getOccupationById);
  const getRejectionReasonById = useReferenceDataStore((s) => s.getRejectionReasonById);
  const getRejectionReasonByCode = useReferenceDataStore((s) => s.getRejectionReasonByCode);

  // Cascade filters (in-memory, ZERO API calls)
  const getProvincesByCountry = useReferenceDataStore((s) => s.getProvincesByCountry);
  const getCitiesByProvince = useReferenceDataStore((s) => s.getCitiesByProvince);
  const getCitiesByCountry = useReferenceDataStore((s) => s.getCitiesByCountry);
  const getSectsByReligion = useReferenceDataStore((s) => s.getSectsByReligion);

  // Generic label resolver
  const resolveLabel = useReferenceDataStore((s) => s.resolveLabel);

  return {
    // Raw data arrays (for iteration / dropdowns)
    countries,
    provinces,
    cities,
    religions,
    sects,
    castes,
    motherTongues,
    educationLevels,
    occupations,
    rejectionReasons,

    // State
    isLoaded,
    isLoading,
    error,

    // ID-based lookups (for resolving display labels)
    getCountryById,
    getProvinceById,
    getCityById,
    getReligionById,
    getSectById,
    getCasteById,
    getMotherTongueById,
    getEducationLevelById,
    getOccupationById,
    getRejectionReasonById,
    getRejectionReasonByCode,

    // Cascade filters (for dependent dropdowns)
    getProvincesByCountry,
    getCitiesByProvince,
    getCitiesByCountry,
    getSectsByReligion,

    // Generic resolver
    resolveLabel,
  };
}

// Re-export types for convenience
export type {
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
  ReferenceTableName,
};
