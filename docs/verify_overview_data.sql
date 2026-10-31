-- ============================================================================
-- NikaahKaro: Independent SQL Verification Script for Overview Dashboards
-- File: docs/verify_overview_data.sql
-- 
-- READ-ONLY queries to verify UI metrics and lists against real tables without calling RPCs.
-- Run in Supabase SQL editor to cross-examine what is displayed on the screen.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARAMETERS (Set your test Agent ID here for Agent Desk queries)
-- Replace the UUID below with a real agent user id:
-- ----------------------------------------------------------------------------
-- \set agent_id '00000000-0000-0000-0000-000000000000'
-- In SQL editor, you can substitute 'YOUR_AGENT_UUID_HERE' directly in the CTE below:

WITH params AS (
    SELECT 'YOUR_AGENT_UUID_HERE'::uuid AS agent_id,
           7::int AS manager_days,
           30::int AS admin_days,
           24::int AS sla_hours
)

-- ============================================================================
-- 1. AGENT / STAFF DESK VERIFICATION
-- ============================================================================

-- UI Label: "Assigned Profiles" (Active profiles assigned to or created by agent)
SELECT 'Agent KPI: Assigned Profiles' AS metric, COUNT(*) AS expected_value
FROM profiles p, params
WHERE (p.created_by = params.agent_id OR p.current_agent_id = params.agent_id)
  AND p.status::text = 'ACTIVE';

-- UI Label: "Drafts Pending" (Incomplete registrations)
SELECT 'Agent KPI: Drafts Pending' AS metric, COUNT(*) AS expected_value
FROM profiles p, params
WHERE (p.created_by = params.agent_id OR p.current_agent_id = params.agent_id)
  AND p.status::text = 'DRAFT';

-- UI Label: "Released for Client" (Active released candidate snapshots)
SELECT 'Agent KPI: Released for Client' AS metric, COUNT(*) AS expected_value
FROM information_releases ir
JOIN information_requests r ON r.id = ir.request_id, params
WHERE ir.release_status::text = 'ACTIVE'
  AND (r.requested_by = params.agent_id
       OR EXISTS (SELECT 1 FROM information_request_assignments a
                  WHERE a.request_id = r.id AND a.assigned_to = params.agent_id AND a.status::text = 'ACTIVE'));

-- UI Label: "Shared with Family" (Downloaded requests)
SELECT 'Agent KPI: Shared with Family' AS metric, COUNT(*) AS expected_value
FROM information_requests r, params
WHERE r.status::text = 'DOWNLOADED'
  AND (r.requested_by = params.agent_id
       OR EXISTS (SELECT 1 FROM information_request_assignments a
                  WHERE a.request_id = r.id AND a.assigned_to = params.agent_id AND a.status::text = 'ACTIVE'));

-- UI Label: "Open Requests" (With Manager)
SELECT 'Agent KPI: Open Requests' AS metric, COUNT(*) AS expected_value
FROM information_requests r, params
WHERE r.status::text IN ('PENDING', 'PENDING_OTHER')
  AND (r.requested_by = params.agent_id
       OR EXISTS (SELECT 1 FROM information_request_assignments a
                  WHERE a.request_id = r.id AND a.assigned_to = params.agent_id AND a.status::text = 'ACTIVE'));

-- UI Label: "Awaiting Download" (Ready in review)
SELECT 'Agent KPI: Awaiting Download' AS metric, COUNT(*) AS expected_value
FROM information_requests r, params
WHERE r.status::text = 'IN_REVIEW'
  AND (r.requested_by = params.agent_id
       OR EXISTS (SELECT 1 FROM information_request_assignments a
                  WHERE a.request_id = r.id AND a.assigned_to = params.agent_id AND a.status::text = 'ACTIVE'));

-- UI Label: "Active Client Discussions"
SELECT 'Agent Tracking: Active Discussions' AS metric, COUNT(*) AS expected_value
FROM matches m
JOIN profiles p ON p.id IN (m.male_profile_id, m.female_profile_id), params
WHERE m.status::text = 'IN_PROGRESS'
  AND (p.created_by = params.agent_id OR p.current_agent_id = params.agent_id);

