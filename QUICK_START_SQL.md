# 🚀 Quick Start - Execute These SQL Queries

## Step 1: Copy and Execute This Complete SQL Block

Go to **Supabase Dashboard > SQL Editor > New Query** and paste this entire block:

```sql
-- ============================================================================
-- COMPLETE IMAGE STORAGE SETUP - COPY ALL BELOW
-- ============================================================================

-- Create table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_user_id ON public.image_obj_storage_table(user_id);
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_created_at ON public.image_obj_storage_table(image_create_datetime);
CREATE INDEX IF NOT EXISTS idx_image_obj_storage_uuid ON public.image_obj_storage_table(image_uuid);

-- Enable RLS
ALTER TABLE public.image_obj_storage_table ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can update their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.image_obj_storage_table;

-- Create RLS policies
CREATE POLICY "Users can view their own images"
  ON public.image_obj_storage_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images"
  ON public.image_obj_storage_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
  ON public.image_obj_storage_table FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
  ON public.image_obj_storage_table FOR DELETE
  USING (auth.uid() = user_id);

-- Create helper function
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
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.image_uuid, i.image_obj, i.image_access_url, i.image_create_datetime,
    i.file_name, i.file_size, i.mime_type
  FROM public.image_obj_storage_table i
  WHERE i.image_uuid = img_uuid AND i.user_id = auth.uid();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_image_by_uuid(UUID) TO authenticated;

-- ============================================================================
-- END OF SQL BLOCK
-- ============================================================================
```

## Step 2: Create Storage Bucket

**Via Dashboard (Recommended):**
1. Go to **Storage** in left sidebar
2. Click **New bucket**
3. Name: `images`
4. Public: ✅ Yes
5. File size limit: 50MB
6. Click **Create**

**OR Via SQL:**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 52428800, 
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
```

## Step 3: Verify

Run this test:
```bash
node scripts/test-image-upload.mjs
```

## ✅ Done!

Your image storage system is now ready. Every upload will return:
```json
{
  "Image_UUID": "...",
  "Image_AccessURL": "..."
}
```

