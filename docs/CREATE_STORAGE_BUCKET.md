# Create Storage Bucket for Images

## Problem
The storage bucket "images" needs to be created in Supabase for image uploads to work.

## Solution: Execute SQL Migration

Execute this SQL script in Supabase Dashboard → SQL Editor:

**File:** `supabase/migrations/20250115000002_create_images_storage_bucket.sql`

This will:
1. Create the "images" storage bucket
2. Set it as public (so images can be accessed via URL)
3. Configure file size limit (50MB)
4. Set allowed MIME types (JPEG, PNG, GIF, WebP)
5. Create storage policies for authenticated users

## Alternative: Create via Supabase Dashboard

If SQL doesn't work, create the bucket manually:

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name:** `images`
   - **Public bucket:** ✅ (checked)
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** `image/jpeg, image/jpg, image/png, image/gif, image/webp`
4. Click **"Create bucket"**

## Storage Policies

After creating the bucket, you need to set up policies. Execute the policies section from the migration file, or create them manually in Dashboard → Storage → Policies.

### Required Policies:

1. **Users can upload their own images** (INSERT)
   - Path structure: `{user_id}/{filename}`
   - Users can only upload to their own folder

2. **Users can view their own images** (SELECT)
   - Users can view images in their own folder

3. **Public can view images** (SELECT)
   - Anyone can view images (since bucket is public)

4. **Users can update their own images** (UPDATE)
   - Users can update images in their own folder

5. **Users can delete their own images** (DELETE)
   - Users can delete images in their own folder

## Verify Bucket Creation

Run this query to verify:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'images';
```

## Path Structure

The storage path structure is:
- **Bucket:** `images`
- **Path inside bucket:** `{user_id}/{timestamp}-{random}-{filename}`
- **Example:** `bd5bfa4f-dbc3-468b-8ddd-110d9304cd7a/1762423993108-pjwmw9cxgb-image.png`

**Note:** The path does NOT include the bucket name since we're already uploading to the "images" bucket.


