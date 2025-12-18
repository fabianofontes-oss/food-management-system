-- COMANDO 03 — RLS completo + isolamento multi-tenant (store_id)

-- 1) Helper padronizado
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

-- ============================================================================
-- Tabelas com store_id
-- ============================================================================

-- stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Super admin can view all stores" ON public.stores;

DROP POLICY IF EXISTS stores_select ON public.stores;
CREATE POLICY stores_select
ON public.stores
FOR SELECT
USING (public.user_has_store_access(id));

DROP POLICY IF EXISTS stores_insert ON public.stores;
CREATE POLICY stores_insert
ON public.stores
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS stores_update ON public.stores;
CREATE POLICY stores_update
ON public.stores
FOR UPDATE
USING (public.user_has_store_access(id))
WITH CHECK (public.user_has_store_access(id));

-- store_users
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own store memberships" ON public.store_users;
DROP POLICY IF EXISTS "Authenticated users can view all store users" ON public.store_users;
DROP POLICY IF EXISTS "Store owners can manage store users" ON public.store_users;

DROP POLICY IF EXISTS store_users_select ON public.store_users;
CREATE POLICY store_users_select
ON public.store_users
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_users_insert ON public.store_users;
CREATE POLICY store_users_insert
ON public.store_users
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_users_update ON public.store_users;
CREATE POLICY store_users_update
ON public.store_users
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_users_delete ON public.store_users;
CREATE POLICY store_users_delete
ON public.store_users
FOR DELETE
USING (public.user_has_store_access(store_id));

-- store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_settings_select ON public.store_settings;
CREATE POLICY store_settings_select
ON public.store_settings
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_settings_insert ON public.store_settings;
CREATE POLICY store_settings_insert
ON public.store_settings
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_settings_update ON public.store_settings;
CREATE POLICY store_settings_update
ON public.store_settings
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

-- categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories of active stores" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Store users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;

DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select
ON public.categories
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS categories_insert ON public.categories;
CREATE POLICY categories_insert
ON public.categories
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS categories_update ON public.categories;
CREATE POLICY categories_update
ON public.categories
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS categories_delete ON public.categories;
CREATE POLICY categories_delete
ON public.categories
FOR DELETE
USING (public.user_has_store_access(store_id));

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products of active stores" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON public.products;
DROP POLICY IF EXISTS "Store users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

DROP POLICY IF EXISTS products_select ON public.products;
CREATE POLICY products_select
ON public.products
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS products_insert ON public.products;
CREATE POLICY products_insert
ON public.products
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS products_update ON public.products;
CREATE POLICY products_update
ON public.products
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS products_delete ON public.products;
CREATE POLICY products_delete
ON public.products
FOR DELETE
USING (public.user_has_store_access(store_id));

-- customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Store users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

DROP POLICY IF EXISTS customers_select ON public.customers;
CREATE POLICY customers_select
ON public.customers
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert
ON public.customers
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update
ON public.customers
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_delete ON public.customers;
CREATE POLICY customers_delete
ON public.customers
FOR DELETE
USING (public.user_has_store_access(store_id));

-- tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tables_select ON public.tables;
CREATE POLICY tables_select
ON public.tables
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS tables_insert ON public.tables;
CREATE POLICY tables_insert
ON public.tables
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS tables_update ON public.tables;
CREATE POLICY tables_update
ON public.tables
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS tables_delete ON public.tables;
CREATE POLICY tables_delete
ON public.tables
FOR DELETE
USING (public.user_has_store_access(store_id));

-- coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coupons_select ON public.coupons;
CREATE POLICY coupons_select
ON public.coupons
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS coupons_insert ON public.coupons;
CREATE POLICY coupons_insert
ON public.coupons
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS coupons_update ON public.coupons;
CREATE POLICY coupons_update
ON public.coupons
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS coupons_delete ON public.coupons;
CREATE POLICY coupons_delete
ON public.coupons
FOR DELETE
USING (public.user_has_store_access(store_id));

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select
ON public.notifications
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert
ON public.notifications
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update
ON public.notifications
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete
ON public.notifications
FOR DELETE
USING (public.user_has_store_access(store_id));

