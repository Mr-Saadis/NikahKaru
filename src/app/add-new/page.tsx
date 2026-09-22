"use client";

import { useState } from "react";
import { HorizontalStepper } from "@/components/add-client/HorizontalStepper";
import { ProfileSidebar } from "@/components/add-client/ProfileSidebar";
import { BasicInfoStep } from "@/components/add-client/steps/BasicInfoStep";
import { MaritalPhysicalStep } from "@/components/add-client/steps/MaritalPhysicalStep";
import { EducationProfessionStep } from "@/components/add-client/steps/EducationProfessionStep";
import { ReligionCultureStep } from "@/components/add-client/steps/ReligionCultureStep";
import { LocationResidencyStep } from "@/components/add-client/steps/LocationResidencyStep";
import { FamilyDetailsStep } from "@/components/add-client/steps/FamilyDetailsStep";
import { LifestylePreferencesStep } from "@/components/add-client/steps/LifestylePreferencesStep";
import { PartnerPreferencesStep } from "@/components/add-client/steps/PartnerPreferencesStep";
import { ReviewStep } from "@/components/add-client/steps/ReviewStep";

const STEPS = [
  "Basic Information",
  "Marital & Physical",
  "Education & Profession",
  "Religion & Culture",
  "Location & Residency",
  "Family Details",
  "Lifestyle",
  "Partner Preferences",
  "Review"
];

export default function AddNewClientPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Track percentage completion for each of the 9 steps
  const [stepProgress, setStepProgress] = useState<number[]>(Array(9).fill(0));

  const handleProgressChange = (stepIndex: number, progress: number) => {
    setStepProgress(prev => {
      if (prev[stepIndex] === progress) return prev;
      const newProgress = [...prev];
      newProgress[stepIndex] = progress;
      return newProgress;
    });
  };

  return (
    <div className="p-8 xl:p-10 w-full max-w-[1600px] mx-auto space-y-8 relative z-10">
      {/* Header Area */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-2">
            Add New Client
          </p>
          <h1 className="text-[32px] md:text-[40px] font-serif text-brand-green mb-3 leading-[1.1] tracking-tight">
            Create a New Client Profile
          </h1>
          <p className="text-gray-500 text-sm">
            Fill in the client details step by step. You can save and continue later if needed.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end pt-4">

          <div className="w-12 h-0.5 bg-[#D1C696] mt-4"></div>
        </div>
      </div>

      {/* Stepper */}
      <HorizontalStepper steps={STEPS} currentStep={currentStep} stepProgress={stepProgress} />

      {/* Main Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form Content */}
        <div className="lg:col-span-8 bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
          {currentStep === 1 && (
            <BasicInfoStep 
              onNext={() => setCurrentStep(2)} 
              onCancel={() => {}} 
              profileImage={profileImage}
              setProfileImage={setProfileImage}
              onProgressChange={(progress) => handleProgressChange(0, progress)}
            />
          )}
          {currentStep === 2 && (
            <MaritalPhysicalStep onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />
          )}
          {currentStep === 3 && (
            <EducationProfessionStep onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
          )}
          {currentStep === 4 && (
            <ReligionCultureStep onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} />
          )}
          {currentStep === 5 && (
            <LocationResidencyStep onNext={() => setCurrentStep(6)} onBack={() => setCurrentStep(4)} />
          )}
          {currentStep === 6 && (
            <FamilyDetailsStep onNext={() => setCurrentStep(7)} onBack={() => setCurrentStep(5)} />
          )}
          {currentStep === 7 && (
            <LifestylePreferencesStep onNext={() => setCurrentStep(8)} onBack={() => setCurrentStep(6)} />
          )}
          {currentStep === 8 && (
            <PartnerPreferencesStep onNext={() => setCurrentStep(9)} onBack={() => setCurrentStep(7)} />
          )}
          {currentStep === 9 && (
            <ReviewStep onBack={() => setCurrentStep(8)} />
          )}
        </div>

        {/* Right: Summary Sidebar */}
        <div className="lg:col-span-4 sticky top-8">
          <ProfileSidebar 
            steps={STEPS} 
            currentStep={currentStep} 
            setCurrentStep={setCurrentStep} 
            profileImage={profileImage}
            stepProgress={stepProgress}
          />
        </div>
      </div>
    </div>
  );
}
