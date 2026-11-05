import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side helper to authenticate and verify HIGH_LEVEL_ADMIN role
 */
async function verifyAdminUser() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { authorized: false, status: 401, error: 'Unauthorized', user: null, adminClient: null };
  }

  const adminClient = createAdminClient();
  const { data: userRoleData, error: roleError } = await adminClient
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError) {
    return { authorized: false, status: 500, error: 'Failed to verify permissions', user, adminClient: null };
  }

  // @ts-expect-error - nested role typing
  const roleName = userRoleData?.role?.name?.toUpperCase();
  if (roleName !== 'HIGH_LEVEL_ADMIN' && roleName !== 'DEVELOPER') {
    return { authorized: false, status: 403, error: 'Forbidden: Admin access required', user, adminClient: null };
  }

  return { authorized: true, status: 200, user, adminClient };
}

export async function GET(request: Request) {
  const auth = await verifyAdminUser();
  if (!auth.authorized || !auth.adminClient) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const adminClient = auth.adminClient;
  
  const { data: users, error } = await adminClient
    .from('users')
    .select(`
      id,
      full_name,
      email,
      phone,
      status,
      user_roles!user_roles_user_id_fkey (
        role:roles (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const formattedUsers = (users || []).map((u: any) => ({
    User_ID: u.id,
    User_Name: u.full_name,
    User_Email: u.email,
    User_Phone: u.phone,
    is_active: u.status === 'ACTIVE',
    User_Role: u.user_roles?.[0]?.role?.name || 'UNKNOWN'
  }));

  const { data: roles } = await adminClient.from('roles').select('id, name');

  return NextResponse.json({ success: true, data: formattedUsers, roles: roles || [] });
}

export async function POST(request: Request) {
  const auth = await verifyAdminUser();
  if (!auth.authorized || !auth.adminClient || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const adminClient = auth.adminClient;
  const currentUser = auth.user;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = typeof body.role === 'string' ? body.role.trim().toUpperCase() : 'AGENT';

  if (!name || !email || !password) {
    return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  // Whitelist allowable roles
  const ALLOWED_ROLES = ['HIGH_LEVEL_ADMIN', 'MANAGER', 'AGENT'];
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ success: false, error: 'Invalid role specified' }, { status: 400 });
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone }
  });

  if (authError) {
    return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
  }

  const newUserId = authData.user.id;

  const { error: insertUserError } = await adminClient
    .from('users')
    .upsert({
      id: newUserId,
      full_name: name,
      email,
      phone,
      status: 'ACTIVE'
    }, { onConflict: 'id' });

  if (insertUserError) {
    await adminClient.auth.admin.deleteUser(newUserId);
    return NextResponse.json({ success: false, error: insertUserError.message }, { status: 500 });
  }

  let { data: roleData } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', role)
    .single();

  if (!roleData) {
    const { data: newRole, error: newRoleError } = await adminClient
      .from('roles')
      .insert({ name: role, description: `Role ${role}` })
      .select('id')
      .single();
    
    if (newRoleError) {
      return NextResponse.json({ success: false, error: 'Failed to find role: ' + newRoleError.message }, { status: 500 });
    }
    roleData = newRole;
  }

  const { error: roleAssignError } = await adminClient
    .from('user_roles')
    .insert({
      user_id: newUserId,
      role_id: roleData.id,
      assigned_by: currentUser.id
    });

  if (roleAssignError) {
    return NextResponse.json({ success: false, error: roleAssignError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const auth = await verifyAdminUser();
  if (!auth.authorized || !auth.adminClient) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const adminClient = auth.adminClient;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { userId, newRole, newPhone, isActive } = body;
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ success: false, error: 'Valid userId is required' }, { status: 400 });
  }

  if (isActive !== undefined) {
    const status = isActive ? 'ACTIVE' : 'INACTIVE';
    const { error } = await adminClient
      .from('users')
      .update({ status })
      .eq('id', userId);
    
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (newRole || newPhone !== undefined) {
    if (newPhone !== undefined) {
      const cleanPhone = typeof newPhone === 'string' ? newPhone.trim() : '';
      const { error: updateError } = await adminClient
        .from('users')
        .update({ phone: cleanPhone })
        .eq('id', userId);
      if (updateError) return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }
    
    if (newRole) {
      const roleStr = String(newRole).trim().toUpperCase();
      const ALLOWED_ROLES = ['HIGH_LEVEL_ADMIN', 'MANAGER', 'AGENT'];
      if (!ALLOWED_ROLES.includes(roleStr)) {
        return NextResponse.json({ success: false, error: 'Invalid role specified' }, { status: 400 });
      }

      let { data: roleData } = await adminClient
        .from('roles')
        .select('id')
        .eq('name', roleStr)
        .single();
      
      if (!roleData) {
        const { data: newRoleData } = await adminClient.from('roles').insert({ name: roleStr }).select('id').single();
        roleData = newRoleData;
      }

      if (roleData) {
        const { error: roleError } = await adminClient
          .from('user_roles')
          .update({ role_id: roleData.id })
          .eq('user_id', userId);
          
        if (roleError) {
          await adminClient.from('user_roles').insert({ user_id: userId, role_id: roleData.id });
        }
      }
    }
    
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminUser();
  if (!auth.authorized || !auth.adminClient || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
  }

  // Prevent admin from deleting their own account
  if (id === auth.user.id) {
    return NextResponse.json({ success: false, error: 'Cannot delete your own admin account' }, { status: 400 });
  }
  
  const adminClient = auth.adminClient;
  const { error } = await adminClient.auth.admin.deleteUser(id);
  
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
