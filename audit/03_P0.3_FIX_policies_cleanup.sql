-- =========================================================
-- P0.3 FIX - Limpar policies conflitantes e recriar
-- Data: 2024-12-19
-- Problema: Múltiplas policies SELECT causando conflito
-- Solução: Remover TODAS as policies e criar apenas uma por tabela
-- =========================================================

-- CUSTOMERS - Remover todas as policies SELECT antigas
DROP POLICY IF EXISTS customers_select_by_store_membership ON public.customers;
DROP POLICY IF EXISTS customers_select_own_store ON public.customers;

-- CUSTOMERS - Criar apenas UMA policy SELECT
CREATE POLICY customers_select_own_store
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = customers.store_id
      AND su.user_id = auth.uid()
  )
);

-- PRODUCTS - Remover todas as policies SELECT antigas
DROP POLICY IF EXISTS products_public_select ON public.products;
DROP POLICY IF EXISTS products_select_own_store ON public.products;

-- PRODUCTS - Criar apenas UMA policy SELECT
CREATE POLICY products_select_own_store
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = products.store_id
      AND su.user_id = auth.uid()
  )
);

-- ORDERS - Remover todas as policies SELECT antigas
DROP POLICY IF EXISTS orders_select_by_store_membership ON public.orders;
DROP POLICY IF EXISTS orders_select_own_store ON public.orders;

-- ORDERS - Criar apenas UMA policy SELECT
CREATE POLICY orders_select_own_store
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = orders.store_id
      AND su.user_id = auth.uid()
  )
);

-- ORDER_ITEMS - Remover todas as policies SELECT antigas
DROP POLICY IF EXISTS order_items_all_via_orders_store ON public.order_items;
DROP POLICY IF EXISTS order_items_select_own_store ON public.order_items;

-- ORDER_ITEMS - Criar apenas UMA policy SELECT
CREATE POLICY order_items_select_own_store
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.store_users su ON su.store_id = o.store_id
    WHERE o.id = order_items.order_id
      AND su.user_id = auth.uid()
  )
);

-- CATEGORIES - Remover todas as policies SELECT antigas
DROP POLICY IF EXISTS "Users can view categories from their tenant" ON public.categories;
DROP POLICY IF EXISTS categories_public_select ON public.categories;
DROP POLICY IF EXISTS categories_select_own_store ON public.categories;

-- CATEGORIES - Criar apenas UMA policy SELECT
CREATE POLICY categories_select_own_store
ON public.categories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = categories.store_id
      AND su.user_id = auth.uid()
  )
);

-- STORE_SETTINGS - Remover todas as policies SELECT antigas
DROP POLICY IF EXISTS store_settings_public_select ON public.store_settings;
DROP POLICY IF EXISTS store_settings_select_own_store ON public.store_settings;

-- STORE_SETTINGS - Criar apenas UMA policy SELECT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'store_settings'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY store_settings_select_own_store
      ON public.store_settings
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.store_users su
          WHERE su.store_id = store_settings.store_id
            AND su.user_id = auth.uid()
        )
      );
    $pol$;
  END IF;
END $$;

-- GARANTIR PRIVILÉGIOS
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.categories TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'store_settings'
  ) THEN
    EXECUTE 'GRANT SELECT ON public.store_settings TO authenticated;';
  END IF;
END $$;

-- =========================================================
-- VALIDAÇÃO
-- =========================================================

-- Deve mostrar APENAS UMA policy SELECT por tabela
SELECT 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers','products','orders','order_items','categories','store_settings')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- =========================================================
-- RESULTADO ESPERADO
-- =========================================================

-- Cada tabela deve ter APENAS UMA policy SELECT:
-- - customers_select_own_store
-- - products_select_own_store
-- - orders_select_own_store
-- - order_items_select_own_store
-- - categories_select_own_store
-- - store_settings_select_own_store (se existir)
--
-- Após aplicar:
-- npm run test:e2e
-- Meta: 12/12 passando
