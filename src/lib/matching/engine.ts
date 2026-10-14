import { calculateTwoWayCompatibility } from './twoWayScoring';
import type { MatchResult, MatchingOptions } from './types';
import type { ProfileGender, AllPreferences } from '../types/database.types';
import { transformFlatProfileToNested, transformFlatPrefsToAllPreferences } from './transforms';

// Note: fetchPreferences is exported for backwards compatibility in preview/route.ts
// but it is now optimized to use the new view.
export async function fetchPreferences(supabase: any, profileId: string): Promise<AllPreferences | null> {
  const { data, error } = await supabase
    .from('v_current_matching_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error || !data) return null;
  return transformFlatPrefsToAllPreferences(data);
}

export async function runMatching(
  supabase: any,
  sourceProfileId: string,
  options: MatchingOptions
): Promise<MatchResult[]> {
  // 1. Get eligible candidates using the optimized RPC
  const candidateLimit = options.limit || 500; // Reasonable default for bulk
  const { data: flatCandidates, error: candidatesError } = await supabase
    .rpc('get_matching_candidates', {
      p_source_profile_id: sourceProfileId,
      p_limit: candidateLimit
    });

  if (candidatesError) {
    throw new Error(`Failed to fetch candidates via RPC: ${candidatesError.message}`);
  }

  // 2. Load source profile data from the materialized view
  let flatSourceData: any;
  let sourceError: any;

  ({ data: flatSourceData, error: sourceError } = await supabase
    .from('mv_matching_profiles')
    .select('*')
    .eq('profile_id', sourceProfileId)
    .maybeSingle());

  // If not found, try refreshing the MV and retry once
  if (!flatSourceData && !sourceError) {
    console.log('Source profile not in MV — refreshing materialized view...');
    const { error: refreshErr } = await supabase.rpc('refresh_mv_matching_profiles');
    if (refreshErr) {
      console.error('MV refresh failed:', refreshErr.message);
    } else {
      ({ data: flatSourceData, error: sourceError } = await supabase
        .from('mv_matching_profiles')
        .select('*')
        .eq('profile_id', sourceProfileId)
        .maybeSingle());
    }
  }

  if (sourceError || !flatSourceData) {
    throw new Error(`Profile data is not available for matching yet. Please ensure the profile is fully saved and has ACTIVE status.`);
  }

  // 3. Bulk fetch preferences for source AND all candidates
  const allProfileIds = [sourceProfileId, ...(flatCandidates || []).map((c: any) => c.profile_id)];

  const { data: flatPrefsList, error: prefsError } = await supabase
    .from('v_current_matching_preferences')
    .select('*')
    .in('profile_id', allProfileIds);

  if (prefsError) {
    throw new Error(`Failed to bulk load preferences: ${prefsError.message}`);
  }

  // Map preferences by profile_id
  const prefsMap = new Map<string, AllPreferences>();
  flatPrefsList?.forEach((row: any) => {
    prefsMap.set(row.profile_id, transformFlatPrefsToAllPreferences(row));
  });

  const sourcePrefs = prefsMap.get(sourceProfileId);
  if (!sourcePrefs) {
    throw new Error('Source profile has no active preferences setup.');
  }

  const oppositeGender: ProfileGender = flatSourceData.gender === 'MALE' ? 'FEMALE' : 'MALE';

  // 4. Transform source data to nested shape for existing scoring logic
  const sourceData = transformFlatProfileToNested(flatSourceData);

  const results: MatchResult[] = [];

  // 5. Iterate over candidates
  for (const flatCandidate of (flatCandidates || [])) {
    const candidatePrefs = prefsMap.get(flatCandidate.profile_id);
    if (!candidatePrefs) continue; // If they have no preferences, they can't be matched two-way properly.

    const candidateData = transformFlatProfileToNested(flatCandidate);

    // 6. Calculate Two-Way Compatibility (Includes Hard Filters & Soft Scoring)
    // Existing scoring logic handles the transformed nested data perfectly
    const match = calculateTwoWayCompatibility(sourceData, sourcePrefs, candidateData, candidatePrefs);

    if (match.passed) {
      results.push({
        candidateProfileId: candidateData.id,
        sourceToCandidateScore: match.sourceToCandidateScore,
        candidateToSourceScore: match.candidateToSourceScore,
        finalScore: match.finalScore,
        breakdowns: match.breakdowns,
        candidateData: candidateData,
        candidatePrefs: candidatePrefs,
      });
    }
  }

  // 7. Rank candidates by final score descending
  results.sort((a, b) => b.finalScore - a.finalScore);

  // Assign ranks
  results.forEach((r, idx) => { r.rank = idx + 1; });

  // 8. Apply limit if provided (e.g. for Manager official run) 
  const finalResults = options.limit ? results.slice(0, options.limit) : results;

  // 9. Persist if required (Manager Official Run)
  if (options.persist) {
    // Create match_runs
    const { data: runData, error: runError } = await supabase
      .from('match_runs')
      .insert({
        source_profile_id: sourceProfileId,
        preference_set_id: sourcePrefs.basic?.preference_set_id, // Reference to current set
        executed_by: options.executedBy,
        algorithm_version: '1.1.0', // Bumped version for refactor
        candidate_limit: options.limit || results.length,
        candidates_considered: (flatCandidates || []).length,
        candidates_matched: results.length,
      })
      .select('id')
      .single();

    if (runError) throw new Error(`Failed to save match run: ${runError.message}`);
    const runId = runData.id;

    const resultInserts = finalResults.map(r => ({
      match_run_id: runId,
      candidate_profile_id: r.candidateProfileId,
      source_to_candidate_score: r.sourceToCandidateScore,
      candidate_to_source_score: r.candidateToSourceScore,
      final_score: r.finalScore,
      rank: r.rank,
    }));

    if (resultInserts.length > 0) {
      const { data: insertedResults, error: resultsError } = await supabase
        .from('match_run_results')
        .insert(resultInserts)
        .select('id, candidate_profile_id');

      if (resultsError) throw new Error(`Failed to save results: ${resultsError.message}`);

      // Insert breakdowns for each inserted result
      const breakdownInserts: any[] = [];
      for (const ir of insertedResults) {
        const originalResult = finalResults.find(fr => fr.candidateProfileId === ir.candidate_profile_id);
        if (originalResult) {
          // Source -> Candidate
          originalResult.breakdowns.sourceToCandidate.forEach(b => {
            breakdownInserts.push({
              match_result_id: ir.id,
              direction: sourceData.gender,
              criterion_code: b.criterion_code,
              candidate_value: b.candidate_value,
              preferred_value: b.preferred_value,
              importance: b.importance,
              match_mode: b.match_mode,
              raw_score: b.raw_score,
              weight: b.weight,
              weighted_score: b.weighted_score,
              passed_hard_filter: b.passed_hard_filter,
              explanation: b.explanation,
            });
          });

          // Candidate -> Source
          originalResult.breakdowns.candidateToSource.forEach(b => {
            breakdownInserts.push({
              match_result_id: ir.id,
              direction: oppositeGender,
              criterion_code: b.criterion_code,
              candidate_value: b.candidate_value,
              preferred_value: b.preferred_value,
              importance: b.importance,
              match_mode: b.match_mode,
              raw_score: b.raw_score,
              weight: b.weight,
              weighted_score: b.weighted_score,
              passed_hard_filter: b.passed_hard_filter,
              explanation: b.explanation,
            });
          });
        }
      }

      if (breakdownInserts.length > 0) {
        // Break into smaller chunks if there are thousands of rows (usually ~20-30 rows per result, so ~150 rows for top 5)
        await supabase.from('match_score_breakdowns').insert(breakdownInserts);
      }
    }
  }

  return finalResults;
}
