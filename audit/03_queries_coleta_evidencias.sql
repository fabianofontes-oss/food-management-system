-- ============================================================================
-- ETAPA 3 - COLETA DE EVIDÊNCIAS REAIS DO SUPABASE
-- Data: 2024-12-19
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Execute cada query abaixo no Supabase SQL Editor
-- 2. Exporte/copie os resultados
-- 3. Salve nos arquivos indicados
-- 4. NÃO invente dados - apenas resultados reais
-- ============================================================================

-- ============================================================================
-- PASSO 0A — INVENTÁRIO: Tabelas do schema public
-- Salvar como: audit/03_00_public_tables.csv e audit/03_00_public_tables.txt
-- ============================================================================

SELECT schemaname AS schema, tablename AS table
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY 1,2;

-- ============================================================================
-- PASSO 0B — INVENTÁRIO: Views do schema public (opcional)
-- Salvar como: audit/03_00_public_views.txt
-- ============================================================================

SELECT table_schema AS schema, table_name AS view
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY 1,2;

-- ============================================================================
-- PASSO 1 — RLS por tabela (com contagem de policies)
-- Salvar como: audit/03a_rls_status.csv e audit/03a_rls_status.txt
-- ============================================================================

SELECT
  n.nspname AS schema,
  c.relname AS table,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY 1,2;

-- ============================================================================
-- PASSO 2 — Policies (detalhe completo)
-- Salvar como: audit/03b_policies.csv e audit/03b_policies.txt
-- ============================================================================

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
ORDER BY 1,2,3;

-- ============================================================================
-- PASSO 3 — Grants (anon/authenticated/service_role)
-- Salvar como: audit/03c_grants.csv e audit/03c_grants.txt
-- ============================================================================

SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','service_role')
ORDER BY 1,2,3,4;

-- ============================================================================
-- PASSO 4 — Roles com BYPASSRLS (importante para interpretar RLS)
-- Salvar como: audit/03c_roles_bypassrls.csv e audit/03c_roles_bypassrls.txt
-- ============================================================================

SELECT
  rolname,
  rolbypassrls,
  rolsuper,
  rolcreaterole,
  rolcreatedb
FROM pg_roles
WHERE rolname IN ('anon','authenticated','service_role')
ORDER BY rolname;

-- ============================================================================
-- PASSO 5 — Funções SECURITY DEFINER (lista)
-- Salvar como: audit/03d_security_definer_functions.csv e audit/03d_security_definer_functions.txt
-- ============================================================================

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS owner,
  l.lanname AS language
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
ORDER BY 1,2,3;

-- ============================================================================
-- PASSO 6 — DDL das funções SECURITY DEFINER (se existirem)
-- Salvar como: audit/03d_security_definer_ddls.txt
-- ============================================================================

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args,
  pg_get_functiondef(p.oid) AS ddl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY 1,2,3;

-- ============================================================================
-- PASSO 7 — CHECKLIST AUTOMÁTICO (tabelas críticas)
-- Salvar como: audit/03e_critical_tables_check.csv e audit/03e_critical_tables_check.txt
-- ============================================================================

WITH critical(table_name) AS (
  VALUES
  ('tenants'),
  ('stores'),
  ('store_users'),
  ('orders'),
  ('order_items'),
  ('customers'),
  ('products'),
  ('categories'),
  ('subscriptions'),
  ('tenant_subscriptions'),
  ('invoices'),
  ('draft_stores'),
  ('users'),
  ('payment_history'),
  ('coupons'),
  ('reviews')
)
SELECT
  'public' AS schema,
  ct.table_name AS table,
  COALESCE(c.relrowsecurity, false) AS rls_enabled,
  COALESCE(c.relforcerowsecurity, false) AS rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=ct.table_name) AS policy_count,
  CASE WHEN c.oid IS NULL THEN 'MISSING_TABLE'
       WHEN COALESCE(c.relrowsecurity,false) = false THEN 'CRITICAL_RLS_OFF'
       WHEN (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=ct.table_name) = 0 THEN 'CRITICAL_NO_POLICIES'
       ELSE 'OK'
  END AS status
FROM critical ct
LEFT JOIN pg_class c
  ON c.relname = ct.table_name
LEFT JOIN pg_namespace n
  ON n.oid = c.relnamespace AND n.nspname='public'
ORDER BY ct.table_name;

-- ============================================================================
-- FIM DAS QUERIES DE COLETA
-- ============================================================================

-- PRÓXIMOS PASSOS:
-- 1. Execute cada query acima
-- 2. Salve os resultados nos arquivos indicados
-- 3. Compartilhe os resultados para análise
-- 4. Relatório será gerado baseado SOMENTE nos dados reais coletados
