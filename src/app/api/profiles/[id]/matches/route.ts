import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Query both match-related views
    const [
      { data: ledgerData, error: ledgerError },
      { data: resultsData, error: resultsError }
    ] = await Promise.all([
      supabase
        .from('vw_profile_matches_ledger')
        .select('*')
        .or(`male_profile_id.eq.${id},female_profile_id.eq.${id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('vw_profile_match_results')
        .select('*')
        .eq('source_profile_id', id)
        .order('executed_at', { ascending: false })
        .order('rank', { ascending: true })
    ]);

    if (ledgerError) throw ledgerError;
    if (resultsError) throw resultsError;

    return NextResponse.json({
      ledger: ledgerData || [],
      results: resultsData || []
    });
  } catch (err: any) {
    console.error('API Error in GET profile matches:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
