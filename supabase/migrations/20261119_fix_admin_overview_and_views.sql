-- ============================================================================
-- Migration: Fix Admin Overview RPC and Backwards Compatibility in Views
-- Date: 2026-11-19
-- Purpose:
--   1. Re-add backwards-compatible columns (preferred_country_id, preferred_province_id,
--      preferred_city_id, relocation_country_id, etc.) to v_current_matching_preferences
--      so existing views and RPCs never fail on missing columns.
--   2. Ensure vw_profile_active_preferences is fully created with is_excluded.
--   3. Update get_admin_overview() RPC to accurately count multi-location demand.
-- ============================================================================

BEGIN;

-- 1. DROP and RECREATE v_current_matching_preferences
DROP VIEW IF EXISTS public.v_current_matching_preferences CASCADE;

CREATE OR REPLACE VIEW public.v_current_matching_preferences AS
SELECT
    ps.id AS preference_set_id,
    ps.profile_id,
    ps.version,

    -- Basic Preferences
    bp.min_age,
    bp.max_age,
    bp.age_importance,
    bp.preferred_marital_status,
    bp.marital_status_importance,
    bp.children_allowed,
    bp.children_importance,
    bp.preferred_gender,
    bp.gender_importance,

    -- Physical Preferences
    pp.min_height_cm,
    pp.max_height_cm,
    pp.height_importance,
    pp.min_weight_kg,
    pp.max_weight_kg,
    pp.weight_importance,
    pp.preferred_complexion,
    pp.complexion_importance,
    pp.disability_allowed,
    pp.disability_importance,
    pp.beard_preference,
    pp.beard_importance,
    pp.hijab_preference,
    pp.hijab_importance,

    -- Education Preferences
    ep.minimum_education_level_id,
    ep.education_importance,
    ep.preferred_field_of_study,
    ep.field_importance,

    -- Profession Preferences
    prop.preferred_occupation_id,
    prop.occupation_importance,
    prop.preferred_employment_type,
    prop.employment_type_importance,
    prop.minimum_monthly_income,
    prop.maximum_monthly_income,
    prop.income_importance,

    -- Religion Preferences
    rp.religion_id AS preferred_religion_id,
    rp.religion_importance,
    rp.sect_id AS preferred_sect_id,
    rp.sect_importance,
    rp.caste_id AS preferred_caste_id,
    rp.caste_importance,
    rp.religious_practice AS preferred_religious_practice,
    rp.religious_practice_importance AS religion_practice_importance,

    -- Location Preferences (Backward compatible single columns + full multi-location array)
    (
        SELECT pl.country_id
        FROM public.preferred_locations pl
        WHERE pl.preference_set_id = ps.id
          AND (pl.is_excluded IS NULL OR pl.is_excluded = false)
        ORDER BY pl.id ASC
        LIMIT 1
    ) AS preferred_country_id,
    lp.country_importance,
    (
        SELECT pl.province_id
        FROM public.preferred_locations pl
        WHERE pl.preference_set_id = ps.id
          AND pl.province_id IS NOT NULL
          AND (pl.is_excluded IS NULL OR pl.is_excluded = false)
        ORDER BY pl.id ASC
        LIMIT 1
    ) AS preferred_province_id,
    lp.province_importance,
    (
        SELECT pl.city_id
        FROM public.preferred_locations pl
        WHERE pl.preference_set_id = ps.id
          AND pl.city_id IS NOT NULL
          AND (pl.is_excluded IS NULL OR pl.is_excluded = false)
        ORDER BY pl.id ASC
        LIMIT 1
    ) AS preferred_city_id,
    lp.city_importance,
    lp.location_details,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pl.id,
            'country_id', pl.country_id,
            'province_id', pl.province_id,
            'city_id', pl.city_id,
            'is_excluded', COALESCE(pl.is_excluded, false)
        )) FROM public.preferred_locations pl WHERE pl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_locations,

    -- Family Preferences
    fp.family_setup AS preferred_family_setup,
    fp.family_setup_importance,
    fp.living_with AS preferred_living_with,
    fp.living_with_importance,
    fp.parents_status_preference,
    fp.parents_status_importance,

    -- Lifestyle Preferences
    lsp.smoking AS preferred_smoking,
    lsp.smoking_importance,
    lsp.religious_practice AS preferred_lifestyle_religious_practice,
    lsp.religious_practice_importance AS lifestyle_religious_practice_importance,
    lsp.beard_preference AS preferred_lifestyle_beard,
    lsp.beard_importance AS lifestyle_beard_importance,
    lsp.hijab_preference AS preferred_lifestyle_hijab,
    lsp.hijab_importance AS lifestyle_hijab_importance,

    -- Relocation Preferences (Backward compatible single columns + full multi-relocation array)
    rlp.willing_to_relocate_required,
    rlp.relocation_importance,
    (
        SELECT prl.country_id
        FROM public.preferred_relocations prl
        WHERE prl.preference_set_id = ps.id
          AND (prl.is_excluded IS NULL OR prl.is_excluded = false)
        ORDER BY prl.id ASC
        LIMIT 1
    ) AS relocation_country_id,
    rlp.country_importance AS relocation_country_importance,
    (
        SELECT prl.province_id
        FROM public.preferred_relocations prl
        WHERE prl.preference_set_id = ps.id
          AND prl.province_id IS NOT NULL
          AND (prl.is_excluded IS NULL OR prl.is_excluded = false)
        ORDER BY prl.id ASC
        LIMIT 1
    ) AS relocation_province_id,
    rlp.province_importance AS relocation_province_importance,
    (
        SELECT prl.city_id
        FROM public.preferred_relocations prl
        WHERE prl.preference_set_id = ps.id
          AND prl.city_id IS NOT NULL
          AND (prl.is_excluded IS NULL OR prl.is_excluded = false)
        ORDER BY prl.id ASC
        LIMIT 1
    ) AS relocation_city_id,
    rlp.city_importance AS relocation_city_importance,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', prl.id,
            'country_id', prl.country_id,
            'province_id', prl.province_id,
            'city_id', prl.city_id,
            'is_excluded', COALESCE(prl.is_excluded, false)
        )) FROM public.preferred_relocations prl WHERE prl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_relocations

