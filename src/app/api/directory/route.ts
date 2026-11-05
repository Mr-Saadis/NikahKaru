import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DirectoryEntry } from '@/lib/directory/types';

/**
 * Computes the board stage key for a profile — mirrors vw_manager_requests_board
 */
function computeBoardStage(
  profileId: string,
  requestsByProfile: Map<string, { status: string; count: number }>,
): DirectoryEntry['boardStage'] {
  const info = requestsByProfile.get(profileId);
  if (!info) return 'new';

  const { status, count } = info;
  if (status === 'PENDING') return count > 1 ? 'second' : 'first';
  if (status === 'PENDING_OTHER') return 'second';
  if (status === 'IN_REVIEW') return 'responded';
  if (status === 'COMPLETED') return 'done';
  if (status === 'CANCELLED') return 'archive';
  return 'new';
}

const NORM = (s: string) => (s || '').toLowerCase().replace(/[\s_\-]/g, '');

const STATUS_REVERSE_MAP: Record<string, string> = {
  'never married': 'NEVER_MARRIED',
  'married': 'MARRIED',
  'divorced': 'DIVORCED',
  'widowed': 'WIDOWED',
  'separated': 'SEPARATED',
  'annulled': 'ANNULLED',
};

const PRAYER_REVERSE_MAP: Record<string, string> = {
  'highly practicing': 'HIGHLY_PRACTICING',
  'practicing': 'PRACTICING',
  'moderate': 'MODERATE',
  'other': 'OTHER',
};

const SMOKING_REVERSE_MAP: Record<string, string> = {
  'no': 'NO',
  'yes': 'YES',
  'occasionally': 'OCCASIONALLY',
};

