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

// Weights map
export const IMPORTANCE_WEIGHTS: Record<PreferenceImportance, number> = {
  MANDATORY: 0, // Handled by hard filters, not scored
  HIGH: 3.0,
  MEDIUM: 2.0,
  LOW: 1.0,
};
