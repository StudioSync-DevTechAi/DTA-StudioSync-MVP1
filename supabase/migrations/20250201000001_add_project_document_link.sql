-- ============================================================================
-- ADD project_document_link COLUMN TO project_estimation_table
-- ============================================================================
-- This column stores the Supabase Storage URL for the generated PDF document
-- ============================================================================

-- Add project_document_link column
ALTER TABLE public.project_estimation_table
ADD COLUMN IF NOT EXISTS project_document_link TEXT NULL;

-- Add comment
COMMENT ON COLUMN public.project_estimation_table.project_document_link IS 
  'Supabase Storage URL for the generated project quotation PDF document';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_project_estimation_document_link 
ON public.project_estimation_table(project_document_link) 
WHERE project_document_link IS NOT NULL;

