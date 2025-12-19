-- Migration: Subscriptions (Billing e Trial)
-- Gerencia assinaturas, trials e pagamentos dos tenants

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Plano e status
  plan_id TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  
  -- Trial
  trial_ends_at TIMESTAMPTZ,
  
  -- Período atual de cobrança
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  
  -- Integração com gateway de pagamento
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  -- Cancelamento
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_trial_ends ON public.subscriptions(trial_ends_at);
CREATE UNIQUE INDEX idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver subscriptions dos tenants onde é owner da store
CREATE POLICY "subscriptions_select_own_tenant" ON public.subscriptions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT DISTINCT s.tenant_id 
      FROM public.stores s
      JOIN public.store_users su ON su.store_id = s.id
      WHERE su.user_id = auth.uid() AND su.role = 'OWNER'
    )
  );

-- Policy: Service role pode fazer tudo
CREATE POLICY "subscriptions_service_role_all" ON public.subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Função para verificar se tenant está em trial ativo
CREATE OR REPLACE FUNCTION is_trial_active(tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trial_end TIMESTAMPTZ;
  sub_status TEXT;
BEGIN
  SELECT trial_ends_at, status INTO trial_end, sub_status
  FROM public.subscriptions
  WHERE tenant_id = tenant_uuid
  LIMIT 1;
  
  IF trial_end IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (sub_status = 'trialing' AND trial_end > NOW());
END;
$$;

-- Função para verificar se tenant tem acesso (trial ou assinatura ativa)
CREATE OR REPLACE FUNCTION has_active_subscription(tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_status TEXT;
  trial_end TIMESTAMPTZ;
BEGIN
  SELECT status, trial_ends_at INTO sub_status, trial_end
  FROM public.subscriptions
  WHERE tenant_id = tenant_uuid
  LIMIT 1;
  
  IF sub_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Trial ativo
  IF sub_status = 'trialing' AND trial_end > NOW() THEN
    RETURN true;
  END IF;
  
  -- Assinatura ativa
  IF sub_status = 'active' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

COMMENT ON TABLE public.subscriptions IS 'Assinaturas e trials dos tenants. Trial de 10 dias ao publicar loja.';
COMMENT ON COLUMN public.subscriptions.plan_id IS 'ID do plano (trial, basic, pro, enterprise)';
COMMENT ON COLUMN public.subscriptions.status IS 'Status da assinatura (trialing, active, past_due, canceled, unpaid)';
COMMENT ON COLUMN public.subscriptions.trial_ends_at IS 'Data de término do trial (10 dias após publicar)';
