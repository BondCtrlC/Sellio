# Database Schema

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   creators  │       │  products   │       │   orders    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ creator_id  │       │ id (PK)     │
│ user_id     │       │ id (PK)     │◄──────│ product_id  │
│ username    │       │ type        │       │ creator_id  │
│ display_name│       │ title       │       │ buyer_email │
│ bio         │       │ description │       │ buyer_name  │
│ avatar_url  │       │ price       │       │ status      │
│ promptpay_id│       │ image_url   │       │ total       │
│ ...         │       │ is_published│       │ ...         │
└─────────────┘       └─────────────┘       └─────────────┘
                                                   │
                                                   │
                      ┌─────────────┐       ┌──────┴──────┐
                      │fulfillments │       │  payments   │
                      ├─────────────┤       ├─────────────┤
                      │ id (PK)     │       │ id (PK)     │
                      │ order_id    │◄──────│ order_id    │
                      │ type        │       │ slip_url    │
                      │ content     │       │ status      │
                      │ access_until│       │ confirmed_at│
                      └─────────────┘       └─────────────┘
```

---

## SQL Schema

```sql
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
  promptpay_id VARCHAR(20), -- Phone or Citizen ID
  promptpay_name VARCHAR(100), -- Name to display on QR
  
  -- Contact (for auto-reply helper)
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
  
  -- Basic Info
  type product_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  
  -- Media
  image_url TEXT,
  
  -- Type-specific fields (stored as JSONB for flexibility)
  -- Digital: { file_url, file_name, file_size }
  -- Booking: { duration_minutes, available_slots, location_type, location_details }
  -- Live: { scheduled_at, duration_minutes, platform, max_participants }
  type_config JSONB DEFAULT '{}',
  
  -- Settings
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Digital product specific
  auto_deliver BOOLEAN DEFAULT false, -- Deliver immediately after slip upload (risky)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  
  -- Buyer info (no account required)
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(100) NOT NULL,
  buyer_phone VARCHAR(20),
  buyer_note TEXT,
  
  -- Order details
  status order_status DEFAULT 'pending_payment',
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Booking specific
  booking_date DATE,
  booking_time TIME,
  booking_timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Order expires if not paid
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Slip
  slip_url TEXT,
  slip_uploaded_at TIMESTAMPTZ,
  
  -- Status
  status payment_status DEFAULT 'pending',
  
  -- Confirmation
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES creators(id),
  rejection_reason TEXT,
  
  -- Metadata
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fulfillments
CREATE TABLE fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Type
  type fulfillment_type NOT NULL,
  
  -- Content (depends on type)
  -- download: { file_url, download_count, max_downloads }
  -- booking_details: { meeting_url, location, notes, calendar_event_id }
  -- live_access: { access_url, access_code, instructions }
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Access control
  access_token UUID DEFAULT uuid_generate_v4(), -- Unique token for access
  access_until TIMESTAMPTZ, -- Expiration
  is_accessed BOOLEAN DEFAULT false,
  accessed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Creators
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_username ON creators(username);
CREATE INDEX idx_creators_is_published ON creators(is_published) WHERE is_published = true;

-- Products
CREATE INDEX idx_products_creator_id ON products(creator_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_is_published ON products(is_published) WHERE is_published = true;
CREATE INDEX idx_products_creator_published ON products(creator_id, is_published, sort_order);

-- Orders
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_creator_id ON orders(creator_id);
CREATE INDEX idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_creator_status ON orders(creator_id, status);

-- Payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Fulfillments
CREATE INDEX idx_fulfillments_order_id ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_access_token ON fulfillments(access_token);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
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
  INSERT INTO creators (user_id, username, display_name)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)), ' ', '')),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
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

-- ============================================
-- RLS POLICIES: CREATORS
-- ============================================

-- Anyone can view published creators
CREATE POLICY "Public can view published creators"
  ON creators FOR SELECT
  USING (is_published = true);

-- Users can view their own creator profile
CREATE POLICY "Users can view own profile"
  ON creators FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own creator profile
CREATE POLICY "Users can update own profile"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: PRODUCTS
-- ============================================

-- Anyone can view published products of published creators
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

-- Creators can view all their own products
CREATE POLICY "Creators can view own products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- Creators can insert their own products
CREATE POLICY "Creators can insert own products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- Creators can update their own products
CREATE POLICY "Creators can update own products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- Creators can delete their own products
CREATE POLICY "Creators can delete own products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = products.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: ORDERS
-- ============================================

