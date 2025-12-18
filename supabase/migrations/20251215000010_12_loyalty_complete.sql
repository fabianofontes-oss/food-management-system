-- Migration: Sistema Completo de Fidelidade e Retenção
-- Baseado na especificação Tropical Freeze OS

-- ============================================
-- 1. CAMPO BIRTH_DATE EM CUSTOMERS
-- ============================================
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_date_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_bonus_given BOOLEAN DEFAULT FALSE;

-- Índice para busca de aniversariantes
CREATE INDEX IF NOT EXISTS idx_customers_birth_date ON public.customers(birth_date);

-- ============================================
-- 2. CONFIGURAÇÃO DE FIDELIDADE POR LOJA
-- ============================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS loyalty_active BOOLEAN DEFAULT TRUE,

-- Configuração de Aniversário
ADD COLUMN IF NOT EXISTS loyalty_birthday_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS loyalty_birthday_discount_percent INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS loyalty_birthday_window VARCHAR(10) DEFAULT 'week',

-- Configuração de Bônus de Cadastro
ADD COLUMN IF NOT EXISTS loyalty_registration_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS loyalty_registration_bonus_stamps INTEGER DEFAULT 2,

-- Configuração de Retenção (Régua de Relacionamento)
ADD COLUMN IF NOT EXISTS loyalty_retention_first_warning_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS loyalty_retention_second_warning_days INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS loyalty_retention_second_warning_discount INTEGER DEFAULT 15,

-- Configuração de Pontos/Selos
ADD COLUMN IF NOT EXISTS loyalty_calculation_type VARCHAR(10) DEFAULT 'order',
ADD COLUMN IF NOT EXISTS loyalty_order_value_per_stamp DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS loyalty_stamps_to_reward INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS loyalty_reward_type VARCHAR(20) DEFAULT 'credit',
ADD COLUMN IF NOT EXISTS loyalty_reward_value DECIMAL(10,2) DEFAULT 15.00;

-- ============================================
-- 3. TABELA DE MENSAGENS DE RETENÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.retention_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  trigger_type VARCHAR(20) NOT NULL, -- 'first_warning', 'second_warning', 'birthday'
  
  message_template TEXT NOT NULL,
  include_coupon BOOLEAN DEFAULT FALSE,
  coupon_code VARCHAR(50),
  coupon_discount_percent INTEGER,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens padrão para cada loja (trigger function)
