-- ============================================================================
-- ETAPA 3B — Supabase RLS / Policies / Grants / Functions
-- Auditoria de Isolamento Multi-Tenant
-- Data: 2024-12-19
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Cole e execute cada bloco SQL no Supabase SQL Editor
-- 2. Copie o resultado de cada query
-- 3. Salve os resultados em audit/03B_results.txt
-- 4. NÃO aplique alterações ainda (somente leitura)
-- ============================================================================

-- ============================================================================
-- 3.1 — RLS habilitado/forçado (visão geral por tabela)
-- ============================================================================
-- Objetivo: Verificar quais tabelas têm RLS habilitado e forçado
-- Risco: Tabelas sem RLS podem vazar dados entre tenants

SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  (SELECT count(*) 
   FROM pg_policies p 
   WHERE p.schemaname = n.nspname 
   AND p.tablename = c.relname) AS policy_count,
  CASE 
    WHEN c.relrowsecurity = false THEN '🔴 CRÍTICO - RLS DESABILITADO'
    WHEN c.relforcerowsecurity = false THEN '🟡 ATENÇÃO - RLS NÃO FORÇADO'
    WHEN (SELECT count(*) FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname) = 0 THEN '🔴 CRÍTICO - SEM POLICIES'
    ELSE '✅ OK'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'  -- apenas tabelas
  AND n.nspname = 'public'  -- schema público
  AND c.relname NOT LIKE 'pg_%'  -- excluir tabelas do sistema
ORDER BY 
  CASE 
    WHEN c.relrowsecurity = false THEN 1
    WHEN (SELECT count(*) FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname) = 0 THEN 2
    WHEN c.relforcerowsecurity = false THEN 3
    ELSE 4
  END,
  c.relname;

-- ============================================================================
-- 3.2 — Policies por tabela (detalhamento de permissões)
-- ============================================================================
-- Objetivo: Listar todas as policies e suas regras
-- Risco: Policies permissivas podem permitir acesso cross-tenant

SELECT
  schemaname AS schema,
  tablename AS table_name,
  policyname AS policy_name,
  permissive AS is_permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression,
  CASE 
    WHEN qual IS NULL AND cmd != 'DELETE' THEN '🔴 CRÍTICO - SEM FILTRO USING'
    WHEN with_check IS NULL AND cmd IN ('INSERT', 'UPDATE') THEN '🟡 ATENÇÃO - SEM WITH CHECK'
    WHEN qual LIKE '%true%' OR qual = '' THEN '🔴 CRÍTICO - FILTRO PERMISSIVO'
    WHEN qual NOT LIKE '%tenant_id%' AND qual NOT LIKE '%store_id%' THEN '🟡 ATENÇÃO - SEM FILTRO TENANT'
    ELSE '✅ OK'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN qual IS NULL AND cmd != 'DELETE' THEN 1
    WHEN qual LIKE '%true%' OR qual = '' THEN 2
    WHEN qual NOT LIKE '%tenant_id%' AND qual NOT LIKE '%store_id%' THEN 3
    ELSE 4
  END,
  tablename, policyname;

-- ============================================================================
-- 3.3 — Grants e permissões de roles
-- ============================================================================
-- Objetivo: Verificar permissões concedidas a roles (anon, authenticated, service_role)
-- Risco: Grants excessivos podem permitir bypass de RLS

SELECT
  grantee AS role,
  table_schema AS schema,
  table_name,
  privilege_type,
  is_grantable,
  CASE 
    WHEN grantee = 'anon' AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE') THEN '🔴 CRÍTICO - ANON COM WRITE'
    WHEN grantee = 'anon' AND privilege_type = 'SELECT' THEN '🟡 ATENÇÃO - ANON COM READ'
    WHEN grantee = 'authenticated' AND privilege_type IN ('DELETE', 'TRUNCATE') THEN '🟡 ATENÇÃO - AUTH COM DELETE'
    WHEN grantee = 'service_role' THEN '✅ OK - SERVICE ROLE'
    ELSE '✅ OK'
  END AS status
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY 
  CASE 
    WHEN grantee = 'anon' AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE') THEN 1
    WHEN grantee = 'anon' AND privilege_type = 'SELECT' THEN 2
    WHEN grantee = 'authenticated' AND privilege_type IN ('DELETE', 'TRUNCATE') THEN 3
    ELSE 4
  END,
  table_name, grantee, privilege_type;

-- ============================================================================
-- 3.4 — Functions com SECURITY DEFINER
-- ============================================================================
-- Objetivo: Identificar functions que executam com privilégios elevados
-- Risco: SECURITY DEFINER sem validação pode permitir privilege escalation

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END AS volatility,
  CASE p.prosecdef
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type,
  pg_get_functiondef(p.oid) AS function_definition,
  CASE 
    WHEN p.prosecdef = true AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%' THEN '🔴 CRÍTICO - DEFINER SEM AUTH CHECK'
    WHEN p.prosecdef = true AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%' THEN '🟡 ATENÇÃO - DEFINER SEM SEARCH_PATH'
    WHEN p.prosecdef = true THEN '🟡 ATENÇÃO - SECURITY DEFINER'
    ELSE '✅ OK'
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- apenas functions (não procedures)
ORDER BY 
  CASE 
    WHEN p.prosecdef = true AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%' THEN 1
    WHEN p.prosecdef = true AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%' THEN 2
    WHEN p.prosecdef = true THEN 3
    ELSE 4
  END,
  p.proname;

