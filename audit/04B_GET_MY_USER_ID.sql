-- =====================================================
-- BUSCAR SEU USER_ID NO SUPABASE AUTH
-- =====================================================
-- 
-- Execute este SQL no Supabase SQL Editor para encontrar
-- seu user_id baseado no email: fabianobraga@me.com
-- 
-- =====================================================

SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'fabianobraga@me.com';

-- =====================================================
-- RESULTADO ESPERADO:
-- Você verá uma linha com seu user_id (UUID)
-- Copie o valor da coluna "user_id" e use no próximo passo
-- =====================================================
