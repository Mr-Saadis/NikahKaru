import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchAgentRequests } from '@/api/agent-requests';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    // @ts-expect-error - nested role typing
    const roleName = userRoleData?.role?.name?.toUpperCase();
    if (roleName !== 'HIGH_LEVEL_ADMIN' && roleName !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Forbidden: Test route restricted to administrator' }, { status: 403 });
    }

    const data = await fetchAgentRequests({ search: '', dateFrom: '', dateTo: '', staff: '' });
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
