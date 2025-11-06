# Image Storage SQL Queries - Ready to Execute

Copy and paste these queries into **Supabase Dashboard > SQL Editor** and execute them.

## 🗄️ Query 1: Create Image Storage Table

```sql
-- Create unified Image Object Storage Table
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can update their own images" ON public.image_obj_storage_table;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.image_obj_storage_table;

-- Create RLS policies
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_image_by_uuid(UUID) TO authenticated;
```

## 🪣 Query 2: Create Storage Bucket (if not exists)

**Note:** Storage buckets are usually created via Dashboard, but you can try this SQL:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## ✅ Query 3: Verify Setup

Run these to verify everything is set up correctly:

```sql
-- Check table exists
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

-- Check if bucket exists
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'images';
```

## 📝 Execution Order

1. **First**: Run Query 1 (Create Table)
2. **Second**: Create bucket via Dashboard OR run Query 2
3. **Third**: Run Query 3 (Verify)

## 🚨 Troubleshooting

### If table creation fails:
- Check if you have admin permissions
- Verify you're in the correct database
- Check for existing table conflicts

### If bucket creation fails:
- Use Dashboard method instead (Storage > New Bucket)
- Verify storage is enabled in your Supabase project

### If policies fail:
- Make sure RLS is enabled on the table first
- Check that you're using the correct schema (`public`)

## 📍 File Locations

- Migration file: `supabase/migrations/20250115000001_create_image_obj_storage_table.sql`
- Manual SQL: `supabase/migrations/20250115000001_create_image_obj_storage_table_MANUAL.sql`
- Storage bucket SQL: `supabase/migrations/20250115000002_create_images_storage_bucket.sql`

