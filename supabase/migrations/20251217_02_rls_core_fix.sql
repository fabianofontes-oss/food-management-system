-- ============================================================================
-- RLS-CORE-FIX-01: Correção de policies permissivas (USING true)
-- Data: 2025-12-17
-- Bloqueador de Produção: SIM
-- ============================================================================
-- 
-- PROBLEMA: Múltiplas tabelas com policies `FOR ALL USING (true)` permitem
-- que qualquer usuário autenticado leia/escreva dados de TODAS as lojas.
--
-- SOLUÇÃO: Substituir por policies que filtram por store_id usando
-- a função `user_has_store_access(store_id)`.
--
-- ESCOPO: Tabelas core com dados sensíveis de loja
-- ============================================================================

-- 1) GARANTIR FUNÇÃO DE AUTORIZAÇÃO EXISTE
-- ============================================================================
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
-- 2) KITCHEN_CHEFS (já tem migration separada, mas garantir idempotência)
-- ============================================================================
ALTER TABLE IF EXISTS public.kitchen_chefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kitchen_chefs_all" ON public.kitchen_chefs;
DROP POLICY IF EXISTS "kitchen_chefs_store_access" ON public.kitchen_chefs;

CREATE POLICY "kitchen_chefs_store_access" ON public.kitchen_chefs
FOR ALL
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

-- ============================================================================
-- 3) STORE_WAITERS
-- ============================================================================
ALTER TABLE IF EXISTS public.store_waiters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_waiters_all" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_select" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_insert" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_update" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_delete" ON public.store_waiters;

CREATE POLICY "store_waiters_select" ON public.store_waiters
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "store_waiters_insert" ON public.store_waiters
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "store_waiters_update" ON public.store_waiters
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "store_waiters_delete" ON public.store_waiters
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 4) WAITER_SCHEDULES (via store_waiters.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.waiter_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiter_schedules_all" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_select" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_insert" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_update" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_delete" ON public.waiter_schedules;

CREATE POLICY "waiter_schedules_select" ON public.waiter_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_schedules_insert" ON public.waiter_schedules
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_schedules_update" ON public.waiter_schedules
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_schedules_delete" ON public.waiter_schedules
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

-- ============================================================================
-- 5) WAITER_COMMISSIONS (via store_waiters.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.waiter_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiter_commissions_all" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_select" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_insert" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_update" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_delete" ON public.waiter_commissions;

CREATE POLICY "waiter_commissions_select" ON public.waiter_commissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_commissions_insert" ON public.waiter_commissions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_commissions_update" ON public.waiter_commissions
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_commissions_delete" ON public.waiter_commissions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

-- ============================================================================
-- 6) TABLE_RESERVATIONS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.table_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "table_reservations_all" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_select" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_insert" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_update" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_delete" ON public.table_reservations;

CREATE POLICY "table_reservations_select" ON public.table_reservations
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "table_reservations_insert" ON public.table_reservations
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_reservations_update" ON public.table_reservations
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_reservations_delete" ON public.table_reservations
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 7) WAITER_CALLS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.waiter_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiter_calls_all" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_select" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_insert" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_update" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_delete" ON public.waiter_calls;

CREATE POLICY "waiter_calls_select" ON public.waiter_calls
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "waiter_calls_insert" ON public.waiter_calls
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "waiter_calls_update" ON public.waiter_calls
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "waiter_calls_delete" ON public.waiter_calls
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 8) TABLE_SESSIONS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.table_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "table_sessions_all" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_select" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_insert" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_update" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_delete" ON public.table_sessions;

CREATE POLICY "table_sessions_select" ON public.table_sessions
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "table_sessions_insert" ON public.table_sessions
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_sessions_update" ON public.table_sessions
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_sessions_delete" ON public.table_sessions
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 9) DRIVER_RATINGS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.driver_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_ratings_all" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_select" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_insert" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_update" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_delete" ON public.driver_ratings;

