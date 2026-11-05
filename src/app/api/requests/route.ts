import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role verification: MANAGER or HIGH_LEVEL_ADMIN only
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    // @ts-expect-error - nested role typing
    const roleName = userRoleData?.role?.name?.toUpperCase();
    if (roleName !== 'MANAGER' && roleName !== 'HIGH_LEVEL_ADMIN' && roleName !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    // Build the query
    let query = supabase.from('vw_manager_requests_board').select('*');

    // Fetch data
    const { data, error } = await query;

    if (error) {
      console.error('Supabase requests query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API /api/requests error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
