-- ============================================
-- FIX PROJECT_STATUS CONSTRAINT - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This script fixes the project_status constraint violation error
-- Run this in Supabase SQL Editor to update the constraint
-- ============================================

-- Step 1: Update all existing records to use new status values
UPDATE public.project_estimation_table
SET project_status = CASE
  WHEN project_status = 'IN-PROGRESS' THEN 'LEAD-INPROGRESS'
  WHEN project_status = 'YET-TO-START' THEN 'PRE-PROD'
  WHEN project_status = 'STARTED' THEN 'PROD'
  WHEN project_status = 'COMPLETED' THEN 'POST-PROD'
  WHEN project_status = 'DELIVERED' THEN 'DELIVERED'
  WHEN project_status NOT IN ('LEAD-INPROGRESS', 'PRE-PROD', 'PROD', 'POST-PROD', 'DELIVERED') THEN 'PRE-PROD'
  ELSE project_status
END;

-- Step 2: Drop the old constraint
ALTER TABLE public.project_estimation_table
DROP CONSTRAINT IF EXISTS project_estimation_table_project_status_check;

-- Step 3: Update the default value
ALTER TABLE public.project_estimation_table
ALTER COLUMN project_status SET DEFAULT 'PRE-PROD';

-- Step 4: Add the new CHECK constraint
ALTER TABLE public.project_estimation_table
ADD CONSTRAINT project_estimation_table_project_status_check 
CHECK (
  project_status = ANY (
    ARRAY[
      'LEAD-INPROGRESS',
      'PRE-PROD',
      'PROD',
      'POST-PROD',
      'DELIVERED'
    ]
  )
);

-- Step 5: Update the comment
COMMENT ON COLUMN public.project_estimation_table.project_status IS 
'Status of the project estimation. Possible values: LEAD-INPROGRESS, PRE-PROD, PROD, POST-PROD, DELIVERED. Default: PRE-PROD.';

-- Verification: Check that all records have valid status
SELECT 
  project_status, 
  COUNT(*) as count
FROM public.project_estimation_table
GROUP BY project_status
ORDER BY project_status;

