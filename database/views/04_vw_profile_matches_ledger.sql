CREATE OR REPLACE VIEW public.vw_profile_matches_ledger AS
SELECT
    -- =========================================================
    -- MATCH
    -- =========================================================
    m.id AS match_id,

    m.male_profile_id,
    male_pi.full_name AS male_profile_name,
    male_p.status AS male_profile_status,
    male_p."profile_URL" AS male_profile_url,

    m.female_profile_id,
    female_pi.full_name AS female_profile_name,
    female_p.status AS female_profile_status,
    female_p."profile_URL" AS female_profile_url,

    m.source_match_run_result_id,

    m.status AS current_status,
    m.final_score,

    m.created_by,
    creator.full_name AS created_by_name,

    m.first_contacted_at,
    m.in_progress_at,
    m.closed_at,

    m.created_at,
    m.updated_at,

    -- =========================================================
    -- STATUS HISTORY
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(h)
                ORDER BY h.created_at DESC
            )
            FROM (
                SELECT
                    sh.id,
                    sh.old_status,
                    sh.new_status,
                    sh.created_at,
                    sh.reason,

                    sh.changed_by,
                    u.full_name AS changed_by_name

                FROM public.match_status_history sh

                LEFT JOIN public.users u
                    ON sh.changed_by = u.id

                WHERE sh.match_id = m.id
            ) h
        ),
        '[]'::jsonb
    ) AS status_history,

    -- =========================================================
    -- FEEDBACK
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(fb)
                ORDER BY fb.created_at DESC
            )
            FROM (
                SELECT
                    f.id,
                    f.feedback_type,

                    f.rejection_reason_id,
                    rr.name_en AS rejection_reason_name_en,
                    rr.name_ur AS rejection_reason_name_ur,

                    f.importance,
                    f.notes,

                    f.provided_by,
                    u.full_name AS provided_by_name,

                    f.created_at

                FROM public.match_feedback f

                LEFT JOIN public.users u
                    ON f.provided_by = u.id

                LEFT JOIN public.rejection_reasons rr
                    ON f.rejection_reason_id = rr.id

                WHERE f.match_id = m.id
            ) fb
        ),
        '[]'::jsonb
    ) AS feedbacks

FROM public.matches m

-- =============================================================
-- MALE PROFILE
-- =============================================================
LEFT JOIN public.profiles male_p
    ON m.male_profile_id = male_p.id

LEFT JOIN public.personal_information male_pi
    ON m.male_profile_id = male_pi.profile_id

-- =============================================================
-- FEMALE PROFILE
-- =============================================================
LEFT JOIN public.profiles female_p
    ON m.female_profile_id = female_p.id

LEFT JOIN public.personal_information female_pi
    ON m.female_profile_id = female_pi.profile_id

-- =============================================================
-- MATCH CREATOR
-- =============================================================
LEFT JOIN public.users creator
    ON m.created_by = creator.id;
