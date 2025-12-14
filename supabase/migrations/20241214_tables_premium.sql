-- SISTEMA PREMIUM DE MESAS
-- QR Code, Reservas, Chamar Garçom, Timer, Histórico

-- Adicionar novos campos na tabela tables
ALTER TABLE tables ADD COLUMN IF NOT EXISTS occupied_at TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS merged_with UUID[];
ALTER TABLE tables ADD COLUMN IF NOT EXISTS waiter_called BOOLEAN DEFAULT false;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS waiter_called_at TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabela de reservas
CREATE TABLE IF NOT EXISTS table_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  party_size INTEGER DEFAULT 2,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed, no_show
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de chamadas de garçom
CREATE TABLE IF NOT EXISTS waiter_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  call_type VARCHAR(20) DEFAULT 'assistance', -- assistance, bill, order, water
  status VARCHAR(20) DEFAULT 'pending', -- pending, acknowledged, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Tabela de histórico de mesas
CREATE TABLE IF NOT EXISTS table_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_amount DECIMAL(10,2) DEFAULT 0,
  guests_count INTEGER DEFAULT 1,
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_table_reservations_store ON table_reservations(store_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_store ON waiter_calls(store_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON waiter_calls(status);
CREATE INDEX IF NOT EXISTS idx_table_sessions_table ON table_sessions(table_id);

-- RLS
ALTER TABLE table_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'table_reservations_all') THEN
    CREATE POLICY "table_reservations_all" ON table_reservations FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waiter_calls_all') THEN
    CREATE POLICY "waiter_calls_all" ON waiter_calls FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'table_sessions_all') THEN
    CREATE POLICY "table_sessions_all" ON table_sessions FOR ALL USING (true);
  END IF;
END $$;
