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
    <div className="bg-transparent h-full flex flex-col">
      {/* Profile avatar */}
      <div className="flex items-center gap-3 mb-4 pb-6 border-b border-[#F2EDE1]/10 shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#F2EDE1] border-2 border-white/20 flex items-center justify-center text-[#2F3E51] flex-shrink-0 overflow-hidden shadow-sm">
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 opacity-70" />
          )}
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">
            {profileName || 'New Profile'}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-white/60 mt-0.5">
            {gender ? (
              gender === 'MALE' ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="14" r="7" />
                    <line x1="15" y1="9" x2="21" y2="3" />
                    <line x1="16" y1="3" x2="21" y2="3" />
                    <line x1="21" y1="3" x2="21" y2="8" />
                  </svg>
                  Male
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="7" />
                    <line x1="12" y1="17" x2="12" y2="23" />
                    <line x1="9" y1="20" x2="15" y2="20" />
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
      <div className="relative flex-1 overflow-y-auto min-h-0 hide-scrollbar pb-2">
        <div className="flex flex-col">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isComplete = step.mandatoryComplete ?? completedSteps.has(step.id);
            const percent = step.totalFields ? Math.round((step.completedFields || 0) / step.totalFields * 100) : 0;

            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className={`w-full text-left flex items-start gap-4 p-2 rounded-2xl transition-colors relative ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                {/* Connector line for all but last step */}
                {index !== steps.length - 1 && (
                  <div className="absolute top-[32px] left-[20px] w-px h-[calc(100%-8px)] border-l border-dashed border-white/20 z-0" />
                )}

                {/* Step number / check */}
                <div
                  className={`relative z-10 w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${isActive
                    ? 'bg-[#F2EDE1] text-[#2F3E51] shadow-md ring-2 ring-[#F2EDE1]'
                    : isComplete
                      ? 'bg-white/20 text-white'
                      : 'bg-transparent border border-white/30 text-white/50'
                    }`}
                >
                  {isComplete ? <Check size={11} strokeWidth={3} /> : step.id}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0 mt-0.5">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-[13px] font-semibold leading-tight flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-white/70'
                        }`}
                    >
                      <span>{step.name}</span>
                      {step.totalFields !== undefined && step.id !== 9 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${percent === 100
                          ? 'bg-white/20 text-white'
                          : percent > 0
                            ? 'bg-[#C86A4A]/20 text-[#C86A4A]'
                            : 'text-white/40'
                          }`}>
                          {percent}%
                        </span>
                      )}
                    </p>
                    {isComplete && !isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 font-medium flex-shrink-0">
                        Done
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F2EDE1] text-[#2F3E51] font-medium flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-snug mt-1 line-clamp-1 ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress summary */}
      <div className="mt-4 pt-4 border-t border-[#F2EDE1]/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
            Progress
          </span>
          <span className="text-[11px] font-bold text-white">
            {steps.filter(s => s.mandatoryComplete).length}/{steps.length}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full transition-all duration-500"
            style={{ width: `${(steps.filter(s => s.mandatoryComplete).length / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
