import { createClient } from '@supabase/supabase-js'; // We will pass supabase instance
import type { ProfileGender } from '../types/database.types';

/**
 * Fetches all potential candidates from the database, excluding:
 * 1. Self
 * 2. Inactive profiles
 * 3. Same gender
 * 4. Profiles with a rejected or in-progress match with the source profile
 */
export async function getEligibleCandidates(
  supabase: any,
  sourceProfileId: string,
  oppositeGender: ProfileGender
) {
  // Step 1: Get all matches involving the source profile to exclude them
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('male_profile_id, female_profile_id, status')
    .or(`male_profile_id.eq.${sourceProfileId},female_profile_id.eq.${sourceProfileId}`)
    .in('status', ['REJECTED', 'IN_PROGRESS']);

  if (matchesError) {
    throw new Error(`Failed to fetch exclusions: ${matchesError.message}`);
  }

  // Create a set of profile IDs to exclude
  const excludedProfileIds = new Set<string>();
  excludedProfileIds.add(sourceProfileId); // Always exclude self

  if (matches) {
    matches.forEach((m: any) => {
      const otherId = m.male_profile_id === sourceProfileId ? m.female_profile_id : m.male_profile_id;
      excludedProfileIds.add(otherId);
    });
  }

  // Step 2: Fetch all ACTIVE profiles of the opposite gender
  // We need to join relevant tables to have data for scoring
  const { data: candidates, error: candidatesError } = await supabase
    .from('profiles')
    .select(`
      id,
      gender,
      status,
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
    .eq('gender', oppositeGender)
    .eq('status', 'ACTIVE');

  if (candidatesError) {
    throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
  }

  // Step 3: Filter out excluded profiles manually
  // (Doing it in memory is fine for ~115 users. If large scale, we'd use a NOT IN or RPC)
  const eligibleCandidates = (candidates || []).filter(
    (c: any) => !excludedProfileIds.has(c.id)
  );

  return eligibleCandidates;
}
