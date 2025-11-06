-- Verification and Fix Script for Sub-Events Table
-- Run this script to verify table exists and fix any exposure issues

-- Step 1: Verify table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'sub_events_list_table'
  ) THEN
    RAISE EXCEPTION 'Table sub_events_list_table does not exist in public schema. Please run migration 20250115000005 first.';
  ELSE
    RAISE NOTICE '✓ Table sub_events_list_table exists';
  END IF;
END $$;

-- Step 2: Ensure schema permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO public;

-- Step 3: Grant table permissions explicitly
GRANT SELECT ON public.sub_events_list_table TO authenticated;
GRANT SELECT ON public.sub_events_list_table TO anon;
GRANT SELECT ON public.sub_events_list_table TO public;

-- Step 4: Ensure RLS is properly configured
ALTER TABLE public.sub_events_list_table ENABLE ROW LEVEL SECURITY;

-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS "Anyone can view sub events" ON public.sub_events_list_table;

CREATE POLICY "Anyone can view sub events"
  ON public.sub_events_list_table
  FOR SELECT
  USING (is_active = true);

-- Step 5: Create a simple view as backup access method
DROP VIEW IF EXISTS public.sub_events_list_view CASCADE;

CREATE VIEW public.sub_events_list_view AS
SELECT 
  sub_event_id,
  sub_event_name,
  display_order
FROM public.sub_events_list_table
WHERE is_active = true
ORDER BY display_order ASC, sub_event_name ASC;

-- Grant SELECT on view
GRANT SELECT ON public.sub_events_list_view TO authenticated;
GRANT SELECT ON public.sub_events_list_view TO anon;
GRANT SELECT ON public.sub_events_list_view TO public;

-- Step 6: Ensure function exists and has correct permissions
DROP FUNCTION IF EXISTS public.get_active_sub_events() CASCADE;

CREATE OR REPLACE FUNCTION public.get_active_sub_events()
RETURNS TABLE (
  sub_event_id UUID,
  sub_event_name TEXT,
  display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.sub_event_id,
    s.sub_event_name,
    s.display_order
  FROM public.sub_events_list_table s
  WHERE s.is_active = true
  ORDER BY s.display_order ASC, s.sub_event_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_sub_events() TO public;

-- Step 7: Verify data exists
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.sub_events_list_table WHERE is_active = true;
  
  IF row_count = 0 THEN
    RAISE NOTICE '⚠ No active sub-events found. Inserting default values...';
    
    INSERT INTO public.sub_events_list_table (sub_event_name, display_order, is_active)
    VALUES
      ('Engagement', 1, true),
      ('Bridal Shower', 2, true),
      ('Reception', 3, true),
      ('Mehendi and Sangeet', 4, true)
    ON CONFLICT (sub_event_name) DO NOTHING;
    
    RAISE NOTICE '✓ Default sub-events inserted';
  ELSE
    RAISE NOTICE '✓ Found % active sub-events', row_count;
  END IF;
END $$;

-- Step 8: Test queries
SELECT 'Table access test:' as test_type, COUNT(*) as count FROM public.sub_events_list_table WHERE is_active = true;
SELECT 'View access test:' as test_type, COUNT(*) as count FROM public.sub_events_list_view;
SELECT 'Function access test:' as test_type, COUNT(*) as count FROM public.get_active_sub_events();

-- Final verification message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification Complete!';
  RAISE NOTICE 'If you still get 406 errors, check:';
  RAISE NOTICE '1. Supabase Dashboard > Settings > API > Exposed schemas includes "public"';
  RAISE NOTICE '2. PostgREST is running and configured correctly';
  RAISE NOTICE '3. Table is visible in Supabase Dashboard > Table Editor';
  RAISE NOTICE '========================================';
END $$;

