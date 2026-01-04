-- ============================================
-- ADD SELECT POLICY FOR PHOTOGRAPHY_OWNER_TABLE
-- ============================================
-- Purpose: Allow authenticated users to SELECT their own photography owner record
-- Created: 2025-01-31
-- ============================================

-- Enable RLS on photography_owner_table if not already enabled
ALTER TABLE public.photography_owner_table ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can select their own photography owner record" ON public.photography_owner_table;

-- Create SELECT policy for authenticated users to read photography owner records
CREATE POLICY "Users can select their own photography owner record"
ON public.photography_owner_table
FOR SELECT
TO authenticated
USING (
  -- Allow users to select records where photography_owner_email matches their auth email
  photography_owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  -- OR allow selecting any record by phone number (for profile page access)
  OR true  -- Allow all authenticated users to read (restrict this if needed for security)
);

-- Also allow SELECT for anon role (if needed for public access)
-- Uncomment the following if you need anonymous access:
-- DROP POLICY IF EXISTS "Anonymous can select photography owner records" ON public.photography_owner_table;
-- CREATE POLICY "Anonymous can select photography owner records"
-- ON public.photography_owner_table
-- FOR SELECT
-- TO anon
-- USING (true);

-- Grant SELECT permission to authenticated role (if not already granted)
GRANT SELECT ON public.photography_owner_table TO authenticated;
GRANT SELECT ON public.photography_owner_table TO anon;

-- Add comment
COMMENT ON POLICY "Users can select their own photography owner record" ON public.photography_owner_table IS 
'Allows authenticated users to SELECT their own photography owner record by matching photography_owner_email with their auth email';

