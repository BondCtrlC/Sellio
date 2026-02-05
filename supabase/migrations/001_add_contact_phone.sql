-- Add contact_phone column to creators table
ALTER TABLE creators ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
