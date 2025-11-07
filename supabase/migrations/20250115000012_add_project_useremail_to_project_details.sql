-- Add Project_UserEmail column to project_details_table
-- This column stores the authenticated user's email ID for filtering user-specific projects

-- Add project_useremail column as TEXT
ALTER TABLE public.project_details_table
ADD COLUMN IF NOT EXISTS project_useremail TEXT;

-- Create index for faster lookups on project_useremail
CREATE INDEX IF NOT EXISTS idx_project_details_useremail ON public.project_details_table(project_useremail);

-- Add comment to explain the column
COMMENT ON COLUMN public.project_details_table.project_useremail IS 'Email address of the authenticated user who created the project. Used for filtering user-specific projects.';

-- Update existing rows to populate project_useremail from auth.users if possible
-- This is a one-time migration for existing data
UPDATE public.project_details_table pdt
SET project_useremail = au.email
FROM auth.users au
WHERE pdt.user_id = au.id
  AND pdt.project_useremail IS NULL;

