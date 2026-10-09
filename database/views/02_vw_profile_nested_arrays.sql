CREATE OR REPLACE VIEW public.vw_profile_nested_arrays AS
SELECT
    p.id AS profile_id,

    -- =========================================================
    -- EDUCATION RECORDS
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(edu)
                ORDER BY edu.is_highest_qualification DESC,
                         edu.end_year DESC NULLS LAST,
                         edu.start_year DESC NULLS LAST
            )
            FROM (
                SELECT
                    e.*,

                    el.name_en AS education_level_name_en,
                    el.name_ur AS education_level_name_ur

                FROM public.education_records e

                LEFT JOIN public.education_levels el
                    ON e.education_level_id = el.id

                WHERE e.profile_id = p.id
            ) edu
        ),
        '[]'::jsonb
    ) AS education_records,

    -- =========================================================
    -- EMPLOYMENT RECORDS
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(emp)
                ORDER BY emp.is_current DESC,
                         emp.start_date DESC NULLS LAST
            )
            FROM (
                SELECT
                    em.*,

                    o.name_en AS occupation_name_en,
                    o.name_ur AS occupation_name_ur

                FROM public.employment_records em

                LEFT JOIN public.occupations o
                    ON em.occupation_id = o.id

                WHERE em.profile_id = p.id
            ) emp
        ),
        '[]'::jsonb
    ) AS employment_records,

    -- =========================================================
    -- PARENTS
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(pr)
                ORDER BY
                    CASE
                        WHEN pr.parent_type = 'FATHER' THEN 1
                        WHEN pr.parent_type = 'MOTHER' THEN 2
                        ELSE 3
                    END
            )
            FROM (
                SELECT
                    parents.*,

                    pc.name_en AS country_name_en,
                    pc.name_ur AS country_name_ur,

                    pcity.name_en AS city_name_en,
                    pcity.name_ur AS city_name_ur

                FROM public.parents

                LEFT JOIN public.countries pc
                    ON parents.country_id = pc.id

                LEFT JOIN public.cities pcity
                    ON parents.city_id = pcity.id

                WHERE parents.profile_id = p.id
            ) pr
        ),
        '[]'::jsonb
    ) AS parents,

    -- =========================================================
    -- SIBLINGS
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(sb)
                ORDER BY sb.age ASC NULLS LAST
            )
            FROM (
                SELECT
                    siblings.*,

                    sc.name_en AS country_name_en,
                    sc.name_ur AS country_name_ur,

                    scity.name_en AS city_name_en,
                    scity.name_ur AS city_name_ur

                FROM public.siblings

                LEFT JOIN public.countries sc
                    ON siblings.country_id = sc.id

                LEFT JOIN public.cities scity
                    ON siblings.city_id = scity.id

                WHERE siblings.profile_id = p.id
            ) sb
        ),
        '[]'::jsonb
    ) AS siblings,

    -- =========================================================
    -- CHILDREN
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(ch)
                ORDER BY ch.age ASC NULLS LAST
            )
            FROM public.children ch
            WHERE ch.profile_id = p.id
        ),
        '[]'::jsonb
    ) AS children,

    -- =========================================================
    -- PREVIOUS MARRIAGES
    -- =========================================================
    COALESCE(
        (
            SELECT jsonb_agg(
                to_jsonb(pm)
                ORDER BY pm.marriage_number ASC
            )
            FROM public.previous_marriages pm
            WHERE pm.profile_id = p.id
        ),
        '[]'::jsonb
    ) AS previous_marriages

FROM public.profiles p;
