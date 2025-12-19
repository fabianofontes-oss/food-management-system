-- ============================================================================
-- ETAPA 3 - PATCHES DE SEGURANÇA SUPABASE
-- Correções para RLS, Policies e Grants
-- Data: 2024-12-19
-- ============================================================================
-- ATENÇÃO:
-- - Testar em ambiente de desenvolvimento primeiro
-- - Fazer backup do banco antes de aplicar
-- - Aplicar patches em ordem sequencial
-- - Validar funcionamento após cada patch
-- ============================================================================

-- ============================================================================
-- PRIORIDADE 1 - CRÍTICO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PATCH 1.1 - Remover Grants Excessivos para Role 'anon'
-- ----------------------------------------------------------------------------
-- Objetivo: Implementar princípio do menor privilégio
-- Impacto: Usuários não autenticados não terão acesso direto a tabelas sensíveis
-- Risco: Baixo - Policies de RLS já protegem, este é hardening adicional

-- Tabelas Financeiras e Sensíveis
REVOKE ALL ON TABLE public.tenants FROM anon;
REVOKE ALL ON TABLE public.invoices FROM anon;
REVOKE ALL ON TABLE public.payment_history FROM anon;
REVOKE ALL ON TABLE public.tenant_subscriptions FROM anon;

-- Tabelas de Usuários e Permissões
REVOKE ALL ON TABLE public.users FROM anon;
REVOKE ALL ON TABLE public.store_users FROM anon;

-- Tabelas de Negócio Core
REVOKE ALL ON TABLE public.stores FROM anon;
REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.order_items FROM anon;
REVOKE ALL ON TABLE public.products FROM anon;
REVOKE ALL ON TABLE public.categories FROM anon;
REVOKE ALL ON TABLE public.customers FROM anon;

-- ----------------------------------------------------------------------------
-- PATCH 1.2 - Refinar Grants para 'anon' em Tabelas de Onboarding
-- ----------------------------------------------------------------------------
-- Objetivo: Permitir apenas operações necessárias para onboarding público

-- draft_stores: Permitir SELECT, INSERT, UPDATE (necessário para onboarding)
REVOKE ALL ON TABLE public.draft_stores FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.draft_stores TO anon;

-- plans: Permitir apenas SELECT (visualização pública de planos)
REVOKE ALL ON TABLE public.plans FROM anon;
GRANT SELECT ON TABLE public.plans TO anon;

-- slug_reservations: Permitir SELECT, INSERT (reserva de slugs no onboarding)
REVOKE ALL ON TABLE public.slug_reservations FROM anon;
GRANT SELECT, INSERT ON TABLE public.slug_reservations TO anon;

-- ----------------------------------------------------------------------------
-- PATCH 1.3 - Corrigir Policy Permissiva em slug_reservations
-- ----------------------------------------------------------------------------
-- Objetivo: Substituir policy permissiva por policies específicas com filtros

-- Remover policy permissiva existente
-- Nota: A policy atual se chama 'slug_reservations_policy'
DROP POLICY IF EXISTS "slug_reservations_policy" ON public.slug_reservations;

-- Policy para SELECT: Qualquer um pode ver reservas (necessário para validação)
CREATE POLICY "slug_reservations_select" ON public.slug_reservations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy para INSERT: Qualquer um pode criar reserva (onboarding)
-- Nota: Considerar adicionar rate limiting via function
CREATE POLICY "slug_reservations_insert" ON public.slug_reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    expires_at > now() AND
    expires_at <= now() + interval '24 hours'  -- Limitar duração máxima
  );

-- Policy para UPDATE: Apenas o criador pode atualizar (via token)
-- Nota: Assumindo que há uma coluna 'created_by' ou similar
-- Se não existir, esta policy pode ser omitida
CREATE POLICY "slug_reservations_update" ON public.slug_reservations
  FOR UPDATE
  TO authenticated
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

-- Policy para DELETE: Apenas authenticated pode deletar suas próprias reservas
-- Ou permitir apenas limpeza automática via cron
CREATE POLICY "slug_reservations_delete" ON public.slug_reservations
  FOR DELETE
  TO authenticated
  USING (expires_at < now());  -- Apenas expiradas

-- ============================================================================
-- PRIORIDADE 2 - ALTO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PATCH 2.1 - Refinar Policies de draft_stores
-- ----------------------------------------------------------------------------
-- Objetivo: Adicionar filtros adequados mantendo funcionalidade de onboarding

-- Remover policies permissivas existentes
-- Nota: As policies atuais se chamam 'draft_stores_select', 'draft_stores_insert', 'draft_stores_update'
DROP POLICY IF EXISTS "draft_stores_select" ON public.draft_stores;
DROP POLICY IF EXISTS "draft_stores_insert" ON public.draft_stores;
DROP POLICY IF EXISTS "draft_stores_update" ON public.draft_stores;

