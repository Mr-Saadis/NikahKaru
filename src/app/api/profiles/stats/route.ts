import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: userRoleData } = await adminClient
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
    const isAgent = roleName === 'AGENT';

    let totalQ = supabase.from('profiles').select('id', { count: 'exact', head: true });
    let activeQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE');
    let draftQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT');
    let pausedQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'PAUSED');
    let archivedQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ARCHIVED');

    if (isAgent) {
      totalQ = totalQ.eq('current_agent_id', user.id);
      activeQ = activeQ.eq('current_agent_id', user.id);
      draftQ = draftQ.eq('current_agent_id', user.id);
      pausedQ = pausedQ.eq('current_agent_id', user.id);
      archivedQ = archivedQ.eq('current_agent_id', user.id);
    }

    // We can use the core view, but simple profile counts are faster
    const [total, active, draft, paused, archived] = await Promise.all([
      totalQ,
      activeQ,
      draftQ,
      pausedQ,
      archivedQ,
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
