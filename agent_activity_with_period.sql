-- ============================================================================
-- NikaahKaro: Agent Activity RPC with Period & Downloaded Metric
-- File: agent_activity_with_period.sql
-- 
-- Adds:
-- 1. Support for p_period: 'today' | 'yesterday' | 'all' (default: 'today')
-- 2. New metric: 'downloaded' (Dossiers downloaded)
-- 
-- Instructions: Run this script in the Supabase SQL editor.
-- ============================================================================

create or replace function public.get_agent_today_activity(p_period text default 'today')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_period text := coalesce(lower(p_period), 'today');
  v_start timestamptz;
  v_end timestamptz;
  v_display_date timestamptz;
  v_profiles_added int := 0;
  v_drafts_created int := 0;
  v_new_requests int := 0;
  v_second_requests int := 0;
  v_responded int := 0;
  v_downloaded int := 0;
  v_completed int := 0;
  v_total int := 0;
begin
  if v_uid is null or not public.has_role('AGENT') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- Time window based on Asia/Karachi timezone
  if v_period = 'yesterday' then
    v_start := (timezone('Asia/Karachi', now())::date - 1)::timestamp at time zone 'Asia/Karachi';
    v_end := (timezone('Asia/Karachi', now())::date)::timestamp at time zone 'Asia/Karachi';
    v_display_date := v_start;
  elsif v_period = 'all' then
    v_start := '1970-01-01 00:00:00+00'::timestamptz;
    v_end := '9999-12-31 23:59:59+00'::timestamptz;
    v_display_date := now();
  else -- 'today'
    v_start := (timezone('Asia/Karachi', now())::date)::timestamp at time zone 'Asia/Karachi';
    v_end := (timezone('Asia/Karachi', now())::date + 1)::timestamp at time zone 'Asia/Karachi';
    v_display_date := v_start;
  end if;

  -- 1. Profiles added: Completed / active profiles created in window (excluding drafts)
  select count(*) into v_profiles_added
  from profiles p
  where p.created_by = v_uid
    and p.status::text <> 'DRAFT'
    and (v_period = 'all' or (p.created_at >= v_start and p.created_at < v_end));

  -- 2. Drafts created: Incomplete draft registrations created/worked on in window
  select count(*) into v_drafts_created
  from profiles p
  where p.created_by = v_uid
    and p.status::text = 'DRAFT'
    and (
      v_period = 'all'
      or (p.created_at >= v_start and p.created_at < v_end)
      or (p.updated_at >= v_start and p.updated_at < v_end)
    );

  -- 3. Requests sent (First requests): requested_by = me, created_at in window, NO earlier request for same source profile
  select count(*) into v_new_requests
  from information_requests r
  where r.requested_by = v_uid
    and (v_period = 'all' or (r.created_at >= v_start and r.created_at < v_end))
    and not exists (
      select 1 from information_requests earlier
      where earlier.source_profile_id = r.source_profile_id
        and earlier.created_at < r.created_at
    );

  -- 4. Second requests: requested_by = me, created_at in window, earlier request exists for same source profile
  select count(*) into v_second_requests
  from information_requests r
  where r.requested_by = v_uid
    and (v_period = 'all' or (r.created_at >= v_start and r.created_at < v_end))
    and exists (
      select 1 from information_requests earlier
      where earlier.source_profile_id = r.source_profile_id
        and earlier.created_at < r.created_at
    );

  -- 5. Manager responded: my requests with reviewed_at in window
  select count(*) into v_responded
  from information_requests r
  where (
    r.requested_by = v_uid
    or exists (
      select 1 from information_request_assignments a
      where a.request_id = r.id and a.assigned_to = v_uid and a.status::text = 'ACTIVE'
    )
  )
  and (v_period = 'all' or (r.reviewed_at >= v_start and r.reviewed_at < v_end));

  -- 6. Downloaded: my requests with status DOWNLOADED in window
  select count(*) into v_downloaded
  from information_requests r
  where (
    r.requested_by = v_uid
    or exists (
      select 1 from information_request_assignments a
      where a.request_id = r.id and a.assigned_to = v_uid and a.status::text = 'ACTIVE'
    )
  )
  and r.status::text = 'DOWNLOADED'
  and (v_period = 'all' or (r.updated_at >= v_start and r.updated_at < v_end));

  -- 7. Completed: my requests with status COMPLETED / COMPLETED_OUTSIDE_SYSTEM in window
  select count(*) into v_completed
  from information_requests r
  where (
    r.requested_by = v_uid
    or exists (
      select 1 from information_request_assignments a
      where a.request_id = r.id and a.assigned_to = v_uid and a.status::text = 'ACTIVE'
    )
  )
  and r.status::text in ('COMPLETED', 'COMPLETED_OUTSIDE_SYSTEM')
  and (v_period = 'all' or (r.updated_at >= v_start and r.updated_at < v_end));

  v_total := v_profiles_added + v_drafts_created + v_new_requests + v_second_requests + v_responded + v_downloaded + v_completed;

  return jsonb_build_object(
    'period', v_period,
    'day_start', v_display_date,
    'total', v_total,
    'items', jsonb_build_array(
      jsonb_build_object('key', 'profiles_added', 'label', 'Profiles added', 'count', v_profiles_added),
      jsonb_build_object('key', 'drafts_created', 'label', 'Drafts created', 'count', v_drafts_created),
      jsonb_build_object('key', 'new_requests', 'label', 'Requests sent', 'count', v_new_requests),
      jsonb_build_object('key', 'second_requests', 'label', 'Second requests', 'count', v_second_requests),
      jsonb_build_object('key', 'responded', 'label', 'Manager responded', 'count', v_responded),
      jsonb_build_object('key', 'downloaded', 'label', 'Dossiers downloaded', 'count', v_downloaded),
      jsonb_build_object('key', 'completed', 'label', 'Completed', 'count', v_completed)
    )
  );
end;
$$;

revoke all on function public.get_agent_today_activity(text) from public, anon;
grant execute on function public.get_agent_today_activity(text) to authenticated, service_role;
notify pgrst, 'reload schema';