FROM public.preference_sets ps
LEFT JOIN public.basic_preferences bp ON bp.preference_set_id = ps.id
LEFT JOIN public.physical_preferences pp ON pp.preference_set_id = ps.id
LEFT JOIN public.education_preferences ep ON ep.preference_set_id = ps.id
LEFT JOIN public.profession_preferences prop ON prop.preference_set_id = ps.id
LEFT JOIN public.religion_preferences rp ON rp.preference_set_id = ps.id
LEFT JOIN public.location_preferences lp ON lp.preference_set_id = ps.id
LEFT JOIN public.family_preferences fp ON fp.preference_set_id = ps.id
LEFT JOIN public.lifestyle_preferences lsp ON lsp.preference_set_id = ps.id
LEFT JOIN public.relocation_preferences rlp ON rlp.preference_set_id = ps.id
WHERE ps.is_current = TRUE;

-- 2. RECREATE vw_profile_active_preferences
DROP VIEW IF EXISTS public.vw_profile_active_preferences CASCADE;

CREATE OR REPLACE VIEW public.vw_profile_active_preferences AS
SELECT
    ps.profile_id,
    ps.id AS preference_set_id,
    ps.version,
    ps.is_current,
    ps.created_by AS preference_created_by,
    ps.created_at AS preference_created_at,

    -- basic
    CASE WHEN bp.preference_set_id IS NOT NULL THEN row_to_json(bp.*) ELSE NULL END AS basic,

    -- physical
    CASE WHEN pp.preference_set_id IS NOT NULL THEN row_to_json(pp.*) ELSE NULL END AS physical,

    -- education
    CASE WHEN ep.preference_set_id IS NOT NULL THEN row_to_json(ep.*) ELSE NULL END AS education,

    -- profession
    CASE WHEN prop.preference_set_id IS NOT NULL THEN row_to_json(prop.*) ELSE NULL END AS profession,

    -- religion
    CASE WHEN rp.preference_set_id IS NOT NULL THEN row_to_json(rp.*) ELSE NULL END AS religion,

    -- location (importance + preferred_locations array with is_excluded)
    CASE WHEN lp.preference_set_id IS NOT NULL THEN
        json_build_object(
            'preference_set_id', lp.preference_set_id,
            'country_importance', lp.country_importance,
            'province_importance', lp.province_importance,
            'city_importance', lp.city_importance,
            'location_details', lp.location_details,
            'created_at', lp.created_at,
            'preferred_locations', COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', pl.id,
                    'country_id', pl.country_id,
                    'province_id', pl.province_id,
                    'city_id', pl.city_id,
                    'is_excluded', COALESCE(pl.is_excluded, false)
                )) FROM public.preferred_locations pl WHERE pl.preference_set_id = ps.id),
                '[]'::json
            )
        )
    ELSE NULL END AS location,

    -- family
    CASE WHEN fp.preference_set_id IS NOT NULL THEN row_to_json(fp.*) ELSE NULL END AS family,

    -- lifestyle
    CASE WHEN lsp.preference_set_id IS NOT NULL THEN row_to_json(lsp.*) ELSE NULL END AS lifestyle,

    -- relocation (importance + flag + preferred_relocations array with is_excluded)
    CASE WHEN rlp.preference_set_id IS NOT NULL THEN
        json_build_object(
            'preference_set_id', rlp.preference_set_id,
            'willing_to_relocate_required', rlp.willing_to_relocate_required,
            'relocation_importance', rlp.relocation_importance,
            'country_importance', rlp.country_importance,
            'province_importance', rlp.province_importance,
            'city_importance', rlp.city_importance,
            'created_at', rlp.created_at,
            'preferred_relocations', COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', prl.id,
                    'country_id', prl.country_id,
                    'province_id', prl.province_id,
                    'city_id', prl.city_id,
                    'is_excluded', COALESCE(prl.is_excluded, false)
                )) FROM public.preferred_relocations prl WHERE prl.preference_set_id = ps.id),
                '[]'::json
            )
        )
    ELSE NULL END AS relocation,

    -- Top-level arrays for direct queries
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pl.id,
            'country_id', pl.country_id,
            'province_id', pl.province_id,
            'city_id', pl.city_id,
            'is_excluded', COALESCE(pl.is_excluded, false)
        )) FROM public.preferred_locations pl WHERE pl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_locations,

    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', prl.id,
            'country_id', prl.country_id,
            'province_id', prl.province_id,
            'city_id', prl.city_id,
            'is_excluded', COALESCE(prl.is_excluded, false)
        )) FROM public.preferred_relocations prl WHERE prl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_relocations

