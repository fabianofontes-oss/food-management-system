-- =========================================================
-- RESET E2E USER PASSWORDS
-- Execute no Supabase SQL Editor
-- =========================================================

-- Resetar senha do User A para: Test123456!
UPDATE auth.users
SET 
  encrypted_password = crypt('Test123456!', gen_salt('bf')),
  email_confirmed_at = NOW()
WHERE email = 'e2e-user-a@test.local';

-- Resetar senha do User B para: Test123456!
UPDATE auth.users
SET 
  encrypted_password = crypt('Test123456!', gen_salt('bf')),
  email_confirmed_at = NOW()
WHERE email = 'e2e-user-b@test.local';

-- Verificar
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email LIKE 'e2e-user-%@test.local'
ORDER BY email;

-- =========================================================
-- RESULTADO ESPERADO
-- =========================================================
-- Deve mostrar 2 usuários com email_confirmed_at preenchido
-- 
-- Após executar:
-- npm run test:e2e
-- Meta: 12/12 passando
