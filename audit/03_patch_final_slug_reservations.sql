-- ============================================================================
-- PATCH FINAL - Corrigir slug_reservations_insert
-- Data: 2024-12-19
-- ============================================================================
-- PROBLEMA: Policy slug_reservations_insert tem WITH CHECK null
-- Isso permite INSERT sem validações de expiração
-- ============================================================================

-- Remover policy sem validação
DROP POLICY IF EXISTS "slug_reservations_insert" ON public.slug_reservations;

-- Recriar com validação correta
CREATE POLICY "slug_reservations_insert" ON public.slug_reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    expires_at > now() AND
    expires_at <= now() + interval '24 hours'
  );

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'slug_reservations'
ORDER BY policyname;

-- Resultado esperado:
-- slug_reservations_insert deve ter qual com validação de expires_at

-- ============================================================================
-- FIM DO PATCH
-- ============================================================================
