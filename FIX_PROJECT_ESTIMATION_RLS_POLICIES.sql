-- ============================================
-- FIX RLS POLICIES FOR PROJECT_ESTIMATION_TABLE
-- ============================================
-- This script checks and creates necessary RLS policies
-- to allow SELECT queries on project_estimation_table
-- ============================================
-- Created: 2025-01-25
-- Purpose: Fix RLS policies blocking project queries
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================

-- Step 1: Check if RLS is enabled on project_estimation_table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'project_estimation_table';

-- Step 2: Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'project_estimation_table';

-- Step 3: Drop existing SELECT policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view project estimations" ON public.project_estimation_table;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.project_estimation_table;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.project_estimation_table;

-- Step 4: Create SELECT policy for authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON public.project_estimation_table
FOR SELECT
TO authenticated
USING (true);

-- Step 5: Create SELECT policy for anon users (if needed for public access)
CREATE POLICY "Enable read access for anon users"
ON public.project_estimation_table
FOR SELECT
TO anon
USING (true);

-- Step 6: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'project_estimation_table'
ORDER BY policyname;

-- Step 7: Also check and fix client_details_table RLS policies
DROP POLICY IF EXISTS "Users can view clients" ON public.client_details_table;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.client_details_table;

CREATE POLICY "Enable read access for authenticated users"
ON public.client_details_table
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for anon users"
ON public.client_details_table
FOR SELECT
TO anon
USING (true);

-- Step 8: Test query (should return rows if data exists)
SELECT COUNT(*) as total_projects 
FROM public.project_estimation_table;

-- If the count is 0, but you know data exists, RLS might still be blocking
-- Try disabling RLS temporarily to test (NOT RECOMMENDED FOR PRODUCTION):
-- ALTER TABLE public.project_estimation_table DISABLE ROW LEVEL SECURITY;

