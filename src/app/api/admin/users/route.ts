import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  
  const adminClient = createAdminClient();
  
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
    return NextResponse.json({ success: false, error: error.message });
  }

  const formattedUsers = users.map((u: any) => ({
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
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, email, phone, password, role } = body;

  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone }
  });

  if (authError) return NextResponse.json({ success: false, error: authError.message });

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
    return NextResponse.json({ success: false, error: insertUserError.message });
  }

  let { data: roleData } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', role)
    .single();

  if (!roleData) {
    const { data: newRole, error: newRoleError } = await adminClient
      .from('roles')
      .insert({ name: role, description: `Auto-created role ${role}` })
      .select('id')
      .single();
    
    if (newRoleError) return NextResponse.json({ success: false, error: 'Failed to create new role: ' + newRoleError.message });
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
    return NextResponse.json({ success: false, error: roleAssignError.message });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const adminClient = createAdminClient();
  const body = await request.json();
  const { userId, newRole, newPhone, isActive } = body;

  if (isActive !== undefined) {
    const status = isActive ? 'ACTIVE' : 'INACTIVE';
    const { error } = await adminClient
      .from('users')
      .update({ status })
      .eq('id', userId);
    
    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true });
  }

  if (newRole || newPhone !== undefined) {
    if (newPhone !== undefined) {
      const { error: updateError } = await adminClient
        .from('users')
        .update({ phone: newPhone })
        .eq('id', userId);
      if (updateError) return NextResponse.json({ success: false, error: updateError.message });
    }
    
    if (newRole) {
      let { data: roleData } = await adminClient
        .from('roles')
        .select('id')
        .eq('name', newRole)
        .single();
      
      if (!roleData) {
        const { data: newRoleData } = await adminClient.from('roles').insert({ name: newRole }).select('id').single();
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

  return NextResponse.json({ success: false, error: 'Invalid request' });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'User ID required' });
  
  const adminClient = createAdminClient();
  
  const { error } = await adminClient.auth.admin.deleteUser(id);
  
  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true });
}
