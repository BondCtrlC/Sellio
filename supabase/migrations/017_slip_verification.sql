-- ============================================
-- Slip2GO Auto-Verification Fields
-- Add slip verification columns to payments table
-- ============================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS slip_verified BOOLEAN DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS slip_verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS slip_verify_ref TEXT DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS slip_verify_message TEXT DEFAULT NULL;
