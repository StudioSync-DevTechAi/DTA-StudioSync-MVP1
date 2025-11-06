-- Add Project_ImageObjects_JSON column to project_details_table
-- This column stores a comprehensive JSON object containing project images, albums, and metadata

-- Add project_imageobjects_json column as JSONB
ALTER TABLE public.project_details_table
ADD COLUMN IF NOT EXISTS project_imageobjects_json JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_project_details_imageobjects_json ON public.project_details_table USING GIN(project_imageobjects_json);

-- Add comment to explain the column
COMMENT ON COLUMN public.project_details_table.project_imageobjects_json IS 'JSON object containing project images, albums (keyed by Album_ID), input fields, and state statuses';

-- Create function to validate JSON structure (optional, for data integrity)
CREATE OR REPLACE FUNCTION public.validate_project_imageobjects_json(json_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Basic validation: check if it's a valid JSON object
  IF json_data IS NULL OR json_data::text = 'null' THEN
    RETURN false;
  END IF;
  
  -- Check if it's an object (not array or primitive)
  IF jsonb_typeof(json_data) != 'object' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Add check constraint to ensure valid JSON (optional)
-- ALTER TABLE public.project_details_table
-- ADD CONSTRAINT check_valid_imageobjects_json 
-- CHECK (validate_project_imageobjects_json(project_imageobjects_json));

