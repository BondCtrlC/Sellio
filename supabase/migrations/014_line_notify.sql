-- Add LINE Notify token field to creators
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS line_notify_token TEXT;

-- Add comment
COMMENT ON COLUMN public.creators.line_notify_token IS 'LINE Notify access token for order notifications';
