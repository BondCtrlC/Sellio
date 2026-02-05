-- Add Stripe-related fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Add Stripe account ID to creators for future Stripe Connect support
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent);