-- UI Section: "My Profiles" Top 5
SELECT p.id,
       COALESCE(pi.full_name, '-') AS full_name,
       p.gender::text AS gender,
       p.status::text AS status,
       EXISTS(SELECT 1 FROM preference_sets ps WHERE ps.profile_id = p.id AND ps.is_current) AS has_preferences,
       p.updated_at
FROM profiles p
LEFT JOIN personal_information pi ON pi.profile_id = p.id, params
WHERE (p.created_by = params.agent_id OR p.current_agent_id = params.agent_id)
ORDER BY p.updated_at DESC
LIMIT 5;

-- UI Section: "Drafts" Top 5
SELECT p.id,
       COALESCE(pi.full_name, 'Incomplete Profile') AS full_name,
       p.gender::text AS gender,
       p.updated_at
FROM profiles p
LEFT JOIN personal_information pi ON pi.profile_id = p.id, params
WHERE (p.created_by = params.agent_id OR p.current_agent_id = params.agent_id)
  AND p.status::text = 'DRAFT'
ORDER BY p.updated_at DESC
LIMIT 5;


-- ============================================================================
-- 2. OPERATIONS MANAGER CONTROL ROOM VERIFICATION
-- ============================================================================

-- UI Label: "Pending Queue"
SELECT 'Manager KPI: Pending Queue' AS metric, COUNT(*) AS expected_value
FROM information_requests
WHERE status::text IN ('PENDING', 'PENDING_OTHER');

-- UI Label: "Oldest Waiting" (in hours)
SELECT 'Manager KPI: Oldest Waiting (hours)' AS metric,
       ROUND(EXTRACT(EPOCH FROM NOW() - MIN(created_at)) / 3600.0, 1) AS expected_value
FROM information_requests
WHERE status::text IN ('PENDING', 'PENDING_OTHER');

-- UI Label: "Overdue (>24h)"
SELECT 'Manager KPI: Overdue' AS metric, COUNT(*) AS expected_value
FROM information_requests, params
WHERE status::text IN ('PENDING', 'PENDING_OTHER')
  AND NOW() - created_at > MAKE_INTERVAL(hours => params.sla_hours);

-- UI Label: "Released Awaiting Agent"
SELECT 'Manager KPI: Released Awaiting Agent' AS metric, COUNT(*) AS expected_value
FROM information_requests
WHERE status::text = 'IN_REVIEW';

-- UI Label: "Completed in Range" (default 7 days)
SELECT 'Manager KPI: Completed (7d)' AS metric, COUNT(*) AS expected_value
FROM information_requests, params
WHERE status::text IN ('COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM')
  AND updated_at >= NOW() - MAKE_INTERVAL(days => params.manager_days);

-- UI Label: "Releases in Range" (default 7 days)
SELECT 'Manager KPI: Releases (7d)' AS metric, COUNT(*) AS expected_value
FROM information_releases, params
WHERE released_at >= NOW() - MAKE_INTERVAL(days => params.manager_days);

-- UI Label: "Releases in Previous Range" (7d to 14d)
SELECT 'Manager KPI: Releases Prev Period (7d-14d)' AS metric, COUNT(*) AS expected_value
FROM information_releases, params
WHERE released_at >= NOW() - MAKE_INTERVAL(days => params.manager_days * 2)
  AND released_at < NOW() - MAKE_INTERVAL(days => params.manager_days);

-- UI Section: "Waiting Queue" Top 5
SELECT r.id AS request_id,
       pi.full_name,
       c.name_en AS city,
       cs.name_en AS caste,
       u.full_name AS requested_by_agent,
       ROUND(EXTRACT(EPOCH FROM NOW() - r.created_at) / 3600.0, 1) AS waiting_hours,
       CASE WHEN NOW() - r.created_at > INTERVAL '24 hours' THEN 'overdue'
            WHEN NOW() - r.created_at > INTERVAL '12 hours' THEN 'warning'
            ELSE 'fresh' END AS sla_state
