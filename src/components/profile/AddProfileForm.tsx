'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProfileService } from '@/lib/services/profile-service';
import { PreferenceService } from '@/lib/services/preference-service';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
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
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';

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
const defaultStep1 = (): Step1Data => ({ gender: '', full_name: '', date_of_birth: '', marital_status: 'NEVER_MARRIED', number_of_children: '', children_living_with: '', nationality_country_id: '', mother_tongue_id: '', profile_picture: '' });
const defaultStep2 = (): Step2Data => ({ height_cm: '', weight_kg: '', complexion: '', has_disability: false, disability_details: '' });
const defaultStep3 = (): Step3Data => ({ education_records: [], employment_records: [], monthly_income_min: '', monthly_income_max: '' });
const defaultStep4 = (): Step4Data => ({ religion_id: 1, sect_id: '', caste_id: '', other_caste_text: '' });
const defaultStep5 = (): Step5Data => ({ current_country_id: '', current_province_id: '', current_city_id: '', permanent_country_id: '', permanent_province_id: '', permanent_city_id: '', current_location_text: '', permanent_location_text: '', house_status: '', property_type: '', family_setup: '', living_with: '' });
const defaultStep6 = (): Step6Data => ({ parents: [], siblings: [], family_profession_business: '', social_background: '', family_values: '', family_introduction: '' });
const defaultStep7 = (): Step7Data => ({ beard: '', hijab: '', religious_practice: '', smoking: '', other_lifestyle_information: '', willing_to_relocate: '', preferred_country_id: '', preferred_province_id: '', preferred_city_id: '', relocation_details: '' });
const defaultStep8 = (): Step8Data => ({ pref_min_age: '', pref_max_age: '', pref_age_importance: '', pref_marital_status: '', pref_marital_importance: '', pref_children_allowed: '', pref_children_importance: '', pref_min_height: '', pref_max_height: '', pref_height_importance: '', pref_disability_allowed: '', pref_disability_importance: '', pref_religion_id: 1, pref_religion_importance: '', pref_sect_id: '', pref_sect_importance: '', pref_caste_id: '', pref_caste_importance: '', pref_religious_practice: '', pref_religious_practice_importance: '', pref_min_income: '', pref_max_income: '', pref_income_importance: '', pref_location_country_id: '', pref_location_importance: '', pref_family_setup: '', pref_family_setup_importance: '', pref_smoking: '', pref_smoking_importance: '' });

