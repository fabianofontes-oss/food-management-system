-- ============================================================================
-- AUDIT-01: Corrigir RLS de stores para permitir SELECT público (anon) + autenticado (member)
-- Problema: stores_select bloqueava tudo; stores_public_select não foi suficiente
-- Solução: DROP todas policies antigas, criar 2 novas (public + member)
-- ============================================================================

-- 1) Garantir que a função user_has_store_access existe e usa store_users (não user_stores)
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id uuid)
RETURNS boolean
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
  );
$$;

-- 2) STORES: DROP todas policies antigas que podem estar conflitando
DROP POLICY IF EXISTS stores_select ON public.stores;
DROP POLICY IF EXISTS stores_public_select ON public.stores;
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Super admin can view all stores" ON public.stores;

-- 3) STORES: Criar 2 policies novas (público + membro)
-- Policy 1: Anônimos e autenticados podem ver stores ATIVAS (para cardápio público)
CREATE POLICY stores_public_select_active
ON public.stores
FOR SELECT
USING (is_active = true);

-- Policy 2: Membros autenticados podem ver SUAS stores (mesmo inativas, para dashboard)
CREATE POLICY stores_member_select
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
);

-- 4) STORES: UPDATE somente para membros autenticados
DROP POLICY IF EXISTS stores_update ON public.stores;
CREATE POLICY stores_update
ON public.stores
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
);

-- 5) STORES: INSERT bloqueado (criação via signup flow separado)
DROP POLICY IF EXISTS stores_insert ON public.stores;
CREATE POLICY stores_insert
ON public.stores
FOR INSERT
WITH CHECK (false);

-- 6) CATEGORIES: Garantir SELECT público para categorias ativas de lojas ativas
DROP POLICY IF EXISTS categories_public_select ON public.categories;
DROP POLICY IF EXISTS categories_select ON public.categories;

CREATE POLICY categories_public_select
ON public.categories
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = categories.store_id
      AND s.is_active = true
  )
);

CREATE POLICY categories_member_select
ON public.categories
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 7) PRODUCTS: Garantir SELECT público para produtos ativos de lojas ativas
DROP POLICY IF EXISTS products_public_select ON public.products;
DROP POLICY IF EXISTS products_select ON public.products;

CREATE POLICY products_public_select
ON public.products
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = products.store_id
      AND s.is_active = true
  )
);

CREATE POLICY products_member_select
ON public.products
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 8) MODIFIER_GROUPS: SELECT público + membro
DROP POLICY IF EXISTS modifier_groups_public_select ON public.modifier_groups;
DROP POLICY IF EXISTS modifier_groups_select ON public.modifier_groups;

CREATE POLICY modifier_groups_public_select
ON public.modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = modifier_groups.store_id
      AND s.is_active = true
  )
);

CREATE POLICY modifier_groups_member_select
ON public.modifier_groups
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 9) MODIFIER_OPTIONS: SELECT público + membro
DROP POLICY IF EXISTS modifier_options_public_select ON public.modifier_options;
DROP POLICY IF EXISTS modifier_options_select ON public.modifier_options;

CREATE POLICY modifier_options_public_select
ON public.modifier_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    INNER JOIN public.stores s ON s.id = mg.store_id
    WHERE mg.id = modifier_options.group_id
      AND s.is_active = true
  )
);

CREATE POLICY modifier_options_member_select
ON public.modifier_options
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- 10) PRODUCT_MODIFIER_GROUPS: SELECT público + membro
DROP POLICY IF EXISTS product_modifier_groups_public_select ON public.product_modifier_groups;
DROP POLICY IF EXISTS product_modifier_groups_select ON public.product_modifier_groups;

CREATE POLICY product_modifier_groups_public_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    INNER JOIN public.stores s ON s.id = mg.store_id
    WHERE mg.id = product_modifier_groups.group_id
      AND s.is_active = true
  )
);

CREATE POLICY product_modifier_groups_member_select
ON public.product_modifier_groups
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);
