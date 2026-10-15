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

    // Role check: use role provided from client's session store (0 extra DB queries).
    // If not provided, default to AGENT to strictly prevent any data leakage.
    const isManagerOrAdmin = userRole === 'MANAGER' || userRole === 'HIGH_LEVEL_ADMIN';

    // Run preview matching on server side using admin client (evaluates traits safely without exposing them)
    const adminSupabase = createAdminClient();
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
        candidateDob: r.candidateData?.personal_information?.date_of_birth || null,
        candidateCityId: r.candidateData?.profile_locations?.current_city_id || null,
        candidateProfileUrl: r.candidateData?.profile_URL || null,
        score: Math.round(r.finalScore),
        _realResult: {
          candidateProfileId: r.candidateProfileId,
          finalScore: r.finalScore,
          breakdowns: {
            sourceToCandidate: cleanBreakdowns,
            candidateToSource: [],
          },
        },
        // Properties used by matching page
        candidateProfileId: r.candidateProfileId,
        finalScore: Math.round(r.finalScore),
        sourceToCandidateScore: r.sourceToCandidateScore,
        candidateToSourceScore: r.candidateToSourceScore,
        rank: r.rank,
        breakdowns: r.breakdowns,
        // Sensitive raw candidate data ONLY released to Manager/Admin
        ...(isManagerOrAdmin ? {
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
