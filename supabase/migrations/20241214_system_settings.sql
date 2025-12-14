-- SISTEMA DE CONFIGURAÇÕES GLOBAIS E CONTROLE DE DEMANDA
-- Permite ativar/desativar APIs pagas baseado na demanda

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  value_type VARCHAR(20) DEFAULT 'string', -- string, boolean, number, json
  category VARCHAR(50) DEFAULT 'general', -- general, api, feature, limit
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações iniciais
INSERT INTO system_settings (key, value, value_type, category, description) VALUES
  -- APIs Pagas
  ('google_maps_enabled', 'false', 'boolean', 'api', 'Habilitar API do Google Maps para rotas e geocoding'),
  ('google_maps_api_key', '', 'string', 'api', 'Chave da API do Google Maps'),
  ('realtime_gps_enabled', 'false', 'boolean', 'api', 'Habilitar rastreamento GPS em tempo real dos motoristas'),
  ('push_notifications_enabled', 'false', 'boolean', 'api', 'Habilitar notificações push (OneSignal/FCM)'),
  ('push_notifications_key', '', 'string', 'api', 'Chave do serviço de push notifications'),
  
  -- Limites para sugerir ativação
  ('google_maps_threshold', '5000', 'number', 'limit', 'Entregas/mês para sugerir ativar Google Maps'),
  ('realtime_gps_threshold', '20', 'number', 'limit', 'Motoristas ativos para sugerir ativar GPS'),
  ('push_notifications_threshold', '100', 'number', 'limit', 'Usuários para sugerir ativar Push'),
  
  -- Features globais
  ('global_drivers_enabled', 'false', 'boolean', 'feature', 'Habilitar sistema de motoristas globais'),
  ('customer_rewards_enabled', 'true', 'boolean', 'feature', 'Habilitar sistema de recompensas para clientes'),
  ('multi_store_enabled', 'false', 'boolean', 'feature', 'Habilitar gerenciamento multi-lojas'),
  ('driver_accept_reject_enabled', 'false', 'boolean', 'feature', 'Motorista pode aceitar/recusar entregas (OFF = aceita automaticamente)')
ON CONFLICT (key) DO NOTHING;

-- Tabela de avaliações de motoristas
CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES deliveries(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rated_by VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_store ON driver_ratings(store_id);

ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver_ratings_all') THEN
    CREATE POLICY "driver_ratings_all" ON driver_ratings FOR ALL USING (true);
  END IF;
END $$;

-- Tabela de métricas do sistema (para dashboard de demanda)
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  total_tenants INTEGER DEFAULT 0,
  total_stores INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_drivers INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics(metric_date);

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Policies (apenas superadmin)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'system_settings_all') THEN
    CREATE POLICY "system_settings_all" ON system_settings FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'system_metrics_all') THEN
    CREATE POLICY "system_metrics_all" ON system_metrics FOR ALL USING (true);
  END IF;
END $$;
