-- ============================================================================
-- FIX: Restaurar SELECT público para cardápio (stores/categories/products + modifiers)
-- Objetivo: permitir que anon leia somente dados necessários do cardápio quando a loja estiver ativa
-- ============================================================================

-- STORES: permitir SELECT público somente para lojas ativas
DROP POLICY IF EXISTS stores_public_select ON public.stores;
CREATE POLICY stores_public_select
ON public.stores
FOR SELECT
USING (is_active = true);

-- CATEGORIES: permitir SELECT público somente para categorias ativas de lojas ativas
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select
ON public.categories
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- PRODUCTS: permitir SELECT público somente para produtos ativos de lojas ativas
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select
ON public.products
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- MODIFIER_GROUPS: permitir SELECT público para grupos de modificadores de lojas ativas
DROP POLICY IF EXISTS modifier_groups_public_select ON public.modifier_groups;
CREATE POLICY modifier_groups_public_select
ON public.modifier_groups
FOR SELECT
USING (
  store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- MODIFIER_OPTIONS: permitir SELECT público para opções de grupos de lojas ativas
DROP POLICY IF EXISTS modifier_options_public_select ON public.modifier_options;
CREATE POLICY modifier_options_public_select
ON public.modifier_options
FOR SELECT
USING (
  group_id IN (
    SELECT mg.id
    FROM public.modifier_groups mg
    WHERE mg.store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- PRODUCT_MODIFIER_GROUPS: permitir SELECT público para vínculos de lojas ativas
DROP POLICY IF EXISTS product_modifier_groups_public_select ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_public_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND mg.store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);
