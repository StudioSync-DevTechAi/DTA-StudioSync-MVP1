-- ============================================================================
-- CREATE STORAGE BUCKET FOR DOCUMENTS (PDFs)
-- ============================================================================

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  104857600, -- 100MB in bytes (PDFs can be larger)
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf'];

-- ============================================================================
-- STORAGE POLICIES FOR DOCUMENTS BUCKET
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

-- Policy: Users can upload their own documents
-- Path structure: {user_id}/{project_uuid}/{filename}
-- Use split_part to extract user_id from path (first segment before first '/')
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Policy: Public can view documents (if bucket is public)
CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

