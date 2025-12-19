-- =====================================================
-- ETAPA 7 - AFILIADOS - QUERIES DE VALIDAÇÃO
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
  to_regclass('public.referral_partners') as referral_partners,
  to_regclass('public.referral_codes') as referral_codes,
  to_regclass('public.tenant_referrals') as tenant_referrals,
  to_regclass('public.referral_sales') as referral_sales;

-- Esperado: As 4 tabelas devem existir (não null)

-- =====================================================
-- 2) CONTAR REGISTROS (deve ser 0 inicialmente)
-- =====================================================

SELECT 'partners' as t, count(*) FROM public.referral_partners
UNION ALL
SELECT 'codes', count(*) FROM public.referral_codes
UNION ALL
SELECT 'tenant_referrals', count(*) FROM public.tenant_referrals
UNION ALL
SELECT 'sales', count(*) FROM public.referral_sales;

-- Esperado: 0 em todas (tabelas vazias)

-- =====================================================
-- 3) VERIFICAR RLS ESTÁ HABILITADO
-- =====================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('referral_partners', 'referral_codes', 'tenant_referrals', 'referral_sales');

-- Esperado: rowsecurity = true para todas

-- =====================================================
-- 4) VERIFICAR POLICIES CRIADAS
-- =====================================================

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('referral_partners', 'referral_codes', 'tenant_referrals', 'referral_sales')
ORDER BY tablename, cmd;

-- Esperado:
-- referral_partners: select + all (write)
-- referral_codes: select + all (write)
-- tenant_referrals: select + all (write)
-- referral_sales: select + all (write)

-- =====================================================
-- 5) TESTAR CRIAÇÃO DE PARTNER (EXEMPLO)
-- =====================================================
-- DESCOMENTE E AJUSTE para testar:

/*
-- Primeiro, descubra seu user_id
SELECT id, email FROM auth.users WHERE email = 'SEU_EMAIL';

-- Descubra store_id e tenant_id de uma loja
SELECT s.id as store_id, s.tenant_id, s.name, s.slug
FROM stores s
LIMIT 5;

-- Criar um partner de teste
INSERT INTO public.referral_partners (
  user_id, tenant_id, store_id, display_name, partner_type,
  base_commission_percent, staff_share_percent, owner_share_percent
)
VALUES (
  'USER_UUID',        -- seu user_id
  'TENANT_UUID',      -- tenant_id da loja
  'STORE_UUID',       -- store_id
  'Motoboy Teste',
  'DRIVER',
  20,                 -- 20% comissão base
  70,                 -- 70% para o motoboy
  30                  -- 30% para o dono
)
RETURNING id;

-- Criar código para o partner
INSERT INTO public.referral_codes (code, partner_id, region)
VALUES ('MOTOTESTE', 'PARTNER_ID_ACIMA', 'BR');

-- Verificar
SELECT rp.display_name, rp.partner_type, rc.code
FROM referral_partners rp
JOIN referral_codes rc ON rc.partner_id = rp.id;
*/

-- =====================================================
-- 6) VERIFICAR ÍNDICES
-- =====================================================

SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('referral_partners', 'referral_codes', 'tenant_referrals', 'referral_sales')
ORDER BY tablename, indexname;

-- Esperado: Vários índices para cada tabela