CREATE OR REPLACE FUNCTION create_default_retention_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Mensagem de primeiro aviso (30 dias)
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon)
  VALUES (
    NEW.id,
    'first_warning',
    'Oi {nome}! 👋 Faz tempo que não te vemos por aqui. Que tal um {produto} hoje? Estamos com saudades! 💜',
    FALSE
  );
  
  -- Mensagem de segundo aviso (60 dias)
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon, coupon_code, coupon_discount_percent)
  VALUES (
    NEW.id,
    'second_warning',
    'Oi {nome}! 😢 Estamos com muitas saudades! Preparamos um presente especial pra você voltar: use o cupom VOLTA15 e ganhe 15% de desconto! 🎁',
    TRUE,
    'VOLTA15',
    15
  );
  
  -- Mensagem de aniversário
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon, coupon_discount_percent)
  VALUES (
    NEW.id,
    'birthday',
    '🎂 Parabéns, {nome}! Hoje é seu dia especial e queremos comemorar com você! Ganhe {desconto}% de desconto no seu pedido. Feliz Aniversário! 🎉',
    TRUE,
    10
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar mensagens ao criar loja (só se não existir)
DROP TRIGGER IF EXISTS trigger_create_retention_messages ON public.stores;
CREATE TRIGGER trigger_create_retention_messages
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION create_default_retention_messages();

-- ============================================
-- 4. LOG DE CONTATOS DE RETENÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.retention_contact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  trigger_type VARCHAR(20) NOT NULL,
  message_sent TEXT,
  channel VARCHAR(20) DEFAULT 'whatsapp',
  
  coupon_code VARCHAR(50),
  coupon_used BOOLEAN DEFAULT FALSE,
  coupon_used_order_id UUID REFERENCES public.orders(id),
  
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_retention_log_customer ON public.retention_contact_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_retention_log_store ON public.retention_contact_log(store_id);

-- ============================================
-- 5. VIEW PARA SEMÁFORO DE CLIENTES
-- ============================================
CREATE OR REPLACE VIEW public.customer_retention_status AS
SELECT 
  c.id,
  c.store_id,
  c.name,
  c.phone,
  c.email,
  c.birth_date,
  c.created_at,
  cl.points_balance,
  cl.stamps_current,
  cl.stamps_completed,
  cl.total_orders,
  cl.total_spent,
  cl.last_order_at,
  
  -- Dias desde último pedido
  COALESCE(
    EXTRACT(DAY FROM NOW() - cl.last_order_at)::INTEGER,
    EXTRACT(DAY FROM NOW() - c.created_at)::INTEGER
  ) AS days_inactive,
  
  -- Status do semáforo
  CASE
    WHEN cl.last_order_at IS NULL AND c.created_at > NOW() - INTERVAL '7 days' THEN 'new'
    WHEN cl.last_order_at > NOW() - INTERVAL '30 days' THEN 'active'
    WHEN cl.last_order_at > NOW() - INTERVAL '60 days' THEN 'warning'
    WHEN cl.last_order_at <= NOW() - INTERVAL '60 days' THEN 'risk'
    WHEN cl.last_order_at IS NULL THEN 'inactive'
    ELSE 'unknown'
  END AS retention_status,
  
  -- É aniversariante?
  CASE
    WHEN c.birth_date IS NOT NULL 
      AND EXTRACT(MONTH FROM c.birth_date) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(DAY FROM c.birth_date) BETWEEN EXTRACT(DAY FROM NOW()) - 3 AND EXTRACT(DAY FROM NOW()) + 3
    THEN TRUE
    ELSE FALSE
  END AS is_birthday_period,
  
  -- Segmento VIP
  CASE
    WHEN cl.total_spent >= 500 THEN 'vip'
    WHEN cl.total_orders >= 10 THEN 'frequent'
    WHEN cl.total_orders >= 3 THEN 'regular'
    WHEN cl.total_orders >= 1 THEN 'new'
    ELSE 'prospect'
  END AS customer_segment

FROM public.customers c
LEFT JOIN public.customer_loyalty cl ON c.id = cl.customer_id AND c.store_id = cl.store_id;

-- ============================================
-- 6. FUNÇÃO PARA CREDITAR PONTOS
-- ============================================
CREATE OR REPLACE FUNCTION credit_loyalty_points(
  p_store_id UUID,
  p_customer_id UUID,
  p_order_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_store RECORD;
  v_loyalty RECORD;
  v_points_to_add INTEGER;
  v_loyalty_id UUID;
BEGIN
  -- Buscar config da loja
  SELECT 
    loyalty_active,
    loyalty_calculation_type,
    loyalty_order_value_per_stamp,
    loyalty_stamps_to_reward,
    loyalty_reward_type,
    loyalty_reward_value
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;
  
  -- Se fidelidade não está ativa, retorna 0
  IF NOT v_store.loyalty_active THEN
    RETURN 0;
  END IF;
  
  -- Calcular pontos baseado no tipo
  IF v_store.loyalty_calculation_type = 'order' THEN
    v_points_to_add := 1; -- 1 selo por pedido
  ELSE
    -- Pontos por valor (ex: R$ 20 = 1 selo)
    v_points_to_add := FLOOR(p_order_total / v_store.loyalty_order_value_per_stamp)::INTEGER;
  END IF;
  
  -- Se não ganha nenhum ponto, retorna
  IF v_points_to_add <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Buscar ou criar registro de fidelidade do cliente
  SELECT id, stamps_current INTO v_loyalty
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;
  
  IF v_loyalty.id IS NULL THEN
    -- Criar novo registro
    INSERT INTO public.customer_loyalty (customer_id, store_id, stamps_current, points_balance, total_orders, total_spent, last_order_at)
    VALUES (p_customer_id, p_store_id, v_points_to_add, v_points_to_add, 1, p_order_total, NOW())
    RETURNING id INTO v_loyalty_id;
  ELSE
    -- Atualizar registro existente
    UPDATE public.customer_loyalty
    SET 
      stamps_current = stamps_current + v_points_to_add,
      points_balance = points_balance + v_points_to_add,
      points_earned_total = points_earned_total + v_points_to_add,
      total_orders = total_orders + 1,
      total_spent = total_spent + p_order_total,
      last_order_at = NOW(),
      updated_at = NOW()
    WHERE id = v_loyalty.id;
    
    v_loyalty_id := v_loyalty.id;
  END IF;
  
  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    order_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty_id,
    p_store_id,
    p_order_id,
    'earn',
    v_points_to_add,
    v_points_to_add,
    'Pedido #' || p_order_id::TEXT
  );
  
  RETURN v_points_to_add;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNÇÃO PARA DAR BÔNUS DE CADASTRO
-- ============================================
CREATE OR REPLACE FUNCTION give_registration_bonus(
  p_store_id UUID,
  p_customer_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_store RECORD;
  v_customer RECORD;
  v_loyalty_id UUID;
  v_bonus INTEGER;
BEGIN
  -- Verificar se já recebeu bônus
  SELECT registration_bonus_given INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id;
  
  IF v_customer.registration_bonus_given THEN
    RETURN 0;
  END IF;
  
  -- Buscar config da loja
  SELECT 
    loyalty_active,
    loyalty_registration_active,
    loyalty_registration_bonus_stamps
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;
  
  -- Verificar se bônus está ativo
  IF NOT v_store.loyalty_active OR NOT v_store.loyalty_registration_active THEN
    RETURN 0;
  END IF;
  
  v_bonus := v_store.loyalty_registration_bonus_stamps;
  
  -- Buscar ou criar registro de fidelidade
  SELECT id INTO v_loyalty_id
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;
  
  IF v_loyalty_id IS NULL THEN
    INSERT INTO public.customer_loyalty (customer_id, store_id, stamps_current, points_balance)
    VALUES (p_customer_id, p_store_id, v_bonus, v_bonus)
    RETURNING id INTO v_loyalty_id;
  ELSE
    UPDATE public.customer_loyalty
    SET 
      stamps_current = stamps_current + v_bonus,
      points_balance = points_balance + v_bonus,
      points_earned_total = points_earned_total + v_bonus,
      updated_at = NOW()
    WHERE id = v_loyalty_id;
  END IF;
  
  -- Marcar que recebeu bônus
  UPDATE public.customers
  SET 
    registration_bonus_given = TRUE,
    registration_completed = TRUE
  WHERE id = p_customer_id;
  
  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty_id,
    p_store_id,
    'bonus',
    v_bonus,
    v_bonus,
    'Bônus de cadastro completo'
  );
  
  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO PARA RESGATAR PONTOS
-- ============================================
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_store_id UUID,
  p_customer_id UUID,
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_store RECORD;
  v_loyalty RECORD;
  v_stamps_required INTEGER;
  v_reward_value DECIMAL;
BEGIN
  -- Buscar config da loja
  SELECT 
    loyalty_stamps_to_reward,
    loyalty_reward_type,
    loyalty_reward_value
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;
  
  v_stamps_required := v_store.loyalty_stamps_to_reward;
  v_reward_value := v_store.loyalty_reward_value;
  
  -- Buscar saldo do cliente
  SELECT id, stamps_current INTO v_loyalty
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;
  
  -- Verificar se tem selos suficientes
  IF v_loyalty.stamps_current < v_stamps_required THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Selos insuficientes',
      'stamps_current', COALESCE(v_loyalty.stamps_current, 0),
      'stamps_required', v_stamps_required
    );
  END IF;
  
  -- Deduzir selos
  UPDATE public.customer_loyalty
  SET 
    stamps_current = stamps_current - v_stamps_required,
    points_redeemed_total = points_redeemed_total + v_stamps_required,
    stamps_completed = stamps_completed + 1,
    updated_at = NOW()
  WHERE id = v_loyalty.id;
  
  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    order_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty.id,
    p_store_id,
    p_order_id,
    'redeem',
    -v_stamps_required,
    -v_stamps_required,
    'Resgate de prêmio - R$ ' || v_reward_value::TEXT
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'reward_type', v_store.loyalty_reward_type,
    'reward_value', v_reward_value,
    'stamps_used', v_stamps_required,
    'stamps_remaining', v_loyalty.stamps_current - v_stamps_required
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. RLS POLICIES
-- ============================================
ALTER TABLE public.retention_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_contact_log ENABLE ROW LEVEL SECURITY;

