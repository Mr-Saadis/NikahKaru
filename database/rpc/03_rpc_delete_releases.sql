-- =========================================================================
-- RPC: Delete/Revoke Sent Information Releases (Manager/Admin action)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.revoke_or_delete_information_releases(
    p_request_id UUID,
    p_candidate_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
    v_manager_id UUID := auth.uid();
    v_deleted_count INTEGER := 0;
    v_remaining_count INTEGER := 0;
    v_source_profile_id UUID;
    v_request_status TEXT;
BEGIN
    -- 1. Authenticate manager or admin
    IF v_manager_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = v_manager_id
          AND UPPER(r.name) IN ('MANAGER', 'HIGH_LEVEL_ADMIN')
    ) THEN
        RAISE EXCEPTION 'Manager/Admin permission required';
    END IF;

    -- 2. Validate request
    SELECT ir.source_profile_id, ir.status::TEXT
    INTO v_source_profile_id, v_request_status
    FROM public.information_requests ir
    WHERE ir.id = p_request_id
    FOR UPDATE OF ir;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Information request not found';
    END IF;

    -- 3. Delete releases for the specified candidate profiles (cascades to information_release_fields)
    DELETE FROM public.information_releases
    WHERE request_id = p_request_id
      AND candidate_profile_id = ANY(p_candidate_ids);

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- 4. Count remaining releases
    SELECT COUNT(*)
    INTO v_remaining_count
    FROM public.information_releases
    WHERE request_id = p_request_id;

    -- 5. If all releases are deleted, revert request status back to 'PENDING'
    IF v_remaining_count = 0 THEN
        UPDATE public.information_requests
        SET status = 'PENDING',
            updated_at = NOW()
        WHERE id = p_request_id;
    END IF;

    -- 6. Log to audit_logs
    INSERT INTO public.audit_logs (
        entity_type,
        entity_id,
        action,
        performed_by,
        new_values
    )
    VALUES (
        'information_releases',
        p_request_id,
        'DELETE',
        v_manager_id,
        jsonb_build_object(
            'event', 'RELEASE_REVOKED',
            'deleted_candidates', p_candidate_ids,
            'deleted_count', v_deleted_count,
            'remaining_count', v_remaining_count,
            'previous_request_status', v_request_status
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'deleted_count', v_deleted_count,
        'remaining_count', v_remaining_count
    );
END;
$function$;
