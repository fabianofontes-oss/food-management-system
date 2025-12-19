-- Migration: Corrigir RLS do draft_stores
-- Problema: Policy muito permissiva (qualquer um pode ler tudo)
-- Solução: Restringir acesso apenas via service role

-- Remover policies antigas
DROP POLICY IF EXISTS "draft_stores_read_by_token" ON public.draft_stores;
DROP POLICY IF EXISTS "draft_stores_update_by_token" ON public.draft_stores;

-- Criar policy restritiva: apenas service role pode acessar
-- (draft_stores só deve ser acessado via API routes com service role)
CREATE POLICY "draft_stores_service_role_only" ON public.draft_stores
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Adicionar índice para performance (sem WHERE clause com NOW())
CREATE INDEX IF NOT EXISTS idx_draft_stores_expires_at ON public.draft_stores(expires_at);

COMMENT ON POLICY "draft_stores_service_role_only" ON public.draft_stores IS 
  'Apenas service role pode acessar draft_stores. Acesso público deve ser via API routes.';
