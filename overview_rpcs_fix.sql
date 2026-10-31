-- ============================================================================
-- NikaahKaro Overview RPCs — Fixes & Optimizations
-- File: overview_rpcs_fix.sql
-- 
-- Fixes Identified During Verification Audit (Phase A4):
-- 1. Agent get_agent_overview():
--    - Field paths in `information_release_fields` are stored with table prefixes
--      (e.g., 'personal_information.full_name', 'personal_information.date_of_birth',
--      'profile_locations.current_city_id', 'religion_information.caste_id',
--      'education_records').
--    - In original overview_rpcs.sql, `s.fv ->> 'full_name'` directly looked up unprefixed keys,
--      causing name, age, city, and caste to return NULL even when released by the Manager.
--    - Fix: Normalize field_path by stripping table prefixes in `snap` and handling
--      both prefixed and unprefixed keys, plus fallback to education_records[0].qualification.
--
-- 2. Admin get_admin_overview():
--    - `v_sensitive` array contains ['phone', 'primary_phone', 'cnic', 'disability_details', 'permanent_city_id'].
--    - Direct check `field_path = any(v_sensitive)` failed when field_path is stored as
--      'personal_information.phone' or 'personal_information.cnic'.
--    - Fix: Match against both raw field_path and the suffix (split_part(field_path, '.', -1)).
--
-- 3. PostgREST Schema Cache Reload:
--    - Automatically notify PostgREST at the end of the script so functions appear immediately.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AGENT OVERVIEW
-- ----------------------------------------------------------------------------
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
    -- FIX: Store both raw field_path and normalized base key (e.g. 'full_name' from 'personal_information.full_name')
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

-- ----------------------------------------------------------------------------
-- 2. MANAGER OVERVIEW (p_days: 7 / 30 / 90 / 0 = all time)
-- ----------------------------------------------------------------------------
create or replace function public.get_manager_overview(p_days int default 7, p_sla_hours int default 24)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := case when p_days > 0 then now() - make_interval(days => p_days) else 'epoch'::timestamptz end;
  v_prev  timestamptz := case when p_days > 0 then now() - make_interval(days => p_days * 2) else null end;
