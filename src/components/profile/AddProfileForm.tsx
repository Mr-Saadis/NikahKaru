'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProfileService } from '@/lib/services/profile-service';
import { PreferenceService } from '@/lib/services/preference-service';
import { createClient } from '@/lib/supabase/client';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { clearDirectoryCache } from '@/lib/directory/directory-cache';
import { useDashboardCacheStore } from '@/lib/stores/dashboard-cache-store';
import { logProfileEditAction } from '@/lib/actions/audit';
import { toast } from 'sonner';
import ProfileSidebar from './ProfileSidebar';
import Step1BasicInfo, { type Step1Data } from './steps/Step1BasicInfo';
import Step2MaritalPhysical, { type Step2Data } from './steps/Step2MaritalPhysical';
import Step3EducationProfession, { type Step3Data } from './steps/Step3EducationProfession';
import Step4ReligionCulture, { type Step4Data } from './steps/Step4ReligionCulture';
import Step5LocationResidency, { type Step5Data } from './steps/Step5LocationResidency';
import Step6FamilyDetails, { type Step6Data } from './steps/Step6FamilyDetails';
import Step7Lifestyle, { type Step7Data } from './steps/Step7Lifestyle';
import Step8Preferences, { type Step8Data } from './steps/Step8Preferences';
import Step9Review from './steps/Step9Review';
import { ArrowLeft, ArrowRight, Save, Loader2, AlertTriangle, X, ShieldCheck } from 'lucide-react';

// ── Step config ────────────────────────────────────────────────
const STEPS = [
  { id: 1, name: 'Basic Information', shortName: 'Basic' },
  { id: 2, name: 'Physical', shortName: 'Physical' },
  { id: 3, name: 'Education & Profession', shortName: 'Education' },
  { id: 4, name: 'Religion & Culture', shortName: 'Religion' },
  { id: 5, name: 'Location & Residency', shortName: 'Location' },
  { id: 6, name: 'Family Details', shortName: 'Family' },
  { id: 7, name: 'Lifestyle', shortName: 'Lifestyle' },
  { id: 8, name: 'Partner Preferences', shortName: 'Prefs' },
  { id: 9, name: 'Review & Confirm', shortName: 'Review' },
];

const SIDEBAR_STEPS = STEPS.map((s) => ({
  id: s.id,
  name: s.name,
  description: [
    'Name, gender, DOB, marital status',
    'Height, weight, complexion',
    'Degrees, jobs, income',
    'Religion, sect, caste',
    'Current & permanent address',
    'Parents, siblings, background',
    'Practice, beard/hijab, smoking',
    'Must-have & preferred criteria',
    'Confirm all details and save',
  ][s.id - 1],
}));

// ── Default form state ─────────────────────────────────────────
const defaultStep1 = (): Step1Data => ({ gender: '', full_name: '', cnic: '', phone: '', date_of_birth: '', marital_status: 'NEVER_MARRIED', number_of_children: '', children_living_with: '', nationality_country_id: '', multiple_nationality: false, mother_tongue_id: '', profile_picture: '', children: [], previous_marriages: [] });
const defaultStep2 = (): Step2Data => ({ height_cm: '', weight_kg: '', complexion: '', has_disability: false, disability_details: '' });
const defaultStep3 = (): Step3Data => ({ education_records: [], employment_records: [], monthly_income_min: '', monthly_income_max: '' });
const defaultStep4 = (): Step4Data => ({ religion_id: 1, sect_id: '', caste_id: '', other_caste_text: '' });
const defaultStep5 = (): Step5Data => ({ current_country_id: '', current_province_id: '', current_city_id: '', permanent_country_id: '', permanent_province_id: '', permanent_city_id: '', current_location_text: '', permanent_location_text: '', house_status: '', property_type: '', family_setup: '', living_with: '', living_with_other_details: '' });
const defaultStep6 = (): Step6Data => ({ parents: [], siblings: [], family_profession_business: '', social_background: '', family_values: '', family_introduction: '', important_family_circumstances: '', additional_details: '' });
const defaultStep7 = (): Step7Data => ({ beard: '', hijab: '', religious_practice: '', smoking: '', other_lifestyle_information: '', willing_to_relocate: '', preferred_country_id: '', preferred_province_id: '', preferred_city_id: '', relocation_details: '' });
const defaultStep8 = (): Step8Data => ({ pref_min_age: '', pref_max_age: '', pref_age_importance: '', pref_marital_status: '', pref_marital_importance: '', pref_children_allowed: '', pref_children_importance: '', pref_min_height: '', pref_max_height: '', pref_height_importance: '', pref_min_weight: '', pref_max_weight: '', pref_weight_importance: '', pref_complexion: '', pref_complexion_importance: '', pref_disability_allowed: '', pref_disability_importance: '', pref_beard: '', pref_beard_importance: '', pref_hijab: '', pref_hijab_importance: '', pref_education_level_id: '', pref_education_importance: '', pref_field_of_study: '', pref_field_importance: '', pref_occupation_id: '', pref_occupation_importance: '', pref_employment_type: '', pref_employment_type_importance: '', pref_min_income: '', pref_max_income: '', pref_income_importance: '', pref_religion_id: 1, pref_religion_importance: '', pref_sect_id: '', pref_sect_importance: '', pref_caste_id: '', pref_caste_importance: '', pref_religious_practice: '', pref_religious_practice_importance: '', pref_location_country_importance: '', pref_location_province_importance: '', pref_location_city_importance: '', pref_locations: [], pref_family_setup: '', pref_family_setup_importance: '', pref_living_with: '', pref_living_with_importance: '', pref_parents_status: '', pref_parents_status_importance: '', pref_smoking: '', pref_smoking_importance: '', pref_additional_lifestyle: '', pref_willing_to_relocate_required: '', pref_relocation_importance: '', pref_relocations: [] });

function mergeNonEmptyLocal<T extends Record<string, any>>(
  dbState: T,
  localState?: Record<string, any> | null
): T {
  if (!localState) return dbState;
  const next = { ...dbState };
  for (const key of Object.keys(localState) as Array<keyof T>) {
    const val = localState[key as string];
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    next[key] = val;
  }
  return next;
}

const normOptStr = (v: unknown): string | null =>
  typeof v === 'string' ? (v.trim() || null) : v == null ? null : String(v);

