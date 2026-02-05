-- ============================================
-- Store Design Settings
-- เก็บการตั้งค่า Design ของหน้าร้าน
-- ============================================

-- Add design columns to creators table
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS store_design JSONB DEFAULT '{
  "profile_layout": "centered",
  "product_layout": "horizontal",
  "avatar_size": "lg",
  "theme_color": "#6366f1",
  "background_type": "solid",
  "background_color": "#ffffff",
  "background_gradient_from": "#f8fafc",
  "background_gradient_to": "#ffffff",
  "card_style": "default",
  "card_rounded": "xl",
  "card_shadow": "sm",
  "font_family": "default"
}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN creators.store_design IS 'JSON object containing store design settings:
Layout:
- profile_layout: centered | with_cover | minimal | hero
- product_layout: horizontal | vertical | compact
- avatar_size: sm | md | lg

Colors:
- theme_color: Primary color (hex)
- background_type: solid | gradient
- background_color: Background color for solid type
- background_gradient_from: Gradient start color
- background_gradient_to: Gradient end color

Card:
- card_style: default | minimal | bordered
- card_rounded: none | sm | md | lg | xl | 2xl | full
- card_shadow: none | sm | md | lg

Font:
- font_family: default | sarabun | prompt | noto | ibm | pridi';