CREATE POLICY "driver_ratings_select" ON public.driver_ratings
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "driver_ratings_insert" ON public.driver_ratings
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "driver_ratings_update" ON public.driver_ratings
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "driver_ratings_delete" ON public.driver_ratings
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 10) SCHEDULING_SLOTS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.scheduling_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scheduling_slots_all" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_select" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_insert" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_update" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_delete" ON public.scheduling_slots;

CREATE POLICY "scheduling_slots_select" ON public.scheduling_slots
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "scheduling_slots_insert" ON public.scheduling_slots
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "scheduling_slots_update" ON public.scheduling_slots
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "scheduling_slots_delete" ON public.scheduling_slots
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 11) PRODUCT_KITS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_kits_all" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_select" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_insert" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_update" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_delete" ON public.product_kits;

CREATE POLICY "product_kits_select" ON public.product_kits
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "product_kits_insert" ON public.product_kits
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "product_kits_update" ON public.product_kits
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "product_kits_delete" ON public.product_kits
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 12) PRODUCT_KIT_ITEMS (via product_kits.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_kit_items_all" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_select" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_insert" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_update" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_delete" ON public.product_kit_items;

CREATE POLICY "product_kit_items_select" ON public.product_kit_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

CREATE POLICY "product_kit_items_insert" ON public.product_kit_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

CREATE POLICY "product_kit_items_update" ON public.product_kit_items
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

CREATE POLICY "product_kit_items_delete" ON public.product_kit_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

-- ============================================================================
-- 13) CUSTOMIZATION_GROUPS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.customization_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customization_groups_all" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_select" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_insert" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_update" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_delete" ON public.customization_groups;

CREATE POLICY "customization_groups_select" ON public.customization_groups
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "customization_groups_insert" ON public.customization_groups
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "customization_groups_update" ON public.customization_groups
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "customization_groups_delete" ON public.customization_groups
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 14) CUSTOMIZATION_OPTIONS (via customization_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.customization_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customization_options_all" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_select" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_insert" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_update" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_delete" ON public.customization_options;

CREATE POLICY "customization_options_select" ON public.customization_options
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "customization_options_insert" ON public.customization_options
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "customization_options_update" ON public.customization_options
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "customization_options_delete" ON public.customization_options
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

-- ============================================================================
-- 15) PRODUCT_CUSTOMIZATION_GROUPS (via customization_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_customization_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_customization_groups_all" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_select" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_insert" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_update" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_delete" ON public.product_customization_groups;

CREATE POLICY "product_customization_groups_select" ON public.product_customization_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "product_customization_groups_insert" ON public.product_customization_groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "product_customization_groups_update" ON public.product_customization_groups
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "product_customization_groups_delete" ON public.product_customization_groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

-- ============================================================================
-- 16) CUSTOM_ORDERS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.custom_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_orders_all" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_select" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_insert" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_update" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_delete" ON public.custom_orders;

CREATE POLICY "custom_orders_select" ON public.custom_orders
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "custom_orders_insert" ON public.custom_orders
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "custom_orders_update" ON public.custom_orders
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "custom_orders_delete" ON public.custom_orders
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 17) CUSTOM_ORDER_ITEMS (via custom_orders.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.custom_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_order_items_all" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_select" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_insert" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_update" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_delete" ON public.custom_order_items;

CREATE POLICY "custom_order_items_select" ON public.custom_order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

CREATE POLICY "custom_order_items_insert" ON public.custom_order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

CREATE POLICY "custom_order_items_update" ON public.custom_order_items
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

CREATE POLICY "custom_order_items_delete" ON public.custom_order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

-- ============================================================================
-- 18) PRODUCTION_CALENDAR (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.production_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_calendar_all" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_select" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_insert" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_update" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_delete" ON public.production_calendar;

CREATE POLICY "production_calendar_select" ON public.production_calendar
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "production_calendar_insert" ON public.production_calendar
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "production_calendar_update" ON public.production_calendar
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "production_calendar_delete" ON public.production_calendar
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 19) NOTIFICATIONS (store_id direto) - CORRIGIR POLICY PERMISSIVA
-- ============================================================================
-- Nota: notifications já tem policy em 20251214_05_rls_full_multitenant.sql
-- mas foi sobrescrita por 20241214_notifications.sql com USING(true)

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notifications_update" ON public.notifications
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notifications_delete" ON public.notifications
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 20) NOTIFICATION_SETTINGS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_settings_all" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_select" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_update" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_delete" ON public.notification_settings;

