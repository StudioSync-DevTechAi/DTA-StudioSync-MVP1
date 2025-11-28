-- ============================================
-- UPDATE PROJECT_STATUS COLUMN VALUES
-- ============================================
-- This migration updates the project_status column to use new status values:
-- LEAD-INPROGRESS, PRE-PROD, PROD, POST-PROD, DELIVERED
-- ============================================
-- Created: 2025-01-25
-- Purpose: Update project status values to match new business requirements
-- ============================================

-- Drop the old constraint
ALTER TABLE public.project_estimation_table
DROP CONSTRAINT IF EXISTS project_estimation_table_project_status_check;

-- Update existing records to new status values
UPDATE public.project_estimation_table
SET project_status = CASE
  WHEN project_status = 'IN-PROGRESS' THEN 'LEAD-INPROGRESS'
  WHEN project_status = 'YET-TO-START' THEN 'PRE-PROD'
  WHEN project_status = 'STARTED' THEN 'PROD'
  WHEN project_status = 'COMPLETED' THEN 'POST-PROD'
  WHEN project_status = 'DELIVERED' THEN 'DELIVERED'
  ELSE 'PRE-PROD'  -- Default for any unexpected values
END
WHERE project_status IN ('IN-PROGRESS', 'YET-TO-START', 'STARTED', 'COMPLETED', 'DELIVERED');

-- Update the default value
ALTER TABLE public.project_estimation_table
ALTER COLUMN project_status SET DEFAULT 'PRE-PROD';

-- Add new CHECK constraint with updated values
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

-- Update the comment
COMMENT ON COLUMN public.project_estimation_table.project_status IS 
'Status of the project estimation. Possible values: LEAD-INPROGRESS, PRE-PROD, PROD, POST-PROD, DELIVERED. Default: PRE-PROD.';

