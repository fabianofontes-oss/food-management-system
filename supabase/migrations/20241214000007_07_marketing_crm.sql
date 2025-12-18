-- Migração: Sistema Completo de Marketing e CRM
-- Campanhas, automações, segmentação e templates

-- =============================================
-- TABELA: Campanhas de Marketing
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Informações básicas
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('promotion', 'notification', 'announcement', 'remarketing', 'loyalty')),
  
  -- Canal de envio
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'push', 'email', 'sms', 'all')),
  
  -- Conteúdo
  subject TEXT,
  message TEXT NOT NULL,
  image_url TEXT,
  cta_text TEXT,
  cta_url TEXT,
  
  -- Cupom vinculado
  coupon_id UUID,
  
  -- Segmentação
  segment_id UUID,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'new', 'inactive', 'vip', 'birthday', 'custom')),
  target_filters JSONB DEFAULT '{}',
  
  -- Agendamento
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'active', 'paused', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- A/B Testing
  is_ab_test BOOLEAN DEFAULT FALSE,
  ab_variant TEXT,
  ab_parent_id UUID,
  
  -- Métricas
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  
  -- Taxas calculadas
  delivery_rate DECIMAL(5,2) DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Mensagens Enviadas
-- =============================================
CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Destinatário
  customer_id UUID,
  customer_phone TEXT,
  customer_email TEXT,
  customer_name TEXT,
  
  -- Status do envio
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'clicked', 'converted', 'failed', 'bounced', 'unsubscribed')),
  
  -- Timestamps
  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Conversão
  order_id UUID,
  conversion_value DECIMAL(10,2),
  
  -- Erro
  error_message TEXT,
  
  -- ID externo (WhatsApp, etc)
  external_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Segmentos de Clientes
-- =============================================
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tipo de segmento
  type TEXT DEFAULT 'manual' CHECK (type IN ('manual', 'dynamic', 'smart')),
  
  -- Filtros para segmentos dinâmicos
  filters JSONB DEFAULT '{}',
  
  -- Exemplos de filtros:
  -- {"min_orders": 5, "min_spent": 500, "last_order_days": 30}
  -- {"products_purchased": ["uuid1", "uuid2"]}
  -- {"order_channel": "delivery", "avg_ticket_min": 50}
  
  -- Contagem
  customer_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  
  -- Sistema
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Clientes do Segmento
-- =============================================
CREATE TABLE IF NOT EXISTS segment_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_phone TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(segment_id, customer_phone)
);

-- =============================================
-- TABELA: Automações de Marketing
-- =============================================
CREATE TABLE IF NOT EXISTS marketing_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Gatilho
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'welcome',           -- Primeiro pedido
    'post_purchase',     -- Após compra (X horas depois)
    'abandoned_cart',    -- Carrinho abandonado
    'inactive',          -- Cliente inativo (X dias sem compra)
    'birthday',          -- Aniversário
    'anniversary',       -- Aniversário de cliente (primeira compra)
    'vip_reached',       -- Atingiu status VIP
    'review_request',    -- Solicitar avaliação
    'loyalty_reward',    -- Recompensa de fidelidade
    'custom'             -- Personalizado
  )),
  
  -- Configuração do gatilho
  trigger_config JSONB DEFAULT '{}',
  -- Exemplos:
  -- {"delay_hours": 24} para post_purchase
  -- {"inactive_days": 30} para inactive
  -- {"days_before": 3} para birthday
  
  -- Canal
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'push', 'email', 'sms')),
  
  -- Conteúdo
  subject TEXT,
  message TEXT NOT NULL,
  image_url TEXT,
  
  -- Cupom automático
  coupon_id UUID,
  auto_generate_coupon BOOLEAN DEFAULT FALSE,
  coupon_discount_type TEXT CHECK (coupon_discount_type IN ('percentage', 'fixed')),
  coupon_discount_value DECIMAL(10,2),
  coupon_validity_days INTEGER DEFAULT 7,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Métricas
  total_triggered INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Logs de Automação
-- =============================================
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES marketing_automations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  customer_id UUID,
  customer_phone TEXT,
  customer_name TEXT,
  
  -- Status
  status TEXT DEFAULT 'triggered' CHECK (status IN ('triggered', 'sent', 'delivered', 'converted', 'failed', 'skipped')),
  
  -- Resultado
  order_id UUID,
  conversion_value DECIMAL(10,2),
  coupon_code TEXT,
  
  -- Erro
  error_message TEXT,
  
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- =============================================
-- TABELA: Templates de Mensagem
-- =============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'welcome', 'promotion', 'reminder', 'birthday', 
    'abandoned_cart', 'review_request', 'loyalty', 'general'
  )),
  
  -- Conteúdo
  subject TEXT,
  message TEXT NOT NULL,
  
  -- Variáveis disponíveis: {nome}, {loja}, {cupom}, {desconto}, {link}, {pedido}
  
  -- Canal preferido
  channel TEXT DEFAULT 'whatsapp',
  
  -- Uso
  use_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Preferências de Comunicação do Cliente
