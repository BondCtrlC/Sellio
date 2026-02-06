-- Add plan and subscription fields to creators table
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Index for plan lookups
CREATE INDEX IF NOT EXISTS idx_creators_plan ON creators(plan);
CREATE INDEX IF NOT EXISTS idx_creators_stripe_customer ON creators(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_creators_stripe_subscription ON creators(stripe_subscription_id);

-- Comment
COMMENT ON COLUMN creators.plan IS 'Current plan: free or pro';
COMMENT ON COLUMN creators.stripe_customer_id IS 'Stripe Customer ID for subscription';
COMMENT ON COLUMN creators.stripe_subscription_id IS 'Stripe Subscription ID for Pro plan';
COMMENT ON COLUMN creators.plan_expires_at IS 'When the current plan period expires (null for free)';
