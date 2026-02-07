-- Add store_language column to creators table
-- This stores the creator's preferred language for their dashboard and public store
-- Default is 'th' (Thai) as the primary target market

ALTER TABLE creators
ADD COLUMN IF NOT EXISTS store_language TEXT NOT NULL DEFAULT 'th'
CHECK (store_language IN ('th', 'en'));

-- Add comment
COMMENT ON COLUMN creators.store_language IS 'Preferred language for the creator dashboard and public store (th or en)';