-- =============================================
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  
  -- Canais
  allow_whatsapp BOOLEAN DEFAULT TRUE,
  allow_sms BOOLEAN DEFAULT TRUE,
  allow_email BOOLEAN DEFAULT TRUE,
  allow_push BOOLEAN DEFAULT TRUE,
  
  -- Tipos
  allow_promotions BOOLEAN DEFAULT TRUE,
  allow_transactional BOOLEAN DEFAULT TRUE,
  allow_newsletter BOOLEAN DEFAULT TRUE,
  
  -- Frequência
  max_messages_per_week INTEGER DEFAULT 3,
  
  -- Opt-out
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, customer_phone)
);

-- =============================================
-- TABELA: Estatísticas de Marketing
-- =============================================
CREATE TABLE IF NOT EXISTS marketing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  
  -- Campanhas
  total_campaigns INTEGER DEFAULT 0,
  active_campaigns INTEGER DEFAULT 0,
  
  -- Envios
  total_messages_sent INTEGER DEFAULT 0,
  messages_this_month INTEGER DEFAULT 0,
  
  -- Taxas médias
  avg_delivery_rate DECIMAL(5,2) DEFAULT 0,
  avg_open_rate DECIMAL(5,2) DEFAULT 0,
  avg_click_rate DECIMAL(5,2) DEFAULT 0,
  avg_conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Receita
  total_revenue_generated DECIMAL(12,2) DEFAULT 0,
  revenue_this_month DECIMAL(12,2) DEFAULT 0,
  
  -- Automações
  total_automations INTEGER DEFAULT 0,
  active_automations INTEGER DEFAULT 0,
  automation_conversions INTEGER DEFAULT 0,
  
  -- Segmentos
  total_segments INTEGER DEFAULT 0,
  total_customers_segmented INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_store ON campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(store_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_customer ON campaign_messages(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_segments_store ON customer_segments(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_automations_store ON marketing_automations(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_automations_trigger ON marketing_automations(trigger_type) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_phone ON customer_preferences(customer_phone);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_all" ON campaigns FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "campaign_messages_all" ON campaign_messages FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "customer_segments_all" ON customer_segments FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "segment_customers_all" ON segment_customers FOR ALL USING (
  segment_id IN (SELECT id FROM customer_segments WHERE store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid()))
);

CREATE POLICY "marketing_automations_all" ON marketing_automations FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "automation_logs_all" ON automation_logs FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "message_templates_all" ON message_templates FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "customer_preferences_all" ON customer_preferences FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "marketing_stats_all" ON marketing_stats FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular métricas da campanha
CREATE OR REPLACE FUNCTION calculate_campaign_metrics(p_campaign_id UUID)
RETURNS VOID AS $$
DECLARE
  v_metrics RECORD;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'read', 'clicked', 'converted')) as sent,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'read', 'clicked', 'converted')) as delivered,
    COUNT(*) FILTER (WHERE status IN ('read', 'clicked', 'converted')) as opened,
    COUNT(*) FILTER (WHERE status IN ('clicked', 'converted')) as clicked,
    COUNT(*) FILTER (WHERE status = 'converted') as converted,
    COALESCE(SUM(conversion_value), 0) as revenue
  INTO v_metrics
  FROM campaign_messages
  WHERE campaign_id = p_campaign_id;

  UPDATE campaigns SET
    total_recipients = v_metrics.total,
    sent_count = v_metrics.sent,
    delivered_count = v_metrics.delivered,
    opened_count = v_metrics.opened,
    clicked_count = v_metrics.clicked,
    converted_count = v_metrics.converted,
    revenue_generated = v_metrics.revenue,
    delivery_rate = CASE WHEN v_metrics.sent > 0 THEN (v_metrics.delivered::DECIMAL / v_metrics.sent) * 100 ELSE 0 END,
    open_rate = CASE WHEN v_metrics.delivered > 0 THEN (v_metrics.opened::DECIMAL / v_metrics.delivered) * 100 ELSE 0 END,
    click_rate = CASE WHEN v_metrics.opened > 0 THEN (v_metrics.clicked::DECIMAL / v_metrics.opened) * 100 ELSE 0 END,
    conversion_rate = CASE WHEN v_metrics.clicked > 0 THEN (v_metrics.converted::DECIMAL / v_metrics.clicked) * 100 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular segmento dinâmico
