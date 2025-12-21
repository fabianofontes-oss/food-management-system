-- ============================================================
-- MIGRATION: Stripe Billing Fields
-- Data: 21/12/2024
-- Objetivo: Adicionar campos necessários para integração Stripe
-- ============================================================

-- Adicionar campos Stripe em subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- Criar tabela de eventos de billing
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  data JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para billing_events
CREATE INDEX IF NOT EXISTS idx_billing_events_tenant_id ON billing_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event_id ON billing_events(stripe_event_id);

-- RLS para billing_events
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_events_select_own_tenant ON billing_events
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT DISTINCT s.tenant_id 
      FROM stores s
      JOIN store_users su ON su.store_id = s.id
      WHERE su.user_id = auth.uid() AND su.role = 'OWNER'
    )
  );

CREATE POLICY billing_events_service_role_all ON billing_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Criar tabela subscription_plans se não existir
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir planos padrão se não existirem
INSERT INTO public.subscription_plans (id, name, description, price_monthly_cents, features, limits, display_order)
VALUES 
  ('trial', 'Trial', 'Teste grátis por 10 dias', 0, '["dashboard", "products", "orders", "settings"]'::jsonb, '{"orders_per_month": 100}'::jsonb, 0),
  ('basic', 'Básico', 'Plano básico para começar', 4900, '["dashboard", "products", "orders", "settings", "pos"]'::jsonb, '{"orders_per_month": 500}'::jsonb, 1),
  ('pro', 'Pro', 'Plano completo para crescer', 14900, '["dashboard", "products", "orders", "settings", "pos", "kitchen", "delivery", "tables", "coupons", "reports"]'::jsonb, '{"orders_per_month": -1}'::jsonb, 2),
  ('enterprise', 'Enterprise', 'Plano para redes e franquias', 29900, '["dashboard", "products", "orders", "settings", "pos", "kitchen", "delivery", "tables", "coupons", "reports", "analytics", "team", "inventory", "financial", "crm", "marketing"]'::jsonb, '{"orders_per_month": -1, "stores": -1}'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

-- Índices para subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_display_order ON subscription_plans(display_order);

-- RLS para subscription_plans (público para leitura)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_select_all ON subscription_plans
  FOR SELECT
  USING (true);

CREATE POLICY subscription_plans_service_role_all ON subscription_plans
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comentários
COMMENT ON TABLE billing_events IS 'Eventos de billing do Stripe para auditoria e processamento';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'ID do preço no Stripe (price_xxx)';
COMMENT ON COLUMN subscriptions.payment_method_type IS 'Tipo de pagamento (card, boleto, pix)';
COMMENT ON COLUMN subscriptions.card_last4 IS 'Últimos 4 dígitos do cartão';
COMMENT ON COLUMN subscriptions.card_brand IS 'Bandeira do cartão (visa, mastercard, etc)';
COMMENT ON COLUMN subscriptions.next_billing_date IS 'Próxima data de cobrança';
COMMENT ON COLUMN subscriptions.grace_period_ends_at IS 'Fim do período de graça após falha de pagamento';
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis';
COMMENT ON COLUMN subscription_plans.stripe_price_id IS 'ID do preço no Stripe - DEVE ser configurado após criar produtos no Stripe Dashboard';
