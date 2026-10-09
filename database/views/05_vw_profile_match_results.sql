CREATE OR REPLACE VIEW public.vw_profile_match_results AS
SELECT
    -- =========================================================
    -- MATCH RUN
    -- =========================================================
    mr.id AS match_run_id,

    mr.source_profile_id,

    source_pi.full_name AS source_profile_name,
    source_p.gender AS source_gender,
    source_p.status AS source_profile_status,

    mr.preference_set_id,
    ps.version AS preference_version,

    mr.executed_by,
    executor.full_name AS executed_by_name,

    mr.algorithm_version,
    mr.candidate_limit,
    mr.candidates_considered,
    mr.candidates_after_hard_filter,
    mr.executed_at,
    mr.metadata,

    -- =========================================================
    -- RESULT
    -- =========================================================
    mrr.id AS match_run_result_id,

    mrr.candidate_profile_id,

    candidate_pi.full_name AS candidate_profile_name,
    candidate_p.gender AS candidate_gender,
    candidate_p.status AS candidate_profile_status,

    candidate_p."profile_URL" AS candidate_profile_url,

    mrr.rank,

    mrr.source_to_candidate_score,
    mrr.candidate_to_source_score,
    mrr.final_score,

    mrr.passed_hard_filter,
    mrr.created_at AS result_created_at,

    -- =========================================================
    -- SCORE BREAKDOWN
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(sb)
                ORDER BY sb.direction, sb.criterion_code
            )
            FROM (
                SELECT
                    msb.id,

                    msb.direction,
                    msb.criterion_code,

                    msb.candidate_value,
                    msb.preferred_value,

                    msb.importance,
                    msb.match_mode,

                    msb.raw_score,
                    msb.weight,
                    msb.weighted_score,

                    msb.passed_hard_filter,
                    msb.explanation,

                    msb.algorithm_version,
                    msb.created_at

                FROM public.match_score_breakdowns msb

                WHERE msb.match_run_result_id = mrr.id
            ) sb
        ),
        '[]'::jsonb
    ) AS score_breakdowns

FROM public.match_runs mr

-- =============================================================
-- PREFERENCE VERSION
-- =============================================================
LEFT JOIN public.preference_sets ps
    ON mr.preference_set_id = ps.id

-- =============================================================
-- SOURCE PROFILE
-- =============================================================
LEFT JOIN public.profiles source_p
    ON mr.source_profile_id = source_p.id

LEFT JOIN public.personal_information source_pi
    ON mr.source_profile_id = source_pi.profile_id

-- =============================================================
-- EXECUTED BY
-- =============================================================
LEFT JOIN public.users executor
    ON mr.executed_by = executor.id

-- =============================================================
-- RESULT
-- =============================================================
LEFT JOIN public.match_run_results mrr
    ON mr.id = mrr.match_run_id

-- =============================================================
-- CANDIDATE PROFILE
-- =============================================================
LEFT JOIN public.profiles candidate_p
    ON mrr.candidate_profile_id = candidate_p.id

LEFT JOIN public.personal_information candidate_pi
    ON mrr.candidate_profile_id = candidate_pi.profile_id;
