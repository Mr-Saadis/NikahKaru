-- ============================================================================
-- NikaahKaro: Agent Today's Activity RPC
-- File: get_agent_today_activity.sql
-- 
-- Returns the 5 today's activity metrics for the logged-in Agent in Asia/Karachi time.
-- Shape: { day_start: timestamptz, total: number, items: [ {key, label, count} x5 ] }
--
-- Instructions: Run this script in the Supabase SQL editor.
-- ============================================================================

create or replace function public.get_agent_today_activity()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today_start timestamptz;
  v_profiles_added int;
  v_new_requests int;
  v_second_requests int;
  v_responded int;
  v_completed int;
  v_total int;
begin
  if v_uid is null or not public.has_role('AGENT') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- Asia/Karachi day start (00:00:00 PKT)
  v_today_start := (timezone('Asia/Karachi', now())::date)::timestamp at time zone 'Asia/Karachi';

  -- 1. Profiles added: profiles.created_by = me AND profiles.created_at >= start of today
  select count(*) into v_profiles_added
  from profiles p
  where p.created_by = v_uid
    and p.created_at >= v_today_start;

  -- 2. Requests sent (First requests): requested_by = me, created_at today, NO earlier request for same source profile
  select count(*) into v_new_requests
  from information_requests r
  where r.requested_by = v_uid
    and r.created_at >= v_today_start
    and not exists (
      select 1 from information_requests earlier
      where earlier.source_profile_id = r.source_profile_id
        and earlier.created_at < r.created_at
    );

  -- 3. Second requests: requested_by = me, created_at today, earlier request exists for same source profile
  select count(*) into v_second_requests
  from information_requests r
  where r.requested_by = v_uid
    and r.created_at >= v_today_start
    and exists (
      select 1 from information_requests earlier
      where earlier.source_profile_id = r.source_profile_id
        and earlier.created_at < r.created_at
    );

  -- 4. Manager responded: my requests with reviewed_at today
  select count(*) into v_responded
  from information_requests r
  where (
    r.requested_by = v_uid
    or exists (
      select 1 from information_request_assignments a
      where a.request_id = r.id and a.assigned_to = v_uid and a.status::text = 'ACTIVE'
    )
  )
  and r.reviewed_at >= v_today_start;

  -- 5. Completed: my requests with status COMPLETED / COMPLETED_OUTSIDE_SYSTEM and updated_at today
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
  and r.updated_at >= v_today_start;

  v_total := v_profiles_added + v_new_requests + v_second_requests + v_responded + v_completed;

  return jsonb_build_object(
    'day_start', v_today_start,
    'total', v_total,
    'items', jsonb_build_array(
      jsonb_build_object('key', 'profiles_added', 'label', 'Profiles added', 'count', v_profiles_added),
      jsonb_build_object('key', 'new_requests', 'label', 'Requests sent', 'count', v_new_requests),
      jsonb_build_object('key', 'second_requests', 'label', 'Second requests', 'count', v_second_requests),
      jsonb_build_object('key', 'responded', 'label', 'Manager responded', 'count', v_responded),
      jsonb_build_object('key', 'completed', 'label', 'Completed', 'count', v_completed)
    )
  );
end;
$$;

revoke all on function public.get_agent_today_activity() from public, anon;
grant execute on function public.get_agent_today_activity() to authenticated;
notify pgrst, 'reload schema';

