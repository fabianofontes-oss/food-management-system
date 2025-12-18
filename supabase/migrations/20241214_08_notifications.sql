-- SISTEMA DE NOTIFICAÇÕES

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL, -- order, stock, payment, schedule, general
  title VARCHAR(200) NOT NULL,
  message TEXT,
  priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high, urgent
  
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  data JSONB, -- Dados extras (order_id, etc)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de notificação por loja
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Sons
  sound_enabled BOOLEAN DEFAULT true,
  sound_new_order VARCHAR(100) DEFAULT 'default',
  
  -- Push
  push_enabled BOOLEAN DEFAULT true,
  push_new_order BOOLEAN DEFAULT true,
  push_order_ready BOOLEAN DEFAULT true,
  push_low_stock BOOLEAN DEFAULT true,
  
  -- WhatsApp
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone VARCHAR(20), -- Número principal da loja
  whatsapp_new_order BOOLEAN DEFAULT false,
  whatsapp_order_ready BOOLEAN DEFAULT true,
  
  -- Email
  email_enabled BOOLEAN DEFAULT false,
  email_address VARCHAR(255),
  email_daily_report BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_store ON notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(store_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_all" ON notifications;
DROP POLICY IF EXISTS "notification_settings_all" ON notification_settings;

CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true);
CREATE POLICY "notification_settings_all" ON notification_settings FOR ALL USING (true);
