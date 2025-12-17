-- Fix: Corrigir RLS permissivo em kitchen_chefs
-- A policy anterior usava USING (true) que permite acesso de qualquer usuário

-- Remover policy permissiva
DROP POLICY IF EXISTS "kitchen_chefs_all" ON kitchen_chefs;

-- Criar policy correta com isolamento por store_id
CREATE POLICY "kitchen_chefs_store_access" ON kitchen_chefs
FOR ALL
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));
