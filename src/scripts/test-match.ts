import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { runMatching } from '../lib/matching/engine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMatch() {
  // Find Hassan
  const { data: profiles, error } = await supabase
    .from('personal_information')
    .select('profile_id, full_name')
    .ilike('full_name', '%Hassan%');

  if (error || !profiles || profiles.length === 0) {
    console.error('Could not find Hassan:', error);
    return;
  }

  const sourceProfileId = profiles[0].profile_id;
  console.log('Found Hassan with ID:', sourceProfileId);

  try {
    const results = await runMatching(supabase, sourceProfileId, {
      persist: false,
      executedBy: 'test-script'
    });

    console.log(`\nFound ${results.length} valid matches for Hassan.`);
    
    // Print the top result detailed breakdown
    if (results.length > 0) {
      const topMatch = results[0];
      const candNameData = await supabase.from('personal_information').select('full_name').eq('profile_id', topMatch.candidateProfileId).single();
      const candName = candNameData.data?.full_name;

      console.log(`\n=== TOP MATCH: ${candName} ===`);
      console.log(`Final Score: ${topMatch.finalScore}%`);
      console.log(`Source to Candidate Score: ${topMatch.sourceToCandidateScore}%`);
      console.log(`Candidate to Source Score: ${topMatch.candidateToSourceScore}%`);
      
      console.log('\n--- HOW HASSAN SCORED CANDIDATE ---');
      topMatch.breakdowns.sourceToCandidate.forEach((b: any) => {
        console.log(`[${b.criterion_code}] ${b.raw_score * 100}% (Weight: ${b.weight}) -> ${b.explanation}`);
      });

      console.log('\n--- HOW CANDIDATE SCORED AYESHA ---');
      topMatch.breakdowns.candidateToSource.forEach((b: any) => {
        console.log(`[${b.criterion_code}] ${b.raw_score * 100}% (Weight: ${b.weight}) -> ${b.explanation}`);
      });
    }
  } catch (err) {
    console.error('Match failed:', err);
  }
}

testMatch();
