-- ============================================================================
-- CENÁRIOS DE TESTE: Billing Enforcement (ETAPA 5 P0)
-- ============================================================================
-- 
-- Execute este script no Supabase SQL Editor para criar 4 cenários de teste:
-- 1. TENANT_ACTIVE      → slug: test-active
-- 2. TENANT_TRIAL_EXPIRED → slug: test-trial-expired
-- 3. TENANT_PAST_DUE    → slug: test-past-due
-- 4. TENANT_SUSPENDED   → slug: test-suspended
--
-- IMPORTANTE: Antes de executar, certifique-se de que as migrações foram aplicadas!
-- ============================================================================

-- ============================================================================
-- PASSO 1: LIMPAR DADOS DE TESTE ANTERIORES (se existirem)
-- ============================================================================
DELETE FROM store_users WHERE store_id IN (
  SELECT id FROM stores WHERE slug IN ('test-active', 'test-trial-expired', 'test-past-due', 'test-suspended')
);

DELETE FROM stores WHERE slug IN ('test-active', 'test-trial-expired', 'test-past-due', 'test-suspended');

DELETE FROM tenants WHERE name IN ('Tenant Active Test', 'Tenant Trial Expired Test', 'Tenant Past Due Test', 'Tenant Suspended Test');

-- ============================================================================
-- PASSO 2: CRIAR 4 TENANTS COM STATUS DIFERENTES
-- ============================================================================

-- CENÁRIO 1: ACTIVE (conta ativa, tudo funciona normal)
INSERT INTO tenants (id, name, status, trial_ends_at, past_due_since)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Tenant Active Test',
  'active',
  NULL,
  NULL
);

-- CENÁRIO 2: TRIAL EXPIRED (trial expirou há 5 dias)
INSERT INTO tenants (id, name, status, trial_ends_at, past_due_since)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Tenant Trial Expired Test',
  'trial',
  NOW() - INTERVAL '5 days', -- Expirou há 5 dias
  NULL
);

-- CENÁRIO 3: PAST DUE (dentro do grace period de 3 dias)
INSERT INTO tenants (id, name, status, trial_ends_at, past_due_since)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Tenant Past Due Test',
  'past_due',
  NULL,
  NOW() - INTERVAL '2 days' -- Atrasado há 2 dias (dentro do grace period)
);

-- CENÁRIO 4: SUSPENDED (conta suspensa)
INSERT INTO tenants (id, name, status, trial_ends_at, past_due_since, suspended_at, suspended_reason)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Tenant Suspended Test',
  'suspended',
  NULL,
  NOW() - INTERVAL '10 days', -- Atrasado há 10 dias (fora do grace)
  NOW() - INTERVAL '7 days', -- Suspensa há 7 dias
  'Inadimplência após grace period'
);

-- ============================================================================
-- PASSO 3: CRIAR 4 STORES (uma para cada tenant)
-- ============================================================================

-- Store para ACTIVE
INSERT INTO stores (id, tenant_id, name, slug, niche, mode, is_active, status, published_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Loja Teste Active',
  'test-active',
  'other',
  'store',
  true,
  'active',
  NOW()
);

-- Store para TRIAL EXPIRED
INSERT INTO stores (id, tenant_id, name, slug, niche, mode, is_active, status, published_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Loja Teste Trial Expired',
  'test-trial-expired',
  'other',
  'store',
  true,
  'active',
  NOW()
);

-- Store para PAST DUE
INSERT INTO stores (id, tenant_id, name, slug, niche, mode, is_active, status, published_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Loja Teste Past Due',
  'test-past-due',
  'other',
  'store',
  true,
  'active',
  NOW()
);

-- Store para SUSPENDED
INSERT INTO stores (id, tenant_id, name, slug, niche, mode, is_active, status, published_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Loja Teste Suspended',
  'test-suspended',
  'other',
  'store',
  true,
  'active',
  NOW()
);

-- ============================================================================
-- PASSO 4: VINCULAR SEU USUÁRIO COMO OWNER DAS 4 LOJAS
-- ============================================================================
-- IMPORTANTE: Substitua 'SEU_USER_ID' pelo seu user_id real do auth.users
-- Para descobrir seu user_id, execute: SELECT id FROM auth.users WHERE email = 'seu@email.com';

-- DESCOMENTE E AJUSTE AS LINHAS ABAIXO:
/*
-- Primeiro, garanta que seu usuário existe na tabela users
INSERT INTO users (id, name, email)
VALUES ('SEU_USER_ID', 'Seu Nome', 'seu@email.com')
ON CONFLICT (id) DO NOTHING;

-- Vincular como OWNER das 4 stores
INSERT INTO store_users (store_id, user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'SEU_USER_ID', 'OWNER'),
  ('22222222-2222-2222-2222-222222222222', 'SEU_USER_ID', 'OWNER'),
  ('33333333-3333-3333-3333-333333333333', 'SEU_USER_ID', 'OWNER'),
  ('44444444-4444-4444-4444-444444444444', 'SEU_USER_ID', 'OWNER');
*/

-- ============================================================================
-- PASSO 5: CRIAR CATEGORIAS E PRODUTOS MÍNIMOS PARA CADA STORE
-- ============================================================================

-- Categorias
INSERT INTO categories (id, store_id, name, is_active, sort_order) VALUES
  ('cat11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Categoria Teste', true, 0),
  ('cat22222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Categoria Teste', true, 0),
  ('cat33333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Categoria Teste', true, 0),
  ('cat44444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Categoria Teste', true, 0);

-- Produtos
INSERT INTO products (store_id, category_id, name, base_price, unit_type, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'Produto Teste', 10.00, 'unit', true),
  ('22222222-2222-2222-2222-222222222222', 'cat22222-2222-2222-2222-222222222222', 'Produto Teste', 10.00, 'unit', true),
  ('33333333-3333-3333-3333-333333333333', 'cat33333-3333-3333-3333-333333333333', 'Produto Teste', 10.00, 'unit', true),
  ('44444444-4444-4444-4444-444444444444', 'cat44444-4444-4444-4444-444444444444', 'Produto Teste', 10.00, 'unit', true);

-- ============================================================================
-- VERIFICAÇÃO: Execute para confirmar que os dados foram criados
-- ============================================================================
-- SELECT t.name, t.status, t.trial_ends_at, t.past_due_since, s.slug 
-- FROM tenants t 
-- JOIN stores s ON s.tenant_id = t.id 
-- WHERE t.name LIKE '%Test%';
