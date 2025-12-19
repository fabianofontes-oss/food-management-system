-- =========================================================
-- P0.3 - SELECT policies por store membership (authenticated)
-- Data: 2024-12-19
-- Objetivo: User autenticado consegue ler customers/orders/products
--           apenas das stores onde ele está em store_users
-- =========================================================

-- CUSTOMERS
DROP POLICY IF EXISTS customers_select_own_store ON public.customers;
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

-- PRODUCTS
DROP POLICY IF EXISTS products_select_own_store ON public.products;
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

-- ORDERS
DROP POLICY IF EXISTS orders_select_own_store ON public.orders;
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

-- ORDER_ITEMS (via orders)
DROP POLICY IF EXISTS order_items_select_own_store ON public.order_items;
CREATE POLICY order_items_select_own_store
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.store_users su
      ON su.store_id = o.store_id
    WHERE o.id = order_items.order_id
      AND su.user_id = auth.uid()
  )
);

-- CATEGORIES (opcional, mas comum no dashboard)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'categories'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS categories_select_own_store ON public.categories;';
    EXECUTE $pol$
      CREATE POLICY categories_select_own_store
      ON public.categories
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.store_users su
          WHERE su.store_id = categories.store_id
            AND su.user_id = auth.uid()
        )
      );
    $pol$;
  END IF;
END $$;

-- STORE_SETTINGS (opcional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'store_settings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS store_settings_select_own_store ON public.store_settings;';
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

-- GARANTIR PRIVILÉGIOS (não abre dados sem RLS; só permite a query passar pelo RLS)
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

-- Se você tem categories/store_settings e usa no dashboard:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'categories'
  ) THEN
    EXECUTE 'GRANT SELECT ON public.categories TO authenticated;';
  END IF;
END $$;

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

-- Rode isto e confirme que as policies existem:
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers','products','orders','order_items','categories','store_settings')
ORDER BY tablename, policyname;

-- =========================================================
-- RESULTADO ESPERADO
-- =========================================================

-- NOTICE: Policies criadas com sucesso
-- 
-- Após aplicar este patch:
-- 1. Usuários autenticados conseguem ver dados das próprias stores
-- 2. Isolamento cross-tenant mantido (RLS continua bloqueando)
-- 3. Testes E2E devem passar 12/12
--
-- Re-teste:
-- npm run e2e
-- Meta: 12/12 passando
