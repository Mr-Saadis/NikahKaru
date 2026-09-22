"use client";

import { useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import Sidebar2 from "../../components2/Sidebar2";
import { HorizontalStepper } from "@/components2/add-client2/HorizontalStepper";
import { ProfileSidebar } from "@/components2/add-client2/ProfileSidebar";
import { BasicInfoStep } from "@/components2/add-client2/steps/BasicInfoStep";
import { MaritalPhysicalStep } from "@/components2/add-client2/steps/MaritalPhysicalStep";
import { EducationProfessionStep } from "@/components2/add-client2/steps/EducationProfessionStep";
import { ReligionCultureStep } from "@/components2/add-client2/steps/ReligionCultureStep";
import { LocationResidencyStep } from "@/components2/add-client2/steps/LocationResidencyStep";
import { FamilyDetailsStep } from "@/components2/add-client2/steps/FamilyDetailsStep";
import { LifestylePreferencesStep } from "@/components2/add-client2/steps/LifestylePreferencesStep";
import { PartnerPreferencesStep } from "@/components2/add-client2/steps/PartnerPreferencesStep";
import { ReviewStep } from "@/components2/add-client2/steps/ReviewStep";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

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
    <div className={`fixed inset-0 z-50 flex flex-col md:flex-row bg-[#FAF8F5] text-[#1E2022] ${plusJakartaSans.className} antialiased overflow-hidden`}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Subtle custom scrollbars */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #e2dcd2;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #c8c0b4;
        }
      `}} />

      {/* BEGIN: LeftSidebar (Using the exact same sidebar from client2) */}
      <Sidebar2 activePage="add-new" />
      
      {/* BEGIN: MainContentArea */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* BEGIN: TopHeaderBar (Analogous to Header2 but for Add New Profile) */}
        <header className="bg-[#FCF9F4] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E4DC]">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl lg:text-[28px] font-extrabold text-[#002b17] tracking-tight">Create a New Client Profile</h1>
              <p className="text-[13px] font-medium text-[#717972] mt-0.5">
                Fill in the client details step by step. You can save and continue later if needed.
              </p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
            
          </div>
        </header>
        {/* END: TopHeaderBar */}
        
        {/* BEGIN: DashboardBodyContainer */}
        <div className="p-6 lg:p-8 space-y-7 w-full max-w-[1540px] mx-auto">
          {/* Stepper */}
          <HorizontalStepper steps={STEPS} currentStep={currentStep} stepProgress={stepProgress} />

          {/* Main Form Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Form Content */}
            <div className="lg:col-span-8 bg-white rounded-[32px] p-8 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] border border-[#E9E4DC]">
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
        {/* END: DashboardBodyContainer */}
      </main>
      {/* END: MainContentArea */}
    </div>
  );
}
