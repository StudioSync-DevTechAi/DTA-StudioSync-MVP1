-- ============================================
-- ADD WORKDAYS COLUMNS TO EVENTS_DETAILS_TABLE
-- ============================================
-- This migration adds photography_workdays and videography_workdays columns
-- to the events_details_table
-- ============================================
-- Created: 2025-01-25
-- Purpose: Support workdays tracking for photography and videography
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
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
DROP CONSTRAINT IF EXISTS events_details_table_videography_workdays_check;

ALTER TABLE public.events_details_table
ADD CONSTRAINT events_details_table_videography_workdays_check 
CHECK (videography_workdays IS NULL OR videography_workdays >= 0);

ALTER TABLE public.events_details_table
DROP CONSTRAINT IF EXISTS events_details_table_photography_workdays_check;

ALTER TABLE public.events_details_table
ADD CONSTRAINT events_details_table_photography_workdays_check 
CHECK (photography_workdays IS NULL OR photography_workdays >= 0);

