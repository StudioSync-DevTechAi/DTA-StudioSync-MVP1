-- Fix Sub-Events Table PostgREST Exposure
-- This migration ensures the table is properly exposed to PostgREST API

-- First, verify table exists in public schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'sub_events_list_table'
  ) THEN
    RAISE EXCEPTION 'Table sub_events_list_table does not exist. Please run migration 20250115000005 first.';
  END IF;
END $$;

-- Ensure table is in public schema (not api schema)
-- PostgREST by default exposes public schema, but let's be explicit

-- Grant USAGE on schema (if not already granted)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO public;

-- Ensure table permissions are correct
GRANT SELECT ON public.sub_events_list_table TO authenticated;
GRANT SELECT ON public.sub_events_list_table TO anon;
GRANT SELECT ON public.sub_events_list_table TO public;

-- Ensure function permissions are correct
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO public;

-- Verify RLS is enabled and policy exists
ALTER TABLE public.sub_events_list_table ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the SELECT policy to ensure it's correct
DROP POLICY IF EXISTS "Anyone can view sub events" ON public.sub_events_list_table;

CREATE POLICY "Anyone can view sub events"
  ON public.sub_events_list_table
  FOR SELECT
  USING (is_active = true);

-- Alternative: Create a view in public schema that PostgREST can definitely access
-- This is a workaround if direct table access still doesn't work
CREATE OR REPLACE VIEW public.sub_events_list_view AS
SELECT 
  sub_event_id,
  sub_event_name,
  display_order
FROM public.sub_events_list_table
WHERE is_active = true
ORDER BY display_order ASC, sub_event_name ASC;

-- Grant SELECT on the view
GRANT SELECT ON public.sub_events_list_view TO authenticated;
GRANT SELECT ON public.sub_events_list_view TO anon;
GRANT SELECT ON public.sub_events_list_view TO public;

-- Comment: If table access still fails, use the view instead:
-- SELECT * FROM sub_events_list_view

