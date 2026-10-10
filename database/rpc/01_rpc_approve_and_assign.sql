-- =========================================================================
-- RPC 1: Approve Information Release (Manager sends selected candidates)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.approve_information_release(
    p_request_id UUID,
    p_releases_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
    v_manager_id UUID := auth.uid();
    v_source_profile_id UUID;
    v_agent_id UUID;
    v_request_status TEXT;
    v_preference_set_id UUID;
    v_match_run_id UUID;
    v_match_result_id UUID;
    v_release_id UUID;

    v_item JSONB;
    v_field JSONB;
    v_breakdown_json JSONB;

    v_candidate_id UUID;
    v_rank INTEGER := 0;
    v_selected_count INTEGER;
    v_release_count INTEGER := 0;
    v_field_count INTEGER := 0;
    v_breakdown_count INTEGER := 0;

    v_final_score NUMERIC;
    v_source_score NUMERIC;
    v_candidate_score NUMERIC;

    v_snapshot JSONB;
    v_field_path TEXT;
    v_field_value JSONB;
    v_seen_fields TEXT[];

    v_breakdown public.match_score_breakdowns%ROWTYPE;
    v_profile_name TEXT;
    v_agent_name TEXT;
BEGIN
    ----------------------------------------------------------------
    -- 1. Authenticate manager
    ----------------------------------------------------------------
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

    ----------------------------------------------------------------
    -- 2. Validate payload
    ----------------------------------------------------------------
    IF p_releases_data IS NULL
       OR jsonb_typeof(p_releases_data) <> 'array' THEN
        RAISE EXCEPTION 'p_releases_data must be a JSON array';
    END IF;

    v_selected_count := jsonb_array_length(p_releases_data);

    IF v_selected_count = 0 THEN
        RAISE EXCEPTION 'Select at least one candidate';
    END IF;

    -- Prevent duplicate candidates in the same Send operation.
    IF (
        SELECT COUNT(DISTINCT item->>'candidate_profile_id')
        FROM jsonb_array_elements(p_releases_data) AS e(item)
    ) <> v_selected_count THEN
        RAISE EXCEPTION 'Duplicate candidate profiles are not allowed';
    END IF;

    ----------------------------------------------------------------
    -- 3. Lock request and validate its current status
    ----------------------------------------------------------------
    SELECT
        ir.source_profile_id,
        ir.requested_by,
        ir.status::TEXT
    INTO
        v_source_profile_id,
        v_agent_id,
        v_request_status
    FROM public.information_requests ir
    WHERE ir.id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Information request not found';
    END IF;

    -- This RPC accepts a request that has not yet been reviewed.
    IF v_request_status <> 'PENDING' THEN
        RAISE EXCEPTION
            'Request cannot be released from status %',
            v_request_status;
    END IF;

    ----------------------------------------------------------------
    -- 4. Get the current preference set
    ----------------------------------------------------------------
    SELECT ps.id
    INTO v_preference_set_id
    FROM public.preference_sets ps
    WHERE ps.profile_id = v_source_profile_id
      AND ps.is_current = TRUE
    ORDER BY ps.version DESC, ps.created_at DESC
    LIMIT 1;

    IF v_preference_set_id IS NULL THEN
        RAISE EXCEPTION
            'Source profile has no current preference set';
    END IF;

    ----------------------------------------------------------------
    -- 5. Validate selected candidates and scores before writing
    ----------------------------------------------------------------
    FOR v_item IN
        SELECT item
        FROM jsonb_array_elements(p_releases_data) AS e(item)
    LOOP
        IF NULLIF(v_item->>'candidate_profile_id', '') IS NULL THEN
            RAISE EXCEPTION 'Every selection needs candidate_profile_id';
        END IF;

        v_candidate_id :=
            (v_item->>'candidate_profile_id')::UUID;

        IF v_candidate_id = v_source_profile_id THEN
            RAISE EXCEPTION 'Source profile cannot match itself';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = v_candidate_id
              AND p.archived_at IS NULL
        ) THEN
            RAISE EXCEPTION
                'Candidate profile % does not exist or is archived',
                v_candidate_id;
        END IF;

        IF jsonb_typeof(v_item->'fields_data') <> 'array'
           OR jsonb_array_length(v_item->'fields_data') = 0 THEN
            RAISE EXCEPTION
                'Each selected candidate needs at least one release field';
        END IF;

        IF jsonb_typeof(v_item->'score_breakdowns') <> 'array' THEN
            RAISE EXCEPTION
                'score_breakdowns must be an array for each candidate';
        END IF;

        IF NULLIF(v_item->>'final_score', '') IS NULL
           OR NULLIF(v_item->>'source_to_candidate_score', '') IS NULL
           OR NULLIF(v_item->>'candidate_to_source_score', '') IS NULL THEN
            RAISE EXCEPTION
                'Actual calculated scores are required for candidate %',
                v_candidate_id;
        END IF;

        v_final_score := (v_item->>'final_score')::NUMERIC;
        v_source_score :=
            (v_item->>'source_to_candidate_score')::NUMERIC;
        v_candidate_score :=
            (v_item->>'candidate_to_source_score')::NUMERIC;

        IF v_final_score NOT BETWEEN 0 AND 100
           OR v_source_score NOT BETWEEN 0 AND 100
           OR v_candidate_score NOT BETWEEN 0 AND 100 THEN
            RAISE EXCEPTION 'Scores must be between 0 and 100';
        END IF;
    END LOOP;

    ----------------------------------------------------------------
    -- 6. Create ONE matching run for this request
    ----------------------------------------------------------------
    INSERT INTO public.match_runs (
        source_profile_id,
        preference_set_id,
        executed_by,
        algorithm_version,
        candidate_limit,
        candidates_considered,
        candidates_after_hard_filter,
        executed_at,
        metadata
    )
    VALUES (
        v_source_profile_id,
        v_preference_set_id,
        v_manager_id,
        'v1',
        v_selected_count,
        v_selected_count,
        v_selected_count,
        NOW(),
        jsonb_build_object(
            'request_id', p_request_id,
            'source', 'manager_selected_release',
            'selected_candidate_count', v_selected_count
        )
    )
    RETURNING id INTO v_match_run_id;

    ----------------------------------------------------------------
    -- 7. Save ONLY selected candidates
    ----------------------------------------------------------------
    v_rank := 0;

    FOR v_item IN
        SELECT item
        FROM jsonb_array_elements(p_releases_data) AS e(item)
    LOOP
        v_rank := v_rank + 1;

        v_candidate_id :=
            (v_item->>'candidate_profile_id')::UUID;

        v_final_score := (v_item->>'final_score')::NUMERIC;
        v_source_score :=
            (v_item->>'source_to_candidate_score')::NUMERIC;
        v_candidate_score :=
            (v_item->>'candidate_to_source_score')::NUMERIC;

        ------------------------------------------------------------
        -- 7A. Build a database-sourced candidate snapshot.
        -- Fields are read from the database, not supplied values.
        ------------------------------------------------------------
        SELECT jsonb_build_object(
            'profile', to_jsonb(p),
            'personal_information', to_jsonb(pi),
            'physical_information', to_jsonb(ph),
            'education_records', COALESCE((
                SELECT jsonb_agg(to_jsonb(er) ORDER BY er.created_at)
                FROM public.education_records er
                WHERE er.profile_id = p.id
            ), '[]'::JSONB),
            'employment_records', COALESCE((
                SELECT jsonb_agg(to_jsonb(em) ORDER BY em.created_at)
                FROM public.employment_records em
                WHERE em.profile_id = p.id
            ), '[]'::JSONB),
            'income_information', to_jsonb(ii),
            'religion_information', to_jsonb(ri),
            'profile_locations', to_jsonb(pl),
            'residency_information', to_jsonb(res),
            'family_information', to_jsonb(fi),
            'lifestyle_information', to_jsonb(li),
            'relocation_information', to_jsonb(rel),
            'parents', COALESCE((
                SELECT jsonb_agg(to_jsonb(pa) ORDER BY pa.parent_type)
                FROM public.parents pa
                WHERE pa.profile_id = p.id
            ), '[]'::JSONB),
            'siblings', COALESCE((
                SELECT jsonb_agg(to_jsonb(si) ORDER BY si.created_at)
                FROM public.siblings si
                WHERE si.profile_id = p.id
            ), '[]'::JSONB),
            'children', COALESCE((
                SELECT jsonb_agg(to_jsonb(ch) ORDER BY ch.created_at)
                FROM public.children ch
                WHERE ch.profile_id = p.id
            ), '[]'::JSONB),
            'previous_marriages', COALESCE((
                SELECT jsonb_agg(
                    to_jsonb(pm) ORDER BY pm.marriage_number
                )
                FROM public.previous_marriages pm
                WHERE pm.profile_id = p.id
            ), '[]'::JSONB)
        )
        INTO v_snapshot
        FROM public.profiles p
        LEFT JOIN public.personal_information pi
            ON pi.profile_id = p.id
        LEFT JOIN public.physical_information ph
            ON ph.profile_id = p.id
        LEFT JOIN public.income_information ii
            ON ii.profile_id = p.id
        LEFT JOIN public.religion_information ri
            ON ri.profile_id = p.id
        LEFT JOIN public.profile_locations pl
            ON pl.profile_id = p.id
        LEFT JOIN public.residency_information res
            ON res.profile_id = p.id
        LEFT JOIN public.family_information fi
            ON fi.profile_id = p.id
        LEFT JOIN public.lifestyle_information li
            ON li.profile_id = p.id
        LEFT JOIN public.relocation_information rel
            ON rel.profile_id = p.id
        WHERE p.id = v_candidate_id;

        IF v_snapshot IS NULL THEN
            RAISE EXCEPTION 'Could not load candidate snapshot';
        END IF;

        ------------------------------------------------------------
        -- 7B. Insert selected candidate into match_run_results
        ------------------------------------------------------------
        INSERT INTO public.match_run_results (
            match_run_id,
            candidate_profile_id,
            rank,
            source_to_candidate_score,
            candidate_to_source_score,
            final_score,
            passed_hard_filter
        )
        VALUES (
            v_match_run_id,
            v_candidate_id,
            v_rank,
            v_source_score,
            v_candidate_score,
            v_final_score,
            COALESCE(
                (v_item->>'passed_hard_filter')::BOOLEAN,
                TRUE
            )
        )
        RETURNING id INTO v_match_result_id;

        ------------------------------------------------------------
        -- 7C. Insert score breakdowns for this selected candidate
        ------------------------------------------------------------
        FOR v_breakdown_json IN
            SELECT value
            FROM jsonb_array_elements(v_item->'score_breakdowns')
        LOOP
            -- Populate enum fields using the actual table row type.
            v_breakdown :=
                jsonb_populate_record(
                    NULL::public.match_score_breakdowns,
                    v_breakdown_json
                );

            IF v_breakdown.criterion_code IS NULL
               OR v_breakdown.algorithm_version IS NULL
               OR v_breakdown.direction IS NULL THEN
                RAISE EXCEPTION
                    'Each score breakdown needs direction, criterion_code and algorithm_version';
            END IF;

            INSERT INTO public.match_score_breakdowns (
                match_run_result_id,
                direction,
                criterion_code,
                candidate_value,
                preferred_value,
                importance,
                match_mode,
                raw_score,
                weight,
                weighted_score,
                passed_hard_filter,
                explanation,
                algorithm_version
            )
            VALUES (
                v_match_result_id,
                v_breakdown.direction,
                v_breakdown.criterion_code,
                v_breakdown.candidate_value,
                v_breakdown.preferred_value,
                v_breakdown.importance,
                v_breakdown.match_mode,
                v_breakdown.raw_score,
                v_breakdown.weight,
                v_breakdown.weighted_score,
                v_breakdown.passed_hard_filter,
                v_breakdown.explanation,
                v_breakdown.algorithm_version
            );

            v_breakdown_count := v_breakdown_count + 1;
        END LOOP;

        ------------------------------------------------------------
        -- 7D. Create information release for this candidate
        ------------------------------------------------------------
        INSERT INTO public.information_releases (
            request_id,
            match_run_result_id,
            candidate_profile_id,
            released_by,
            release_status,
            released_at
        )
        VALUES (
            p_request_id,
            v_match_result_id,
            v_candidate_id,
            v_manager_id,
            'ACTIVE',
            NOW()
        )
        RETURNING id INTO v_release_id;

        ------------------------------------------------------------
        -- 7E. Save immutable, database-sourced field snapshots
        ------------------------------------------------------------
        v_seen_fields := ARRAY[]::TEXT[];

        FOR v_field IN
            SELECT value
            FROM jsonb_array_elements(v_item->'fields_data')
        LOOP
            v_field_path := v_field->>'field_path';

            IF v_field_path IS NULL OR v_field_path = '' THEN
                RAISE EXCEPTION 'field_path is required';
            END IF;

            IF v_field_path = ANY(v_seen_fields) THEN
                RAISE EXCEPTION
                    'Duplicate field_path % for candidate %',
                    v_field_path, v_candidate_id;
            END IF;

            v_seen_fields := array_append(
                v_seen_fields,
                v_field_path
            );

            v_field_value :=
                v_snapshot #> string_to_array(v_field_path, '.');

            IF v_field_value IS NULL THEN
                v_field_value := to_jsonb('N/A'::text);
            END IF;

            INSERT INTO public.information_release_fields (
                release_id,
                field_path,
                field_value
            )
            VALUES (
                v_release_id,
                v_field_path,
                v_field_value
            );

            v_field_count := v_field_count + 1;
        END LOOP;

        v_release_count := v_release_count + 1;
    END LOOP;

    ----------------------------------------------------------------
    -- 8. Mark the request IN_REVIEW
    ----------------------------------------------------------------
    UPDATE public.information_requests
    SET status = 'IN_REVIEW',
        reviewed_by = v_manager_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;

    ----------------------------------------------------------------
    -- 9. Audit log
    ----------------------------------------------------------------
    INSERT INTO public.audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
    VALUES (
        v_manager_id,
        'RELEASE'::public.audit_action,
        'information_request',
        p_request_id,
        jsonb_build_object(
            'match_run_id', v_match_run_id,
            'selected_candidate_count', v_release_count,
            'field_snapshot_count', v_field_count,
            'score_breakdown_count', v_breakdown_count
        )
    );

    ----------------------------------------------------------------
    -- 10. Notify requesting agent and executing manager
    ----------------------------------------------------------------
    SELECT pi.full_name
    INTO v_profile_name
    FROM public.personal_information pi
    WHERE pi.profile_id = v_source_profile_id;

    SELECT COALESCE(u.full_name, 'Agent')
    INTO v_agent_name
    FROM public.users u
    WHERE u.id = v_agent_id;

    IF v_agent_name IS NULL THEN
        v_agent_name := 'Agent';
    END IF;

    -- A. Notify requesting Agent
    IF v_agent_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            entity_type,
            entity_id
        )
        VALUES (
            v_agent_id,
            'REQUEST'::public.notification_type,
            'Matches Released - In Review',
            'The manager released '
                || v_release_count
                || ' selected candidate profile(s) for '
                || COALESCE(v_profile_name, 'the requested profile')
                || '.',
            'information_request',
            p_request_id
        );
    END IF;

    -- B. Notify executing Manager
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id
    )
    VALUES (
        v_manager_id,
        'REQUEST'::public.notification_type,
        'Matches Sent Successfully',
        'You sent '
            || v_agent_name
            || ' the matching of '
            || COALESCE(v_profile_name, 'the requested profile')
            || ' (' || v_release_count || ' profile(s)).',
        'information_request',
        p_request_id
    );

    ----------------------------------------------------------------
    -- 11. Return result
    ----------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', TRUE,
        'request_id', p_request_id,
        'match_run_id', v_match_run_id,
        'selected_candidate_count', v_release_count,
        'field_snapshot_count', v_field_count,
        'score_breakdown_count', v_breakdown_count,
        'status', 'IN_REVIEW'
    );
END;
$function$;


-- =========================================================================
-- RPC 2: Assign Information Request
-- =========================================================================
CREATE OR REPLACE FUNCTION public.assign_information_request(
    p_request_id UUID,
    p_assigner_id UUID,
    p_assignee_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Insert Assignment Record
    INSERT INTO public.information_request_assignments (
        request_id,
        assigned_by,
        assigned_to,
        status,
        notes,
        assigned_at
    ) VALUES (
        p_request_id,
        p_assigner_id,
        p_assignee_id,
        'ACTIVE',
        p_notes,
        NOW()
    );

    -- 2. Audit Log
    INSERT INTO public.audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_assigner_id,
        'ASSIGN'::public.audit_action,
        'information_request',
        p_request_id,
        jsonb_build_object('assigned_to', p_assignee_id)
    );

    -- 3. Notify Assignee
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id
    ) VALUES (
        p_assignee_id,
        'ASSIGNMENT'::public.notification_type,
        'New Request Assigned',
        'A new information request has been assigned to you.',
        'information_request',
        p_request_id
    );
END;
$$;
