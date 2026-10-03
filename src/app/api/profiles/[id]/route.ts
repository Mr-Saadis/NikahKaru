import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: deleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Admin client delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE profile route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
