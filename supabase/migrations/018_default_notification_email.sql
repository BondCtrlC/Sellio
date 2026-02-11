-- Auto-set notification_email from signup email for new users
-- and backfill existing creators who don't have one

-- 1. Update the trigger function to include notification_email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creators (user_id, username, display_name, notification_email)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)), ' ', '')),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill existing creators who have no notification_email
UPDATE public.creators
SET notification_email = auth.users.email
FROM auth.users
WHERE creators.user_id = auth.users.id
  AND (creators.notification_email IS NULL OR creators.notification_email = '');
