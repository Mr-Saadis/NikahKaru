CREATE OR REPLACE FUNCTION refresh_mv_matching_profiles()
RETURNS void AS $$
BEGIN
  -- We can use CONCURRENTLY because the schema has a unique index on profile_id
  -- This prevents the view from being locked during the refresh
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_matching_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
