-- Add DELETE policy for albums_storage_table if it doesn't exist
-- This allows users to delete their own albums

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete their own albums" ON public.albums_storage_table;

-- Create DELETE policy
-- Users can delete albums that belong to their projects
CREATE POLICY "Users can delete their own albums"
  ON public.albums_storage_table
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_details_table pdt
      WHERE pdt.project_main_event_id = albums_storage_table.project_main_event_id
      AND pdt.user_id = auth.uid()
    )
  );

-- Grant DELETE permission to authenticated users (if not already granted)
GRANT DELETE ON public.albums_storage_table TO authenticated;

COMMENT ON POLICY "Users can delete their own albums" ON public.albums_storage_table IS 
'Allows users to delete albums that belong to their projects';

