import { getEligibleCandidates } from './exclusions';
import { calculateTwoWayCompatibility } from './twoWayScoring';
import type { MatchResult, MatchingOptions } from './types';
import type { ProfileGender, AllPreferences } from '../types/database.types';

// Helper to fetch preferences using an injected Supabase client
export async function fetchPreferences(supabase: any, profileId: string): Promise<AllPreferences | null> {
  const { data: prefSet, error } = await supabase
    .from('preference_sets')
    .select('id')
    .eq('profile_id', profileId)
    .eq('is_current', true)
    .maybeSingle();

  if (error || !prefSet) return null;
  const setId = prefSet.id;

  const [
    basicReq, physicalReq, eduReq, profReq, relReq, locReq, famReq, lifeReq, relocReq
  ] = await Promise.all([
    supabase.from('basic_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('physical_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('education_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('profession_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('religion_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('location_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('family_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('lifestyle_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
    supabase.from('relocation_preferences').select('*').eq('preference_set_id', setId).maybeSingle(),
  ]);

  return {
    basic: basicReq.data || null,
    physical: physicalReq.data || null,
    education: eduReq.data || null,
    profession: profReq.data || null,
    religion: relReq.data || null,
    location: locReq.data || null,
    family: famReq.data || null,
    lifestyle: lifeReq.data || null,
    relocation: relocReq.data || null,
  };
}

export async function runMatching(
  supabase: any,
  sourceProfileId: string,
  options: MatchingOptions
): Promise<MatchResult[]> {
  // 1. Load source profile data
  const { data: sourceData, error: sourceError } = await supabase
    .from('profiles')
    .select(`
      id, gender, status,
      personal_information (*),
      physical_information (*),
      education_records (*),
      employment_records (*),
      income_information (*),
      religion_information (*),
      profile_locations (*),
      residency_information (*),
      lifestyle_information (*),
      relocation_information (*)
    `)
    .eq('id', sourceProfileId)
    .single();

  if (sourceError || !sourceData) {
    throw new Error(`Failed to load source profile: ${sourceError?.message}`);
  }

  // 2. Load source preferences
  const sourcePrefs = await fetchPreferences(supabase, sourceProfileId);
  if (!sourcePrefs) {
    throw new Error('Source profile has no active preferences setup.');
  }

  const oppositeGender: ProfileGender = sourceData.gender === 'MALE' ? 'FEMALE' : 'MALE';

  // 3. Get all eligible candidates (Exclusions applied)
  const candidates = await getEligibleCandidates(supabase, sourceProfileId, oppositeGender);

  const results: MatchResult[] = [];

  // 4. Iterate over candidates
  for (const candidate of candidates) {
    // Load candidate preferences
    const candidatePrefs = await fetchPreferences(supabase, candidate.id);
    if (!candidatePrefs) continue; // If they have no preferences, they can't be matched two-way properly.

    // 5. Calculate Two-Way Compatibility (Includes Hard Filters & Soft Scoring)
    const match = calculateTwoWayCompatibility(sourceData, sourcePrefs, candidate, candidatePrefs);

    if (match.passed) {
      results.push({
        candidateProfileId: candidate.id,
        sourceToCandidateScore: match.sourceToCandidateScore,
        candidateToSourceScore: match.candidateToSourceScore,
        finalScore: match.finalScore,
        breakdowns: match.breakdowns,
        candidateData: candidate,
        candidatePrefs: candidatePrefs,
      });
    }
  }

  // 6. Rank candidates by final score descending
  results.sort((a, b) => b.finalScore - a.finalScore);

  // Assign ranks
  results.forEach((r, idx) => { r.rank = idx + 1; });

  // 7. Apply limit if provided (e.g. for Manager official run) 
  // If Agent preview, limit might be undefined meaning "return all"
  const finalResults = options.limit ? results.slice(0, options.limit) : results;

  // 8. Persist if required (Manager Official Run)
  if (options.persist) {
    // Create match_runs
    const { data: runData, error: runError } = await supabase
      .from('match_runs')
      .insert({
        source_profile_id: sourceProfileId,
        preference_set_id: sourcePrefs.basic?.preference_set_id, // Reference to current set
        executed_by: options.executedBy,
        algorithm_version: '1.0.0',
        candidate_limit: options.limit || results.length,
        candidates_considered: candidates.length,
        candidates_matched: results.length,
      })
      .select('id')
      .single();

    if (runError) throw new Error(`Failed to save match run: ${runError.message}`);
    const runId = runData.id;

    // We'd ideally do this in a single transaction/RPC. For Next.js, parallel inserts are okay for now.
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
          // Source -> Candidate (MALE or FEMALE depending on source)
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

          // Candidate -> Source (opposite gender)
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
        await supabase.from('match_score_breakdowns').insert(breakdownInserts);
      }
    }
  }

  return finalResults;
}
