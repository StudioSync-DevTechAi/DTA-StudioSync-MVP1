-- ============================================
-- ADD WORKDAYS COLUMNS TO EVENTS_DETAILS_TABLE
-- ============================================
-- This migration adds Videography_WorkDays and Photography_WorkDays columns
-- ============================================
-- Created: 2025-01-25
-- Purpose: Add workdays tracking for photography and videography
-- ============================================

-- Add Videography_WorkDays column (DECIMAL)
ALTER TABLE public.events_details_table
ADD COLUMN IF NOT EXISTS videography_workdays DECIMAL(5,2) NULL;

-- Add Photography_WorkDays column (DECIMAL)
ALTER TABLE public.events_details_table
ADD COLUMN IF NOT EXISTS photography_workdays DECIMAL(5,2) NULL;

-- Add comments to document the columns
COMMENT ON COLUMN public.events_details_table.videography_workdays IS 
'Number of workdays for videography. Can be a decimal value to represent partial days (e.g., 0.5 for half day, 1.5 for one and a half days).';

COMMENT ON COLUMN public.events_details_table.photography_workdays IS 
'Number of workdays for photography. Can be a decimal value to represent partial days (e.g., 0.5 for half day, 1.5 for one and a half days).';

-- Add check constraints to ensure non-negative values
ALTER TABLE public.events_details_table
ADD CONSTRAINT events_details_table_videography_workdays_check 
CHECK (videography_workdays >= 0);

ALTER TABLE public.events_details_table
ADD CONSTRAINT events_details_table_photography_workdays_check 
CHECK (photography_workdays >= 0);

-- Optional: Create indexes for better query performance if needed
-- CREATE INDEX IF NOT EXISTS idx_events_details_videography_workdays 
-- ON public.events_details_table (videography_workdays);

-- CREATE INDEX IF NOT EXISTS idx_events_details_photography_workdays 
-- ON public.events_details_table (photography_workdays);

