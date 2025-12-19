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
  'COLE_SEU_USER_ID_AQUI', -- ← COLE O USER_ID QUE VOCÊ COPIOU
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

-- Substitua 'COLE_SEU_USER_ID_AQUI' pelo seu user_id
SELECT public.is_super_admin('COLE_SEU_USER_ID_AQUI'); 
-- Deve retornar TRUE

-- =====================================================
-- FIM DO BOOTSTRAP
-- =====================================================
