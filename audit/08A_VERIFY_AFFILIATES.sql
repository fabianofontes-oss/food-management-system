-- =========================================
-- AFILIADOS - VERIFICATION QUERIES
-- Execute após aplicar 08A_APPLY_AFFILIATES.sql
-- =========================================

-- 1) Verificar tabelas existem
SELECT 
  'referral_partners' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referral_partners') as exists
UNION ALL
SELECT 
  'referral_codes',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referral_codes')
UNION ALL
SELECT 
  'tenant_referrals',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenant_referrals')
UNION ALL
SELECT 
  'referral_sales',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referral_sales');

-- 2) Verificar RLS habilitado
SELECT 
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('referral_partners', 'referral_codes', 'tenant_referrals', 'referral_sales')
ORDER BY c.relname;

-- 3) Verificar policies existem
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('referral_partners', 'referral_codes', 'tenant_referrals', 'referral_sales')
ORDER BY tablename, policyname;

-- 4) Contar policies por tabela
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('referral_partners', 'referral_codes', 'tenant_referrals', 'referral_sales')
GROUP BY tablename
ORDER BY tablename;

-- 5) Verificar colunas de driver split
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'referral_partners'
  AND column_name IN ('recruited_by_store_id', 'driver_share_percent', 'recruiter_share_percent')
ORDER BY column_name;

-- 6) Verificar trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'referral_partners'
  AND trigger_name = 'trg_protect_driver_split';

-- 7) Verificar function existe
SELECT 
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'protect_driver_split_fields';

-- 8) Resumo final
SELECT 
  'VERIFICAÇÃO COMPLETA' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'referral%') as tables_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename LIKE 'referral%') as policies_count;
