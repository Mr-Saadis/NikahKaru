import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Query matches ledger and matched candidates
    let resultsData: any[] = [];

    const [
      { data: ledgerData, error: ledgerError },
      rpcResult
    ] = await Promise.all([
      supabase
        .from('vw_profile_matches_ledger')
        .select('*')
        .or(`male_profile_id.eq.${id},female_profile_id.eq.${id}`)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_profile_matched_candidates', {
        p_source_profile_id: id,
      })
    ]);

    if (ledgerError) throw ledgerError;

    if (!rpcResult.error && rpcResult.data && Array.isArray(rpcResult.data)) {
      resultsData = rpcResult.data;
    } else {
      // Fallback: Query view and join minimal dob + city_id on server side
      const { data: viewData, error: resultsError } = await supabase
        .from('vw_profile_match_results')
        .select('*')
        .eq('source_profile_id', id)
        .order('executed_at', { ascending: false })
        .order('rank', { ascending: true });

      if (resultsError) throw resultsError;

      const candidateIds = Array.from(
        new Set((viewData || []).map((r: any) => r.candidate_profile_id).filter(Boolean))
      );

      if (candidateIds.length > 0) {
        const { data: candCore } = await supabase
          .from('vw_profile_core')
          .select('profile_id, date_of_birth, current_city_id')
          .in('profile_id', candidateIds);

        const candMap = new Map((candCore || []).map((c: any) => [c.profile_id, c]));

        resultsData = (viewData || []).map((r: any) => {
          const c = candMap.get(r.candidate_profile_id);
          return {
            ...r,
            candidate_dob: c?.date_of_birth || null,
            candidate_city_id: c?.current_city_id || null,
          };
        });
      } else {
        resultsData = viewData || [];
      }
    }

    // Sanitize results to ONLY display fields (zero privacy leaks or internal DB details)
    const sanitizedResults = resultsData.map((r: any) => {
      const sourceGender = r.source_gender || 'MALE';
      const cleanBreakdowns = (r.score_breakdowns || [])
        .filter((b: any) => 
          !b.direction || b.direction === sourceGender || b.direction === 'SOURCE_TO_CANDIDATE'
        )
        .map((b: any) => ({
          criterion_code: b.criterion_code,
          raw_score: typeof b.raw_score === 'number' ? b.raw_score : Number(b.raw_score ?? 1),
        }));

      return {
        candidate_profile_id: r.candidate_profile_id,
        candidate_profile_name: r.candidate_profile_name,
        candidate_profile_url: r.candidate_profile_url,
        candidate_dob: r.candidate_dob || null,
        candidate_city_id: r.candidate_city_id || null,
        candidate_city_name: r.candidate_city_name || null,
        final_score: r.final_score,
        rank: r.rank,
        score_breakdowns: cleanBreakdowns,
      };
    });

    return NextResponse.json({
      ledger: ledgerData || [],
      results: sanitizedResults,
    });
  } catch (err: any) {
    console.error('API Error in GET profile matches:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
