-- ============================================
-- ADD ESTIMATE FORM DATA COLUMN
-- ============================================
-- Purpose: Add a jsonb column to store estimate form data
-- Created: 2025-01-25
-- ============================================

-- Add estimate_form_data column to project_estimation_table
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS estimate_form_data JSONB NULL DEFAULT '{}'::jsonb;

-- Add comment to the column
COMMENT ON COLUMN public.project_estimation_table.estimate_form_data IS 
'Stores the complete estimate form data including client details, services, packages, deliverables, portfolio links, and template selection';

-- Add index for better query performance (optional, for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_project_estimation_estimate_form_data 
ON public.project_estimation_table USING GIN (estimate_form_data);

