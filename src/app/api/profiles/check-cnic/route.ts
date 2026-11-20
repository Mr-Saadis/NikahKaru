import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cnicRaw = searchParams.get('cnic') || '';
    const excludeProfileId = searchParams.get('excludeProfileId') || '';

    const digits = cnicRaw.replace(/\D/g, '');
    if (digits.length !== 13) {
      return NextResponse.json({ exists: false });
    }

    const formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    const adminClient = createAdminClient();

    let query = adminClient
      .from('personal_information')
      .select('profile_id, full_name')
      .in('cnic', [formatted, digits]);

    if (excludeProfileId) {
      query = query.neq('profile_id', excludeProfileId);
    }

    let { data: matches, error } = await query.limit(1);

    // Fallback in case cnic column is numeric (bigint) in some environment
    if (error) {
      let fallbackQuery = adminClient
        .from('personal_information')
        .select('profile_id, full_name')
        .eq('cnic', digits);

      if (excludeProfileId) {
        fallbackQuery = fallbackQuery.neq('profile_id', excludeProfileId);
      }

      const fallbackRes = await fallbackQuery.limit(1);
      matches = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error('Error checking CNIC uniqueness:', error);
      return NextResponse.json({ error: 'Failed to verify CNIC' }, { status: 500 });
    }

    const match = matches?.[0];
    if (!match) {
      return NextResponse.json({ exists: false });
    }

    const { data: profileRow } = await adminClient
      .from('profiles')
      .select('status')
      .eq('id', match.profile_id)
      .maybeSingle();

    return NextResponse.json({
      exists: true,
      existingProfile: {
        full_name: match.full_name || 'Existing Profile',
        status: profileRow?.status || null,
      },
    });
  } catch (err) {
    console.error('Unexpected error in check-cnic route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

