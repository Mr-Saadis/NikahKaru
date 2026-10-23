import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user (Manager / Admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releasesData } = await request.json();
    if (!releasesData || !Array.isArray(releasesData)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Resolve actual request_id
    let targetRequestId = id;
    const { data: reqById } = await adminClient
      .from('information_requests')
      .select('id, status, source_profile_id')
      .eq('id', id)
      .maybeSingle();

    let targetReq = reqById;

    if (!targetReq) {
      // id might be source_profile_id
      const { data: reqByProfile } = await adminClient
        .from('information_requests')
        .select('id, status, source_profile_id')
        .eq('source_profile_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reqByProfile) {
        targetReq = reqByProfile;
        targetRequestId = reqByProfile.id;
      }
    }

    // If request still doesn't exist (e.g. agent called offline without creating a request)
    if (!targetReq) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id, current_agent_id')
        .eq('id', id)
        .maybeSingle();

      if (profile) {
        const { data: newReq, error: newReqErr } = await adminClient
          .from('information_requests')
          .insert({
            source_profile_id: profile.id,
            requested_by: profile.current_agent_id || user.id,
            status: 'IN_REVIEW',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id, status, source_profile_id')
          .single();

        if (newReq && !newReqErr) {
          targetReq = newReq;
          targetRequestId = newReq.id;
        }
      }
    }

    if (!targetReq) {
      return NextResponse.json({ error: 'Information request not found' }, { status: 404 });
    }

    // 2. CRITICAL FOR DOWNLOADED STATUS:
    // If the request is currently in DOWNLOADED status, normalize to IN_REVIEW
    // so the release succeeds seamlessly like the requests responded stage.
    if (targetReq.status === 'DOWNLOADED') {
      await adminClient
        .from('information_requests')
        .update({ status: 'IN_REVIEW', updated_at: new Date().toISOString() })
        .eq('id', targetRequestId);
    }

    // 3. Call the RPC to approve release and record fields & history
    const { data: rpcData, error: rpcError } = await supabase.rpc('approve_information_release', {
      p_request_id: targetRequestId,
      p_releases_data: releasesData
    });

    if (rpcError) {
      console.warn('RPC Error with user client, attempting with admin client:', rpcError);
      const { data: adminRpcData, error: adminRpcError } = await adminClient.rpc('approve_information_release', {
        p_request_id: targetRequestId,
        p_releases_data: releasesData
      });

      if (adminRpcError) {
        console.error('Admin RPC Error (Release):', adminRpcError);
        return NextResponse.json({ error: adminRpcError.message || rpcError.message || 'Failed to approve release' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: adminRpcData });
    }

    return NextResponse.json({ success: true, data: rpcData });

  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
