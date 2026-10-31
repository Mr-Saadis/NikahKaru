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
    // ROLE: AGENT / STAFF -> get_agent_overview() + get_agent_today_activity()
    // =========================================================================
    if (userRole === 'AGENT') {
      const [overviewRes, todayRes] = await Promise.all([
        supabase.rpc('get_agent_overview', {}),
        supabase.rpc('get_agent_today_activity', {}),
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

      let todayActivity = null;
      let todayActivityError = null;

      if (todayRes.error) {
        console.error('[API /api/dashboard] get_agent_today_activity RPC error:', {
          message: todayRes.error.message,
          code: todayRes.error.code,
          details: todayRes.error.details,
          hint: todayRes.error.hint,
        });
        todayActivityError = {
          message: todayRes.error.message,
          code: todayRes.error.code,
          details: todayRes.error.details || todayRes.error.hint,
        };
      } else {
        todayActivity = todayRes.data;
      }

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

      const { data, error } = await supabase.rpc('get_manager_overview', {
        p_days: isNaN(pDays) ? 7 : pDays,
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

      return NextResponse.json({
        role: 'MANAGER',
        ...data,
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
