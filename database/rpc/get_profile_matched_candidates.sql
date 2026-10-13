-- =======================================================================
-- RPC: get_profile_matched_candidates
-- Returns ONLY the required display data for a source profile's matches:
-- - Candidate ID, name, DOB/age, city ID/name, profile URL
-- - Final match score and rank
-- - Sanitized score breakdowns: ONLY criterion_code and raw_score
-- Guarantees zero sensitive data or internal scoring leak.
-- =======================================================================

CREATE OR REPLACE FUNCTION public.get_profile_matched_candidates(
    p_source_profile_id UUID
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
    -- Require authenticated user
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'candidate_profile_id', v.candidate_profile_id,
                'candidate_profile_name', v.candidate_profile_name,
                'candidate_profile_url', v.candidate_profile_url,
                'candidate_dob', c.date_of_birth,
                'candidate_city_id', c.current_city_id,
                'candidate_city_name', ct.name_en,
                'rank', v.rank,
                'final_score', v.final_score,
                'score_breakdowns', COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'criterion_code', elem->>'criterion_code',
                                'raw_score', (elem->>'raw_score')::numeric
                            )
                        )
                        FROM jsonb_array_elements(v.score_breakdowns) elem
                        WHERE (elem->>'direction') = v.source_gender
                           OR (elem->>'direction') = 'SOURCE_TO_CANDIDATE'
                    ),
                    '[]'::jsonb
                )
            )
            ORDER BY v.executed_at DESC, v.rank ASC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.vw_profile_match_results v
    LEFT JOIN public.vw_profile_core c
        ON c.profile_id = v.candidate_profile_id
    LEFT JOIN public.cities ct
        ON ct.id = c.current_city_id
    WHERE v.source_profile_id = p_source_profile_id;

    RETURN v_result;
END;
$function$;
