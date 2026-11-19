-- ============================================================
-- Migration: Multi-Location and Multi-Relocation Preferences
-- Date: 2026-11-19
-- ============================================================

BEGIN;

-- 1. Create Child Table: preferred_locations
CREATE TABLE IF NOT EXISTS public.preferred_locations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    preference_set_id uuid NOT NULL REFERENCES public.preference_sets(id) ON DELETE CASCADE,
    country_id        bigint NOT NULL REFERENCES public.countries(id) ON DELETE RESTRICT,
    province_id       bigint REFERENCES public.provinces(id) ON DELETE RESTRICT,
    city_id           bigint REFERENCES public.cities(id) ON DELETE RESTRICT,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_preferred_locations_set ON public.preferred_locations(preference_set_id);
CREATE INDEX IF NOT EXISTS idx_preferred_locations_city ON public.preferred_locations(city_id);
CREATE INDEX IF NOT EXISTS idx_preferred_locations_country ON public.preferred_locations(country_id);

-- 2. Create Child Table: preferred_relocations
CREATE TABLE IF NOT EXISTS public.preferred_relocations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    preference_set_id uuid NOT NULL REFERENCES public.preference_sets(id) ON DELETE CASCADE,
    country_id        bigint NOT NULL REFERENCES public.countries(id) ON DELETE RESTRICT,
    province_id       bigint REFERENCES public.provinces(id) ON DELETE RESTRICT,
    city_id           bigint REFERENCES public.cities(id) ON DELETE RESTRICT,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_preferred_relocations_set ON public.preferred_relocations(preference_set_id);
CREATE INDEX IF NOT EXISTS idx_preferred_relocations_city ON public.preferred_relocations(city_id);
CREATE INDEX IF NOT EXISTS idx_preferred_relocations_country ON public.preferred_relocations(country_id);

-- 3. Migrate existing data from parent tables into child tables
INSERT INTO public.preferred_locations (preference_set_id, country_id, province_id, city_id)
SELECT preference_set_id, country_id, province_id, city_id
FROM public.location_preferences
WHERE country_id IS NOT NULL;

INSERT INTO public.preferred_relocations (preference_set_id, country_id, province_id, city_id)
SELECT preference_set_id, country_id, province_id, city_id
FROM public.relocation_preferences
WHERE country_id IS NOT NULL;

-- 4. Drop dependent views prior to altering parent columns
DROP VIEW IF EXISTS public.v_current_matching_preferences CASCADE;
DROP VIEW IF EXISTS public.vw_profile_active_preferences CASCADE;

-- 5. Drop single-value foreign key columns from location_preferences & relocation_preferences
ALTER TABLE public.location_preferences
    DROP COLUMN IF EXISTS country_id,
    DROP COLUMN IF EXISTS province_id,
    DROP COLUMN IF EXISTS city_id;

ALTER TABLE public.relocation_preferences
    DROP COLUMN IF EXISTS country_id,
    DROP COLUMN IF EXISTS province_id,
    DROP COLUMN IF EXISTS city_id;

