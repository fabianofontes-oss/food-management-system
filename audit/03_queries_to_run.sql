-- ============================================================================
-- ETAPA 3 — QUERIES PARA EXECUTAR NO SUPABASE SQL EDITOR
-- Auditoria de RLS, Policies, Grants e SECURITY DEFINER
-- Data: 2024-12-19
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Execute cada query no Supabase SQL Editor
-- 2. Exporte/copie os resultados em formato CSV
-- 3. Salve cada resultado no arquivo indicado
-- ============================================================================

-- ============================================================================
-- 3.1 — RLS habilitado/forçado por tabela
-- Salvar como: audit/03a_rls_status.csv
-- ============================================================================

SELECT
  n.nspname AS schema,
  c.relname AS table,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY 1,2;

-- ============================================================================
-- 3.2 — Policies (pg_policies) completas
-- Salvar como: audit/03b_policies.csv
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
ORDER BY tablename, policyname;

-- ============================================================================
-- 3.2.1 — Policies permissivas (caça-permissiva)
-- Salvar como: audit/03b_policies_permissive.csv
-- ============================================================================

SELECT
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  roles, 
  qual, 
  with_check
FROM pg_policies
WHERE schemaname='public'
  AND (qual IS NULL OR qual='true' OR qual ILIKE '% true %')
ORDER BY tablename, policyname;

-- ============================================================================
-- 3.3 — Grants (anon/authenticated/service_role)
-- Salvar como: audit/03c_grants.csv
-- ============================================================================

SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','service_role')
ORDER BY grantee, table_name, privilege_type;

-- ============================================================================
-- 3.4 — Funções SECURITY DEFINER
-- Salvar como: audit/03d_security_definer_functions.csv
-- ============================================================================

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  pg_get_function_identity_arguments(p.oid) AS args,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY security_definer DESC, function_name;

-- ============================================================================
-- 3.4.1 — DDL de funções SECURITY DEFINER (executar para cada função encontrada)
-- ============================================================================
-- Para cada função com security_definer=true, executar:
-- SELECT pg_get_functiondef('public.NOME_FUNCAO(ARGTYPES)'::regprocedure);
-- Salvar os DDLs em audit/03d_security_definer_ddls.txt

-- ============================================================================
-- 3.5 — Tabelas sem RLS mas com dados sensíveis (verificação extra)
-- ============================================================================

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname AND p.schemaname = 'public') AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- ============================================================================
-- 3.6 — Colunas de isolamento (tenant_id, store_id) por tabela
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('tenant_id', 'store_id', 'user_id')
ORDER BY table_name, column_name;

-- ============================================================================
-- 3.7 — Tabelas com RLS mas SEM policies (bloqueio total)
-- ============================================================================

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname AND p.schemaname = 'public') AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.tablename = c.relname 
    AND p.schemaname = 'public'
  )
ORDER BY c.relname;

-- ============================================================================
-- FIM DAS QUERIES
-- ============================================================================
