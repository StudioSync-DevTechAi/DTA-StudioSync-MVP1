-- Add isDrafted and drafted_json columns to project_estimation_table
-- This tracks whether a project estimation is still in draft state and stores draft form data

-- Add is_drafted column (boolean flag)
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS is_drafted BOOLEAN NOT NULL DEFAULT false;

-- Add drafted_json column (JSONB to store draft form data)
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS drafted_json JSONB NULL DEFAULT '{}'::jsonb;

-- Add comments to document the columns
COMMENT ON COLUMN public.project_estimation_table.is_drafted IS 
'Indicates whether the project estimation is still in draft state (TRUE) or has been completed/submitted (FALSE). 
Drafts are unfinished projects that have not been fully submitted.';

COMMENT ON COLUMN public.project_estimation_table.drafted_json IS 
'Stores the draft form data as JSON. This includes form fields, event packages, selected format, 
and other draft-specific data that persists across page refreshes and network disconnects. 
Structure: { formData: {...}, eventPackages: [...], selectedFormat: "...", currentPage: 1-3, ... }';

-- Optional: Create an index for better query performance when filtering by draft status
-- This is useful for queries like "SELECT * FROM project_estimation_table WHERE is_drafted = true"
CREATE INDEX IF NOT EXISTS idx_project_estimation_is_drafted 
ON public.project_estimation_table (is_drafted)
WHERE is_drafted = true; -- Partial index (only indexes rows where is_drafted = true, more efficient)

-- Optional: Create a GIN index on drafted_json for efficient JSON queries
-- This allows fast queries on JSONB data within the drafted_json column
CREATE INDEX IF NOT EXISTS idx_project_estimation_drafted_json_gin 
ON public.project_estimation_table USING gin (drafted_json);

