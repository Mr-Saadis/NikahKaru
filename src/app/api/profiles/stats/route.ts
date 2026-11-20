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
    const isManagerOrAdmin = roleName === 'MANAGER' || roleName === 'HIGH_LEVEL_ADMIN';

    let totalQ = supabase.from('profiles').select('id', { count: 'exact', head: true });
    let activeQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE');
    let draftQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT');
    let pausedQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'PAUSED');
    let archivedQ = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ARCHIVED');

    // Fail-closed: Only MANAGER / HIGH_LEVEL_ADMIN see global counts
    if (!isManagerOrAdmin) {
      const ownerFilter = `current_agent_id.eq.${user.id},and(current_agent_id.is.null,created_by.eq.${user.id})`;
      totalQ = totalQ.or(ownerFilter);
      activeQ = activeQ.or(ownerFilter);
      draftQ = draftQ.or(ownerFilter);
      pausedQ = pausedQ.or(ownerFilter);
      archivedQ = archivedQ.or(ownerFilter);
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
