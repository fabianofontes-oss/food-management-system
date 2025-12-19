-- =====================================================
-- BOOTSTRAP: Inserir seu user_id como Super Admin
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Vá em Supabase → Authentication → Users
-- 2. Clique no seu usuário
-- 3. Copie o UUID do campo "id"
-- 4. Cole abaixo substituindo 'SEU_USER_ID_AQUI'
-- 5. Execute este SQL no Supabase SQL Editor
-- 
-- =====================================================

INSERT INTO public.super_admins (user_id, email, notes)
VALUES (
  'SEU_USER_ID_AQUI', -- ← COLE SEU USER_ID AQUI
  'SEU_EMAIL_AQUI',   -- ← COLE SEU EMAIL AQUI
  'bootstrap - primeiro super admin do sistema'
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO: Confirmar que foi inserido
-- =====================================================

SELECT 
  user_id,
  email,
  granted_at,
  notes
FROM public.super_admins
WHERE revoked_at IS NULL;

-- =====================================================
-- TESTE: Verificar se a função is_super_admin funciona
-- =====================================================

SELECT public.is_super_admin('SEU_USER_ID_AQUI'); -- Deve retornar TRUE

-- =====================================================
-- FIM DO BOOTSTRAP
-- =====================================================
