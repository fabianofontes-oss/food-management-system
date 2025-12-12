-- Migration: Plans and Tenant Subscriptions
-- Description: Adiciona tabelas para gestão de planos e assinaturas de tenants
-- Date: 2024-12-11

-- 1. Tabela de Planos
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  price_yearly_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'BRL',
  
  -- Campos flexíveis para o FUTURO (não serão usados na lógica agora)
  features JSONB,
  limits JSONB,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Assinatura atual de cada Tenant
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  
  status TEXT NOT NULL DEFAULT 'active',
  renew_period TEXT NOT NULL DEFAULT 'month',
  
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_plans_slug ON public.plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON public.tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON public.tenant_subscriptions(status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir planos padrão (opcional - pode ser removido se preferir criar via UI)
INSERT INTO public.plans (name, slug, price_monthly_cents, price_yearly_cents, features, is_active)
VALUES 
  ('Básico', 'basic', 4900, 49000, '{"note": "Plano básico para começar"}', true),
  ('Profissional', 'pro', 9900, 99000, '{"note": "Plano profissional com mais recursos"}', true),
  ('Premium', 'premium', 19900, 199000, '{"note": "Plano premium com todos os recursos"}', true)
ON CONFLICT (slug) DO NOTHING;
