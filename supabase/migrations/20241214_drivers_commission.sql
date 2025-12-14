-- Adicionar campos de comissão na tabela drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS commission_percent INTEGER DEFAULT 10;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Criar tabela de deliveries se não existir
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  estimated_time INTEGER DEFAULT 30,
  actual_delivery_time TIMESTAMPTZ,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de drivers se não existir
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(20),
  vehicle_plate VARCHAR(20),
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  notes TEXT,
  commission_percent INTEGER DEFAULT 10,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_deliveries_store ON deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_drivers_store ON drivers(store_id);

-- RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deliveries_all') THEN
    CREATE POLICY "deliveries_all" ON deliveries FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'drivers_all') THEN
    CREATE POLICY "drivers_all" ON drivers FOR ALL USING (true);
  END IF;
END $$;
