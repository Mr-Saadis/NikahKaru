import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user (Assigner)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assigneeId, notes = '' } = await request.json();
    if (!assigneeId) {
      return NextResponse.json({ error: 'Assignee ID is required' }, { status: 400 });
    }

    // Call the RPC
    const { error: rpcError } = await supabase.rpc('assign_information_request', {
      p_request_id: params.id,
      p_assigner_id: user.id,
      p_assignee_id: assigneeId,
      p_notes: notes
    });

    if (rpcError) {
      console.error('RPC Error (Assign):', rpcError);
      return NextResponse.json({ error: 'Failed to assign request' }, { status: 500 });
    }

    // Also update the requests table
    await supabase
      .from('information_requests')
      .update({ assigned_to: assigneeId })
      .eq('id', params.id);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