-- internal_messages
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS internal_messages_select ON public.internal_messages;
CREATE POLICY internal_messages_select
ON public.internal_messages
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS internal_messages_insert ON public.internal_messages;
CREATE POLICY internal_messages_insert
ON public.internal_messages
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS internal_messages_update ON public.internal_messages;
CREATE POLICY internal_messages_update
ON public.internal_messages
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS internal_messages_delete ON public.internal_messages;
CREATE POLICY internal_messages_delete
ON public.internal_messages
FOR DELETE
USING (public.user_has_store_access(store_id));

-- inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_items_select ON public.inventory_items;
CREATE POLICY inventory_items_select
ON public.inventory_items
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS inventory_items_insert ON public.inventory_items;
CREATE POLICY inventory_items_insert
ON public.inventory_items
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS inventory_items_update ON public.inventory_items;
CREATE POLICY inventory_items_update
ON public.inventory_items
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS inventory_items_delete ON public.inventory_items;
CREATE POLICY inventory_items_delete
ON public.inventory_items
FOR DELETE
USING (public.user_has_store_access(store_id));

-- cash_registers
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_registers_select ON public.cash_registers;
CREATE POLICY cash_registers_select
ON public.cash_registers
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS cash_registers_insert ON public.cash_registers;
CREATE POLICY cash_registers_insert
ON public.cash_registers
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS cash_registers_update ON public.cash_registers;
CREATE POLICY cash_registers_update
ON public.cash_registers
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS cash_registers_delete ON public.cash_registers;
CREATE POLICY cash_registers_delete
ON public.cash_registers
FOR DELETE
USING (public.user_has_store_access(store_id));

-- printers
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS printers_select ON public.printers;
CREATE POLICY printers_select
ON public.printers
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS printers_insert ON public.printers;
CREATE POLICY printers_insert
ON public.printers
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS printers_update ON public.printers;
CREATE POLICY printers_update
ON public.printers
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS printers_delete ON public.printers;
CREATE POLICY printers_delete
ON public.printers
FOR DELETE
USING (public.user_has_store_access(store_id));

-- ============================================================================
-- Tabelas sem store_id (join-policy)
-- ============================================================================

-- customer_addresses (via customers.store_id)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_addresses_select ON public.customer_addresses;
CREATE POLICY customer_addresses_select
ON public.customer_addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_insert ON public.customer_addresses;
CREATE POLICY customer_addresses_insert
ON public.customer_addresses
FOR INSERT
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
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

-- orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Store users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Store users can manage orders" ON public.orders;

DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select
ON public.orders
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert
ON public.orders
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update
ON public.orders
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_delete ON public.orders;
CREATE POLICY orders_delete
ON public.orders
FOR DELETE
USING (public.user_has_store_access(store_id));

-- order_items (via orders.store_id)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Store users can view order items" ON public.order_items;

DROP POLICY IF EXISTS order_items_select ON public.order_items;
CREATE POLICY order_items_select
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_insert ON public.order_items;
CREATE POLICY order_items_insert
ON public.order_items
FOR INSERT
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
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_item_modifiers (via order_items -> orders.store_id)
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oim_select ON public.order_item_modifiers;
CREATE POLICY oim_select
ON public.order_item_modifiers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_insert ON public.order_item_modifiers;
CREATE POLICY oim_insert
ON public.order_item_modifiers
FOR INSERT
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
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_events (via orders.store_id)
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_events_select ON public.order_events;
CREATE POLICY order_events_select
ON public.order_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_insert ON public.order_events;
CREATE POLICY order_events_insert
ON public.order_events
FOR INSERT
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
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- deliveries (via orders.store_id)
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deliveries_select ON public.deliveries;
CREATE POLICY deliveries_select
ON public.deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS deliveries_insert ON public.deliveries;
CREATE POLICY deliveries_insert
ON public.deliveries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS deliveries_update ON public.deliveries;
CREATE POLICY deliveries_update
ON public.deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS deliveries_delete ON public.deliveries;
CREATE POLICY deliveries_delete
ON public.deliveries
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- cash_movements (via cash_registers.store_id)
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_movements_select ON public.cash_movements;
CREATE POLICY cash_movements_select
ON public.cash_movements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