-- Anyone can create orders (buyers don't need accounts)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Creators can view orders for their products
CREATE POLICY "Creators can view own orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = orders.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- Buyers can view their own orders by email (service role needed)
-- For public access, we use order ID as access token
CREATE POLICY "Anyone can view order by ID"
  ON orders FOR SELECT
  USING (true); -- Access controlled by ID being UUID

-- Creators can update orders (status changes)
CREATE POLICY "Creators can update own orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators 
      WHERE creators.id = orders.creator_id 
      AND creators.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: PAYMENTS
-- ============================================

-- Anyone can insert payment (slip upload)
CREATE POLICY "Anyone can create payment"
  ON payments FOR INSERT
  WITH CHECK (true);

-- Anyone can view payment by order ID (order ID is the access token)
CREATE POLICY "Anyone can view payment by order"
  ON payments FOR SELECT
  USING (true);

-- Creators can update payments (confirm/reject)
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

-- ============================================
-- RLS POLICIES: FULFILLMENTS
-- ============================================

-- Creators can insert fulfillments
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

-- Anyone can view fulfillment by access_token (checked in app)
CREATE POLICY "Anyone can view fulfillment"
  ON fulfillments FOR SELECT
  USING (true);

-- Creators can update fulfillments
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
```

---

## Type-specific Configuration (JSONB)

### Digital Product (`type_config`)
```json
{
  "file_url": "digital-files/creator-id/product-id/file.pdf",
  "file_name": "My Ebook.pdf",
  "file_size": 2048576,
  "max_downloads": 5
}
```

### Booking Product (`type_config`)
```json
{
  "duration_minutes": 60,
  "location_type": "online",
  "location_details": "Google Meet",
  "available_days": ["mon", "tue", "wed", "thu", "fri"],
  "available_hours": { "start": "09:00", "end": "17:00" },
  "buffer_minutes": 15,
  "advance_booking_days": 30
}
```

### Live Product (`type_config`)
```json
{
  "scheduled_at": "2024-03-15T19:00:00+07:00",
  "duration_minutes": 120,
  "platform": "zoom",
  "max_participants": 100,
  "access_details": "Link will be sent after payment"
}
```

---

## Fulfillment Content (JSONB)

### Download Fulfillment
```json
{
  "file_url": "digital-files/creator-id/product-id/file.pdf",
  "file_name": "My Ebook.pdf",
  "download_count": 0,
  "max_downloads": 5
}
```

### Booking Fulfillment
```json
{
  "meeting_url": "https://meet.google.com/xxx-yyyy-zzz",
  "meeting_date": "2024-03-20",
  "meeting_time": "14:00",
  "location": "Google Meet",
  "notes": "กรุณาเข้าร่วมก่อนเวลานัด 5 นาที",
  "calendar_event_id": null
}
```

### Live Access Fulfillment
```json
{
  "access_url": "https://zoom.us/j/123456789",
  "access_code": "ABCD1234",
  "instructions": "ใช้รหัสนี้ในการเข้าร่วม Live"
}
```

---

## Useful Queries

### Get creator store with products
```sql
SELECT 
  c.*,
  json_agg(
    json_build_object(
      'id', p.id,
      'type', p.type,
      'title', p.title,
      'price', p.price,
      'image_url', p.image_url
    ) ORDER BY p.sort_order
  ) FILTER (WHERE p.id IS NOT NULL) as products
FROM creators c
LEFT JOIN products p ON p.creator_id = c.id AND p.is_published = true
WHERE c.username = 'example'
GROUP BY c.id;
```

### Get orders for dashboard
```sql
SELECT 
  o.*,
  p.title as product_title,
  p.type as product_type,
  pay.status as payment_status,
  pay.slip_url
FROM orders o
JOIN products p ON p.id = o.product_id
LEFT JOIN payments pay ON pay.order_id = o.id
WHERE o.creator_id = 'creator-uuid'
ORDER BY o.created_at DESC;
```

### Get order with fulfillment for buyer
```sql
SELECT 
  o.*,
  p.title as product_title,
  p.type as product_type,
  p.type_config,
  pay.status as payment_status,
  f.type as fulfillment_type,
  f.content as fulfillment_content,
  f.access_token
FROM orders o
JOIN products p ON p.id = o.product_id
LEFT JOIN payments pay ON pay.order_id = o.id
LEFT JOIN fulfillments f ON f.order_id = o.id
WHERE o.id = 'order-uuid';
```
