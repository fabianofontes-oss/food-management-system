-- =====================================================
-- FIX: Adicionar coluna 'notes' na tabela super_admins
-- =====================================================
-- 
-- Execute este SQL no Supabase SQL Editor se você já
-- executou a migration anterior sem a coluna notes
-- 
-- =====================================================

-- Adicionar coluna notes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'super_admins' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.super_admins ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Verificar que a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'super_admins'
ORDER BY ordinal_position;

-- =====================================================
-- Agora você pode executar o bootstrap normalmente
-- =====================================================