-- ============================================================================
-- 3.5 — Verificação de search_path em functions SECURITY DEFINER
-- ============================================================================
-- Objetivo: Verificar se functions SECURITY DEFINER têm search_path seguro
-- Risco: search_path inseguro pode permitir SQL injection via schema poisoning

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  CASE p.prosecdef
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type,
  proconfig AS config_settings,
  pg_get_functiondef(p.oid) AS function_definition,
  CASE 
    WHEN p.prosecdef = true AND (proconfig IS NULL OR NOT (proconfig::text LIKE '%search_path%')) THEN '🔴 CRÍTICO - SEM SEARCH_PATH SEGURO'
    WHEN p.prosecdef = true THEN '✅ OK - TEM SEARCH_PATH'
    ELSE '✅ OK - INVOKER'
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prosecdef = true  -- apenas SECURITY DEFINER
ORDER BY 
  CASE 
    WHEN proconfig IS NULL OR NOT (proconfig::text LIKE '%search_path%') THEN 1
    ELSE 2
  END,
  p.proname;

-- ============================================================================
-- 3.6 — Tabelas críticas sem RLS (multi-tenant core)
-- ============================================================================
-- Objetivo: Verificar especificamente tabelas multi-tenant críticas
-- Risco: Tabelas core sem RLS = vazamento total de dados

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS policy_count,
  CASE 
    WHEN c.relrowsecurity = false THEN '🔴 CRÍTICO - RLS DESABILITADO'
    WHEN (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) = 0 THEN '🔴 CRÍTICO - SEM POLICIES'
    ELSE '✅ OK'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'tenants',
    'stores',
    'store_users',
    'products',
    'categories',
    'orders',
    'order_items',
    'invoices',
    'payments',
    'customers',
    'users'
  )
ORDER BY 
  CASE 
    WHEN c.relrowsecurity = false THEN 1
    WHEN (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) = 0 THEN 2
    ELSE 3
  END,
  c.relname;

-- ============================================================================
-- 3.7 — Policies permissivas (usando TRUE ou sem filtro tenant)
-- ============================================================================
-- Objetivo: Identificar policies que não filtram por tenant/store
-- Risco: Policies permissivas = cross-tenant data leak

SELECT
  tablename AS table_name,
  policyname AS policy_name,
  cmd AS command,
  qual AS using_expression,
  CASE 
    WHEN qual LIKE '%true%' THEN '🔴 CRÍTICO - USANDO TRUE'
    WHEN qual = '' OR qual IS NULL THEN '🔴 CRÍTICO - SEM FILTRO'
    WHEN qual NOT LIKE '%tenant_id%' AND qual NOT LIKE '%store_id%' AND qual NOT LIKE '%auth.uid()%' THEN '🔴 CRÍTICO - SEM ISOLAMENTO'
    ELSE '✅ OK'
  END AS status,
  qual AS full_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%true%'
    OR qual = ''
    OR qual IS NULL
    OR (qual NOT LIKE '%tenant_id%' AND qual NOT LIKE '%store_id%' AND qual NOT LIKE '%auth.uid()%')
  )
ORDER BY 
  CASE 
    WHEN qual LIKE '%true%' THEN 1
    WHEN qual = '' OR qual IS NULL THEN 2
    ELSE 3
  END,
  tablename;

-- ============================================================================
-- 3.8 — Verificação de colunas tenant_id/store_id
-- ============================================================================
-- Objetivo: Verificar se tabelas multi-tenant têm colunas de isolamento
-- Risco: Tabelas sem tenant_id/store_id não podem ter RLS correto

SELECT
  t.table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'tenant_id') THEN '✅ TEM tenant_id'
    ELSE '❌ SEM tenant_id'
  END AS has_tenant_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'store_id') THEN '✅ TEM store_id'
    ELSE '❌ SEM store_id'
  END AS has_store_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'user_id') THEN '✅ TEM user_id'
    ELSE '❌ SEM user_id'
  END AS has_user_id,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name IN ('tenant_id', 'store_id', 'user_id')) THEN '🔴 CRÍTICO - SEM ISOLAMENTO'
    ELSE '✅ OK'
  END AS status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
ORDER BY 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name IN ('tenant_id', 'store_id', 'user_id')) THEN 1
    ELSE 2
  END,
  t.table_name;

-- ============================================================================
-- 3.9 — Resumo de segurança multi-tenant
-- ============================================================================
-- Objetivo: Dashboard geral de segurança

SELECT
  'Total de tabelas' AS metric,
  count(*)::text AS value
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'

UNION ALL

SELECT
  'Tabelas com RLS habilitado' AS metric,
  count(*)::text AS value
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true

UNION ALL

SELECT
  'Tabelas SEM RLS' AS metric,
  count(*)::text AS value
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false

UNION ALL

SELECT
  'Tabelas com policies' AS metric,
  count(DISTINCT tablename)::text AS value
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Total de policies' AS metric,
  count(*)::text AS value
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Functions SECURITY DEFINER' AS metric,
  count(*)::text AS value
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef = true

UNION ALL

SELECT
  'Policies permissivas (TRUE)' AS metric,
  count(*)::text AS value
FROM pg_policies
WHERE schemaname = 'public' AND qual LIKE '%true%';

-- ============================================================================
-- FIM DAS QUERIES DE AUDITORIA
-- ============================================================================
-- PRÓXIMOS PASSOS:
-- 1. Copie os resultados de cada query
-- 2. Salve em audit/03B_results.txt
-- 3. Analise os resultados para identificar gaps críticos
-- 4. Gere relatório audit/03B_rls_policies_report.md
-- ============================================================================