-- 6. Recreate View: v_current_matching_preferences with aggregated locations
CREATE OR REPLACE VIEW public.v_current_matching_preferences AS
SELECT
    ps.id AS preference_set_id,
    ps.profile_id,
    ps.version,

    -- Basic Preferences
    bp.min_age,
    bp.max_age,
    bp.age_importance,
    bp.preferred_marital_status,
    bp.marital_status_importance,
    bp.children_allowed,
    bp.children_importance,
    bp.preferred_gender,
    bp.gender_importance,

    -- Physical Preferences
    pp.min_height_cm,
    pp.max_height_cm,
    pp.height_importance,
    pp.min_weight_kg,
    pp.max_weight_kg,
    pp.weight_importance,
    pp.preferred_complexion,
    pp.complexion_importance,
    pp.disability_allowed,
    pp.disability_importance,
    pp.beard_preference,
    pp.beard_importance,
    pp.hijab_preference,
    pp.hijab_importance,

    -- Education Preferences
    ep.minimum_education_level_id,
    ep.education_importance,
    ep.preferred_field_of_study,
    ep.field_importance,

    -- Profession Preferences
    prop.preferred_occupation_id,
    prop.occupation_importance,
    prop.preferred_employment_type,
    prop.employment_type_importance,
    prop.minimum_monthly_income,
    prop.maximum_monthly_income,
    prop.income_importance,

    -- Religion Preferences
    rp.religion_id AS preferred_religion_id,
    rp.religion_importance,
    rp.sect_id AS preferred_sect_id,
    rp.sect_importance,
    rp.caste_id AS preferred_caste_id,
    rp.caste_importance,
    rp.religious_practice AS preferred_religious_practice,
    rp.religious_practice_importance AS religion_practice_importance,

    -- Location Preferences (Importance & Details + JSON array of preferred locations)
    lp.country_importance,
    lp.province_importance,
    lp.city_importance,
    lp.location_details,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'country_id', pl.country_id,
            'province_id', pl.province_id,
            'city_id', pl.city_id
        )) FROM public.preferred_locations pl WHERE pl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_locations,

    -- Family Preferences
    fp.family_setup AS preferred_family_setup,
    fp.family_setup_importance,
    fp.living_with AS preferred_living_with,
    fp.living_with_importance,
    fp.parents_status_preference,
    fp.parents_status_importance,

    -- Lifestyle Preferences
    lsp.smoking AS preferred_smoking,
    lsp.smoking_importance,
    lsp.religious_practice AS preferred_lifestyle_religious_practice,
    lsp.religious_practice_importance AS lifestyle_religious_practice_importance,
    lsp.beard_preference AS preferred_lifestyle_beard,
    lsp.beard_importance AS lifestyle_beard_importance,
    lsp.hijab_preference AS preferred_lifestyle_hijab,
    lsp.hijab_importance AS lifestyle_hijab_importance,

    -- Relocation Preferences (Importance & Flag + JSON array of preferred relocations)
    rlp.willing_to_relocate_required,
    rlp.relocation_importance,
    rlp.country_importance AS relocation_country_importance,
    rlp.province_importance AS relocation_province_importance,
    rlp.city_importance AS relocation_city_importance,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'country_id', prl.country_id,
            'province_id', prl.province_id,
            'city_id', prl.city_id
        )) FROM public.preferred_relocations prl WHERE prl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_relocations

FROM public.preference_sets ps
LEFT JOIN public.basic_preferences bp ON bp.preference_set_id = ps.id
LEFT JOIN public.physical_preferences pp ON pp.preference_set_id = ps.id
LEFT JOIN public.education_preferences ep ON ep.preference_set_id = ps.id
LEFT JOIN public.profession_preferences prop ON prop.preference_set_id = ps.id
LEFT JOIN public.religion_preferences rp ON rp.preference_set_id = ps.id
LEFT JOIN public.location_preferences lp ON lp.preference_set_id = ps.id
LEFT JOIN public.family_preferences fp ON fp.preference_set_id = ps.id
LEFT JOIN public.lifestyle_preferences lsp ON lsp.preference_set_id = ps.id
LEFT JOIN public.relocation_preferences rlp ON rlp.preference_set_id = ps.id
WHERE ps.is_current = TRUE;

