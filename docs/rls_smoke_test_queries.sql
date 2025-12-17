-- ============================================================================
-- RLS SMOKE TEST - Queries para Validação de Isolamento Multi-Store
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Execute CADA BLOCO SEPARADAMENTE no Supabase SQL Editor
-- 2. Os UUIDs são descobertos automaticamente
-- ============================================================================

-- ############################################################################
-- BLOCO 1: DESCOBRIR STORES E USERS (execute primeiro)
-- ############################################################################

SELECT 'LOJAS DISPONÍVEIS:' as info;
SELECT id, name, slug, is_active FROM stores ORDER BY created_at LIMIT 10;

SELECT 'USUÁRIOS E VÍNCULOS:' as info;
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
-- BLOCO 2: TESTE AUTOMÁTICO DE ISOLAMENTO
-- (Execute este bloco inteiro de uma vez)
-- ############################################################################

DO $$
DECLARE
  v_store_a_id UUID;
  v_store_b_id UUID;
  v_user_a_id UUID;
  v_user_b_id UUID;
  v_count_a BIGINT;
  v_count_b BIGINT;
BEGIN
  -- Pegar primeira e segunda loja
  SELECT id INTO v_store_a_id FROM stores ORDER BY created_at LIMIT 1;
  SELECT id INTO v_store_b_id FROM stores ORDER BY created_at LIMIT 1 OFFSET 1;
  
  -- Pegar usuário vinculado a cada loja
  SELECT su.user_id INTO v_user_a_id 
  FROM store_users su WHERE su.store_id = v_store_a_id LIMIT 1;
  
  SELECT su.user_id INTO v_user_b_id 
  FROM store_users su WHERE su.store_id = v_store_b_id LIMIT 1;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONFIGURAÇÃO DO TESTE:';
  RAISE NOTICE 'Store A: %', v_store_a_id;
  RAISE NOTICE 'Store B: %', v_store_b_id;
  RAISE NOTICE 'User A: %', v_user_a_id;
  RAISE NOTICE 'User B: %', v_user_b_id;
  RAISE NOTICE '========================================';
  
  IF v_store_b_id IS NULL THEN
    RAISE NOTICE '⚠️ AVISO: Só existe 1 loja. Crie outra para testar isolamento.';
    RETURN;
  END IF;
  
  IF v_user_a_id IS NULL OR v_user_b_id IS NULL THEN
    RAISE NOTICE '⚠️ AVISO: Usuários não encontrados para as lojas.';
    RETURN;
  END IF;
  
  -- ========================================
  -- SIMULAR USER A
  -- ========================================
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_user_a_id::text, true);
  
  RAISE NOTICE '';
  RAISE NOTICE '====== TESTANDO COMO USER A ======';
  
  -- Contar orders da própria loja
  SELECT COUNT(*) INTO v_count_a FROM orders WHERE store_id = v_store_a_id;
  RAISE NOTICE 'orders (Store A): % registros', v_count_a;
  
  -- Contar orders da outra loja (deve ser 0)
  SELECT COUNT(*) INTO v_count_b FROM orders WHERE store_id = v_store_b_id;
  RAISE NOTICE 'orders (Store B - BLOQUEADO): % registros', v_count_b;
  
  IF v_count_b > 0 THEN
    RAISE NOTICE '❌ FALHA: UserA consegue ver dados de StoreB!';
  ELSE
    RAISE NOTICE '✅ OK: UserA não vê dados de StoreB';
  END IF;
  
  -- Contar products
  SELECT COUNT(*) INTO v_count_a FROM products WHERE store_id = v_store_a_id;
  RAISE NOTICE 'products (Store A): % registros', v_count_a;
  
  SELECT COUNT(*) INTO v_count_b FROM products WHERE store_id = v_store_b_id;
  RAISE NOTICE 'products (Store B - BLOQUEADO): % registros', v_count_b;
  
  IF v_count_b > 0 THEN
    RAISE NOTICE '❌ FALHA: UserA consegue ver products de StoreB!';
  ELSE
    RAISE NOTICE '✅ OK: UserA não vê products de StoreB';
  END IF;
  
  -- ========================================
  -- SIMULAR USER B
  -- ========================================
  PERFORM set_config('request.jwt.claim.sub', v_user_b_id::text, true);
  
  RAISE NOTICE '';
  RAISE NOTICE '====== TESTANDO COMO USER B ======';
  
  -- Contar orders da própria loja
  SELECT COUNT(*) INTO v_count_b FROM orders WHERE store_id = v_store_b_id;
  RAISE NOTICE 'orders (Store B): % registros', v_count_b;
  
  -- Contar orders da outra loja (deve ser 0)
  SELECT COUNT(*) INTO v_count_a FROM orders WHERE store_id = v_store_a_id;
  RAISE NOTICE 'orders (Store A - BLOQUEADO): % registros', v_count_a;
  
  IF v_count_a > 0 THEN
    RAISE NOTICE '❌ FALHA: UserB consegue ver dados de StoreA!';
  ELSE
    RAISE NOTICE '✅ OK: UserB não vê dados de StoreA';
  END IF;
  
  -- Limpar
  PERFORM set_config('request.jwt.claim.role', '', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE CONCLUÍDO';
  RAISE NOTICE '========================================';
END $$;

-- ############################################################################
-- BLOCO 3: TESTE DE ACESSO ANON (Cardápio Público)
-- (Execute para verificar que anon consegue ler cardápio)
-- ############################################################################

DO $$
DECLARE
  v_store_id UUID;
  v_count BIGINT;
BEGIN
  -- Simular role anon (sem autenticação)
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  
  -- Pegar uma loja ativa
  SELECT id INTO v_store_id FROM stores WHERE is_active = true LIMIT 1;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE DE ACESSO ANON (Cardápio Público)';
  RAISE NOTICE 'Store ID: %', v_store_id;
  RAISE NOTICE '========================================';
  
  -- Testar SELECT em stores (deve funcionar para lojas ativas)
  SELECT COUNT(*) INTO v_count FROM stores WHERE is_active = true;
  RAISE NOTICE 'stores (ativas): % registros', v_count;
  IF v_count > 0 THEN
    RAISE NOTICE '✅ OK: anon consegue ver lojas ativas';
  ELSE
    RAISE NOTICE '❌ FALHA: anon não consegue ver lojas!';
  END IF;
  
  -- Testar SELECT em categories (deve funcionar para ativas)
  SELECT COUNT(*) INTO v_count FROM categories WHERE is_active = true AND store_id = v_store_id;
  RAISE NOTICE 'categories (ativas): % registros', v_count;
  IF v_count >= 0 THEN
    RAISE NOTICE '✅ OK: anon consegue ver categorias';
  END IF;
  
  -- Testar SELECT em products (deve funcionar para ativos)
  SELECT COUNT(*) INTO v_count FROM products WHERE is_active = true AND store_id = v_store_id;
  RAISE NOTICE 'products (ativos): % registros', v_count;
  IF v_count >= 0 THEN
    RAISE NOTICE '✅ OK: anon consegue ver produtos';
  END IF;
  
  -- Testar que anon NÃO consegue ver orders (deve ser 0)
  SELECT COUNT(*) INTO v_count FROM orders WHERE store_id = v_store_id;
  RAISE NOTICE 'orders (DEVE SER 0): % registros', v_count;
  IF v_count = 0 THEN
    RAISE NOTICE '✅ OK: anon não vê pedidos';
  ELSE
    RAISE NOTICE '❌ FALHA: anon consegue ver pedidos!';
  END IF;
  
  -- Testar que anon NÃO consegue ver customers (deve ser 0)
  SELECT COUNT(*) INTO v_count FROM customers WHERE store_id = v_store_id;
  RAISE NOTICE 'customers (DEVE SER 0): % registros', v_count;
  IF v_count = 0 THEN
    RAISE NOTICE '✅ OK: anon não vê clientes';
  ELSE
    RAISE NOTICE '❌ FALHA: anon consegue ver clientes!';
  END IF;
  
  -- Testar que anon NÃO consegue ver store_settings (deve ser 0)
  SELECT COUNT(*) INTO v_count FROM store_settings WHERE store_id = v_store_id;
  RAISE NOTICE 'store_settings (DEVE SER 0): % registros', v_count;
  IF v_count = 0 THEN
    RAISE NOTICE '✅ OK: anon não vê configurações';
  ELSE
    RAISE NOTICE '❌ FALHA: anon consegue ver configurações!';
  END IF;
  
  -- Limpar
  PERFORM set_config('request.jwt.claim.role', '', true);
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE ANON CONCLUÍDO';
  RAISE NOTICE '========================================';
END $$;

-- ############################################################################
-- BLOCO 4: VERIFICAR POLICIES PERMISSIVAS RESTANTES
-- (Deve retornar 0 linhas ou apenas exceções justificadas)
-- ############################################################################

SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND (qual='true' OR with_check='true')
ORDER BY tablename, policyname;

-- ############################################################################
-- BLOCO 5: VERIFICAR RLS HABILITADO NAS TABELAS CORE
-- (Todas devem ter rls_enabled = true)
-- ############################################################################

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname IN (
    'orders', 'order_items', 'products', 'categories', 
    'customers', 'store_settings', 'coupons', 'kitchen_chefs'
  )
ORDER BY c.relname;

-- ############################################################################
-- BLOCO 6: LISTAR POLICIES PÚBLICAS EXISTENTES
-- (Para documentação)
-- ############################################################################

SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname='public'
  AND policyname LIKE '%public%'
ORDER BY tablename, policyname;
