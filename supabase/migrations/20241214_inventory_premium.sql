-- SISTEMA PREMIUM DE ESTOQUE
-- Histórico, Validade, Lotes, Pedidos de Compra, Inventário, Fornecedores, Ficha Técnica

-- ============================================
-- FORNECEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  company_name VARCHAR(150),
  cnpj VARCHAR(18),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  contact_person VARCHAR(100),
  payment_terms VARCHAR(100), -- À vista, 30 dias, etc
  delivery_days INTEGER DEFAULT 1, -- Prazo de entrega em dias
  min_order_value DECIMAL(10,2) DEFAULT 0, -- Pedido mínimo
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_store ON suppliers(store_id);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'suppliers_all') THEN
    CREATE POLICY "suppliers_all" ON suppliers FOR ALL USING (true);
  END IF;
END $$;

-- ============================================
-- FICHA TÉCNICA (ingredientes do produto)
-- ============================================
CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL, -- quantidade usada
  unit VARCHAR(20), -- unidade (kg, g, ml, un)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_item ON product_ingredients(inventory_item_id);
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_ingredients_all') THEN
    CREATE POLICY "product_ingredients_all" ON product_ingredients FOR ALL USING (true);
  END IF;
END $$;

-- Adicionar campos na tabela inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_purchase_date DATE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_purchase_price DECIMAL(10,2);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS average_consumption DECIMAL(10,2) DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Adicionar campo de custo na tabela products (CMV)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 0;

-- Tabela de movimentações de estoque (histórico completo)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- in, out, adjustment, loss, transfer
  quantity DECIMAL(10,2) NOT NULL,
  previous_quantity DECIMAL(10,2),
  new_quantity DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reason TEXT,
  reference_id UUID, -- pedido de compra ou venda
  reference_type VARCHAR(20), -- purchase_order, sale, loss, etc
  batch_number VARCHAR(50),
  expiry_date DATE,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de lotes (controle de validade)
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_number VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  manufacture_date DATE,
  expiry_date DATE,
  supplier VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active', -- active, consumed, expired, discarded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number VARCHAR(20),
  supplier VARCHAR(100) NOT NULL,
  supplier_contact VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, confirmed, received, cancelled
  total_amount DECIMAL(12,2) DEFAULT 0,
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  received_quantity DECIMAL(10,2) DEFAULT 0,
  notes TEXT
);

-- Tabela de inventários (conferências periódicas)
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  count_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  notes TEXT,
  counted_by VARCHAR(100),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do inventário
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  system_quantity DECIMAL(10,2), -- quantidade no sistema
  counted_quantity DECIMAL(10,2), -- quantidade contada
  difference DECIMAL(10,2), -- diferença
  notes TEXT,
  counted_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_item ON inventory_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_store ON purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_store ON inventory_counts(store_id);

-- RLS
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_movements_all') THEN
    CREATE POLICY "inventory_movements_all" ON inventory_movements FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_batches_all') THEN
    CREATE POLICY "inventory_batches_all" ON inventory_batches FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_orders_all') THEN
    CREATE POLICY "purchase_orders_all" ON purchase_orders FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_order_items_all') THEN
    CREATE POLICY "purchase_order_items_all" ON purchase_order_items FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_counts_all') THEN
    CREATE POLICY "inventory_counts_all" ON inventory_counts FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_count_items_all') THEN
    CREATE POLICY "inventory_count_items_all" ON inventory_count_items FOR ALL USING (true);
  END IF;
END $$;
