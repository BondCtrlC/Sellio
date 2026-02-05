-- ================================================
-- Migration: Create digital-files storage bucket
-- ================================================

-- Create storage bucket for digital files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-files',
  'digital-files',
  true, -- public so buyers can download
  104857600, -- 100MB limit
  NULL -- allow all file types
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for digital-files
-- ============================================

-- Allow authenticated users to upload digital files
CREATE POLICY "Creators can upload digital files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'digital-files');

-- Allow anyone to view/download digital files (buyers need access)
CREATE POLICY "Anyone can view digital files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'digital-files');

-- Allow authenticated users to update their files
CREATE POLICY "Creators can update digital files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'digital-files');

-- Allow authenticated users to delete their files
CREATE POLICY "Creators can delete digital files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'digital-files');