DROP POLICY IF EXISTS cash_movements_insert ON public.cash_movements;
CREATE POLICY cash_movements_insert
ON public.cash_movements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

DROP POLICY IF EXISTS cash_movements_update ON public.cash_movements;
CREATE POLICY cash_movements_update
ON public.cash_movements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

DROP POLICY IF EXISTS cash_movements_delete ON public.cash_movements;
CREATE POLICY cash_movements_delete
ON public.cash_movements
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

-- modifier_groups (store_id)
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS modifier_groups_select ON public.modifier_groups;
CREATE POLICY modifier_groups_select
ON public.modifier_groups
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS modifier_groups_insert ON public.modifier_groups;
CREATE POLICY modifier_groups_insert
ON public.modifier_groups
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS modifier_groups_update ON public.modifier_groups;
CREATE POLICY modifier_groups_update
ON public.modifier_groups
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS modifier_groups_delete ON public.modifier_groups;
CREATE POLICY modifier_groups_delete
ON public.modifier_groups
FOR DELETE
USING (public.user_has_store_access(store_id));

-- modifier_options (via modifier_groups.store_id)
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS modifier_options_select ON public.modifier_options;
CREATE POLICY modifier_options_select
ON public.modifier_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS modifier_options_insert ON public.modifier_options;
CREATE POLICY modifier_options_insert
ON public.modifier_options
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS modifier_options_update ON public.modifier_options;
CREATE POLICY modifier_options_update
ON public.modifier_options
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS modifier_options_delete ON public.modifier_options;
CREATE POLICY modifier_options_delete
ON public.modifier_options
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- product_modifier_groups (via modifier_groups.store_id)
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_modifier_groups_select ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS product_modifier_groups_insert ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_insert
ON public.product_modifier_groups
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS product_modifier_groups_update ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_update
ON public.product_modifier_groups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS product_modifier_groups_delete ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_delete
ON public.product_modifier_groups
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- product_combos (store_id)
ALTER TABLE public.product_combos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_combos_select ON public.product_combos;
CREATE POLICY product_combos_select
ON public.product_combos
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS product_combos_insert ON public.product_combos;
CREATE POLICY product_combos_insert
ON public.product_combos
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS product_combos_update ON public.product_combos;
CREATE POLICY product_combos_update
ON public.product_combos
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS product_combos_delete ON public.product_combos;
CREATE POLICY product_combos_delete
ON public.product_combos
FOR DELETE
USING (public.user_has_store_access(store_id));

-- combo_items (via product_combos.store_id)
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS combo_items_select ON public.combo_items;
CREATE POLICY combo_items_select
ON public.combo_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

DROP POLICY IF EXISTS combo_items_insert ON public.combo_items;
CREATE POLICY combo_items_insert
ON public.combo_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

DROP POLICY IF EXISTS combo_items_update ON public.combo_items;
CREATE POLICY combo_items_update
ON public.combo_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

DROP POLICY IF EXISTS combo_items_delete ON public.combo_items;
CREATE POLICY combo_items_delete
ON public.combo_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

-- product_ingredients (via inventory_items.store_id)
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_ingredients_select ON public.product_ingredients;
CREATE POLICY product_ingredients_select
ON public.product_ingredients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

DROP POLICY IF EXISTS product_ingredients_insert ON public.product_ingredients;
CREATE POLICY product_ingredients_insert
ON public.product_ingredients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

DROP POLICY IF EXISTS product_ingredients_update ON public.product_ingredients;
CREATE POLICY product_ingredients_update
ON public.product_ingredients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

DROP POLICY IF EXISTS product_ingredients_delete ON public.product_ingredients;
CREATE POLICY product_ingredients_delete
ON public.product_ingredients
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

-- ============================================================================
-- Smoke test
-- ============================================================================
-- Verificar policies criadas:
-- select tablename, policyname from pg_policies where schemaname='public' order by tablename, policyname;
