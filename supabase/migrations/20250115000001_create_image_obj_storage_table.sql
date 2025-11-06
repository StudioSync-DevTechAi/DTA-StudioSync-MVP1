-- Create unified Image Object Storage Table
-- This table stores metadata for all uploaded images across the application
CREATE TABLE IF NOT EXISTS public.image_obj_storage_table (
  image_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_obj TEXT NOT NULL, -- Storage path in Supabase Storage bucket
  image_access_url TEXT NOT NULL, -- Public access URL
  image_create_datetime TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Additional metadata (optional but recommended)
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_user_id ON public.image_obj_storage_table(user_id);
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_created_at ON public.image_obj_storage_table(image_create_datetime);
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_uuid ON public.image_obj_storage_table(image_uuid);

-- Enable RLS
ALTER TABLE public.image_obj_storage_table ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can update their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.image_obj_storage_table;

-- RLS Policies
CREATE POLICY "Users can view their own images"
  ON public.image_obj_storage_table
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images"
  ON public.image_obj_storage_table
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
  ON public.image_obj_storage_table
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
  ON public.image_obj_storage_table
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to get image by UUID
CREATE OR REPLACE FUNCTION public.get_image_by_uuid(img_uuid UUID)
RETURNS TABLE (
  image_uuid UUID,
  image_obj TEXT,
  image_access_url TEXT,
  image_create_datetime TIMESTAMP WITH TIME ZONE,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.image_uuid,
    i.image_obj,
    i.image_access_url,
    i.image_create_datetime,
    i.file_name,
    i.file_size,
    i.mime_type
  FROM public.image_obj_storage_table i
  WHERE i.image_uuid = img_uuid
    AND i.user_id = auth.uid();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_image_by_uuid(UUID) TO authenticated;

