-- ============================================
-- ETAPA 3 - Supabase Security Audit Queries
-- Execute estas queries no Supabase SQL Editor
-- ============================================

-- 3.1 — RLS habilitado/forçado
-- Salvar resultado em: audit/03_rls_tables.txt
SELECT
  n.nspname AS schema,
  c.relname AS table,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname IN ('public')
ORDER BY 1, 2;

-- 3.2 — Policies
-- Salvar resultado em: audit/03_policies.txt
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3.3 — Grants para anon/authenticated
-- Salvar resultado em: audit/03_grants.txt
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 3.4 — Funções SECURITY DEFINER
-- Salvar resultado em: audit/03_security_definer_functions.txt
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = TRUE
ORDER BY 1, 2;

-- ============================================
-- QUERIES ADICIONAIS RECOMENDADAS
-- ============================================

-- 3.5 — Verificar policies específicas de multi-tenant
-- Procurar por policies que filtram por tenant_id ou store_id
SELECT
  tablename,
  policyname,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%tenant_id%' OR
    qual LIKE '%store_id%' OR
    with_check LIKE '%tenant_id%' OR
    with_check LIKE '%store_id%'
  )
ORDER BY tablename, policyname;

-- 3.6 — Verificar tabelas sem policies (potencial vulnerabilidade)
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = n.nspname
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relrowsecurity = TRUE
GROUP BY c.relname, c.relrowsecurity
HAVING COUNT(p.policyname) = 0
ORDER BY c.relname;

-- 3.7 — Verificar funções que acessam tabelas sensíveis
SELECT
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) LIKE '%tenants%' OR
    pg_get_functiondef(p.oid) LIKE '%stores%' OR
    pg_get_functiondef(p.oid) LIKE '%orders%' OR
    pg_get_functiondef(p.oid) LIKE '%subscriptions%'
  )
ORDER BY p.proname;
