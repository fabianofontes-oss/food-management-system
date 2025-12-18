-- ============================================================================
-- SMOKE TESTS: Segurança Multi-tenant + Acesso Anon
-- Execute após aplicar migrations para validar RLS
-- ============================================================================

-- ============================================================================
-- TESTE 1: Acesso ANON ao cardápio público
-- ============================================================================

-- Simular role anon
SET ROLE anon;

-- ✅ DEVE FUNCIONAR: Ver lojas ativas
SELECT 'TEST 1.1: Lojas ativas' AS test;
SELECT id, name, slug, is_active FROM stores WHERE is_active = true LIMIT 5;

-- ✅ DEVE FUNCIONAR: Ver categorias ativas de lojas ativas
SELECT 'TEST 1.2: Categorias ativas' AS test;
SELECT c.id, c.name, c.store_id 
FROM categories c
JOIN stores s ON c.store_id = s.id
WHERE c.is_active = true AND s.is_active = true
LIMIT 5;

-- ✅ DEVE FUNCIONAR: Ver produtos ativos
SELECT 'TEST 1.3: Produtos ativos' AS test;
SELECT p.id, p.name, p.price, p.store_id
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE p.is_active = true AND s.is_active = true
LIMIT 5;

-- ❌ NÃO DEVE FUNCIONAR: Ver lojas inativas
SELECT 'TEST 1.4: Lojas inativas (deve retornar 0 rows)' AS test;
SELECT COUNT(*) AS lojas_inativas_visiveis FROM stores WHERE is_active = false;

-- ❌ NÃO DEVE FUNCIONAR: Ver orders
SELECT 'TEST 1.5: Orders (deve falhar ou retornar 0)' AS test;
SELECT COUNT(*) AS orders_visiveis FROM orders;

-- ❌ NÃO DEVE FUNCIONAR: Ver customers
SELECT 'TEST 1.6: Customers (deve falhar ou retornar 0)' AS test;
SELECT COUNT(*) AS customers_visiveis FROM customers;

-- ❌ NÃO DEVE FUNCIONAR: Ver store_users
SELECT 'TEST 1.7: Store users (deve falhar ou retornar 0)' AS test;
SELECT COUNT(*) AS store_users_visiveis FROM store_users;

-- Resetar role
RESET ROLE;

-- ============================================================================
-- TESTE 2: Verificar políticas existentes
-- ============================================================================

SELECT 'TEST 2: Políticas RLS por tabela' AS test;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- TESTE 3: Verificar tabelas com RLS habilitado
-- ============================================================================

SELECT 'TEST 3: Tabelas com RLS' AS test;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- TEST 1.1-1.3: Retorna dados de lojas/categorias/produtos ativos
-- TEST 1.4: Retorna 0 (lojas inativas não visíveis)
-- TEST 1.5-1.7: Retorna 0 ou erro de permissão
-- TEST 2: Lista todas as policies RLS
-- TEST 3: Mostra quais tabelas têm RLS habilitado
