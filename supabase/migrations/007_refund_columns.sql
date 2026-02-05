-- ================================================
-- Migration: Add refund columns to orders and payments
-- ================================================

-- Add refund columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refund_promptpay VARCHAR(50),
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.refund_promptpay IS 'Buyer PromptPay number for refunds (optional, provided at checkout)';
COMMENT ON COLUMN orders.refunded_at IS 'Timestamp when the order was refunded';

-- Add refund columns to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS refund_slip_url TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS refund_note TEXT;

COMMENT ON COLUMN payments.refund_slip_url IS 'URL of the refund slip uploaded by creator';
COMMENT ON COLUMN payments.refunded_at IS 'Timestamp when the refund was processed';
COMMENT ON COLUMN payments.refund_amount IS 'Amount refunded to buyer';
COMMENT ON COLUMN payments.refund_note IS 'Note from creator about the refund';

-- ================================================
-- Update Storage Policy for refund slips
-- ================================================

-- Drop existing upload policy
DROP POLICY IF EXISTS "Anyone can upload payment slips" ON storage.objects;

-- Create new policy that allows both slips and refund-slips folders
CREATE POLICY "Anyone can upload payment slips"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'payments' AND 
  (storage.foldername(name))[1] IN ('slips', 'refund-slips')
);
