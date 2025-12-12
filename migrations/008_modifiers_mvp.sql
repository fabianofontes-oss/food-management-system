-- Migration 008: Product Modifiers System (Sizes, Add-ons, etc)
-- Create modifier_groups, modifier_options, and product_modifier_groups tables

-- Create selection type enum
CREATE TYPE modifier_selection_type AS ENUM ('single', 'multiple');

-- Create modifier_groups table
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selection_type modifier_selection_type NOT NULL DEFAULT 'single',
  is_required BOOLEAN DEFAULT false,
  min_select INTEGER DEFAULT 0 CHECK (min_select >= 0),
  max_select INTEGER CHECK (max_select IS NULL OR max_select > 0),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modifier_options table
CREATE TABLE IF NOT EXISTS modifier_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_modifier_groups link table
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (product_id, group_id)
);

-- Add modifiers column to order_items if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'modifiers'
  ) THEN
    ALTER TABLE order_items ADD COLUMN modifiers JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_modifier_groups_store_id ON modifier_groups(store_id);
CREATE INDEX idx_modifier_groups_sort_order ON modifier_groups(sort_order);
CREATE INDEX idx_modifier_options_group_id ON modifier_options(group_id);
CREATE INDEX idx_modifier_options_sort_order ON modifier_options(sort_order);
CREATE INDEX idx_modifier_options_active ON modifier_options(is_active) WHERE is_active = true;
CREATE INDEX idx_product_modifier_groups_product ON product_modifier_groups(product_id);
CREATE INDEX idx_product_modifier_groups_group ON product_modifier_groups(group_id);
CREATE INDEX idx_order_items_modifiers ON order_items USING GIN (modifiers);

-- Enable RLS on modifier tables
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view modifier groups from their stores" ON modifier_groups;
DROP POLICY IF EXISTS "Store members can manage modifier groups" ON modifier_groups;
DROP POLICY IF EXISTS "Users can view modifier options from their stores" ON modifier_options;
DROP POLICY IF EXISTS "Store members can manage modifier options" ON modifier_options;
DROP POLICY IF EXISTS "Users can view product modifier links from their stores" ON product_modifier_groups;
DROP POLICY IF EXISTS "Store members can manage product modifier links" ON product_modifier_groups;

-- RLS Policies for modifier_groups
CREATE POLICY "Users can view modifier groups from their stores"
  ON modifier_groups
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Store members can manage modifier groups"
  ON modifier_groups
  FOR ALL
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
    )
  );

-- RLS Policies for modifier_options
CREATE POLICY "Users can view modifier options from their stores"
  ON modifier_options
  FOR SELECT
  USING (
    group_id IN (
      SELECT id FROM modifier_groups 
      WHERE store_id IN (
        SELECT store_id FROM store_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Store members can manage modifier options"
  ON modifier_options
  FOR ALL
  USING (
    group_id IN (
      SELECT id FROM modifier_groups 
      WHERE store_id IN (
        SELECT store_id FROM store_users 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
      )
    )
  );

-- RLS Policies for product_modifier_groups
CREATE POLICY "Users can view product modifier links from their stores"
  ON product_modifier_groups
  FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products 
      WHERE store_id IN (
        SELECT store_id FROM store_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Store members can manage product modifier links"
  ON product_modifier_groups
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM products 
      WHERE store_id IN (
        SELECT store_id FROM store_users 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modifier_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_modifier_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_modifier_groups_timestamp ON modifier_groups;
CREATE TRIGGER update_modifier_groups_timestamp
  BEFORE UPDATE ON modifier_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_modifier_groups_updated_at();

DROP TRIGGER IF EXISTS update_modifier_options_timestamp ON modifier_options;
CREATE TRIGGER update_modifier_options_timestamp
  BEFORE UPDATE ON modifier_options
  FOR EACH ROW
  EXECUTE FUNCTION update_modifier_options_updated_at();

-- Function to get product modifiers with options (for menu/POS)
CREATE OR REPLACE FUNCTION get_product_modifiers(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', mg.id,
      'name', mg.name,
      'selection_type', mg.selection_type,
      'is_required', mg.is_required,
      'min_select', mg.min_select,
      'max_select', mg.max_select,
      'sort_order', pmg.sort_order,
      'options', (
        SELECT json_agg(
          json_build_object(
            'id', mo.id,
            'name', mo.name,
            'price_delta', mo.price_delta,
            'sort_order', mo.sort_order
          )
          ORDER BY mo.sort_order, mo.name
        )
        FROM modifier_options mo
        WHERE mo.group_id = mg.id
          AND mo.is_active = true
      )
    )
    ORDER BY pmg.sort_order, mg.name
  ) INTO v_result
  FROM modifier_groups mg
  INNER JOIN product_modifier_groups pmg ON pmg.group_id = mg.id
  WHERE pmg.product_id = p_product_id;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_modifiers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_modifiers(UUID) TO anon;

COMMENT ON TABLE modifier_groups IS 'Modifier groups for products (sizes, add-ons, etc)';
COMMENT ON TABLE modifier_options IS 'Options within each modifier group';
COMMENT ON TABLE product_modifier_groups IS 'Links products to modifier groups';
COMMENT ON COLUMN order_items.modifiers IS 'Selected modifiers snapshot for this order item';
