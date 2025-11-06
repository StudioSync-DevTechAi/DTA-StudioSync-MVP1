# Image Storage Setup Guide

This guide will help you set up the unified image storage system for your application.

## 📋 Prerequisites

1. Supabase project with admin access
2. Supabase CLI installed (optional, for Edge Functions)
3. Storage bucket creation access

## 🗄️ Step 1: Create Database Table

Execute this SQL in your Supabase Dashboard > SQL Editor:

```sql
-- Create unified Image Object Storage Table
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
```

## 🪣 Step 2: Create Storage Bucket

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `images`
4. **Public bucket**: ✅ Yes (if you want public URLs)
5. **File size limit**: 50MB (or your preference)
6. Click **Create bucket**

### Option B: Via SQL

```sql
-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for images bucket
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

## ⚡ Step 3: Deploy Edge Function (Optional but Recommended)

### Via Supabase CLI

```bash
# Make sure you're linked to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy upload-image

# Set environment variables
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Environment Variables Needed

In Supabase Dashboard > Edge Functions > upload-image > Settings:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (found in Settings > API)

## ✅ Step 4: Verify Setup

Run the connection test script:

```bash
node scripts/check-supabase-connection.mjs
```

Or test manually:

```typescript
import { uploadImageDirect } from '@/services/imageUpload/imageUploadService';

const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const result = await uploadImageDirect({ file });

console.log('Image_UUID:', result.Image_UUID);
console.log('Image_AccessURL:', result.Image_AccessURL);
```

## 🔍 Troubleshooting

### Error: "Storage bucket 'images' not found"

**Solution:** Create the bucket using Step 2 above.

### Error: "Image storage table not found"

**Solution:** Run the SQL migration from Step 1.

### Error: "Not authenticated"

**Solution:** Make sure user is logged in before uploading.

### Error: "File size exceeds 10MB limit"

**Solution:** Either reduce file size or update `MAX_FILE_SIZE` in `imageUploadService.ts`.

### Edge Function returns 401 Unauthorized

**Solution:** 
1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Verify the function is deployed: `supabase functions list`
3. Check function logs: `supabase functions logs upload-image`

## 📊 Database Schema

The `image_obj_storage_table` structure:

| Column | Type | Description |
|--------|------|-------------|
| `image_uuid` | UUID (PK) | Unique identifier for the image |
| `image_obj` | TEXT | Storage path in Supabase Storage |
| `image_access_url` | TEXT | Public access URL |
| `image_create_datetime` | TIMESTAMP | When image was created |
| `file_name` | TEXT | Original filename |
| `file_size` | BIGINT | File size in bytes |
| `mime_type` | TEXT | MIME type (e.g., image/jpeg) |
| `user_id` | UUID (FK) | Owner of the image |
| `created_at` | TIMESTAMP | Record creation time |

## 🔐 Security

- **RLS Enabled**: Users can only access their own images
- **Storage Policies**: Users can only upload/delete their own files
- **File Validation**: Size and type validation on both client and server
- **UUID-based**: No predictable file paths

## 📝 Response Format

Every upload returns:

```json
{
  "Image_UUID": "550e8400-e29b-41d4-a716-446655440000",
  "Image_AccessURL": "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/images/user-id/path.jpg"
}
```

## 🚀 Next Steps

1. ✅ Run the SQL migration
2. ✅ Create the storage bucket
3. ✅ Deploy Edge Function (optional)
4. ✅ Test upload functionality
5. ✅ Update your components to use `useImageUpload()` hook

## 📚 Related Files

- Migration: `supabase/migrations/20250115000001_create_image_obj_storage_table.sql`
- Service: `src/services/imageUpload/imageUploadService.ts`
- Hook: `src/hooks/useImageUpload.ts`
- Edge Function: `supabase/functions/upload-image/index.ts`
- Tests: `src/services/imageUpload/__tests__/`

