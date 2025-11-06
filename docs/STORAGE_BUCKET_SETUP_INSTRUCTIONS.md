# Storage Bucket Setup Instructions

## Problem
You're getting errors:
- `Storage bucket "images" not found`
- `400 Bad Request` with URL showing `images/images/` (duplicate)

## Solution: Create the Storage Bucket

### Option 1: Execute SQL Migration (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of:
   ```
   supabase/migrations/20250115000002_create_images_storage_bucket.sql
   ```
3. Click **Run** to execute
4. Verify the bucket was created by running:
   ```sql
   SELECT id, name, public FROM storage.buckets WHERE id = 'images';
   ```

### Option 2: Create via Dashboard

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"** or **"Create bucket"**
3. Fill in:
   - **Name:** `images`
   - **Public bucket:** ✅ Check this box
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** `image/jpeg, image/jpg, image/png, image/gif, image/webp`
4. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

After creating the bucket, you need to add policies. Execute this SQL:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

-- Policy: Users can upload their own images
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own images
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Public can view images (if bucket is public)
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Policy: Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Verify Setup

Run these queries to verify:

```sql
-- Check bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'images';

-- Check policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%images%';
```

### Step 4: Clear Browser Cache & Restart Dev Server

After creating the bucket:
1. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Restart your dev server** to ensure code changes are applied:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## Path Structure

The storage path structure is:
- **Bucket name:** `images`
- **Path inside bucket:** `{user_id}/{timestamp}-{random}-{filename}`
- **Example:** `bd5bfa4f-dbc3-468b-8ddd-110d9304cd7a/1762423993108-pjwmw9cxgb-image.png`

**Important:** The path does NOT include the bucket name since we're already uploading to the "images" bucket.

## Troubleshooting

### Still seeing `images/images/` in URL?
1. Hard refresh browser (Ctrl+Shift+R)
2. Restart dev server
3. Clear browser cache
4. Check that `src/services/imageUpload/imageUploadService.ts` line 150 shows:
   ```typescript
   const storagePath = `${user.id}/${timestamp}-${randomString}-${sanitizedFileName}`;
   ```
   (NOT `images/${user.id}/...`)

### Still getting "bucket not found"?
1. Verify bucket exists: Run `SELECT * FROM storage.buckets WHERE id = 'images';`
2. Check bucket is public: The `public` column should be `true`
3. Verify you're logged in (authentication required for uploads)

### Getting permission errors?
1. Make sure storage policies are created (see Step 2)
2. Verify you're authenticated (check Supabase auth session)
3. Check that RLS is enabled on storage.objects