const FAMILY_REVERSE_MAP: Record<string, string> = {
  'joint': 'JOINT',
  'separate': 'SEPARATE',
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role verification: MANAGER or HIGH_LEVEL_ADMIN only
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    // @ts-expect-error - nested role typing
    const roleName = userRoleData?.role?.name?.toUpperCase();
    if (roleName !== 'MANAGER' && roleName !== 'HIGH_LEVEL_ADMIN' && roleName !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Forbidden: Manager or Admin privileges required to access directory' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse & sanitize search param (strip PostgREST filter delimiters)
    const rawSearch = searchParams.get('search')?.trim() || '';
    const search = rawSearch.replace(/[,()"\\]/g, '').trim();
    const gender = searchParams.get('gender')?.split(',').filter(Boolean) || [];
    const maritalStatus = searchParams.get('maritalStatus')?.split(',').filter(Boolean) || [];
    const minAge = searchParams.get('minAge');
    const maxAge = searchParams.get('maxAge');
    const minHeight = searchParams.get('minHeight'); // inches
    const maxHeight = searchParams.get('maxHeight'); // inches
    const minIncome = searchParams.get('minIncome'); // thousands
    const maxIncome = searchParams.get('maxIncome'); // thousands
    const country = searchParams.get('country')?.split(',').filter(Boolean) || [];
    const city = searchParams.get('city')?.split(',').filter(Boolean) || [];
    const sect = searchParams.get('sect')?.split(',').filter(Boolean) || [];
    const caste = searchParams.get('caste')?.split(',').filter(Boolean) || [];
    const motherTongue = searchParams.get('motherTongue')?.split(',').filter(Boolean) || [];
    const complexion = searchParams.get('complexion')?.split(',').filter(Boolean) || [];
    const permanentCity = searchParams.get('permanentCity')?.split(',').filter(Boolean) || [];
    const familyType = searchParams.get('familyType')?.split(',').filter(Boolean) || [];
    const prayer = searchParams.get('prayer')?.split(',').filter(Boolean) || [];
    const smoking = searchParams.get('smoking')?.split(',').filter(Boolean) || [];
    const beardHijab = searchParams.get('beardHijab')?.split(',').filter(Boolean) || [];
    const profession = searchParams.get('profession')?.split(',').filter(Boolean) || [];
    const degree = searchParams.get('degree')?.split(',').filter(Boolean) || [];
    const institute = searchParams.get('institute')?.split(',').filter(Boolean) || [];
    const employer = searchParams.get('employer')?.split(',').filter(Boolean) || [];
    const fatherProfession = searchParams.get('fatherProfession')?.split(',').filter(Boolean) || [];

    // Mode: 'all' | 'exact' | 'similar'
    const mode = searchParams.get('mode') || 'all';

    // ── Build core query ──────────────────────────────────────────
    // RULE: ALWAYS exclude DRAFT profiles!
    let query = supabase
      .from('vw_profile_core')
      .select('*')
      .neq('status', 'DRAFT');

    // In 'exact' mode (or default filtering): apply hard SQL filters on core view
    if (mode === 'exact' || mode === 'all') {
      if (search) {
        // Search across full_name, cnic, phone
        query = query.or(`full_name.ilike.%${search}%,cnic.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      if (gender.length > 0) {
        const mappedGender = gender.map((g) => g.toUpperCase());
        query = query.in('gender', mappedGender);
      }

      if (maritalStatus.length > 0) {
        const mappedStatus = maritalStatus.map((s) => STATUS_REVERSE_MAP[s.toLowerCase()] || s.toUpperCase());
        query = query.in('marital_status', mappedStatus);
      }

      if (minAge) {
        const ageNum = parseInt(minAge, 10);
        if (!isNaN(ageNum)) {
          const maxDob = new Date();
          maxDob.setFullYear(maxDob.getFullYear() - ageNum);
          query = query.lte('date_of_birth', maxDob.toISOString().split('T')[0]);
        }
      }

      if (maxAge) {
        const ageNum = parseInt(maxAge, 10);
        if (!isNaN(ageNum)) {
          const minDob = new Date();
          minDob.setFullYear(minDob.getFullYear() - ageNum - 1);
          query = query.gte('date_of_birth', minDob.toISOString().split('T')[0]);
        }
      }

      if (minHeight) {
        const inches = parseFloat(minHeight);
        if (!isNaN(inches)) {
          const minCm = Math.round(inches * 2.54);
          query = query.gte('height_cm', minCm);
        }
      }

      if (maxHeight) {
        const inches = parseFloat(maxHeight);
        if (!isNaN(inches)) {
          const maxCm = Math.round(inches * 2.54);
          query = query.lte('height_cm', maxCm);
        }
      }

      if (minIncome) {
        const incomeVal = parseFloat(minIncome);
        if (!isNaN(incomeVal)) {
          // monthly_income_max >= minIncome * 1000
          query = query.gte('monthly_income_max', incomeVal * 1000);
        }
      }

      if (maxIncome) {
        const incomeVal = parseFloat(maxIncome);
        if (!isNaN(incomeVal)) {
          // monthly_income_min <= maxIncome * 1000
          query = query.lte('monthly_income_min', incomeVal * 1000);
        }
      }

      if (country.length > 0) {
        query = query.in('current_country_name_en', country);
      }

      if (city.length > 0) {
        query = query.in('current_city_name_en', city);
      }

      if (sect.length > 0) {
        query = query.in('sect_name_en', sect);
      }

      if (caste.length > 0) {
        query = query.in('caste_name_en', caste);
      }

      if (motherTongue.length > 0) {
        query = query.in('mother_tongue_name_en', motherTongue);
      }

      if (complexion.length > 0) {
        query = query.in('complexion', complexion);
      }

      if (permanentCity.length > 0) {
        query = query.in('permanent_city_name_en', permanentCity);
      }

      if (familyType.length > 0) {
        const mapped = familyType.map((f) => FAMILY_REVERSE_MAP[f.toLowerCase()] || f.toUpperCase());
        query = query.in('family_setup', mapped);
      }

      if (prayer.length > 0) {
        const mapped = prayer.map((p) => PRAYER_REVERSE_MAP[p.toLowerCase()] || p.toUpperCase());
        query = query.in('religious_practice', mapped);
      }

      if (smoking.length > 0) {
        const mapped = smoking.map((s) => SMOKING_REVERSE_MAP[s.toLowerCase()] || s.toUpperCase());
        query = query.in('smoking', mapped);
      }
    }

    query = query.order('created_at', { ascending: false });

    // Execute queries in parallel
    const [
      { data: coreData, error: coreError },
      { data: requestsData, error: requestsError },
    ] = await Promise.all([
      query,
      supabase
        .from('information_requests')
        .select('id, source_profile_id, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (coreError) {
      console.error('Error fetching profiles from vw_profile_core:', coreError);
      return NextResponse.json({ error: coreError.message }, { status: 500 });
    }

    if (requestsError) {
      console.warn('Warning fetching information_requests:', requestsError);
    }

    const matchedProfileIds = (coreData || []).map((p: any) => p.profile_id);

    // Fetch nested arrays for matched profiles
    let nestedData: any[] = [];
    if (matchedProfileIds.length > 0) {
      const { data: nested, error: nestedError } = await supabase
        .from('vw_profile_nested_arrays')
        .select('*')
        .in('profile_id', matchedProfileIds);

      if (nestedError) {
        console.warn('Warning fetching nested arrays:', nestedError);
      } else {
        nestedData = nested || [];
      }
    }

    // Build requests status map
    const requestsByProfile = new Map<string, { id: string; status: string; count: number }>();
    for (const req of requestsData || []) {
      const pid = req.source_profile_id;
      const existing = requestsByProfile.get(pid);
      if (!existing) {
        requestsByProfile.set(pid, { id: req.id, status: req.status, count: 1 });
      } else {
        existing.count += 1;
      }
    }

    const nestedMap = new Map((nestedData || []).map((n: any) => [n.profile_id, n]));

    // Map into DirectoryEntry
    let entries: DirectoryEntry[] = (coreData || []).map((p: any) => {
      const nested = nestedMap.get(p.profile_id);

      // Compute age from date_of_birth
      let age = 0;
      if (p.date_of_birth) {
        const birthDate = new Date(p.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      const heightInches = p.height_cm ? Math.round(p.height_cm / 2.54) : 0;

      const highestEdu =
        nested?.education_records?.find((e: any) => e.is_highest_qualification) ||
        nested?.education_records?.[0];

      const currentEmp =
        nested?.employment_records?.find((e: any) => e.is_current) ||
        nested?.employment_records?.[0];

      const father = nested?.parents?.find((parent: any) => parent.parent_type === 'FATHER');

      const qualification =
        highestEdu?.qualification || highestEdu?.education_level_name_en || '';

      const jobTitle = currentEmp?.job_title || currentEmp?.occupation_name_en || '';

      const monthlyIncomeMin = p.monthly_income_min
        ? Math.round(Number(p.monthly_income_min) / 1000)
        : 0;
      const monthlyIncomeMax = p.monthly_income_max
        ? Math.round(Number(p.monthly_income_max) / 1000)
        : 0;

      const boardStage: DirectoryEntry['boardStage'] =
        p.status === 'ARCHIVED' ? 'archive' : computeBoardStage(p.profile_id, requestsByProfile);

      return {
        id: p.profile_id,
        profileId: p.profile_id,
        cnic: p.cnic || '',
        fullName: p.full_name || 'Unnamed',
        phone: p.phone || '',
        assignedStaff: p.current_agent_name || 'Unassigned',
        requestDate: p.created_at || new Date().toISOString(),
        boardStage,
        boardStageColor: '#2F3E51',
        cardBg: boardStage,

        age,
        dob: p.date_of_birth || '',
        gender: p.gender || 'MALE',
        maritalStatus: p.marital_status || 'NEVER_MARRIED',
        numberOfChildren: p.number_of_children || 0,
        motherTongue: p.mother_tongue_name_en || '',

        heightCm: p.height_cm || 0,
        heightInches,
        weightKg: p.weight_kg || 0,
        complexion: p.complexion || '',
        hasDisability: !!p.has_disability,

        qualification,
        institutionName: highestEdu?.institution_name || '',
        fieldOfStudy: highestEdu?.field_of_study || '',

        jobTitle,
        organizationName: currentEmp?.organization_name || '',

        monthlyIncomeMin,
        monthlyIncomeMax,

        religionName: p.religion_name_en || 'Islam',
        sectName: p.sect_name_en || '',
        casteName: p.caste_name_en || '',

        currentCountry: p.current_country_name_en || '',
        currentCity: p.current_city_name_en || '',
        permanentCity: p.permanent_city_name_en || '',

        familyType: p.family_setup === 'SEPARATE' ? 'Separate' : 'Joint',
        fatherProfession: father?.profession || p.family_profession_business || '',
        livingWith: p.living_with || 'Parents',
        houseStatus: p.house_status || '',

        prayer: p.religious_practice || '',
        beard: p.beard || '',
        hijab: p.hijab || '',
        smoking: p.smoking || '',

        profileData: {
          ...p,
          request_id: requestsByProfile.get(p.profile_id)?.id || null,
          request_status: requestsByProfile.get(p.profile_id)?.status || null,
          education_records: nested?.education_records || [],
          employment_records: nested?.employment_records || [],
          parents: nested?.parents || [],
          siblings: nested?.siblings || [],
          children: nested?.children || [],
          previous_marriages: nested?.previous_marriages || [],
        },
      };
    });

    // Post-filter for nested and custom attributes (profession, degree, employer, institute, beardHijab)
    if (mode === 'exact' || mode === 'all') {
      if (profession.length > 0) {
        entries = entries.filter((e) =>
          profession.some((pr) => NORM(e.jobTitle).includes(NORM(pr)) || NORM(pr).includes(NORM(e.jobTitle)))
        );
      }

      if (degree.length > 0) {
        entries = entries.filter((e) =>
          degree.some((d) => NORM(e.qualification).includes(NORM(d)) || NORM(d).includes(NORM(e.qualification)))
        );
      }

      if (institute.length > 0) {
        entries = entries.filter((e) =>
          institute.some((inst) => NORM(e.institutionName).includes(NORM(inst)) || NORM(inst).includes(NORM(e.institutionName)))
        );
      }

      if (employer.length > 0) {
        entries = entries.filter((e) =>
          employer.some((emp) => NORM(e.organizationName).includes(NORM(emp)) || NORM(emp).includes(NORM(e.organizationName)))
        );
      }

      if (fatherProfession.length > 0) {
        entries = entries.filter((e) =>
          fatherProfession.some((fp) => NORM(e.fatherProfession).includes(NORM(fp)) || NORM(fp).includes(NORM(e.fatherProfession)))
        );
      }

      if (beardHijab.length > 0) {
        entries = entries.filter((e) => {
          const val = e.gender === 'MALE' ? e.beard : e.hijab;
          const displayVal = val === 'YES' ? 'Yes' : val === 'NO' ? 'No' : val;
          return beardHijab.some((b) => NORM(b) === NORM(val) || NORM(b) === NORM(displayVal));
        });
      }
    }

    return NextResponse.json({
      data: entries,
      total: entries.length,
    });
  } catch (err: any) {
    console.error('Error in /api/directory:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
