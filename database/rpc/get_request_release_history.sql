CREATE OR REPLACE FUNCTION public.get_request_release_history(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_result JSONB;
BEGIN
    -- Require an authenticated user.
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = '42501';
    END IF;

    -- Validate that the request exists.
    IF NOT EXISTS (
        SELECT 1
        FROM public.information_requests ir
        WHERE ir.id = p_request_id
    ) THEN
        RAISE EXCEPTION 'Information request not found'
            USING ERRCODE = 'P0002';
    END IF;

    /*
      IMPORTANT:
      Configure RLS policies so only authorized managers
      and other permitted users can read this request's
      release history and related profile information.
    */

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'release_id', ir.id,
                'candidate_profile_id',
                    ir.candidate_profile_id,
                'candidate_name',
                    pi.full_name,
                'released_at',
                    ir.released_at,
                'release_status',
                    ir.release_status,
                'released_by',
                    ir.released_by,
                'released_by_name',
                    u.full_name,
                'selected_fields',
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                DISTINCT irf.field_path
                                ORDER BY irf.field_path
                            )
                            FROM public.information_release_fields irf
                            WHERE irf.release_id = ir.id
                        ),
                        '[]'::jsonb
                    )
            )
            ORDER BY ir.released_at DESC, ir.id DESC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.information_releases ir
    LEFT JOIN public.personal_information pi
        ON pi.profile_id = ir.candidate_profile_id
    LEFT JOIN public.users u
        ON u.id = ir.released_by
    WHERE ir.request_id = p_request_id;

    RETURN v_result;
END;
$function$;
