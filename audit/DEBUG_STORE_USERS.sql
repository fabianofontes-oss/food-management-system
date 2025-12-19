-- =========================================================
-- DEBUG: Verificar relação store_users para usuários E2E
-- =========================================================

-- 1. Verificar se os usuários E2E existem
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email LIKE 'e2e-user-%@test.local'
ORDER BY email;

-- 2. Verificar relação store_users
SELECT 
  su.id,
  su.store_id,
  su.user_id,
  su.role,
  s.name as store_name,
  s.slug as store_slug,
  u.email as user_email
FROM public.store_users su
JOIN public.stores s ON s.id = su.store_id
JOIN auth.users u ON u.id = su.user_id
WHERE u.email LIKE 'e2e-user-%@test.local'
ORDER BY u.email;

-- 3. Verificar se as stores E2E existem
SELECT 
  id,
  name,
  slug,
  tenant_id,
  is_active
FROM public.stores
WHERE slug LIKE 'e2e-store-%'
ORDER BY slug;

-- 4. Testar policy manualmente (simular como authenticated)
-- Execute isto depois de fazer login como e2e-user-a@test.local
-- 
-- SELECT * FROM public.customers WHERE store_id = '<store_a_id>';
-- 
-- Se retornar null, a policy não está funcionando corretamente
