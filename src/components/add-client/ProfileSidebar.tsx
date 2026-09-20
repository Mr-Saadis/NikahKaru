import { ChevronRight, User } from "lucide-react";
import Image from "next/image";

const STEP_DESCRIPTIONS = [
  "Name, gender, DOB, contact, CNIC",
  "Marital status, height, weight, etc.",
  "Education, occupation, income",
  "Religion, fiqah, caste, language",
  "Current & permanent address",
  "Parents, siblings, family background",
  "Habits, interests, requirements",
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
    <div className="bg-[#F8FAF9] rounded-[20px] p-6 border border-brand-green/10 shadow-sm relative">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green shrink-0 overflow-hidden relative">
          {profileImage ? (
            <Image src={profileImage} alt="Profile" fill className="object-cover" />
          ) : (
            <User size={24} />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base">Client Profile</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            This information will help us find the<br />best possible matches for the client.
          </p>
        </div>
      </div>

      <div className="space-y-1 relative before:absolute before:inset-y-4 before:left-[22px] before:w-px before:bg-gray-200 before:z-0">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const progress = stepProgress[index] || 0;
          const isFullyCompleted = progress === 100;

          return (
            <button
              key={step}
              onClick={() => setCurrentStep(stepNum)}
              className="w-full text-left flex items-start gap-4 p-2 rounded-xl hover:bg-white/50 transition-colors group relative z-10"
            >
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 transition-colors relative z-20 ${
                  isActive 
                    ? "bg-brand-green text-white shadow-md shadow-brand-green/20" 
                    : isFullyCompleted
                      ? "bg-[#E8EFEA] text-brand-green"
                      : "bg-[#F8FAF9] border border-gray-200 text-gray-400 group-hover:border-brand-green/30"
                }`}
              >
                {stepNum}
              </div>
              <div className="flex-1 py-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-semibold transition-colors ${
                      isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                    }`}>
                      {step}
                    </span>
                    {progress > 0 && progress < 100 && (
                      <span className="text-[10px] font-medium text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        {progress}%
                      </span>
                    )}
                    {isFullyCompleted && (
                      <span className="text-[10px] font-medium text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded-md">
                        100%
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className={isActive ? "text-gray-400" : "text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"} />
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
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