FROM information_requests r
LEFT JOIN personal_information pi ON pi.profile_id = r.source_profile_id
LEFT JOIN profile_locations pl ON pl.profile_id = r.source_profile_id
LEFT JOIN cities c ON c.id = pl.current_city_id
LEFT JOIN religion_information ri ON ri.profile_id = r.source_profile_id
LEFT JOIN castes cs ON cs.id = ri.caste_id
LEFT JOIN users u ON u.id = r.requested_by
WHERE r.status::text IN ('PENDING', 'PENDING_OTHER')
ORDER BY r.created_at ASC
LIMIT 5;

-- UI Section: "Stuck Releases" (>7d awaiting agent download)
SELECT ir.id AS release_id,
       ir.released_at,
       EXTRACT(DAY FROM NOW() - ir.released_at)::int AS days_waiting,
       pi_src.full_name AS source_name,
       pi_cand.full_name AS candidate_name,
       u.full_name AS agent_name
FROM information_releases ir
JOIN information_requests r ON r.id = ir.request_id
LEFT JOIN personal_information pi_src ON pi_src.profile_id = r.source_profile_id
LEFT JOIN personal_information pi_cand ON pi_cand.profile_id = ir.candidate_profile_id
LEFT JOIN users u ON u.id = r.requested_by
WHERE ir.release_status::text = 'ACTIVE'
  AND r.status::text = 'IN_REVIEW'
  AND ir.released_at < NOW() - INTERVAL '7 days'
ORDER BY ir.released_at ASC
LIMIT 5;

-- UI Section: "Hot Candidates" (Released in 2+ requests)
SELECT ir.candidate_profile_id,
       COUNT(DISTINCT ir.request_id) AS requests_count,
       pi.full_name AS candidate_name
FROM information_releases ir
LEFT JOIN personal_information pi ON pi.profile_id = ir.candidate_profile_id
WHERE ir.release_status::text = 'ACTIVE'
GROUP BY ir.candidate_profile_id, pi.full_name
HAVING COUNT(DISTINCT ir.request_id) >= 2
ORDER BY 2 DESC
LIMIT 5;

-- UI Section: "Orphaned Profiles" (Active profiles with no active agent)
SELECT COUNT(*) AS orphaned_count
FROM profiles p
LEFT JOIN users u ON u.id = p.current_agent_id
WHERE p.status::text = 'ACTIVE' AND (p.current_agent_id IS NULL OR u.status::text <> 'ACTIVE');


-- ============================================================================
-- 3. HIGH-LEVEL ADMIN EXECUTIVE REPORT VERIFICATION
-- ============================================================================

-- UI Label: "Active Profiles" (Overall system active)
SELECT 'Admin KPI: Active Profiles' AS metric, COUNT(*) AS expected_value
FROM profiles WHERE status::text = 'ACTIVE';

-- UI Label: "Draft Profiles"
SELECT 'Admin KPI: Draft Profiles' AS metric, COUNT(*) AS expected_value
FROM profiles WHERE status::text = 'DRAFT';

-- UI Label: "Paused Profiles"
SELECT 'Admin KPI: Paused Profiles' AS metric, COUNT(*) AS expected_value
FROM profiles WHERE status::text = 'PAUSED';

-- UI Label: "Active Ratio: Male vs Female"
SELECT 'Admin Pool: Male Active' AS metric, COUNT(*) AS expected_value
FROM profiles WHERE status::text = 'ACTIVE' AND gender::text = 'MALE'
UNION ALL
SELECT 'Admin Pool: Female Active' AS metric, COUNT(*) AS expected_value
FROM profiles WHERE status::text = 'ACTIVE' AND gender::text = 'FEMALE';

-- UI Label: "Pending Requests" (System-wide)
SELECT 'Admin KPI: Pending Requests' AS metric, COUNT(*) AS expected_value
FROM information_requests WHERE status::text IN ('PENDING', 'PENDING_OTHER');

-- UI Label: "Overdue Requests (>24h)"
SELECT 'Admin KPI: Overdue Requests' AS metric, COUNT(*) AS expected_value
FROM information_requests
WHERE status::text IN ('PENDING', 'PENDING_OTHER')
  AND NOW() - created_at > INTERVAL '24 hours';

