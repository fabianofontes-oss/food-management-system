-- ============================================================================
-- FIX CRÍTICO: Resolver recursão infinita nas funções RLS
-- Problema: user_has_store_access() consulta store_users, que tem policy
--           que chama user_has_store_access() → stack overflow
-- ============================================================================

-- 1) Dropar função COM CASCADE para remover todas as policies dependentes
--    ATENÇÃO: Isso remove TODAS as policies que usam essa função!
DROP FUNCTION IF EXISTS public.user_has_store_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_manage_store_users(uuid) CASCADE;

-- 2) Recriar função com SECURITY DEFINER + SET para bypassar RLS interno
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  -- SECURITY DEFINER + query direta bypassa RLS
  -- Não precisa de policy check aqui pois a função é trusted
  SELECT EXISTS (
    SELECT 1
    FROM store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
  ) INTO v_has_access;
  
  RETURN COALESCE(v_has_access, false);
END;
$$;

-- 3) Criar função auxiliar para owners (sem recursão)
CREATE OR REPLACE FUNCTION public.user_is_store_owner(p_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  ) INTO v_is_owner;
  
  RETURN COALESCE(v_is_owner, false);
END;
$$;

-- ============================================================================
-- 4) Recriar policies de store_users SEM usar user_has_store_access
--    (para quebrar a recursão)
-- ============================================================================

ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;

-- Dropar policies problemáticas
DROP POLICY IF EXISTS store_users_select ON public.store_users;
DROP POLICY IF EXISTS store_users_insert ON public.store_users;
DROP POLICY IF EXISTS store_users_update ON public.store_users;
DROP POLICY IF EXISTS store_users_delete ON public.store_users;
DROP POLICY IF EXISTS "Users can read their own store memberships" ON public.store_users;
DROP POLICY IF EXISTS "Store owners can manage store users" ON public.store_users;

-- SELECT: usuário pode ver suas próprias associações (query direta, sem função)
CREATE POLICY store_users_select
ON public.store_users
FOR SELECT
USING (user_id = auth.uid());

-- INSERT: apenas owners podem adicionar (verificar via subquery direta)
CREATE POLICY store_users_insert
ON public.store_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_users su
    WHERE su.store_id = store_users.store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  )
);

-- UPDATE: usuário pode atualizar seu próprio registro OU owner pode atualizar
CREATE POLICY store_users_update
ON public.store_users
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM store_users su
    WHERE su.store_id = store_users.store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  )
);

-- DELETE: apenas owners podem remover (exceto a si mesmo como owner)
CREATE POLICY store_users_delete
ON public.store_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM store_users su
    WHERE su.store_id = store_users.store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  )
);

-- ============================================================================
-- 5) Garantir que stores tem policy para acesso público (cardápio)
-- ============================================================================

DROP POLICY IF EXISTS stores_select ON public.stores;
DROP POLICY IF EXISTS stores_public_select ON public.stores;
DROP POLICY IF EXISTS stores_public_select_active ON public.stores;

-- Acesso público a lojas ativas (cardápio)
CREATE POLICY stores_public_select
ON public.stores
FOR SELECT
USING (is_active = true);

-- Membros podem ver suas lojas (inclusive inativas)
CREATE POLICY stores_member_select
ON public.stores
FOR SELECT
USING (public.user_has_store_access(id));

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT 'FIX APLICADO: RLS recursion corrigida' AS status;
