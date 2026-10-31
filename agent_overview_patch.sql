-- ============================================================================
-- NikaahKaro: Agent Overview Drafts Missing Array Patch
-- File: agent_overview_patch.sql
-- 
-- Description:
-- Adds `'missing', to_jsonb(missing)` inside the `drafts` jsonb_build_object
-- so the Agent overview UI can accurately tick completed steps and compute
-- the first missing step.
--
-- Instructions: Run this script directly in the Supabase SQL editor.
-- ============================================================================

create or replace function public.get_agent_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('AGENT') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return (
  with
  my_profiles as (
    select p.id, p.status::text as status, p.gender::text as gender, p.created_at, p.updated_at
    from profiles p
    where p.created_by = v_uid or p.current_agent_id = v_uid
  ),
  prof as (
    select mp.*,
      coalesce((select pi.full_name from personal_information pi where pi.profile_id = mp.id), '-') as full_name,
      exists(select 1 from preference_sets ps where ps.profile_id = mp.id and ps.is_current) as has_prefs,
      array_remove(array[
        case when not exists(select 1 from personal_information x where x.profile_id = mp.id) then 'Personal' end,
        case when not exists(select 1 from physical_information x where x.profile_id = mp.id) then 'Physical' end,
        case when not (exists(select 1 from education_records x where x.profile_id = mp.id)
                    or exists(select 1 from employment_records x where x.profile_id = mp.id)) then 'Education & Profession' end,
        case when not exists(select 1 from religion_information x where x.profile_id = mp.id) then 'Religion' end,
        case when not (exists(select 1 from profile_locations x where x.profile_id = mp.id)
                   and exists(select 1 from residency_information x where x.profile_id = mp.id)) then 'Location & Residency' end,
        case when not exists(select 1 from family_information x where x.profile_id = mp.id) then 'Family' end,
        case when not exists(select 1 from lifestyle_information x where x.profile_id = mp.id) then 'Lifestyle' end,
        case when not exists(select 1 from preference_sets x where x.profile_id = mp.id and x.is_current) then 'Preferences' end
      ], null) as missing
    from my_profiles mp
  ),
  my_reqs as (
    select r.id, r.status::text as status, r.source_profile_id, r.requested_by, r.created_at, r.updated_at,
           r.reviewed_at, r.reviewed_by
    from information_requests r
    where r.requested_by = v_uid
       or exists (select 1 from information_request_assignments a
                  where a.request_id = r.id and a.assigned_to = v_uid and a.status::text = 'ACTIVE')
  ),
  rel as (
    select ir.id, ir.request_id, ir.candidate_profile_id, ir.match_run_result_id, ir.released_by,
           ir.released_at, ir.expires_at, r.status as request_status
    from information_releases ir
    join my_reqs r on r.id = ir.request_id
    where ir.release_status::text = 'ACTIVE'
  ),
  rel10 as (select * from rel order by released_at desc limit 10),
  snap as (
    -- Store both raw field_path and normalized base key (e.g. 'full_name' from 'personal_information.full_name')
    select f.release_id,
           jsonb_object_agg(
             case when position('.' in f.field_path) > 0
                  then split_part(f.field_path, '.', 2)
                  else f.field_path end,
             f.field_value
           ) || jsonb_object_agg(f.field_path, f.field_value) as fv
    from information_release_fields f
    where f.release_id in (select id from rel10)
    group by f.release_id
  ),
  -- SECURITY: only fields from the Manager-approved snapshot, never live candidate profile tables
  ready as (
    select r.id as release_id, r.request_id, r.candidate_profile_id, r.released_at, r.request_status,
           coalesce(s.fv ->> 'full_name', s.fv ->> 'personal_information.full_name') as full_name,
           case when coalesce(s.fv ->> 'date_of_birth', s.fv ->> 'personal_information.date_of_birth') ~ '^\d{4}-\d{2}-\d{2}'
                then extract(year from age(left(coalesce(s.fv ->> 'date_of_birth', s.fv ->> 'personal_information.date_of_birth'), 10)::date))::int end as age,
           ci.name_en as city,
           ca.name_en as caste,
           coalesce(
             el.name_en,
             case when jsonb_typeof(s.fv -> 'education_records') = 'array'
                  then s.fv -> 'education_records' -> 0 ->> 'qualification' end
           ) as education,
           mrr.final_score as score,
           (select u.full_name from users u where u.id = r.released_by) as released_by_name
    from rel10 r
    left join snap s on s.release_id = r.id
    left join cities ci on ci.id = case
      when coalesce(s.fv ->> 'current_city_id', s.fv ->> 'profile_locations.current_city_id') ~ '^\d+$'
      then (coalesce(s.fv ->> 'current_city_id', s.fv ->> 'profile_locations.current_city_id'))::bigint end
    left join castes ca on ca.id = case
      when coalesce(s.fv ->> 'caste_id', s.fv ->> 'religion_information.caste_id') ~ '^\d+$'
      then (coalesce(s.fv ->> 'caste_id', s.fv ->> 'religion_information.caste_id'))::bigint end
    left join education_levels el on el.id = case
      when coalesce(s.fv ->> 'education_level_id', s.fv ->> 'education_records.education_level_id') ~ '^\d+$'
      then (coalesce(s.fv ->> 'education_level_id', s.fv ->> 'education_records.education_level_id'))::bigint end
    left join match_run_results mrr on mrr.id = r.match_run_result_id
    order by r.released_at desc
  ),
  att as (
    select 1 as prio, 'release_ready' as kind, r.id as entity_id, r.source_profile_id as profile_id,
           coalesce(r.reviewed_at, r.updated_at) as since
    from my_reqs r where r.status = 'IN_REVIEW'
    union all
    select 2, 'assigned_to_you', a.request_id, r.source_profile_id, a.assigned_at
    from information_request_assignments a
    join information_requests r on r.id = a.request_id
    where a.assigned_to = v_uid and a.status::text = 'ACTIVE' and r.requested_by <> v_uid
      and a.assigned_at > now() - interval '7 days'
    union all
    select 3, 'no_preferences', id, id, updated_at from prof where status = 'ACTIVE' and not has_prefs
    union all
    select 4, 'stale_draft', id, id, updated_at from prof
    where status = 'DRAFT' and updated_at < now() - interval '7 days'
    union all
    select 5, 'ready_to_request', id, id, updated_at from prof
    where status = 'ACTIVE' and has_prefs
      and not exists (select 1 from information_requests x where x.source_profile_id = prof.id)
  )
  select jsonb_build_object(
    'generated_at', now(),
    'kpis', jsonb_build_object(
      'assigned_profiles',   (select count(*) from prof where status = 'ACTIVE'),
      'drafts_pending',      (select count(*) from prof where status = 'DRAFT'),
      'released_for_client', (select count(*) from rel),
      'shared_with_family',  (select count(*) from my_reqs where status = 'DOWNLOADED'),
      'open_requests',       (select count(*) from my_reqs where status in ('PENDING','PENDING_OTHER')),
      'awaiting_download',   (select count(*) from my_reqs where status = 'IN_REVIEW'),
      'completed_this_month',(select count(*) from my_reqs
                              where status in ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM')
                                and updated_at >= date_trunc('month', now()))
    ),
    'pipeline', jsonb_build_object(
      'with_manager', (select count(*) from my_reqs where status in ('PENDING','PENDING_OTHER')),
      'ready',        (select count(*) from my_reqs where status = 'IN_REVIEW'),
      'downloaded',   (select count(*) from my_reqs where status = 'DOWNLOADED'),
      'completed',    (select count(*) from my_reqs where status in ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM'))
    ),
    'attention', coalesce((
      select jsonb_agg(jsonb_build_object('kind', a.kind, 'entity_id', a.entity_id, 'profile_id', a.profile_id,
               'profile_name', coalesce(pn.full_name, '-'), 'since', a.since) order by a.prio, a.since)
      from (select * from att order by prio, since limit 15) a
      left join prof pn on pn.id = a.profile_id
    ), '[]'::jsonb),
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'full_name', full_name, 'gender', gender, 'status', status,
               'completion_pct', round(100 * (8 - cardinality(missing)) / 8.0), 'steps_done', 8 - cardinality(missing),
               'steps_total', 8, 'missing', to_jsonb(missing), 'has_preferences', has_prefs, 'updated_at', updated_at)
               order by updated_at desc)
      from (select * from prof order by updated_at desc limit 25) x
    ), '[]'::jsonb),
    'drafts', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'full_name', full_name, 'gender', gender,
               'completion_pct', round(100 * (8 - cardinality(missing)) / 8.0), 'steps_done', 8 - cardinality(missing),
               'steps_total', 8, 'next_step', missing[1], 'missing', to_jsonb(missing), 'updated_at', updated_at) order by updated_at desc)
      from (select * from prof where status = 'DRAFT' order by updated_at desc limit 5) x
    ), '[]'::jsonb),
    'ready_for_delivery', coalesce((select jsonb_agg(to_jsonb(r) order by r.released_at desc) from ready r), '[]'::jsonb),
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'status', r.status, 'created_at', r.created_at,
               'profile_id', r.source_profile_id,
               'profile_name', (select pi.full_name from personal_information pi where pi.profile_id = r.source_profile_id),
               'reviewed_by_name', (select u.full_name from users u where u.id = r.reviewed_by))
               order by r.created_at desc)
      from (select * from my_reqs order by created_at desc limit 10) r
    ), '[]'::jsonb),
    'tracking', jsonb_build_object(
      'matches_active', (select count(*) from matches m
                         join prof p on p.id in (m.male_profile_id, m.female_profile_id)
                         where m.status::text = 'IN_PROGRESS')
    )
  )
  );
end;
$$;

revoke all on function public.get_agent_overview() from public, anon;
grant execute on function public.get_agent_overview() to authenticated;
notify pgrst, 'reload schema';