export default function AddProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [profileId, setProfileId] = useState<string | null>(searchParams.get('draftId') || searchParams.get('edit'));

  useEffect(() => {
    setProfileId(searchParams.get('draftId') || searchParams.get('edit'));
  }, [searchParams]);

  // Helper to get profile-specific localStorage key
  const getLocalStorageKey = (pid: string | null) => `nikahkaro_draft_${pid || 'new'}`;

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Initial load recovery — DB + localStorage merge (localStorage = unsaved changes, takes priority)
  useEffect(() => {
    let isMounted = true;
    setIsInitialLoadDone(false);

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
          const profile = await ProfileService.getProfileById(profileId);
          console.log('loadDraft: Profile fetched:', profile);

          const prefs = await PreferenceService.getCurrentPreferences(profileId);

          if (!isMounted) return;

          // Step 1
          if (profile.personal_information) {
            // Note: If personal_information is returned as an array, use [0]
            const pi = Array.isArray(profile.personal_information) ? profile.personal_information[0] : profile.personal_information;

            if (pi) {
              setStep1(prev => ({
                ...prev,
                gender: profile.gender || '',
                profile_picture: profile.profile_URL || undefined,
                full_name: pi.full_name || '',
                date_of_birth: pi.date_of_birth ? pi.date_of_birth.split('T')[0] : '',
                marital_status: pi.marital_status || 'NEVER_MARRIED',
                number_of_children: pi.number_of_children?.toString() || '',
                nationality_country_id: pi.nationality_country_id?.toString() || '',
                mother_tongue_id: pi.mother_tongue_id?.toString() || '',
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
              education_records: (profile.education_records || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID() })),
              employment_records: (profile.employment_records || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID() })),
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
              current_country_id: pl?.current_country_id?.toString() || '',
              current_province_id: pl?.current_province_id?.toString() || '',
              current_city_id: pl?.current_city_id?.toString() || '',
              permanent_country_id: pl?.permanent_country_id?.toString() || '',
              permanent_province_id: pl?.permanent_province_id?.toString() || '',
              permanent_city_id: pl?.permanent_city_id?.toString() || '',
              current_location_text: pl?.current_location_text || '',
              permanent_location_text: pl?.permanent_location_text || '',
              house_status: res?.house_status || '',
              property_type: res?.property_type || '',
              family_setup: res?.family_setup || '',
              living_with: res?.living_with || ''
            }));
          }

          // Step 6
          if (profile.parents || profile.siblings || profile.family_information) {
            const fi = Array.isArray(profile.family_information) ? profile.family_information[0] : (profile.family_information || {});
            setStep6(prev => ({
              ...prev,
              parents: (profile.parents || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID() })),
              siblings: (profile.siblings || []).map((r: any) => ({ ...r, _tempId: r.id || crypto.randomUUID() })),
              family_profession_business: fi?.family_profession_business || '',
              social_background: fi?.social_background || '',
              family_values: fi?.family_values || '',
              family_introduction: fi?.family_introduction || ''
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
                pref_age_importance: prefs.basic.age_importance || '',
                pref_marital_status: prefs.basic.preferred_marital_status || '',
                pref_marital_importance: prefs.basic.marital_status_importance || '',
                pref_children_allowed: prefs.basic.children_allowed || '',
                pref_children_importance: prefs.basic.children_importance || '',
              }),
              ...(prefs.physical && {
                pref_min_height: prefs.physical.min_height_cm || '',
                pref_max_height: prefs.physical.max_height_cm || '',
                pref_height_importance: prefs.physical.height_importance || '',
                pref_disability_allowed: prefs.physical.disability_allowed || '',
                pref_disability_importance: prefs.physical.disability_importance || '',
              }),
              ...(prefs.religion && {
                pref_religion_id: prefs.religion.religion_id || 1,
                pref_religion_importance: prefs.religion.religion_importance || '',
                pref_sect_id: prefs.religion.sect_id || '',
                pref_sect_importance: prefs.religion.sect_importance || '',
                pref_caste_id: prefs.religion.caste_id || '',
                pref_caste_importance: prefs.religion.caste_importance || '',
                pref_religious_practice: prefs.religion.religious_practice || '',
                pref_religious_practice_importance: prefs.religion.religious_practice_importance || '',
              }),
              ...(prefs.profession && {
                pref_min_income: prefs.profession.minimum_monthly_income || '',
                pref_max_income: prefs.profession.maximum_monthly_income || '',
                pref_income_importance: prefs.profession.income_importance || '',
              }),
              ...(prefs.location && {
                pref_location_country_id: prefs.location.country_id || '',
                pref_location_importance: prefs.location.country_importance || '',
              }),
              ...(prefs.family && {
                pref_family_setup: prefs.family.family_setup || '',
                pref_family_setup_importance: prefs.family.family_setup_importance || '',
              }),
              ...(prefs.lifestyle && {
                pref_smoking: prefs.lifestyle.smoking || '',
                pref_smoking_importance: prefs.lifestyle.smoking_importance || '',
              })
            }));
          }

          // We intentionally DO NOT merge localData here when editing an existing profile,
          // because an empty localData skeleton would overwrite the actual DB data with empty strings.

        } catch (e) {
          console.error('Failed to load draft from DB', e);
          // Fall back to localStorage only
          if (localData) {
            if (localData.step1) setStep1(localData.step1);
            if (localData.step2) setStep2(localData.step2);
            if (localData.step3) setStep3(localData.step3);
            if (localData.step4) setStep4(localData.step4);
            if (localData.step5) setStep5(localData.step5);
            if (localData.step6) setStep6(localData.step6);
            if (localData.step7) setStep7(localData.step7);
            if (localData.step8) setStep8(localData.step8);
          }
        } finally {
          if (isMounted) setIsInitialLoadDone(true);
        }
      };

      loadDraft();
    } else {
      // No profileId — new profile, load from localStorage
      if (localData) {
        try {
          if (localData.step1) setStep1(localData.step1);
          if (localData.step2) setStep2(localData.step2);
          if (localData.step3) setStep3(localData.step3);
          if (localData.step4) setStep4(localData.step4);
          if (localData.step5) setStep5(localData.step5);
          if (localData.step6) setStep6(localData.step6);
          if (localData.step7) setStep7(localData.step7);
          if (localData.step8) setStep8(localData.step8);
        } catch (e) {
          console.error('Failed to recover from local storage', e);
        }
      }
      setIsInitialLoadDone(true);
    }
    return () => { isMounted = false; };
  }, [profileId]);

  // Instant LocalStorage save on any change (guarded: only after initial load to prevent overwriting unsaved data)
  useEffect(() => {
    if (!isInitialLoadDone) return;
    // Exclude profile_picture_file from local storage to save space
    const dataToSave = { ...formData };
    if (dataToSave.step1.profile_picture_file) {
      dataToSave.step1 = { ...dataToSave.step1, profile_picture_file: undefined };
    }
    const key = getLocalStorageKey(profileId);
    localStorage.setItem(key, JSON.stringify(dataToSave));
  }, [formData, profileId, isInitialLoadDone]);

  // 30-second AutoSave to DB
  useAutoSave({
    data: formData,
    enabled: !!profileId && isInitialLoadDone, // Only auto-save after initial data load completes
    delay: 30000,
    onSave: async (data, dirtyKeys) => {
      if (!profileId) return;
      console.log('Auto-saving dirty steps to DB:', dirtyKeys);

      const pid = profileId;
      const tasks = [];

      if (dirtyKeys.includes('step1')) {
        tasks.push(ProfileService.savePersonalInfo(pid, {
          full_name: data.step1.full_name,
          date_of_birth: data.step1.date_of_birth || null,
          marital_status: data.step1.marital_status || 'NEVER_MARRIED',
          nationality_country_id: data.step1.nationality_country_id ? Number(data.step1.nationality_country_id) : null,
          mother_tongue_id: data.step1.mother_tongue_id ? Number(data.step1.mother_tongue_id) : null,
          number_of_children: data.step1.number_of_children ? Number(data.step1.number_of_children) : 0,
        }));
      }

      if (dirtyKeys.includes('step2')) {
        tasks.push(ProfileService.savePhysicalInfo(pid, {
          height_cm: data.step2.height_cm && data.step2.height_cm >= 80 && data.step2.height_cm <= 250 ? Number(data.step2.height_cm) : null,
          weight_kg: data.step2.weight_kg && data.step2.weight_kg >= 20 && data.step2.weight_kg <= 400 ? Number(data.step2.weight_kg) : null,
          complexion: data.step2.complexion || null,
          has_disability: data.step2.has_disability,
          disability_details: data.step2.has_disability ? data.step2.disability_details : null,
        }));
      }

      if (dirtyKeys.includes('step3')) {
        const validEdus = data.step3.education_records.filter(e => e.education_level_id).map(({ _tempId, ...rest }) => rest);
        tasks.push(ProfileService.saveEducationRecords(pid, validEdus));
        const validEmps = data.step3.employment_records.filter(e => e.occupation_id && e.employment_type).map(({ _tempId, ...rest }) => rest);
        tasks.push(ProfileService.saveEmploymentRecords(pid, validEmps));
        if (data.step3.monthly_income_min || data.step3.monthly_income_max) {
          tasks.push(ProfileService.saveIncomeInfo(pid, {
            monthly_income_min: data.step3.monthly_income_min ? Number(data.step3.monthly_income_min) : null,
            monthly_income_max: data.step3.monthly_income_max ? Number(data.step3.monthly_income_max) : null,
            currency_code: 'PKR',
            income_period: 'MONTHLY',
          }));
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
        tasks.push(ProfileService.saveLocations(pid, {
          current_country_id: data.step5.current_country_id ? Number(data.step5.current_country_id) : null,
          current_province_id: data.step5.current_country_id === 131 && data.step5.current_province_id ? Number(data.step5.current_province_id) : null,
          current_city_id: data.step5.current_country_id === 131 && data.step5.current_city_id ? Number(data.step5.current_city_id) : null,
          permanent_country_id: data.step5.permanent_country_id ? Number(data.step5.permanent_country_id) : null,
          permanent_province_id: data.step5.permanent_country_id === 131 && data.step5.permanent_province_id ? Number(data.step5.permanent_province_id) : null,
          permanent_city_id: data.step5.permanent_country_id === 131 && data.step5.permanent_city_id ? Number(data.step5.permanent_city_id) : null,
          current_location_text: (data.step5.current_country_id !== 131 ? [data.step5.current_city_text, data.step5.current_province_text, data.step5.current_location_text].filter(Boolean).join(', ') : data.step5.current_location_text) || null,
          permanent_location_text: (data.step5.permanent_country_id !== 131 ? [data.step5.permanent_city_text, data.step5.permanent_province_text, data.step5.permanent_location_text].filter(Boolean).join(', ') : data.step5.permanent_location_text) || null,
        }));
        tasks.push(ProfileService.saveResidencyInfo(pid, {
          house_status: data.step5.house_status || null,
          property_type: data.step5.property_type || null,
          family_setup: data.step5.family_setup || null,
          living_with: data.step5.living_with || null,
        }));
      }

      if (dirtyKeys.includes('step6')) {
        tasks.push(ProfileService.saveParents(pid, data.step6.parents.map(({ _tempId, ...rest }) => ({
          ...rest,
          age: rest.age ? Number(rest.age) : null,
        }))));
        tasks.push(ProfileService.saveSiblings(pid, data.step6.siblings.map(({ _tempId, ...rest }) => ({
          ...rest,
          gender: rest.gender || 'MALE',
          age: rest.age ? Number(rest.age) : null,
          marital_status: rest.marital_status || null,
        }))));
        tasks.push(ProfileService.saveFamilyInfo(pid, {
          family_profession_business: data.step6.family_profession_business || null,
          social_background: data.step6.social_background || null,
          family_values: data.step6.family_values || null,
          family_introduction: data.step6.family_introduction || null,
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
            age_importance: data.step8.pref_age_importance || null,
            preferred_marital_status: data.step8.pref_marital_status || null,
            marital_status_importance: data.step8.pref_marital_importance || null,
            children_allowed: data.step8.pref_children_allowed || null,
            children_importance: data.step8.pref_children_importance || null,
            preferred_gender: null,
            gender_importance: null,
            created_at: new Date().toISOString()
          },
          physical: {
            preference_set_id: '',
            min_height_cm: data.step8.pref_min_height ? Number(data.step8.pref_min_height) : null,
            max_height_cm: data.step8.pref_max_height ? Number(data.step8.pref_max_height) : null,
            height_importance: data.step8.pref_height_importance || null,
            disability_allowed: data.step8.pref_disability_allowed || null,
            disability_importance: data.step8.pref_disability_importance || null,
            min_weight_kg: null,
            max_weight_kg: null,
            weight_importance: null,
            preferred_complexion: null,
            complexion_importance: null,
            beard_preference: null,
            beard_importance: null,
            hijab_preference: null,
            hijab_importance: null,
            created_at: new Date().toISOString()
          },
          education: {
            preference_set_id: '',
            minimum_education_level_id: null,
            education_importance: null,
            preferred_field_of_study: null,
            field_importance: null,
            created_at: new Date().toISOString()
          },
          profession: {
            preference_set_id: '',
            minimum_monthly_income: data.step8.pref_min_income ? Number(data.step8.pref_min_income) : null,
            maximum_monthly_income: data.step8.pref_max_income ? Number(data.step8.pref_max_income) : null,
            income_importance: data.step8.pref_income_importance || null,
            preferred_occupation_id: null,
            occupation_importance: null,
            preferred_employment_type: null,
            employment_type_importance: null,
            created_at: new Date().toISOString()
          },
          religion: {
            preference_set_id: '',
            religion_id: data.step8.pref_religion_id ? Number(data.step8.pref_religion_id) : null,
            religion_importance: data.step8.pref_religion_importance || null,
            sect_id: data.step8.pref_sect_id ? Number(data.step8.pref_sect_id) : null,
            sect_importance: data.step8.pref_sect_importance || null,
            caste_id: data.step8.pref_caste_id ? Number(data.step8.pref_caste_id) : null,
            caste_importance: data.step8.pref_caste_importance || null,
            religious_practice: data.step8.pref_religious_practice || null,
            religious_practice_importance: data.step8.pref_religious_practice_importance || null,
            created_at: new Date().toISOString()
          },
          location: {
            preference_set_id: '',
            country_id: data.step8.pref_location_country_id ? Number(data.step8.pref_location_country_id) : null,
            country_importance: data.step8.pref_location_importance || null,
            province_id: null,
            province_importance: null,
            city_id: null,
            city_importance: null,
            location_details: null,
            created_at: new Date().toISOString()
          },
          family: {
            preference_set_id: '',
            family_setup: data.step8.pref_family_setup || null,
            family_setup_importance: data.step8.pref_family_setup_importance || null,
            living_with: null,
            living_with_importance: null,
            parents_status_preference: null,
            parents_status_importance: null,
            created_at: new Date().toISOString()
          },
          lifestyle: {
            preference_set_id: '',
            smoking: data.step8.pref_smoking || null,
            smoking_importance: data.step8.pref_smoking_importance || null,
            religious_practice: data.step8.pref_religious_practice || null,
            religious_practice_importance: data.step8.pref_religious_practice_importance || null,
            beard_preference: null,
            beard_importance: null,
            hijab_preference: null,
            hijab_importance: null,
            additional_preferences: null,
            created_at: new Date().toISOString()
          },
          relocation: {
            preference_set_id: '',
            willing_to_relocate_required: null,
            relocation_importance: null,
            country_id: null,
            country_importance: null,
            province_id: null,
            province_importance: null,
            city_id: null,
            city_importance: null,
            created_at: new Date().toISOString()
          }
        }, user.id));
      }

      if (tasks.length > 0) {
        await Promise.all(tasks);
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
          mother_tongue_id: step1.mother_tongue_id ? Number(step1.mother_tongue_id) : null,
          number_of_children: step1.number_of_children ? Number(step1.number_of_children) : 0,
        });

        const oldKey = getLocalStorageKey(null);
        const existingLocal = localStorage.getItem(oldKey);
        if (existingLocal) {
          localStorage.setItem(getLocalStorageKey(pid), existingLocal);
          localStorage.removeItem(oldKey);
        }

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
    if (isUploadingImage) return; // Prevent navigation while uploading

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
            date_of_birth: step1.date_of_birth || null,
            marital_status: step1.marital_status || 'NEVER_MARRIED',
            nationality_country_id: step1.nationality_country_id ? Number(step1.nationality_country_id) : null,
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

    if (step >= 1 && step <= STEPS.length) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(step);
    }
  };

  const next = () => goToStep(currentStep + 1);
  const back = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ── Step completion logic ───────────────────────────────────
  const getStepStats = (stepId: number): { completed: number, total: number, mandatoryComplete: boolean } => {
    switch (stepId) {
      case 1: {
        const total = 6;
        let completed = 0;
        if (step1.gender) completed++;
        if (step1.full_name) completed++;
        if (step1.date_of_birth) completed++;
        if (step1.marital_status) completed++;
        if (step1.nationality_country_id) completed++;
        if (step1.mother_tongue_id) completed++;
        const mandatoryComplete = !!(step1.gender && step1.full_name && step1.date_of_birth && step1.marital_status);
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
        const mandatoryComplete = !!(step2.height_cm && step2.weight_kg);
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
        const validEmp = step3.employment_records.some(r => !!(r.occupation_id && r.employment_type));
        const mandatoryComplete = validEdu && validEmp;
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
        const mandatoryComplete = !!(step5.current_country_id && (step5.current_country_id === 131 ? (step5.current_province_id && step5.current_city_id) : step5.current_location_text));
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

        const hasFather = step6.parents.some(p => p.parent_type === 'FATHER');
        const hasMother = step6.parents.some(p => p.parent_type === 'MOTHER');
        const parentsValid = hasFather && hasMother && step6.parents.every(p => {
          if (p.status === 'DECEASED') return true;
          return !!(p.full_name && p.profession && p.education);
        });

        const mandatoryComplete = !!parentsValid;
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
        const total = 29;
        const completed = Object.values(step8).filter(v => v !== '' && v !== null && v !== undefined).length;

        // Age and Height are the only strict numeric ranges without an "Any" option, so we require them.
        const reqBasic = !!(step8.pref_min_age && step8.pref_max_age && step8.pref_age_importance);
        const reqPhys = !!(step8.pref_min_height && step8.pref_max_height && step8.pref_height_importance);

        // For other fields, "Any" sets them to '', so we cannot strictly require them to be truthy 
        // without blocking the user. We will just require the most critical ones (Age and Height).
        const mandatoryComplete = reqBasic && reqPhys;
        return { completed, total, mandatoryComplete };
      }
      default:
        return { completed: 1, total: 1, mandatoryComplete: true };
    }
  };

  const dynamicSidebarSteps = SIDEBAR_STEPS.map(s => {
    const stats = getStepStats(s.id);
    return {
      ...s,
      completedFields: stats.completed,
      totalFields: stats.total,
      mandatoryComplete: stats.mandatoryComplete
    };
  });

  // ── Final save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    try {
      // 1. Use existing draft profile or create new one
      let pid = profileId;
      if (!pid) {
        const profile = await ProfileService.createProfile(user.id, step1.gender as string);
        pid = profile.id;
      }

      // Profile picture upload is now handled immediately in handleImageUpload

      // 2. Save each section in parallel where possible
      await ProfileService.savePersonalInfo(pid, {
        full_name: step1.full_name,
        date_of_birth: step1.date_of_birth || null,
        marital_status: step1.marital_status || 'NEVER_MARRIED',
        nationality_country_id: step1.nationality_country_id ? Number(step1.nationality_country_id) : null,
        mother_tongue_id: step1.mother_tongue_id ? Number(step1.mother_tongue_id) : null,
        number_of_children: step1.number_of_children ? Number(step1.number_of_children) : 0,
      });

      await Promise.all([
        ProfileService.savePhysicalInfo(pid, {
          height_cm: step2.height_cm && step2.height_cm >= 80 && step2.height_cm <= 250 ? Number(step2.height_cm) : null,
          weight_kg: step2.weight_kg && step2.weight_kg >= 20 && step2.weight_kg <= 400 ? Number(step2.weight_kg) : null,
          complexion: step2.complexion || null,
          has_disability: step2.has_disability,
          disability_details: step2.has_disability ? step2.disability_details : null,
        }),
        ProfileService.saveEducationRecords(pid, step3.education_records.filter(e => e.education_level_id).map(({ _tempId, ...rest }) => rest)),
        ProfileService.saveEmploymentRecords(pid, step3.employment_records.filter(e => e.occupation_id && e.employment_type).map(({ _tempId, ...rest }) => rest)),
        ProfileService.saveReligionInfo(pid, {
          religion_id: step4.religion_id ? Number(step4.religion_id) : null,
          sect_id: step4.sect_id ? Number(step4.sect_id) : null,
          caste_id: step4.caste_id ? Number(step4.caste_id) : null,
          other_caste_text: step4.other_caste_text || null,
        }),
        ProfileService.saveLocations(pid, {
          current_country_id: step5.current_country_id ? Number(step5.current_country_id) : null,
          current_province_id: step5.current_country_id === 131 && step5.current_province_id ? Number(step5.current_province_id) : null,
          current_city_id: step5.current_country_id === 131 && step5.current_city_id ? Number(step5.current_city_id) : null,
          permanent_country_id: step5.permanent_country_id ? Number(step5.permanent_country_id) : null,
          permanent_province_id: step5.permanent_country_id === 131 && step5.permanent_province_id ? Number(step5.permanent_province_id) : null,
          permanent_city_id: step5.permanent_country_id === 131 && step5.permanent_city_id ? Number(step5.permanent_city_id) : null,
          current_location_text: (step5.current_country_id !== 131 ? [step5.current_city_text, step5.current_province_text, step5.current_location_text].filter(Boolean).join(', ') : step5.current_location_text) || null,
          permanent_location_text: (step5.permanent_country_id !== 131 ? [step5.permanent_city_text, step5.permanent_province_text, step5.permanent_location_text].filter(Boolean).join(', ') : step5.permanent_location_text) || null,
        }),
        ProfileService.saveResidencyInfo(pid, {
          house_status: step5.house_status || null,
          property_type: step5.property_type || null,
          family_setup: step5.family_setup || null,
          living_with: step5.living_with || null,
        }),
        ProfileService.saveParents(pid, step6.parents.map(({ _tempId, ...rest }) => ({
          ...rest,
          age: rest.age ? Number(rest.age) : null,
        }))),
        ProfileService.saveSiblings(pid, step6.siblings.map(({ _tempId, ...rest }) => ({
          ...rest,
          gender: rest.gender || 'MALE',
          age: rest.age ? Number(rest.age) : null,
          marital_status: rest.marital_status || null,
        }))),
        ProfileService.saveFamilyInfo(pid, {
          family_profession_business: step6.family_profession_business || null,
          social_background: step6.social_background || null,
          family_values: step6.family_values || null,
          family_introduction: step6.family_introduction || null,
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

      if (step3.monthly_income_min || step3.monthly_income_max) {
        await ProfileService.saveIncomeInfo(pid, {
          monthly_income_min: step3.monthly_income_min ? Number(step3.monthly_income_min) : null,
          monthly_income_max: step3.monthly_income_max ? Number(step3.monthly_income_max) : null,
          currency_code: 'PKR',
          income_period: 'MONTHLY',
        });
      }

      // 3. Save Preferences
      await PreferenceService.savePreferences(pid, {
        basic: {
          preference_set_id: '', // Set in service
          min_age: step8.pref_min_age ? Number(step8.pref_min_age) : null,
          max_age: step8.pref_max_age ? Number(step8.pref_max_age) : null,
          age_importance: step8.pref_age_importance || null,
          preferred_marital_status: step8.pref_marital_status || null,
          marital_status_importance: step8.pref_marital_importance || null,
          children_allowed: step8.pref_children_allowed || null,
          children_importance: step8.pref_children_importance || null,
          preferred_gender: null, // Default
          gender_importance: null, // Default
          created_at: new Date().toISOString()
        },
        physical: {
          preference_set_id: '',
          min_height_cm: step8.pref_min_height ? Number(step8.pref_min_height) : null,
          max_height_cm: step8.pref_max_height ? Number(step8.pref_max_height) : null,
          height_importance: step8.pref_height_importance || null,
          disability_allowed: step8.pref_disability_allowed || null,
          disability_importance: step8.pref_disability_importance || null,
          min_weight_kg: null,
          max_weight_kg: null,
          weight_importance: null,
          preferred_complexion: null,
          complexion_importance: null,
          beard_preference: null,
          beard_importance: null,
          hijab_preference: null,
          hijab_importance: null,
          created_at: new Date().toISOString()
        },
        education: {
          preference_set_id: '',
          minimum_education_level_id: null,
          education_importance: null,
          preferred_field_of_study: null,
          field_importance: null,
          created_at: new Date().toISOString()
        },
        profession: {
          preference_set_id: '',
          minimum_monthly_income: step8.pref_min_income ? Number(step8.pref_min_income) : null,
          maximum_monthly_income: step8.pref_max_income ? Number(step8.pref_max_income) : null,
          income_importance: step8.pref_income_importance || null,
          preferred_occupation_id: null,
          occupation_importance: null,
          preferred_employment_type: null,
          employment_type_importance: null,
          created_at: new Date().toISOString()
        },
        religion: {
          preference_set_id: '',
          religion_id: step8.pref_religion_id ? Number(step8.pref_religion_id) : null,
          religion_importance: step8.pref_religion_importance || null,
          sect_id: step8.pref_sect_id ? Number(step8.pref_sect_id) : null,
          sect_importance: step8.pref_sect_importance || null,
          caste_id: step8.pref_caste_id ? Number(step8.pref_caste_id) : null,
          caste_importance: step8.pref_caste_importance || null,
          religious_practice: step8.pref_religious_practice || null,
          religious_practice_importance: step8.pref_religious_practice_importance || null,
          created_at: new Date().toISOString()
        },
        location: {
          preference_set_id: '',
          country_id: step8.pref_location_country_id ? Number(step8.pref_location_country_id) : null,
          country_importance: step8.pref_location_importance || null,
          province_id: null,
          province_importance: null,
          city_id: null,
          city_importance: null,
          location_details: null,
          created_at: new Date().toISOString()
        },
        family: {
          preference_set_id: '',
          family_setup: step8.pref_family_setup || null,
          family_setup_importance: step8.pref_family_setup_importance || null,
          living_with: null,
          living_with_importance: null,
          parents_status_preference: null,
          parents_status_importance: null,
          created_at: new Date().toISOString()
        },
        lifestyle: {
          preference_set_id: '',
          smoking: step8.pref_smoking || null,
          smoking_importance: step8.pref_smoking_importance || null,
          religious_practice: step8.pref_religious_practice || null, // Shared with religion? Let's use same for now or null
          religious_practice_importance: step8.pref_religious_practice_importance || null,
          beard_preference: null,
          beard_importance: null,
          hijab_preference: null,
          hijab_importance: null,
          additional_preferences: null,
          created_at: new Date().toISOString()
        },
        relocation: {
          preference_set_id: '',
          willing_to_relocate_required: null,
          relocation_importance: null,
          country_id: null,
          country_importance: null,
          province_id: null,
          province_importance: null,
          city_id: null,
          city_importance: null,
          created_at: new Date().toISOString()
        }
      }, user.id);

      // 4. Update profile status based on whether all mandatory fields across all steps are filled
      const allMandatoryCompleted = SIDEBAR_STEPS.every(s => getStepStats(s.id).mandatoryComplete);
      await ProfileService.updateProfileStatus(pid, allMandatoryCompleted ? 'ACTIVE' : 'DRAFT');

      // Clear local storage drafts (both profile-specific and 'new' keys)
      localStorage.removeItem(getLocalStorageKey(pid));
      localStorage.removeItem(getLocalStorageKey(null));

      // Navigate to the new profile
      router.push(`/profiles/${pid}`);
    } catch (err: any) {
      console.error('Full save error:', { message: err?.message, stack: err?.stack, details: err?.details, code: err?.code, hint: err?.hint });
      const message = err?.message || (typeof err === 'string' ? err : 'Failed to save profile. Check console.');
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render current step ────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo data={step1} onChange={setStep1} onImageUpload={handleImageUpload} isUploadingImage={isUploadingImage} />;
      case 2: return <Step2MaritalPhysical data={step2} onChange={setStep2} />;
      case 3: return <Step3EducationProfession data={step3} onChange={setStep3} />;
      case 4: return <Step4ReligionCulture data={step4} onChange={setStep4} />;
      case 5: return <Step5LocationResidency data={step5} onChange={setStep5} />;
      case 6: return <Step6FamilyDetails data={step6} onChange={setStep6} />;
      case 7: return <Step7Lifestyle data={step7} onChange={setStep7} gender={step1.gender || undefined} />;
      case 8: return <Step8Preferences data={step8} onChange={setStep8} />;
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

        {/* ── Main form card ── */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[32px] border border-[#E9E4DC] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]">

            {/* Step content */}
            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium">
                  {error}
                </div>
              )}
              {renderStep()}
            </div>

            {/* Navigation buttons */}
            <div className="px-8 pb-8 flex items-center justify-between">
              <button
                type="button"
                onClick={back}
                disabled={currentStep === 1 || isUploadingImage}
                className="flex items-center gap-2 bg-white border border-[#E9E4DC] text-[#4E473D] font-bold text-[13px] px-5 py-2.5 rounded-full hover:bg-[#F4ECE1] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="text-[11px] text-[#A8A296] font-medium">
                Step {currentStep} of {STEPS.length}
              </div>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={isUploadingImage}
                  className="flex items-center gap-2 bg-[#064e3b] text-white font-bold text-[13px] px-5 py-2.5 rounded-full hover:bg-[#0f4229] hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isUploadingImage || !step1.full_name || !step1.gender}
                  className="flex items-center gap-2 bg-[#064e3b] text-white font-bold text-[13px] px-6 py-2.5 rounded-full hover:bg-[#0f4229] hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? (
                    <><Loader2 size={15} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={15} /> Save Profile</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile sidebar ── */}
        <div className="lg:col-span-4">
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
    </div>
  );
}