-- Políticas para retention_messages
 DROP POLICY IF EXISTS "retention_messages_select" ON public.retention_messages;
CREATE POLICY "retention_messages_select" ON public.retention_messages
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

 DROP POLICY IF EXISTS "retention_messages_insert" ON public.retention_messages;
CREATE POLICY "retention_messages_insert" ON public.retention_messages
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid() AND role::text IN ('owner', 'manager')
    )
  );

 DROP POLICY IF EXISTS "retention_messages_update" ON public.retention_messages;
CREATE POLICY "retention_messages_update" ON public.retention_messages
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid() AND role::text IN ('owner', 'manager')
    )
  );

-- Políticas para retention_contact_log
 DROP POLICY IF EXISTS "retention_log_select" ON public.retention_contact_log;
CREATE POLICY "retention_log_select" ON public.retention_contact_log
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

 DROP POLICY IF EXISTS "retention_log_insert" ON public.retention_contact_log;
CREATE POLICY "retention_log_insert" ON public.retention_contact_log
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================
COMMENT ON COLUMN public.stores.loyalty_calculation_type IS 'order = 1 selo por pedido, value = selos por valor gasto';
COMMENT ON COLUMN public.stores.loyalty_birthday_window IS 'day, week ou month';
COMMENT ON VIEW public.customer_retention_status IS 'View com status de retenção (semáforo) de cada cliente';
COMMENT ON FUNCTION credit_loyalty_points IS 'Credita pontos/selos ao cliente após pedido';
COMMENT ON FUNCTION give_registration_bonus IS 'Dá bônus de selos ao completar cadastro';
COMMENT ON FUNCTION redeem_loyalty_points IS 'Resgata pontos/selos por desconto';
