-- ============================================================================
-- SETUP: Associar usuário à loja
-- Execute este script no Supabase SQL Editor
-- IMPORTANTE: Substitua 'SEU_EMAIL@exemplo.com' pelo seu email real
-- ============================================================================

-- Passo 1: Verificar qual é o ID da loja
SELECT id, name, slug FROM stores WHERE slug = 'acai-sabor-real';

-- Passo 2: Verificar se seu usuário existe no auth.users
SELECT id, email FROM auth.users LIMIT 10;

-- Passo 3: Inserir usuário na tabela users (se não existir)
-- SUBSTITUA 'SEU_EMAIL@exemplo.com' pelo seu email
INSERT INTO users (id, name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  email
FROM auth.users 
WHERE email = 'SEU_EMAIL@exemplo.com'
ON CONFLICT (id) DO NOTHING;

-- Passo 4: Associar usuário à loja como OWNER
-- SUBSTITUA 'SEU_EMAIL@exemplo.com' pelo seu email
INSERT INTO store_users (store_id, user_id, role)
SELECT 
  s.id,
  u.id,
  'OWNER'
FROM stores s, auth.users u
WHERE s.slug = 'acai-sabor-real'
  AND u.email = 'SEU_EMAIL@exemplo.com'
ON CONFLICT (store_id, user_id) DO UPDATE SET role = 'OWNER';

-- Passo 5: Verificar se deu certo
SELECT 
  su.id,
  s.name as store_name,
  u.email as user_email,
  su.role
FROM store_users su
JOIN stores s ON s.id = su.store_id
JOIN users u ON u.id = su.user_id;
