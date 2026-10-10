import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user (Manager)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releasesData } = await request.json();
    if (!releasesData || !Array.isArray(releasesData)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Call the RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('approve_information_release', {
      p_request_id: id,
      p_releases_data: releasesData
    });

    if (rpcError) {
      console.error('RPC Error (Release):', rpcError);
      return NextResponse.json({ error: rpcError.message || 'Failed to approve release' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rpcData });

  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
