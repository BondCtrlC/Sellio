-- ============================================
-- Reviews Table
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    
    -- Reviewer info
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Moderation
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Creator response
    response TEXT,
    response_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One review per order
CREATE UNIQUE INDEX idx_reviews_order ON reviews(order_id);

-- Index for product reviews
CREATE INDEX idx_reviews_product ON reviews(product_id, is_published, created_at DESC);

-- Index for creator reviews
CREATE INDEX idx_reviews_creator ON reviews(creator_id, created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews" ON reviews
    FOR SELECT USING (is_published = true);

-- Creators can view all their reviews (including unpublished)
CREATE POLICY "Creators can view own reviews" ON reviews
    FOR SELECT USING (
        creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
    );

-- Anyone can insert reviews (for order owners)
CREATE POLICY "Anyone can insert reviews" ON reviews
    FOR INSERT WITH CHECK (true);

-- Creators can update their reviews (for response, moderation)
CREATE POLICY "Creators can update own reviews" ON reviews
    FOR UPDATE USING (
        creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
    );

-- ============================================
-- Add review stats to products (optional cache)
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

-- ============================================
-- Trigger to update product review stats
-- ============================================

CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for the product
    UPDATE products SET
        review_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND is_published = true
        ),
        average_rating = (
            SELECT COALESCE(AVG(rating), 0) FROM reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND is_published = true
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_review_stats ON reviews;
CREATE TRIGGER trigger_update_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_review_stats();
