CREATE OR REPLACE VIEW public.vw_profile_core AS
SELECT
    -- =========================================================
    -- PROFILE
    -- =========================================================
    p.id AS profile_id,
    p.gender,
    p.status,
    p.created_by,
    p.current_agent_id,
    p.created_at,
    p.updated_at,
    p.archived_at,
    p."profile_URL" AS profile_url,

    u_created.full_name AS created_by_name,
    u_created.email AS created_by_email,

    u_agent.full_name AS current_agent_name,
    u_agent.email AS current_agent_email,

    -- =========================================================
    -- PERSONAL INFORMATION
    -- =========================================================
    pi.full_name,
    pi.date_of_birth,
    pi.marital_status,
    pi.number_of_children,
    pi.cnic,
    pi.phone,

    pi.nationality_country_id,
    nationality.name_en AS nationality_country_name_en,
    nationality.name_ur AS nationality_country_name_ur,

    pi.mother_tongue_id,
    mt.name_en AS mother_tongue_name_en,
    mt.name_ur AS mother_tongue_name_ur,

    -- =========================================================
    -- PHYSICAL INFORMATION
    -- =========================================================
    phy.height_cm,
    phy.weight_kg,
    phy.complexion,
    phy.has_disability,
    phy.disability_details,

    -- =========================================================
    -- RELIGION INFORMATION
    -- =========================================================
    rel.religion_id,
    r.name_en AS religion_name_en,
    r.name_ur AS religion_name_ur,

    rel.sect_id,
    s.name_en AS sect_name_en,
    s.name_ur AS sect_name_ur,

    rel.caste_id,
    c.name_en AS caste_name_en,
    c.name_ur AS caste_name_ur,

    rel.other_caste_text,

    -- =========================================================
    -- CURRENT LOCATION
    -- =========================================================
    loc.current_country_id,
    current_country.name_en AS current_country_name_en,
    current_country.name_ur AS current_country_name_ur,

    loc.current_province_id,
    current_province.name_en AS current_province_name_en,
    current_province.name_ur AS current_province_name_ur,

    loc.current_city_id,
    current_city.name_en AS current_city_name_en,
    current_city.name_ur AS current_city_name_ur,

    loc.current_location_text,

    -- =========================================================
    -- PERMANENT LOCATION
    -- =========================================================
    loc.permanent_country_id,
    permanent_country.name_en AS permanent_country_name_en,
    permanent_country.name_ur AS permanent_country_name_ur,

    loc.permanent_province_id,
    permanent_province.name_en AS permanent_province_name_en,
    permanent_province.name_ur AS permanent_province_name_ur,

    loc.permanent_city_id,
    permanent_city.name_en AS permanent_city_name_en,
    permanent_city.name_ur AS permanent_city_name_ur,

    loc.permanent_location_text,

    -- =========================================================
    -- RESIDENCY
    -- =========================================================
    res.house_status,
    res.property_type,
    res.family_setup,
    res.living_with,
    res.living_with_other_details,

    -- =========================================================
    -- INCOME
    -- =========================================================
    inc.monthly_income_min,
    inc.monthly_income_max,
    inc.currency_code,
    inc.income_period,

    -- =========================================================
    -- FAMILY INFORMATION
    -- =========================================================
    fam.family_profession_business,
    fam.social_background,
    fam.family_values,
    fam.family_introduction,
    fam.important_family_circumstances,
    fam.additional_details AS family_additional_details,

    -- =========================================================
    -- LIFESTYLE
    -- =========================================================
    life.beard,
    life.hijab,
    life.religious_practice,
    life.smoking,
    life.other_lifestyle_information

FROM public.profiles p

-- Profile creators / agents
LEFT JOIN public.users u_created
    ON p.created_by = u_created.id

LEFT JOIN public.users u_agent
    ON p.current_agent_id = u_agent.id

-- Personal
LEFT JOIN public.personal_information pi
    ON p.id = pi.profile_id

LEFT JOIN public.countries nationality
    ON pi.nationality_country_id = nationality.id

LEFT JOIN public.mother_tongues mt
    ON pi.mother_tongue_id = mt.id

-- Physical
LEFT JOIN public.physical_information phy
    ON p.id = phy.profile_id

-- Religion
LEFT JOIN public.religion_information rel
    ON p.id = rel.profile_id

LEFT JOIN public.religions r
    ON rel.religion_id = r.id

LEFT JOIN public.sects s
    ON rel.sect_id = s.id

LEFT JOIN public.castes c
    ON rel.caste_id = c.id

-- Locations
LEFT JOIN public.profile_locations loc
    ON p.id = loc.profile_id

LEFT JOIN public.countries current_country
    ON loc.current_country_id = current_country.id

LEFT JOIN public.provinces current_province
    ON loc.current_province_id = current_province.id

LEFT JOIN public.cities current_city
    ON loc.current_city_id = current_city.id

LEFT JOIN public.countries permanent_country
    ON loc.permanent_country_id = permanent_country.id

LEFT JOIN public.provinces permanent_province
    ON loc.permanent_province_id = permanent_province.id

LEFT JOIN public.cities permanent_city
    ON loc.permanent_city_id = permanent_city.id

-- Residency
LEFT JOIN public.residency_information res
    ON p.id = res.profile_id

-- Income
LEFT JOIN public.income_information inc
    ON p.id = inc.profile_id

-- Family
LEFT JOIN public.family_information fam
    ON p.id = fam.profile_id

-- Lifestyle
LEFT JOIN public.lifestyle_information life
    ON p.id = life.profile_id;
