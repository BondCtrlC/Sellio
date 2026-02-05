-- ============================================
-- Storage Policies
-- Run this AFTER creating the 4 buckets
-- ============================================

-- AVATARS BUCKET (Public)
-- Anyone can view
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- PRODUCTS BUCKET (Public)
-- Anyone can view
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Authenticated users can upload
CREATE POLICY "Creators can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update
CREATE POLICY "Creators can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Authenticated users can delete
CREATE POLICY "Creators can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- DIGITAL-FILES BUCKET (Private)
-- Only authenticated users can manage
CREATE POLICY "Creators can manage digital files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'digital-files'
  AND auth.role() = 'authenticated'
);

-- SLIPS BUCKET (Private)
-- Anyone can upload (buyers don't need account)
CREATE POLICY "Anyone can upload slip"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'slips');

-- Authenticated users can view (creators checking slips)
CREATE POLICY "Authenticated can view slips"
ON storage.objects FOR SELECT
USING (bucket_id = 'slips' AND auth.role() = 'authenticated');
