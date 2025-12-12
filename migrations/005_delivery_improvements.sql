-- Migration: 005 - Melhorias de Delivery (Pacote Grátis)
-- Adiciona tabela drivers, campos extras e índices para performance

-- ============================================================================
-- TABELA DE MOTORISTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(50), -- moto, carro, bicicleta
  vehicle_plate VARCHAR(20),
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.00,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE drivers IS 'Motoristas/entregadores cadastrados';
COMMENT ON COLUMN drivers.is_available IS 'Se está disponível para receber entregas';
COMMENT ON COLUMN drivers.rating IS 'Avaliação média (0-5)';

CREATE INDEX idx_drivers_store_available ON drivers(store_id, is_available, is_active);
CREATE INDEX idx_drivers_tenant ON drivers(tenant_id);

-- ============================================================================
-- MELHORIAS NA TABELA DELIVERIES
-- ============================================================================

-- Adicionar campos extras se não existirem
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(20);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending';
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_store_status ON deliveries(store_id, status, created_at DESC);

-- ============================================================================
-- ENUM PARA STATUS DE DELIVERY
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_enum') THEN
    CREATE TYPE delivery_status_enum AS ENUM (
      'pending',
      'assigned',
      'picked_up',
      'in_transit',
      'delivered',
      'cancelled'
    );
  END IF;
END $$;

-- ============================================================================
-- TRIGGER PARA UPDATE AUTOMÁTICO
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drivers_updated_at 
  BEFORE UPDATE ON drivers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver motoristas do seu tenant
CREATE POLICY "Users can view drivers from their tenant"
ON drivers FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM stores 
    WHERE id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Usuários podem inserir motoristas no seu tenant
CREATE POLICY "Users can insert drivers in their tenant"
ON drivers FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM stores 
    WHERE id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Usuários podem atualizar motoristas do seu tenant
CREATE POLICY "Users can update drivers in their tenant"
ON drivers FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM stores 
    WHERE id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Usuários podem deletar motoristas do seu tenant
CREATE POLICY "Users can delete drivers in their tenant"
ON drivers FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM stores 
    WHERE id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid()
    )
  )
);
