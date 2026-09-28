import React from 'react';
import type { MatchResult } from '@/lib/matching/types';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface ScoreBreakdownProps {
  result: MatchResult;
}

export default function ScoreBreakdown({ result }: ScoreBreakdownProps) {
  const { sourceToCandidate, candidateToSource } = result.breakdowns;

  const renderDirection = (title: string, breakdowns: any[]) => (
    <div className="space-y-4">
      <h4 className="text-[13px] font-bold text-[#16382E] uppercase tracking-wider">{title}</h4>
      {breakdowns.length === 0 ? (
        <p className="text-sm text-[#7D766C]">No preferences to score.</p>
      ) : (
        <div className="space-y-3">
          {breakdowns.map((b, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-[#EFE9DF] p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#16382E]">{b.criterion_code.replace('_', ' ')}</span>
                <span className="text-xs font-bold px-2 py-1 bg-[#F5F2EC] rounded-md text-[#676156]">
                  Weight: {b.weight}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm mt-1">
                <div className="flex-1">
                  <p className="text-[#888174] text-xs">Expected</p>
                  <p className="font-medium text-[#16382E]">{b.preferred_value}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C4BCAB]" />
                <div className="flex-1">
                  <p className="text-[#888174] text-xs">Actual</p>
                  <p className="font-medium text-[#16382E]">{b.candidate_value || 'Not provided'}</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-[#676156]">
                  <span>Score: {b.raw_score * 100}%</span>
                  <span>Weighted: {b.weighted_score.toFixed(1)} / {b.weight.toFixed(1)}</span>
                </div>
                <div className="w-full bg-[#EFE9DF] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#115E49] rounded-full transition-all"
                    style={{ width: `${b.raw_score * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 mt-2 pt-2 border-t border-[#F5F2EC] text-[12px] text-[#7D766C]">
                {b.raw_score === 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                ) : b.raw_score === 0 ? (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <p>{b.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EFE9DF] mt-4">
      {renderDirection('How well candidate fits source', sourceToCandidate)}
      {renderDirection('How well source fits candidate', candidateToSource)}
    </div>
  );
}
