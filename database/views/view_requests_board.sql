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
