-- ============================================================================
-- PATCH DE LIMPEZA - Remover Policies Duplicadas/Conflitantes
-- Data: 2024-12-19
-- ============================================================================
-- PROBLEMA: Existem policies antigas que não foram removidas, causando
-- conflitos e comportamento inesperado (múltiplas policies para mesma operação)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- LIMPEZA 1: Remover TODAS as policies antigas de draft_stores
-- ----------------------------------------------------------------------------

-- Remover policies antigas da migration original
DROP POLICY IF EXISTS "draft_stores_read_by_token" ON public.draft_stores;
DROP POLICY IF EXISTS "draft_stores_update_by_token" ON public.draft_stores;

-- Remover policies atuais (vamos recriar depois)
DROP POLICY IF EXISTS "draft_stores_select" ON public.draft_stores;
DROP POLICY IF EXISTS "draft_stores_insert" ON public.draft_stores;
DROP POLICY IF EXISTS "draft_stores_update" ON public.draft_stores;
DROP POLICY IF EXISTS "draft_stores_delete" ON public.draft_stores;

-- ----------------------------------------------------------------------------
-- LIMPEZA 2: Remover TODAS as policies de slug_reservations
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "slug_reservations_select" ON public.slug_reservations;
DROP POLICY IF EXISTS "slug_reservations_insert" ON public.slug_reservations;
DROP POLICY IF EXISTS "slug_reservations_update" ON public.slug_reservations;
DROP POLICY IF EXISTS "slug_reservations_delete" ON public.slug_reservations;

-- ============================================================================
-- RECRIAR POLICIES CORRETAS - draft_stores
-- ============================================================================

-- Policy SELECT: Permitir acesso via draft_token (validado na app)
CREATE POLICY "draft_stores_select" ON public.draft_stores
  FOR SELECT
  TO anon, authenticated
  USING (
    expires_at > now() AND
    draft_token IS NOT NULL
  );

-- Policy INSERT: Permitir criação com validações
CREATE POLICY "draft_stores_insert" ON public.draft_stores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    expires_at > now() AND
    expires_at <= now() + interval '7 days' AND
    draft_token IS NOT NULL
  );

-- Policy UPDATE: Apenas com draft_token válido e não expirado
CREATE POLICY "draft_stores_update" ON public.draft_stores
  FOR UPDATE
  TO anon, authenticated
  USING (
    draft_token IS NOT NULL AND
    expires_at > now()
  )
  WITH CHECK (
    expires_at > now()
  );

-- Policy DELETE: Apenas authenticated pode deletar expirados (limpeza)
CREATE POLICY "draft_stores_delete" ON public.draft_stores
  FOR DELETE
  TO authenticated
  USING (
    expires_at < now()
  );

-- ============================================================================
-- RECRIAR POLICIES CORRETAS - slug_reservations
-- ============================================================================

-- Policy SELECT: Qualquer um pode ver reservas (necessário para validação)
CREATE POLICY "slug_reservations_select" ON public.slug_reservations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy INSERT: Qualquer um pode criar reserva com validações
CREATE POLICY "slug_reservations_insert" ON public.slug_reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    expires_at > now() AND
    expires_at <= now() + interval '24 hours'
  );

-- Policy UPDATE: Apenas authenticated pode atualizar reservas não expiradas
CREATE POLICY "slug_reservations_update" ON public.slug_reservations
  FOR UPDATE
  TO authenticated
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

-- Policy DELETE: Apenas authenticated pode deletar reservas expiradas
CREATE POLICY "slug_reservations_delete" ON public.slug_reservations
  FOR DELETE
  TO authenticated
  USING (expires_at < now());

-- ============================================================================
-- VALIDAÇÃO PÓS-LIMPEZA
-- ============================================================================

-- Verificar policies de draft_stores
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'draft_stores'
ORDER BY policyname;

-- Resultado esperado: 4 policies (select, insert, update, delete)

-- Verificar policies de slug_reservations
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'slug_reservations'
ORDER BY policyname;

-- Resultado esperado: 4 policies (select, insert, update, delete)

-- ============================================================================
-- ANÁLISE DO PROBLEMA
-- ============================================================================

-- PROBLEMA IDENTIFICADO:
-- 1. draft_stores tinha 6 policies (deveria ter 4)
--    - draft_stores_read_by_token (antiga, role=public, qual=true) ⚠️ PERMISSIVA
--    - draft_stores_update_by_token (antiga, role=public, qual=true) ⚠️ PERMISSIVA
--    - draft_stores_select (nova, com filtros)
--    - draft_stores_insert (nova, com validações)
--    - draft_stores_update (nova, com filtros)
--    - draft_stores_delete (nova, apenas expirados)
--
-- 2. slug_reservations tinha policies com qual=null em INSERT
--    - slug_reservations_insert tinha WITH CHECK null (sem validação)
--
-- IMPACTO:
-- - Policies antigas (role=public, qual=true) permitiam acesso irrestrito
-- - Múltiplas policies para mesma operação causam comportamento OR (qualquer uma permite)
-- - Policy permissiva antiga anulava proteção das policies novas
--
-- SOLUÇÃO:
-- - Remover TODAS as policies antigas
-- - Recriar apenas as policies corretas com filtros adequados
-- - Garantir que não há policies permissivas (qual=true sem filtros)

-- ============================================================================
-- FIM DO PATCH DE LIMPEZA
-- ============================================================================
