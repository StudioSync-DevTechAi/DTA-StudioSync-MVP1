-- ============================================
-- ADD END_DATE AND END_TIME COLUMNS
-- TO project_estimation_table
-- ============================================

-- Add end_date column (same as start_date)
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS end_date DATE NULL;

-- Add end_time column (same as start_time)
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS end_time TIME WITHOUT TIME ZONE NULL;

-- Add enddatetime_confirmed column (same as confirmed field)
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS enddatetime_confirmed BOOLEAN NULL DEFAULT false;

-- Add project_type column to store the type of project (e.g., wedding, corporate, portrait, etc.)
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS project_type TEXT NULL;

-- Optional: Add a comment to document the columns
COMMENT ON COLUMN public.project_estimation_table.end_date IS 'Project end date';
COMMENT ON COLUMN public.project_estimation_table.end_time IS 'Project end time';
COMMENT ON COLUMN public.project_estimation_table.enddatetime_confirmed IS 'Confirmation status for project end date and time';
COMMENT ON COLUMN public.project_estimation_table.project_type IS 'Type of project (e.g., wedding, corporate, portrait, event, commercial, other)';

-- Optional: Create an index on project_type for better query performance
CREATE INDEX IF NOT EXISTS idx_project_estimation_project_type 
ON public.project_estimation_table (project_type);

-- Optional: Create an index on end_date for better query performance
CREATE INDEX IF NOT EXISTS idx_project_estimation_end_date 
ON public.project_estimation_table (end_date);

-- Optional: Create a composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_project_estimation_date_range 
ON public.project_estimation_table (start_date, end_date);

