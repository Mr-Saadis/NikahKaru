CREATE OR REPLACE VIEW public.vw_profile_active_preferences AS
SELECT
    ps.profile_id,
    ps.id AS preference_set_id,
    ps.version,
    ps.created_by AS preference_created_by,
    ps.created_at AS preference_created_at,

    -- =========================================================
    -- BASIC
    -- =========================================================
    row_to_json(bp) AS basic,

    -- =========================================================
    -- PHYSICAL
    -- =========================================================
    row_to_json(pp) AS physical,

    -- =========================================================
    -- EDUCATION
    -- =========================================================
    row_to_json(ep) AS education,

    -- =========================================================
    -- PROFESSION
    -- =========================================================
    row_to_json(prof) AS profession,

    -- =========================================================
    -- RELIGION
    -- =========================================================
    row_to_json(rp) AS religion,

    -- =========================================================
    -- LOCATION
    -- =========================================================
    row_to_json(lp) AS location,

    -- =========================================================
    -- FAMILY
    -- =========================================================
    row_to_json(fp) AS family,

    -- =========================================================
    -- LIFESTYLE
    -- =========================================================
    row_to_json(life) AS lifestyle,

    -- =========================================================
    -- RELOCATION
    -- =========================================================
    row_to_json(relo) AS relocation

FROM public.preference_sets ps

-- =============================================================
-- BASIC
-- =============================================================
LEFT JOIN public.basic_preferences bp
    ON ps.id = bp.preference_set_id

-- =============================================================
-- PHYSICAL
-- =============================================================
LEFT JOIN public.physical_preferences pp
    ON ps.id = pp.preference_set_id

-- =============================================================
-- EDUCATION + LOOKUP
-- =============================================================
LEFT JOIN (
    SELECT
        ep.*,

        el.name_en AS minimum_education_level_name_en,
        el.name_ur AS minimum_education_level_name_ur

    FROM public.education_preferences ep

    LEFT JOIN public.education_levels el
        ON ep.minimum_education_level_id = el.id
) ep
    ON ps.id = ep.preference_set_id

-- =============================================================
-- PROFESSION + LOOKUP
-- =============================================================
LEFT JOIN (
    SELECT
        prof.*,

        o.name_en AS preferred_occupation_name_en,
        o.name_ur AS preferred_occupation_name_ur

    FROM public.profession_preferences prof

    LEFT JOIN public.occupations o
        ON prof.preferred_occupation_id = o.id
) prof
    ON ps.id = prof.preference_set_id

-- =============================================================
-- RELIGION + LOOKUPS
-- =============================================================
LEFT JOIN (
    SELECT
        rp.*,

        r.name_en AS religion_name_en,
        r.name_ur AS religion_name_ur,

        s.name_en AS sect_name_en,
        s.name_ur AS sect_name_ur,

        c.name_en AS caste_name_en,
        c.name_ur AS caste_name_ur

    FROM public.religion_preferences rp

    LEFT JOIN public.religions r
        ON rp.religion_id = r.id

    LEFT JOIN public.sects s
        ON rp.sect_id = s.id

    LEFT JOIN public.castes c
        ON rp.caste_id = c.id
) rp
    ON ps.id = rp.preference_set_id

-- =============================================================
-- LOCATION + LOOKUPS
-- =============================================================
LEFT JOIN (
    SELECT
        lp.*,

        country.name_en AS country_name_en,
        country.name_ur AS country_name_ur,

        province.name_en AS province_name_en,
        province.name_ur AS province_name_ur,

        city.name_en AS city_name_en,
        city.name_ur AS city_name_ur

    FROM public.location_preferences lp

    LEFT JOIN public.countries country
        ON lp.country_id = country.id

    LEFT JOIN public.provinces province
        ON lp.province_id = province.id

    LEFT JOIN public.cities city
        ON lp.city_id = city.id
) lp
    ON ps.id = lp.preference_set_id

-- =============================================================
-- FAMILY
-- =============================================================
LEFT JOIN public.family_preferences fp
    ON ps.id = fp.preference_set_id

-- =============================================================
-- LIFESTYLE
-- =============================================================
LEFT JOIN public.lifestyle_preferences life
    ON ps.id = life.preference_set_id

-- =============================================================
-- RELOCATION + LOOKUPS
-- =============================================================
LEFT JOIN (
    SELECT
        relo.*,

        country.name_en AS country_name_en,
        country.name_ur AS country_name_ur,

        province.name_en AS province_name_en,
        province.name_ur AS province_name_ur,

        city.name_en AS city_name_en,
        city.name_ur AS city_name_ur

    FROM public.relocation_preferences relo

    LEFT JOIN public.countries country
        ON relo.country_id = country.id

    LEFT JOIN public.provinces province
        ON relo.province_id = province.id

    LEFT JOIN public.cities city
        ON relo.city_id = city.id
) relo
    ON ps.id = relo.preference_set_id

WHERE ps.is_current = true;
