import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { runMatching } from '@/lib/matching/engine';

export async function POST(req: NextRequest) {
  try {
    const { sourceProfileId, candidateLimit } = await req.json();

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

    // Role check to ensure only MANAGER can run official matching (or ADMIN)
    // Fetch user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    
    const roleName = ((roleData?.roles as any)?.name || '')?.toUpperCase();
    if (roleName !== 'MANAGER' && roleName !== 'HIGH_LEVEL_ADMIN' && roleName !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Forbidden: Only managers and administrators can run official matches' }, { status: 403 });
    }

    // Sanitize candidateLimit (min 1, max 50)
    const safeLimit = candidateLimit !== undefined && candidateLimit !== null
      ? Math.min(Math.max(Number(candidateLimit) || 10, 1), 50)
      : undefined;

    // Manager Official Run: Persist to DB, optionally limit
    const results = await runMatching(supabase, sourceProfileId, {
      persist: true,
      executedBy: userData.user.id,
      limit: safeLimit,
    });

    return NextResponse.json({
      success: true,
      totalMatched: results.length,
      candidates: results,
    });
  } catch (error: any) {
    console.error('Manager Official Run Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