function dedupeEducationRecords<T extends Record<string, any>>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of list) {
    const key = JSON.stringify([
      r.education_level_id ? Number(r.education_level_id) : null,
      normOptStr(r.qualification),
      normOptStr(r.institution_name),
      normOptStr(r.field_of_study),
      r.start_year ? Number(r.start_year) : null,
      r.end_year ? Number(r.end_year) : null,
      Boolean(r.is_highest_qualification),
      normOptStr(r.details),
    ]);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

function dedupeEmploymentRecords<T extends Record<string, any>>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of list) {
    const key = JSON.stringify([
      r.occupation_id ? Number(r.occupation_id) : null,
      normOptStr(r.job_title),
      normOptStr(r.organization_name),
      normOptStr(r.employment_type),
      r.start_date || null,
      r.is_current ? null : (r.end_date || null),
      Boolean(r.is_current),
      normOptStr(r.details),
    ]);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

function dedupePreferredLocations<T extends Record<string, any>>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const l of list) {
    const key = `${Number(l.country_id)}|${l.province_id ? Number(l.province_id) : ''}|${l.city_id ? Number(l.city_id) : ''}|${Boolean(l.is_excluded)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(l);
    }
  }
  return out;
}

function mergeStep3Local(prev: Step3Data, localStep3: Record<string, any>): Step3Data {
  const merged = mergeNonEmptyLocal(prev, localStep3);
  return {
    ...merged,
    education_records: dedupeEducationRecords(merged.education_records || []),
    employment_records: dedupeEmploymentRecords(merged.employment_records || []),
  };
}

function mergeStep8Local(prev: Step8Data, localStep8: Record<string, any>): Step8Data {
  const merged = mergeNonEmptyLocal(prev, localStep8);
  return {
    ...merged,
    pref_locations: dedupePreferredLocations(merged.pref_locations || []),
    pref_relocations: dedupePreferredLocations(merged.pref_relocations || []),
  };
}

const UNLOADED_SENTINEL = '__UNLOADED__';

const cleanEnumVal = <T,>(v: T): Exclude<T, ''> | null =>
  !v || (v as any) === 'none' || (v as any) === 'DOES_NOT_MATTER' ? null : (v as Exclude<T, ''>);

function joinOverseasLocation(
  cityText?: string,
  provinceText?: string,
  locationText?: string
): string | null {
  const rawParts = [cityText, provinceText, locationText]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  if (rawParts.length === 0) return null;

  // Split comma-separated tokens and deduplicate adjacent/leading duplicate tokens case-insensitively
  const tokens: string[] = [];
  const seenPrefix = new Set<string>();
  for (const part of rawParts) {
    for (const seg of part.split(',')) {
      const t = seg.trim();
      if (!t) continue;
      const lower = t.toLowerCase();
      if (seenPrefix.has(lower)) continue;
      seenPrefix.add(lower);
      tokens.push(t);
    }
  }
  return tokens.length > 0 ? tokens.join(', ') : null;
}

const isValidCnic = (cnic?: string): boolean => (cnic || '').replace(/\D/g, '').length === 13;
const isValidPhone = (phone?: string): boolean => (phone || '').replace(/\D/g, '').length >= 10;

type CnicCheckStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'error';
type DuplicateCnicInfo = { full_name: string; status: string | null } | null;

export default function AddProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role } = useAuth();

  const urlProfileId =
    searchParams.get('draftId') ||
    searchParams.get('edit') ||
    searchParams.get('profileId');
  const urlEditParam = searchParams.get('edit');
  const urlStepParam = searchParams.get('step');

  const [profileId, setProfileId] = useState<string | null>(urlProfileId);
  const profileIdRef = useRef<string | null>(urlProfileId);
  const loadedProfileIdRef = useRef<string | null>(UNLOADED_SENTINEL);
  const skipReloadForIdRef = useRef<string | null>(null);
  const isEditingRef = useRef<boolean>(Boolean(urlEditParam));
  const initialProfileStatusRef = useRef<string>('DRAFT');



  // Helper to get user-scoped & profile-specific localStorage key to prevent leakage on shared machines
  const getLocalStorageKey = (pid: string | null) => {
    const userScope = user?.id ? `${user.id}_` : '';
    return `nikahkaru_draft_${userScope}${pid || 'new'}`;
  };

  const initialStepNum = urlStepParam
    ? Math.min(Math.max(1, parseInt(urlStepParam, 10)), 9)
    : 1;
  const [currentStep, setCurrentStep] = useState(initialStepNum);


  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState<{ stepId: number; stepName: string; missingFields: string[] }[]>([]);
  const [isConfirmedAccuracy, setIsConfirmedAccuracy] = useState(false);
  const [cnicStatus, setCnicStatus] = useState<CnicCheckStatus>('idle');
  const [duplicateCnicInfo, setDuplicateCnicInfo] = useState<DuplicateCnicInfo>(null);
  const cnicStatusRef = useRef<CnicCheckStatus>('idle');
  cnicStatusRef.current = cnicStatus;

  // Step data states
  const [step1, setStep1] = useState<Step1Data>(defaultStep1);
  const [step2, setStep2] = useState<Step2Data>(defaultStep2);
  const [step3, setStep3] = useState<Step3Data>(defaultStep3);
  const [step4, setStep4] = useState<Step4Data>(defaultStep4);
  const [step5, setStep5] = useState<Step5Data>(defaultStep5);
  const [step6, setStep6] = useState<Step6Data>(defaultStep6);
  const [step7, setStep7] = useState<Step7Data>(defaultStep7);
  const [step8, setStep8] = useState<Step8Data>(defaultStep8);

  const formData = useMemo(() => ({
    step1, step2, step3, step4, step5, step6, step7, step8
  }), [step1, step2, step3, step4, step5, step6, step7, step8]);

  // Real-time duplicate CNIC verification (debounced)
  useEffect(() => {
    if (!isInitialLoadDone) return;

    const digits = (step1.cnic || '').replace(/\D/g, '');
    if (digits.length < 13) {
      setCnicStatus('idle');
      setDuplicateCnicInfo(null);
      setError((prev) => (prev?.includes('CNIC') ? null : prev));
      return;
    }

    const controller = new AbortController();
    setCnicStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ cnic: step1.cnic });
        if (profileId) params.set('excludeProfileId', profileId);

        const res = await fetch(`/api/profiles/check-cnic?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setCnicStatus('error');
          setDuplicateCnicInfo(null);
          return;
        }
        const json = await res.json();
        if (controller.signal.aborted) return;

        if (json.exists) {
          setCnicStatus('duplicate');
          setDuplicateCnicInfo(json.existingProfile || { full_name: 'Existing Profile', status: null });
        } else {
          setCnicStatus('available');
          setDuplicateCnicInfo(null);
          setError((prev) => (prev?.includes('CNIC') ? null : prev));
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setCnicStatus('error');
        setDuplicateCnicInfo(null);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [step1.cnic, profileId, isInitialLoadDone]);

  // Ref to expose getStepStats to auto-save callback (defined later in component)
  const getStepStatsRef = useRef<((stepId: number) => { completed: number; total: number; mandatoryComplete: boolean }) | null>(null);

  // Sync URL query params (draftId / edit / profileId / step) when navigating while mounted
  useEffect(() => {
    if (urlProfileId === profileIdRef.current) return;

    setIsInitialLoadDone(false);
    loadedProfileIdRef.current = UNLOADED_SENTINEL;
    setStep1(defaultStep1());
    setStep2(defaultStep2());
    setStep3(defaultStep3());
    setStep4(defaultStep4());
    setStep5(defaultStep5());
    setStep6(defaultStep6());
    setStep7(defaultStep7());
    setStep8(defaultStep8());
    setCompletedSteps(new Set());
    setError(null);
    setIsConfirmedAccuracy(false);

    isEditingRef.current = Boolean(urlEditParam);
    initialProfileStatusRef.current = 'DRAFT';
    setCurrentStep(urlStepParam ? Math.min(Math.max(1, parseInt(urlStepParam, 10)), 9) : 1);
    profileIdRef.current = urlProfileId;
    setProfileId(urlProfileId);
  }, [urlProfileId, urlEditParam, urlStepParam]);

  // Initial load recovery — DB + localStorage merge (localStorage = unsaved changes, takes priority)
  useEffect(() => {
    let isMounted = true;
    profileIdRef.current = profileId;

    if (profileId && skipReloadForIdRef.current === profileId) {
      skipReloadForIdRef.current = null;
      loadedProfileIdRef.current = profileId;
      setIsInitialLoadDone(true);
      return;
    }

    setIsInitialLoadDone(false);
    loadedProfileIdRef.current = UNLOADED_SENTINEL;

    // Read localStorage data upfront for merge after DB load
    const localKey = getLocalStorageKey(profileId);
    let localData: Record<string, any> | null = null;
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) localData = JSON.parse(raw);
    } catch (_) { /* ignore parse errors */ }

    if (profileId) {
      const loadDraft = async () => {
        try {
          console.log('loadDraft: Fetching profile for ID', profileId);
          const [profile, prefs] = await Promise.all([
            ProfileService.getProfileById(profileId),
            PreferenceService.getCurrentPreferences(profileId).catch((err) => {
              console.warn('Failed to load preferences for draft:', err);
              return null;
            }),
          ]);
          console.log('loadDraft: Profile fetched:', profile);

          if (!isMounted) return;
          initialProfileStatusRef.current = profile.status || 'DRAFT';

          // Step 1
          if (profile.personal_information) {
            const pi = Array.isArray(profile.personal_information) ? profile.personal_information[0] : profile.personal_information;
            if (pi) {
              setStep1(prev => ({
                ...prev,
                gender: profile.gender || '',
                profile_picture: profile.profile_URL || undefined,
                full_name: pi.full_name || '',
                cnic: pi.cnic || '',
                phone: pi.phone || localData?.step1?.phone || '',
                date_of_birth: pi.date_of_birth ? pi.date_of_birth.split('T')[0] : '',
                marital_status: pi.marital_status || 'NEVER_MARRIED',
                number_of_children: pi.number_of_children?.toString() || '',
                nationality_country_id: pi.nationality_country_id?.toString() || '',
                multiple_nationality: Boolean(pi.multiple_nationality ?? localData?.step1?.multiple_nationality ?? false),
                mother_tongue_id: pi.mother_tongue_id?.toString() || '',
                children: (profile.children || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID(), age: r.age != null ? String(r.age) : '', living_with_profile: r.living_with_profile ? 'YES' : 'NO' })),
                previous_marriages: (profile.previous_marriages || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID(), marriage_year: r.marriage_year != null ? String(r.marriage_year) : '', end_year: r.end_year != null ? String(r.end_year) : '', children_count: r.children_count != null ? String(r.children_count) : '0', children_live_with_profile: r.children_live_with_profile ? 'YES' : 'NO' }))
              }));
            }
          } else {
            setStep1(prev => ({ ...prev, gender: profile.gender || '', profile_picture: profile.profile_URL || undefined }));
          }

          // Step 2
          if (profile.physical_information) {
            const phi = Array.isArray(profile.physical_information) ? profile.physical_information[0] : profile.physical_information;
            if (phi) {
              setStep2(prev => ({
                ...prev,
                height_cm: phi.height_cm?.toString() || '',
                weight_kg: phi.weight_kg?.toString() || '',
                complexion: phi.complexion || '',
                has_disability: phi.has_disability || false,
                disability_details: phi.disability_details || ''
              }));
            }
          }

          // Step 3
          if (profile.education_records || profile.employment_records || profile.income_information) {
            const inc = Array.isArray(profile.income_information) ? profile.income_information[0] : profile.income_information;
            setStep3(prev => ({
              ...prev,
              education_records: dedupeEducationRecords(
                (profile.education_records || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID() }))
              ),
              employment_records: dedupeEmploymentRecords(
                (profile.employment_records || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID() }))
              ),
              monthly_income_min: inc?.monthly_income_min?.toString() || '',
              monthly_income_max: inc?.monthly_income_max?.toString() || '',
            }));
          }

          // Step 4
          if (profile.religion_information) {
            const ri = Array.isArray(profile.religion_information) ? profile.religion_information[0] : profile.religion_information;
            if (ri) {
              setStep4(prev => ({
                ...prev,
                religion_id: ri.religion_id || 1,
                sect_id: ri.sect_id?.toString() || '',
                caste_id: ri.caste_id?.toString() || '',
                other_caste_text: ri.other_caste_text || ''
              }));
            }
          }

          // Step 5
          if (profile.profile_locations || profile.residency_information) {
            const pl = Array.isArray(profile.profile_locations) ? profile.profile_locations[0] : (profile.profile_locations || {});
            const res = Array.isArray(profile.residency_information) ? profile.residency_information[0] : (profile.residency_information || {});
            setStep5(prev => ({
              ...prev,
              current_country_id: pl?.current_country_id ? Number(pl.current_country_id) : '',
              current_province_id: pl?.current_province_id ? Number(pl.current_province_id) : '',
              current_city_id: pl?.current_city_id ? Number(pl.current_city_id) : '',
              permanent_country_id: pl?.permanent_country_id ? Number(pl.permanent_country_id) : '',
              permanent_province_id: pl?.permanent_province_id ? Number(pl.permanent_province_id) : '',
              permanent_city_id: pl?.permanent_city_id ? Number(pl.permanent_city_id) : '',
              current_location_text: pl?.current_location_text || '',
              permanent_location_text: pl?.permanent_location_text || '',
              house_status: res?.house_status || '',
              property_type: res?.property_type || '',
              family_setup: res?.family_setup || '',
              living_with: res?.living_with || '',
              living_with_other_details: res?.living_with_other_details || ''
            }));
          }

          // Step 6
          if (profile.parents || profile.siblings || profile.family_information) {
            const fi = Array.isArray(profile.family_information) ? profile.family_information[0] : (profile.family_information || {});
            setStep6(prev => ({
              ...prev,
              parents: (profile.parents || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID(), full_name: r.full_name || '', age: r.age != null ? String(r.age) : '', profession: r.profession || '', education: r.education || '', country_id: r.country_id?.toString() || '', city_id: r.city_id?.toString() || '', living_arrangement: r.living_arrangement || '', social_background: r.social_background || '', additional_details: r.additional_details || '' })),
              siblings: (profile.siblings || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID(), full_name: r.full_name || '', age: r.age != null ? String(r.age) : '', marital_status: r.marital_status || '', profession: r.profession || '', education: r.education || '', country_id: r.country_id?.toString() || '', city_id: r.city_id?.toString() || '' })),
              family_profession_business: fi?.family_profession_business || '',
              social_background: fi?.social_background || '',
              family_values: fi?.family_values || '',
              family_introduction: fi?.family_introduction || '',
              important_family_circumstances: fi?.important_family_circumstances || '',
              additional_details: fi?.additional_details || ''
            }));
          }

          // Step 7
          if (profile.lifestyle_information || profile.relocation_information) {
            const li = Array.isArray(profile.lifestyle_information) ? profile.lifestyle_information[0] : (profile.lifestyle_information || {});
            const ri = Array.isArray(profile.relocation_information) ? profile.relocation_information[0] : (profile.relocation_information || {});
            setStep7(prev => ({
              ...prev,
              beard: li?.beard || '',
              hijab: li?.hijab || '',
              religious_practice: li?.religious_practice || '',
              smoking: li?.smoking || '',
              other_lifestyle_information: li?.other_lifestyle_information || '',
              willing_to_relocate: ri?.willing_to_relocate || '',
              preferred_country_id: ri?.preferred_country_id?.toString() || '',
              preferred_province_id: ri?.preferred_province_id?.toString() || '',
              preferred_city_id: ri?.preferred_city_id?.toString() || '',
              relocation_details: ri?.relocation_details || ''
            }));
          }

          // Step 8
          if (prefs) {
            setStep8(prev => ({
              ...prev,
              ...(prefs.basic && {
                pref_min_age: prefs.basic.min_age || '',
                pref_max_age: prefs.basic.max_age || '',
                pref_age_importance: prefs.basic.age_importance || 'DOES_NOT_MATTER',
                pref_marital_status: prefs.basic.preferred_marital_status || '',
                pref_marital_importance: prefs.basic.marital_status_importance || 'DOES_NOT_MATTER',
                pref_children_allowed: prefs.basic.children_allowed || '',
                pref_children_importance: prefs.basic.children_importance || 'DOES_NOT_MATTER',
              }),
              ...(prefs.physical && {
                pref_min_height: prefs.physical.min_height_cm || '',
                pref_max_height: prefs.physical.max_height_cm || '',
                pref_height_importance: prefs.physical.height_importance || 'DOES_NOT_MATTER',
                pref_disability_allowed: prefs.physical.disability_allowed || '',
                pref_disability_importance: prefs.physical.disability_importance || 'DOES_NOT_MATTER',
                pref_min_weight: prefs.physical.min_weight_kg || '',
                pref_max_weight: prefs.physical.max_weight_kg || '',
                pref_weight_importance: prefs.physical.weight_importance || 'DOES_NOT_MATTER',
                pref_complexion: prefs.physical.preferred_complexion || '',
                pref_complexion_importance: prefs.physical.complexion_importance || 'DOES_NOT_MATTER',
                pref_beard: prefs.physical.beard_preference || '',
                pref_beard_importance: prefs.physical.beard_importance || 'DOES_NOT_MATTER',
                pref_hijab: prefs.physical.hijab_preference || '',
                pref_hijab_importance: prefs.physical.hijab_importance || 'DOES_NOT_MATTER',
              }),
              ...(prefs.education && {
                pref_education_level_id: prefs.education.minimum_education_level_id || '',
                pref_education_importance: prefs.education.education_importance || 'DOES_NOT_MATTER',
                pref_field_of_study: prefs.education.preferred_field_of_study || '',
                pref_field_importance: prefs.education.field_importance || 'DOES_NOT_MATTER',
              }),
              ...(prefs.profession && {
                pref_occupation_id: prefs.profession.preferred_occupation_id || '',
                pref_occupation_importance: prefs.profession.occupation_importance || 'DOES_NOT_MATTER',
                pref_employment_type: prefs.profession.preferred_employment_type || '',
                pref_employment_type_importance: prefs.profession.employment_type_importance || 'DOES_NOT_MATTER',
                pref_min_income: prefs.profession.minimum_monthly_income || '',
                pref_max_income: prefs.profession.maximum_monthly_income || '',
                pref_income_importance: prefs.profession.income_importance || 'DOES_NOT_MATTER',
              }),
              ...(prefs.religion && {
                pref_religion_id: prefs.religion.religion_id || 1,
                pref_religion_importance: prefs.religion.religion_importance || 'DOES_NOT_MATTER',
                pref_sect_id: prefs.religion.sect_id || '',
                pref_sect_importance: prefs.religion.sect_importance || 'DOES_NOT_MATTER',
                pref_caste_id: prefs.religion.caste_id || '',
                pref_caste_importance: prefs.religion.caste_importance || 'DOES_NOT_MATTER',
                pref_religious_practice: prefs.religion.religious_practice || '',
                pref_religious_practice_importance: prefs.religion.religious_practice_importance || 'DOES_NOT_MATTER',
              }),
              ...(prefs.location && {
                pref_location_country_importance: prefs.location.country_importance || 'DOES_NOT_MATTER',
                pref_location_province_importance: prefs.location.province_importance || 'DOES_NOT_MATTER',
                pref_location_city_importance: prefs.location.city_importance || 'DOES_NOT_MATTER',
              }),
              pref_locations: dedupePreferredLocations(
                (prefs.preferredLocations || []).map((l: any) => ({
                  ...l,
                  _tempId: l.id || crypto.randomUUID(),
                  country_id: Number(l.country_id),
                  province_id: l.province_id ? Number(l.province_id) : null,
                  city_id: l.city_id ? Number(l.city_id) : null,
                  is_excluded: Boolean(l.is_excluded),
                }))
              ),
              ...(prefs.family && {
                pref_family_setup: prefs.family.family_setup || '',
                pref_family_setup_importance: prefs.family.family_setup_importance || 'DOES_NOT_MATTER',
                pref_living_with: prefs.family.living_with || '',
                pref_living_with_importance: prefs.family.living_with_importance || 'DOES_NOT_MATTER',
                pref_parents_status: prefs.family.parents_status_preference || '',
                pref_parents_status_importance: prefs.family.parents_status_importance || 'DOES_NOT_MATTER',
              }),
              ...(prefs.lifestyle && {
                pref_smoking: prefs.lifestyle.smoking || '',
                pref_smoking_importance: prefs.lifestyle.smoking_importance || 'DOES_NOT_MATTER',
                pref_additional_lifestyle: prefs.lifestyle.additional_preferences || '',
              }),
              ...(prefs.relocation && {
                pref_willing_to_relocate_required: prefs.relocation.willing_to_relocate_required || '',
                pref_relocation_importance: prefs.relocation.relocation_importance || 'DOES_NOT_MATTER',
              }),
              pref_relocations: dedupePreferredLocations(
                (prefs.preferredRelocations || []).map((l: any) => ({
                  ...l,
                  _tempId: l.id || crypto.randomUUID(),
                  country_id: Number(l.country_id),
                  province_id: l.province_id ? Number(l.province_id) : null,
                  city_id: l.city_id ? Number(l.city_id) : null,
                  is_excluded: Boolean(l.is_excluded),
                }))
              )
            }));
          }
          if (localData) {
            if (localData.step1) setStep1(prev => mergeNonEmptyLocal(prev, localData!.step1));
            if (localData.step2) setStep2(prev => mergeNonEmptyLocal(prev, localData!.step2));
            if (localData.step3) setStep3(prev => mergeStep3Local(prev, localData!.step3));
            if (localData.step4) setStep4(prev => mergeNonEmptyLocal(prev, localData!.step4));
            if (localData.step5) setStep5(prev => mergeNonEmptyLocal(prev, localData!.step5));
            if (localData.step6) setStep6(prev => mergeNonEmptyLocal(prev, localData!.step6));
            if (localData.step7) setStep7(prev => mergeNonEmptyLocal(prev, localData!.step7));
            if (localData.step8) setStep8(prev => mergeStep8Local(prev, localData!.step8));
          }

          // Auto-resume to the next step if not explicitly forced via step query param
          if (!urlStepParam) {
            let resumeStep = 1;
            if (profile.personal_information) resumeStep = 2;
            if (profile.physical_information) resumeStep = 3;
            if ((profile.education_records && profile.education_records.length > 0) || (profile.employment_records && profile.employment_records.length > 0)) resumeStep = 4;
            if (profile.religion_information) resumeStep = 5;
            if (profile.profile_locations || profile.residency_information) resumeStep = 6;
            if (profile.family_information || (profile.parents && profile.parents.length > 0)) resumeStep = 7;
            if (profile.lifestyle_information) resumeStep = 8;
            if (localData?.currentStep && localData.currentStep > resumeStep) {
              resumeStep = localData.currentStep;
            }
            setCurrentStep(resumeStep);
          }
        } catch (e: any) {
          console.error('Failed to load draft from DB', e);
          if (isMounted) {
            setError(e?.message || 'Failed to load saved draft.');
          }
          if (localData) {
            if (localData.step1) setStep1(prev => mergeNonEmptyLocal(prev, localData!.step1));
            if (localData.step2) setStep2(prev => mergeNonEmptyLocal(prev, localData!.step2));
            if (localData.step3) setStep3(prev => mergeStep3Local(prev, localData!.step3));
            if (localData.step4) setStep4(prev => mergeNonEmptyLocal(prev, localData!.step4));
            if (localData.step5) setStep5(prev => mergeNonEmptyLocal(prev, localData!.step5));
            if (localData.step6) setStep6(prev => mergeNonEmptyLocal(prev, localData!.step6));
            if (localData.step7) setStep7(prev => mergeNonEmptyLocal(prev, localData!.step7));
            if (localData.step8) setStep8(prev => mergeStep8Local(prev, localData!.step8));
          }
        } finally {
          if (isMounted) {
            loadedProfileIdRef.current = profileId;
            setIsInitialLoadDone(true);
          }
        }
      };

      loadDraft();
    } else {
      // No profileId — new profile, load from localStorage
      if (localData) {
        try {
          if (localData.step1) setStep1(prev => mergeNonEmptyLocal(prev, localData!.step1));
          if (localData.step2) setStep2(prev => mergeNonEmptyLocal(prev, localData!.step2));
          if (localData.step3) setStep3(prev => mergeStep3Local(prev, localData!.step3));
          if (localData.step4) setStep4(prev => mergeNonEmptyLocal(prev, localData!.step4));
          if (localData.step5) setStep5(prev => mergeNonEmptyLocal(prev, localData!.step5));
          if (localData.step6) setStep6(prev => mergeNonEmptyLocal(prev, localData!.step6));
          if (localData.step7) setStep7(prev => mergeNonEmptyLocal(prev, localData!.step7));
          if (localData.step8) setStep8(prev => mergeStep8Local(prev, localData!.step8));
        } catch (e) {
          console.error('Failed to recover from local storage', e);
        }
      }
      initialProfileStatusRef.current = 'DRAFT';
      loadedProfileIdRef.current = null;
      setIsInitialLoadDone(true);
    }
    return () => { isMounted = false; };
  }, [profileId]);

  // Instant LocalStorage save on any change (guarded: only after initial load for current profileId completes)
  useEffect(() => {
    if (!isInitialLoadDone || loadedProfileIdRef.current !== profileId) return;
    // Exclude profile_picture_file from local storage to save space
    const dataToSave = { ...formData, currentStep };
    if (dataToSave.step1.profile_picture_file) {
      dataToSave.step1 = { ...dataToSave.step1, profile_picture_file: undefined };
    }
    const key = getLocalStorageKey(profileId);
    localStorage.setItem(key, JSON.stringify(dataToSave));
  }, [formData, profileId, isInitialLoadDone]);

  // AutoSave to DB with flush capability
  const {
    flush: flushAutoSave,
    cancel: cancelAutoSave,
    waitForIdle: waitForAutoSaveIdle,
    markSaved: markAutoSaveSaved,
  } = useAutoSave({
    data: formData,
    enabled: !!profileId && isInitialLoadDone, // Only auto-save after initial data load completes
    delay: 1500,
    onSave: async (data, dirtyKeys) => {
      if (!profileId) return;
      console.log('Auto-saving dirty steps to DB:', dirtyKeys);

      const pid = profileId;
      const tasks = [];

      if (dirtyKeys.includes('step1') && cnicStatusRef.current !== 'duplicate') {
        const isNeverMarried = !data.step1.marital_status || data.step1.marital_status === 'NEVER_MARRIED';
        const hasChildren = !isNeverMarried && Number(data.step1.number_of_children) > 0;
        if (data.step1.gender) {
          tasks.push(ProfileService.updateProfileGender(pid, data.step1.gender as any));
        }
        tasks.push(ProfileService.savePersonalInfo(pid, {
          full_name: data.step1.full_name,
          cnic: data.step1.cnic || null,
          phone: data.step1.phone || null,
          date_of_birth: data.step1.date_of_birth || null,
          marital_status: data.step1.marital_status || 'NEVER_MARRIED',
          nationality_country_id: data.step1.nationality_country_id ? Number(data.step1.nationality_country_id) : null,
          multiple_nationality: Boolean(data.step1.multiple_nationality),
          mother_tongue_id: data.step1.mother_tongue_id ? Number(data.step1.mother_tongue_id) : null,
          number_of_children: isNeverMarried ? 0 : (data.step1.number_of_children ? Number(data.step1.number_of_children) : 0),
        }));
        tasks.push(
          ProfileService.saveChildren(
            pid,
            hasChildren
              ? data.step1.children.map(({ _tempId, ...rest }) => ({
                  ...rest,
                  age: rest.age ? Number(rest.age) : null,
                  living_with_profile: rest.living_with_profile === 'YES',
                }))
              : []
          )
        );
        tasks.push(
          ProfileService.savePreviousMarriages(
            pid,
            isNeverMarried
              ? []
              : data.step1.previous_marriages.map(({ _tempId, ...rest }) => ({
                  ...rest,
                  marriage_year: rest.marriage_year ? Number(rest.marriage_year) : null,
                  end_year: rest.end_year ? Number(rest.end_year) : null,
                  children_count: rest.children_count ? Number(rest.children_count) : 0,
                  children_live_with_profile: rest.children_live_with_profile === 'YES',
                }))
          )
        );
      }

      if (dirtyKeys.includes('step2')) {
        const h = (data.step2.height_cm != null && (data.step2.height_cm as any) !== '') ? Number(data.step2.height_cm) : null;
        const w = (data.step2.weight_kg != null && (data.step2.weight_kg as any) !== '') ? Number(data.step2.weight_kg) : null;
        tasks.push(ProfileService.savePhysicalInfo(pid, {
          height_cm: (h !== null && !isNaN(h) && h >= 80 && h <= 250) ? h : null,
          weight_kg: (w !== null && !isNaN(w) && w >= 20 && w <= 400) ? w : null,
          complexion: data.step2.complexion || null,
          has_disability: Boolean(data.step2.has_disability),
          disability_details: data.step2.has_disability ? data.step2.disability_details : null,
        }));
      }

      if (dirtyKeys.includes('step3')) {
        const validEdus = data.step3.education_records.filter(e => e.education_level_id).map(({ _tempId, ...rest }) => rest);
        tasks.push(ProfileService.saveEducationRecords(pid, validEdus));
        const validEmps = data.step3.employment_records.filter(e => e.occupation_id || e.employment_type || e.job_title?.trim() || e.organization_name?.trim() || e.details?.trim()).map(({ _tempId, ...rest }) => rest);
        tasks.push(ProfileService.saveEmploymentRecords(pid, validEmps));
        const hasMinIncome = data.step3.monthly_income_min !== '' && data.step3.monthly_income_min != null;
        const hasMaxIncome = data.step3.monthly_income_max !== '' && data.step3.monthly_income_max != null;
        if (hasMinIncome || hasMaxIncome) {
          tasks.push(ProfileService.saveIncomeInfo(pid, {
            monthly_income_min: hasMinIncome ? Number(data.step3.monthly_income_min) : null,
            monthly_income_max: hasMaxIncome ? Number(data.step3.monthly_income_max) : null,
            currency_code: 'PKR',
            income_period: 'MONTHLY',
          }));
        } else {
          tasks.push(ProfileService.deleteIncomeInfo(pid));
        }
      }

      if (dirtyKeys.includes('step4')) {
        tasks.push(ProfileService.saveReligionInfo(pid, {
          religion_id: data.step4.religion_id ? Number(data.step4.religion_id) : null,
          sect_id: data.step4.sect_id ? Number(data.step4.sect_id) : null,
          caste_id: data.step4.caste_id ? Number(data.step4.caste_id) : null,
          other_caste_text: data.step4.other_caste_text || null,
        }));
      }

      if (dirtyKeys.includes('step5')) {
        const isCurrentPak = Number(data.step5.current_country_id) === 131;
        const isPermPak = Number(data.step5.permanent_country_id) === 131;
        tasks.push(ProfileService.saveLocations(pid, {
          current_country_id: data.step5.current_country_id ? Number(data.step5.current_country_id) : null,
          current_province_id: isCurrentPak && data.step5.current_province_id ? Number(data.step5.current_province_id) : null,
          current_city_id: isCurrentPak && data.step5.current_city_id ? Number(data.step5.current_city_id) : null,
          permanent_country_id: data.step5.permanent_country_id ? Number(data.step5.permanent_country_id) : null,
          permanent_province_id: isPermPak && data.step5.permanent_province_id ? Number(data.step5.permanent_province_id) : null,
          permanent_city_id: isPermPak && data.step5.permanent_city_id ? Number(data.step5.permanent_city_id) : null,
          current_location_text: (!isCurrentPak ? joinOverseasLocation(data.step5.current_city_text, data.step5.current_province_text, data.step5.current_location_text) : data.step5.current_location_text) || null,
          permanent_location_text: (!isPermPak ? joinOverseasLocation(data.step5.permanent_city_text, data.step5.permanent_province_text, data.step5.permanent_location_text) : data.step5.permanent_location_text) || null,
        }));
        tasks.push(ProfileService.saveResidencyInfo(pid, {
          house_status: data.step5.house_status || null,
          property_type: data.step5.property_type || null,
          family_setup: data.step5.family_setup || null,
          living_with: data.step5.living_with || null,
          living_with_other_details: data.step5.living_with === 'OTHER' ? data.step5.living_with_other_details : null,
        }));
      }

      if (dirtyKeys.includes('step6')) {
        tasks.push(ProfileService.saveParents(pid, data.step6.parents.map(({ _tempId, ...rest }) => ({
          ...rest,
          age: rest.age ? Number(rest.age) : null,
          country_id: (rest.country_id ? Number(rest.country_id) : null) as any,
          city_id: (rest.city_id ? Number(rest.city_id) : null) as any,
        }))));
        tasks.push(ProfileService.saveSiblings(pid, data.step6.siblings.map(({ _tempId, ...rest }) => ({
          ...rest,
          gender: rest.gender || 'MALE',
          age: rest.age ? Number(rest.age) : null,
          marital_status: rest.marital_status || null,
          country_id: (rest.country_id ? Number(rest.country_id) : null) as any,
          city_id: (rest.city_id ? Number(rest.city_id) : null) as any,
        }))));
        tasks.push(ProfileService.saveFamilyInfo(pid, {
          family_profession_business: data.step6.family_profession_business || null,
          social_background: data.step6.social_background || null,
          family_values: data.step6.family_values || null,
          family_introduction: data.step6.family_introduction || null,
          important_family_circumstances: data.step6.important_family_circumstances || null,
          additional_details: data.step6.additional_details || null,
        }));
      }

      if (dirtyKeys.includes('step7')) {
        tasks.push(ProfileService.saveLifestyleInfo(pid, {
          beard: data.step7.beard || null,
          hijab: data.step7.hijab || null,
          religious_practice: data.step7.religious_practice || null,
          smoking: data.step7.smoking || null,
          other_lifestyle_information: data.step7.other_lifestyle_information || null,
        }));
        tasks.push(ProfileService.saveRelocationInfo(pid, {
          willing_to_relocate: data.step7.willing_to_relocate || null,
          preferred_country_id: data.step7.preferred_country_id ? Number(data.step7.preferred_country_id) : null,
          preferred_province_id: data.step7.preferred_province_id ? Number(data.step7.preferred_province_id) : null,
          preferred_city_id: data.step7.preferred_city_id ? Number(data.step7.preferred_city_id) : null,
          relocation_details: data.step7.relocation_details || null,
        }));
      }

      // Step 8 requires user.id to be available (which it is, from outer scope)
      if (dirtyKeys.includes('step8') && user) {
        tasks.push(PreferenceService.savePreferences(pid, {
          basic: {
            preference_set_id: '',
            min_age: data.step8.pref_min_age ? Number(data.step8.pref_min_age) : null,
            max_age: data.step8.pref_max_age ? Number(data.step8.pref_max_age) : null,
            age_importance: data.step8.pref_age_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_age_importance || null),
            preferred_marital_status: cleanEnumVal(data.step8.pref_marital_status),
            marital_status_importance: data.step8.pref_marital_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_marital_importance || null),
            children_allowed: cleanEnumVal(data.step8.pref_children_allowed),
            children_importance: data.step8.pref_children_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_children_importance || null),
            preferred_gender: null,
            gender_importance: null,
            created_at: new Date().toISOString()
          },
          physical: {
            preference_set_id: '',
            min_height_cm: data.step8.pref_min_height ? Number(data.step8.pref_min_height) : null,
            max_height_cm: data.step8.pref_max_height ? Number(data.step8.pref_max_height) : null,
            height_importance: data.step8.pref_height_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_height_importance || null),
            disability_allowed: cleanEnumVal(data.step8.pref_disability_allowed),
            disability_importance: data.step8.pref_disability_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_disability_importance || null),
            min_weight_kg: data.step8.pref_min_weight ? Number(data.step8.pref_min_weight) : null,
            max_weight_kg: data.step8.pref_max_weight ? Number(data.step8.pref_max_weight) : null,
            weight_importance: data.step8.pref_weight_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_weight_importance || null),
            preferred_complexion: cleanEnumVal(data.step8.pref_complexion),
            complexion_importance: data.step8.pref_complexion_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_complexion_importance || null),
            beard_preference: cleanEnumVal(data.step8.pref_beard),
            beard_importance: data.step8.pref_beard_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_beard_importance || null),
            hijab_preference: cleanEnumVal(data.step8.pref_hijab),
            hijab_importance: data.step8.pref_hijab_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_hijab_importance || null),
            created_at: new Date().toISOString()
          },
          education: {
            preference_set_id: '',
            minimum_education_level_id: data.step8.pref_education_level_id ? Number(data.step8.pref_education_level_id) : null,
            education_importance: data.step8.pref_education_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_education_importance || null),
            preferred_field_of_study: cleanEnumVal(data.step8.pref_field_of_study),
            field_importance: data.step8.pref_field_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_field_importance || null),
            created_at: new Date().toISOString()
          },
          profession: {
            preference_set_id: '',
            minimum_monthly_income: data.step8.pref_min_income ? Number(data.step8.pref_min_income) : null,
            maximum_monthly_income: data.step8.pref_max_income ? Number(data.step8.pref_max_income) : null,
            income_importance: data.step8.pref_income_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_income_importance || null),
            preferred_occupation_id: data.step8.pref_occupation_id ? Number(data.step8.pref_occupation_id) : null,
            occupation_importance: data.step8.pref_occupation_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_occupation_importance || null),
            preferred_employment_type: cleanEnumVal(data.step8.pref_employment_type as any),
            employment_type_importance: data.step8.pref_employment_type_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_employment_type_importance || null),
            created_at: new Date().toISOString()
          },
          religion: {
            preference_set_id: '',
            religion_id: data.step8.pref_religion_id ? Number(data.step8.pref_religion_id) : null,
            religion_importance: data.step8.pref_religion_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_religion_importance || null),
            sect_id: data.step8.pref_sect_id ? Number(data.step8.pref_sect_id) : null,
            sect_importance: data.step8.pref_sect_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_sect_importance || null),
            caste_id: data.step8.pref_caste_id ? Number(data.step8.pref_caste_id) : null,
            caste_importance: data.step8.pref_caste_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_caste_importance || null),
            religious_practice: cleanEnumVal(data.step8.pref_religious_practice),
            religious_practice_importance: data.step8.pref_religious_practice_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_religious_practice_importance || null),
            created_at: new Date().toISOString()
          },
          location: {
            preference_set_id: '',
            country_importance: data.step8.pref_location_country_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_location_country_importance || null),
            province_importance: data.step8.pref_location_province_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_location_province_importance || null),
            city_importance: data.step8.pref_location_city_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_location_city_importance || null),
            location_details: null,
            created_at: new Date().toISOString()
          },
          preferredLocations: (data.step8.pref_locations || []).map(l => ({
            country_id: Number(l.country_id),
            province_id: l.province_id ? Number(l.province_id) : null,
            city_id: l.city_id ? Number(l.city_id) : null,
            is_excluded: Boolean(l.is_excluded),
          })),
          family: {
            preference_set_id: '',
            family_setup: cleanEnumVal(data.step8.pref_family_setup),
            family_setup_importance: data.step8.pref_family_setup_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_family_setup_importance || null),
            living_with: cleanEnumVal(data.step8.pref_living_with),
            living_with_importance: data.step8.pref_living_with_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_living_with_importance || null),
            parents_status_preference: cleanEnumVal(data.step8.pref_parents_status),
            parents_status_importance: data.step8.pref_parents_status_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_parents_status_importance || null),
            created_at: new Date().toISOString()
          },
          lifestyle: {
            preference_set_id: '',
            smoking: cleanEnumVal(data.step8.pref_smoking),
            smoking_importance: data.step8.pref_smoking_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_smoking_importance || null),
            religious_practice: cleanEnumVal(data.step8.pref_religious_practice),
            religious_practice_importance: data.step8.pref_religious_practice_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_religious_practice_importance || null),
            beard_preference: cleanEnumVal(data.step8.pref_beard),
            beard_importance: data.step8.pref_beard_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_beard_importance || null),
            hijab_preference: cleanEnumVal(data.step8.pref_hijab),
            hijab_importance: data.step8.pref_hijab_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_hijab_importance || null),
            additional_preferences: data.step8.pref_additional_lifestyle || null,
            created_at: new Date().toISOString()
          },
          relocation: {
            preference_set_id: '',
            willing_to_relocate_required: cleanEnumVal(data.step8.pref_willing_to_relocate_required),
            relocation_importance: data.step8.pref_relocation_importance === 'DOES_NOT_MATTER' ? null : (data.step8.pref_relocation_importance || null),
            country_importance: null,
            province_importance: null,
            city_importance: null,
            created_at: new Date().toISOString()
          },
          preferredRelocations: (data.step8.pref_relocations || []).map(l => ({
            country_id: Number(l.country_id),
            province_id: l.province_id ? Number(l.province_id) : null,
            city_id: l.city_id ? Number(l.city_id) : null,
            is_excluded: Boolean(l.is_excluded),
          }))
        }, user.id));
      }

      tasks.push(ProfileService.touchProfile(pid));
      if (tasks.length > 0) {
        const results = await Promise.allSettled(tasks);
        const failures = results
          .map((r, i) => r.status === 'rejected' ? { index: i, reason: r.reason } : null)
          .filter(Boolean);
        if (failures.length > 0) {
          const details = failures.map((f: any) => f.reason?.message || JSON.stringify(f.reason)).join('; ');
          throw new Error(`Auto-save: ${failures.length} task(s) failed — ${details}`);
        }
      }
    }
  });

  // ── Image Upload ───────────────────────────────────────────
  const handleImageUpload = async (compressedFile: File, previewUrl: string) => {
    if (!user) return;
    setIsUploadingImage(true);
    setError(null);
    try {
      let pid = profileId;

      // If no draft exists yet, create one
      if (!pid) {
        if (!step1.gender || !step1.full_name) {
          setError("Please fill full name and gender before uploading an image.");
          setIsUploadingImage(false);
          // Revert preview
          setStep1(prev => ({ ...prev, profile_picture: undefined, profile_picture_file: undefined }));
          return;
        }
        const profile = await ProfileService.createProfile(user.id, step1.gender as string);
        pid = profile.id;

        await ProfileService.savePersonalInfo(pid, {
          full_name: step1.full_name,
          date_of_birth: step1.date_of_birth || null,
          marital_status: step1.marital_status || 'NEVER_MARRIED',
          nationality_country_id: step1.nationality_country_id ? Number(step1.nationality_country_id) : null,
          multiple_nationality: Boolean(step1.multiple_nationality),
          mother_tongue_id: step1.mother_tongue_id ? Number(step1.mother_tongue_id) : null,
          number_of_children: step1.number_of_children ? Number(step1.number_of_children) : 0,
        });

        const oldKey = getLocalStorageKey(null);
        const existingLocal = localStorage.getItem(oldKey);
        if (existingLocal) {
          localStorage.setItem(getLocalStorageKey(pid), existingLocal);
          localStorage.removeItem(oldKey);
        }

        profileIdRef.current = pid;
        loadedProfileIdRef.current = pid;
        skipReloadForIdRef.current = pid;
        setProfileId(pid);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('draftId', pid);
          window.history.replaceState(null, '', url.toString());
        }
      }

      // If replacing an existing bucket image, delete the old one
      if (step1.profile_picture && step1.profile_picture.includes('/object/public/')) {
        await ProfileService.deleteProfilePicture(step1.profile_picture);
      }

      // Upload new image
      const publicUrl = await ProfileService.uploadProfilePicture(pid, compressedFile);
      await ProfileService.updateProfileUrl(pid, publicUrl);

      // Update state with final bucket URL
      setStep1(prev => ({ ...prev, profile_picture: publicUrl, profile_picture_file: undefined }));

    } catch (err) {
      console.error("Image upload failed", err);
      setError("Failed to upload image.");
      // Revert preview on failure
      setStep1(prev => ({ ...prev, profile_picture: undefined, profile_picture_file: undefined }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────
  const goToStep = async (step: number) => {
    if (isUploadingImage || isSaving) return; // Prevent navigation while uploading or saving

    if (currentStep === 1 && step > 1) {
      if (cnicStatus === 'checking') return;
      if (cnicStatus === 'duplicate') {
        setError(
          duplicateCnicInfo
            ? `A profile already exists on this CNIC (${duplicateCnicInfo.full_name}). Please enter a unique CNIC.`
            : 'A profile already exists on this CNIC. Please enter a unique CNIC.'
        );
        return;
      }
    }

    // If we are at Step 1 and trying to move forward, and we don't have a profileId yet
    if (currentStep === 1 && !profileId && step > 1) {
      if (!user) return;
      const stats = getStepStats(1);
      if (stats.mandatoryComplete) {
        setIsSaving(true);
        try {
          const profile = await ProfileService.createProfile(user.id, step1.gender as string);
          const newPid = profile.id;

          // Save personal_information table data alongside draft creation
          await ProfileService.savePersonalInfo(newPid, {
            full_name: step1.full_name,
            cnic: step1.cnic || null,
            phone: step1.phone || null,
            date_of_birth: step1.date_of_birth || null,
            marital_status: step1.marital_status || 'NEVER_MARRIED',
            nationality_country_id: step1.nationality_country_id ? Number(step1.nationality_country_id) : null,
            multiple_nationality: Boolean(step1.multiple_nationality),
            mother_tongue_id: step1.mother_tongue_id ? Number(step1.mother_tongue_id) : null,
            number_of_children: step1.number_of_children ? Number(step1.number_of_children) : 0,
          });

          // Picture upload is now handled immediately by handleImageUpload

          // Migrate localStorage key from 'new' to the actual profileId
          const oldKey = getLocalStorageKey(null);
          const existingLocal = localStorage.getItem(oldKey);
          if (existingLocal) {
            localStorage.setItem(getLocalStorageKey(newPid), existingLocal);
            localStorage.removeItem(oldKey);
          }

          profileIdRef.current = newPid;
          loadedProfileIdRef.current = newPid;
          skipReloadForIdRef.current = newPid;
          setProfileId(newPid);

          // Update URL for reload safety (without triggering full navigation)
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('draftId', newPid);
            window.history.replaceState(null, '', url.toString());
          }
        } catch (err) {
          console.error("Draft creation failed", err);
          setError("Failed to initialize draft profile.");
          setIsSaving(false);
          return; // Stop navigation if creation fails
        }
        setIsSaving(false);
      } else {
        // Data loss is acceptable if they move without completing mandatory fields,
        // but we just let them move without creating DB draft
      }
    }

    // Persist any dirty changes immediately through the serialized auto-save pipeline
    if (profileId && currentStep !== step) {
      void flushAutoSave();
    }

    if (step >= 1 && step <= STEPS.length) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(step);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('step', String(step));
        window.history.replaceState(null, '', url.toString());
      }
    }
  };

  const next = () => goToStep(currentStep + 1);
  const back = () => {
    if (profileId) {
      void flushAutoSave();
    }
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ── Step completion logic ───────────────────────────────────
  const getStepStats = (stepId: number): { completed: number, total: number, mandatoryComplete: boolean } => {
    switch (stepId) {
      case 1: {
        const total = 8;
        let completed = 0;
        const cnicOk = isValidCnic(step1.cnic) && cnicStatus !== 'duplicate';
        const phoneOk = isValidPhone(step1.phone);
        if (step1.gender) completed++;
        if (step1.full_name?.trim()) completed++;
        if (cnicOk) completed++;
        if (phoneOk) completed++;
        if (step1.date_of_birth) completed++;
        if (step1.marital_status) completed++;
        if (step1.nationality_country_id) completed++;
        if (step1.mother_tongue_id) completed++;
        const mandatoryComplete = !!(step1.gender && step1.full_name?.trim() && cnicOk && phoneOk && step1.date_of_birth && step1.marital_status);
        return { completed, total, mandatoryComplete };
      }
      case 2: {
        let total = 3;
        let completed = 0;
        if (step2.height_cm) completed++;
        if (step2.weight_kg) completed++;
        if (step2.complexion) completed++;
        if (step2.has_disability) {
          total += 1;
          if (step2.disability_details) completed++;
        }
        const mandatoryComplete = !!step2.height_cm;
        return { completed, total, mandatoryComplete };
      }
      case 3: {
        const total = 4;
        let completed = 0;
        if (step3.education_records.length > 0) completed++;
        if (step3.employment_records.length > 0) completed++;
        if (step3.monthly_income_min) completed++;
        if (step3.monthly_income_max) completed++;
        const validEdu = step3.education_records.some(r => !!r.education_level_id);
        const mandatoryComplete = validEdu;
        return { completed, total, mandatoryComplete };
      }
      case 4: {
        const total = 4;
        let completed = 0;
        if (step4.religion_id) completed++;
        if (step4.sect_id) completed++;
        if (step4.caste_id) completed++;
        if (step4.other_caste_text) completed++;
        const mandatoryComplete = !!(step4.religion_id && step4.sect_id && (step4.caste_id || step4.other_caste_text));
        return { completed, total, mandatoryComplete };
      }
      case 5: {
        const total = 11;
        let completed = 0;
        if (step5.current_country_id) completed++;
        if (step5.current_province_id) completed++;
        if (step5.current_city_id) completed++;
        if (step5.permanent_country_id) completed++;
        if (step5.permanent_province_id) completed++;
        if (step5.permanent_city_id) completed++;
        if (step5.current_location_text) completed++;
        if (step5.house_status) completed++;
        if (step5.property_type) completed++;
        if (step5.family_setup) completed++;
        if (step5.living_with) completed++;
        const isCurrentPak = Number(step5.current_country_id) === 131;
        const hasOverseasLoc = Boolean(
          joinOverseasLocation(step5.current_city_text, step5.current_province_text, step5.current_location_text)
        );
        const mandatoryComplete = !!(step5.current_country_id && (isCurrentPak ? (step5.current_province_id && step5.current_city_id) : hasOverseasLoc));
        return { completed, total, mandatoryComplete };
      }
      case 6: {
        const total = 6;
        let completed = 0;
        if (step6.parents.length > 0) completed++;
        if (step6.siblings.length > 0) completed++;
        if (step6.family_profession_business) completed++;
        if (step6.social_background) completed++;
        if (step6.family_values) completed++;
        if (step6.family_introduction) completed++;

        const mandatoryComplete = true;
        return { completed, total, mandatoryComplete };
      }
      case 7: {
        const total = 10;
        let completed = 0;
        if (step7.religious_practice) completed++;
        if (step7.beard) completed++;
        if (step7.hijab) completed++;
        if (step7.smoking) completed++;
        if (step7.other_lifestyle_information) completed++;
        if (step7.willing_to_relocate) completed++;
        if (step7.preferred_country_id) completed++;
        if (step7.preferred_province_id) completed++;
        if (step7.preferred_city_id) completed++;
        if (step7.relocation_details) completed++;
        const mandatoryComplete = !!(step7.religious_practice && step7.smoking);
        return { completed, total, mandatoryComplete };
      }
      case 8: {
        let total = 0;
        let completed = 0;

        const countField = (val: any) => {
          total++;
          if (val !== '' && val !== null && val !== undefined) completed++;
        };

        const countImp = (imp: any, deps: any[]) => {
          total++;
          if (imp !== '' && imp !== null && imp !== undefined) {
            completed++;
            if (imp !== 'DOES_NOT_MATTER') {
              deps.forEach(countField);
            }
          } else {
            deps.forEach(countField);
          }
        };

        countImp(step8.pref_age_importance, [step8.pref_min_age, step8.pref_max_age]);
        countImp(step8.pref_marital_importance, [step8.pref_marital_status]);

        if (step8.pref_marital_importance !== 'DOES_NOT_MATTER' && ['DIVORCED', 'WIDOWED', 'SEPARATED'].includes(step8.pref_marital_status as string)) {
          countImp(step8.pref_children_importance, [step8.pref_children_allowed]);
        }

        countImp(step8.pref_height_importance, [step8.pref_min_height, step8.pref_max_height]);
        countImp(step8.pref_disability_importance, [step8.pref_disability_allowed]);

        countField(step8.pref_religion_id);
        if (step8.pref_religion_id) {
          countImp(step8.pref_sect_importance, [step8.pref_sect_id]);
        }

        countImp(step8.pref_caste_importance, [step8.pref_caste_id]);
        countImp(step8.pref_religious_practice_importance, [step8.pref_religious_practice]);

        countImp(step8.pref_income_importance, [step8.pref_min_income]);
        countImp(step8.pref_location_country_importance, [(step8.pref_locations && step8.pref_locations.length > 0) ? 'yes' : '']);
        countImp(step8.pref_family_setup_importance, [step8.pref_family_setup]);
        countImp(step8.pref_smoking_importance, [step8.pref_smoking]);

        const reqBasic = step8.pref_age_importance === 'DOES_NOT_MATTER' ? true : !!(step8.pref_min_age && step8.pref_max_age && step8.pref_age_importance);
        const reqPhys = step8.pref_height_importance === 'DOES_NOT_MATTER' ? true : !!(step8.pref_min_height && step8.pref_max_height && step8.pref_height_importance);

        const mandatoryComplete = reqBasic && reqPhys;
        return { completed, total, mandatoryComplete };
      }
      default:
        return { completed: 1, total: 1, mandatoryComplete: true };
    }
  };
  // Keep ref in sync so auto-save callback can access getStepStats
  getStepStatsRef.current = getStepStats;

  const dynamicSidebarSteps = SIDEBAR_STEPS.map(s => {
    const stats = getStepStats(s.id);
    return {
      ...s,
      completedFields: stats.completed,
      totalFields: stats.total,
      mandatoryComplete: stats.mandatoryComplete
    };
  });

  // ── Missing mandatory details helper ───────────────────────
  const getMissingMandatoryDetails = () => {
    const missing: { stepId: number; stepName: string; missingFields: string[] }[] = [];

    // Step 1
    const s1: string[] = [];
    if (!step1.full_name?.trim()) s1.push('Full Name');
    if (!isValidCnic(step1.cnic)) {
      s1.push('CNIC Number (13 digits)');
    } else if (cnicStatus === 'duplicate') {
      s1.push('Unique CNIC Number (already registered)');
    }
    if (!isValidPhone(step1.phone)) s1.push('Phone Number');
    if (!step1.gender) s1.push('Gender');
    if (!step1.date_of_birth) s1.push('Age');
    if (!step1.marital_status) s1.push('Marital Status');
    if (s1.length > 0) missing.push({ stepId: 1, stepName: 'Basic Information', missingFields: s1 });

    // Step 2
    const s2: string[] = [];
    if (!step2.height_cm) s2.push('Height');
    if (s2.length > 0) missing.push({ stepId: 2, stepName: 'Physical Information', missingFields: s2 });

    // Step 3
    const s3: string[] = [];
    if (!step3.education_records.some(r => !!r.education_level_id)) s3.push('Education Record (Level)');
    if (s3.length > 0) missing.push({ stepId: 3, stepName: 'Education & Profession', missingFields: s3 });

    // Step 4
    const s4: string[] = [];
    if (!step4.religion_id) s4.push('Religion');
    if (!step4.sect_id) s4.push('Sect');
    if (!step4.caste_id && !step4.other_caste_text?.trim()) s4.push('Caste');
    if (s4.length > 0) missing.push({ stepId: 4, stepName: 'Religion & Culture', missingFields: s4 });

    // Step 5
    const s5: string[] = [];
    if (!step5.current_country_id) {
      s5.push('Current Country');
    } else if (Number(step5.current_country_id) === 131) {
      if (!step5.current_province_id) s5.push('Current Province');
      if (!step5.current_city_id) s5.push('Current City');
    } else {
      const hasOverseasLoc = Boolean(
        joinOverseasLocation(step5.current_city_text, step5.current_province_text, step5.current_location_text)
      );
      if (!hasOverseasLoc) s5.push('City / Address Details');
    }
    if (s5.length > 0) missing.push({ stepId: 5, stepName: 'Location & Residency', missingFields: s5 });

    // Step 6: Parents (Father & Mother) are optional

    // Step 7
    const s7: string[] = [];
    if (!step7.religious_practice) s7.push('Religious Practice');
    if (!step7.smoking) s7.push('Smoking Status');
    if (s7.length > 0) missing.push({ stepId: 7, stepName: 'Lifestyle', missingFields: s7 });

    // Step 8
    const s8: string[] = [];
    const reqBasic = step8.pref_age_importance === 'DOES_NOT_MATTER' ? true : !!(step8.pref_min_age && step8.pref_max_age && step8.pref_age_importance);
    const reqPhys = step8.pref_height_importance === 'DOES_NOT_MATTER' ? true : !!(step8.pref_min_height && step8.pref_max_height && step8.pref_height_importance);
    if (!reqBasic) s8.push('Desired Age Range');
    if (!reqPhys) s8.push('Desired Height Range');
    if (s8.length > 0) missing.push({ stepId: 8, stepName: 'Partner Preferences', missingFields: s8 });

    return missing;
  };

  // ── Trigger save: if mandatory fields are missing, prompt confirmation modal ──
  const handleSaveClick = () => {
    if (!isConfirmedAccuracy) {
      toast.error('Please check the confirmation box above before saving.');
      return;
    }
    if (cnicStatus === 'duplicate') {
      const msg = duplicateCnicInfo
        ? `A profile already exists on this CNIC (${duplicateCnicInfo.full_name}). Please update the CNIC before saving.`
        : 'A profile already exists on this CNIC. Please update the CNIC before saving.';
      setError(msg);
      toast.error(msg);
      return;
    }
    const missing = getMissingMandatoryDetails();
    const preservedStatuses = ['PAUSED', 'INACTIVE', 'ARCHIVED'];
    if (missing.length > 0 && !preservedStatuses.includes(initialProfileStatusRef.current)) {
      setMissingFieldsList(missing);
      setShowDraftModal(true);
      return;
    }
    performSave(false);
  };

  // ── Execute save to DB ─────────────────────────────────────
  const performSave = async (forceDraft: boolean = false) => {
    if (!user) {
      const msg = 'Your session is still loading or has expired. Please refresh or sign in again.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (cnicStatus === 'duplicate') {
      const msg = duplicateCnicInfo
        ? `A profile already exists on this CNIC (${duplicateCnicInfo.full_name}).`
        : 'A profile already exists on this CNIC.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setShowDraftModal(false);
    setIsSaving(true);
    setError(null);

    try {
      // Cancel any pending auto-save debounce and wait briefly for any active auto-save
      cancelAutoSave();
      await waitForAutoSaveIdle(4500);

      // Final server-side duplicate CNIC guard right before DB write
      if (isValidCnic(step1.cnic)) {
        const params = new URLSearchParams({ cnic: step1.cnic });
        if (profileId) params.set('excludeProfileId', profileId);
        const checkRes = await fetch(`/api/profiles/check-cnic?${params.toString()}`);
        if (checkRes.ok) {
          const checkJson = await checkRes.json();
          if (checkJson.exists) {
            const info = checkJson.existingProfile || { full_name: 'Existing Profile', status: null };
            setCnicStatus('duplicate');
            setDuplicateCnicInfo(info);
            const dupMsg = `A profile already exists on this CNIC (${info.full_name}).`;
            setError(dupMsg);
            toast.error(dupMsg);
            setIsSaving(false);
            return;
          }
        }
      }
      // 1. Use existing draft profile or create new one (and immediately bind ID to prevent duplicates on retry)
      let pid = profileId;
      if (!pid) {
        const profile = await ProfileService.createProfile(user.id, step1.gender as string);
        pid = profile.id;
        profileIdRef.current = pid;
        loadedProfileIdRef.current = pid;
        skipReloadForIdRef.current = pid;
        setProfileId(pid);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('draftId', pid);
          window.history.replaceState(null, '', url.toString());
        }
      } else if (step1.gender) {
        await ProfileService.updateProfileGender(pid, step1.gender as any);
      }

      // Profile picture upload is now handled immediately in handleImageUpload

      // 2. Save each section in parallel where possible
      const isNeverMarried = !step1.marital_status || step1.marital_status === 'NEVER_MARRIED';
      const hasChildren = !isNeverMarried && Number(step1.number_of_children) > 0;
      await ProfileService.savePersonalInfo(pid, {
        full_name: step1.full_name,
        cnic: step1.cnic || null,
        phone: step1.phone || null,
        date_of_birth: step1.date_of_birth || null,
        marital_status: step1.marital_status || 'NEVER_MARRIED',
        nationality_country_id: step1.nationality_country_id ? Number(step1.nationality_country_id) : null,
        multiple_nationality: Boolean(step1.multiple_nationality),
        mother_tongue_id: step1.mother_tongue_id ? Number(step1.mother_tongue_id) : null,
        number_of_children: isNeverMarried ? 0 : (step1.number_of_children ? Number(step1.number_of_children) : 0),
      });

      await ProfileService.saveChildren(
        pid,
        hasChildren
          ? (step1.children || []).map(({ _tempId, ...rest }: any) => ({
              ...rest,
              age: rest.age ? Number(rest.age) : null,
              living_with_profile: rest.living_with_profile === 'YES',
            }))
          : []
      );

      await ProfileService.savePreviousMarriages(
        pid,
        isNeverMarried
          ? []
          : (step1.previous_marriages || []).map(({ _tempId, ...rest }: any) => ({
              ...rest,
              marriage_year: rest.marriage_year ? Number(rest.marriage_year) : null,
              end_year: rest.end_year ? Number(rest.end_year) : null,
              children_count: rest.children_count ? Number(rest.children_count) : 0,
              children_live_with_profile: rest.children_live_with_profile === 'YES',
            }))
      );

      const isCurrentPak = Number(step5.current_country_id) === 131;
      const isPermPak = Number(step5.permanent_country_id) === 131;

      const saveResults = await Promise.allSettled([
        ProfileService.savePhysicalInfo(pid, {
          height_cm: step2.height_cm && step2.height_cm >= 80 && step2.height_cm <= 250 ? Number(step2.height_cm) : null,
          weight_kg: step2.weight_kg && step2.weight_kg >= 20 && step2.weight_kg <= 400 ? Number(step2.weight_kg) : null,
          complexion: step2.complexion || null,
          has_disability: step2.has_disability,
          disability_details: step2.has_disability ? step2.disability_details : null,
        }),
        ProfileService.saveEducationRecords(pid, step3.education_records.filter(e => e.education_level_id).map(({ _tempId, ...rest }: any) => rest)),
        ProfileService.saveEmploymentRecords(pid, step3.employment_records.filter((e: any) => e.occupation_id || e.employment_type || e.job_title?.trim() || e.organization_name?.trim() || e.details?.trim()).map(({ _tempId, ...rest }: any) => rest)),
        ProfileService.saveReligionInfo(pid, {
          religion_id: step4.religion_id ? Number(step4.religion_id) : null,
          sect_id: step4.sect_id ? Number(step4.sect_id) : null,
          caste_id: step4.caste_id ? Number(step4.caste_id) : null,
          other_caste_text: step4.other_caste_text || null,
        }),
        ProfileService.saveLocations(pid, {
          current_country_id: step5.current_country_id ? Number(step5.current_country_id) : null,
          current_province_id: isCurrentPak && step5.current_province_id ? Number(step5.current_province_id) : null,
          current_city_id: isCurrentPak && step5.current_city_id ? Number(step5.current_city_id) : null,
          permanent_country_id: step5.permanent_country_id ? Number(step5.permanent_country_id) : null,
          permanent_province_id: isPermPak && step5.permanent_province_id ? Number(step5.permanent_province_id) : null,
          permanent_city_id: isPermPak && step5.permanent_city_id ? Number(step5.permanent_city_id) : null,
          current_location_text: (!isCurrentPak ? joinOverseasLocation(step5.current_city_text, step5.current_province_text, step5.current_location_text) : step5.current_location_text) || null,
          permanent_location_text: (!isPermPak ? joinOverseasLocation(step5.permanent_city_text, step5.permanent_province_text, step5.permanent_location_text) : step5.permanent_location_text) || null,
        }),
        ProfileService.saveResidencyInfo(pid, {
          house_status: step5.house_status || null,
          property_type: step5.property_type || null,
          family_setup: step5.family_setup || null,
          living_with: step5.living_with || null,
          living_with_other_details: step5.living_with === 'OTHER' ? step5.living_with_other_details : null,
        }),
        ProfileService.saveParents(pid, step6.parents.map(({ _tempId, ...rest }: any) => ({
          ...rest,
          age: rest.age ? Number(rest.age) : null,
          country_id: rest.country_id || null,
          city_id: rest.city_id || null,
        }))),
        ProfileService.saveSiblings(pid, step6.siblings.map(({ _tempId, ...rest }: any) => ({
          ...rest,
          gender: rest.gender || 'MALE',
          age: rest.age ? Number(rest.age) : null,
          marital_status: rest.marital_status || null,
          country_id: rest.country_id || null,
          city_id: rest.city_id || null,
        }))),
        ProfileService.saveFamilyInfo(pid, {
          family_profession_business: step6.family_profession_business || null,
          social_background: step6.social_background || null,
          family_values: step6.family_values || null,
          family_introduction: step6.family_introduction || null,
          important_family_circumstances: step6.important_family_circumstances || null,
          additional_details: step6.additional_details || null,
        }),
        ProfileService.saveLifestyleInfo(pid, {
          beard: step7.beard || null,
          hijab: step7.hijab || null,
          religious_practice: step7.religious_practice || null,
          smoking: step7.smoking || null,
          other_lifestyle_information: step7.other_lifestyle_information || null,
        }),
        ProfileService.saveRelocationInfo(pid, {
          willing_to_relocate: step7.willing_to_relocate || null,
          preferred_country_id: step7.preferred_country_id ? Number(step7.preferred_country_id) : null,
          preferred_province_id: step7.preferred_province_id ? Number(step7.preferred_province_id) : null,
          preferred_city_id: step7.preferred_city_id ? Number(step7.preferred_city_id) : null,
          relocation_details: step7.relocation_details || null,
        }),
      ]);
      const saveFailures = saveResults
        .map((r, i) => r.status === 'rejected' ? { index: i, reason: r.reason } : null)
        .filter(Boolean);
      if (saveFailures.length > 0) {
        const details = saveFailures.map((f: any) => f.reason?.message || JSON.stringify(f.reason)).join('; ');
        throw new Error(`Save failed for ${saveFailures.length} section(s): ${details}`);
      }

      const hasMinIncome = step3.monthly_income_min !== '' && step3.monthly_income_min != null;
      const hasMaxIncome = step3.monthly_income_max !== '' && step3.monthly_income_max != null;
      if (hasMinIncome || hasMaxIncome) {
        await ProfileService.saveIncomeInfo(pid, {
          monthly_income_min: hasMinIncome ? Number(step3.monthly_income_min) : null,
          monthly_income_max: hasMaxIncome ? Number(step3.monthly_income_max) : null,
          currency_code: 'PKR',
          income_period: 'MONTHLY',
        });
      } else {
        await ProfileService.deleteIncomeInfo(pid);
      }

      // 3. Save Preferences
      await PreferenceService.savePreferences(pid, {
        basic: {
          preference_set_id: '', // Set in service
          min_age: step8.pref_min_age ? Number(step8.pref_min_age) : null,
          max_age: step8.pref_max_age ? Number(step8.pref_max_age) : null,
          age_importance: step8.pref_age_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_age_importance || null),
          preferred_marital_status: cleanEnumVal(step8.pref_marital_status),
          marital_status_importance: step8.pref_marital_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_marital_importance || null),
          children_allowed: cleanEnumVal(step8.pref_children_allowed),
          children_importance: step8.pref_children_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_children_importance || null),
          preferred_gender: null, // Default
          gender_importance: null, // Default
          created_at: new Date().toISOString()
        },
        physical: {
          preference_set_id: '',
          min_height_cm: step8.pref_min_height ? Number(step8.pref_min_height) : null,
          max_height_cm: step8.pref_max_height ? Number(step8.pref_max_height) : null,
          height_importance: step8.pref_height_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_height_importance || null),
          disability_allowed: cleanEnumVal(step8.pref_disability_allowed),
          disability_importance: step8.pref_disability_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_disability_importance || null),
          min_weight_kg: step8.pref_min_weight ? Number(step8.pref_min_weight) : null,
          max_weight_kg: step8.pref_max_weight ? Number(step8.pref_max_weight) : null,
          weight_importance: step8.pref_weight_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_weight_importance || null),
          preferred_complexion: cleanEnumVal(step8.pref_complexion),
          complexion_importance: step8.pref_complexion_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_complexion_importance || null),
          beard_preference: cleanEnumVal(step8.pref_beard),
          beard_importance: step8.pref_beard_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_beard_importance || null),
          hijab_preference: cleanEnumVal(step8.pref_hijab),
          hijab_importance: step8.pref_hijab_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_hijab_importance || null),
          created_at: new Date().toISOString()
        },
        education: {
          preference_set_id: '',
          minimum_education_level_id: step8.pref_education_level_id ? Number(step8.pref_education_level_id) : null,
          education_importance: step8.pref_education_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_education_importance || null),
          preferred_field_of_study: cleanEnumVal(step8.pref_field_of_study),
          field_importance: step8.pref_field_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_field_importance || null),
          created_at: new Date().toISOString()
        },
        profession: {
          preference_set_id: '',
          minimum_monthly_income: step8.pref_min_income ? Number(step8.pref_min_income) : null,
          maximum_monthly_income: step8.pref_max_income ? Number(step8.pref_max_income) : null,
          income_importance: step8.pref_income_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_income_importance || null),
          preferred_occupation_id: step8.pref_occupation_id ? Number(step8.pref_occupation_id) : null,
          occupation_importance: step8.pref_occupation_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_occupation_importance || null),
          preferred_employment_type: cleanEnumVal(step8.pref_employment_type as any),
          employment_type_importance: step8.pref_employment_type_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_employment_type_importance || null),
          created_at: new Date().toISOString()
        },
        religion: {
          preference_set_id: '',
          religion_id: step8.pref_religion_id ? Number(step8.pref_religion_id) : null,
          religion_importance: step8.pref_religion_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_religion_importance || null),
          sect_id: step8.pref_sect_id ? Number(step8.pref_sect_id) : null,
          sect_importance: step8.pref_sect_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_sect_importance || null),
          caste_id: step8.pref_caste_id ? Number(step8.pref_caste_id) : null,
          caste_importance: step8.pref_caste_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_caste_importance || null),
          religious_practice: cleanEnumVal(step8.pref_religious_practice),
          religious_practice_importance: step8.pref_religious_practice_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_religious_practice_importance || null),
          created_at: new Date().toISOString()
        },
        location: {
          preference_set_id: '',
          country_importance: step8.pref_location_country_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_location_country_importance || null),
          province_importance: step8.pref_location_province_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_location_province_importance || null),
          city_importance: step8.pref_location_city_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_location_city_importance || null),
          location_details: null,
          created_at: new Date().toISOString()
        },
        preferredLocations: (step8.pref_locations || []).map(l => ({
          country_id: Number(l.country_id),
          province_id: l.province_id ? Number(l.province_id) : null,
          city_id: l.city_id ? Number(l.city_id) : null,
          is_excluded: Boolean(l.is_excluded),
        })),
        family: {
          preference_set_id: '',
          family_setup: cleanEnumVal(step8.pref_family_setup),
          family_setup_importance: step8.pref_family_setup_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_family_setup_importance || null),
          living_with: cleanEnumVal(step8.pref_living_with),
          living_with_importance: step8.pref_living_with_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_living_with_importance || null),
          parents_status_preference: cleanEnumVal(step8.pref_parents_status),
          parents_status_importance: step8.pref_parents_status_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_parents_status_importance || null),
          created_at: new Date().toISOString()
        },
        lifestyle: {
          preference_set_id: '',
          smoking: cleanEnumVal(step8.pref_smoking),
          smoking_importance: step8.pref_smoking_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_smoking_importance || null),
          religious_practice: cleanEnumVal(step8.pref_religious_practice),
          religious_practice_importance: step8.pref_religious_practice_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_religious_practice_importance || null),
          beard_preference: cleanEnumVal(step8.pref_beard),
          beard_importance: step8.pref_beard_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_beard_importance || null),
          hijab_preference: cleanEnumVal(step8.pref_hijab),
          hijab_importance: step8.pref_hijab_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_hijab_importance || null),
          additional_preferences: step8.pref_additional_lifestyle || null,
          created_at: new Date().toISOString()
        },
        relocation: {
          preference_set_id: '',
          willing_to_relocate_required: cleanEnumVal(step8.pref_willing_to_relocate_required),
          relocation_importance: step8.pref_relocation_importance === 'DOES_NOT_MATTER' ? null : (step8.pref_relocation_importance || null),
          country_importance: null,
          province_importance: null,
          city_importance: null,
          created_at: new Date().toISOString()
        },
        preferredRelocations: (step8.pref_relocations || []).map(l => ({
          country_id: Number(l.country_id),
          province_id: l.province_id ? Number(l.province_id) : null,
          city_id: l.city_id ? Number(l.city_id) : null,
          is_excluded: Boolean(l.is_excluded),
        }))
      }, user.id);

      // 4. Update profile status based on whether all mandatory fields across all steps are filled
      // Preserve PAUSED / INACTIVE / ARCHIVED status when editing an existing profile
      const missingDetails = getMissingMandatoryDetails();
      if (missingDetails.length > 0 || forceDraft) {
        console.warn('Profile saved as DRAFT. Missing mandatory fields:', missingDetails);
      }
      const allMandatoryCompleted = !forceDraft && missingDetails.length === 0;
      const preservedStatuses = ['PAUSED', 'INACTIVE', 'ARCHIVED'];
      const targetStatus =
        !forceDraft && preservedStatuses.includes(initialProfileStatusRef.current)
          ? initialProfileStatusRef.current
          : allMandatoryCompleted
            ? 'ACTIVE'
            : 'DRAFT';
      await ProfileService.updateProfileStatus(pid, targetStatus as any);

      // Refresh the materialized view in the background (non-blocking so Save Profile never hangs on MV locks)
      if (targetStatus === 'ACTIVE' || initialProfileStatusRef.current === 'ACTIVE') {
        try {
          const supabase = createClient();
          void Promise.resolve(supabase.rpc('refresh_mv_matching_profiles'))
            .then(({ error: rpcError }) => {
              if (rpcError) console.error('Failed to refresh MV:', rpcError);
            })
            .catch((e) => {
              console.error('Error refreshing MV:', e);
            });
        } catch (e) {
          console.error('Error initiating MV refresh:', e);
        }
      }

      // 5. Write to audit_logs when AGENT or MANAGER edits an existing profile (Admins skipped per rule)
      const isEdit = Boolean(searchParams.get('edit') || isEditingRef.current);
      if (isEdit) {
        try {
          await logProfileEditAction({
            profileId: pid,
            role: role || undefined,
            newData: {
              full_name: step1.full_name,
              phone: step1.phone,
              gender: step1.gender,
              status: targetStatus,
            },
            metadata: {
              step: currentStep,
            },
          });
        } catch (logErr) {
          console.warn('Failed to record profile edit audit log:', logErr);
        }
      }

      // Clear local storage drafts (both user-scoped and legacy keys)
      localStorage.removeItem(getLocalStorageKey(pid));
      localStorage.removeItem(getLocalStorageKey(null));
      localStorage.removeItem(`nikahkaru_draft_${pid}`);
      localStorage.removeItem('nikahkaru_draft_new');
      localStorage.removeItem(`nikahkaro_draft_${pid}`);
      localStorage.removeItem('nikahkaro_draft_new');

      // Mark current snapshot saved so unmounting on redirect never triggers a trailing auto-save
      markAutoSaveSaved();

      // Invalidate cached views/dashboard counts
      clearDirectoryCache();
      useDashboardCacheStore.getState().clearAll();

      toast.success(
        targetStatus === 'DRAFT'
          ? 'Profile saved as Draft.'
          : isEdit
            ? 'Profile updated successfully!'
            : 'Profile saved successfully!'
      );

      // Role-based redirect after saving:
      // If AGENT -> redirect to /profiles with this profile open
      // If ADMIN or MANAGER -> redirect to /directory (for non-drafts) or /overview (for drafts, since /directory hides drafts)
      const isAgent = role === 'AGENT';
      if (isAgent) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('selected_profile_id', pid);
        }
        router.push('/profiles');
      } else if (targetStatus === 'DRAFT') {
        router.push('/overview');
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('open_directory_profile_id', pid);
        }
        router.push('/directory');
      }
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : (err?.message || JSON.stringify(err));
      console.error('Full save error:', errMsg, err);
      const displayMsg = errMsg || 'Failed to save profile. Please try again.';
      setError(displayMsg);
      toast.error(displayMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render current step ────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <Step1BasicInfo
          data={step1}
          onChange={setStep1}
          onImageUpload={handleImageUpload}
          isUploadingImage={isUploadingImage}
          cnicStatus={cnicStatus}
          duplicateCnicInfo={duplicateCnicInfo}
        />
      );
      case 2: return <Step2MaritalPhysical data={step2} onChange={setStep2} />;
      case 3: return <Step3EducationProfession data={step3} onChange={setStep3} />;
      case 4: return <Step4ReligionCulture data={step4} onChange={setStep4} />;
      case 5: return <Step5LocationResidency data={step5} onChange={setStep5} />;
      case 6: return <Step6FamilyDetails data={step6} onChange={setStep6} />;
      case 7: return <Step7Lifestyle data={step7} onChange={setStep7} gender={step1.gender || undefined} />;
      case 8: return <Step8Preferences data={step8} onChange={setStep8} gender={step1.gender || undefined} />;
      case 9: return (
        <Step9Review
          step1={step1} step2={step2} step3={step3} step4={step4}
          step5={step5} step6={step6} step7={step7} step8={step8}
          onGoToStep={goToStep}
          isSaving={isSaving}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="block w-full h-full">
      <div className="w-full max-w-[1500px] mx-auto min-h-full flex flex-col lg:flex-row justify-between gap-6 lg:gap-5 xl:gap-8 2xl:gap-12 pt-2 pb-2 px-4 lg:px-5 xl:pl-8 xl:pr-6 2xl:pl-12 2xl:pr-6">
        {/* ── Main form area (Left) ── */}
        <div className="flex-1 flex flex-col min-w-0 lg:max-w-[850px] mx-auto lg:mx-0 lg:mt-2">
          <div className="flex-1 bg-transparent p-4 sm:p-6 lg:p-4 xl:p-7 2xl:p-9 flex flex-col">
            <div className="flex-1 pb-10">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium">
                  {error}
                </div>
              )}
              {profileId && !isInitialLoadDone ? (
                <div className="flex items-center justify-center py-20 text-[#7D766C] gap-2.5 text-[13px] font-medium">
                  <Loader2 size={18} className="animate-spin text-[#064e3b]" />
                  Loading saved draft...
                </div>
              ) : (
                renderStep()
              )}
            </div>

            {/* Step 9 Accuracy Commitment Checkbox */}
            {currentStep === 9 && (
              <div className="mb-6 space-y-3">
                <div className="p-4.5 sm:p-5 rounded-2xl transition-all">
                  <label className="flex items-start gap-3.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isConfirmedAccuracy}
                      onChange={(e) => setIsConfirmedAccuracy(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-[#C86A4A] text-[#064e3b] focus:ring-[#064e3b] accent-[#064e3b] cursor-pointer shrink-0"
                    />
                    <div className="text-[13px] leading-relaxed">
                      <p className="font-bold text-[#1E1F22]">
                        I confirm that all information entered above is correct.
                      </p>
                      <p className="text-[12px] text-[#7A6B58] mt-1">
                        Please note: If any false or incorrect information is provided, matching will not be run for this profile.
                      </p>
                    </div>
                  </label>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium">
                    {error}
                  </div>
                )}

                {isConfirmedAccuracy && (!step1.full_name?.trim() || !step1.gender || cnicStatus === 'duplicate' || cnicStatus === 'checking') && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[12.5px] font-medium">
                    {cnicStatus === 'checking'
                      ? 'Verifying CNIC uniqueness… Save Profile will enable automatically in a moment.'
                      : cnicStatus === 'duplicate'
                        ? 'Duplicate CNIC detected on Step 1. Please update the CNIC before saving.'
                        : 'Please enter Full Name and Gender on Step 1 before saving.'}
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mt-auto pt-6 xl:pt-8 border-t border-[#EFE9DF]/50">
              <button
                type="button"
                onClick={back}
                disabled={currentStep === 1 || isUploadingImage}
                className="flex items-center gap-2 bg-[#EAE4D9] text-[#2F3E51] font-bold text-[14px] px-5 xl:px-8 py-3 xl:py-3.5 rounded-2xl hover:bg-[#DED5C5] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={isUploadingImage || isSaving || (currentStep === 1 && (cnicStatus === 'duplicate' || cnicStatus === 'checking'))}
                  className="flex items-center gap-2 bg-[#C86A4A] text-white font-bold text-[14px] px-5 xl:px-8 py-3 xl:py-3.5 rounded-2xl hover:bg-[#b05a3e] hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving && currentStep === 1 && !profileId ? (
                    <><Loader2 size={18} className="animate-spin" /> Creating...</>
                  ) : isSaving ? (
                    <><Loader2 size={18} className="animate-spin" /> Next</>
                  ) : (
                    <>Continue <ArrowRight size={18} /></>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving || isUploadingImage || cnicStatus === 'duplicate' || cnicStatus === 'checking' || !step1.full_name?.trim() || !step1.gender || !isConfirmedAccuracy}
                  title={
                    !isConfirmedAccuracy
                      ? "Please check the confirmation box above to enable saving"
                      : cnicStatus === 'duplicate'
                        ? "Duplicate CNIC detected on Step 1"
                        : cnicStatus === 'checking'
                          ? "Verifying CNIC..."
                          : (!step1.full_name?.trim() || !step1.gender)
                            ? "Full Name and Gender on Step 1 are required"
                            : undefined
                  }
                  className="flex items-center gap-2 bg-[#C86A4A] text-white font-bold text-[14px] px-5 xl:px-8 py-3 xl:py-3.5 rounded-2xl hover:bg-[#b05a3e] hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  {isSaving ? (
                    <><Loader2 size={18} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={18} /> Save Profile</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile sidebar (Right) — floating dark panel ── */}
        <div className="bg-[#2F3E51] !bg-opacity-100 mix-blend-normal opacity-100 rounded-[28px] xl:rounded-[32px] lg:sticky lg:top-6 overflow-hidden p-5 lg:p-5 xl:p-7 2xl:p-9 shadow-2xl w-full lg:w-[290px] xl:w-[350px] 2xl:w-[420px] shrink-0 h-auto lg:h-[calc(100vh-48px)] overflow-y-auto hide-scrollbar self-start">
          <ProfileSidebar
            steps={dynamicSidebarSteps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            profileName={step1.full_name || undefined}
            gender={step1.gender || undefined}
            profilePicture={step1.profile_picture || undefined}
          />
        </div>
      </div>

      {/* ── Incomplete Mandatory Fields (Draft Confirmation) Modal ── */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowDraftModal(false)}
          />
          <div className="relative bg-[#FAF8F5] border border-[#E5DFD3] rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#1E1F22]">Incomplete Mandatory Fields</h3>
                  <p className="text-[12px] text-[#7D766C]">Required information is missing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="p-1.5 rounded-full hover:bg-[#EAE4D9] text-[#7D766C] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Missing fields list */}
            <p className="text-[13px] text-[#4E473D] mb-3 leading-relaxed">
              Currently, the following mandatory fields are not entered:
            </p>

            <div className="max-h-[220px] overflow-y-auto space-y-2 p-3 rounded-2xl bg-white border border-[#E9E4DC] mb-4 custom-scrollbar">
              {missingFieldsList.map((item) => (
                <div
                  key={item.stepId}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFE9DF]"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#064e3b] block mb-0.5">
                      Step {item.stepId}: {item.stepName}
                    </span>
                    <span className="text-[13px] text-[#2F3E51] font-semibold block">
                      {item.missingFields.join(', ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDraftModal(false);
                      goToStep(item.stepId);
                    }}
                    className="text-[11px] font-bold text-[#C86A4A] hover:text-[#b05a3e] px-2 py-1 shrink-0 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    Fill now →
                  </button>
                </div>
              ))}
            </div>

            {/* Note & Confirmation Question */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-900 text-[12.5px] leading-relaxed mb-6 font-medium">
              Because mandatory fields remain incomplete, this profile will be saved as a <strong>DRAFT</strong>.
              <span className="block mt-1 font-semibold text-[#1E1F22]">Do you want to continue?</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EFE9DF]/80">
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="px-6 py-2.5 rounded-full text-[13px] font-bold bg-[#EAE4D9] text-[#2F3E51] hover:bg-[#DED5C5] transition-all"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={() => performSave(true)}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full text-[13px] font-bold bg-[#C86A4A] text-white hover:bg-[#b05a3e] shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> Yes, Save as Draft</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
