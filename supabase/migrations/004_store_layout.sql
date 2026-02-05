-- ============================================
-- Store Layout Tables
-- สำหรับจัดการลำดับสินค้าและ Sections ในหน้าร้าน
-- ============================================

-- Store Sections: grouping of products
CREATE TABLE IF NOT EXISTS store_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Items: tracks which products appear in store and in what order
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_id UUID REFERENCES store_sections(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure each product only appears once per creator's store
  UNIQUE(creator_id, product_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_store_sections_creator_id ON store_sections(creator_id);
CREATE INDEX IF NOT EXISTS idx_store_sections_sort_order ON store_sections(creator_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_store_items_creator_id ON store_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_store_items_section_id ON store_items(section_id);
CREATE INDEX IF NOT EXISTS idx_store_items_sort_order ON store_items(creator_id, section_id, sort_order);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_store_sections_updated_at
  BEFORE UPDATE ON store_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON store_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE store_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

-- Store Sections Policies
CREATE POLICY "Creators can manage own sections"
  ON store_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = store_sections.creator_id 
      AND creators.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = store_sections.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view visible sections"
  ON store_sections FOR SELECT
  USING (
    is_visible = true 
    AND EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = store_sections.creator_id 
      AND creators.is_published = true
    )
  );

-- Store Items Policies
CREATE POLICY "Creators can manage own store items"
  ON store_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = store_items.creator_id 
      AND creators.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = store_items.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view visible store items"
  ON store_items FOR SELECT
  USING (
    is_visible = true 
    AND EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = store_items.creator_id 
      AND creators.is_published = true
    )
  );

-- ============================================
-- FUNCTION: Auto-add product to store_items when created
-- ============================================
CREATE OR REPLACE FUNCTION auto_add_product_to_store()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the max sort_order for products without a section
  INSERT INTO store_items (creator_id, product_id, sort_order)
  VALUES (
    NEW.creator_id, 
    NEW.id, 
    COALESCE((
      SELECT MAX(sort_order) + 1 
      FROM store_items 
      WHERE creator_id = NEW.creator_id AND section_id IS NULL
    ), 0)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-add products
DROP TRIGGER IF EXISTS on_product_created_add_to_store ON products;
CREATE TRIGGER on_product_created_add_to_store
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION auto_add_product_to_store();

-- ============================================
-- Migrate existing products to store_items
-- ============================================
INSERT INTO store_items (creator_id, product_id, sort_order, is_visible)
SELECT 
  creator_id, 
  id as product_id, 
  COALESCE(sort_order, 0),
  is_published as is_visible
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM store_items WHERE store_items.product_id = products.id
)
ON CONFLICT (creator_id, product_id) DO NOTHING;
