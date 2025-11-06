-- Add album_ids array column to project_details_table
-- This allows projects to reference multiple albums

-- Add album_ids column as UUID array
ALTER TABLE public.project_details_table
ADD COLUMN IF NOT EXISTS album_ids UUID[] DEFAULT '{}';

-- Create index for faster lookups on album_ids array
CREATE INDEX IF NOT EXISTS idx_project_details_album_ids ON public.project_details_table USING GIN(album_ids);

-- Add comment to explain the column
COMMENT ON COLUMN public.project_details_table.album_ids IS 'Array of album_id UUIDs from albums_storage_table that are linked to this project';

-- Create function to add album_id to project's album_ids array
CREATE OR REPLACE FUNCTION public.add_album_to_project(
  p_project_main_event_id UUID,
  p_album_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.project_details_table
  SET 
    album_ids = array_append(COALESCE(album_ids, '{}'), p_album_id),
    project_last_modified = now(),
    updated_at = now()
  WHERE project_main_event_id = p_project_main_event_id
    AND (album_ids IS NULL OR NOT (p_album_id = ANY(album_ids)));
  
  RETURN FOUND;
END;
$$;

-- Create function to remove album_id from project's album_ids array
CREATE OR REPLACE FUNCTION public.remove_album_from_project(
  p_project_main_event_id UUID,
  p_album_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.project_details_table
  SET 
    album_ids = array_remove(COALESCE(album_ids, '{}'), p_album_id),
    project_last_modified = now(),
    updated_at = now()
  WHERE project_main_event_id = p_project_main_event_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_album_to_project(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_album_to_project(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.remove_album_from_project(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_album_from_project(UUID, UUID) TO anon;


