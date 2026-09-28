/**
 * TEMPORARY MOCK SCORING PROVIDER
 * ─────────────────────────────────
 * Generates deterministic demo compatibility scores for UI demonstration.
 * Will be replaced by the actual matching engine (see skills/06-matching-engine).
 *
 * ⚠️  These scores are NOT real algorithmic results.
 *     They exist solely to demonstrate the matching analytics dashboard.
 *     No mock data is written to the database.
 */

// ── Deterministic pair hash ─────────────────────────────────────
// Sorting ensures (A,B) and (B,A) always yield the same value.
function hashPair(id1: string, id2: string): number {
  const [a, b] = [id1, id2].sort();
  const combined = `${a}::${b}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32-bit integer
  }
  // Map to 55–98 range (realistic compatibility spread)
  return Math.abs(hash % 44) + 55;
}

// ── Types ───────────────────────────────────────────────────────

export interface MockMatchResult {
  candidateId: string;
  score: number;
}

export interface MatchDistribution {
  excellent: number; // 90-100
  high: number;      // 80-89
  good: number;      // 70-79
  moderate: number;  // 60-69
  lower: number;     // <60
}

// ── Core scoring ────────────────────────────────────────────────

/** Single deterministic pair score */
export function getMockScore(sourceId: string, candidateId: string): number {
  return hashPair(sourceId, candidateId);
}

/** Score every candidate, return sorted descending by score */
export function getMockMatchResults(
  sourceId: string,
  candidateIds: string[],
): MockMatchResult[] {
  return candidateIds
    .filter((id) => id !== sourceId)
    .map((id) => ({ candidateId: id, score: getMockScore(sourceId, id) }))
    .sort((a, b) => b.score - a.score);
}

// ── Aggregate helpers ───────────────────────────────────────────

export function getMatchDistribution(results: MockMatchResult[]): MatchDistribution {
  return {
    excellent: results.filter((r) => r.score >= 90).length,
    high: results.filter((r) => r.score >= 80 && r.score < 90).length,
    good: results.filter((r) => r.score >= 70 && r.score < 80).length,
    moderate: results.filter((r) => r.score >= 60 && r.score < 70).length,
    lower: results.filter((r) => r.score < 60).length,
  };
}

export function getAverageScore(results: MockMatchResult[]): number {
  if (!results.length) return 0;
  return Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
}

export function getHighestScore(results: MockMatchResult[]): number {
  if (!results.length) return 0;
  return Math.max(...results.map((r) => r.score));
}

export function getHighMatchCount(results: MockMatchResult[]): number {
  return results.filter((r) => r.score >= 80).length;
}

// ── Display helpers ─────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 90) return '#16a34a';
  if (score >= 80) return '#064e3b';
  if (score >= 70) return '#d97706';
  if (score >= 60) return '#ea580c';
  return '#dc2626';
}

export function getScoreBg(score: number): string {
  if (score >= 90) return '#DCFCE7';
  if (score >= 80) return '#E5EFE9';
  if (score >= 70) return '#FEF3C7';
  if (score >= 60) return '#FFEDD5';
  return '#FEE2E2';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'High';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Moderate';
  return 'Lower';
}
