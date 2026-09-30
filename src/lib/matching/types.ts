import { PreferenceImportance } from '../types/database.types';

export interface CriterionScore {
  raw_score: number;       // 0 to 100
  weight: number;          // 1, 2, or 3
  weighted_score: number;  // raw_score * weight
  explanation: string;
}

export interface ScoreBreakdownDetail {
  criterion_code: string;
  candidate_value: any;
  preferred_value: any;
  importance: PreferenceImportance;
  match_mode: string;
  raw_score: number;
  weight: number;
  weighted_score: number;
  passed_hard_filter: boolean;
  explanation: string;
}

export interface MatchResult {
  candidateProfileId: string;
  sourceToCandidateScore: number;
  candidateToSourceScore: number;
  finalScore: number;
  rank?: number;
  breakdowns: {
    sourceToCandidate: ScoreBreakdownDetail[];
    candidateToSource: ScoreBreakdownDetail[];
  };
  candidateData?: any; // Added for UI display
  candidatePrefs?: any; // Added for UI display
}

export interface MatchingOptions {
  limit?: number;
  persist: boolean;
  executedBy: string;
  requestId?: string;
}

// Re-export IMPORTANCE_WEIGHTS from the central config (single source of truth)
export { IMPORTANCE_WEIGHTS } from './scoring-config';
