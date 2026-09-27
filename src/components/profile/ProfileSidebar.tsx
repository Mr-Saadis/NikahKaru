'use client';

import { Check, User } from 'lucide-react';

interface StepInfo {
  id: number;
  name: string;
  description: string;
  completedFields?: number;
  totalFields?: number;
  mandatoryComplete?: boolean;
}

interface ProfileSidebarProps {
  steps: StepInfo[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (stepId: number) => void;
  profileName?: string;
  gender?: 'MALE' | 'FEMALE';
  profilePicture?: string;
}

export default function ProfileSidebar({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  profileName,
  gender,
  profilePicture,
}: ProfileSidebarProps) {
  return (
    <div className="bg-[#FBF9F5] rounded-[32px] p-6 border border-[#064e3b]/10 sticky top-6">
      {/* Profile avatar */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#EFE9DF]">
        <div className="w-12 h-12 rounded-full bg-[#F7F3EA] border border-[#ECC066]/60 flex items-center justify-center text-[#725b24] flex-shrink-0 overflow-hidden shadow-sm">
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 opacity-70" />
          )}
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#002b17]">
            {profileName || 'New Profile'}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#888174] mt-0.5">
            {gender ? (
              gender === 'MALE' ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="14" r="7"/>
                    <line x1="15" y1="9" x2="21" y2="3"/>
                    <line x1="16" y1="3" x2="21" y2="3"/>
                    <line x1="21" y1="3" x2="21" y2="8"/>
                  </svg>
                  Male
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="7"/>
                    <line x1="12" y1="17" x2="12" y2="23"/>
                    <line x1="9" y1="20" x2="15" y2="20"/>
                  </svg>
                  Female
                </>
              )
            ) : (
              'Profile in progress'
            )}
          </div>
        </div>
      </div>

      {/* Steps list */}
      <div className="relative">
        <div className="flex flex-col gap-1">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isComplete = step.mandatoryComplete ?? completedSteps.has(step.id);
            const percent = step.totalFields ? Math.round((step.completedFields || 0) / step.totalFields * 100) : 0;

            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className="w-full text-left flex items-start gap-3 p-2 rounded-2xl hover:bg-white/50 transition-colors relative"
              >
                {/* Connector line for all but last step */}
                {index !== steps.length - 1 && (
                  <div className="absolute top-[22px] left-[18px] w-px h-[calc(100%+4px)] bg-[#E9E4DC] z-0" />
                )}

                {/* Step number / check */}
                <div
                  className={`relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 transition-all ${
                    isActive
                      ? 'bg-[#064e3b] text-white shadow-md shadow-[#064e3b]/20'
                      : isComplete
                      ? 'bg-[#E5EFE9] text-[#064e3b]'
                      : 'bg-[#FBF9F5] border border-[#E9E4DC] text-[#888174]'
                  }`}
                >
                  {isComplete && !isActive ? <Check size={11} strokeWidth={3} /> : step.id}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-[12px] font-semibold leading-tight flex items-center gap-1.5 ${
                        isActive ? 'text-[#002b17]' : 'text-[#4E473D]'
                      }`}
                    >
                      <span>{step.name}</span>
                      {step.totalFields !== undefined && step.id !== 9 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          percent === 100 
                            ? 'bg-[#E5EFE9] text-[#064e3b]' 
                            : percent > 0 
                            ? 'bg-[#FEF3C7] text-[#9A6014]' 
                            : 'text-[#A8A296]'
                        }`}>
                          {percent}%
                        </span>
                      )}
                    </p>
                    {isComplete && !isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#064e3b]/10 text-[#064e3b] font-medium flex-shrink-0">
                        Done
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#9A6014] font-medium flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-[#888174] leading-snug mt-0.5 line-clamp-1">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress summary */}
      <div className="mt-5 pt-4 border-t border-[#EFE9DF]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888174]">
            Progress
          </span>
          <span className="text-[11px] font-bold text-[#064e3b]">
            {steps.filter(s => s.mandatoryComplete).length}/{steps.length}
          </span>
        </div>
        <div className="h-1.5 bg-[#EFE9DF] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#064e3b] rounded-full transition-all duration-500"
            style={{ width: `${(steps.filter(s => s.mandatoryComplete).length / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
