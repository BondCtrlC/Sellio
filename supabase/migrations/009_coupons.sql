-- ============================================
-- Coupons Table
-- ============================================

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    
    -- Coupon info
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    
    -- Discount type: 'percentage' or 'fixed'
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    
    -- Limits
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2), -- Max discount for percentage type
    usage_limit INTEGER, -- Total times coupon can be used
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1, -- Times per user
    
    -- Product restrictions (NULL = all products)
    product_ids UUID[], -- Specific products only
    product_types VARCHAR(20)[], -- Specific product types only
    
    -- Validity
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique code per creator
CREATE UNIQUE INDEX idx_coupons_creator_code ON coupons(creator_id, UPPER(code));

-- Index for active coupons lookup
CREATE INDEX idx_coupons_active ON coupons(creator_id, is_active, expires_at);

-- ============================================
-- Coupon Usage Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    buyer_email VARCHAR(255) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for checking usage
CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_buyer ON coupon_usages(coupon_id, buyer_email);

-- ============================================
-- Add coupon fields to orders
-- ============================================

-- Add coupon reference to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Coupons: Creator can manage their own coupons
CREATE POLICY "Creators can view own coupons" ON coupons
    FOR SELECT USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Creators can insert own coupons" ON coupons
    FOR INSERT WITH CHECK (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Creators can update own coupons" ON coupons
    FOR UPDATE USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Creators can delete own coupons" ON coupons
    FOR DELETE USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

-- Public can validate coupons (for checkout)
CREATE POLICY "Public can validate active coupons" ON coupons
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (starts_at IS NULL OR starts_at <= NOW())
    );

-- Coupon usages: Creator can view, anyone can insert during checkout
CREATE POLICY "Creators can view coupon usages" ON coupon_usages
    FOR SELECT USING (
        coupon_id IN (
            SELECT id FROM coupons WHERE creator_id IN (
                SELECT id FROM creators WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Anyone can record coupon usage" ON coupon_usages
    FOR INSERT WITH CHECK (true);

-- ============================================
-- Trigger to update usage count
-- ============================================

CREATE OR REPLACE FUNCTION update_coupon_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupon_usage
    AFTER INSERT ON coupon_usages
    FOR EACH ROW
    EXECUTE FUNCTION update_coupon_usage_count();
