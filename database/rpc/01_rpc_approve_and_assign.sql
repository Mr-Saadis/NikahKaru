-- =========================================================================
-- RPC 2: Approve Information Release (The "Send" Button)
-- =========================================================================
CREATE OR REPLACE FUNCTION approve_information_release(
    p_request_id UUID,
    p_manager_id UUID,
    p_releases_data JSONB -- Array of { candidate_profile_id: UUID, fields_data: [{ field_name: text, value: text }] }
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_release_record RECORD;
    v_new_release_id UUID;
    v_field RECORD;
    v_agent_id UUID;
    v_dummy_match_run_id UUID;
    v_dummy_result_id UUID;
BEGIN
    -- 1. Fetch agent (requested_by) from the request
    SELECT requested_by INTO v_agent_id
    FROM information_requests
    WHERE id = p_request_id;

    -- Update Request Status to COMPLETED
    UPDATE information_requests 
    SET status = 'COMPLETED', updated_at = NOW()
    WHERE id = p_request_id;

    -- 2. Loop through each selected candidate to create releases and snapshots
    FOR v_release_record IN SELECT * FROM jsonb_to_recordset(p_releases_data) AS x(candidate_profile_id UUID, fields_data jsonb)
    LOOP
        -- NOTE: Since we skipped Step 1 (Match Run), we must create a dummy match run result 
        -- to satisfy the NOT NULL constraint on information_releases.match_run_result_id
        INSERT INTO match_runs (source_profile_id, preference_set_id, executed_by)
        SELECT source_profile_id, source_profile_id, p_manager_id FROM information_requests WHERE id = p_request_id
        RETURNING id INTO v_dummy_match_run_id;

        INSERT INTO match_run_results (match_run_id, candidate_profile_id, rank)
        VALUES (v_dummy_match_run_id, v_release_record.candidate_profile_id, 1)
        RETURNING id INTO v_dummy_result_id;

        -- Create the release row
        INSERT INTO information_releases (
            request_id,
            manager_id,
            match_run_result_id,
            candidate_profile_id,
            released_by,
            release_status,
            released_at
        ) VALUES (
            p_request_id,
            p_manager_id,
            v_dummy_result_id,
            v_release_record.candidate_profile_id,
            p_manager_id,
            'ACTIVE',
            NOW()
        ) RETURNING id INTO v_new_release_id;

        -- Create snapshot for each selected field passed from frontend
        FOR v_field IN SELECT * FROM jsonb_to_recordset(v_release_record.fields_data) AS y(field_name text, value text)
        LOOP
            INSERT INTO information_release_fields (
                release_id,
                field_name,
                snapshot_value
            ) VALUES (
                v_new_release_id,
                v_field.field_name,
                COALESCE(v_field.value, 'N/A')
            );
        END LOOP;
    END LOOP;

    -- 3. Audit Log
    INSERT INTO audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_manager_id,
        'RELEASE',
        'information_request',
        p_request_id,
        jsonb_build_object('message', 'Information release approved and snapshot created')
    );

    -- 4. Notify Agent
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message
    ) VALUES (
        v_agent_id,
        'REQUEST',
        'Request Completed',
        'Your information request has been completed and candidates have been released.'
    );
END;
$$;


-- =========================================================================
-- RPC 3: Assign Information Request
-- =========================================================================
CREATE OR REPLACE FUNCTION assign_information_request(
    p_request_id UUID,
    p_assigner_id UUID,
    p_assignee_id UUID,
    p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Insert Assignment Record
    INSERT INTO information_request_assignments (
        request_id,
        assigned_by,
        assigned_to,
        assignment_notes,
        assigned_at
    ) VALUES (
        p_request_id,
        p_assigner_id,
        p_assignee_id,
        p_notes,
        NOW()
    );

    -- 2. Audit Log
    INSERT INTO audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_assigner_id,
        'ASSIGN',
        'information_request',
        p_request_id,
        jsonb_build_object('assigned_to', p_assignee_id)
    );

    -- 3. Notify Assignee
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message
    ) VALUES (
        p_assignee_id,
        'SYSTEM',
        'New Request Assigned',
        'A new information request has been assigned to you.'
    );
END;
$$;
