-- =====================================================
-- BOOTSTRAP: Inserir fabianobraga@me.com como Super Admin
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Execute primeiro o arquivo 04B_GET_MY_USER_ID.sql
-- 2. Copie o user_id retornado
-- 3. Cole abaixo substituindo 'COLE_SEU_USER_ID_AQUI'
-- 4. Execute este SQL no Supabase SQL Editor
-- 
-- =====================================================

INSERT INTO public.super_admins (user_id, email, notes)
VALUES (
  'e0913bb8-35ff-49db-a3b7-818d6018bba2', -- Fabiano Braga
  'fabianobraga@me.com',
  'bootstrap - Fabiano Braga - primeiro super admin do sistema'
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

SELECT public.is_super_admin('e0913bb8-35ff-49db-a3b7-818d6018bba2'); 
-- Deve retornar TRUE

-- =====================================================
-- FIM DO BOOTSTRAP
-- =====================================================
