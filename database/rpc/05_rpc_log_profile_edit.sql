-- =========================================================================
-- RPC 05: Log Profile Edit (Agent & Manager only, HIGH_LEVEL_ADMIN skipped)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.rpc_log_profile_edit(
    p_profile_id UUID,
    p_new_data JSONB DEFAULT '{}'::jsonb,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
    v_actor_id UUID := COALESCE(auth.uid(), p_actor_user_id);
    v_user_role TEXT;
BEGIN
    -- 1. Check authentication
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to log profile edit';
    END IF;

    -- 2. Fetch authoritative user role
    SELECT UPPER(r.name)
    INTO v_user_role
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = v_actor_id
    LIMIT 1;

    -- 3. Strict rule: If HIGH_LEVEL_ADMIN, do NOT create log entry
    IF v_user_role = 'HIGH_LEVEL_ADMIN' THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'skipped', TRUE,
            'reason', 'HIGH_LEVEL_ADMIN profile edits are not logged'
        );
    END IF;

    -- 4. Only log for AGENT or MANAGER
    IF v_user_role NOT IN ('AGENT', 'MANAGER') THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'skipped', TRUE,
            'reason', 'Role is not eligible for profile edit logging'
        );
    END IF;

    -- 5. Insert audit log record
    INSERT INTO public.audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        new_data,
        metadata
    )
    VALUES (
        v_actor_id,
        'UPDATE',
        'profile',
        p_profile_id,
        COALESCE(p_new_data, '{}'::jsonb) || jsonb_build_object('edited_at', NOW()),
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('source', 'RPC_LOG_PROFILE_EDIT', 'edited_by_role', v_user_role)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'logged', TRUE,
        'role', v_user_role
    );
END;
$function$;

-- Grant execute to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.rpc_log_profile_edit(UUID, JSONB, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_log_profile_edit(UUID, JSONB, JSONB, UUID) TO service_role;
