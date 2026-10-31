-- ============================================================================
-- NikaahKaro: Independent Verification Script for "Today's Activity"
-- File: docs/verify_today_activity.sql
-- 
-- READ-ONLY verification queries for the 5 Today's Activity metrics.
-- Compare plain-SQL counts against get_agent_today_activity() RPC output.
--
-- Instructions: Run in Supabase SQL editor with authenticated agent role.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARAMETERS & TIMEZONE SETUP
-- "Today" strictly equals the Asia/Karachi calendar day start (00:00:00 PKT).
-- ----------------------------------------------------------------------------
WITH params AS (
  SELECT 
    coalesce(auth.uid(), 'YOUR_AGENT_UUID_HERE'::uuid) AS agent_id,
    (timezone('Asia/Karachi', now())::date)::timestamp at time zone 'Asia/Karachi' AS today_start
),

-- ----------------------------------------------------------------------------
-- PLAIN-SQL COUNTS (Independent from RPC)
-- ----------------------------------------------------------------------------
plain_counts AS (
  SELECT
    -- 1. Profiles added: profiles.created_by = me AND profiles.created_at >= start of today
    (
      SELECT count(*) 
      FROM profiles p, params
      WHERE p.created_by = params.agent_id
        AND p.created_at >= params.today_start
    ) AS count_profiles_added,

    -- 2. Requests sent (First requests): requested_by = me, created_at today, NO earlier request for same source profile
    (
      SELECT count(*)
      FROM information_requests r, params
      WHERE r.requested_by = params.agent_id
        AND r.created_at >= params.today_start
        AND NOT EXISTS (
          SELECT 1 
          FROM information_requests earlier
          WHERE earlier.source_profile_id = r.source_profile_id
            AND earlier.created_at < r.created_at
        )
    ) AS count_new_requests,

    -- 3. Second requests: requested_by = me, created_at today, earlier request exists for same source profile
    (
      SELECT count(*)
      FROM information_requests r, params
      WHERE r.requested_by = params.agent_id
        AND r.created_at >= params.today_start
        AND EXISTS (
          SELECT 1 
          FROM information_requests earlier
          WHERE earlier.source_profile_id = r.source_profile_id
            AND earlier.created_at < r.created_at
        )
    ) AS count_second_requests,

    -- 4. Manager responded: my requests with reviewed_at today
    (
      SELECT count(*)
      FROM information_requests r, params
      WHERE (
        r.requested_by = params.agent_id
        OR EXISTS (
          SELECT 1 
          FROM information_request_assignments a
          WHERE a.request_id = r.id 
            AND a.assigned_to = params.agent_id 
            AND a.status::text = 'ACTIVE'
        )
      )
      AND r.reviewed_at >= params.today_start
    ) AS count_responded,

    -- 5. Completed: my requests with status COMPLETED / COMPLETED_OUTSIDE_SYSTEM and updated_at today
    (
      SELECT count(*)
      FROM information_requests r, params
      WHERE (
        r.requested_by = params.agent_id
        OR EXISTS (
          SELECT 1 
          FROM information_request_assignments a
          WHERE a.request_id = r.id 
            AND a.assigned_to = params.agent_id 
            AND a.status::text = 'ACTIVE'
        )
      )
      AND r.status::text IN ('COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM')
      AND r.updated_at >= params.today_start
    ) AS count_completed
),

-- ----------------------------------------------------------------------------
-- RPC OUTPUT
-- ----------------------------------------------------------------------------
rpc_data AS (
  SELECT public.get_agent_today_activity() AS res
),
rpc_items AS (
  SELECT 
    elem->>'key' AS key,
    (elem->>'count')::int AS rpc_count
  FROM rpc_data,
       jsonb_array_elements(res->'items') AS elem
)

-- ----------------------------------------------------------------------------
-- SIDE-BY-SIDE VERIFICATION TABLE
-- Prints plain-SQL count vs RPC count for each of the 5 keys
-- ----------------------------------------------------------------------------
SELECT 
  t.metric_key,
  t.plain_sql_count,
  coalesce(r.rpc_count, 0) AS rpc_count,
  CASE WHEN t.plain_sql_count = coalesce(r.rpc_count, 0) THEN 'MATCH (PASS)' ELSE 'MISMATCH (FAIL)' END AS status
FROM (
  SELECT 'profiles_added' AS metric_key, count_profiles_added AS plain_sql_count FROM plain_counts
  UNION ALL
  SELECT 'new_requests', count_new_requests FROM plain_counts
  UNION ALL
  SELECT 'second_requests', count_second_requests FROM plain_counts
  UNION ALL
  SELECT 'responded', count_responded FROM plain_counts
  UNION ALL
  SELECT 'completed', count_completed FROM plain_counts
) t
LEFT JOIN rpc_items r ON r.key = t.metric_key
ORDER BY 
  CASE t.metric_key
    WHEN 'profiles_added' THEN 1
    WHEN 'new_requests' THEN 2
    WHEN 'second_requests' THEN 3
    WHEN 'responded' THEN 4
    WHEN 'completed' THEN 5
  END;

