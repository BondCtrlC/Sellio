-- Replace LINE Notify (discontinued) with Email Notifications
-- Rename line_notify_token to notification_email

-- Drop old LINE Notify column
ALTER TABLE public.creators
  DROP COLUMN IF EXISTS line_notify_token;

-- Add notification email column
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- Add comment
COMMENT ON COLUMN public.creators.notification_email IS 'Email address for order notifications (new order, slip uploaded, etc.)';
