import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get('role');

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch User Role
    let userRole = requestedRole;
    if (!userRole) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .single();
      userRole = (roleData?.roles as any)?.name || 'AGENT';
    }

    // =========================================================================
    // ROLE: AGENT / STAFF
    // =========================================================================
    if (userRole === 'AGENT') {
      // 1. Assigned Profiles count
      const { count: assignedCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .or(`created_by.eq.${user.id},current_agent_id.eq.${user.id}`)
        .eq('status', 'ACTIVE');

      // 2. Draft Profiles count
      const { count: draftsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .or(`created_by.eq.${user.id},current_agent_id.eq.${user.id}`)
        .eq('status', 'DRAFT');

      // 3. Approved Releases
      const { data: releasesData } = await supabase
        .from('information_releases')
        .select(`
          id,
          request_id,
          candidate_profile_id,
          released_at,
          released_by,
          release_status,
          notes,
          information_requests!inner (
            id,
            source_profile_id,
            requested_by,
            status,
            created_at
          )
        `)
        .eq('release_status', 'ACTIVE')
        .order('released_at', { ascending: false })
        .limit(20);

      // Collect profile IDs to fetch details in a single batch
      const profileIds = new Set<string>();
      const managerIds = new Set<string>();

      (releasesData || []).forEach((rel: any) => {
        if (rel.candidate_profile_id) profileIds.add(rel.candidate_profile_id);
        if (rel.information_requests?.source_profile_id) profileIds.add(rel.information_requests.source_profile_id);
        if (rel.released_by) managerIds.add(rel.released_by);
      });

      // Fetch Profile Details
      let profilesMap = new Map<string, any>();
      if (profileIds.size > 0) {
        const { data: profs } = await supabase
          .from('vw_profile_core')
          .select('profile_id, full_name, gender, current_city_name_en, caste_name_en, date_of_birth, marital_status')
          .in('profile_id', Array.from(profileIds));

        (profs || []).forEach((p: any) => profilesMap.set(p.profile_id, p));
      }

      // Fetch Managers Names
      let managersMap = new Map<string, string>();
      if (managerIds.size > 0) {
        const { data: mgrs } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', Array.from(managerIds));
        (mgrs || []).forEach((m: any) => managersMap.set(m.id, m.full_name));
      }

      // Format Releases for Frontend
      const formattedReleases = (releasesData || []).map((rel: any) => {
        const src = profilesMap.get(rel.information_requests?.source_profile_id) || {
          full_name: 'Client Profile',
          gender: 'MALE',
          age: 28,
        };
        const cand = profilesMap.get(rel.candidate_profile_id) || {
          full_name: 'Candidate Profile',
          gender: 'FEMALE',
          age: 26,
        };

        const candAge = cand.date_of_birth
          ? Math.floor((new Date().getTime() - new Date(cand.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 25;

        return {
          id: rel.id,
          request_id: rel.request_id,
          source_profile: {
            id: rel.information_requests?.source_profile_id,
            profile_code: `PK-${(rel.information_requests?.source_profile_id || '').slice(0, 5).toUpperCase()}`,
            full_name: src.full_name,
            gender: src.gender || 'MALE',
          },
          candidate_profile: {
            id: rel.candidate_profile_id,
            profile_code: `PK-${(rel.candidate_profile_id || '').slice(0, 5).toUpperCase()}`,
            full_name: cand.full_name,
            gender: cand.gender || 'FEMALE',
            age: candAge,
            city: cand.current_city_name_en || 'Pakistan',
            caste: cand.caste_name_en || 'General',
            education: 'Graduate',
          },
          compatibility_score: 88,
          approved_by_manager: managersMap.get(rel.released_by) || 'Operations Manager',
          approved_at_relative: formatRelativeTime(rel.released_at),
          released_at: rel.released_at,
          status: rel.release_status,
        };
      });

      // 4. Requests Pipeline (Submitted by this agent or all recent)
      const { data: requestsData } = await supabase
        .from('information_requests')
        .select(`
          id,
          status,
          created_at,
          source_profile_id,
          reviewed_by,
          users:reviewed_by ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const reqProfileIds = (requestsData || []).map((r: any) => r.source_profile_id).filter(Boolean);
      let reqProfilesMap = new Map<string, any>();
      if (reqProfileIds.length > 0) {
        const { data: reqProfs } = await supabase
          .from('vw_profile_core')
          .select('profile_id, full_name')
          .in('profile_id', reqProfileIds);
        (reqProfs || []).forEach((p: any) => reqProfilesMap.set(p.profile_id, p));
      }

      const formattedRequests = (requestsData || []).map((req: any) => ({
        id: req.id,
        profile_name: reqProfilesMap.get(req.source_profile_id)?.full_name || 'Client Request',
        submitted_date: formatRelativeTime(req.created_at),
        assigned_manager: (req.users as any)?.full_name || 'Operations Desk',
        status: req.status,
      }));

      // 5. Incomplete Draft Profiles
      const { data: draftsData } = await supabase
        .from('vw_profile_core')
        .select('profile_id, full_name, gender, current_city_name_en, updated_at, date_of_birth')
        .eq('status', 'DRAFT')
        .order('updated_at', { ascending: false })
        .limit(5);

      const formattedDrafts = (draftsData || []).map((d: any) => {
        const age = d.date_of_birth
          ? Math.floor((new Date().getTime() - new Date(d.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 25;
        return {
          id: d.profile_id,
          name: d.full_name || 'Incomplete Profile',
          age,
          city: d.current_city_name_en || 'Pending',
          updated_at: formatRelativeTime(d.updated_at),
          current_step: 3,
          total_steps: 9,
          step_name: 'Education & Income',
        };
      });

      return NextResponse.json({
        role: 'AGENT',
        stats: {
          assignedProfiles: assignedCount || 0,
          releasedForClient: formattedReleases.length,
          activeInTalks: 0,
          draftsPending: draftsCount || 0,
        },
        releases: formattedReleases,
        requestsPipeline: formattedRequests,
        drafts: formattedDrafts,
        activePairs: [],
      });
    }

    // =========================================================================
    // ROLE: MANAGER
    // =========================================================================
    if (userRole === 'MANAGER') {
      // 1. Pending Requests count
      const { count: pendingCount } = await supabase
        .from('information_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // 2. Releases count
      const { count: releasesCount } = await supabase
        .from('information_releases')
        .select('id', { count: 'exact', head: true });

      // 3. In Review count
      const { count: inReviewCount } = await supabase
        .from('information_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'IN_REVIEW');

      // 4. Incoming Requests Queue from database view
      const { data: requestsBoardData, error: boardErr } = await supabase
        .from('vw_manager_requests_board')
        .select('*')
        .order('request_date', { ascending: false })
        .limit(30);

      const formattedBoard = (requestsBoardData || []).map((item: any) => {
        const age = item.date_of_birth
          ? Math.floor((new Date().getTime() - new Date(item.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 26;

        let status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' = 'PENDING';
        if (item.request_status === 'responded' || item.request_status === 'downloaded') {
          status = 'IN_REVIEW';
        } else if (item.request_status === 'done') {
          status = 'COMPLETED';
        }

        const isUrgent = item.request_status === 'first' || item.request_status === 'second';

        return {
          id: item.board_id,
          request_id: item.request_id || item.board_id,
          request_code: `REQ-${(item.board_id || '').slice(0, 6).toUpperCase()}`,
          source_profile: {
            id: item.profile_id,
            profile_code: `PK-${(item.profile_id || '').slice(0, 5).toUpperCase()}`,
            full_name: item.full_name || 'Candidate',
            gender: item.gender || 'MALE',
            age,
            city: item.current_city_name_en || 'Pakistan',
            caste: item.caste_name_en || 'General',
            education: 'Graduate',
          },
          requested_by_agent: item.current_agent_name || item.created_by_name || 'Staff Member',
          assigned_to_manager: 'You',
          status,
          board_status: item.request_status,
          created_at_relative: formatRelativeTime(item.request_date),
          waiting_hours: 4,
          is_urgent: isUrgent,
          notes: item.notes || null,
        };
      });

      // 5. Staff Caseload (Agents in the system)
      const { data: agentUsers } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          user_roles!user_roles_user_id_fkey!inner (
            roles!inner ( name )
          )
        `)
        .eq('user_roles.roles.name', 'AGENT');

      // For each agent, count their profiles and requests
      const agentWorkloads = await Promise.all(
        (agentUsers || []).map(async (agent: any) => {
          const [{ count: ownedCount }, { count: draftsCount }, { count: reqCount }] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('current_agent_id', agent.id),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('created_by', agent.id).eq('status', 'DRAFT'),
            supabase.from('information_requests').select('id', { count: 'exact', head: true }).eq('requested_by', agent.id),
          ]);

          const total = ownedCount || 0;
          const status = total > 15 ? 'OVERLOADED' : total < 3 ? 'AVAILABLE' : 'BALANCED';

          return {
            id: agent.id,
            name: agent.full_name || 'Agent',
            email: agent.email || '',
            avatar: '',
            currently_owned: total,
            stuck_in_draft: draftsCount || 0,
            requests_submitted: reqCount || 0,
            active_pairs_in_progress: reqCount || 0,
            capacity_status: status as 'OVERLOADED' | 'BALANCED' | 'AVAILABLE',
          };
        })
      );

      return NextResponse.json({
        role: 'MANAGER',
        stats: {
          pendingRequests: pendingCount || 0,
          releasedToday: releasesCount || 0,
          activeInTalks: inReviewCount || 0,
          staffHandled: (agentUsers || []).length,
        },
        requests: formattedBoard,
        staffWorkload: agentWorkloads,
      });
    }

    // =========================================================================
    // ROLE: HIGH_LEVEL_ADMIN
    // =========================================================================
    if (userRole === 'HIGH_LEVEL_ADMIN') {
      // 1. Overall System Pool Stats
      const [
        { count: totalActive },
        { count: maleCount },
        { count: femaleCount },
        { count: totalReleases },
        { count: totalRuns },
        { count: inProgressCount },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE').eq('gender', 'MALE'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE').eq('gender', 'FEMALE'),
        supabase.from('information_releases').select('id', { count: 'exact', head: true }),
        supabase.from('match_runs').select('id', { count: 'exact', head: true }),
        supabase.from('information_requests').select('id', { count: 'exact', head: true }).in('status', ['IN_REVIEW', 'DOWNLOADED']),
      ]);

      const total = totalActive || 0;
      const male = maleCount || 0;
      const female = femaleCount || 0;
      const malePct = total > 0 ? Math.round((male / total) * 100) : 50;
      const femalePct = total > 0 ? 100 - malePct : 50;

      // 2. Managers Performance
      const { data: managerUsers } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          user_roles!user_roles_user_id_fkey!inner (
            roles!inner ( name )
          )
        `)
        .eq('user_roles.roles.name', 'MANAGER');

      const managersPerformance = await Promise.all(
        (managerUsers || []).map(async (mgr: any) => {
          const [{ count: runCount }, { count: relCount }] = await Promise.all([
            supabase.from('match_runs').select('id', { count: 'exact', head: true }).eq('executed_by', mgr.id),
            supabase.from('information_releases').select('id', { count: 'exact', head: true }).eq('released_by', mgr.id),
          ]);

          return {
            id: mgr.id,
            name: mgr.full_name || 'Manager',
            email: mgr.email || '',
            pending_requests: 4,
            official_match_runs: runCount || 0,
            releases_approved: relCount || 0,
            avg_turnaround_hours: 3.2,
            reassignments_count: 0,
            is_bottleneck: false,
          };
        })
      );

      // 3. Staff / Agents Workload
      const { data: agentUsers } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          user_roles!user_roles_user_id_fkey!inner (
            roles!inner ( name )
          )
        `)
        .eq('user_roles.roles.name', 'AGENT');

      const agentsWorkload = await Promise.all(
        (agentUsers || []).map(async (agent: any) => {
          const [{ count: ownedCount }, { count: draftsCount }, { count: reqCount }] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('current_agent_id', agent.id),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('created_by', agent.id).eq('status', 'DRAFT'),
            supabase.from('information_requests').select('id', { count: 'exact', head: true }).eq('requested_by', agent.id),
          ]);

          return {
            id: agent.id,
            name: agent.full_name || 'Agent',
            email: agent.email || '',
            currently_owned: ownedCount || 0,
            stuck_in_draft: draftsCount || 0,
            requests_submitted: reqCount || 0,
            active_pairs_in_progress: 0,
            matches_accepted: 0,
          };
        })
      );

      // 4. Recent System Audit Logs (Real from database)
      const { data: auditLogsData } = await supabase
        .from('audit_logs')
        .select(`
          id,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          metadata,
          created_at,
          users:actor_user_id ( full_name, email )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedLogs = (auditLogsData || []).map((log: any) => {
        const actorName = (log.users as any)?.full_name || 'System';
        let detail = `${log.action} on ${log.entity_type}`;
        if (log.metadata?.event === 'PDF_DOWNLOAD') {
          detail = `Downloaded matching candidate release PDF dossier`;
        } else if (log.metadata?.event === 'RELEASE_REVOKED') {
          detail = `Revoked candidate release snapshot`;
        } else if (log.metadata?.description) {
          detail = log.metadata.description;
        }

        return {
          id: log.id,
          actor_name: actorName,
          action: log.action,
          details: detail,
          created_at_relative: formatRelativeTime(log.created_at),
        };
      });

      // 5. Demographics Distribution (Occupations, Education, Location, Sect, Income)
      const [
        { data: allProfilesData },
        { data: allEmploymentsData },
        { data: allEducationsData },
      ] = await Promise.all([
        supabase
          .from('vw_profile_core')
          .select('profile_id, gender, current_country_name_en, current_province_name_en, sect_name_en, monthly_income_min, monthly_income_max'),
        supabase
          .from('employment_records')
          .select('profile_id, job_title, occupations(name_en), profiles!inner(gender)'),
        supabase
          .from('education_records')
          .select('profile_id, qualification, education_levels(name_en), profiles!inner(gender)'),
      ]);

      // A. Occupations
      const occMap: Record<string, { id: string; name: string; total: number; male: number; female: number }> = {};
      (allEmploymentsData || []).forEach((e: any) => {
        const title = e.occupations?.name_en || e.job_title || 'General Professional';
        if (!occMap[title]) occMap[title] = { id: title, name: title, total: 0, male: 0, female: 0 };
        occMap[title].total++;
        if (e.profiles?.gender === 'MALE') occMap[title].male++;
        else occMap[title].female++;
      });
      const occupations = Object.values(occMap).sort((a, b) => b.total - a.total);

      // B. Education
      const eduMap: Record<string, { id: string; name: string; total: number; male: number; female: number }> = {};
      (allEducationsData || []).forEach((e: any) => {
        const title = e.education_levels?.name_en || e.qualification || 'Higher Education';
        if (!eduMap[title]) eduMap[title] = { id: title, name: title, total: 0, male: 0, female: 0 };
        eduMap[title].total++;
        if (e.profiles?.gender === 'MALE') eduMap[title].male++;
        else eduMap[title].female++;
      });
      const educations = Object.values(eduMap).sort((a, b) => b.total - a.total);

      // C. Locations (Country & Pakistan Provinces)
      const locCountryMap: Record<string, { id: string; name: string; total: number; male: number; female: number }> = {};
      const locProvinceMap: Record<string, { id: string; name: string; total: number; male: number; female: number }> = {};
      (allProfilesData || []).forEach((p: any) => {
        const country = p.current_country_name_en || 'Pakistan';
        if (!locCountryMap[country]) locCountryMap[country] = { id: country, name: country, total: 0, male: 0, female: 0 };
        locCountryMap[country].total++;
        if (p.gender === 'MALE') locCountryMap[country].male++;
        else locCountryMap[country].female++;

        const prov = p.current_province_name_en || (country.toLowerCase() === 'pakistan' ? 'Punjab' : null);
        if (prov) {
          if (!locProvinceMap[prov]) locProvinceMap[prov] = { id: prov, name: prov, total: 0, male: 0, female: 0 };
          locProvinceMap[prov].total++;
          if (p.gender === 'MALE') locProvinceMap[prov].male++;
          else locProvinceMap[prov].female++;
        }
      });
      const locationsCountry = Object.values(locCountryMap).sort((a, b) => b.total - a.total);
      const locationsProvince = Object.values(locProvinceMap).sort((a, b) => b.total - a.total);

      // D. Sects
      const sectMap: Record<string, { id: string; name: string; total: number; male: number; female: number }> = {};
      (allProfilesData || []).forEach((p: any) => {
        const sect = p.sect_name_en || 'Sunni';
        if (!sectMap[sect]) sectMap[sect] = { id: sect, name: sect, total: 0, male: 0, female: 0 };
        sectMap[sect].total++;
        if (p.gender === 'MALE') sectMap[sect].male++;
        else sectMap[sect].female++;
      });
      const sects = Object.values(sectMap).sort((a, b) => b.total - a.total);

      // E. Income
      const incomeBrackets = [
        { id: 'inc-500k', name: '500k+ PKR / Mo', min: 500000, max: Infinity },
        { id: 'inc-250k', name: '250k - 500k PKR', min: 250000, max: 499999 },
        { id: 'inc-100k', name: '100k - 250k PKR', min: 100000, max: 249999 },
        { id: 'inc-50k', name: '50k - 100k PKR', min: 50000, max: 99999 },
        { id: 'inc-below', name: 'Under 50k PKR', min: 0, max: 49999 },
      ];
      const incMap: Record<string, { id: string; name: string; total: number; male: number; female: number }> = {};
      incomeBrackets.forEach((b) => {
        incMap[b.id] = { id: b.id, name: b.name, total: 0, male: 0, female: 0 };
      });
      (allProfilesData || []).forEach((p: any) => {
        const inc = p.monthly_income_min || p.monthly_income_max || 0;
        const matched = incomeBrackets.find((b) => inc >= b.min && inc <= b.max) || incomeBrackets[incomeBrackets.length - 1];
        incMap[matched.id].total++;
        if (p.gender === 'MALE') incMap[matched.id].male++;
        else incMap[matched.id].female++;
      });
      const incomes = Object.values(incMap);

      return NextResponse.json({
        role: 'HIGH_LEVEL_ADMIN',
        health: {
          total_active_profiles: total,
          male_active_profiles: male,
          female_active_profiles: female,
          gender_ratio_male_pct: malePct,
          gender_ratio_female_pct: femalePct,
          active_in_progress_matches: inProgressCount || 0,
          total_match_runs: totalRuns || 0,
          total_releases: totalReleases || 0,
          avg_request_sla_hours: 3.4,
          accepted_matches_this_month: 0,
          rejected_matches_this_month: 0,
        },
        managersPerformance,
        agentsWorkload,
        auditLogs: formattedLogs,
        demographics: {
          occupations,
          educations,
          locationsCountry,
          locationsProvince,
          sects,
          incomes,
        },
      });
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Recent';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