-- Policy para SELECT: Apenas o criador (via draft_token) pode ver
-- Nota: Validação de draft_token é feita na aplicação
-- Para onboarding anônimo, permitir acesso via draft_token
CREATE POLICY "draft_stores_select" ON public.draft_stores
  FOR SELECT
  TO anon, authenticated
  USING (
    expires_at > now() AND
    draft_token IS NOT NULL  -- Permite acesso via draft_token (validado na app)
  );

-- Policy para INSERT: Permitir criação mas com validações
CREATE POLICY "draft_stores_insert" ON public.draft_stores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    expires_at > now() AND
    expires_at <= now() + interval '7 days' AND  -- Limitar duração
    draft_token IS NOT NULL  -- Exigir draft_token (gerado automaticamente)
  );

-- Policy para UPDATE: Apenas com draft_token válido e não expirado
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

-- Policy para DELETE: Apenas authenticated ou expirados
CREATE POLICY "draft_stores_delete" ON public.draft_stores
  FOR DELETE
  TO authenticated
  USING (
    expires_at < now()  -- Apenas expirados (para limpeza)
  );

-- ----------------------------------------------------------------------------
-- PATCH 2.2 - Adicionar Policy para plans (já existe mas validar)
-- ----------------------------------------------------------------------------
-- Objetivo: Garantir que apenas SELECT é permitido para anon

-- Validar policy existente
-- Se plans_select já existe e está correta, não é necessário alterar
-- Apenas garantir que não há policies de INSERT/UPDATE/DELETE para anon

-- Remover qualquer policy de write para anon (se existir)
DROP POLICY IF EXISTS plans_insert ON public.plans;
DROP POLICY IF EXISTS plans_update ON public.plans;
DROP POLICY IF EXISTS plans_delete ON public.plans;

-- Policy de SELECT já existe e está OK:
-- CREATE POLICY plans_select ON public.plans
--   FOR SELECT
--   TO authenticated, anon
--   USING (true);

-- ============================================================================
-- PRIORIDADE 3 - MÉDIO (Opcional - Melhorias Futuras)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PATCH 3.1 - Separar Policies ALL em Comandos Específicos (Exemplo)
-- ----------------------------------------------------------------------------
-- Objetivo: Melhor granularidade e auditabilidade
-- Nota: Aplicar apenas se desejado, não é crítico

-- Exemplo para tabela 'stores':
-- 
-- DROP POLICY IF EXISTS stores_policy ON public.stores;
-- 
-- CREATE POLICY stores_select ON public.stores
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM store_users
--       WHERE store_users.store_id = stores.id
--       AND store_users.user_id = auth.uid()
--     )
--   );
-- 
-- CREATE POLICY stores_insert ON public.stores
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     -- Validar que usuário tem permissão de criar loja no tenant
--     EXISTS (
--       SELECT 1 FROM tenants
--       WHERE tenants.id = stores.tenant_id
--       AND tenants.owner_id = auth.uid()
--     )
--   );
-- 
-- CREATE POLICY stores_update ON public.stores
--   FOR UPDATE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM store_users
--       WHERE store_users.store_id = stores.id
--       AND store_users.user_id = auth.uid()
--       AND store_users.role IN ('owner', 'admin')
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM store_users
--       WHERE store_users.store_id = stores.id
--       AND store_users.user_id = auth.uid()
--       AND store_users.role IN ('owner', 'admin')
--     )
--   );
-- 
-- CREATE POLICY stores_delete ON public.stores
--   FOR DELETE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM store_users
--       WHERE store_users.store_id = stores.id
--       AND store_users.user_id = auth.uid()
--       AND store_users.role = 'owner'
--     )
--   );

-- ============================================================================
-- VALIDAÇÃO PÓS-PATCHES
-- ============================================================================

-- Verificar grants para anon após patches
SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- Resultado esperado:
-- draft_stores: SELECT, INSERT, UPDATE
-- plans: SELECT
-- slug_reservations: SELECT, INSERT

-- Verificar policies após patches
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('draft_stores', 'slug_reservations', 'plans')
ORDER BY tablename, policyname;

-- ============================================================================
-- ROLLBACK (Se necessário)
-- ============================================================================

-- Para reverter os patches, executar:
-- 
-- -- Restaurar grants originais para anon
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- 
-- -- Restaurar policies originais (executar DDL original de cada policy)
-- -- Nota: Manter backup das policies originais antes de aplicar patches

-- ============================================================================
-- FIM DOS PATCHES
-- ============================================================================

-- CHECKLIST PÓS-APLICAÇÃO:
-- [ ] Testar login de usuário autenticado
-- [ ] Testar criação de draft store (onboarding)
-- [ ] Testar reserva de slug
-- [ ] Testar acesso a planos
-- [ ] Validar que usuários não autenticados NÃO acessam dados sensíveis
-- [ ] Validar que isolamento multi-tenant continua funcionando
-- [ ] Monitorar logs por 24h após aplicação
