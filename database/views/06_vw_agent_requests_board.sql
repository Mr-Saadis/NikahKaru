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
