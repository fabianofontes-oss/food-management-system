-- ============================================================================
-- RLS SMOKE TEST - Queries para Validação de Isolamento Multi-Store
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no Supabase SQL Editor
-- 2. ANTES de executar, substitua os UUIDs marcados com <<<SUBSTITUIR>>>
-- 3. Verifique os resultados conforme comentado
-- ============================================================================

-- ############################################################################
-- PASSO 0: DESCOBRIR STORES E USERS EXISTENTES
-- ############################################################################

-- Listar lojas existentes
SELECT id, name, slug, is_active 
FROM stores 
ORDER BY created_at 
LIMIT 10;

-- Listar usuários e seus vínculos
SELECT 
  u.id as user_id,
  u.email,
  su.store_id,
  s.name as store_name,
  s.slug as store_slug,
  su.role
FROM auth.users u
JOIN public.store_users su ON su.user_id = u.id
JOIN public.stores s ON s.id = su.store_id
ORDER BY s.name, u.email
LIMIT 20;

-- ############################################################################
-- PASSO 1: DEFINIR UUIDs PARA O TESTE
-- ############################################################################
-- Substitua os valores abaixo pelos UUIDs reais do seu sistema:

-- Store A: <<<SUBSTITUIR>>>
-- Store B: <<<SUBSTITUIR>>>
-- User A (vinculado só à Store A): <<<SUBSTITUIR>>>
-- User B (vinculado só à Store B): <<<SUBSTITUIR>>>

-- ############################################################################
-- PASSO 2: SIMULAR USER A (vinculado à Store A)
-- ############################################################################

-- Configurar JWT claims para simular UserA
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '<<<USERA_UUID>>>', true);

-- Verificar configuração
SELECT 
  current_setting('request.jwt.claim.role', true) as role,
  current_setting('request.jwt.claim.sub', true) as user_id;

-- ============================================================================
-- TESTE 2.1: UserA acessa dados da PRÓPRIA loja (Store A)
-- ESPERADO: Retornar dados (count > 0 se existirem)
-- ============================================================================

SELECT 'orders (Store A)' as tabela, COUNT(*) as total 
FROM public.orders WHERE store_id = '<<<STOREA_UUID>>>';

SELECT 'products (Store A)' as tabela, COUNT(*) as total 
FROM public.products WHERE store_id = '<<<STOREA_UUID>>>';

SELECT 'categories (Store A)' as tabela, COUNT(*) as total 
FROM public.categories WHERE store_id = '<<<STOREA_UUID>>>';

SELECT 'customers (Store A)' as tabela, COUNT(*) as total 
FROM public.customers WHERE store_id = '<<<STOREA_UUID>>>';

-- ============================================================================
-- TESTE 2.2: UserA tenta acessar dados da OUTRA loja (Store B)
-- ESPERADO: Retornar 0 (RLS bloqueando)
-- ============================================================================

SELECT 'orders (Store B - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.orders WHERE store_id = '<<<STOREB_UUID>>>';

SELECT 'products (Store B - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.products WHERE store_id = '<<<STOREB_UUID>>>';

SELECT 'categories (Store B - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.categories WHERE store_id = '<<<STOREB_UUID>>>';

SELECT 'customers (Store B - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.customers WHERE store_id = '<<<STOREB_UUID>>>';

-- ############################################################################
-- PASSO 3: SIMULAR USER B (vinculado à Store B)
-- ############################################################################

-- Configurar JWT claims para simular UserB
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '<<<USERB_UUID>>>', true);

-- Verificar configuração
SELECT 
  current_setting('request.jwt.claim.role', true) as role,
  current_setting('request.jwt.claim.sub', true) as user_id;

-- ============================================================================
-- TESTE 3.1: UserB acessa dados da PRÓPRIA loja (Store B)
-- ESPERADO: Retornar dados (count > 0 se existirem)
-- ============================================================================

SELECT 'orders (Store B)' as tabela, COUNT(*) as total 
FROM public.orders WHERE store_id = '<<<STOREB_UUID>>>';

SELECT 'products (Store B)' as tabela, COUNT(*) as total 
FROM public.products WHERE store_id = '<<<STOREB_UUID>>>';

-- ============================================================================
-- TESTE 3.2: UserB tenta acessar dados da OUTRA loja (Store A)
-- ESPERADO: Retornar 0 (RLS bloqueando)
-- ============================================================================

SELECT 'orders (Store A - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.orders WHERE store_id = '<<<STOREA_UUID>>>';

SELECT 'products (Store A - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.products WHERE store_id = '<<<STOREA_UUID>>>';

-- ############################################################################
-- PASSO 4: TESTE DE TABELAS ADICIONAIS (como UserA)
-- ############################################################################

SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '<<<USERA_UUID>>>', true);

-- Tabelas que foram corrigidas no RLS-REMAINDER-FIX
SELECT 'kitchen_chefs (Store A)' as tabela, COUNT(*) as total 
FROM public.kitchen_chefs WHERE store_id = '<<<STOREA_UUID>>>';

SELECT 'kitchen_chefs (Store B - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.kitchen_chefs WHERE store_id = '<<<STOREB_UUID>>>';

-- Store Settings (RLS estava OFF)
SELECT 'store_settings (Store A)' as tabela, COUNT(*) as total 
FROM public.store_settings WHERE store_id = '<<<STOREA_UUID>>>';

SELECT 'store_settings (Store B - BLOQUEADO)' as tabela, COUNT(*) as total 
FROM public.store_settings WHERE store_id = '<<<STOREB_UUID>>>';

-- ############################################################################
-- PASSO 5: LIMPAR CONFIGURAÇÃO (opcional)
-- ############################################################################

SELECT set_config('request.jwt.claim.role', '', true);
SELECT set_config('request.jwt.claim.sub', '', true);

-- ############################################################################
-- RESUMO DO TESTE
-- ############################################################################
-- 
-- ESPERADO:
-- - Todas as queries "Store A" como UserA devem retornar dados (se existirem)
-- - Todas as queries "Store B - BLOQUEADO" como UserA devem retornar 0
-- - Todas as queries "Store B" como UserB devem retornar dados (se existirem)
-- - Todas as queries "Store A - BLOQUEADO" como UserB devem retornar 0
--
-- SE ALGUMA QUERY "BLOQUEADO" RETORNAR > 0:
-- ⚠️ RLS NÃO ESTÁ FUNCIONANDO CORRETAMENTE!
-- Verifique se a migration foi aplicada e se a tabela tem a policy correta.
-- ############################################################################
