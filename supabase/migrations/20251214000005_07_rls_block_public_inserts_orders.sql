-- COMANDO 02 — RLS/GRANT hardening: bloquear escrita pública direta (checkout público somente via RPC SECURITY DEFINER)

-- 1) Revogar privilégios de escrita do role anon em tabelas sensíveis
REVOKE INSERT, UPDATE, DELETE ON TABLE public.orders FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.order_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.order_item_modifiers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.order_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.customers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.customer_addresses FROM anon;

-- (Opcional) Garantir que authenticated mantém privilégios de escrita (padrão Supabase geralmente já concede)
GRANT INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.order_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.order_item_modifiers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.order_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.customer_addresses TO authenticated;

-- 2) Remover quaisquer policies antigas que abriam escrita pública
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;

DROP POLICY IF EXISTS "Public can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;

-- 3) Recriar policies de escrita restringindo explicitamente para authenticated
-- Observação: as policies de SELECT podem existir em outra migration (ex: COMANDO 03). Aqui focamos em escrita.

-- orders (store_id)
DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update
ON public.orders
FOR UPDATE
TO authenticated
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_delete ON public.orders;
CREATE POLICY orders_delete
ON public.orders
FOR DELETE
TO authenticated
USING (public.user_has_store_access(store_id));

-- customers (store_id)
DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update
ON public.customers
FOR UPDATE
TO authenticated
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_delete ON public.customers;
CREATE POLICY customers_delete
ON public.customers
FOR DELETE
TO authenticated
USING (public.user_has_store_access(store_id));

-- customer_addresses (join: customers.store_id)
DROP POLICY IF EXISTS customer_addresses_insert ON public.customer_addresses;
CREATE POLICY customer_addresses_insert
ON public.customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_update ON public.customer_addresses;
CREATE POLICY customer_addresses_update
ON public.customer_addresses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_delete ON public.customer_addresses;
CREATE POLICY customer_addresses_delete
ON public.customer_addresses
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

-- order_items (join: orders.store_id)
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
CREATE POLICY order_items_insert
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_update ON public.order_items;
CREATE POLICY order_items_update
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_delete ON public.order_items;
CREATE POLICY order_items_delete
ON public.order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_item_modifiers (join: order_items -> orders.store_id)
DROP POLICY IF EXISTS oim_insert ON public.order_item_modifiers;
CREATE POLICY oim_insert
ON public.order_item_modifiers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_update ON public.order_item_modifiers;
CREATE POLICY oim_update
ON public.order_item_modifiers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_delete ON public.order_item_modifiers;
CREATE POLICY oim_delete
ON public.order_item_modifiers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_events (join: orders.store_id)
DROP POLICY IF EXISTS order_events_insert ON public.order_events;
CREATE POLICY order_events_insert
ON public.order_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_update ON public.order_events;
CREATE POLICY order_events_update
ON public.order_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_delete ON public.order_events;
CREATE POLICY order_events_delete
ON public.order_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);
