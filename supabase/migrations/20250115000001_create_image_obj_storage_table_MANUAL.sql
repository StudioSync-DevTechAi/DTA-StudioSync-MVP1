-- ============================================================================
-- MANUAL SQL QUERIES FOR IMAGE_OBJ_STORAGE_TABLE SETUP
-- ============================================================================
-- Copy and paste these queries into Supabase Dashboard > SQL Editor
-- Execute them one by one or all at once
-- ============================================================================

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.image_obj_storage_table (
  image_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_obj TEXT NOT NULL,
  image_access_url TEXT NOT NULL,
  image_create_datetime TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_user_id ON public.image_obj_storage_table(user_id);
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_created_at ON public.image_obj_storage_table(image_create_datetime);
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_uuid ON public.image_obj_storage_table(image_uuid);

-- Step 3: Enable RLS
ALTER TABLE public.image_obj_storage_table ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can update their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.image_obj_storage_table;

-- Step 5: Create RLS policies
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

-- Step 6: Create helper function
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

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_image_by_uuid(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================================

-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'image_obj_storage_table';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'image_obj_storage_table'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'image_obj_storage_table';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'image_obj_storage_table';

