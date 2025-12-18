-- ============================================================================
-- PUBLIC MENU RLS: Políticas completas para acesso anon ao cardápio
-- Idempotente: usa DROP IF EXISTS antes de CREATE
-- ============================================================================

-- ============================================================================
-- ADDON_GROUPS: permitir SELECT público para grupos de adicionais de lojas ativas
-- ============================================================================
DROP POLICY IF EXISTS addon_groups_public_select ON public.addon_groups;
CREATE POLICY addon_groups_public_select
ON public.addon_groups
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- ============================================================================
-- ADDONS: permitir SELECT público para adicionais ativos de lojas ativas
-- ============================================================================
DROP POLICY IF EXISTS addons_public_select ON public.addons;
CREATE POLICY addons_public_select
ON public.addons
FOR SELECT
USING (
  is_active = true
  AND addon_group_id IN (
    SELECT id FROM public.addon_groups 
    WHERE is_active = true 
    AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- ============================================================================
-- PRODUCT_ADDON_GROUPS: permitir SELECT público para vínculos de lojas ativas
-- ============================================================================
DROP POLICY IF EXISTS product_addon_groups_public_select ON public.product_addon_groups;
CREATE POLICY product_addon_groups_public_select
ON public.product_addon_groups
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE is_active = true 
    AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- ============================================================================
-- STORE_SETTINGS: permitir SELECT público para configurações de lojas ativas
-- (necessário para horários, delivery, etc no cardápio público)
-- ============================================================================
DROP POLICY IF EXISTS store_settings_public_select ON public.store_settings;
CREATE POLICY store_settings_public_select
ON public.store_settings
FOR SELECT
USING (
  store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- ============================================================================
-- Garantir RLS habilitado nas tabelas
-- ============================================================================
ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICAÇÃO: Listar policies criadas
-- ============================================================================
SELECT tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%public_select%'
ORDER BY tablename;
