import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Agents must never receive candidate profile pictures
    const adminSupabase = createAdminClient();
    const { data: userRoleData } = await adminSupabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    let roleName = '';
    if (userRoleData?.roles) {
      const r: any = userRoleData.roles;
      roleName = (Array.isArray(r) ? r[0]?.name : r?.name)?.toUpperCase() || '';
    }
    const isAgent = roleName === 'AGENT' || (!roleName && roleName !== 'MANAGER' && roleName !== 'HIGH_LEVEL_ADMIN');

    // Query matches ledger and matched candidates
    let resultsData: any[] = [];
    let ledgerData: any[] = [];

    const includeLedger = request.nextUrl.searchParams.get('include_ledger') === 'true';

    if (isAgent) {
      // FOR AGENT: DO NOT fetch profile pictures from backend database/views
      const ledgerPromise = includeLedger
        ? supabase
            .from('vw_profile_matches_ledger')
            .select('match_id, male_profile_id, male_profile_name, male_profile_status, female_profile_id, female_profile_name, female_profile_status, source_match_run_result_id, current_status, final_score, created_by, created_by_name, first_contacted_at, in_progress_at, closed_at, created_at, updated_at')
            .or(`male_profile_id.eq.${id},female_profile_id.eq.${id}`)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const [
        ledgerRes,
        viewRes
      ] = await Promise.all([
        ledgerPromise,
        supabase
          .from('vw_profile_match_results')
          .select('candidate_profile_id, candidate_profile_name, source_gender, rank, final_score, score_breakdowns, executed_at')
          .eq('source_profile_id', id)
          .order('executed_at', { ascending: false })
          .order('rank', { ascending: true })
      ]);

      if (ledgerRes.error) {
        console.warn('Error fetching matches ledger:', ledgerRes.error);
        ledgerData = [];
      } else {
        ledgerData = ledgerRes.data || [];
      }

      if (viewRes.error) {
        console.warn('Error fetching match results:', viewRes.error);
      }

      const candidateIds = Array.from(
        new Set((viewRes.data || []).map((r: any) => r.candidate_profile_id).filter(Boolean))
      );

      if (candidateIds.length > 0) {
        // Query candidate dob and city id ONLY — strictly NO profile_url fetched
        const { data: candCore } = await supabase
          .from('vw_profile_core')
          .select('profile_id, date_of_birth, current_city_id')
          .in('profile_id', candidateIds);

        const candMap = new Map((candCore || []).map((c: any) => [c.profile_id, c]));

        const cityIds = Array.from(
          new Set((candCore || []).map((c: any) => c.current_city_id).filter(Boolean))
        );
        let cityMap = new Map<number, string>();
        if (cityIds.length > 0) {
          const { data: cities } = await supabase
            .from('cities')
            .select('id, name_en')
            .in('id', cityIds);
          cityMap = new Map((cities || []).map((ct: any) => [ct.id, ct.name_en]));
        }

        resultsData = (viewRes.data || []).map((r: any) => {
          const c = candMap.get(r.candidate_profile_id);
          return {
            ...r,
            candidate_dob: c?.date_of_birth || null,
            candidate_city_id: c?.current_city_id || null,
            candidate_city_name: c?.current_city_id ? cityMap.get(c.current_city_id) || null : null,
            candidate_profile_url: null, // Zero profile picture fetched or returned
          };
        });
      } else {
        resultsData = viewRes.data || [];
      }
    } else {
      // MANAGER / ADMIN: Standard flow
      const ledgerPromise = includeLedger
        ? supabase
            .from('vw_profile_matches_ledger')
            .select('*')
            .or(`male_profile_id.eq.${id},female_profile_id.eq.${id}`)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const [
        ledgerRes,
        rpcResult
      ] = await Promise.all([
        ledgerPromise,
        supabase.rpc('get_profile_matched_candidates', {
          p_source_profile_id: id,
        })
      ]);

      if (ledgerRes.error) {
        console.warn('Error fetching matches ledger:', ledgerRes.error);
        ledgerData = [];
      } else {
        ledgerData = ledgerRes.data || [];
      }

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
    }

    // =======================================================================
    // Check if this profile is COMPLETED (Marriage Finalized)
    // If completed, strictly return ONLY the single finalized partner!
    // =======================================================================
    let finalizedPartnerId: string | null = null;

    // A. Check if this profile was the source in a COMPLETED request
    const { data: completedReq } = await adminSupabase
      .from('information_requests')
      .select('id, status')
      .eq('source_profile_id', id)
      .eq('status', 'COMPLETED')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (completedReq) {
      const { data: rel } = await adminSupabase
        .from('information_releases')
        .select('candidate_profile_id')
        .eq('request_id', completedReq.id)
        .limit(1)
        .maybeSingle();
      if (rel?.candidate_profile_id) {
        finalizedPartnerId = rel.candidate_profile_id;
      }
    } else {
      // B. Check if this profile was the candidate in a COMPLETED request
      const { data: candRel } = await adminSupabase
        .from('information_releases')
        .select('id, request_id, information_requests!inner(id, status, source_profile_id)')
        .eq('candidate_profile_id', id)
        .eq('information_requests.status', 'COMPLETED')
        .limit(1)
        .maybeSingle();

      if (candRel?.information_requests) {
        const req: any = candRel.information_requests;
        finalizedPartnerId = req.source_profile_id;
      }
    }

    if (finalizedPartnerId) {
      resultsData = resultsData.filter((r: any) => r && r.candidate_profile_id === finalizedPartnerId);

      // If no match_run_result exists in reverse direction, construct a clean match entry for the partner
      if (resultsData.length === 0) {
        const { data: partnerCore } = await adminSupabase
          .from('vw_profile_core')
          .select('profile_id, full_name, date_of_birth, current_city_id')
          .eq('profile_id', finalizedPartnerId)
          .maybeSingle();

        if (partnerCore) {
          let cityName = null;
          if (partnerCore.current_city_id) {
            const { data: cityData } = await adminSupabase
              .from('cities')
              .select('name_en')
              .eq('id', partnerCore.current_city_id)
              .maybeSingle();
            cityName = cityData?.name_en || null;
          }

          resultsData = [{
            candidate_profile_id: partnerCore.profile_id,
            candidate_profile_name: partnerCore.full_name,
            candidate_dob: partnerCore.date_of_birth,
            candidate_city_id: partnerCore.current_city_id,
            candidate_city_name: cityName,
            final_score: 100,
            rank: 1,
            score_breakdowns: [],
          }];
        }
      }
    }

    // Sanitize results to ONLY display fields (zero privacy leaks or internal DB details)
    const sanitizedResults = (resultsData || [])
      .filter((r: any) => r && r.candidate_profile_id)
      .map((r: any) => {
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
        candidate_profile_url: isAgent ? null : (r.candidate_profile_url || null),
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
