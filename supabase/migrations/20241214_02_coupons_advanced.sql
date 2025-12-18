-- Migração: Cupons Avançados
-- Adiciona campos para funcionalidades avançadas de cupons

-- Adicionar novos campos à tabela coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'standard';
-- Tipos: standard, first_purchase, birthday, referral, free_shipping, category, progressive, auto_apply

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT NULL;
-- IDs das categorias onde o cupom se aplica (NULL = todas)

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT NULL;
-- IDs dos produtos onde o cupom se aplica (NULL = todos)

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS one_per_customer BOOLEAN DEFAULT FALSE;
-- Limitar 1 uso por cliente

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS auto_apply BOOLEAN DEFAULT FALSE;
-- Aplicar automaticamente sem digitar código

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT FALSE;
-- Cupom dá frete grátis

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS progressive_rules JSONB DEFAULT NULL;
-- Regras progressivas: [{"min_amount": 50, "discount": 10}, {"min_amount": 100, "discount": 20}]

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS shareable_link TEXT DEFAULT NULL;
-- Link compartilhável único

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS campaign_id UUID DEFAULT NULL;
-- ID da campanha de marketing

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS total_discount_given DECIMAL(10,2) DEFAULT 0;
-- Total de desconto já concedido

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS total_orders_used INTEGER DEFAULT 0;
-- Total de pedidos que usaram este cupom

-- Tabela para rastrear uso de cupom por cliente
CREATE TABLE IF NOT EXISTS coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id UUID DEFAULT NULL,
  customer_email TEXT DEFAULT NULL,
  order_id UUID DEFAULT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(coupon_id, customer_email)
);

-- Tabela para campanhas de marketing
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_customer ON coupon_uses(customer_email);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign ON coupons(campaign_id);
CREATE INDEX IF NOT EXISTS idx_coupons_shareable ON coupons(shareable_link);

-- RLS para coupon_uses
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_uses_select" ON coupon_uses FOR SELECT USING (
  coupon_id IN (SELECT id FROM coupons WHERE store_id IN (
    SELECT store_id FROM store_users WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "coupon_uses_insert" ON coupon_uses FOR INSERT WITH CHECK (true);

-- RLS para marketing_campaigns
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_all" ON marketing_campaigns FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- Função para gerar link compartilhável
CREATE OR REPLACE FUNCTION generate_coupon_link(coupon_id UUID)
RETURNS TEXT AS $$
DECLARE
  link_code TEXT;
BEGIN
  link_code := encode(gen_random_bytes(8), 'hex');
  UPDATE coupons SET shareable_link = link_code WHERE id = coupon_id;
  RETURN link_code;
END;
$$ LANGUAGE plpgsql;

-- Função para validar cupom avançado
CREATE OR REPLACE FUNCTION validate_coupon_advanced(
  p_store_id UUID,
  p_code TEXT,
  p_subtotal DECIMAL,
  p_customer_email TEXT DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL,
  p_is_first_purchase BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount DECIMAL;
  v_result JSONB;
  v_used_count INTEGER;
BEGIN
  -- Buscar cupom
  SELECT * INTO v_coupon FROM coupons 
  WHERE store_id = p_store_id 
    AND UPPER(code) = UPPER(p_code)
    AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom não encontrado');
  END IF;
  
  -- Verificar datas
  IF v_coupon.starts_at IS NOT NULL AND NOW() < v_coupon.starts_at THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom ainda não está ativo');
  END IF;
  
  IF v_coupon.ends_at IS NOT NULL AND NOW() > v_coupon.ends_at THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom expirado');
  END IF;
  
  -- Verificar limite de usos
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom esgotado');
  END IF;
  
  -- Verificar valor mínimo
  IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object('valid', false, 'reason', 
      format('Valor mínimo: R$ %s', v_coupon.min_order_amount));
  END IF;
  
  -- Verificar uso por cliente
  IF v_coupon.one_per_customer = TRUE AND p_customer_email IS NOT NULL THEN
    SELECT COUNT(*) INTO v_used_count FROM coupon_uses 
    WHERE coupon_id = v_coupon.id AND customer_email = p_customer_email;
    
    IF v_used_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'Você já usou este cupom');
    END IF;
  END IF;
  
  -- Verificar primeira compra
  IF v_coupon.coupon_type = 'first_purchase' AND p_is_first_purchase = FALSE THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom válido apenas para primeira compra');
  END IF;
  
  -- Calcular desconto
  IF v_coupon.type = 'percent' THEN
    v_discount := p_subtotal * (v_coupon.value / 100);
  ELSE
    v_discount := v_coupon.value;
  END IF;
  
  -- Limitar desconto ao subtotal
  IF v_discount > p_subtotal THEN
    v_discount := p_subtotal;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'discount_amount', v_discount,
    'coupon_id', v_coupon.id,
    'coupon_code', v_coupon.code,
    'coupon_type', v_coupon.type,
    'coupon_value', v_coupon.value,
    'free_shipping', COALESCE(v_coupon.free_shipping, false)
  );
END;
$$ LANGUAGE plpgsql;

-- Função para registrar uso de cupom
CREATE OR REPLACE FUNCTION use_coupon(
  p_coupon_id UUID,
  p_customer_email TEXT,
  p_order_id UUID,
  p_discount_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  -- Registrar uso
  INSERT INTO coupon_uses (coupon_id, customer_email, order_id, discount_amount)
  VALUES (p_coupon_id, p_customer_email, p_order_id, p_discount_amount)
  ON CONFLICT (coupon_id, customer_email) DO NOTHING;
  
  -- Atualizar contadores
  UPDATE coupons SET 
    uses_count = uses_count + 1,
    total_orders_used = total_orders_used + 1,
    total_discount_given = total_discount_given + p_discount_amount
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;
