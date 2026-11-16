import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { runMatching, fetchPreferences } from '@/lib/matching/engine';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { sourceProfileId, userRole } = await req.json();

    if (!sourceProfileId) {
      return NextResponse.json({ error: 'sourceProfileId is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server-side verified role check to strictly prevent candidate data leakage
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    // @ts-expect-error - nested role typing
    const verifiedRole = userRoleData?.role?.name?.toUpperCase();
    const isManagerOrAdmin = verifiedRole === 'MANAGER' || verifiedRole === 'HIGH_LEVEL_ADMIN';

    const adminSupabase = createAdminClient();

    // Ownership check: Agents may only preview matches for profiles assigned to them
    if (!isManagerOrAdmin) {
      const { data: sourceProf } = await adminSupabase
        .from('profiles')
        .select('id, current_agent_id, created_by')
        .eq('id', sourceProfileId)
        .maybeSingle();

      if (!sourceProf) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      if (sourceProf.current_agent_id !== userData.user.id && sourceProf.created_by !== userData.user.id) {
        return NextResponse.json({ error: 'Forbidden: Profile not assigned to you' }, { status: 403 });
      }
    }

    // Run preview matching on server side using admin client (evaluates traits safely without exposing them)
    const results = await runMatching(adminSupabase, sourceProfileId, {
      persist: false,
      executedBy: userData.user.id,
    });

    const sourcePrefs = await fetchPreferences(adminSupabase, sourceProfileId);

    // For Agent Preview: slice ONLY the top 5 candidates
    const top5 = results.slice(0, 5);

    // Fetch the real display names for ONLY these top 5 candidates
    const top5Ids = top5.map(r => r.candidateProfileId);
    let namesMap = new Map<string, string>();
    if (top5Ids.length > 0) {
      const { data: namesData } = await adminSupabase
        .from('personal_information')
        .select('profile_id, full_name')
        .in('profile_id', top5Ids);

      namesMap = new Map((namesData || []).map((n: any) => [n.profile_id, n.full_name]));
    }

    // Sanitize results: return fields for both matching page and profile preview
    const sanitizedCandidates = top5.map(r => {
      const cleanBreakdowns = (r.breakdowns?.sourceToCandidate || []).map((b: any) => ({
        criterion_code: b.criterion_code,
        raw_score: typeof b.raw_score === 'number' ? b.raw_score : Number(b.raw_score ?? 1),
      }));

      const displayName = namesMap.get(r.candidateProfileId) || r.candidateData?.personal_information?.full_name || 'Candidate';

      return {
        // Properties used by profile page
        candidateId: r.candidateProfileId,
        candidateName: displayName,
        candidateDob: isManagerOrAdmin ? (r.candidateData?.personal_information?.date_of_birth || null) : null,
        candidateCityId: isManagerOrAdmin ? (r.candidateData?.profile_locations?.current_city_id || null) : null,
        candidateProfileUrl: isManagerOrAdmin ? (r.candidateData?.profile_URL || null) : null,
        score: Math.round(r.finalScore),
        _realResult: {
          candidateProfileId: r.candidateProfileId,
          finalScore: r.finalScore,
          breakdowns: {
            sourceToCandidate: cleanBreakdowns,
            candidateToSource: [],
          },
        },
        // Properties used by matching page (full breakdowns & raw candidate data ONLY for Manager/Admin)
        candidateProfileId: r.candidateProfileId,
        finalScore: Math.round(r.finalScore),
        rank: r.rank,
        ...(isManagerOrAdmin ? {
          sourceToCandidateScore: r.sourceToCandidateScore,
          candidateToSourceScore: r.candidateToSourceScore,
          breakdowns: r.breakdowns,
          candidateData: r.candidateData,
          candidatePrefs: r.candidatePrefs,
        } : {}),
      };
    });

    return NextResponse.json({
      success: true,
      totalConsidered: results.length,
      candidates: sanitizedCandidates,
      sourcePrefs,
    });
  } catch (error: any) {
    console.error('Agent Preview Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
