-- Add 'link' to product_type ENUM
-- If using ENUM type, need to alter it
-- If using TEXT with CHECK constraint, need to update constraint

-- Method 1: If product.type is TEXT (no ENUM), just works
-- Method 2: If using ENUM, run this:

-- Check if type column allows 'link' value
-- For PostgreSQL with ENUM:
DO $$ 
BEGIN
  -- Try to add 'link' to the enum if it exists
  ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'link';
EXCEPTION
  WHEN undefined_object THEN
    -- ENUM doesn't exist, type is probably TEXT which is fine
    NULL;
END $$;
