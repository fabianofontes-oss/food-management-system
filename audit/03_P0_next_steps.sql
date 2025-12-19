-- ==========================================================
-- ETAPA 3 - P0 PRÓXIMOS PASSOS (Pós-Aplicação do Patch)
-- Data: 2024-12-19
-- Objetivo: Coletar DDL das functions SECURITY DEFINER e validar patch
-- ==========================================================

-- -----------------------------
-- PASSO 1: Coletar DDL das 14 Functions SECURITY DEFINER
-- Salvar como: audit/03_P0_security_definer_ddls.txt
-- -----------------------------
-- OBJETIVO: Identificar funções que bypassam RLS sem validar auth.uid() + ownership
--           e funções sem SET search_path

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  pg_get_functiondef(p.oid) AS ddl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY 1,2;

-- -----------------------------
-- PASSO 2: Validar RLS + Policy Count (Tabelas Críticas)
-- Salvar como: audit/03_P0_validation_rls_status.txt
-- -----------------------------
-- OBJETIVO: Confirmar que TODAS as 8 tabelas críticas têm RLS + policies

SELECT
  n.nspname AS schema,
  c.relname AS table,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname=n.nspname AND p.tablename=c.relname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public'
  AND c.relkind='r'
  AND c.relname IN ('tenants','stores','store_users','customers','orders','order_items','users','invoices','payment_history','tenant_subscriptions')
ORDER BY 1,2;

-- RESULTADO ESPERADO:
-- Todas as 10 tabelas com rls_enabled=true, rls_forced=true, policy_count > 0

-- -----------------------------
-- PASSO 3: Validar Policies Suspeitas (qual=true ou NULL)
-- Salvar como: audit/03_P0_validation_suspicious_policies.txt
-- -----------------------------
-- OBJETIVO: Garantir que não há policies permissivas restantes

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE schemaname='public'
  AND (qual IS NULL OR lower(qual)='true')
ORDER BY tablename, policyname;

-- RESULTADO ESPERADO:
-- Nenhuma policy com qual=true ou NULL em tabelas sensíveis (tenants, invoices, etc.)
-- Apenas tabelas de onboarding (draft_stores, plans, slug_reservations) podem ter qual=true

-- -----------------------------
-- PASSO 4: Validar Grants para anon/authenticated (Tabelas Sensíveis)
-- Salvar como: audit/03_P0_validation_grants_sensitive.txt
-- -----------------------------
-- OBJETIVO: Confirmar que anon não tem acesso a tabelas sensíveis

SELECT 
  grantee, 
  table_schema, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema='public'
  AND grantee IN ('anon','authenticated')
  AND table_name IN ('tenants','store_users','users','invoices','payment_history','tenant_subscriptions')
ORDER BY 1,2,3,4;

-- RESULTADO ESPERADO:
-- anon NÃO deve ter nenhum grant em tabelas sensíveis
-- authenticated pode ter grants (protegidos por RLS)

-- -----------------------------
-- PASSO 5: Validar Policies de Tenants (Isolamento Multi-Tenant)
-- Salvar como: audit/03_P0_validation_tenants_policies.txt
-- -----------------------------
-- OBJETIVO: Confirmar que policies de tenants filtram por store_users

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
  AND tablename='tenants'
ORDER BY policyname;

-- RESULTADO ESPERADO:
-- Policies devem filtrar via store_users (não auth.uid() IS NOT NULL)
-- Deve ter tenants_select_by_membership e tenants_update_by_membership

-- -----------------------------
-- PASSO 6: Validar Policies de Core Tables
-- Salvar como: audit/03_P0_validation_core_policies.txt
-- -----------------------------
-- OBJETIVO: Confirmar que core tables têm policies adequadas

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  COUNT(*) OVER (PARTITION BY tablename) as policies_per_table
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('customers','orders','order_items','users')
ORDER BY tablename, policyname;

-- RESULTADO ESPERADO:
-- customers: 4 policies (select, insert, update, delete)
-- orders: 4 policies (select, insert, update, delete)
-- order_items: 1 policy (all)
-- users: 2 policies (select, update)

-- -----------------------------
-- PASSO 7: Teste de Isolamento Cross-Tenant (Simulação)
-- NÃO EXECUTAR - Apenas documentação para testes manuais
-- -----------------------------
-- TESTE 1: Usuário de Store 1 tenta acessar dados de Store 2
-- SET request.jwt.claims.sub = '<user_id_store_1>';
-- SELECT * FROM orders WHERE store_id = '<store_2_id>';
-- RESULTADO ESPERADO: Nenhum resultado (isolamento funcional)

-- TESTE 2: Usuário tenta acessar tenants de outro tenant
-- SET request.jwt.claims.sub = '<user_id_tenant_a>';
-- SELECT * FROM tenants WHERE id = '<tenant_b_id>';
-- RESULTADO ESPERADO: Nenhum resultado (isolamento funcional)

-- TESTE 3: anon tenta acessar tabelas sensíveis
-- SET ROLE anon;
-- SELECT * FROM tenants;
-- SELECT * FROM invoices;
-- SELECT * FROM users;
-- RESULTADO ESPERADO: Erro de permissão ou nenhum resultado

-- -----------------------------
-- PASSO 8: Validar Funcionalidades Core
-- NÃO EXECUTAR - Apenas documentação para testes manuais
-- -----------------------------
-- TESTE 1: Login → Dashboard → Listar Pedidos
-- TESTE 2: Criar novo pedido
-- TESTE 3: Ver clientes da store
-- TESTE 4: Atualizar perfil de usuário
-- RESULTADO ESPERADO: Todas as funcionalidades funcionando normalmente

-- ==========================================================
-- FIM DAS QUERIES DE VALIDAÇÃO PÓS-PATCH
-- ==========================================================

-- INSTRUÇÕES DE USO:
-- 1. Execute cada query no Supabase SQL Editor
-- 2. Salve os resultados nos arquivos indicados
-- 3. Analise os resultados para confirmar que patch foi aplicado corretamente
-- 4. Execute testes funcionais manuais
-- 5. Se tudo estiver OK, considerar aplicação em produção
