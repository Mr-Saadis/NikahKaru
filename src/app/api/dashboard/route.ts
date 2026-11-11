import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get('role');
    const daysParam = searchParams.get('days');

    // 1. Authenticate user using signed-in user's server Supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Verified User Role from Database
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    const actualRole = ((roleData?.roles as any)?.name)?.toUpperCase() || 'AGENT';

    // Strictly enforce role boundaries: users cannot escalate privileges via ?role= query param
    let userRole = actualRole;
    if (requestedRole) {
      const reqUpper = requestedRole.toUpperCase();
      if (actualRole === 'HIGH_LEVEL_ADMIN' || (actualRole === 'MANAGER' && reqUpper === 'AGENT')) {
        userRole = reqUpper;
      }
    }

    const activityPeriod = searchParams.get('activity_period') || 'today';

    // Fast sub-endpoint for toggling activity period without reloading entire desk
    if (searchParams.get('activity_only') === 'true') {
      const act = await fetchAgentActivity(supabase, user.id, activityPeriod);
      return NextResponse.json({
        activity: act.data,
        error: act.error ? { message: act.error.message } : null,
      });
    }

    // =========================================================================
    // ROLE: AGENT / STAFF -> get_agent_overview() + fetchAgentActivity()
    // =========================================================================
    if (userRole === 'AGENT') {
      const [overviewRes, actRes] = await Promise.all([
        supabase.rpc('get_agent_overview', {}),
        fetchAgentActivity(supabase, user.id, activityPeriod),
      ]);

      if (overviewRes.error) {
        console.error('[API /api/dashboard] get_agent_overview RPC error:', {
          message: overviewRes.error.message,
          code: overviewRes.error.code,
          details: overviewRes.error.details,
          hint: overviewRes.error.hint,
        });
        return NextResponse.json({
          error: overviewRes.error.message,
          code: overviewRes.error.code,
          details: overviewRes.error.details || overviewRes.error.hint,
        }, { status: 500 });
      }

      let todayActivity = actRes.data;
      let todayActivityError = actRes.error ? {
        message: actRes.error.message || 'Failed to load activity',
      } : null;

      return NextResponse.json({
        role: 'AGENT',
        ...overviewRes.data,
        today_activity: todayActivity,
        today_activity_error: todayActivityError,
      });
    }

    // =========================================================================
    // ROLE: MANAGER -> get_manager_overview(p_days, p_sla_hours)
    // =========================================================================
    if (userRole === 'MANAGER') {
      const pDays = daysParam !== null && daysParam !== undefined ? parseInt(daysParam, 10) : 7;
      const pSlaHours = parseInt(searchParams.get('sla_hours') || '24', 10);
      const days = isNaN(pDays) ? 7 : pDays;

      // Exact Asia/Karachi (UTC+5) calendar day calculation (no off-by-one day errors)
      const now = new Date();
      const pktOffsetMinutes = 5 * 60; // Asia/Karachi UTC+5
      const nowPkt = new Date(now.getTime() + pktOffsetMinutes * 60 * 1000);
      const y = nowPkt.getUTCFullYear();
      const m = nowPkt.getUTCMonth();
      const d = nowPkt.getUTCDate();

      let sinceIso: string;
      let prevIso: string | null = null;

      if (days <= 0) {
        // All time
        sinceIso = '1970-01-01T00:00:00.000Z';
      } else {
        // Exact start of day (00:00:00 PKT) for (days - 1) days ago
        // E.g. for 7 days: today + prior 6 days = exactly 7 full calendar days
        const startPkt = new Date(Date.UTC(y, m, d - (days - 1), 0, 0, 0) - pktOffsetMinutes * 60 * 1000);
        const prevPkt = new Date(Date.UTC(y, m, d - (days * 2 - 1), 0, 0, 0) - pktOffsetMinutes * 60 * 1000);
        sinceIso = startPkt.toISOString();
        prevIso = prevPkt.toISOString();
      }

      const { data, error } = await supabase.rpc('get_manager_overview', {
        p_days: days,
        p_sla_hours: isNaN(pSlaHours) ? 24 : pSlaHours,
      });

      if (error) {
        console.error('[API /api/dashboard] get_manager_overview RPC error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return NextResponse.json({
          error: error.message,
          code: error.code,
          details: error.details || error.hint,
        }, { status: 500 });
      }

      const result = { ...data };

      // Ensure Request Pipeline counts accurately respect the selected period
      try {
        let pipeQuery = supabase
          .from('vw_manager_requests_board')
          .select('request_status');

        if (days > 0) {
          pipeQuery = pipeQuery.gte('request_date', sinceIso);
        }

        const { data: pipelineRows } = await pipeQuery;
        if (pipelineRows) {
          const pipeMap: Record<string, number> = {};
          pipelineRows.forEach((row: any) => {
            pipeMap[row.request_status] = (pipeMap[row.request_status] || 0) + 1;
          });
          result.pipeline = pipeMap;
        }
      } catch (pipeErr) {
        console.error('[API /api/dashboard] pipeline range filter error:', pipeErr);
      }

      // Deduplicate queue so each client profile appears strictly ONCE (no duplicate rows for the same client)
      if (Array.isArray(result.queue)) {
        const seenProfiles = new Set<string>();
        const uniqueQueue: any[] = [];
        for (const item of result.queue) {
          const pId = item.profile_id || item.source_profile_id || item.full_name;
          if (pId && !seenProfiles.has(pId)) {
            seenProfiles.add(pId);
            uniqueQueue.push(item);
          }
        }
        result.queue = uniqueQueue;

        // Ensure kpis.pending & overdue strictly mirror the unique pending clients in queue
        if (result.kpis) {
          result.kpis.pending = uniqueQueue.length;
          result.kpis.overdue = uniqueQueue.filter((q: any) => q.sla_state === 'overdue').length;
          if (uniqueQueue.length > 0) {
            result.kpis.oldest_waiting_hours = Math.max(...uniqueQueue.map((q: any) => q.waiting_hours || 0));
          }
        }
      }

      // Ensure KPI metrics accurately respect the exact Pakistan calendar day boundaries
      if (result.kpis) {
        try {
          // Completed in range
          let compQuery = supabase
            .from('information_requests')
            .select('*', { count: 'exact', head: true })
            .in('status', ['COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM']);
          if (days > 0) compQuery = compQuery.gte('updated_at', sinceIso);
          const { count: compCount } = await compQuery;
          if (compCount !== null && compCount !== undefined) {
            result.kpis.completed_in_range = compCount;
          }

          // Releases in range
          let relQuery = supabase
            .from('information_releases')
            .select('*', { count: 'exact', head: true })
            .eq('release_status', 'ACTIVE');
          if (days > 0) relQuery = relQuery.gte('released_at', sinceIso);
          const { count: relCount } = await relQuery;
          if (relCount !== null && relCount !== undefined) {
            result.kpis.releases_in_range = relCount;
          }

          // Releases prev range (for trend delta)
          if (prevIso && days > 0) {
            const { count: prevRelCount } = await supabase
              .from('information_releases')
              .select('*', { count: 'exact', head: true })
              .eq('release_status', 'ACTIVE')
              .gte('released_at', prevIso)
              .lt('released_at', sinceIso);
            if (prevRelCount !== null && prevRelCount !== undefined) {
              result.kpis.releases_prev_range = prevRelCount;
            }
          } else {
            result.kpis.releases_prev_range = null;
          }
        } catch (kpiErr) {
          console.error('[API /api/dashboard] kpi range calculation error:', kpiErr);
        }
      }

      // Ensure Score Quality accurately reflects top-5 candidates across manager match runs
      // User specification:
      // - For all profiles with match runs on manager side, evaluate top candidates up to rank 5 (rank <= 5)
      // - If a run only has 2 candidates, DO NOT pad the other 3 with 0; ignore them and average only actual matched candidates
      // - Buckets: >80% Excellent, 65-80% Good, <65% Borderline
      try {
        let runsQuery = supabase
          .from('match_runs')
          .select('id, source_profile_id, executed_at')
          .order('executed_at', { ascending: false });

        if (days > 0) {
          runsQuery = runsQuery.gte('executed_at', sinceIso);
        }

        let { data: runsData } = await runsQuery;

        // If no runs in the specific days filter, fallback to all-time latest runs so Score Quality is never blank or artificial
        if (!runsData || runsData.length === 0) {
          const { data: allRuns } = await supabase
            .from('match_runs')
            .select('id, source_profile_id, executed_at')
            .order('executed_at', { ascending: false });
          runsData = allRuns || [];
        }

        if (runsData && runsData.length > 0) {
          // Latest run per source profile
          const latestRunMap = new Map<string, string>();
          for (const r of runsData) {
            if (!latestRunMap.has(r.source_profile_id)) {
              latestRunMap.set(r.source_profile_id, r.id);
            }
          }
          const runIds = Array.from(latestRunMap.values());

          const { data: scoreResults } = await supabase
            .from('match_run_results')
            .select('final_score, rank')
            .in('match_run_id', runIds)
            .lte('rank', 5)
            .not('final_score', 'is', null);

          if (scoreResults && scoreResults.length > 0) {
            let exc = 0;
            let gd = 0;
            let bord = 0;
            let sum = 0;

            for (const item of scoreResults) {
              const sc = Number(item.final_score);
              sum += sc;
              if (sc > 80) {
                exc++;
              } else if (sc >= 65) {
                gd++;
              } else {
                bord++;
              }
            }

            result.score_quality = {
              excellent: exc,
              good: gd,
              borderline: bord,
              avg: Math.round((sum / scoreResults.length) * 10) / 10,
            };
          } else {
            result.score_quality = {
              excellent: 0,
              good: 0,
              borderline: 0,
              avg: 0,
            };
          }
        } else {
          result.score_quality = {
            excellent: 0,
            good: 0,
            borderline: 0,
            avg: 0,
          };
        }
      } catch (scoreErr) {
        console.error('[API /api/dashboard] score_quality calculation error:', scoreErr);
      }

      return NextResponse.json({
        role: 'MANAGER',
        ...result,
      });
    }

    // =========================================================================
    // ROLE: HIGH_LEVEL_ADMIN -> get_admin_overview(p_days)
    // =========================================================================
    if (userRole === 'HIGH_LEVEL_ADMIN') {
      const pDays = daysParam !== null && daysParam !== undefined ? parseInt(daysParam, 10) : 30;

      const { data, error } = await supabase.rpc('get_admin_overview', {
        p_days: isNaN(pDays) ? 30 : pDays,
      });

      if (error) {
        console.error('[API /api/dashboard] get_admin_overview RPC error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return NextResponse.json({
          error: error.message,
          code: error.code,
          details: error.details || error.hint,
        }, { status: 500 });
      }

      // Rule 13: Keep existing real DB audit logs query
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

      // Rule 14: Keep existing demographics query unchanged
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

      // C. Locations
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
        ...data,
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
    console.error('[API /api/dashboard] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

async function fetchAgentActivity(supabase: any, userId: string, period: string = 'today') {
  // 1. Try RPC with parameter
  const rpcRes = await supabase.rpc('get_agent_today_activity', { p_period: period });
  if (!rpcRes.error && rpcRes.data?.items?.some((i: any) => i.key === 'downloaded')) {
    return { data: rpcRes.data, error: null };
  }

  // 2. If RPC failed or lacks 'downloaded', calculate fallback
  try {
    const now = new Date();
    const pktOffset = 5 * 60; // Asia/Karachi UTC+5
    const nowPkt = new Date(now.getTime() + pktOffset * 60 * 1000);
    const y = nowPkt.getUTCFullYear();
    const m = nowPkt.getUTCMonth();
    const d = nowPkt.getUTCDate();

    let startIso: string;
    let endIso: string;
    let displayDayStart: string;

    if (period === 'yesterday') {
      const startPkt = new Date(Date.UTC(y, m, d - 1, 0, 0, 0) - pktOffset * 60 * 1000);
      const endPkt = new Date(Date.UTC(y, m, d, 0, 0, 0) - pktOffset * 60 * 1000);
      startIso = startPkt.toISOString();
      endIso = endPkt.toISOString();
      displayDayStart = startIso;
    } else if (period === 'all') {
      startIso = '1970-01-01T00:00:00.000Z';
      endIso = '2099-12-31T23:59:59.999Z';
      displayDayStart = now.toISOString();
    } else {
      // today
      const startPkt = new Date(Date.UTC(y, m, d, 0, 0, 0) - pktOffset * 60 * 1000);
      const endPkt = new Date(Date.UTC(y, m, d + 1, 0, 0, 0) - pktOffset * 60 * 1000);
      startIso = startPkt.toISOString();
      endIso = endPkt.toISOString();
      displayDayStart = startIso;
    }

    // Queries
    let profsAddedQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .neq('status', 'DRAFT');

    let draftsQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('status', 'DRAFT');

    let requestsQuery = supabase
      .from('information_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requested_by', userId);

    let respondedQuery = supabase
      .from('information_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requested_by', userId);

    let downloadedQuery = supabase
      .from('information_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requested_by', userId)
      .eq('status', 'DOWNLOADED');

    let completedQuery = supabase
      .from('information_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requested_by', userId)
      .in('status', ['COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM']);

    if (period !== 'all') {
      profsAddedQuery = profsAddedQuery.gte('created_at', startIso).lt('created_at', endIso);
      draftsQuery = draftsQuery.or(`created_at.gte.${startIso},updated_at.gte.${startIso}`).lt('created_at', endIso);
      requestsQuery = requestsQuery.gte('created_at', startIso).lt('created_at', endIso);
      respondedQuery = respondedQuery.gte('reviewed_at', startIso).lt('reviewed_at', endIso);
      downloadedQuery = downloadedQuery.gte('updated_at', startIso).lt('updated_at', endIso);
      completedQuery = completedQuery.gte('updated_at', startIso).lt('updated_at', endIso);
    }

    const [pAdded, dCreated, reqSent, resp, down, comp] = await Promise.all([
      profsAddedQuery,
      draftsQuery,
      requestsQuery,
      respondedQuery,
      downloadedQuery,
      completedQuery,
    ]);

    const cProfilesAdded = pAdded.count || 0;
    const cDraftsCreated = dCreated.count || 0;
    const cRequestsSent = reqSent.count || 0;
    const cSecondRequests = 0;
    const cResponded = resp.count || 0;
    const cDownloaded = down.count || 0;
    const cCompleted = comp.count || 0;
    const total =
      cProfilesAdded +
      cDraftsCreated +
      cRequestsSent +
      cSecondRequests +
      cResponded +
      cDownloaded +
      cCompleted;

    return {
      data: {
        period,
        day_start: displayDayStart,
        total,
        items: [
          { key: 'profiles_added', label: 'Profiles added', count: cProfilesAdded },
          { key: 'drafts_created', label: 'Drafts created', count: cDraftsCreated },
          { key: 'new_requests', label: 'Requests sent', count: cRequestsSent },
          { key: 'second_requests', label: 'Second requests', count: cSecondRequests },
          { key: 'responded', label: 'Manager responded', count: cResponded },
          { key: 'downloaded', label: 'Dossiers downloaded', count: cDownloaded },
          { key: 'completed', label: 'Completed', count: cCompleted },
        ],
      },
      error: null,
    };
  } catch (err: any) {
    return { data: rpcRes.data || null, error: rpcRes.error || err };
  }
}
