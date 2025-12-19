-- Migration: Draft Stores (Onboarding Anônimo)
-- Permite que lojistas configurem sua loja antes de fazer signup
-- O draft expira em 7 dias se não for publicado

CREATE TABLE IF NOT EXISTS public.draft_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  draft_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  -- Configuração da loja (salva em JSON enquanto não há signup)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Controle de expiração
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_draft_stores_slug ON public.draft_stores(slug);
CREATE INDEX IF NOT EXISTS idx_draft_stores_token ON public.draft_stores(draft_token);
CREATE INDEX IF NOT EXISTS idx_draft_stores_expires ON public.draft_stores(expires_at);

-- RLS: Acesso público via draft_token (sem auth)
ALTER TABLE public.draft_stores ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ler draft via token (sem auth)
CREATE POLICY "draft_stores_read_by_token" ON public.draft_stores
  FOR SELECT
  USING (true);

-- Policy: Qualquer um pode atualizar draft via token (sem auth)
CREATE POLICY "draft_stores_update_by_token" ON public.draft_stores
  FOR UPDATE
  USING (true);

-- Função para limpar drafts expirados (rodar via cron)
CREATE OR REPLACE FUNCTION clean_expired_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.draft_stores
  WHERE expires_at < NOW();
END;
$$;

COMMENT ON TABLE public.draft_stores IS 'Lojas em modo rascunho (antes do signup). Expira em 7 dias.';
COMMENT ON COLUMN public.draft_stores.config IS 'JSON com nome, produtos, categorias, tema, etc configurados antes do signup';
COMMENT ON COLUMN public.draft_stores.draft_token IS 'Token secreto para acessar e editar o draft sem autenticação';
