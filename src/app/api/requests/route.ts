import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

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
