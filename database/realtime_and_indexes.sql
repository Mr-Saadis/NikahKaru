-- =========================================================================
-- Supabase Realtime Publication & Performance Indexes
-- Used by: /agent-requests (vw_agent_requests_board) & ManagerOverview
-- Safe / Idempotent: Can be re-run without errors
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. SUPABASE REALTIME PUBLICATION
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'information_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.information_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'information_request_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.information_request_assignments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'information_releases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.information_releases;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'match_runs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_runs;
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 2. COMPOSITE INDEXES FOR FAST BOARD LOADING & COLUMN LAZY-LOADING
-- -------------------------------------------------------------------------

-- Agent requests board: filter by requested_by + status + sort by created_at DESC
CREATE INDEX IF NOT EXISTS idx_requests_agent_status_created
  ON public.information_requests (requested_by, status, created_at DESC);

-- Manager/general requests board: filter by status + sort by created_at DESC
CREATE INDEX IF NOT EXISTS idx_requests_status_created
  ON public.information_requests (status, created_at DESC);

-- Profiles: "Entries Logged" (NOT EXISTS in information_requests) & agent filter
CREATE INDEX IF NOT EXISTS idx_profiles_agent_created_at
  ON public.profiles (current_agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_created_by_created_at
  ON public.profiles (created_by, created_at DESC);

-- Active request assignments lookup inside vw_agent_requests_board / vw_manager_requests_board
CREATE INDEX IF NOT EXISTS idx_request_assignments_active_lookup
  ON public.information_request_assignments (assigned_to, status, request_id)
  WHERE status = 'ACTIVE';

-- -------------------------------------------------------------------------
-- 3. OPTIONAL TRIGRAM INDEXES FOR FAST ILIKE SEARCH (full_name, cnic, phone)
-- -------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_personal_full_name_trgm
  ON public.personal_information USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_personal_cnic_trgm
  ON public.personal_information USING gin (cnic gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_personal_phone_trgm
  ON public.personal_information USING gin (phone gin_trgm_ops);

