-- Migration: Tropical Freeze Features
-- Features: MIMO, Fidelidade, KDS Avançado, TV Menu Board, Marketing Studio, Hardware

-- ============================================
-- 1. MIMO - PAGAMENTO SOCIAL ("Paga pra mim?")
-- ============================================

-- Campos MIMO na tabela de pedidos
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS mimo_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS mimo_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mimo_target_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS mimo_message TEXT,
ADD COLUMN IF NOT EXISTS mimo_payer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mimo_payer_id UUID,
ADD COLUMN IF NOT EXISTS mimo_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mimo_shared_via VARCHAR(20);

-- Índices para MIMO
CREATE INDEX IF NOT EXISTS idx_orders_mimo_token ON public.orders(mimo_token) WHERE mimo_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_mimo_expires ON public.orders(mimo_expires_at) WHERE mimo_expires_at IS NOT NULL;

-- Configurações de MIMO por loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS mimo_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mimo_expiration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS mimo_allow_table_orders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mimo_min_order_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mimo_payer_earns_points BOOLEAN DEFAULT TRUE;

-- ============================================
-- 2. CARTÃO FIDELIDADE / LOYALTY
-- ============================================

-- Configuração do programa de fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL DEFAULT 'Programa Fidelidade',
  description TEXT,
  
  program_type VARCHAR(20) NOT NULL DEFAULT 'points',
  
  points_per_currency DECIMAL(10,2) DEFAULT 1,
  points_per_order INTEGER DEFAULT 0,
  
  points_value DECIMAL(10,4) DEFAULT 0.01,
  min_points_redeem INTEGER DEFAULT 100,
  max_discount_percent DECIMAL(5,2) DEFAULT 100,
  
  cashback_percent DECIMAL(5,2) DEFAULT 0,
  cashback_expiry_days INTEGER DEFAULT 90,
  
  stamps_required INTEGER DEFAULT 10,
  stamp_reward_type VARCHAR(20) DEFAULT 'free_item',
  stamp_reward_value DECIMAL(10,2),
  stamp_reward_product_id UUID REFERENCES public.products(id),
  
  has_tiers BOOLEAN DEFAULT FALSE,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Níveis de fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  
  name VARCHAR(50) NOT NULL,
  min_points INTEGER NOT NULL,
  
  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  free_delivery BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  exclusive_products BOOLEAN DEFAULT FALSE,
  
  badge_color VARCHAR(20),
  badge_icon VARCHAR(50),
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saldo e histórico do cliente
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.loyalty_programs(id) ON DELETE SET NULL,
  
  points_balance INTEGER DEFAULT 0,
  points_earned_total INTEGER DEFAULT 0,
  points_redeemed_total INTEGER DEFAULT 0,
  
  cashback_balance DECIMAL(10,2) DEFAULT 0,
  
  stamps_current INTEGER DEFAULT 0,
  stamps_completed INTEGER DEFAULT 0,
  
  current_tier_id UUID REFERENCES public.loyalty_tiers(id),
  tier_achieved_at TIMESTAMP WITH TIME ZONE,
  
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(customer_id, store_id)
);

-- Transações de pontos
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  transaction_type VARCHAR(20) NOT NULL,
  points_amount INTEGER NOT NULL,
  
  description VARCHAR(255),
  
  cashback_amount DECIMAL(10,2) DEFAULT 0,
  stamps_amount INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Régua de relacionamento
CREATE TABLE IF NOT EXISTS public.customer_engagement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  trigger_type VARCHAR(30) NOT NULL,
  trigger_days INTEGER,
  
  action_type VARCHAR(30) NOT NULL,
  message_template TEXT,
  coupon_id UUID REFERENCES public.coupons(id),
  bonus_points INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log de engajamento
CREATE TABLE IF NOT EXISTS public.customer_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.customer_engagement_rules(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  channel VARCHAR(20),
  status VARCHAR(20) DEFAULT 'sent',
  converted_order_id UUID REFERENCES public.orders(id)
);

