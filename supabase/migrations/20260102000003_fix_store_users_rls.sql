-- Migration: Fix store_users RLS to restrict to OWNER only
-- Date: 2026-01-02
-- Purpose: Prevent privilege escalation - only OWNER can manage team members

-- Helper function to check if user is OWNER of a store
CREATE OR REPLACE FUNCTION public.user_is_store_owner(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  );
$$;

-- Helper function to check if user has any of specified roles
CREATE OR REPLACE FUNCTION public.user_has_store_role(p_store_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
      AND su.role::text = ANY(p_roles) -- FIX: Convert enum to text for comparison
  );
$$;

-- Helper function to count owners of a store
CREATE OR REPLACE FUNCTION public.count_store_owners(p_store_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.store_users su
  WHERE su.store_id = p_store_id
    AND su.role = 'OWNER';
$$;

-- Drop existing policies
DROP POLICY IF EXISTS store_users_select ON public.store_users;
DROP POLICY IF EXISTS store_users_insert ON public.store_users;
DROP POLICY IF EXISTS store_users_update ON public.store_users;
DROP POLICY IF EXISTS store_users_delete ON public.store_users;

-- POLICY: SELECT - members can view other members of their stores
CREATE POLICY store_users_select
ON public.store_users
FOR SELECT
USING (public.user_has_store_access(store_id));

-- POLICY: INSERT - only OWNER or MANAGER can add members
CREATE POLICY store_users_insert
ON public.store_users
FOR INSERT
WITH CHECK (
  public.user_has_store_role(store_id, ARRAY['OWNER', 'MANAGER'])
);

-- POLICY: UPDATE - only OWNER can change roles
CREATE POLICY store_users_update
ON public.store_users
FOR UPDATE
USING (
  public.user_is_store_owner(store_id)
)
WITH CHECK (
  public.user_is_store_owner(store_id)
);

-- POLICY: DELETE - only OWNER can remove members
-- Cannot remove last OWNER or yourself if you're the last OWNER
CREATE POLICY store_users_delete
ON public.store_users
FOR DELETE
USING (
  public.user_is_store_owner(store_id)
  AND (
    -- Can remove others
    user_id != auth.uid()
    OR
    -- Can remove yourself only if there are other owners
    (
      user_id = auth.uid()
      AND public.count_store_owners(store_id) > 1
    )
  )
);

COMMENT ON FUNCTION public.user_is_store_owner IS 'Verifica se usuário é OWNER de uma loja';
COMMENT ON FUNCTION public.user_has_store_role IS 'Verifica se usuário tem algum dos roles especificados';
COMMENT ON FUNCTION public.count_store_owners IS 'Conta quantos OWNERs existem em uma loja';