-- 7. Recreate View: vw_profile_active_preferences with section objects and multi-locations
CREATE OR REPLACE VIEW public.vw_profile_active_preferences AS
SELECT
    ps.profile_id,
    ps.id AS preference_set_id,
    ps.version,
    ps.is_current,
    ps.created_by AS preference_created_by,
    ps.created_at AS preference_created_at,

    -- basic
    CASE WHEN bp.preference_set_id IS NOT NULL THEN row_to_json(bp.*) ELSE NULL END AS basic,

    -- physical
    CASE WHEN pp.preference_set_id IS NOT NULL THEN row_to_json(pp.*) ELSE NULL END AS physical,

    -- education
    CASE WHEN ep.preference_set_id IS NOT NULL THEN row_to_json(ep.*) ELSE NULL END AS education,

    -- profession
    CASE WHEN prop.preference_set_id IS NOT NULL THEN row_to_json(prop.*) ELSE NULL END AS profession,

    -- religion
    CASE WHEN rp.preference_set_id IS NOT NULL THEN row_to_json(rp.*) ELSE NULL END AS religion,

    -- location (importance + preferred_locations array)
    CASE WHEN lp.preference_set_id IS NOT NULL THEN
        json_build_object(
            'preference_set_id', lp.preference_set_id,
            'country_importance', lp.country_importance,
            'province_importance', lp.province_importance,
            'city_importance', lp.city_importance,
            'location_details', lp.location_details,
            'created_at', lp.created_at,
            'preferred_locations', COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', pl.id,
                    'country_id', pl.country_id,
                    'province_id', pl.province_id,
                    'city_id', pl.city_id
                )) FROM public.preferred_locations pl WHERE pl.preference_set_id = ps.id),
                '[]'::json
            )
        )
    ELSE NULL END AS location,

    -- family
    CASE WHEN fp.preference_set_id IS NOT NULL THEN row_to_json(fp.*) ELSE NULL END AS family,

    -- lifestyle
    CASE WHEN lsp.preference_set_id IS NOT NULL THEN row_to_json(lsp.*) ELSE NULL END AS lifestyle,

    -- relocation (importance + flag + preferred_relocations array)
    CASE WHEN rlp.preference_set_id IS NOT NULL THEN
        json_build_object(
            'preference_set_id', rlp.preference_set_id,
            'willing_to_relocate_required', rlp.willing_to_relocate_required,
            'relocation_importance', rlp.relocation_importance,
            'country_importance', rlp.country_importance,
            'province_importance', rlp.province_importance,
            'city_importance', rlp.city_importance,
            'created_at', rlp.created_at,
            'preferred_relocations', COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', prl.id,
                    'country_id', prl.country_id,
                    'province_id', prl.province_id,
                    'city_id', prl.city_id
                )) FROM public.preferred_relocations prl WHERE prl.preference_set_id = ps.id),
                '[]'::json
            )
        )
    ELSE NULL END AS relocation,

    -- Top-level arrays for direct queries
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', pl.id,
            'country_id', pl.country_id,
            'province_id', pl.province_id,
            'city_id', pl.city_id
        )) FROM public.preferred_locations pl WHERE pl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_locations,

    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', prl.id,
            'country_id', prl.country_id,
            'province_id', prl.province_id,
            'city_id', prl.city_id
        )) FROM public.preferred_relocations prl WHERE prl.preference_set_id = ps.id),
        '[]'::json
    ) AS preferred_relocations

FROM public.preference_sets ps
LEFT JOIN public.basic_preferences bp ON bp.preference_set_id = ps.id
LEFT JOIN public.physical_preferences pp ON pp.preference_set_id = ps.id
LEFT JOIN public.education_preferences ep ON ep.preference_set_id = ps.id
LEFT JOIN public.profession_preferences prop ON prop.preference_set_id = ps.id
LEFT JOIN public.religion_preferences rp ON rp.preference_set_id = ps.id
LEFT JOIN public.location_preferences lp ON lp.preference_set_id = ps.id
LEFT JOIN public.family_preferences fp ON fp.preference_set_id = ps.id
LEFT JOIN public.lifestyle_preferences lsp ON lsp.preference_set_id = ps.id
LEFT JOIN public.relocation_preferences rlp ON rlp.preference_set_id = ps.id
WHERE ps.is_current = TRUE;

-- 8. Enable RLS and Policies for new child tables
ALTER TABLE public.preferred_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferred_relocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read preferred_locations"
    ON public.preferred_locations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated write preferred_locations"
    ON public.preferred_locations FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read preferred_relocations"
    ON public.preferred_relocations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated write preferred_relocations"
    ON public.preferred_relocations FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 9. Grant table and view permissions to standard roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferred_locations TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferred_relocations TO authenticated, anon;
GRANT SELECT ON public.v_current_matching_preferences TO authenticated, anon;
GRANT SELECT ON public.vw_profile_active_preferences TO authenticated, anon;

COMMIT;