-- ============================================
-- 3. KDS AVANÇADO (Kitchen Display System)
-- ============================================

-- Configuração do KDS por loja
CREATE TABLE IF NOT EXISTS public.kds_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  columns JSONB DEFAULT '[
    {"id": "pending", "name": "Pendente", "color": "#FCD34D"},
    {"id": "preparing", "name": "Preparando", "color": "#60A5FA"},
    {"id": "ready", "name": "Pronto", "color": "#34D399"}
  ]'::jsonb,
  
  sla_green_minutes INTEGER DEFAULT 5,
  sla_yellow_minutes INTEGER DEFAULT 10,
  
  batch_mode_enabled BOOLEAN DEFAULT FALSE,
  batch_group_by VARCHAR(20) DEFAULT 'product',
  
  sound_new_order BOOLEAN DEFAULT TRUE,
  sound_file VARCHAR(255) DEFAULT '/sounds/new-order.mp3',
  
  auto_refresh_seconds INTEGER DEFAULT 10,
  
  font_size VARCHAR(10) DEFAULT 'medium',
  show_customer_name BOOLEAN DEFAULT TRUE,
  show_order_notes BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id)
);

-- Tempo de preparo por produto
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS kds_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kds_station VARCHAR(50);

-- Estações de preparo
CREATE TABLE IF NOT EXISTS public.kds_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  
  category_ids UUID[] DEFAULT '{}',
  
  color VARCHAR(20) DEFAULT '#6366F1',
  icon VARCHAR(50) DEFAULT 'ChefHat',
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id, code)
);

-- Log de tempo de preparo
CREATE TABLE IF NOT EXISTS public.kds_order_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  
  wait_time_seconds INTEGER,
  prep_time_seconds INTEGER,
  total_time_seconds INTEGER,
  
  sla_status VARCHAR(10),
  estimated_prep_minutes INTEGER,
  
  prepared_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TV MENU BOARD (Digital Signage)
-- ============================================

CREATE TABLE IF NOT EXISTS public.tv_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  
  display_type VARCHAR(20) DEFAULT 'menu',
  
  layout VARCHAR(20) DEFAULT 'grid',
  columns INTEGER DEFAULT 3,
  rows INTEGER DEFAULT 4,
  
  category_ids UUID[] DEFAULT '{}',
  show_prices BOOLEAN DEFAULT TRUE,
  show_images BOOLEAN DEFAULT TRUE,
  show_descriptions BOOLEAN DEFAULT FALSE,
  
  show_qr_code BOOLEAN DEFAULT TRUE,
  qr_position VARCHAR(20) DEFAULT 'bottom-right',
  qr_size INTEGER DEFAULT 150,
  
  promo_rotation_seconds INTEGER DEFAULT 10,
  promo_ids UUID[] DEFAULT '{}',
  
  theme VARCHAR(20) DEFAULT 'dark',
  background_color VARCHAR(20) DEFAULT '#1F2937',
  text_color VARCHAR(20) DEFAULT '#FFFFFF',
  accent_color VARCHAR(20) DEFAULT '#8B5CF6',
  font_size VARCHAR(10) DEFAULT 'large',
  
  is_active BOOLEAN DEFAULT TRUE,
  last_ping_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id, code)
);

-- Promoções para TV
CREATE TABLE IF NOT EXISTS public.tv_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(255),
  
  image_url VARCHAR(500),
  background_color VARCHAR(20),
  text_color VARCHAR(20),
  
  product_id UUID REFERENCES public.products(id),
  
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. MARKETING STUDIO
-- ============================================

-- Templates de posts
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  template_type VARCHAR(30) NOT NULL,
  
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  
  design_json JSONB NOT NULL,
  
  preview_url VARCHAR(500),
  
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts gerados
CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.marketing_templates(id),
  
  title VARCHAR(255),
  
  image_url VARCHAR(500),
  
  product_id UUID REFERENCES public.products(id),
  
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  instagram_post_id VARCHAR(100),
  facebook_post_id VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Cam (Molduras)
