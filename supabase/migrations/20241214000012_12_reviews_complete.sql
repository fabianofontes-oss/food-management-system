-- Migração: Sistema Completo de Avaliações
-- Inclui reviews, templates, NPS, critérios e alertas

-- =============================================
-- TABELA: Avaliações
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID,
  customer_phone TEXT,
  customer_name TEXT NOT NULL,
  
  -- Avaliação geral
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Avaliações por critério (1-5)
  rating_food INTEGER CHECK (rating_food >= 1 AND rating_food <= 5),
  rating_delivery INTEGER CHECK (rating_delivery >= 1 AND rating_delivery <= 5),
  rating_service INTEGER CHECK (rating_service >= 1 AND rating_service <= 5),
  rating_packaging INTEGER CHECK (rating_packaging >= 1 AND rating_packaging <= 5),
  
  -- NPS (0-10)
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  
  -- Fotos
  photos JSONB DEFAULT '[]',
  
  -- Resposta da loja
  reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID,
  
  -- Status
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden', 'flagged')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Denúncias
  flag_reason TEXT,
  flagged_at TIMESTAMPTZ,
  flagged_by UUID,
  
  -- Origem
  source TEXT DEFAULT 'order' CHECK (source IN ('order', 'manual', 'google', 'ifood', 'whatsapp')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Templates de Resposta
-- =============================================
CREATE TABLE IF NOT EXISTS review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  rating_min INTEGER DEFAULT 1,
  rating_max INTEGER DEFAULT 5,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates padrão serão inseridos via função

-- =============================================
-- TABELA: Solicitações de Avaliação
-- =============================================
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Canal
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  
  -- Token único para link
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Configurações de Avaliação
-- =============================================
CREATE TABLE IF NOT EXISTS review_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  
  -- Solicitação automática
  auto_request_enabled BOOLEAN DEFAULT TRUE,
  auto_request_delay_hours INTEGER DEFAULT 2,
  auto_request_channel TEXT DEFAULT 'whatsapp',
  
  -- Critérios
  enable_food_rating BOOLEAN DEFAULT TRUE,
  enable_delivery_rating BOOLEAN DEFAULT TRUE,
  enable_service_rating BOOLEAN DEFAULT TRUE,
  enable_packaging_rating BOOLEAN DEFAULT FALSE,
  enable_nps BOOLEAN DEFAULT FALSE,
  enable_photos BOOLEAN DEFAULT TRUE,
  
  -- Moderação
  auto_publish BOOLEAN DEFAULT TRUE,
  min_rating_auto_publish INTEGER DEFAULT 1,
  require_comment BOOLEAN DEFAULT FALSE,
  min_comment_length INTEGER DEFAULT 0,
  
  -- Exibição
  show_on_menu BOOLEAN DEFAULT TRUE,
  show_customer_name BOOLEAN DEFAULT TRUE,
  featured_count INTEGER DEFAULT 5,
  
  -- Alertas
  alert_low_rating BOOLEAN DEFAULT TRUE,
  alert_low_rating_threshold INTEGER DEFAULT 3,
  alert_no_reply_days INTEGER DEFAULT 2,
  alert_email TEXT,
  
  -- Mensagem de solicitação
  request_message TEXT DEFAULT 'Olá {nome}! Como foi seu pedido? Avalie sua experiência: {link}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Estatísticas de Avaliação (cache)
-- =============================================
CREATE TABLE IF NOT EXISTS review_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  
  -- Totais
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  -- Distribuição
  count_5_stars INTEGER DEFAULT 0,
  count_4_stars INTEGER DEFAULT 0,
  count_3_stars INTEGER DEFAULT 0,
  count_2_stars INTEGER DEFAULT 0,
  count_1_stars INTEGER DEFAULT 0,
  
  -- Médias por critério
  avg_food DECIMAL(3,2) DEFAULT 0,
  avg_delivery DECIMAL(3,2) DEFAULT 0,
  avg_service DECIMAL(3,2) DEFAULT 0,
  avg_packaging DECIMAL(3,2) DEFAULT 0,
  
  -- NPS
  nps_score INTEGER DEFAULT 0,
  nps_promoters INTEGER DEFAULT 0,
  nps_passives INTEGER DEFAULT 0,
  nps_detractors INTEGER DEFAULT 0,
  
  -- Resposta
  total_responded INTEGER DEFAULT 0,
  total_pending INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Período
  reviews_this_week INTEGER DEFAULT 0,
  reviews_this_month INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reviews_store ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(store_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(store_id, status);
CREATE INDEX IF NOT EXISTS idx_review_requests_token ON review_requests(token);
CREATE INDEX IF NOT EXISTS idx_review_requests_order ON review_requests(order_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_stats ENABLE ROW LEVEL SECURITY;

-- Reviews - leitura pública para avaliações publicadas
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (
  status = 'published' OR
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "reviews_store_all" ON reviews FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_templates_all" ON review_templates FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_requests_all" ON review_requests FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_settings_all" ON review_settings FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_stats_all" ON review_stats FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular estatísticas de avaliação
CREATE OR REPLACE FUNCTION calculate_review_stats(p_store_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT 
    COUNT(*) as total,
    COALESCE(AVG(rating), 0) as avg_rating,
    COUNT(*) FILTER (WHERE rating = 5) as count_5,
    COUNT(*) FILTER (WHERE rating = 4) as count_4,
    COUNT(*) FILTER (WHERE rating = 3) as count_3,
    COUNT(*) FILTER (WHERE rating = 2) as count_2,
    COUNT(*) FILTER (WHERE rating = 1) as count_1,
    COALESCE(AVG(rating_food), 0) as avg_food,
    COALESCE(AVG(rating_delivery), 0) as avg_delivery,
    COALESCE(AVG(rating_service), 0) as avg_service,
    COALESCE(AVG(rating_packaging), 0) as avg_packaging,
    COUNT(*) FILTER (WHERE reply IS NOT NULL) as responded,
    COUNT(*) FILTER (WHERE reply IS NULL) as pending,
    COUNT(*) FILTER (WHERE nps_score >= 9) as promoters,
    COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score <= 8) as passives,
    COUNT(*) FILTER (WHERE nps_score <= 6) as detractors,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
  INTO v_stats
  FROM reviews
  WHERE store_id = p_store_id AND status = 'published';

  INSERT INTO review_stats (
    store_id, total_reviews, average_rating,
    count_5_stars, count_4_stars, count_3_stars, count_2_stars, count_1_stars,
    avg_food, avg_delivery, avg_service, avg_packaging,
    total_responded, total_pending,
    nps_promoters, nps_passives, nps_detractors,
    reviews_this_week, reviews_this_month, updated_at
  ) VALUES (
    p_store_id, v_stats.total, v_stats.avg_rating,
    v_stats.count_5, v_stats.count_4, v_stats.count_3, v_stats.count_2, v_stats.count_1,
    v_stats.avg_food, v_stats.avg_delivery, v_stats.avg_service, v_stats.avg_packaging,
    v_stats.responded, v_stats.pending,
    v_stats.promoters, v_stats.passives, v_stats.detractors,
    v_stats.this_week, v_stats.this_month, NOW()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    count_5_stars = EXCLUDED.count_5_stars,
    count_4_stars = EXCLUDED.count_4_stars,
    count_3_stars = EXCLUDED.count_3_stars,
    count_2_stars = EXCLUDED.count_2_stars,
    count_1_stars = EXCLUDED.count_1_stars,
    avg_food = EXCLUDED.avg_food,
    avg_delivery = EXCLUDED.avg_delivery,
    avg_service = EXCLUDED.avg_service,
    avg_packaging = EXCLUDED.avg_packaging,
    total_responded = EXCLUDED.total_responded,
    total_pending = EXCLUDED.total_pending,
    nps_promoters = EXCLUDED.nps_promoters,
    nps_passives = EXCLUDED.nps_passives,
    nps_detractors = EXCLUDED.nps_detractors,
    reviews_this_week = EXCLUDED.reviews_this_week,
    reviews_this_month = EXCLUDED.reviews_this_month,
    updated_at = NOW();

  -- Calcular NPS
  IF (v_stats.promoters + v_stats.passives + v_stats.detractors) > 0 THEN
    UPDATE review_stats SET
      nps_score = ROUND(
        ((v_stats.promoters::DECIMAL - v_stats.detractors::DECIMAL) / 
         (v_stats.promoters + v_stats.passives + v_stats.detractors)) * 100
      )
    WHERE store_id = p_store_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para criar solicitação de avaliação após pedido
CREATE OR REPLACE FUNCTION create_review_request()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
BEGIN
  -- Verificar se pedido foi entregue
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Buscar configurações
    SELECT * INTO v_settings FROM review_settings WHERE store_id = NEW.store_id;
    
    -- Se solicitação automática está ativada
    IF v_settings.auto_request_enabled THEN
      INSERT INTO review_requests (
        store_id, order_id, customer_phone, customer_name, channel
      ) VALUES (
        NEW.store_id, NEW.id, NEW.customer_phone, NEW.customer_name,
        COALESCE(v_settings.auto_request_channel, 'whatsapp')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar solicitação automaticamente
DROP TRIGGER IF EXISTS trigger_create_review_request ON orders;
CREATE TRIGGER trigger_create_review_request
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_review_request();

-- Função para atualizar stats após nova avaliação
CREATE OR REPLACE FUNCTION update_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM calculate_review_stats(NEW.store_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM calculate_review_stats(OLD.store_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_review_stats ON reviews;
CREATE TRIGGER trigger_update_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_stats();

-- Função para criar templates padrão
CREATE OR REPLACE FUNCTION create_default_review_templates(p_store_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO review_templates (store_id, name, content, category, rating_min, rating_max) VALUES
    (p_store_id, 'Agradecimento 5 estrelas', 'Obrigado pela avaliação, {nome}! Ficamos muito felizes que você teve uma ótima experiência. Esperamos você em breve! 😊', 'positive', 5, 5),
    (p_store_id, 'Agradecimento 4 estrelas', 'Obrigado pelo feedback, {nome}! Estamos sempre buscando melhorar. Conte com a gente! 👍', 'positive', 4, 4),
    (p_store_id, 'Pedido de desculpas', 'Olá {nome}, sentimos muito pela sua experiência. Gostaríamos de entender melhor o que aconteceu para melhorarmos. Pode entrar em contato conosco?', 'negative', 1, 3),
    (p_store_id, 'Resposta neutra', 'Obrigado pelo seu feedback, {nome}! Sua opinião é muito importante para nós.', 'general', 1, 5)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar avaliações pendentes de resposta
CREATE OR REPLACE FUNCTION get_pending_reviews(p_store_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  days_pending INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.customer_name,
    r.rating,
    r.comment,
    r.created_at,
    EXTRACT(DAY FROM NOW() - r.created_at)::INTEGER as days_pending
  FROM reviews r
  WHERE r.store_id = p_store_id
    AND r.reply IS NULL
    AND r.status = 'published'
    AND r.created_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql;
