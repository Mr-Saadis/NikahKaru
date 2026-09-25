'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProfileService } from '@/lib/services/profile-service';
import HorizontalStepper, { type StepConfig } from './HorizontalStepper';
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
const STEPS: StepConfig[] = [
  { id: 1, name: 'Basic Information',        shortName: 'Basic' },
  { id: 2, name: 'Physical',                 shortName: 'Physical' },
  { id: 3, name: 'Education & Profession',   shortName: 'Education' },
  { id: 4, name: 'Religion & Culture',       shortName: 'Religion' },
  { id: 5, name: 'Location & Residency',     shortName: 'Location' },
  { id: 6, name: 'Family Details',           shortName: 'Family' },
  { id: 7, name: 'Lifestyle',                shortName: 'Lifestyle' },
  { id: 8, name: 'Partner Preferences',      shortName: 'Prefs' },
  { id: 9, name: 'Review & Confirm',         shortName: 'Review' },
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
const defaultStep1 = (): Step1Data => ({ gender: '', full_name: '', date_of_birth: '', marital_status: '', nationality_country_id: '', mother_tongue_id: '' });
const defaultStep2 = (): Step2Data => ({ height_cm: '', weight_kg: '', complexion: '', has_disability: false, disability_details: '' });
const defaultStep3 = (): Step3Data => ({ education_records: [], employment_records: [], monthly_income_min: '', monthly_income_max: '' });
const defaultStep4 = (): Step4Data => ({ religion_id: '', sect_id: '', caste_id: '', other_caste_text: '' });
const defaultStep5 = (): Step5Data => ({ current_country_id: '', current_province_id: '', current_city_id: '', permanent_country_id: '', permanent_province_id: '', permanent_city_id: '', current_location_text: '', house_status: '', property_type: '', family_setup: '', living_with: '' });
const defaultStep6 = (): Step6Data => ({ parents: [], siblings: [], family_profession_business: '', social_background: '', family_values: '', family_introduction: '' });
const defaultStep7 = (): Step7Data => ({ beard: '', hijab: '', religious_practice: '', smoking: '', other_lifestyle_information: '', willing_to_relocate: '', preferred_country_id: '', preferred_province_id: '', preferred_city_id: '', relocation_details: '' });
const defaultStep8 = (): Step8Data => ({ pref_min_age: '', pref_max_age: '', pref_age_importance: '', pref_marital_status: '', pref_marital_importance: '', pref_children_allowed: '', pref_children_importance: '', pref_min_height: '', pref_max_height: '', pref_height_importance: '', pref_disability_allowed: '', pref_disability_importance: '', pref_religion_id: '', pref_religion_importance: '', pref_sect_id: '', pref_sect_importance: '', pref_caste_id: '', pref_caste_importance: '', pref_religious_practice: '', pref_religious_practice_importance: '', pref_min_income: '', pref_max_income: '', pref_income_importance: '', pref_location_country_id: '', pref_location_importance: '', pref_family_setup: '', pref_family_setup_importance: '', pref_smoking: '', pref_smoking_importance: '' });

export default function AddProfileForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
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

  // ── Navigation ─────────────────────────────────────────────
  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(step);
    }
  };

  const next = () => goToStep(currentStep + 1);
  const back = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ── Final save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    try {
      // 1. Create profile root
      const profile = await ProfileService.createProfile(user.id);
      const pid = profile.id;

      // 2. Save each section in parallel where possible
      await ProfileService.savePersonalInfo(pid, {
        full_name: step1.full_name,
        date_of_birth: step1.date_of_birth || null,
        marital_status: step1.marital_status || 'NEVER_MARRIED',
        nationality_country_id: step1.nationality_country_id ? Number(step1.nationality_country_id) : null,
        mother_tongue_id: step1.mother_tongue_id ? Number(step1.mother_tongue_id) : null,
        number_of_children: 0,
      });

      await Promise.all([
        ProfileService.savePhysicalInfo(pid, {
          height_cm: step2.height_cm ? Number(step2.height_cm) : null,
          weight_kg: step2.weight_kg ? Number(step2.weight_kg) : null,
          complexion: step2.complexion || null,
          has_disability: step2.has_disability,
          disability_details: step2.has_disability ? step2.disability_details : null,
        }),
        ProfileService.saveEducationRecords(pid, step3.education_records.map(({ _tempId, ...rest }) => rest)),
        ProfileService.saveEmploymentRecords(pid, step3.employment_records.map(({ _tempId, ...rest }) => rest)),
        ProfileService.saveReligionInfo(pid, {
          religion_id: step4.religion_id ? Number(step4.religion_id) : null,
          sect_id: step4.sect_id ? Number(step4.sect_id) : null,
          caste_id: step4.caste_id ? Number(step4.caste_id) : null,
          other_caste_text: step4.other_caste_text || null,
        }),
        ProfileService.saveLocations(pid, {
          current_country_id: step5.current_country_id ? Number(step5.current_country_id) : null,
          current_province_id: step5.current_province_id ? Number(step5.current_province_id) : null,
          current_city_id: step5.current_city_id ? Number(step5.current_city_id) : null,
          permanent_country_id: step5.permanent_country_id ? Number(step5.permanent_country_id) : null,
          permanent_province_id: step5.permanent_province_id ? Number(step5.permanent_province_id) : null,
          permanent_city_id: step5.permanent_city_id ? Number(step5.permanent_city_id) : null,
          current_location_text: step5.current_location_text || null,
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

      // Navigate to the new profile
      router.push(`/profiles/${pid}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render current step ────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo data={step1} onChange={setStep1} />;
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
          <div className="bg-white rounded-[32px] border border-[#E9E4DC] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] overflow-hidden">

            {/* Horizontal stepper */}
            <div className="border-b border-[#F0EBE2]">
              <HorizontalStepper steps={STEPS} currentStep={currentStep} />
            </div>

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
                disabled={currentStep === 1}
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
                  className="flex items-center gap-2 bg-[#064e3b] text-white font-bold text-[13px] px-5 py-2.5 rounded-full hover:bg-[#0f4229] hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !step1.full_name || !step1.gender}
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
            steps={SIDEBAR_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            profileName={step1.full_name || undefined}
            gender={step1.gender || undefined}
          />
        </div>
      </div>
    </div>
  );
}
