-- ============================================
-- Thai Creator Store - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE product_type AS ENUM ('digital', 'booking', 'live');
CREATE TYPE order_status AS ENUM ('pending_payment', 'pending_confirmation', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE fulfillment_type AS ENUM ('download', 'booking_details', 'live_access');

-- ============================================
-- TABLES
-- ============================================

-- Creators (extends Supabase auth.users)
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  
  -- Payment
  promptpay_id VARCHAR(20),
  promptpay_name VARCHAR(100),
  promptpay_qr_url TEXT,
  promptpay_qr_data TEXT,
  
  -- Bank Transfer
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(20),
  bank_account_name VARCHAR(100),
  
  -- Contact
  contact_line VARCHAR(100),
  contact_ig VARCHAR(100),
  contact_email VARCHAR(255),
  
  -- Settings
  is_published BOOLEAN DEFAULT false,
  store_theme VARCHAR(50) DEFAULT 'default',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  
  type product_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  
  image_url TEXT,
  type_config JSONB DEFAULT '{}',
  
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  auto_deliver BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(100) NOT NULL,
  buyer_phone VARCHAR(20),
  buyer_note TEXT,
  
  status order_status DEFAULT 'pending_payment',
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  booking_date DATE,
  booking_time TIME,
  booking_timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  slip_url TEXT,
  slip_uploaded_at TIMESTAMPTZ,
  
  status payment_status DEFAULT 'pending',
  
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES creators(id),
  rejection_reason TEXT,
  
  amount DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fulfillments
CREATE TABLE fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  type fulfillment_type NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  
  access_token UUID DEFAULT uuid_generate_v4(),
  access_until TIMESTAMPTZ,
  is_accessed BOOLEAN DEFAULT false,
  accessed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_username ON creators(username);

CREATE INDEX idx_products_creator_id ON products(creator_id);
CREATE INDEX idx_products_creator_published ON products(creator_id, is_published, sort_order);

CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_creator_id ON orders(creator_id);
CREATE INDEX idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_creator_status ON orders(creator_id, status);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_fulfillments_order_id ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_access_token ON fulfillments(access_token);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fulfillments_updated_at
  BEFORE UPDATE ON fulfillments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create creator profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;

-- CREATORS POLICIES
CREATE POLICY "Public can view published creators"
  ON creators FOR SELECT
  USING (is_published = true);

CREATE POLICY "Users can view own profile"
  ON creators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PRODUCTS POLICIES
CREATE POLICY "Public can view published products"
  ON products FOR SELECT
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.is_published = true
    )
  );

CREATE POLICY "Creators can view own products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert own products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update own products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete own products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- ORDERS POLICIES
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can view own orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = orders.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view order by ID"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Creators can update own orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = orders.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- PAYMENTS POLICIES
CREATE POLICY "Anyone can create payment"
  ON payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view payment"
  ON payments FOR SELECT
  USING (true);

CREATE POLICY "Creators can update own order payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN creators ON creators.id = orders.creator_id
      WHERE orders.id = payments.order_id
      AND creators.user_id = auth.uid()
    )
  );

-- FULFILLMENTS POLICIES
CREATE POLICY "Creators can create fulfillments"
  ON fulfillments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN creators ON creators.id = orders.creator_id
      WHERE orders.id = fulfillments.order_id
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view fulfillment"
  ON fulfillments FOR SELECT
  USING (true);

CREATE POLICY "Creators can update own fulfillments"
  ON fulfillments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN creators ON creators.id = orders.creator_id
      WHERE orders.id = fulfillments.order_id
      AND creators.user_id = auth.uid()
    )
  );
