-- ============================================================================
-- BYPASS RLS FOR DOCUMENTS BUCKET (DEVELOPMENT ONLY)
-- ============================================================================
-- WARNING: This makes the bucket accessible without authentication
-- Only use for development/testing
-- ============================================================================

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete documents" ON storage.objects;

-- Allow anyone to upload (DEVELOPMENT ONLY)
CREATE POLICY "Public can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Allow anyone to view
CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow anyone to update
CREATE POLICY "Public can update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents');

-- Allow anyone to delete
CREATE POLICY "Public can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

