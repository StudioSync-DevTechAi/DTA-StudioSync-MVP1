-- ============================================
-- ADD PHOTOGRAPHY OWNER ESTIMATES LIST
-- ============================================
-- Purpose: Add column to store list of project_estimation_uuids for each photography owner
-- Created: 2025-01-25
-- ============================================

-- Add project_estimation_uuids_list_json column to photography_owner_table
ALTER TABLE public.photography_owner_table
ADD COLUMN IF NOT EXISTS project_estimation_uuids_list_json JSONB NULL DEFAULT '[]'::jsonb;

-- Add comment to the column
COMMENT ON COLUMN public.photography_owner_table.project_estimation_uuids_list_json IS 
'Array of project_estimation_uuid values indicating all estimates created and saved by this photography owner';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_photography_owner_estimates_list 
ON public.photography_owner_table USING GIN (project_estimation_uuids_list_json);

