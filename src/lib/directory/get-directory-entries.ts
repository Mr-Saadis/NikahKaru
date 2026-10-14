import { createClient } from '@/lib/supabase/client';
import type { DirectoryEntry } from './types';

/**
 * Computes the board stage key for a profile — mirrors the logic in
 * vw_manager_requests_board so directory card colours match the requests board.
 */
function computeBoardStage(
  profileId: string,
  requestsByProfile: Map<string, { status: string; count: number }>,
): DirectoryEntry['boardStage'] {
  const info = requestsByProfile.get(profileId);
  if (!info) return 'new'; // No requests → New Data

  const { status, count } = info;
  if (status === 'PENDING') return count > 1 ? 'second' : 'first';
  if (status === 'PENDING_OTHER') return 'second';
  if (status === 'IN_REVIEW') return 'responded';
  if (status === 'COMPLETED') return 'done';
  if (status === 'CANCELLED') return 'archive';
  return 'new';
}

/**
 * Single data-access function for directory entries.
 * Fetches real profiles from Supabase vw_profile_core, vw_profile_nested_arrays,
 * and information_requests (to determine the correct board stage per profile).
 */
export async function getDirectoryEntries(): Promise<DirectoryEntry[]> {
  try {
    const supabase = createClient();

    // Fetch core profile data, nested arrays, and information_requests in parallel
    const [
      { data: coreData, error: coreError },
      { data: nestedData, error: nestedError },
      { data: requestsData, error: requestsError },
    ] = await Promise.all([
      supabase
        .from('vw_profile_core')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('vw_profile_nested_arrays').select('*'),
      // Fetch latest request status + count per source profile
      supabase
        .from('information_requests')
        .select('source_profile_id, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (requestsError) {
      console.warn('Warning fetching information_requests:', requestsError);
    }

    // Build a map: profileId → { status of latest request, total count }
    const requestsByProfile = new Map<string, { status: string; count: number }>();
    for (const req of requestsData || []) {
      const pid = req.source_profile_id;
      const existing = requestsByProfile.get(pid);
      if (!existing) {
        // First row = latest (ordered DESC), so this is the latest status
        requestsByProfile.set(pid, { status: req.status, count: 1 });
      } else {
        // Subsequent rows = older requests, just increment count
        existing.count += 1;
      }
    }

    if (coreError) {
      console.error('Failed to fetch profiles from vw_profile_core:', coreError);
      return [];
    }

    if (nestedError) {
      console.warn('Warning fetching vw_profile_nested_arrays:', nestedError);
    }

    const nestedMap = new Map((nestedData || []).map((n: any) => [n.profile_id, n]));

    return (coreData || []).map((p: any) => {
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

      // Height in inches
      const heightInches = p.height_cm ? Math.round(p.height_cm / 2.54) : 0;

      // Extract highest education
      const highestEdu =
        nested?.education_records?.find((e: any) => e.is_highest_qualification) ||
        nested?.education_records?.[0];

      // Extract current employment
      const currentEmp =
        nested?.employment_records?.find((e: any) => e.is_current) ||
        nested?.employment_records?.[0];

      // Extract father
      const father = nested?.parents?.find((parent: any) => parent.parent_type === 'FATHER');

      // Qualification string
      const qualification =
        highestEdu?.qualification || highestEdu?.education_level_name_en || '';

      // Job title string
      const jobTitle = currentEmp?.job_title || currentEmp?.occupation_name_en || '';

      // Income in thousands
      const monthlyIncomeMin = p.monthly_income_min
        ? Math.round(Number(p.monthly_income_min) / 1000)
        : 0;
      const monthlyIncomeMax = p.monthly_income_max
        ? Math.round(Number(p.monthly_income_max) / 1000)
        : 0;

      // Compute board stage from information_requests data (mirrors vw_manager_requests_board)
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
        cardBg: boardStage, // EntryCard uses getDirectoryStageCardStyle(boardStage) for actual colour

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
          education_records: nested?.education_records || [],
          employment_records: nested?.employment_records || [],
          parents: nested?.parents || [],
          siblings: nested?.siblings || [],
          children: nested?.children || [],
          previous_marriages: nested?.previous_marriages || [],
        },
      };
    });
  } catch (err) {
    console.error('Error in getDirectoryEntries:', err);
    return [];
  }
}
