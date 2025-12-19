-- =====================================================
-- ETAPA 4B - QUERIES DE VALIDAÇÃO RÁPIDA
-- =====================================================
-- 
-- Cole e execute estas queries no Supabase SQL Editor
-- para validar que tudo foi aplicado corretamente
-- 
-- =====================================================

-- =====================================================
-- 1) VERIFICAR SE AS TABELAS FORAM CRIADAS
-- =====================================================

SELECT
  to_regclass('public.super_admins') as super_admins,
  to_regclass('public.admin_permissions') as admin_permissions,
  to_regclass('public.admin_audit_logs') as admin_audit_logs;

-- Esperado: As 3 tabelas devem existir (não null)

-- =====================================================
-- 2) VERIFICAR RLS E POLICIES
-- =====================================================

SELECT
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname=n.nspname AND p.tablename=c.relname) as policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relkind='r'
  AND c.relname IN ('super_admins','admin_permissions','admin_audit_logs')
ORDER BY 1,2;

-- Esperado: rls_enabled=true, rls_forced=true, policy_count>0

-- =====================================================
-- 3) VERIFICAR SUPER ADMINS (GO/NO-GO Query 1)
-- =====================================================

SELECT user_id, email, granted_at, revoked_at, notes
FROM public.super_admins
ORDER BY granted_at DESC;

-- Esperado: 1 linha com fabianobraga@me.com

-- =====================================================
-- 4) VERIFICAR PERMISSÕES GRANULARES
-- =====================================================

SELECT user_id, permission, granted_at, revoked_at
FROM public.admin_permissions
WHERE user_id='e0913bb8-35ff-49db-a3b7-818d6018bba2'
ORDER BY permission;

-- Esperado: 7 permissões (se você executou o INSERT)

-- =====================================================
-- 5) VERIFICAR AUDIT LOGS (GO/NO-GO Query 2)
-- =====================================================

SELECT created_at, admin_email, action, target_type, target_name, metadata
FROM public.admin_audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- Esperado: Logs de ações executadas (pode estar vazio se ainda não fez nada)

-- =====================================================
-- 6) TESTAR FUNÇÃO is_super_admin
-- =====================================================

SELECT public.is_super_admin('e0913bb8-35ff-49db-a3b7-818d6018bba2') as is_admin;

-- Esperado: TRUE

-- =====================================================
-- 7) LISTAR TODAS AS POLICIES CRIADAS
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('super_admins', 'admin_permissions', 'admin_audit_logs')
ORDER BY tablename, policyname;

-- Esperado: Múltiplas policies para cada tabela

-- =====================================================
-- ✅ FIM DAS VALIDAÇÕES
-- =====================================================
