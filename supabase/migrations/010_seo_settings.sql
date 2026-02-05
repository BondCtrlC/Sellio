-- ============================================
-- SEO Settings for Creators
-- ============================================

-- Add SEO columns to creators table
ALTER TABLE creators ADD COLUMN IF NOT EXISTS seo_title VARCHAR(70);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS seo_description VARCHAR(160);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Comment: 
-- seo_title: Custom title for store page (max 70 chars for Google)
-- seo_description: Custom meta description (max 160 chars for Google)
-- seo_keywords: Comma-separated keywords
-- og_image_url: Custom Open Graph image URL
