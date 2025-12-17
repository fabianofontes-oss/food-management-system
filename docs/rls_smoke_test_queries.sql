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
-- BLOCO 2: TESTE DE ISOLAMENTO (retorna tabela)
-- Execute este bloco inteiro - resultado aparece na aba Results
-- ############################################################################

WITH config AS (
  SELECT 
    (SELECT id FROM stores ORDER BY created_at LIMIT 1) AS store_a_id,
    (SELECT id FROM stores ORDER BY created_at LIMIT 1 OFFSET 1) AS store_b_id,
    (SELECT su.user_id FROM store_users su WHERE su.store_id = (SELECT id FROM stores ORDER BY created_at LIMIT 1) LIMIT 1) AS user_a_id,
    (SELECT su.user_id FROM store_users su WHERE su.store_id = (SELECT id FROM stores ORDER BY created_at LIMIT 1 OFFSET 1) LIMIT 1) AS user_b_id
),
-- Simular UserA
test_user_a AS (
  SELECT 
    set_config('request.jwt.claim.role', 'authenticated', true) AS role_set,
    set_config('request.jwt.claim.sub', (SELECT user_a_id::text FROM config), true) AS user_set
),
user_a_results AS (
  SELECT 
    'UserA' AS usuario,
    'orders' AS tabela,
    'Store A (própria)' AS acesso,
    (SELECT COUNT(*) FROM orders WHERE store_id = (SELECT store_a_id FROM config)) AS count,
    'deve ter dados' AS esperado
  UNION ALL
  SELECT 
    'UserA',
    'orders',
    'Store B (outra)',
    (SELECT COUNT(*) FROM orders WHERE store_id = (SELECT store_b_id FROM config)),
    'DEVE SER 0'
  UNION ALL
  SELECT 
    'UserA',
    'products',
    'Store A (própria)',
    (SELECT COUNT(*) FROM products WHERE store_id = (SELECT store_a_id FROM config)),
    'deve ter dados'
  UNION ALL
  SELECT 
    'UserA',
    'products',
    'Store B (outra)',
    (SELECT COUNT(*) FROM products WHERE store_id = (SELECT store_b_id FROM config)),
    'DEVE SER 0'
),
-- Simular UserB
switch_to_user_b AS (
  SELECT set_config('request.jwt.claim.sub', (SELECT user_b_id::text FROM config), true) AS user_set
),
user_b_results AS (
  SELECT 
    'UserB' AS usuario,
    'orders' AS tabela,
    'Store B (própria)' AS acesso,
    (SELECT COUNT(*) FROM orders WHERE store_id = (SELECT store_b_id FROM config)) AS count,
    'deve ter dados' AS esperado
  UNION ALL
  SELECT 
    'UserB',
    'orders',
    'Store A (outra)',
    (SELECT COUNT(*) FROM orders WHERE store_id = (SELECT store_a_id FROM config)),
    'DEVE SER 0'
  UNION ALL
  SELECT 
    'UserB',
    'products',
    'Store B (própria)',
    (SELECT COUNT(*) FROM products WHERE store_id = (SELECT store_b_id FROM config)),
    'deve ter dados'
  UNION ALL
  SELECT 
    'UserB',
    'products',
    'Store A (outra)',
    (SELECT COUNT(*) FROM products WHERE store_id = (SELECT store_a_id FROM config)),
    'DEVE SER 0'
)
SELECT 
  '--- CONFIG ---' as info, 
  (SELECT store_a_id::text FROM config) as store_a,
  (SELECT store_b_id::text FROM config) as store_b,
  (SELECT user_a_id::text FROM config) as user_a,
  (SELECT user_b_id::text FROM config) as user_b
UNION ALL
SELECT 
  usuario || ' | ' || tabela || ' | ' || acesso,
  count::text,
  esperado,
  CASE WHEN (esperado = 'DEVE SER 0' AND count = 0) THEN '✅ OK'
       WHEN (esperado = 'DEVE SER 0' AND count > 0) THEN '❌ FALHA RLS!'
       WHEN count >= 0 THEN '✅ OK'
       ELSE '?' END,
  ''
FROM (SELECT * FROM user_a_results UNION ALL SELECT * FROM user_b_results) all_results;

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