FROM public.preference_sets ps
LEFT JOIN public.basic_preferences bp ON bp.preference_set_id = ps.id
LEFT JOIN public.physical_preferences pp ON pp.preference_set_id = ps.id
LEFT JOIN public.education_preferences ep ON ep.preference_set_id = ps.id
LEFT JOIN public.profession_preferences prop ON prop.preference_set_id = ps.id
LEFT JOIN public.religion_preferences rp ON rp.preference_set_id = ps.id
LEFT JOIN public.location_preferences lp ON lp.preference_set_id = ps.id
LEFT JOIN public.family_preferences fp ON fp.preference_set_id = ps.id
LEFT JOIN public.lifestyle_preferences lsp ON lsp.preference_set_id = ps.id
LEFT JOIN public.relocation_preferences rlp ON rlp.preference_set_id = ps.id
WHERE ps.is_current = TRUE;

-- 3. UPDATE get_admin_overview RPC
CREATE OR REPLACE FUNCTION public.get_admin_overview(p_days int default 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz := CASE WHEN p_days > 0 THEN now() - make_interval(days => p_days) ELSE 'epoch'::timestamptz END;
  v_prev  timestamptz := CASE WHEN p_days > 0 THEN now() - make_interval(days => p_days * 2) ELSE null END;
  v_sensitive text[] := array['phone','primary_phone','cnic','disability_details','permanent_city_id'];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role('HIGH_LEVEL_ADMIN') THEN
    RAISE EXCEPTION 'Not authorized' USING errcode = '42501';
  END IF;

  RETURN (
  WITH
  reqs AS (
    SELECT id, status::text AS status, source_profile_id, requested_by, reviewed_by, created_at, updated_at, reviewed_at
    FROM information_requests
  ),
  active_p AS (
    SELECT p.id, p.gender::text AS gender, pi.date_of_birth, pl.current_city_id
    FROM profiles p
    LEFT JOIN personal_information pi ON pi.profile_id = p.id
    LEFT JOIN profile_locations pl ON pl.profile_id = p.id
    WHERE p.status::text = 'ACTIVE'
  ),
  top_cities AS (
    SELECT current_city_id FROM active_p WHERE current_city_id IS NOT NULL
    GROUP BY 1 ORDER BY count(*) DESC LIMIT 8
  ),
  heat AS (
    SELECT c.name_en AS city,
           CASE WHEN a.age < 23 THEN '18-22' WHEN a.age < 28 THEN '23-27' WHEN a.age < 33 THEN '28-32'
                WHEN a.age < 38 THEN '33-37' ELSE '38+' END AS age_bucket,
           a.gender, count(*) AS n
    FROM (SELECT ap.*, extract(year from age(ap.date_of_birth))::int AS age FROM active_p ap
          WHERE ap.date_of_birth IS NOT NULL) a
    JOIN cities c ON c.id = a.current_city_id
    WHERE a.current_city_id IN (SELECT current_city_id FROM top_cities)
    GROUP BY 1, 2, 3
  ),
  demand AS (
    SELECT pl.city_id, p.gender::text AS g, count(distinct p.id) AS n
    FROM preferred_locations pl
    JOIN preference_sets ps ON ps.id = pl.preference_set_id AND ps.is_current = true
    JOIN location_preferences lp ON lp.preference_set_id = ps.id
    JOIN profiles p ON p.id = ps.profile_id
    WHERE p.status::text = 'ACTIVE' 
      AND lp.city_importance::text = 'MANDATORY' 
      AND pl.city_id IS NOT NULL
      AND (pl.is_excluded IS NULL OR pl.is_excluded = false)
    GROUP BY 1, 2
  ),
  supply AS (
    SELECT current_city_id AS city_id, gender AS g, count(*) AS n FROM active_p
    WHERE current_city_id IS NOT NULL GROUP BY 1, 2
  ),
  mandatory AS (
    SELECT t.criterion, count(*) AS n
    FROM v_current_matching_preferences v
    JOIN profiles p ON p.id = v.profile_id AND p.status::text = 'ACTIVE'
    CROSS JOIN LATERAL (values
      ('Age', v.age_importance::text), ('Marital status', v.marital_status_importance::text),
      ('Children', v.children_importance::text), ('Height', v.height_importance::text),
      ('Weight', v.weight_importance::text), ('Complexion', v.complexion_importance::text),
      ('Disability', v.disability_importance::text), ('Education', v.education_importance::text),
      ('Occupation', v.occupation_importance::text), ('Employment type', v.employment_type_importance::text),
      ('Income', v.income_importance::text), ('Religion', v.religion_importance::text),
      ('Sect', v.sect_importance::text), ('Caste', v.caste_importance::text),
      ('Religious practice', v.religion_practice_importance::text), ('Country', v.country_importance::text),
      ('Province', v.province_importance::text), ('City', v.city_importance::text),
      ('Family setup', v.family_setup_importance::text), ('Living with', v.living_with_importance::text),
      ('Smoking', v.smoking_importance::text), ('Relocation', v.relocation_importance::text)
    ) AS t(criterion, imp)
    WHERE t.imp = 'MANDATORY'
    GROUP BY t.criterion
  ),
  latest_runs AS (
    SELECT DISTINCT ON (source_profile_id) id, source_profile_id, executed_at
    FROM match_runs ORDER BY source_profile_id, executed_at DESC
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
  trend AS (
    SELECT d::date AS week,
      (SELECT count(*) FROM profiles p WHERE date_trunc('week', p.created_at) = d) AS profiles,
      (SELECT count(*) FROM information_requests r WHERE date_trunc('week', r.created_at) = d) AS requests
    FROM generate_series(date_trunc('week', greatest(v_since, now() - interval '52 weeks')),
                         date_trunc('week', now()), interval '1 week') d
  )
  SELECT jsonb_build_object(
    'generated_at', now(), 'range_days', p_days,
    'kpis', jsonb_build_object(
      'total_profiles',  (SELECT count(*) FROM profiles),
      'active_profiles', (SELECT count(*) FROM profiles WHERE status::text = 'ACTIVE'),
      'draft_profiles',  (SELECT count(*) FROM profiles WHERE status::text = 'DRAFT'),
      'paused_profiles', (SELECT count(*) FROM profiles WHERE status::text = 'PAUSED'),
      'male_active',     (SELECT count(*) FROM profiles WHERE status::text = 'ACTIVE' AND gender::text = 'MALE'),
      'female_active',   (SELECT count(*) FROM profiles WHERE status::text = 'ACTIVE' AND gender::text = 'FEMALE'),
      'requests_in_range', (SELECT count(*) FROM reqs WHERE created_at >= v_since),
      'requests_prev_range', CASE WHEN v_prev IS NULL THEN NULL
                                  ELSE (SELECT count(*) FROM reqs WHERE created_at >= v_prev AND created_at < v_since) END,
      'pending_requests', (SELECT count(*) FROM reqs WHERE status IN ('PENDING','PENDING_OTHER')),
      'overdue_requests', (SELECT count(*) FROM reqs WHERE status IN ('PENDING','PENDING_OTHER')
                                                          AND now() - created_at > interval '24 hours'),
      'runs_in_range',   (SELECT count(*) FROM match_runs WHERE executed_at >= v_since),
      'releases_in_range', (SELECT count(*) FROM information_releases WHERE released_at >= v_since),
      'completed_in_range', (SELECT count(*) FROM reqs WHERE status IN ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM') AND updated_at >= v_since),
      'avg_release_hours', (SELECT round(avg(extract(epoch from reviewed_at - created_at)) / 3600.0, 1)
                            FROM reqs WHERE reviewed_at IS NOT NULL AND reviewed_at >= v_since)
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('stage', 'Registered', 'n', (SELECT count(*) FROM profiles)),
      jsonb_build_object('stage', 'Active',     'n', (SELECT count(*) FROM profiles WHERE status::text = 'ACTIVE')),
      jsonb_build_object('stage', 'Requested',  'n', (SELECT count(distinct source_profile_id) FROM reqs)),
      jsonb_build_object('stage', 'Matched',    'n', (SELECT count(distinct source_profile_id) FROM match_runs)),
      jsonb_build_object('stage', 'Released',   'n', (SELECT count(distinct r.source_profile_id)
                                                      FROM information_releases ir JOIN reqs r ON r.id = ir.request_id)),
      jsonb_build_object('stage', 'Shared',     'n', (SELECT count(distinct source_profile_id) FROM reqs
                                                      WHERE status IN ('DOWNLOADED','COMPLETED','COMPLETED_OUTSIDE_SYSTEM'))),
      jsonb_build_object('stage', 'Completed',  'n', (SELECT count(distinct source_profile_id) FROM reqs
                                                      WHERE status IN ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM')))
    ),
    'profile_status', (SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                       FROM (SELECT status::text AS status, count(*) AS n FROM profiles GROUP BY 1) t),
    'trend', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.week) FROM trend t), '[]'::jsonb),
    'pool_heatmap', coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM heat h), '[]'::jsonb),
    'demand_vs_supply', coalesce((
      SELECT jsonb_agg(jsonb_build_object('city', c.name_en,
        'demand_from_males',   coalesce((SELECT n FROM demand WHERE city_id = c.id AND g = 'MALE'), 0),
        'females_available',   coalesce((SELECT n FROM supply WHERE city_id = c.id AND g = 'FEMALE'), 0),
        'demand_from_females', coalesce((SELECT n FROM demand WHERE city_id = c.id AND g = 'FEMALE'), 0),
        'males_available',     coalesce((SELECT n FROM supply WHERE city_id = c.id AND g = 'MALE'), 0)))
      FROM cities c
      WHERE c.id IN (SELECT city_id FROM (SELECT city_id FROM demand GROUP BY 1 ORDER BY sum(n) DESC LIMIT 6) x)
    ), '[]'::jsonb),
    'mandatory_criteria', coalesce((SELECT jsonb_agg(jsonb_build_object('criterion', criterion, 'n', n) ORDER BY n DESC)
                                    FROM mandatory), '[]'::jsonb),
    'managers', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', u.id, 'full_name', u.full_name,
        'pending_queue', (SELECT count(*) FROM reqs WHERE status IN ('PENDING','PENDING_OTHER')),
        'releases_approved', (SELECT count(*) FROM information_releases ir WHERE ir.released_by = u.id AND ir.released_at >= v_since),
        'runs', (SELECT count(*) FROM match_runs m WHERE m.executed_by = u.id AND m.executed_at >= v_since),
        'avg_release_hours', (SELECT round(avg(extract(epoch from r.reviewed_at - r.created_at)) / 3600.0, 1)
                              FROM reqs r WHERE r.reviewed_by = u.id AND r.reviewed_at >= v_since)))
      FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles ro ON ro.id = ur.role_id
      WHERE ro.name = 'MANAGER' AND u.status::text = 'ACTIVE'), '[]'::jsonb),
    'agents', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', u.id, 'full_name', u.full_name,
        'active_profiles', (SELECT count(*) FROM profiles p WHERE p.current_agent_id = u.id AND p.status::text = 'ACTIVE'),
        'drafts', (SELECT count(*) FROM profiles p WHERE (p.current_agent_id = u.id OR p.created_by = u.id) AND p.status::text = 'DRAFT'),
        'profiles_created', (SELECT count(*) FROM profiles p WHERE p.created_by = u.id AND p.created_at >= v_since),
        'requests', (SELECT count(*) FROM reqs r WHERE r.requested_by = u.id AND r.created_at >= v_since),
        'completed', (SELECT count(*) FROM reqs r WHERE r.requested_by = u.id
                      AND r.status IN ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM') AND r.updated_at >= v_since)))
      FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles ro ON ro.id = ur.role_id
      WHERE ro.name = 'AGENT' AND u.status::text = 'ACTIVE'), '[]'::jsonb),
    'low_match', coalesce((SELECT jsonb_agg(to_jsonb(l)) FROM low_match l), '[]'::jsonb),
    'score_distribution', jsonb_build_object(
      'excellent', (SELECT count(*) FROM match_run_results WHERE rank = 1 AND final_score >= 85),
      'good',      (SELECT count(*) FROM match_run_results WHERE rank = 1 AND final_score >= 70 AND final_score < 85),
      'borderline',(SELECT count(*) FROM match_run_results WHERE rank = 1 AND final_score < 70)),
    'fields_released', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'field', field_path,
               'n', n,
               'sensitive', (
                 field_path = any(v_sensitive) or
                 CASE WHEN position('.' in field_path) > 0 THEN split_part(field_path, '.', 2) ELSE field_path END = any(v_sensitive)
               )
             ) ORDER BY n DESC)
      FROM (SELECT f.field_path, count(*) AS n
            FROM information_release_fields f JOIN information_releases ir ON ir.id = f.release_id
            WHERE ir.released_at >= v_since GROUP BY 1 ORDER BY 2 DESC LIMIT 12) t), '[]'::jsonb),
    'users', jsonb_build_object(
      'by_role', coalesce((SELECT jsonb_agg(jsonb_build_object('role', role, 'status', status, 'n', n))
                           FROM (SELECT ro.name AS role, u.status::text AS status, count(*) AS n
                                 FROM users u JOIN user_roles ur ON ur.user_id = u.id
                                 JOIN roles ro ON ro.id = ur.role_id GROUP BY 1, 2) t), '[]'::jsonb),
      'agents_inactive_7d', (SELECT count(*) FROM users u
                             JOIN user_roles ur ON ur.user_id = u.id JOIN roles ro ON ro.id = ur.role_id
                             LEFT JOIN auth.users au ON au.id = u.id
                             WHERE ro.name = 'AGENT' AND u.status::text = 'ACTIVE'
                               AND (au.last_sign_in_at IS NULL OR au.last_sign_in_at < now() - interval '7 days'))
    ),
    'data_quality', jsonb_build_object(
      'active_without_preferences', (SELECT count(*) FROM profiles p WHERE p.status::text = 'ACTIVE'
          AND NOT EXISTS (SELECT 1 FROM preference_sets ps WHERE ps.profile_id = p.id AND ps.is_current)),
      'stale_drafts_14d', (SELECT count(*) FROM profiles WHERE status::text = 'DRAFT' AND updated_at < now() - interval '14 days'),
      'active_without_agent', (SELECT count(*) FROM profiles WHERE status::text = 'ACTIVE' AND current_agent_id IS NULL),
      'top_other_caste', coalesce((SELECT jsonb_agg(jsonb_build_object('value', v, 'n', n) ORDER BY n DESC)
          FROM (SELECT lower(trim(other_caste_text)) AS v, count(*) AS n FROM religion_information
                WHERE other_caste_text IS NOT NULL AND trim(other_caste_text) <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 5) t), '[]'::jsonb)
    ),
    'rejections', jsonb_build_object(
      'tracking_active', EXISTS(SELECT 1 FROM match_feedback),
      'top_reasons', coalesce((SELECT jsonb_agg(jsonb_build_object('reason', reason, 'n', n) ORDER BY n DESC)
          FROM (SELECT rr.name_en AS reason, count(*) AS n
                FROM match_feedback f JOIN rejection_reasons rr ON rr.id = f.rejection_reason_id
                WHERE f.created_at >= v_since GROUP BY 1 ORDER BY 2 DESC LIMIT 6) t), '[]'::jsonb)
    ),
    'algorithm', jsonb_build_object(
      'versions', coalesce((SELECT jsonb_agg(jsonb_build_object('version', algorithm_version, 'runs', n))
                            FROM (SELECT algorithm_version, count(*) AS n FROM match_runs GROUP BY 1) t), '[]'::jsonb)),
    'tracking', jsonb_build_object('matches_rows', (SELECT count(*) FROM matches),
                                   'feedback_rows', (SELECT count(*) FROM match_feedback))
  )
  );
END;
$$;

-- 4. Permissions & PostgREST Reload
REVOKE ALL ON FUNCTION public.get_admin_overview(int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview(int) TO authenticated, service_role;

GRANT SELECT ON public.v_current_matching_preferences TO authenticated, anon;
GRANT SELECT ON public.vw_profile_active_preferences TO authenticated, anon;

COMMIT;

NOTIFY pgrst, 'reload schema';
