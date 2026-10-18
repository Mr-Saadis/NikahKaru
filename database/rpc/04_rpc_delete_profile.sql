-- =========================================================================
-- RPC 04: Delete Profile Guard
-- - HIGH_LEVEL_ADMIN can delete any profile in "New Data" stage
-- - AGENTS are allowed to delete their own DRAFT profiles only
-- - Deletes Profile Picture FIRST from Supabase Storage, then cleans records
-- =========================================================================

CREATE OR REPLACE FUNCTION public.rpc_delete_profile(
    p_profile_id UUID,
    p_actor_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, storage
AS $function$
DECLARE
    v_actor_id UUID := COALESCE(auth.uid(), p_actor_user_id);
    v_user_role TEXT;
    v_request_count INTEGER := 0;
    v_profile_status TEXT;
    v_profile_url TEXT;
    v_profile_created_by UUID;
    v_file_name TEXT := NULL;
BEGIN
    -- 1. Check authentication
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to delete profile';
    END IF;

    -- 2. Verify caller role
    SELECT UPPER(r.name)
    INTO v_user_role
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = v_actor_id
    LIMIT 1;

    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'Forbidden: User has no assigned role';
    END IF;

    -- 3. Verify profile exists and get its status, photo URL & creator
    SELECT status::TEXT, "profile_URL", created_by
    INTO v_profile_status, v_profile_url, v_profile_created_by
    FROM public.profiles
    WHERE id = p_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    -- 4. Check permissions:
    -- - HIGH_LEVEL_ADMIN can delete any profile in "New Data" stage
    -- - AGENT can ONLY delete their own profile AND it must be in DRAFT status
    IF v_user_role = 'HIGH_LEVEL_ADMIN' THEN
        -- Admin is authorized
        NULL;
    ELSIF v_user_role = 'AGENT' THEN
        IF v_profile_created_by != v_actor_id THEN
            RAISE EXCEPTION 'Forbidden: Agents can only delete drafts they created';
        END IF;
        IF v_profile_status != 'DRAFT' THEN
            RAISE EXCEPTION 'Forbidden: Agents are only allowed to delete draft profiles';
        END IF;
    ELSE
        RAISE EXCEPTION 'Forbidden: You do not have permission to delete profiles';
    END IF;

    -- 5. Strictly verify profile is in "New Data" stage (0 information_requests)
    SELECT COUNT(*)
    INTO v_request_count
    FROM public.information_requests
    WHERE source_profile_id = p_profile_id;

    IF v_request_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete profile: Only profiles in "New Data" stage (with no submitted requests) can be deleted';
    END IF;

    -- 6. DELETE PROFILE PICTURE FIRST from Supabase Storage (storage.objects)
    IF v_profile_url IS NOT NULL AND v_profile_url != '' THEN
        -- Extract file name after the last slash, strip query parameters
        v_file_name := split_part(split_part(v_profile_url, '?', 1), '/', array_length(string_to_array(split_part(v_profile_url, '?', 1), '/'), 1));
    END IF;

    BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id IN ('Profile_Picture', 'profile_picture')
          AND (
            (v_file_name IS NOT NULL AND name = v_file_name)
            OR name LIKE (p_profile_id::TEXT || '-%')
            OR name LIKE ('%' || p_profile_id::TEXT || '%')
          );
    EXCEPTION WHEN OTHERS THEN
        -- If direct storage.objects deletion encounters permission issues, continue gracefully
    END;

    -- 7. Clean up candidate references in information_releases, match_run_results, matches
    DELETE FROM public.information_releases
    WHERE candidate_profile_id = p_profile_id;

    DELETE FROM public.match_run_results
    WHERE candidate_profile_id = p_profile_id;

    DELETE FROM public.matches
    WHERE male_profile_id = p_profile_id OR female_profile_id = p_profile_id;

    -- 8. Delete profile from public.profiles (PostgreSQL foreign keys CASCADE delete all 17 child tables)
    DELETE FROM public.profiles
    WHERE id = p_profile_id;

    -- 9. Refresh materialized view if procedure exists
    BEGIN
        PERFORM public.refresh_mv_matching_profiles();
    EXCEPTION WHEN OTHERS THEN
        -- Non-fatal if procedure is not present or refresh fails
    END;

    -- 10. Write to audit_logs (skipped for admin or logged according to role)
    IF v_user_role != 'HIGH_LEVEL_ADMIN' THEN
        INSERT INTO public.audit_logs (
            actor_user_id,
            action,
            entity_type,
            entity_id,
            old_data,
            metadata
        )
        VALUES (
            v_actor_id,
            'DELETE',
            'profile',
            p_profile_id,
            jsonb_build_object('profile_id', p_profile_id, 'status', v_profile_status, 'profile_URL', v_profile_url),
            jsonb_build_object('source', 'RPC_DELETE_PROFILE', 'role', v_user_role)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'deleted_profile_id', p_profile_id,
        'profile_URL', v_profile_url
    );
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.rpc_delete_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_profile(UUID, UUID) TO service_role;
