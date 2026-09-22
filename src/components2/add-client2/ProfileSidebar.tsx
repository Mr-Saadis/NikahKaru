import { ChevronRight, User } from "lucide-react";
import Image from "next/image";

const STEP_DESCRIPTIONS = [
  "Name, gender, DOB, contact, CNIC",
  "Marital status, height, weight, etc.",
  "Education, occupation, income",
  "Religion, fiqah, caste, language",
  "Current & permanent address",
  "Parents, siblings, family background",
  "Habits, relocation preferences",
  "Must Have, Highly Preferred...",
  "Confirm and save profile"
];

export function ProfileSidebar({ 
  steps, 
  currentStep, 
  setCurrentStep, 
  profileImage,
  stepProgress = []
}: { 
  steps: string[], 
  currentStep: number, 
  setCurrentStep: (s: number) => void, 
  profileImage: string | null,
  stepProgress?: number[]
}) {
  return (
    <div className="bg-[#FBF9F5] rounded-[32px] p-6 border border-[#064e3b]/10 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] relative">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#F7F3EA] border border-[#ECC066]/60 flex items-center justify-center text-[#725b24] shrink-0 overflow-hidden relative">
          {profileImage ? (
            <Image src={profileImage} alt="Profile" fill className="object-cover" />
          ) : (
            <User size={24} />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-[#002b17] text-base">Client Profile</h3>
          <p className="text-xs text-[#7C756B] mt-1 leading-relaxed">
            This information will help us find the<br />best possible matches for the client.
          </p>
        </div>
      </div>

      <div className="space-y-1 relative before:absolute before:inset-y-4 before:left-[22px] before:w-px before:bg-[#E9E4DC] before:z-0">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const progress = stepProgress[index] || 0;
          const isFullyCompleted = progress === 100;

          return (
            <button
              key={step}
              onClick={() => setCurrentStep(stepNum)}
              className="w-full text-left flex items-start gap-4 p-2 rounded-2xl hover:bg-white/50 transition-colors group relative z-10"
            >
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 transition-colors relative z-20 ${
                  isActive 
                    ? "bg-[#064e3b] text-white shadow-md shadow-[#064e3b]/20" 
                    : isFullyCompleted
                      ? "bg-[#E5EFE9] text-[#064e3b]"
                      : "bg-[#FBF9F5] border border-[#E9E4DC] text-[#888174] group-hover:border-[#064e3b]/30"
                }`}
              >
                {stepNum}
              </div>
              <div className="flex-1 py-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-semibold transition-colors ${
                      isActive ? "text-[#002b17]" : "text-[#4E473D] group-hover:text-[#002b17]"
                    }`}>
                      {step}
                    </span>
                    {progress > 0 && progress < 100 && (
                      <span className="text-[10px] font-medium text-[#9A6014] bg-[#FEF3C7] px-1.5 py-0.5 rounded-md">
                        {progress}%
                      </span>
                    )}
                    {isFullyCompleted && (
                      <span className="text-[10px] font-medium text-[#064e3b] bg-[#064e3b]/10 px-1.5 py-0.5 rounded-md">
                        100%
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className={isActive ? "text-[#888174]" : "text-[#A49C8F] opacity-0 group-hover:opacity-100 transition-opacity"} />
                </div>
                <p className="text-[11px] text-[#888174] mt-0.5 leading-snug">
                  {STEP_DESCRIPTIONS[index]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