-- UI Section: "Conversion Funnel" (By distinct profile)
SELECT '1. Registered' AS stage, COUNT(*) AS n FROM profiles
UNION ALL
SELECT '2. Active', COUNT(*) FROM profiles WHERE status::text = 'ACTIVE'
UNION ALL
SELECT '3. Requested', COUNT(DISTINCT source_profile_id) FROM information_requests
UNION ALL
SELECT '4. Matched', COUNT(DISTINCT source_profile_id) FROM match_runs
UNION ALL
SELECT '5. Released', COUNT(DISTINCT r.source_profile_id)
FROM information_releases ir JOIN information_requests r ON r.id = ir.request_id
UNION ALL
SELECT '6. Shared', COUNT(DISTINCT source_profile_id) FROM information_requests
WHERE status::text IN ('DOWNLOADED', 'COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM')
UNION ALL
SELECT '7. Completed', COUNT(DISTINCT source_profile_id) FROM information_requests
WHERE status::text IN ('COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM');

-- UI Section: "Data Quality Counters"
SELECT 'Active without preferences' AS check_name, COUNT(*) AS count
FROM profiles p
WHERE p.status::text = 'ACTIVE'
  AND NOT EXISTS (SELECT 1 FROM preference_sets ps WHERE ps.profile_id = p.id AND ps.is_current)
UNION ALL
SELECT 'Stale drafts (>14d)', COUNT(*)
FROM profiles WHERE status::text = 'DRAFT' AND updated_at < NOW() - INTERVAL '14 days'
UNION ALL
SELECT 'Active without assigned agent', COUNT(*)
FROM profiles WHERE status::text = 'ACTIVE' AND current_agent_id IS NULL;


-- ============================================================================
-- 4. SIDE-BY-SIDE RPC VS PLAIN SQL COMPARISON
-- ============================================================================

-- Compare Admin Overview Totals
WITH rpc_res AS (
    SELECT public.get_admin_overview(30) AS doc
),
plain_sql AS (
    SELECT 
        (SELECT COUNT(*) FROM profiles WHERE status::text = 'ACTIVE') AS active_profiles,
        (SELECT COUNT(*) FROM information_requests WHERE status::text IN ('PENDING','PENDING_OTHER')) AS pending_requests,
        (SELECT COUNT(*) FROM match_runs WHERE executed_at >= NOW() - INTERVAL '30 days') AS runs_in_range,
        (SELECT COUNT(*) FROM information_releases WHERE released_at >= NOW() - INTERVAL '30 days') AS releases_in_range
)
SELECT 
    'Active Profiles' AS metric,
    (SELECT (doc->'kpis'->>'active_profiles')::int FROM rpc_res) AS rpc_value,
    active_profiles AS plain_sql_value,
    ((SELECT (doc->'kpis'->>'active_profiles')::int FROM rpc_res) = active_profiles) AS match
FROM plain_sql
UNION ALL
SELECT 
    'Pending Requests' AS metric,
    (SELECT (doc->'kpis'->>'pending_requests')::int FROM rpc_res) AS rpc_value,
    pending_requests AS plain_sql_value,
    ((SELECT (doc->'kpis'->>'pending_requests')::int FROM rpc_res) = pending_requests) AS match
FROM plain_sql
UNION ALL
SELECT 
    'Runs in 30d' AS metric,
    (SELECT (doc->'kpis'->>'runs_in_range')::int FROM rpc_res) AS rpc_value,
    runs_in_range AS plain_sql_value,
    ((SELECT (doc->'kpis'->>'runs_in_range')::int FROM rpc_res) = runs_in_range) AS match
FROM plain_sql
UNION ALL
SELECT 
    'Releases in 30d' AS metric,
    (SELECT (doc->'kpis'->>'releases_in_range')::int FROM rpc_res) AS rpc_value,
    releases_in_range AS plain_sql_value,
    ((SELECT (doc->'kpis'->>'releases_in_range')::int FROM rpc_res) = releases_in_range) AS match
FROM plain_sql;

