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
        updated_at,
        reviewed_at,
        reviewed_by,
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
    
    p.*,
    COALESCE(p.created_by_name, p.current_agent_name, 'Agent')::text as stage_actor_name
FROM public.vw_profile_core p
LEFT JOIN request_counts rc ON p.profile_id = rc.source_profile_id
WHERE rc.req_count IS NULL
  AND p.status <> 'DRAFT'

UNION ALL

-- 2. Latest requests for profiles WITH requests (Stage-aware actor & date)
SELECT 
    lr.request_id as board_id,
    lr.request_id,
    
    CASE
        WHEN lr.req_status::text IN ('PENDING', 'PENDING_OTHER') THEN lr.created_at
        WHEN lr.req_status::text = 'IN_REVIEW' THEN COALESCE(lr.reviewed_at, lr.updated_at, lr.created_at)
        ELSE COALESCE(lr.updated_at, lr.reviewed_at, lr.created_at)
    END as request_date,
    CASE 
        WHEN lr.req_status::text = 'PENDING' THEN 
            CASE WHEN rc.req_count > 1 THEN 'second' ELSE 'first' END
        WHEN lr.req_status::text = 'PENDING_OTHER' THEN 'second'
        WHEN lr.req_status::text = 'IN_REVIEW' THEN 'responded'
        WHEN lr.req_status::text = 'DOWNLOADED' THEN 'downloaded'
        WHEN lr.req_status::text = 'COMPLETED' THEN 'done'
        WHEN lr.req_status::text = 'COMPLETED_OUTSIDE_SYSTEM' THEN 'completed_outside'
        ELSE 'new'
    END as request_status,
    false as later,
    COALESCE(lr.is_read, false) as is_read,

    p.*,
    CASE
        WHEN lr.req_status::text IN ('PENDING', 'PENDING_OTHER')
            THEN COALESCE(u_req.full_name, p.current_agent_name, p.created_by_name, 'Agent')
        WHEN lr.req_status::text = 'IN_REVIEW'
            THEN COALESCE(u_rev.full_name, 'Manager')
        WHEN lr.req_status::text = 'DOWNLOADED'
            THEN COALESCE(p.current_agent_name, u_req.full_name, p.created_by_name, 'Agent')
        WHEN lr.req_status::text IN ('COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM')
            THEN COALESCE(u_rev.full_name, p.current_agent_name, u_req.full_name, 'Manager')
        ELSE COALESCE(p.current_agent_name, u_req.full_name, p.created_by_name, 'System')
    END::text as stage_actor_name
FROM latest_requests lr
JOIN request_counts rc ON lr.source_profile_id = rc.source_profile_id
JOIN public.vw_profile_core p ON lr.source_profile_id = p.profile_id
LEFT JOIN public.users u_req ON u_req.id = lr.requested_by
LEFT JOIN public.users u_rev ON u_rev.id = lr.reviewed_by;

-- =========================================================================
-- View: vw_agent_requests_board
-- Description: Unifies agent's created profiles (Entries Logged) and their 
--              active/past information requests into a structured board view.
-- Columns match AGENT_COLUMNS: logged, requested, responded, done
-- =========================================================================

CREATE OR REPLACE VIEW public.vw_agent_requests_board
WITH (security_invoker = true)
AS
WITH latest_agent_requests AS (
    SELECT DISTINCT ON (ir.source_profile_id)
        ir.id,
        ir.source_profile_id,
        ir.requested_by,
        ir.reviewed_by,
        ir.reviewed_at,
        ir.created_at,
        ir.updated_at,
        ir.status,
        ir.is_read
    FROM public.information_requests ir
    ORDER BY ir.source_profile_id, ir.created_at DESC
)

-- 1. Profiles created by/assigned to this agent with no requests yet (ENTRIES LOGGED)
SELECT
    p.profile_id AS board_id,
    NULL::uuid AS request_id,
    p.created_by AS agent_id,

    p.created_at AS request_date,
    'logged'::text AS request_status,
    false AS later,
    true AS is_read,

    p.*,
    COALESCE(p.created_by_name, p.current_agent_name, 'Agent')::text AS stage_actor_name
FROM public.vw_profile_core p
WHERE (p.current_agent_id = (SELECT auth.uid()) OR (p.current_agent_id IS NULL AND p.created_by = (SELECT auth.uid())))
  AND p.status <> 'DRAFT'
  AND NOT EXISTS (
      SELECT 1
      FROM public.information_requests ir
      WHERE ir.source_profile_id = p.profile_id
  )

UNION ALL

-- 2. Latest request per profile assigned to or submitted by this agent (Stage-aware actor & date)
SELECT
    ir.id AS board_id,
    ir.id AS request_id,
    COALESCE(p.current_agent_id, ir.requested_by) AS agent_id,

    CASE
        WHEN ir.status::text IN ('PENDING', 'PENDING_OTHER') THEN ir.created_at
        WHEN ir.status::text = 'IN_REVIEW' THEN COALESCE(ir.reviewed_at, ir.updated_at, ir.created_at)
        ELSE COALESCE(ir.updated_at, ir.reviewed_at, ir.created_at)
    END AS request_date,

    CASE
        WHEN ir.status::text IN ('PENDING', 'PENDING_OTHER')
            THEN 'requested'
        WHEN ir.status::text = 'IN_REVIEW'
            THEN 'responded'
        WHEN ir.status::text = 'DOWNLOADED'
            THEN 'downloaded'
        WHEN ir.status::text = 'COMPLETED'
            THEN 'done'
        WHEN ir.status::text = 'COMPLETED_OUTSIDE_SYSTEM'
            THEN 'completed_outside'
        WHEN ir.status::text = 'CANCELLED'
            THEN 'archive'
        ELSE 'requested'
    END::text AS request_status,

    false AS later,
    COALESCE(ir.is_read, false) AS is_read,

    p.*,
    CASE
        WHEN ir.status::text IN ('PENDING', 'PENDING_OTHER')
            THEN COALESCE(u_req.full_name, p.current_agent_name, p.created_by_name, 'Agent')
        WHEN ir.status::text = 'IN_REVIEW'
            THEN COALESCE(u_rev.full_name, 'Manager')
        WHEN ir.status::text = 'DOWNLOADED'
            THEN COALESCE(p.current_agent_name, u_req.full_name, p.created_by_name, 'Agent')
        WHEN ir.status::text IN ('COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM', 'CANCELLED')
            THEN COALESCE(u_rev.full_name, p.current_agent_name, u_req.full_name, 'Manager')
        ELSE COALESCE(p.current_agent_name, u_req.full_name, p.created_by_name, 'Agent')
    END::text AS stage_actor_name
FROM latest_agent_requests ir
JOIN public.vw_profile_core p
    ON p.profile_id = ir.source_profile_id
LEFT JOIN public.users u_req
    ON u_req.id = ir.requested_by
LEFT JOIN public.users u_rev
    ON u_rev.id = ir.reviewed_by
WHERE (
    p.current_agent_id = (SELECT auth.uid())
    OR (p.current_agent_id IS NULL AND ir.requested_by = (SELECT auth.uid()))
    OR EXISTS (
        SELECT 1
        FROM public.information_request_assignments ira
        WHERE ira.request_id = ir.id
          AND ira.assigned_to = (SELECT auth.uid())
          AND ira.status = 'ACTIVE'
    )
);

