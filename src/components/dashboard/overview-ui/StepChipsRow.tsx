import React from 'react';
import { Check } from 'lucide-react';

export const FIXED_STEP_SECTIONS = [
  'Personal',
  'Physical',
  'Education & Profession',
  'Religion',
  'Location & Residency',
  'Family',
  'Lifestyle',
  'Preferences',
] as const;

interface StepChipsRowProps {
  stepsDone: number;
  stepsTotal?: number;
  nextStep?: string | null;
  missing?: string[] | null;
  className?: string;
}

function getNextStepNum(nextStepName?: string | null): number | null {
  if (!nextStepName) return null;
  const s = nextStepName.toLowerCase();
  if (s.includes('personal') || s.includes('basic')) return 1;
  if (s.includes('physical')) return 2;
  if (s.includes('education') || s.includes('profession')) return 3;
  if (s.includes('religion') || s.includes('culture')) return 4;
  if (s.includes('location') || s.includes('residency')) return 5;
  if (s.includes('family')) return 6;
  if (s.includes('lifestyle')) return 7;
  if (s.includes('preference')) return 8;
  return null;
}

export function StepChipsRow({
  stepsDone,
  stepsTotal = 8,
  nextStep,
  missing,
  className = '',
}: StepChipsRowProps) {
  const steps = Array.from({ length: stepsTotal }, (_, i) => i + 1);

  // If missing is provided from the DB patch:
  // Step N (1..8) is ticked if its section name is NOT in missing
  const hasMissingArray = missing !== undefined && missing !== null && Array.isArray(missing);
  const nextNum = getNextStepNum(nextStep);

  // Next step highlight: first missing section in fixed order
  const displayNextStep = hasMissingArray
    ? FIXED_STEP_SECTIONS.find((sec) => missing.includes(sec)) || null
    : nextStep;

  return (
    <div className={`flex items-center justify-between gap-2 flex-wrap ${className}`}>
      {/* 8 compact rounded chips with check icon or step number */}
      <div className="flex items-center gap-1 shrink-0">
        {steps.map((s) => {
          let isDone: boolean;
          if (hasMissingArray) {
            const sectionName = FIXED_STEP_SECTIONS[s - 1];
            isDone = !missing.includes(sectionName);
          } else {
            // Fallback for when missing is undefined
            isDone = nextNum != null ? s < nextNum : s <= stepsDone;
          }

          return (
            <div
              key={s}
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors duration-120 ${
                isDone
                  ? 'bg-[#1F3B34] text-white shadow-2xs'
                  : 'border border-[#E9E4DC] text-[#A49C8F] bg-white'
              }`}
              title={`Step ${s}: ${isDone ? 'Completed' : 'Pending'}`}
            >
              {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s}
            </div>
          );
        })}
      </div>

      {/* Next step highlight as an accent pill */}
      {displayNextStep && (
        <span className="rounded-full px-2 py-0.5 bg-[#FDF0D8] text-[#8B6122] border border-[#F5C770]/60 text-[10.5px] font-semibold truncate max-w-[140px]">
          Next: {displayNextStep}
        </span>
      )}
    </div>
  );
}
