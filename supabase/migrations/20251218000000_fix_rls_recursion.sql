-- ============================================================================
-- FIX CRÍTICO: Resolver recursão infinita nas funções RLS
-- Problema: user_has_store_access() consulta store_users, que tem policy
--           que chama user_has_store_access() → stack overflow
-- ============================================================================

-- 1) Dropar TODAS as policies que dependem de user_has_store_access
-- (lista extraída do erro de dependência)

-- products
DROP POLICY IF EXISTS "Users can read products from their stores" ON public.products;
DROP POLICY IF EXISTS "Users can insert products to their stores" ON public.products;
DROP POLICY IF EXISTS "Users can update products in their stores" ON public.products;
DROP POLICY IF EXISTS "Users can delete products from their stores" ON public.products;
DROP POLICY IF EXISTS products_member_select ON public.products;

-- orders
DROP POLICY IF EXISTS "Users can read orders from their stores" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders to their stores" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders in their stores" ON public.orders;
DROP POLICY IF EXISTS "Users can delete orders from their stores" ON public.orders;
DROP POLICY IF EXISTS orders_insert ON public.orders;
DROP POLICY IF EXISTS orders_update ON public.orders;
DROP POLICY IF EXISTS orders_delete ON public.orders;

-- order_items
DROP POLICY IF EXISTS "Users can read order items from their stores" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items to their stores" ON public.order_items;
DROP POLICY IF EXISTS "Users can update order items in their stores" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete order items from their stores" ON public.order_items;
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
DROP POLICY IF EXISTS order_items_update ON public.order_items;
DROP POLICY IF EXISTS order_items_delete ON public.order_items;

-- deliveries
DROP POLICY IF EXISTS "Users can read deliveries from their stores" ON public.deliveries;
DROP POLICY IF EXISTS "Users can insert deliveries to their stores" ON public.deliveries;
DROP POLICY IF EXISTS "Users can update deliveries in their stores" ON public.deliveries;
DROP POLICY IF EXISTS "Users can delete deliveries from their stores" ON public.deliveries;

-- customers
DROP POLICY IF EXISTS "Users can read customers from their stores" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers to their stores" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers in their stores" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers from their stores" ON public.customers;
DROP POLICY IF EXISTS customers_insert ON public.customers;
DROP POLICY IF EXISTS customers_update ON public.customers;
DROP POLICY IF EXISTS customers_delete ON public.customers;

-- customer_addresses
DROP POLICY IF EXISTS "Users can read customer addresses from their stores" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can insert customer addresses to their stores" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can update customer addresses in their stores" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can delete customer addresses from their stores" ON public.customer_addresses;
DROP POLICY IF EXISTS customer_addresses_insert ON public.customer_addresses;
DROP POLICY IF EXISTS customer_addresses_update ON public.customer_addresses;
DROP POLICY IF EXISTS customer_addresses_delete ON public.customer_addresses;

-- store_users
DROP POLICY IF EXISTS store_users_store_select ON public.store_users;

-- order_item_modifiers
DROP POLICY IF EXISTS oim_insert ON public.order_item_modifiers;
DROP POLICY IF EXISTS oim_update ON public.order_item_modifiers;
DROP POLICY IF EXISTS oim_delete ON public.order_item_modifiers;

-- order_events
DROP POLICY IF EXISTS order_events_insert ON public.order_events;
DROP POLICY IF EXISTS order_events_update ON public.order_events;
DROP POLICY IF EXISTS order_events_delete ON public.order_events;

-- custom_orders, rodizio, tabs, etc
DROP POLICY IF EXISTS custom_orders_store_access ON public.custom_orders;
DROP POLICY IF EXISTS rodizio_configs_store_access ON public.rodizio_configs;
DROP POLICY IF EXISTS rodizio_sessions_store_access ON public.rodizio_sessions;
DROP POLICY IF EXISTS rodizio_items_session_access ON public.rodizio_items;
DROP POLICY IF EXISTS tabs_store_access ON public.tabs;
DROP POLICY IF EXISTS tab_items_tab_access ON public.tab_items;
DROP POLICY IF EXISTS tab_splits_tab_access ON public.tab_splits;
DROP POLICY IF EXISTS happy_hours_store_access ON public.happy_hours;
DROP POLICY IF EXISTS virtual_brands_store_access ON public.virtual_brands;

