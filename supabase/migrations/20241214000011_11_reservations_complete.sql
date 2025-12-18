-- Migração: Sistema Completo de Reservas
-- Inclui mesas, reservas, lista de espera, horários e configurações

-- =============================================
-- TABELA: Mesas do Restaurante
-- =============================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  area TEXT DEFAULT 'internal',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  shape TEXT DEFAULT 'square',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, number)
);

-- =============================================
-- TABELA: Configurações de Reservas
-- =============================================
CREATE TABLE IF NOT EXISTS reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  
  -- Horários de funcionamento
  opening_time TIME DEFAULT '11:00',
  closing_time TIME DEFAULT '23:00',
  slot_duration INTEGER DEFAULT 30,
  
  -- Regras de reserva
  min_party_size INTEGER DEFAULT 1,
  max_party_size INTEGER DEFAULT 20,
  min_advance_hours INTEGER DEFAULT 2,
  max_advance_days INTEGER DEFAULT 30,
  
  -- Políticas
  allow_same_day BOOLEAN DEFAULT TRUE,
  require_confirmation BOOLEAN DEFAULT TRUE,
  auto_cancel_minutes INTEGER DEFAULT 15,
  
  -- No-show
  no_show_fee DECIMAL(10,2) DEFAULT 0,
  no_show_fee_per_person BOOLEAN DEFAULT FALSE,
  
  -- Notificações
  send_confirmation_whatsapp BOOLEAN DEFAULT TRUE,
  send_reminder_hours INTEGER DEFAULT 24,
  reminder_message TEXT DEFAULT 'Olá {nome}! Lembramos da sua reserva para {pessoas} pessoas amanhã às {hora}. Confirma presença? Responda SIM ou NÃO.',
  
  -- Reserva online
  allow_online_booking BOOLEAN DEFAULT TRUE,
  online_booking_message TEXT DEFAULT 'Reserva realizada com sucesso! Aguarde a confirmação.',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Horários Bloqueados
-- =============================================
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  day_of_week INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Eventos Especiais
-- =============================================
CREATE TABLE IF NOT EXISTS special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  max_reservations INTEGER,
  min_spend DECIMAL(10,2),
  deposit_required DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Reservas
-- =============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Cliente
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_id UUID,
  
  -- Detalhes da reserva
  party_size INTEGER NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  duration_minutes INTEGER DEFAULT 90,
  
  -- Mesa
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  table_preference TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  no_show_at TIMESTAMPTZ,
  
  -- Extras
  special_event_id UUID REFERENCES special_events(id) ON DELETE SET NULL,
  occasion TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- Origem
  source TEXT DEFAULT 'dashboard',
  
  -- Financeiro
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT FALSE,
  no_show_fee_charged DECIMAL(10,2) DEFAULT 0,
  
  -- Notificações
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status: pending, confirmed, seated, completed, cancelled, no_show

-- =============================================
-- TABELA: Lista de Espera
-- =============================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  date DATE NOT NULL,
  preferred_time TIME,
  flexible_time BOOLEAN DEFAULT TRUE,
  notes TEXT,
  status TEXT DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  converted_reservation_id UUID REFERENCES reservations(id),
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status: waiting, notified, converted, expired, cancelled

-- =============================================
-- TABELA: Histórico de Reservas do Cliente
-- =============================================
CREATE TABLE IF NOT EXISTS reservation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Estatísticas de Mesas
-- =============================================
CREATE TABLE IF NOT EXISTS table_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_reservations INTEGER DEFAULT 0,
  total_covers INTEGER DEFAULT 0,
  avg_duration_minutes INTEGER,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(table_id, date)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reservations_store_date ON reservations(store_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tables_store ON restaurant_tables(store_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_store_date ON waitlist(store_id, date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_store ON blocked_slots(store_id, date);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_stats ENABLE ROW LEVEL SECURITY;

-- Policies para todas as tabelas
CREATE POLICY "tables_all" ON restaurant_tables FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "settings_all" ON reservation_settings FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "blocked_all" ON blocked_slots FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "events_all" ON special_events FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "reservations_all" ON reservations FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "waitlist_all" ON waitlist FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "history_select" ON reservation_history FOR SELECT USING (
  reservation_id IN (SELECT id FROM reservations WHERE store_id IN (
    SELECT store_id FROM store_users WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "stats_all" ON table_stats FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- Policy pública para reservas online
CREATE POLICY "reservations_public_insert" ON reservations FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para verificar disponibilidade de mesa
CREATE OR REPLACE FUNCTION check_table_availability(
  p_store_id UUID,
  p_table_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER DEFAULT 90
)
RETURNS BOOLEAN AS $$
DECLARE
  v_end_time TIME;
  v_conflict INTEGER;
BEGIN
  v_end_time := p_time + (p_duration || ' minutes')::INTERVAL;
  
  SELECT COUNT(*) INTO v_conflict
  FROM reservations
  WHERE store_id = p_store_id
    AND table_id = p_table_id
    AND date = p_date
    AND status IN ('pending', 'confirmed', 'seated')
    AND (
      (time <= p_time AND (time + (duration_minutes || ' minutes')::INTERVAL) > p_time)
      OR (time < v_end_time AND time >= p_time)
    );
  
  RETURN v_conflict = 0;
END;
$$ LANGUAGE plpgsql;

-- Função para sugerir mesa disponível
CREATE OR REPLACE FUNCTION suggest_available_table(
  p_store_id UUID,
  p_date DATE,
  p_time TIME,
  p_party_size INTEGER,
  p_area TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_table_id UUID;
BEGIN
  SELECT t.id INTO v_table_id
  FROM restaurant_tables t
  WHERE t.store_id = p_store_id
    AND t.is_active = TRUE
    AND t.capacity >= p_party_size
    AND (p_area IS NULL OR t.area = p_area)
    AND check_table_availability(p_store_id, t.id, p_date, p_time)
  ORDER BY t.capacity ASC
  LIMIT 1;
  
  RETURN v_table_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter próxima posição na lista de espera
CREATE OR REPLACE FUNCTION get_waitlist_position(p_store_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  v_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM waitlist
  WHERE store_id = p_store_id
    AND date = p_date
    AND status = 'waiting';
  
  RETURN v_position;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular estatísticas do dia
CREATE OR REPLACE FUNCTION calculate_reservation_stats(p_store_id UUID, p_date DATE)
RETURNS TABLE(
  total_reservations INTEGER,
  total_covers INTEGER,
  confirmed INTEGER,
  pending INTEGER,
  cancelled INTEGER,
  no_shows INTEGER,
  avg_party_size DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_reservations,
    COALESCE(SUM(party_size), 0)::INTEGER as total_covers,
    COUNT(*) FILTER (WHERE status = 'confirmed')::INTEGER as confirmed,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled,
    COUNT(*) FILTER (WHERE status = 'no_show')::INTEGER as no_shows,
    ROUND(AVG(party_size), 1) as avg_party_size
  FROM reservations
  WHERE store_id = p_store_id AND date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_reservation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_reservation_timestamp();

CREATE TRIGGER tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION update_reservation_timestamp();

-- Trigger para registrar histórico
CREATE OR REPLACE FUNCTION log_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO reservation_history (reservation_id, action, old_status, new_status)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_history_trigger
  AFTER UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION log_reservation_change();
