import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // Fetch from the views
    const [
      { data: coreData, error: coreError },
      { data: nestedData, error: nestedError },
      { data: prefData, error: prefError }
    ] = await Promise.all([
      supabase.from('vw_profile_core').select('*').eq('profile_id', id).single(),
      supabase.from('vw_profile_nested_arrays').select('*').eq('profile_id', id).single(),
      supabase.from('vw_profile_active_preferences').select('*').eq('profile_id', id).maybeSingle()
    ]);

    if (coreError) {
      return NextResponse.json({ error: coreError.message }, { status: 404 });
    }

    // Map the view data back to FullProfile structure expected by the frontend
    const profile = {
      id: coreData.profile_id,
      gender: coreData.gender,
      status: coreData.status,
      created_by: coreData.created_by,
      current_agent_id: coreData.current_agent_id,
      created_at: coreData.created_at,
      updated_at: coreData.updated_at,
      archived_at: coreData.archived_at,
      profile_URL: coreData.profile_url,
      
      personal_information: coreData.full_name ? {
        full_name: coreData.full_name,
        date_of_birth: coreData.date_of_birth,
        marital_status: coreData.marital_status,
        number_of_children: coreData.number_of_children,
        cnic: coreData.cnic,
        nationality_country_id: coreData.nationality_country_id,
        mother_tongue_id: coreData.mother_tongue_id,
      } : null,
      
      physical_information: coreData.height_cm ? {
        height_cm: coreData.height_cm,
        weight_kg: coreData.weight_kg,
        complexion: coreData.complexion,
        has_disability: coreData.has_disability,
        disability_details: coreData.disability_details,
      } : null,
      
      religion_information: coreData.religion_id ? {
        religion_id: coreData.religion_id,
        sect_id: coreData.sect_id,
        caste_id: coreData.caste_id,
        other_caste_text: coreData.other_caste_text,
      } : null,
      
      profile_locations: coreData.current_country_id ? {
        current_country_id: coreData.current_country_id,
        current_province_id: coreData.current_province_id,
        current_city_id: coreData.current_city_id,
        current_location_text: coreData.current_location_text,
        permanent_country_id: coreData.permanent_country_id,
        permanent_province_id: coreData.permanent_province_id,
        permanent_city_id: coreData.permanent_city_id,
        permanent_location_text: coreData.permanent_location_text,
      } : null,
      
      residency_information: coreData.house_status ? {
        house_status: coreData.house_status,
        property_type: coreData.property_type,
        family_setup: coreData.family_setup,
        living_with: coreData.living_with,
        living_with_other_details: coreData.living_with_other_details,
      } : null,
      
      income_information: coreData.monthly_income_min ? {
        monthly_income_min: coreData.monthly_income_min,
        monthly_income_max: coreData.monthly_income_max,
        currency_code: coreData.currency_code,
        income_period: coreData.income_period,
      } : null,
      
      family_information: coreData.family_profession_business ? {
        family_profession_business: coreData.family_profession_business,
        social_background: coreData.social_background,
        family_values: coreData.family_values,
        family_introduction: coreData.family_introduction,
        important_family_circumstances: coreData.important_family_circumstances,
        additional_details: coreData.family_additional_details,
      } : null,
      
      lifestyle_information: coreData.religious_practice ? {
        beard: coreData.beard,
        hijab: coreData.hijab,
        religious_practice: coreData.religious_practice,
        smoking: coreData.smoking,
        other_lifestyle_information: coreData.other_lifestyle_information,
      } : null,

      // Arrays from nested view
      education_records: nestedData?.education_records || [],
      employment_records: nestedData?.employment_records || [],
      parents: nestedData?.parents || [],
      siblings: nestedData?.siblings || [],
      children: nestedData?.children || [],
      previous_marriages: nestedData?.previous_marriages || [],
      
      // We don't populate relocation_information currently from coreData as it's missing in view, 
      // but it's optional. Preference sets can be sent if needed.
    };

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error('Error in GET profile route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