CREATE TABLE IF NOT EXISTS public.social_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  
  frame_url VARCHAR(500) NOT NULL,
  
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  
  photo_x INTEGER NOT NULL,
  photo_y INTEGER NOT NULL,
  photo_width INTEGER NOT NULL,
  photo_height INTEGER NOT NULL,
  
  frame_type VARCHAR(20) DEFAULT 'portrait',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. HARDWARE INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.hardware_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  device_type VARCHAR(30) NOT NULL,
  
  connection_type VARCHAR(20) NOT NULL,
  connection_config JSONB,
  
  scale_protocol VARCHAR(30),
  scale_unit VARCHAR(10) DEFAULT 'kg',
  
  printer_width INTEGER,
  printer_driver VARCHAR(30),
  
  is_active BOOLEAN DEFAULT TRUE,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_store ON public.loyalty_programs(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer ON public.customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_store ON public.customer_loyalty(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON public.loyalty_transactions(customer_loyalty_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_log_order ON public.kds_order_log(order_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_log_store ON public.kds_order_log(store_id);
CREATE INDEX IF NOT EXISTS idx_tv_displays_store ON public.tv_displays(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_templates_store ON public.marketing_templates(store_id);

-- ============================================
-- 8. RLS POLICIES
-- ============================================

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_programs_store_access ON public.loyalty_programs;
CREATE POLICY loyalty_programs_store_access ON public.loyalty_programs
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_tiers_access ON public.loyalty_tiers;
CREATE POLICY loyalty_tiers_access ON public.loyalty_tiers
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = program_id AND public.user_has_store_access(lp.store_id))
);

ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS customer_loyalty_store_access ON public.customer_loyalty;
CREATE POLICY customer_loyalty_store_access ON public.customer_loyalty
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_transactions_store_access ON public.loyalty_transactions;
CREATE POLICY loyalty_transactions_store_access ON public.loyalty_transactions
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.customer_engagement_rules ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS engagement_rules_store_access ON public.customer_engagement_rules;
CREATE POLICY engagement_rules_store_access ON public.customer_engagement_rules
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.customer_engagement_log ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS engagement_log_access ON public.customer_engagement_log;
CREATE POLICY engagement_log_access ON public.customer_engagement_log
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.customer_engagement_rules r WHERE r.id = rule_id AND public.user_has_store_access(r.store_id))
);

ALTER TABLE public.kds_config ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_config_store_access ON public.kds_config;
CREATE POLICY kds_config_store_access ON public.kds_config
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.kds_stations ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_stations_store_access ON public.kds_stations;
CREATE POLICY kds_stations_store_access ON public.kds_stations
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.kds_order_log ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_order_log_store_access ON public.kds_order_log;
CREATE POLICY kds_order_log_store_access ON public.kds_order_log
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.tv_displays ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS tv_displays_store_access ON public.tv_displays;
CREATE POLICY tv_displays_store_access ON public.tv_displays
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.tv_promotions ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS tv_promotions_store_access ON public.tv_promotions;
CREATE POLICY tv_promotions_store_access ON public.tv_promotions
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS marketing_templates_access ON public.marketing_templates;
CREATE POLICY marketing_templates_access ON public.marketing_templates
FOR ALL USING (store_id IS NULL OR public.user_has_store_access(store_id));

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS marketing_posts_store_access ON public.marketing_posts;
CREATE POLICY marketing_posts_store_access ON public.marketing_posts
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.social_frames ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS social_frames_access ON public.social_frames;
CREATE POLICY social_frames_access ON public.social_frames
FOR ALL USING (store_id IS NULL OR public.user_has_store_access(store_id));

ALTER TABLE public.hardware_devices ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS hardware_devices_store_access ON public.hardware_devices;
CREATE POLICY hardware_devices_store_access ON public.hardware_devices
FOR ALL USING (public.user_has_store_access(store_id));

-- ============================================
-- 9. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_loyalty_programs_updated_at ON public.loyalty_programs;
CREATE TRIGGER update_loyalty_programs_updated_at
  BEFORE UPDATE ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_loyalty_updated_at ON public.customer_loyalty;
CREATE TRIGGER update_customer_loyalty_updated_at
  BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_rules_updated_at ON public.customer_engagement_rules;
CREATE TRIGGER update_engagement_rules_updated_at
  BEFORE UPDATE ON public.customer_engagement_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kds_config_updated_at ON public.kds_config;
CREATE TRIGGER update_kds_config_updated_at
  BEFORE UPDATE ON public.kds_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tv_displays_updated_at ON public.tv_displays;
CREATE TRIGGER update_tv_displays_updated_at
  BEFORE UPDATE ON public.tv_displays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hardware_devices_updated_at ON public.hardware_devices;
CREATE TRIGGER update_hardware_devices_updated_at
  BEFORE UPDATE ON public.hardware_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. FUNCTIONS
-- ============================================

-- Função para expirar MIMOs antigos
CREATE OR REPLACE FUNCTION expire_mimo_orders()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.orders
  SET status = 'mimo_expired',
      updated_at = NOW()
  WHERE status = 'awaiting_mimo'
    AND mimo_expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular pontos de fidelidade
CREATE OR REPLACE FUNCTION calculate_loyalty_points(
  p_store_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_program public.loyalty_programs;
  v_points INTEGER;
BEGIN
  SELECT * INTO v_program
  FROM public.loyalty_programs
  WHERE store_id = p_store_id AND is_active = TRUE
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  v_points := FLOOR(p_order_total * v_program.points_per_currency);
  v_points := v_points + COALESCE(v_program.points_per_order, 0);
  
  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para creditar pontos após pedido
CREATE OR REPLACE FUNCTION credit_loyalty_points(
  p_customer_id UUID,
  p_store_id UUID,
  p_order_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
  v_loyalty_id UUID;
BEGIN
  v_points := calculate_loyalty_points(p_store_id, p_order_total);
  
  IF v_points <= 0 THEN
    RETURN 0;
  END IF;
  
  INSERT INTO public.customer_loyalty (customer_id, store_id, points_balance, points_earned_total, total_orders, total_spent, last_order_at)
  VALUES (p_customer_id, p_store_id, v_points, v_points, 1, p_order_total, NOW())
  ON CONFLICT (customer_id, store_id)
  DO UPDATE SET
    points_balance = customer_loyalty.points_balance + v_points,
    points_earned_total = customer_loyalty.points_earned_total + v_points,
    total_orders = customer_loyalty.total_orders + 1,
    total_spent = customer_loyalty.total_spent + p_order_total,
    last_order_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_loyalty_id;
  
  INSERT INTO public.loyalty_transactions (customer_loyalty_id, store_id, order_id, transaction_type, points_amount, description)
  VALUES (v_loyalty_id, p_store_id, p_order_id, 'earn', v_points, 'Pontos do pedido');
  
  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar token MIMO
CREATE OR REPLACE FUNCTION validate_mimo_token(
  p_order_id UUID,
  p_token VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_order public.orders;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND mimo_token = p_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token inválido');
  END IF;
  
  IF v_order.status = 'mimo_expired' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este link expirou');
  END IF;
  
  IF v_order.status != 'awaiting_mimo' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este pedido já foi pago');
  END IF;
  
  IF v_order.mimo_expires_at < NOW() THEN
    UPDATE public.orders SET status = 'mimo_expired' WHERE id = p_order_id;
    RETURN jsonb_build_object('valid', false, 'error', 'Este link expirou');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'order_id', v_order.id,
    'total', v_order.total,
    'target_name', v_order.mimo_target_name,
    'message', v_order.mimo_message,
    'expires_at', v_order.mimo_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
