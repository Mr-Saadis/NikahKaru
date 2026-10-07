-- ==============================================================================
-- Function: submit_information_request
-- Purpose: Safely creates an information request, logs the action, and notifies managers.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.submit_information_request(
    p_agent_id UUID,
    p_source_profile_id UUID,
    p_client_ip TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator
AS $$
DECLARE
    v_request_id UUID;
    v_manager RECORD;
    v_profile_name TEXT;
BEGIN
    -- 1. Insert into information_requests
    INSERT INTO public.information_requests (
        requested_by,
        source_profile_id,
        status,
        created_at,
        updated_at
    )
    VALUES (
        p_agent_id,
        p_source_profile_id,
        'PENDING',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_request_id;

    -- 2. Insert into audit_logs
    INSERT INTO public.audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        new_data,
        metadata
    )
    VALUES (
        p_agent_id,
        'CREATE',
        'information_request',
        v_request_id,
        jsonb_build_object(
            'status', 'PENDING',
            'source_profile_id', p_source_profile_id
        ),
        jsonb_build_object(
            'client_ip', p_client_ip,
            'role', 'AGENT'
        )
    );

    -- Get Profile Name for the Notification (optional but good for UX)
    SELECT full_name INTO v_profile_name 
    FROM public.personal_information 
    WHERE profile_id = p_source_profile_id;
    
    IF v_profile_name IS NULL THEN
        v_profile_name := 'a profile';
    END IF;

    -- 3. Notify all Managers and Admins
    -- Note: Assuming the users table has a 'role' column. 
    -- Adjust 'role' or the schema query as necessary based on exact user structure.
    FOR v_manager IN 
        SELECT ur.user_id as id 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE r.name IN ('MANAGER', 'HIGH_LEVEL_ADMIN')
    LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            entity_type,
            entity_id
        )
        VALUES (
            v_manager.id,
            'REQUEST',
            'New Match Analysis Request',
            'An agent has requested an official match analysis for ' || v_profile_name || '.',
            'information_request',
            v_request_id
        );
    END LOOP;

    -- Return the newly created request ID
    RETURN v_request_id;

EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, the transaction will automatically rollback
    RAISE EXCEPTION 'Failed to submit information request: %', SQLERRM;
END;
$$;