begin
  if auth.uid() is null or not (public.has_role('MANAGER') or public.has_role('HIGH_LEVEL_ADMIN')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return (
  with
  reqs as (
    select id, status::text as status, source_profile_id, requested_by, created_at, updated_at, reviewed_at
    from information_requests
  ),
  pending as (select * from reqs where status in ('PENDING','PENDING_OTHER')),
  queue as (
    select p.id as request_id, p.source_profile_id as profile_id, pi.full_name,
           case when pi.date_of_birth is not null then extract(year from age(pi.date_of_birth))::int end as age,
           c.name_en as city, cs.name_en as caste, u.full_name as agent_name,
           round(extract(epoch from now() - p.created_at) / 3600.0, 1) as waiting_hours,
           case when now() - p.created_at > make_interval(hours => p_sla_hours) then 'overdue'
                when now() - p.created_at > make_interval(hours => p_sla_hours / 2) then 'warning'
                else 'fresh' end as sla_state,
           (select count(*) from reqs r2 where r2.source_profile_id = p.source_profile_id) > 1 as is_repeat
    from pending p
    left join personal_information pi on pi.profile_id = p.source_profile_id
    left join profile_locations pl on pl.profile_id = p.source_profile_id
    left join cities c on c.id = pl.current_city_id
    left join religion_information ri on ri.profile_id = p.source_profile_id
    left join castes cs on cs.id = ri.caste_id
    left join users u on u.id = p.requested_by
    order by p.created_at asc
    limit 8
  ),
  workload as (
    select u.id, u.full_name,
      (select count(*) from profiles p where p.current_agent_id = u.id and p.status::text = 'ACTIVE') as active_profiles,
      (select count(*) from profiles p where (p.current_agent_id = u.id or p.created_by = u.id) and p.status::text = 'DRAFT') as drafts,
      (select count(*) from pending r where r.requested_by = u.id) as open_requests
    from users u
    join user_roles ur on ur.user_id = u.id
    join roles ro on ro.id = ur.role_id
    where ro.name = 'AGENT' and u.status::text = 'ACTIVE'
  ),
  stuck as (
    select ir.id as release_id, ir.request_id, ir.released_at,
           extract(day from now() - ir.released_at)::int as days_waiting,
           (select full_name from personal_information where profile_id = r.source_profile_id) as source_name,
           (select full_name from personal_information where profile_id = ir.candidate_profile_id) as candidate_name,
           (select full_name from users where id = r.requested_by) as agent_name
    from information_releases ir
    join reqs r on r.id = ir.request_id
    where ir.release_status::text = 'ACTIVE' and r.status = 'IN_REVIEW'
      and ir.released_at < now() - interval '7 days'
    order by ir.released_at asc
    limit 8
  ),
  hot as (
    select ir.candidate_profile_id, count(distinct ir.request_id) as requests_count,
           (select full_name from personal_information where profile_id = ir.candidate_profile_id) as candidate_name
    from information_releases ir
    where ir.release_status::text = 'ACTIVE'
    group by ir.candidate_profile_id
    having count(distinct ir.request_id) >= 2
    order by 2 desc
    limit 5
  ),
  top_scores as (
    select r.final_score
    from match_run_results r
    join match_runs m on m.id = r.match_run_id
    where r.rank = 1 and r.final_score is not null and m.executed_at >= v_since
  ),
  latest_runs as (
    select distinct on (source_profile_id) id, source_profile_id, executed_at
    from match_runs order by source_profile_id, executed_at desc
  ),
  low_match as (
    select lr.source_profile_id as profile_id,
           (select full_name from personal_information where profile_id = lr.source_profile_id) as full_name,
           lr.executed_at,
           (select count(*) from match_run_results r where r.match_run_id = lr.id) as candidates
    from latest_runs lr
    join profiles p on p.id = lr.source_profile_id and p.status::text = 'ACTIVE'
    where (select count(*) from match_run_results r where r.match_run_id = lr.id) <= 3
    order by 4 asc, lr.executed_at desc
    limit 6
  ),
  orphans as (
    select p.id, (select full_name from personal_information where profile_id = p.id) as full_name
    from profiles p
    left join users u on u.id = p.current_agent_id
    where p.status::text = 'ACTIVE' and (p.current_agent_id is null or u.status::text <> 'ACTIVE')
  )
  select jsonb_build_object(
    'generated_at', now(), 'range_days', p_days, 'sla_hours', p_sla_hours,
    'kpis', jsonb_build_object(
      'pending',              (select count(*) from pending),
      'released_awaiting_agent', (select count(*) from reqs where status = 'IN_REVIEW'),
      'downloaded',           (select count(*) from reqs where status = 'DOWNLOADED'),
      'oldest_waiting_hours', (select round(extract(epoch from now() - min(created_at)) / 3600.0, 1) from pending),
      'overdue',              (select count(*) from pending where now() - created_at > make_interval(hours => p_sla_hours)),
      'completed_in_range',   (select count(*) from reqs where status in ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM') and updated_at >= v_since),
      'releases_in_range',    (select count(*) from information_releases where released_at >= v_since),
      'releases_prev_range',  case when v_prev is null then null
                                   else (select count(*) from information_releases where released_at >= v_prev and released_at < v_since) end,
      'runs_in_range',        (select count(*) from match_runs where executed_at >= v_since),
      'avg_release_hours',    (select round(avg(extract(epoch from reviewed_at - created_at)) / 3600.0, 1)
                               from reqs where reviewed_at is not null and reviewed_at >= v_since)
    ),
    'pipeline', (select coalesce(jsonb_object_agg(request_status, n), '{}'::jsonb)
                 from (select request_status::text as request_status, count(*) as n
                       from vw_manager_requests_board group by 1) t),
    'queue', coalesce((select jsonb_agg(to_jsonb(q) order by q.waiting_hours desc) from queue q), '[]'::jsonb),
    'agent_workload', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'full_name', full_name, 'active_profiles', active_profiles,
               'drafts', drafts, 'open_requests', open_requests,
               'load', case when active_profiles + drafts > 15 then 'OVERLOADED'
                            when active_profiles + drafts > 8 then 'BALANCED' else 'AVAILABLE' end)
               order by active_profiles + drafts desc)
      from workload), '[]'::jsonb),
    'stuck_releases', coalesce((select jsonb_agg(to_jsonb(s)) from stuck s), '[]'::jsonb),
    'hot_candidates', coalesce((select jsonb_agg(to_jsonb(h)) from hot h), '[]'::jsonb),
    'score_quality', jsonb_build_object(
      'excellent', (select count(*) from top_scores where final_score >= 85),
      'good',      (select count(*) from top_scores where final_score >= 70 and final_score < 85),
      'borderline',(select count(*) from top_scores where final_score < 70),
      'avg',       (select round(avg(final_score), 1) from top_scores)
    ),
    'low_match', coalesce((select jsonb_agg(to_jsonb(l)) from low_match l), '[]'::jsonb),
    'orphaned_profiles', jsonb_build_object(
      'count', (select count(*) from orphans),
      'items', coalesce((select jsonb_agg(to_jsonb(o)) from (select * from orphans limit 5) o), '[]'::jsonb)),
    'recent_releases', coalesce((
      select jsonb_agg(jsonb_build_object('release_id', ir.id, 'released_at', ir.released_at,
               'source_name', (select full_name from personal_information where profile_id = r.source_profile_id),
               'candidate_name', (select full_name from personal_information where profile_id = ir.candidate_profile_id),
               'agent_name', (select full_name from users where id = r.requested_by)) order by ir.released_at desc)
      from (select * from information_releases order by released_at desc limit 6) ir
      join reqs r on r.id = ir.request_id), '[]'::jsonb),
    'feedback', jsonb_build_object(
      'tracking_active', exists(select 1 from match_feedback),
      'recent', coalesce((
        select jsonb_agg(jsonb_build_object('type', f.feedback_type::text, 'reason', rr.name_en, 'notes', f.notes,
                 'created_at', f.created_at) order by f.created_at desc)
        from (select * from match_feedback order by created_at desc limit 5) f
        left join rejection_reasons rr on rr.id = f.rejection_reason_id), '[]'::jsonb),
      'top_reasons', coalesce((
        select jsonb_agg(jsonb_build_object('reason', reason, 'n', n) order by n desc)
        from (select rr.name_en as reason, count(*) as n
              from match_feedback f join rejection_reasons rr on rr.id = f.rejection_reason_id
              where f.created_at >= v_since group by 1 order by 2 desc limit 5) t), '[]'::jsonb)
    ),
    'tracking', jsonb_build_object('matches_rows', (select count(*) from matches))
  )
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. ADMIN OVERVIEW (p_days: 7 / 30 / 90 / 0 = all time)
-- ----------------------------------------------------------------------------
create or replace function public.get_admin_overview(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := case when p_days > 0 then now() - make_interval(days => p_days) else 'epoch'::timestamptz end;
  v_prev  timestamptz := case when p_days > 0 then now() - make_interval(days => p_days * 2) else null end;
  v_sensitive text[] := array['phone','primary_phone','cnic','disability_details','permanent_city_id'];
begin
  if auth.uid() is null or not public.has_role('HIGH_LEVEL_ADMIN') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return (
  with
  reqs as (
    select id, status::text as status, source_profile_id, requested_by, reviewed_by, created_at, updated_at, reviewed_at
    from information_requests
  ),
  active_p as (
    select p.id, p.gender::text as gender, pi.date_of_birth, pl.current_city_id
    from profiles p
    left join personal_information pi on pi.profile_id = p.id
    left join profile_locations pl on pl.profile_id = p.id
    where p.status::text = 'ACTIVE'
  ),
  top_cities as (
    select current_city_id from active_p where current_city_id is not null
    group by 1 order by count(*) desc limit 8
  ),
  heat as (
    select c.name_en as city,
           case when a.age < 23 then '18-22' when a.age < 28 then '23-27' when a.age < 33 then '28-32'
                when a.age < 38 then '33-37' else '38+' end as age_bucket,
           a.gender, count(*) as n
    from (select ap.*, extract(year from age(ap.date_of_birth))::int as age from active_p ap
          where ap.date_of_birth is not null) a
    join cities c on c.id = a.current_city_id
    where a.current_city_id in (select current_city_id from top_cities)
    group by 1, 2, 3
  ),
  demand as (
    select v.preferred_city_id as city_id, p.gender::text as g, count(*) as n
    from v_current_matching_preferences v
    join profiles p on p.id = v.profile_id
    where p.status::text = 'ACTIVE' and v.city_importance::text = 'MANDATORY' and v.preferred_city_id is not null
    group by 1, 2
  ),
  supply as (
    select current_city_id as city_id, gender as g, count(*) as n from active_p
    where current_city_id is not null group by 1, 2
  ),
  mandatory as (
    select t.criterion, count(*) as n
    from v_current_matching_preferences v
    join profiles p on p.id = v.profile_id and p.status::text = 'ACTIVE'
    cross join lateral (values
      ('Age', v.age_importance::text), ('Marital status', v.marital_status_importance::text),
      ('Children', v.children_importance::text), ('Height', v.height_importance::text),
      ('Weight', v.weight_importance::text), ('Complexion', v.complexion_importance::text),
      ('Disability', v.disability_importance::text), ('Education', v.education_importance::text),
      ('Occupation', v.occupation_importance::text), ('Employment type', v.employment_type_importance::text),
      ('Income', v.income_importance::text), ('Religion', v.religion_importance::text),
      ('Sect', v.sect_importance::text), ('Caste', v.caste_importance::text),
      ('Religious practice', v.religion_practice_importance::text), ('Country', v.country_importance::text),
      ('Province', v.province_importance::text), ('City', v.city_importance::text),
      ('Family setup', v.family_setup_importance::text), ('Living with', v.living_with_importance::text),
      ('Smoking', v.smoking_importance::text), ('Relocation', v.relocation_importance::text)
    ) as t(criterion, imp)
    where t.imp = 'MANDATORY'
    group by t.criterion
  ),
  latest_runs as (
    select distinct on (source_profile_id) id, source_profile_id, executed_at
    from match_runs order by source_profile_id, executed_at desc
  ),
  low_match as (
    select lr.source_profile_id as profile_id,
           (select full_name from personal_information where profile_id = lr.source_profile_id) as full_name,
           lr.executed_at,
           (select count(*) from match_run_results r where r.match_run_id = lr.id) as candidates
    from latest_runs lr
    join profiles p on p.id = lr.source_profile_id and p.status::text = 'ACTIVE'
    where (select count(*) from match_run_results r where r.match_run_id = lr.id) <= 3
    order by 4 asc, lr.executed_at desc
    limit 6
  ),
  trend as (
    select d::date as week,
      (select count(*) from profiles p where date_trunc('week', p.created_at) = d) as profiles,
      (select count(*) from information_requests r where date_trunc('week', r.created_at) = d) as requests
    from generate_series(date_trunc('week', greatest(v_since, now() - interval '52 weeks')),
                         date_trunc('week', now()), interval '1 week') d
  )
  select jsonb_build_object(
    'generated_at', now(), 'range_days', p_days,
    'kpis', jsonb_build_object(
      'total_profiles',  (select count(*) from profiles),
      'active_profiles', (select count(*) from profiles where status::text = 'ACTIVE'),
      'draft_profiles',  (select count(*) from profiles where status::text = 'DRAFT'),
      'paused_profiles', (select count(*) from profiles where status::text = 'PAUSED'),
      'male_active',     (select count(*) from profiles where status::text = 'ACTIVE' and gender::text = 'MALE'),
      'female_active',   (select count(*) from profiles where status::text = 'ACTIVE' and gender::text = 'FEMALE'),
      'requests_in_range', (select count(*) from reqs where created_at >= v_since),
      'requests_prev_range', case when v_prev is null then null
                                  else (select count(*) from reqs where created_at >= v_prev and created_at < v_since) end,
      'pending_requests', (select count(*) from reqs where status in ('PENDING','PENDING_OTHER')),
      'overdue_requests', (select count(*) from reqs where status in ('PENDING','PENDING_OTHER')
                                                          and now() - created_at > interval '24 hours'),
      'runs_in_range',   (select count(*) from match_runs where executed_at >= v_since),
      'releases_in_range', (select count(*) from information_releases where released_at >= v_since),
      'completed_in_range', (select count(*) from reqs where status in ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM') and updated_at >= v_since),
      'avg_release_hours', (select round(avg(extract(epoch from reviewed_at - created_at)) / 3600.0, 1)
                            from reqs where reviewed_at is not null and reviewed_at >= v_since)
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('stage', 'Registered', 'n', (select count(*) from profiles)),
      jsonb_build_object('stage', 'Active',     'n', (select count(*) from profiles where status::text = 'ACTIVE')),
      jsonb_build_object('stage', 'Requested',  'n', (select count(distinct source_profile_id) from reqs)),
      jsonb_build_object('stage', 'Matched',    'n', (select count(distinct source_profile_id) from match_runs)),
      jsonb_build_object('stage', 'Released',   'n', (select count(distinct r.source_profile_id)
                                                      from information_releases ir join reqs r on r.id = ir.request_id)),
      jsonb_build_object('stage', 'Shared',     'n', (select count(distinct source_profile_id) from reqs
                                                      where status in ('DOWNLOADED','COMPLETED','COMPLETED_OUTSIDE_SYSTEM'))),
      jsonb_build_object('stage', 'Completed',  'n', (select count(distinct source_profile_id) from reqs
                                                      where status in ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM')))
    ),
    'profile_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                       from (select status::text as status, count(*) as n from profiles group by 1) t),
    'trend', coalesce((select jsonb_agg(to_jsonb(t) order by t.week) from trend t), '[]'::jsonb),
    'pool_heatmap', coalesce((select jsonb_agg(to_jsonb(h)) from heat h), '[]'::jsonb),
    'demand_vs_supply', coalesce((
      select jsonb_agg(jsonb_build_object('city', c.name_en,
        'demand_from_males',   coalesce((select n from demand where city_id = c.id and g = 'MALE'), 0),
        'females_available',   coalesce((select n from supply where city_id = c.id and g = 'FEMALE'), 0),
        'demand_from_females', coalesce((select n from demand where city_id = c.id and g = 'FEMALE'), 0),
        'males_available',     coalesce((select n from supply where city_id = c.id and g = 'MALE'), 0)))
      from cities c
      where c.id in (select city_id from (select city_id from demand group by 1 order by sum(n) desc limit 6) x)
    ), '[]'::jsonb),
    'mandatory_criteria', coalesce((select jsonb_agg(jsonb_build_object('criterion', criterion, 'n', n) order by n desc)
                                    from mandatory), '[]'::jsonb),
    'managers', coalesce((
      select jsonb_agg(jsonb_build_object('id', u.id, 'full_name', u.full_name,
        'pending_queue', (select count(*) from reqs where status in ('PENDING','PENDING_OTHER')),
        'releases_approved', (select count(*) from information_releases ir where ir.released_by = u.id and ir.released_at >= v_since),
        'runs', (select count(*) from match_runs m where m.executed_by = u.id and m.executed_at >= v_since),
        'avg_release_hours', (select round(avg(extract(epoch from r.reviewed_at - r.created_at)) / 3600.0, 1)
                              from reqs r where r.reviewed_by = u.id and r.reviewed_at >= v_since)))
      from users u join user_roles ur on ur.user_id = u.id join roles ro on ro.id = ur.role_id
      where ro.name = 'MANAGER' and u.status::text = 'ACTIVE'), '[]'::jsonb),
    'agents', coalesce((
      select jsonb_agg(jsonb_build_object('id', u.id, 'full_name', u.full_name,
        'active_profiles', (select count(*) from profiles p where p.current_agent_id = u.id and p.status::text = 'ACTIVE'),
        'drafts', (select count(*) from profiles p where (p.current_agent_id = u.id or p.created_by = u.id) and p.status::text = 'DRAFT'),
        'profiles_created', (select count(*) from profiles p where p.created_by = u.id and p.created_at >= v_since),
        'requests', (select count(*) from reqs r where r.requested_by = u.id and r.created_at >= v_since),
        'completed', (select count(*) from reqs r where r.requested_by = u.id
                      and r.status in ('COMPLETED','COMPLETED_OUTSIDE_SYSTEM') and r.updated_at >= v_since)))
      from users u join user_roles ur on ur.user_id = u.id join roles ro on ro.id = ur.role_id
      where ro.name = 'AGENT' and u.status::text = 'ACTIVE'), '[]'::jsonb),
    'low_match', coalesce((select jsonb_agg(to_jsonb(l)) from low_match l), '[]'::jsonb),
    'score_distribution', jsonb_build_object(
      'excellent', (select count(*) from match_run_results where rank = 1 and final_score >= 85),
      'good',      (select count(*) from match_run_results where rank = 1 and final_score >= 70 and final_score < 85),
      'borderline',(select count(*) from match_run_results where rank = 1 and final_score < 70)),
    'fields_released', coalesce((
      -- FIX: Match sensitive fields against either the exact field_path or the base field name
      select jsonb_agg(jsonb_build_object(
               'field', field_path,
               'n', n,
               'sensitive', (
                 field_path = any(v_sensitive) or
                 case when position('.' in field_path) > 0 then split_part(field_path, '.', 2) else field_path end = any(v_sensitive)
               )
             ) order by n desc)
      from (select f.field_path, count(*) as n
            from information_release_fields f join information_releases ir on ir.id = f.release_id
            where ir.released_at >= v_since group by 1 order by 2 desc limit 12) t), '[]'::jsonb),
    'users', jsonb_build_object(
      'by_role', coalesce((select jsonb_agg(jsonb_build_object('role', role, 'status', status, 'n', n))
                           from (select ro.name as role, u.status::text as status, count(*) as n
                                 from users u join user_roles ur on ur.user_id = u.id
                                 join roles ro on ro.id = ur.role_id group by 1, 2) t), '[]'::jsonb),
      'agents_inactive_7d', (select count(*) from users u
                             join user_roles ur on ur.user_id = u.id join roles ro on ro.id = ur.role_id
                             left join auth.users au on au.id = u.id
                             where ro.name = 'AGENT' and u.status::text = 'ACTIVE'
                               and (au.last_sign_in_at is null or au.last_sign_in_at < now() - interval '7 days'))
    ),
    'data_quality', jsonb_build_object(
      'active_without_preferences', (select count(*) from profiles p where p.status::text = 'ACTIVE'
          and not exists (select 1 from preference_sets ps where ps.profile_id = p.id and ps.is_current)),
      'stale_drafts_14d', (select count(*) from profiles where status::text = 'DRAFT' and updated_at < now() - interval '14 days'),
      'active_without_agent', (select count(*) from profiles where status::text = 'ACTIVE' and current_agent_id is null),
      'top_other_caste', coalesce((select jsonb_agg(jsonb_build_object('value', v, 'n', n) order by n desc)
          from (select lower(trim(other_caste_text)) as v, count(*) as n from religion_information
                where other_caste_text is not null and trim(other_caste_text) <> '' group by 1 order by 2 desc limit 5) t), '[]'::jsonb)
    ),
    'rejections', jsonb_build_object(
      'tracking_active', exists(select 1 from match_feedback),
      'top_reasons', coalesce((select jsonb_agg(jsonb_build_object('reason', reason, 'n', n) order by n desc)
          from (select rr.name_en as reason, count(*) as n
                from match_feedback f join rejection_reasons rr on rr.id = f.rejection_reason_id
                where f.created_at >= v_since group by 1 order by 2 desc limit 6) t), '[]'::jsonb)
    ),
    'algorithm', jsonb_build_object(
      'versions', coalesce((select jsonb_agg(jsonb_build_object('version', algorithm_version, 'runs', n))
                            from (select algorithm_version, count(*) as n from match_runs group by 1) t), '[]'::jsonb)),
    'tracking', jsonb_build_object('matches_rows', (select count(*) from matches),
                                   'feedback_rows', (select count(*) from match_feedback))
  )
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Permissions & PostgREST Reload
-- ----------------------------------------------------------------------------
revoke all on function public.get_agent_overview()                 from public, anon;
revoke all on function public.get_manager_overview(int, int)       from public, anon;
revoke all on function public.get_admin_overview(int)              from public, anon;
grant execute on function public.get_agent_overview()              to authenticated, service_role;
grant execute on function public.get_manager_overview(int, int)    to authenticated, service_role;
grant execute on function public.get_admin_overview(int)           to authenticated, service_role;

-- Automatically refresh PostgREST Schema Cache
notify pgrst, 'reload config';

