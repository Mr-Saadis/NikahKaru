import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { runMatching, fetchPreferences } from '@/lib/matching/engine';

export async function POST(req: NextRequest) {
  try {
    const { sourceProfileId } = await req.json();

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

    // Agent preview: Do NOT persist, do NOT limit (return all)
    const results = await runMatching(supabase, sourceProfileId, {
      persist: false,
      executedBy: userData.user.id,
      // limit is omitted to return ALL candidates as requested
    });

    const sourcePrefs = await fetchPreferences(supabase, sourceProfileId);

    return NextResponse.json({
      success: true,
      totalConsidered: results.length,
      candidates: results,
      sourcePrefs,
    });
  } catch (error: any) {
    console.error('Agent Preview Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
