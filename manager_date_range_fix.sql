-- ============================================================================
-- NikaahKaro Manager Overview - Exact Asia/Karachi (UTC+5) Date Range Fix
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_manager_overview(
  p_days int default 7,
  p_sla_hours int default 24
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Exact calendar midnight (00:00:00 PKT) in Asia/Karachi timezone
  v_now_pkt timestamptz := now() at time zone 'Asia/Karachi';
  v_today_start_pkt timestamptz := date_trunc('day', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
  
  -- If p_days = 7: today + prior 6 days = exactly 7 full calendar days (no off-by-one day)
  v_since timestamptz := CASE 
    WHEN p_days > 0 THEN (date_trunc('day', now() at time zone 'Asia/Karachi') - make_interval(days => p_days - 1)) at time zone 'Asia/Karachi'
    ELSE '1970-01-01 00:00:00+00'::timestamptz
  END;

  -- Previous identical window for trend/delta comparison
  v_prev timestamptz := CASE
    WHEN p_days > 0 THEN (date_trunc('day', now() at time zone 'Asia/Karachi') - make_interval(days => (p_days * 2) - 1)) at time zone 'Asia/Karachi'
    ELSE NULL
  END;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role('MANAGER') OR public.has_role('HIGH_LEVEL_ADMIN')) THEN
    RAISE EXCEPTION 'Not authorized' USING errcode = '42501';
  END IF;

  RETURN (
  WITH
  reqs AS (
    SELECT id, status::text AS status, source_profile_id, requested_by, created_at, updated_at, reviewed_at
    FROM information_requests
  ),
  pending AS (
    SELECT DISTINCT ON (source_profile_id) *
    FROM reqs
    WHERE status IN ('PENDING', 'PENDING_OTHER')
    ORDER BY source_profile_id, created_at DESC
  ),
  queue AS (
    SELECT p.id AS request_id, p.source_profile_id AS profile_id, pi.full_name,
           CASE WHEN pi.date_of_birth IS NOT NULL THEN extract(year FROM age(pi.date_of_birth))::int END AS age,
           c.name_en AS city, cs.name_en AS caste, u.full_name AS agent_name,
           round(extract(epoch FROM now() - p.created_at) / 3600.0, 1) AS waiting_hours,
           CASE WHEN now() - p.created_at > make_interval(hours => p_sla_hours) THEN 'overdue'
                WHEN now() - p.created_at > make_interval(hours => p_sla_hours / 2) THEN 'warning'
                ELSE 'fresh' END AS sla_state,
           (SELECT count(*) FROM reqs r2 WHERE r2.source_profile_id = p.source_profile_id) > 1 AS is_repeat
    FROM pending p
    LEFT JOIN personal_information pi ON pi.profile_id = p.source_profile_id
    LEFT JOIN profile_locations pl ON pl.profile_id = p.source_profile_id
    LEFT JOIN cities c ON c.id = pl.current_city_id
    LEFT JOIN religion_information ri ON ri.profile_id = p.source_profile_id
    LEFT JOIN castes cs ON cs.id = ri.caste_id
    LEFT JOIN users u ON u.id = p.requested_by
    ORDER BY p.created_at ASC
    LIMIT 8
  ),
  workload AS (
    SELECT u.id, u.full_name,
      (SELECT count(*) FROM profiles p WHERE p.current_agent_id = u.id AND p.status::text = 'ACTIVE') AS active_profiles,
      (SELECT count(*) FROM profiles p WHERE (p.current_agent_id = u.id OR p.created_by = u.id) AND p.status::text = 'DRAFT') AS drafts,
      (SELECT count(*) FROM pending r WHERE r.requested_by = u.id) AS open_requests
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles ro ON ro.id = ur.role_id
    WHERE ro.name = 'AGENT' AND u.status::text = 'ACTIVE'
  ),
  stuck AS (
    SELECT ir.id AS release_id, ir.request_id, ir.released_at,
           extract(day FROM now() - ir.released_at)::int AS days_waiting,
           (SELECT full_name FROM personal_information WHERE profile_id = r.source_profile_id) AS source_name,
           (SELECT full_name FROM personal_information WHERE profile_id = ir.candidate_profile_id) AS candidate_name,
           (SELECT full_name FROM users WHERE id = r.requested_by) AS agent_name
    FROM information_releases ir
    JOIN reqs r ON r.id = ir.request_id
    WHERE ir.release_status::text = 'ACTIVE' AND r.status = 'IN_REVIEW'
      AND ir.released_at < now() - interval '48 hours'
    ORDER BY ir.released_at ASC
    LIMIT 8
  ),
  latest_runs AS (
    SELECT DISTINCT ON (source_profile_id) id, source_profile_id, executed_at
    FROM match_runs ORDER BY source_profile_id, executed_at DESC
  ),
  top_scores AS (
    SELECT r.final_score
    FROM match_run_results r
    JOIN latest_runs lr ON lr.id = r.match_run_id
    WHERE r.rank <= 5 
      AND r.final_score IS NOT NULL
      AND (p_days = 0 OR lr.executed_at >= v_since)
  ),
  low_match AS (
    SELECT lr.source_profile_id AS profile_id,
           (SELECT full_name FROM personal_information WHERE profile_id = lr.source_profile_id) AS full_name,
           lr.executed_at,
           (SELECT count(*) FROM match_run_results r WHERE r.match_run_id = lr.id) AS candidates
    FROM latest_runs lr
    JOIN profiles p ON p.id = lr.source_profile_id AND p.status::text = 'ACTIVE'
    WHERE (SELECT count(*) FROM match_run_results r WHERE r.match_run_id = lr.id) <= 3
    ORDER BY 4 ASC, lr.executed_at DESC
    LIMIT 6
  ),
  filtered_pipeline AS (
    SELECT request_status::text AS request_status, count(*) AS n
    FROM vw_manager_requests_board
    WHERE (p_days = 0 OR request_date >= v_since)
    GROUP BY 1
  ),
  recent_rel AS (
    SELECT ir.id AS release_id, ir.released_at,
           (SELECT full_name FROM personal_information WHERE profile_id = r.source_profile_id) AS source_name,
           (SELECT full_name FROM personal_information WHERE profile_id = ir.candidate_profile_id) AS candidate_name,
           (SELECT full_name FROM users WHERE id = r.requested_by) AS agent_name
    FROM information_releases ir
    JOIN reqs r ON r.id = ir.request_id
    WHERE ir.release_status::text = 'ACTIVE'
      AND (p_days = 0 OR ir.released_at >= v_since)
    ORDER BY ir.released_at DESC
    LIMIT 8
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'range_days', p_days,
    'sla_hours', p_sla_hours,
    'kpis', jsonb_build_object(
      'pending',                 (SELECT count(*) FROM pending),
      'released_awaiting_agent', (SELECT count(*) FROM reqs WHERE status = 'IN_REVIEW'),
      'downloaded',              (SELECT count(*) FROM reqs WHERE status = 'DOWNLOADED'),
      'oldest_waiting_hours',    (SELECT round(extract(epoch FROM now() - min(created_at)) / 3600.0, 1) FROM pending),
      'overdue',                 (SELECT count(*) FROM pending WHERE now() - created_at > make_interval(hours => p_sla_hours)),
      'completed_in_range',      (SELECT count(*) FROM reqs WHERE status IN ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM') AND (p_days = 0 OR updated_at >= v_since)),
      'releases_in_range',       (SELECT count(*) FROM information_releases WHERE release_status::text = 'ACTIVE' AND (p_days = 0 OR released_at >= v_since)),
      'releases_prev_range',     CASE WHEN v_prev IS NULL THEN NULL
                                      ELSE (SELECT count(*) FROM information_releases WHERE release_status::text = 'ACTIVE' AND released_at >= v_prev AND released_at < v_since) END,
      'runs_in_range',           (SELECT count(*) FROM match_runs WHERE (p_days = 0 OR executed_at >= v_since)),
      'avg_release_hours',       (SELECT round(avg(extract(epoch FROM reviewed_at - created_at)) / 3600.0, 1)
                                  FROM reqs WHERE reviewed_at IS NOT NULL AND (p_days = 0 OR reviewed_at >= v_since))
    ),
    'pipeline', (SELECT coalesce(jsonb_object_agg(request_status, n), '{}'::jsonb) FROM filtered_pipeline),
    'queue', coalesce((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.waiting_hours DESC) FROM queue q), '[]'::jsonb),
    'agent_workload', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'full_name', full_name, 'active_profiles', active_profiles,
               'drafts', drafts, 'open_requests', open_requests,
               'load', CASE WHEN active_profiles + drafts > 15 THEN 'OVERLOADED'
                            WHEN active_profiles + drafts > 8 THEN 'BALANCED' ELSE 'AVAILABLE' END)
               ORDER BY active_profiles + drafts DESC)
      FROM workload), '[]'::jsonb),
    'stuck_releases', coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM stuck s), '[]'::jsonb),
    'score_quality', jsonb_build_object(
      'excellent', coalesce((SELECT count(*) FROM top_scores WHERE final_score > 80), 0),
      'good',      coalesce((SELECT count(*) FROM top_scores WHERE final_score >= 65 AND final_score <= 80), 0),
      'borderline',coalesce((SELECT count(*) FROM top_scores WHERE final_score < 65), 0),
      'avg',       coalesce((SELECT round(avg(final_score), 1) FROM top_scores), 0)
    ),
    'low_match', coalesce((SELECT jsonb_agg(to_jsonb(l)) FROM low_match l), '[]'::jsonb),
    'recent_releases', coalesce((SELECT jsonb_agg(to_jsonb(rr)) FROM recent_rel rr), '[]'::jsonb)
  )
  );
END;
$$;