CREATE OR REPLACE FUNCTION calculate_segment_customers(p_segment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_segment RECORD;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_segment FROM customer_segments WHERE id = p_segment_id;
  
  IF v_segment.type = 'dynamic' THEN
    -- Limpar clientes atuais
    DELETE FROM segment_customers WHERE segment_id = p_segment_id;
    
    -- Inserir baseado nos filtros
    -- Implementação simplificada - em produção seria mais complexa
    INSERT INTO segment_customers (segment_id, customer_id, customer_phone)
    SELECT DISTINCT 
      p_segment_id,
      o.customer_id,
      o.customer_phone
    FROM orders o
    WHERE o.store_id = v_segment.store_id
      AND o.customer_phone IS NOT NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    SELECT COUNT(*) INTO v_count FROM segment_customers WHERE segment_id = p_segment_id;
  END IF;
  
  UPDATE customer_segments SET
    customer_count = v_count,
    last_calculated_at = NOW()
  WHERE id = p_segment_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Função para criar templates padrão
CREATE OR REPLACE FUNCTION create_default_marketing_templates(p_store_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO message_templates (store_id, name, category, message, channel) VALUES
    (p_store_id, 'Boas-vindas', 'welcome', 'Olá {nome}! 👋 Seja bem-vindo(a) à {loja}! Seu primeiro pedido foi um sucesso. Volte sempre!', 'whatsapp'),
    (p_store_id, 'Promoção Geral', 'promotion', '🔥 {nome}, temos uma oferta especial para você! Use o cupom {cupom} e ganhe {desconto} de desconto. Válido por tempo limitado!', 'whatsapp'),
    (p_store_id, 'Aniversário', 'birthday', '🎂 Parabéns, {nome}! A {loja} deseja um feliz aniversário! Como presente, use o cupom {cupom} e ganhe {desconto} OFF no seu pedido!', 'whatsapp'),
    (p_store_id, 'Cliente Inativo', 'reminder', 'Olá {nome}, sentimos sua falta! 😊 Faz um tempo que não nos visita. Que tal um pedido hoje? Use {cupom} para {desconto} de desconto!', 'whatsapp'),
    (p_store_id, 'Carrinho Abandonado', 'abandoned_cart', 'Ei {nome}! Você deixou itens no carrinho 🛒 Finalize seu pedido agora e aproveite!', 'whatsapp'),
    (p_store_id, 'Pedir Avaliação', 'review_request', 'Olá {nome}! Como foi seu pedido? 😊 Sua opinião é muito importante para nós. Avalie sua experiência: {link}', 'whatsapp'),
    (p_store_id, 'Fidelidade', 'loyalty', '⭐ {nome}, você é especial! Como cliente fiel, ganhou {desconto} de desconto no próximo pedido. Use o cupom {cupom}!', 'whatsapp')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para criar segmentos padrão
CREATE OR REPLACE FUNCTION create_default_segments(p_store_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO customer_segments (store_id, name, description, type, filters, is_system) VALUES
    (p_store_id, 'Todos os Clientes', 'Todos os clientes que já fizeram pedido', 'dynamic', '{}', TRUE),
    (p_store_id, 'Clientes Novos', 'Clientes que fizeram o primeiro pedido nos últimos 30 dias', 'dynamic', '{"first_order_days": 30}', TRUE),
    (p_store_id, 'Clientes Inativos', 'Clientes sem pedido há mais de 60 dias', 'dynamic', '{"inactive_days": 60}', TRUE),
    (p_store_id, 'Clientes VIP', 'Clientes com mais de 10 pedidos ou R$500 gastos', 'dynamic', '{"min_orders": 10, "min_spent": 500}', TRUE),
    (p_store_id, 'Aniversariantes do Mês', 'Clientes que fazem aniversário este mês', 'dynamic', '{"birthday_month": true}', TRUE)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar automações após pedido
CREATE OR REPLACE FUNCTION check_marketing_automations()
RETURNS TRIGGER AS $$
DECLARE
  v_automation RECORD;
BEGIN
  -- Verificar automações ativas para o novo pedido
  FOR v_automation IN 
    SELECT * FROM marketing_automations 
    WHERE store_id = NEW.store_id 
      AND is_active = TRUE
  LOOP
    -- Boas-vindas: primeiro pedido do cliente
    IF v_automation.trigger_type = 'welcome' THEN
      IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE store_id = NEW.store_id 
          AND customer_phone = NEW.customer_phone 
          AND id != NEW.id
      ) THEN
        INSERT INTO automation_logs (automation_id, store_id, customer_phone, customer_name, status)
        VALUES (v_automation.id, NEW.store_id, NEW.customer_phone, NEW.customer_name, 'triggered');
      END IF;
    END IF;
    
    -- Pós-compra: agendar envio
    IF v_automation.trigger_type = 'post_purchase' THEN
      INSERT INTO automation_logs (automation_id, store_id, customer_phone, customer_name, status)
      VALUES (v_automation.id, NEW.store_id, NEW.customer_phone, NEW.customer_name, 'triggered');
    END IF;
    
    -- Solicitar avaliação
    IF v_automation.trigger_type = 'review_request' AND NEW.status = 'delivered' THEN
      INSERT INTO automation_logs (automation_id, store_id, customer_phone, customer_name, status)
      VALUES (v_automation.id, NEW.store_id, NEW.customer_phone, NEW.customer_name, 'triggered');
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_marketing_automations ON orders;
CREATE TRIGGER trigger_check_marketing_automations
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_marketing_automations();
