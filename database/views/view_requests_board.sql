CREATE OR REPLACE VIEW public.vw_manager_requests_board AS
WITH request_counts AS (
    SELECT source_profile_id, COUNT(*) as req_count
    FROM public.information_requests
    GROUP BY source_profile_id
),
latest_requests AS (
    SELECT DISTINCT ON (source_profile_id)
        id as request_id,
        source_profile_id,
        status as req_status,
        created_at,
        requested_by,
        is_read
    FROM public.information_requests
    ORDER BY source_profile_id, created_at DESC
)
-- 1. Profiles without requests (NEW DATA)
SELECT 
    p.profile_id as board_id,
    NULL::uuid as request_id,
    
    -- Request specific pseudo-fields
    p.created_at as request_date,
    'new' as request_status,
    false as later,
    true as is_read,
    
    p.*
FROM public.vw_profile_core p
LEFT JOIN request_counts rc ON p.profile_id = rc.source_profile_id
WHERE rc.req_count IS NULL

UNION ALL

-- 2. Latest requests for profiles WITH requests
SELECT 
    lr.request_id as board_id,
    lr.request_id,
    
    lr.created_at as request_date,
    CASE 
        WHEN lr.req_status = 'PENDING' THEN 
            CASE WHEN rc.req_count > 1 THEN 'second' ELSE 'first' END
        WHEN lr.req_status = 'PENDING_OTHER' THEN 'second'
        WHEN lr.req_status = 'IN_REVIEW' THEN 'responded'
        WHEN lr.req_status = 'DOWNLOADED' THEN 'downloaded'
        WHEN lr.req_status = 'COMPLETED' THEN 'done'
        WHEN lr.req_status = 'CANCELLED' THEN 'archive'
        ELSE 'new'
    END as request_status,
    false as later,
    COALESCE(lr.is_read, false) as is_read,

    p.*
FROM latest_requests lr
JOIN request_counts rc ON lr.source_profile_id = rc.source_profile_id
JOIN public.vw_profile_core p ON lr.source_profile_id = p.profile_id;

-- =========================================================================
-- View: vw_agent_requests_board
-- Description: Unifies agent's created profiles (Entries Logged) and their 
--              active/past information requests into a structured board view.
-- Columns match AGENT_COLUMNS: logged, requested, responded, done
-- =========================================================================

CREATE OR REPLACE VIEW public.vw_agent_requests_board
WITH (security_invoker = true)
AS

-- 1. Profiles created by this agent with no requests yet (ENTRIES LOGGED)
SELECT
    p.profile_id AS board_id,
    NULL::uuid AS request_id,
    p.created_by AS agent_id,

    p.created_at AS request_date,
    'logged'::text AS request_status,
    false AS later,
    true AS is_read,

    p.*
FROM public.vw_profile_core p
WHERE p.created_by = (SELECT auth.uid())
  AND NOT EXISTS (
      SELECT 1
      FROM public.information_requests ir
      WHERE ir.source_profile_id = p.profile_id
  )

UNION ALL

-- 2. Every request submitted by this agent (REQUESTED, RESPONDED, DONE)
SELECT
    ir.id AS board_id,
    ir.id AS request_id,
    ir.requested_by AS agent_id,

    ir.created_at AS request_date,

    CASE
        WHEN ir.status IN ('PENDING', 'PENDING_OTHER')
            THEN 'requested'
        WHEN ir.status = 'IN_REVIEW'
            THEN 'responded'
        WHEN ir.status = 'DOWNLOADED'
            THEN 'downloaded'
        WHEN ir.status = 'COMPLETED'
            THEN 'done'
        WHEN ir.status = 'CANCELLED'
            THEN 'archive'
        ELSE 'requested'
    END::text AS request_status,

    false AS later,
    COALESCE(ir.is_read, false) AS is_read,

    p.*
FROM public.information_requests ir
JOIN public.vw_profile_core p
    ON p.profile_id = ir.source_profile_id
WHERE ir.requested_by = (SELECT auth.uid());