CREATE POLICY "notification_settings_select" ON public.notification_settings
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "notification_settings_insert" ON public.notification_settings
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notification_settings_update" ON public.notification_settings
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notification_settings_delete" ON public.notification_settings
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 21) PRODUCT_VARIATIONS (via products.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_variations_select" ON public.product_variations;
DROP POLICY IF EXISTS "product_variations_insert" ON public.product_variations;
DROP POLICY IF EXISTS "product_variations_update" ON public.product_variations;
DROP POLICY IF EXISTS "product_variations_delete" ON public.product_variations;

CREATE POLICY "product_variations_select" ON public.product_variations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

CREATE POLICY "product_variations_insert" ON public.product_variations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

CREATE POLICY "product_variations_update" ON public.product_variations
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

CREATE POLICY "product_variations_delete" ON public.product_variations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

-- ============================================================================
-- 22) ADDON_GROUPS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.addon_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addon_groups_select" ON public.addon_groups;
DROP POLICY IF EXISTS "addon_groups_insert" ON public.addon_groups;
DROP POLICY IF EXISTS "addon_groups_update" ON public.addon_groups;
DROP POLICY IF EXISTS "addon_groups_delete" ON public.addon_groups;

CREATE POLICY "addon_groups_select" ON public.addon_groups
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "addon_groups_insert" ON public.addon_groups
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "addon_groups_update" ON public.addon_groups
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "addon_groups_delete" ON public.addon_groups
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 23) ADDONS (via addon_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addons_select" ON public.addons;
DROP POLICY IF EXISTS "addons_insert" ON public.addons;
DROP POLICY IF EXISTS "addons_update" ON public.addons;
DROP POLICY IF EXISTS "addons_delete" ON public.addons;

CREATE POLICY "addons_select" ON public.addons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "addons_insert" ON public.addons
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "addons_update" ON public.addons
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "addons_delete" ON public.addons
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

-- ============================================================================
-- 24) PRODUCT_ADDON_GROUPS (via addon_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_addon_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_addon_groups_select" ON public.product_addon_groups;
DROP POLICY IF EXISTS "product_addon_groups_insert" ON public.product_addon_groups;
DROP POLICY IF EXISTS "product_addon_groups_update" ON public.product_addon_groups;
DROP POLICY IF EXISTS "product_addon_groups_delete" ON public.product_addon_groups;

CREATE POLICY "product_addon_groups_select" ON public.product_addon_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "product_addon_groups_insert" ON public.product_addon_groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "product_addon_groups_update" ON public.product_addon_groups
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "product_addon_groups_delete" ON public.product_addon_groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

-- ============================================================================
-- 25) RESERVATIONS - Manter INSERT público mas restringir SELECT/UPDATE/DELETE
-- ============================================================================
-- reservations_public_insert é intencional para reservas online anônimas
-- mas precisamos garantir que SELECT/UPDATE/DELETE são restritos

ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
DROP POLICY IF EXISTS "reservations_delete" ON public.reservations;

CREATE POLICY "reservations_select" ON public.reservations
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "reservations_update" ON public.reservations
FOR UPDATE 
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "reservations_delete" ON public.reservations
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- FIM DA MIGRATION RLS-CORE-FIX-01
-- ============================================================================
-- 
-- RESUMO: Corrigidas 25 tabelas com policies permissivas USING(true)
-- 
-- PRÓXIMOS PASSOS:
-- 1. Executar esta migration no Supabase SQL Editor
-- 2. Testar fluxos críticos: checkout, dashboard, cozinha
-- 3. Verificar que checkout público via RPC continua funcionando
-- 
-- ROLLBACK (se necessário):
-- As políticas antigas foram droppadas. Para rollback, re-executar
-- as migrations originais que criaram as policies USING(true).
-- ============================================================================
