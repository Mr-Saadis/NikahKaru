import { AllPreferences } from '../types/database.types';
import { passesHardFilters } from './hardFilters';
import { evaluateSoftScoring, calculateTotalScore } from './scoring';
import { ScoreBreakdownDetail } from './types';

export function calculateTwoWayCompatibility(
  sourceData: any,
  sourcePrefs: AllPreferences,
  candidateData: any,
  candidatePrefs: AllPreferences
): {
  sourceToCandidateScore: number;
  candidateToSourceScore: number;
  finalScore: number;
  breakdowns: {
    sourceToCandidate: ScoreBreakdownDetail[];
    candidateToSource: ScoreBreakdownDetail[];
  };
  passed: boolean;
  reason?: string;
} {
  // 1. Source -> Candidate (Does candidate pass source's requirements?)
  const s2cHard = passesHardFilters(candidateData, sourcePrefs);
  if (!s2cHard.passed) {
    return {
      passed: false,
      reason: `Candidate failed source mandatory requirement: ${s2cHard.reason}`,
      sourceToCandidateScore: 0,
      candidateToSourceScore: 0,
      finalScore: 0,
      breakdowns: { sourceToCandidate: [], candidateToSource: [] },
    };
  }

  // 2. Candidate -> Source (Does source pass candidate's requirements?)
  const c2sHard = passesHardFilters(sourceData, candidatePrefs);
  if (!c2sHard.passed) {
    return {
      passed: false,
      reason: `Source failed candidate mandatory requirement: ${c2sHard.reason}`,
      sourceToCandidateScore: 0,
      candidateToSourceScore: 0,
      finalScore: 0,
      breakdowns: { sourceToCandidate: [], candidateToSource: [] },
    };
  }

  // Both passed hard filters. Now soft scoring.
  // We need to know directions, but we pass gender info or just evaluate
  // evaluateSoftScoring doesn't strictly need gender for Phase 1 basic traits.
  
  const s2cBreakdowns = evaluateSoftScoring(candidateData, sourcePrefs, sourceData.gender);
  const s2cScore = calculateTotalScore(s2cBreakdowns);

  const c2sBreakdowns = evaluateSoftScoring(sourceData, candidatePrefs, candidateData.gender);
  const c2sScore = calculateTotalScore(c2sBreakdowns);

  // Final Compatibility Score (Average)
  const finalScore = Math.round((s2cScore + c2sScore) / 2);

  return {
    passed: true,
    sourceToCandidateScore: s2cScore,
    candidateToSourceScore: c2sScore,
    finalScore,
    breakdowns: {
      sourceToCandidate: s2cBreakdowns,
      candidateToSource: c2sBreakdowns,
    }
  };
}
