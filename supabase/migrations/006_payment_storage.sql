-- ============================================
-- Payment Slip Storage Setup
-- สร้าง bucket สำหรับเก็บสลิปการโอนเงิน
-- ============================================

-- Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payments',
  'payments',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================

-- Allow anyone to upload slips (buyers don't need to be logged in)
CREATE POLICY "Anyone can upload payment slips"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'payments' AND (storage.foldername(name))[1] = 'slips');

-- Allow anyone to view payment slips
CREATE POLICY "Anyone can view payment slips"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payments');

-- Allow authenticated users to delete slips (for creators to manage)
CREATE POLICY "Authenticated users can delete payment slips"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payments');
