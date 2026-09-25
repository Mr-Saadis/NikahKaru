'use client';

import { Check } from 'lucide-react';

export interface StepConfig {
  id: number;
  name: string;
  shortName: string;
}

interface HorizontalStepperProps {
  steps: StepConfig[];
  currentStep: number;
}

export default function HorizontalStepper({ steps, currentStep }: HorizontalStepperProps) {
  const progressWidth = steps.length > 1
    ? `${((currentStep - 1) / (steps.length - 1)) * 100}%`
    : '0%';

  return (
    <div className="relative px-4 py-5">
      {/* Background track */}
      <div className="absolute top-[2.35rem] left-8 right-8 h-[2px] bg-[#EFE9DF]" />

      {/* Progress track */}
      <div
        className="absolute top-[2.35rem] left-8 h-[2px] bg-[#064e3b] transition-all duration-500 ease-in-out"
        style={{ width: `calc(${progressWidth} - 2rem)` }}
      />

      {/* Step circles */}
      <div className="relative flex justify-between">
        {steps.map((step) => {
          const isComplete = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              {/* Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold z-10 transition-all duration-300 ${
                  isComplete
                    ? 'bg-[#064e3b] text-white shadow-sm'
                    : isActive
                    ? 'bg-[#064e3b] text-white shadow-sm ring-4 ring-[#064e3b]/10'
                    : 'bg-white border border-[#E9E4DC] text-[#888174]'
                }`}
              >
                {isComplete ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  step.id
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${
                  isActive || isComplete ? 'text-[#064e3b]' : 'text-[#888174]'
                }`}
              >
                {step.shortName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
