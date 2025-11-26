-- ============================================
-- ADD PROJECT_STATUS COLUMN TO PROJECT_ESTIMATION_TABLE
-- ============================================
-- This script adds a Project_Status column to track project status
-- with possible values: IN-PROGRESS, YET-TO-START, STARTED, COMPLETED, DELIVERED
-- ============================================
-- Created: 2025-01-25
-- Purpose: Add project status tracking to project_estimation_table
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================

-- Add Project_Status column with CHECK constraint
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS project_status TEXT NOT NULL DEFAULT 'YET-TO-START';

-- Add CHECK constraint to ensure only valid status values
ALTER TABLE public.project_estimation_table
ADD CONSTRAINT project_estimation_table_project_status_check 
CHECK (project_status IN ('IN-PROGRESS', 'YET-TO-START', 'STARTED', 'COMPLETED', 'DELIVERED'));

-- Update all existing records to YET-TO-START (if not already set)
UPDATE public.project_estimation_table
SET project_status = 'YET-TO-START'
WHERE project_status IS NULL OR project_status = '';

-- Create index for better query performance on project_status
CREATE INDEX IF NOT EXISTS idx_project_estimation_project_status 
ON public.project_estimation_table (project_status)
TABLESPACE pg_default;

-- Add comment to document the column
COMMENT ON COLUMN public.project_estimation_table.project_status IS 
'Status of the project estimation. Possible values: IN-PROGRESS, YET-TO-START, STARTED, COMPLETED, DELIVERED. Default: YET-TO-START.';

