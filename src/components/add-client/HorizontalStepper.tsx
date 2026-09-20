import { Check } from "lucide-react";

export function HorizontalStepper({ 
  steps, 
  currentStep,
  stepProgress = []
}: { 
  steps: string[], 
  currentStep: number,
  stepProgress?: number[] 
}) {
  return (
    <div className="w-full pt-8 pb-4">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-3.5 w-full h-[2px] bg-gray-100 -z-10" />
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-3.5 h-[2px] bg-brand-green -z-10 transition-all duration-500 ease-in-out" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const isFullyCompleted = stepProgress[index] === 100;

          return (
            <div key={step} className="flex flex-col items-center relative bg-brand-bg px-2">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-300 ${
                  isActive || isFullyCompleted 
                    ? "bg-brand-green text-white" 
                    : "bg-white border border-gray-300 text-gray-400"
                }`}
              >
                {isFullyCompleted ? <Check size={14} strokeWidth={3} /> : stepNum}
              </div>
              
              <span 
                className={`text-[10px] md:text-[11px] mt-2 font-medium absolute top-8 whitespace-nowrap transition-colors duration-300 ${
                  isActive ? "text-brand-green" : "text-gray-400"
                }`}
              >
                {step}
              </span>

              {/* Active Indicator Under Text */}
              {isActive && (
                <div className="absolute top-[4.5rem] w-full h-[2px] bg-brand-green" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
