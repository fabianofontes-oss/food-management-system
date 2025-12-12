-- Migration 007: Coupons System
-- Create coupons table and add coupon fields to orders

-- Create coupon type enum
CREATE TYPE coupon_type AS ENUM ('percent', 'fixed');

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type coupon_type NOT NULL,
  value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  uses_count INTEGER DEFAULT 0 CHECK (uses_count >= 0),
  min_order_amount NUMERIC(10, 2) CHECK (min_order_amount IS NULL OR min_order_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_coupon_per_store UNIQUE (store_id, code),
  CONSTRAINT valid_date_range CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

-- Add indexes for performance
CREATE INDEX idx_coupons_store_id ON coupons(store_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- Add coupon fields to orders table if they don't exist
DO $$ 
BEGIN
  -- Add coupon_code column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_code TEXT;
  END IF;

  -- Add discount_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view coupons from their stores" ON coupons;
DROP POLICY IF EXISTS "Store members can manage coupons" ON coupons;

-- Policy: Users can view coupons from stores they have access to
CREATE POLICY "Users can view coupons from their stores"
  ON coupons
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Store owners and managers can manage coupons
CREATE POLICY "Store members can manage coupons"
  ON coupons
  FOR ALL
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_coupons_timestamp ON coupons;
CREATE TRIGGER update_coupons_timestamp
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Function to validate and apply coupon (can be called from application)
CREATE OR REPLACE FUNCTION validate_coupon(
  p_store_id UUID,
  p_code TEXT,
  p_subtotal NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC;
  v_result JSON;
BEGIN
  -- Find coupon (case-insensitive)
  SELECT * INTO v_coupon
  FROM coupons
  WHERE store_id = p_store_id
    AND UPPER(code) = UPPER(p_code)
  LIMIT 1;

  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'Cupom não encontrado'
    );
  END IF;

  -- Check if active
  IF NOT v_coupon.is_active THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'Cupom inativo'
    );
  END IF;

  -- Check date range
  IF v_coupon.starts_at IS NOT NULL AND NOW() < v_coupon.starts_at THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'Cupom ainda não está válido'
    );
  END IF;

  IF v_coupon.ends_at IS NOT NULL AND NOW() > v_coupon.ends_at THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'Cupom expirado'
    );
  END IF;

  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'Cupom atingiu o limite de usos'
    );
  END IF;

  -- Check minimum order amount
  IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    RETURN json_build_object(
      'valid', false,
      'reason', format('Pedido mínimo de R$ %.2f', v_coupon.min_order_amount)
    );
  END IF;

  -- Calculate discount
  IF v_coupon.type = 'percent' THEN
    v_discount := ROUND(p_subtotal * (v_coupon.value / 100), 2);
  ELSE -- fixed
    v_discount := LEAST(v_coupon.value, p_subtotal);
  END IF;

  -- Ensure discount doesn't exceed subtotal
  v_discount := LEAST(v_discount, p_subtotal);

  -- Return success
  RETURN json_build_object(
    'valid', true,
    'discount_amount', v_discount,
    'coupon_code', v_coupon.code,
    'coupon_type', v_coupon.type,
    'coupon_value', v_coupon.value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on validate_coupon function
GRANT EXECUTE ON FUNCTION validate_coupon(UUID, TEXT, NUMERIC) TO authenticated;

-- Function to increment coupon usage atomically
CREATE OR REPLACE FUNCTION increment_coupon_usage(
  p_store_id UUID,
  p_code TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET uses_count = uses_count + 1
  WHERE store_id = p_store_id
    AND UPPER(code) = UPPER(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_coupon_usage(UUID, TEXT) TO authenticated;

COMMENT ON TABLE coupons IS 'Store discount coupons for checkout and POS';
COMMENT ON COLUMN orders.coupon_code IS 'Applied coupon code if any';
COMMENT ON COLUMN orders.discount_amount IS 'Discount amount from coupon';
