-- Add album_name column to albums_storage_table
-- This allows albums to have a display name for easier identification

-- Add album_name column
ALTER TABLE public.albums_storage_table
ADD COLUMN IF NOT EXISTS album_name TEXT;

-- Create index for faster lookups on album_name
CREATE INDEX IF NOT EXISTS idx_albums_storage_album_name ON public.albums_storage_table(album_name);

-- Add comment to explain the column
COMMENT ON COLUMN public.albums_storage_table.album_name IS 'Display name for the album, used in UI and linking';

-- Update existing albums to have a default name if null
UPDATE public.albums_storage_table
SET album_name = 'Album ' || SUBSTRING(album_id::text, 1, 8)
WHERE album_name IS NULL;

