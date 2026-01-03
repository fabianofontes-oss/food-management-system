-- Migration: Secure public menu with RPC (prevent cross-store data leak)
-- Date: 2026-01-02
-- Purpose: Prevent anon from querying ALL products via REST API

-- Create RPC for public menu access
CREATE OR REPLACE FUNCTION public.get_public_menu(p_slug TEXT)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_sort_order INTEGER,
  products JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Validate input
  IF p_slug IS NULL THEN
    RAISE EXCEPTION 'Slug é obrigatório';
  END IF;

  -- Get store_id by slug
  SELECT id INTO v_store_id
  FROM public.stores
  WHERE slug = p_slug AND is_active = true
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Loja não encontrada ou inativa';
  END IF;

  -- Return categories with their active products
  RETURN QUERY
  SELECT
    c.id as category_id,
    c.name as category_name,
    c.sort_order as category_sort_order,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'base_price', p.base_price,
          'price_per_unit', p.price_per_unit,
          'unit_type', p.unit_type,
          'image_url', p.image_url,
          'stock_quantity', p.stock_quantity,
          'track_inventory', p.track_inventory,
          'modifier_groups', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', mg.id,
                'name', mg.name,
                'min_quantity', mg.min_quantity,
                'max_quantity', mg.max_quantity,
                'required', mg.required,
                'options', (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', mo.id,
                      'name', mo.name,
                      'extra_price', mo.extra_price
                    )
                    ORDER BY mo.sort_order, mo.name
                  )
                  FROM public.modifier_options mo
                  WHERE mo.group_id = mg.id
                    AND mo.is_active = true
                )
              )
              ORDER BY mg.sort_order, mg.name
            )
            FROM public.product_modifier_groups pmg
            JOIN public.modifier_groups mg ON mg.id = pmg.group_id
            WHERE pmg.product_id = p.id
              AND (mg.applies_to_all_products = true OR pmg.product_id = p.id)
          )
        )
        ORDER BY p.sort_order, p.name
      )
      FROM public.products p
      WHERE p.category_id = c.id
        AND p.store_id = v_store_id
        AND p.is_active = true
    ) as products
  FROM public.categories c
  WHERE c.store_id = v_store_id
    AND c.is_active = true
  ORDER BY c.sort_order, c.name;
END;
$$;

-- Grant execute to anon and authenticated
REVOKE ALL ON FUNCTION public.get_public_menu(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_menu(TEXT) TO anon, authenticated;

-- CRITICAL: Revoke anon SELECT on products via REST to prevent cross-store enumeration
-- Keep authenticated access for dashboard
DROP POLICY IF EXISTS products_select_public ON public.products;

-- Only authenticated users (store members) can SELECT products directly
-- Anon must use get_public_menu RPC
CREATE POLICY products_select_authenticated_only
ON public.products
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_store_access(store_id)
);

-- Same for categories
DROP POLICY IF EXISTS categories_select_public ON public.categories;

CREATE POLICY categories_select_authenticated_only
ON public.categories
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_store_access(store_id)
);

-- Same for modifier_groups and modifier_options
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS modifier_groups_select ON public.modifier_groups;
CREATE POLICY modifier_groups_select
ON public.modifier_groups
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.product_modifier_groups pmg
    JOIN public.products p ON p.id = pmg.product_id
    WHERE pmg.group_id = modifier_groups.id
      AND public.user_has_store_access(p.store_id)
  )
);

DROP POLICY IF EXISTS modifier_options_select ON public.modifier_options;
CREATE POLICY modifier_options_select
ON public.modifier_options
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.product_modifier_groups pmg
    JOIN public.products p ON p.id = pmg.product_id
    WHERE pmg.group_id = modifier_options.group_id
      AND public.user_has_store_access(p.store_id)
  )
);

COMMENT ON FUNCTION public.get_public_menu IS 'Retorna cardápio público de uma loja (via slug) com produtos e modificadores ativos';
