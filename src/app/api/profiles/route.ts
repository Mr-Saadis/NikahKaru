import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20'); // Using 20 as default
    const offset = (page - 1) * limit;
    
    const status = searchParams.get('status');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');
    const cityId = searchParams.get('cityId');
    const minAge = searchParams.get('minAge');
    const maxAge = searchParams.get('maxAge');

    // 1. Fetch core data (Paginated)
    let query = supabase
      .from('vw_profile_core')
      .select('*', { count: 'exact' });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    } else if (!status || status === 'ALL') {
      query = query.neq('status', 'DRAFT');
    }
    
    if (gender) {
      query = query.eq('gender', gender);
    }
    
    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }
    
    if (cityId) {
      query = query.eq('current_city_id', parseInt(cityId));
    }
    
    if (minAge) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - parseInt(minAge));
      query = query.lte('date_of_birth', minDate.toISOString());
    }
    if (maxAge) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - parseInt(maxAge) - 1);
      query = query.gte('date_of_birth', maxDate.toISOString());
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: coreData, error: coreError, count } = await query;

    if (coreError) {
      console.error('Error fetching profiles from view:', coreError);
      return NextResponse.json({ error: coreError.message }, { status: 500 });
    }

    if (!coreData || coreData.length === 0) {
      return NextResponse.json({ data: [], count: count || 0 });
    }

    const profileIds = coreData.map(p => p.profile_id);

    // 2. Fetch Nested Arrays and Preferences for these profile IDs
    const [
      { data: nestedData, error: nestedError },
      { data: prefData, error: prefError }
    ] = await Promise.all([
      supabase.from('vw_profile_nested_arrays').select('*').in('profile_id', profileIds),
      supabase.from('vw_profile_active_preferences').select('*').in('profile_id', profileIds)
    ]);

    if (nestedError) console.error('Error fetching nested data:', nestedError);
    if (prefError) console.error('Error fetching pref data:', prefError);

    // Create lookup maps
    const nestedMap = new Map((nestedData || []).map(n => [n.profile_id, n]));
    const prefMap = new Map((prefData || []).map(p => [p.profile_id, p]));

    // 3. Map into FullProfile structure
    const fullProfiles = coreData.map(p => {
      const nested = nestedMap.get(p.profile_id);
      const pref = prefMap.get(p.profile_id);

      return {
        id: p.profile_id,
        gender: p.gender,
        status: p.status,
        created_by: p.created_by,
        current_agent_id: p.current_agent_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
        archived_at: p.archived_at,
        profile_URL: p.profile_url,
        
        personal_information: p.full_name ? {
          full_name: p.full_name,
          date_of_birth: p.date_of_birth,
          marital_status: p.marital_status,
          number_of_children: p.number_of_children,
          cnic: p.cnic,
          nationality_country_id: p.nationality_country_id,
          mother_tongue_id: p.mother_tongue_id,
        } : null,
        
        physical_information: p.height_cm ? {
          height_cm: p.height_cm,
          weight_kg: p.weight_kg,
          complexion: p.complexion,
          has_disability: p.has_disability,
          disability_details: p.disability_details,
        } : null,
        
        religion_information: p.religion_id ? {
          religion_id: p.religion_id,
          sect_id: p.sect_id,
          caste_id: p.caste_id,
          other_caste_text: p.other_caste_text,
        } : null,
        
        profile_locations: p.current_country_id ? {
          current_country_id: p.current_country_id,
          current_province_id: p.current_province_id,
          current_city_id: p.current_city_id,
          current_location_text: p.current_location_text,
          permanent_country_id: p.permanent_country_id,
          permanent_province_id: p.permanent_province_id,
          permanent_city_id: p.permanent_city_id,
          permanent_location_text: p.permanent_location_text,
        } : null,
        
        residency_information: p.house_status ? {
          house_status: p.house_status,
          property_type: p.property_type,
          family_setup: p.family_setup,
          living_with: p.living_with,
          living_with_other_details: p.living_with_other_details,
        } : null,
        
        income_information: p.monthly_income_min ? {
          monthly_income_min: p.monthly_income_min,
          monthly_income_max: p.monthly_income_max,
          currency_code: p.currency_code,
          income_period: p.income_period,
        } : null,
        
        family_information: p.family_profession_business ? {
          family_profession_business: p.family_profession_business,
          social_background: p.social_background,
          family_values: p.family_values,
          family_introduction: p.family_introduction,
          important_family_circumstances: p.important_family_circumstances,
          additional_details: p.family_additional_details,
        } : null,
        
        lifestyle_information: p.religious_practice ? {
          beard: p.beard,
          hijab: p.hijab,
          religious_practice: p.religious_practice,
          smoking: p.smoking,
          other_lifestyle_information: p.other_lifestyle_information,
        } : null,

        // Arrays from nested view
        education_records: nested?.education_records || [],
        employment_records: nested?.employment_records || [],
        parents: nested?.parents || [],
        siblings: nested?.siblings || [],
        children: nested?.children || [],
        previous_marriages: nested?.previous_marriages || [],
        
        // Active preference set
        preference_sets: pref ? [pref] : []
      };
    });

    return NextResponse.json({ data: fullProfiles, count: count || 0 });
  } catch (err: any) {
    console.error('API Error in GET profiles:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
