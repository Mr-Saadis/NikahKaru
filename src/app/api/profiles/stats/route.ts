import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // We can use the core view, but simple profile counts are faster
    const [total, active, draft, paused, archived] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'PAUSED'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ARCHIVED'),
    ]);
    
    return NextResponse.json({
      total: total.count || 0,
      active: active.count || 0,
      draft: draft.count || 0,
      paused: paused.count || 0,
      archived: archived.count || 0,
    });
  } catch (err: any) {
    console.error('API Error in GET profile stats:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