-- meat, fish, produce
DROP POLICY IF EXISTS meat_cuts_store_access ON public.meat_cuts;
DROP POLICY IF EXISTS meat_seasonings_store_access ON public.meat_seasonings;
DROP POLICY IF EXISTS fish_preparations_store_access ON public.fish_preparations;
DROP POLICY IF EXISTS produce_promotions_store_access ON public.produce_promotions;
DROP POLICY IF EXISTS product_meat_cuts_access ON public.product_meat_cuts;
DROP POLICY IF EXISTS product_seasonings_access ON public.product_seasonings;
DROP POLICY IF EXISTS product_fish_preparations_access ON public.product_fish_preparations;

-- stores
DROP POLICY IF EXISTS stores_member_select ON public.stores;
DROP POLICY IF EXISTS stores_update ON public.stores;

-- categories
DROP POLICY IF EXISTS categories_member_select ON public.categories;

-- modifier_groups, modifier_options, product_modifier_groups
DROP POLICY IF EXISTS modifier_groups_member_select ON public.modifier_groups;
DROP POLICY IF EXISTS modifier_options_member_select ON public.modifier_options;
DROP POLICY IF EXISTS product_modifier_groups_member_select ON public.product_modifier_groups;

-- loyalty
DROP POLICY IF EXISTS loyalty_programs_store_access ON public.loyalty_programs;
DROP POLICY IF EXISTS loyalty_tiers_access ON public.loyalty_tiers;
DROP POLICY IF EXISTS customer_loyalty_store_access ON public.customer_loyalty;
DROP POLICY IF EXISTS loyalty_transactions_store_access ON public.loyalty_transactions;

-- engagement
DROP POLICY IF EXISTS engagement_rules_store_access ON public.customer_engagement_rules;
DROP POLICY IF EXISTS engagement_log_access ON public.customer_engagement_log;

-- kds
DROP POLICY IF EXISTS kds_config_store_access ON public.kds_config;
DROP POLICY IF EXISTS kds_stations_store_access ON public.kds_stations;
DROP POLICY IF EXISTS kds_order_log_store_access ON public.kds_order_log;

-- tv_displays
DROP POLICY IF EXISTS tv_displays_store_access ON public.tv_displays;
DROP POLICY IF EXISTS tv_promotions_store_access ON public.tv_promotions;

-- marketing
DROP POLICY IF EXISTS marketing_templates_access ON public.marketing_templates;
DROP POLICY IF EXISTS marketing_posts_store_access ON public.marketing_posts;
DROP POLICY IF EXISTS social_frames_access ON public.social_frames;

-- hardware
DROP POLICY IF EXISTS hardware_devices_store_access ON public.hardware_devices;

-- kitchen_chefs
DROP POLICY IF EXISTS kitchen_chefs_store_access ON public.kitchen_chefs;

-- waiters
DROP POLICY IF EXISTS store_waiters_select ON public.store_waiters;
DROP POLICY IF EXISTS store_waiters_insert ON public.store_waiters;
DROP POLICY IF EXISTS store_waiters_update ON public.store_waiters;
DROP POLICY IF EXISTS store_waiters_delete ON public.store_waiters;
DROP POLICY IF EXISTS waiter_schedules_select ON public.waiter_schedules;
DROP POLICY IF EXISTS waiter_schedules_insert ON public.waiter_schedules;
DROP POLICY IF EXISTS waiter_schedules_update ON public.waiter_schedules;
DROP POLICY IF EXISTS waiter_schedules_delete ON public.waiter_schedules;
DROP POLICY IF EXISTS waiter_commissions_select ON public.waiter_commissions;
DROP POLICY IF EXISTS waiter_commissions_insert ON public.waiter_commissions;
DROP POLICY IF EXISTS waiter_commissions_update ON public.waiter_commissions;
DROP POLICY IF EXISTS waiter_commissions_delete ON public.waiter_commissions;

-- table_reservations
DROP POLICY IF EXISTS table_reservations_select ON public.table_reservations;
DROP POLICY IF EXISTS table_reservations_insert ON public.table_reservations;
DROP POLICY IF EXISTS table_reservations_update ON public.table_reservations;
DROP POLICY IF EXISTS table_reservations_delete ON public.table_reservations;

-- waiter_calls
DROP POLICY IF EXISTS waiter_calls_select ON public.waiter_calls;
DROP POLICY IF EXISTS waiter_calls_insert ON public.waiter_calls;

-- 2) Dropar função problemática (agora sem dependências)
DROP FUNCTION IF EXISTS public.user_has_store_access(uuid);
DROP FUNCTION IF EXISTS public.user_can_manage_store_users(uuid);

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
