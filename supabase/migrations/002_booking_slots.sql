-- Booking Slots Table
-- Creator กำหนด slot วัน/เวลาที่ว่างสำหรับ booking products

CREATE TABLE IF NOT EXISTS public.booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  
  -- Slot datetime
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_booked BOOLEAN DEFAULT false,
  booked_by_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_slot UNIQUE (product_id, slot_date, start_time)
);

-- Indexes
CREATE INDEX idx_booking_slots_product ON public.booking_slots(product_id);
CREATE INDEX idx_booking_slots_creator ON public.booking_slots(creator_id);
CREATE INDEX idx_booking_slots_date ON public.booking_slots(slot_date);
CREATE INDEX idx_booking_slots_available ON public.booking_slots(product_id, slot_date, is_available, is_booked);

-- Trigger for updated_at
CREATE TRIGGER update_booking_slots_updated_at
  BEFORE UPDATE ON public.booking_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

-- Creator can manage their slots
CREATE POLICY "Creators can view own slots"
  ON public.booking_slots FOR SELECT
  TO authenticated
  USING (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can create slots"
  ON public.booking_slots FOR INSERT
  TO authenticated
  WITH CHECK (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can update own slots"
  ON public.booking_slots FOR UPDATE
  TO authenticated
  USING (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete own slots"
  ON public.booking_slots FOR DELETE
  TO authenticated
  USING (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

-- Public can view available slots (for booking)
CREATE POLICY "Public can view available slots"
  ON public.booking_slots FOR SELECT
  TO anon
  USING (is_available = true AND is_booked = false);
