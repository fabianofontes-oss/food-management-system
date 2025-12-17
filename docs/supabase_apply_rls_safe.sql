-- ============================================================================
-- SUPABASE-APPLY-RLS-01: SQL Consolidado SEGURO (ignora tabelas inexistentes)
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse Supabase Dashboard > SQL Editor
-- 2. Copie TODO o conteúdo deste arquivo
-- 3. Cole no SQL Editor
-- 4. Execute (Ctrl+Enter ou botão Run)
-- 5. Verifique as mensagens NOTICE para ver quais tabelas foram processadas
--
-- NOTA: Este script verifica a existência de cada tabela antes de aplicar RLS
-- ============================================================================

-- ############################################################################
-- PARTE 1: FUNÇÃO DE AUTORIZAÇÃO (idempotente)
-- ############################################################################

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

-- ############################################################################
-- PARTE 2: APLICAR RLS EM TODAS AS TABELAS (com verificação de existência)
-- ############################################################################

DO $$ 
DECLARE
  v_table_name TEXT;
  v_tables TEXT[] := ARRAY[
    'kitchen_chefs',
    'store_waiters', 
    'waiter_schedules',
    'waiter_commissions',
    'table_reservations',
    'waiter_calls',
    'table_sessions',
    'driver_ratings',
    'scheduling_slots',
    'product_kits',
    'product_kit_items',
    'customization_groups',
    'customization_options',
    'product_customization_groups',
    'custom_orders',
    'custom_order_items',
    'production_calendar',
    'notifications',
    'notification_settings',
    'product_variations',
    'addon_groups',
    'addons',
    'product_addon_groups',
    'reservations'
  ];
BEGIN
  FOREACH v_table_name IN ARRAY v_tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = v_table_name) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
      RAISE NOTICE '✓ Tabela % existe - RLS habilitado', v_table_name;
    ELSE
      RAISE NOTICE '✗ Tabela % NÃO existe - pulando', v_table_name;
    END IF;
  END LOOP;
END $$;

-- ############################################################################
-- PARTE 3: KITCHEN_CHEFS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kitchen_chefs') THEN
  DROP POLICY IF EXISTS "kitchen_chefs_all" ON public.kitchen_chefs;
  DROP POLICY IF EXISTS "kitchen_chefs_store_access" ON public.kitchen_chefs;
  CREATE POLICY "kitchen_chefs_store_access" ON public.kitchen_chefs FOR ALL
    USING (public.user_has_store_access(store_id))
    WITH CHECK (public.user_has_store_access(store_id));
  RAISE NOTICE 'kitchen_chefs: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 4: STORE_WAITERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_waiters') THEN
  DROP POLICY IF EXISTS "store_waiters_all" ON public.store_waiters;
  DROP POLICY IF EXISTS "store_waiters_select" ON public.store_waiters;
  DROP POLICY IF EXISTS "store_waiters_insert" ON public.store_waiters;
  DROP POLICY IF EXISTS "store_waiters_update" ON public.store_waiters;
  DROP POLICY IF EXISTS "store_waiters_delete" ON public.store_waiters;
  
  CREATE POLICY "store_waiters_select" ON public.store_waiters FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "store_waiters_insert" ON public.store_waiters FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "store_waiters_update" ON public.store_waiters FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "store_waiters_delete" ON public.store_waiters FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'store_waiters: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 5: WAITER_SCHEDULES (via store_waiters)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waiter_schedules') THEN
  DROP POLICY IF EXISTS "waiter_schedules_all" ON public.waiter_schedules;
  DROP POLICY IF EXISTS "waiter_schedules_select" ON public.waiter_schedules;
  DROP POLICY IF EXISTS "waiter_schedules_insert" ON public.waiter_schedules;
  DROP POLICY IF EXISTS "waiter_schedules_update" ON public.waiter_schedules;
  DROP POLICY IF EXISTS "waiter_schedules_delete" ON public.waiter_schedules;
  
  CREATE POLICY "waiter_schedules_select" ON public.waiter_schedules FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_schedules_insert" ON public.waiter_schedules FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_schedules_update" ON public.waiter_schedules FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_schedules_delete" ON public.waiter_schedules FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'waiter_schedules: policies criadas (usa store_id direto)';
END IF;
END $$;

-- ############################################################################
-- PARTE 6: WAITER_COMMISSIONS (via store_waiters)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waiter_commissions') THEN
  DROP POLICY IF EXISTS "waiter_commissions_all" ON public.waiter_commissions;
  DROP POLICY IF EXISTS "waiter_commissions_select" ON public.waiter_commissions;
  DROP POLICY IF EXISTS "waiter_commissions_insert" ON public.waiter_commissions;
  DROP POLICY IF EXISTS "waiter_commissions_update" ON public.waiter_commissions;
  DROP POLICY IF EXISTS "waiter_commissions_delete" ON public.waiter_commissions;
  
  CREATE POLICY "waiter_commissions_select" ON public.waiter_commissions FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_commissions_insert" ON public.waiter_commissions FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_commissions_update" ON public.waiter_commissions FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_commissions_delete" ON public.waiter_commissions FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'waiter_commissions: policies criadas (usa store_id direto)';
END IF;
END $$;

-- ############################################################################
-- PARTE 7: TABLE_RESERVATIONS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'table_reservations') THEN
  DROP POLICY IF EXISTS "table_reservations_all" ON public.table_reservations;
  DROP POLICY IF EXISTS "table_reservations_select" ON public.table_reservations;
  DROP POLICY IF EXISTS "table_reservations_insert" ON public.table_reservations;
  DROP POLICY IF EXISTS "table_reservations_update" ON public.table_reservations;
  DROP POLICY IF EXISTS "table_reservations_delete" ON public.table_reservations;
  
  CREATE POLICY "table_reservations_select" ON public.table_reservations FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "table_reservations_insert" ON public.table_reservations FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "table_reservations_update" ON public.table_reservations FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "table_reservations_delete" ON public.table_reservations FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'table_reservations: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 8: WAITER_CALLS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waiter_calls') THEN
  DROP POLICY IF EXISTS "waiter_calls_all" ON public.waiter_calls;
  DROP POLICY IF EXISTS "waiter_calls_select" ON public.waiter_calls;
  DROP POLICY IF EXISTS "waiter_calls_insert" ON public.waiter_calls;
  DROP POLICY IF EXISTS "waiter_calls_update" ON public.waiter_calls;
  DROP POLICY IF EXISTS "waiter_calls_delete" ON public.waiter_calls;
  
  CREATE POLICY "waiter_calls_select" ON public.waiter_calls FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_calls_insert" ON public.waiter_calls FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_calls_update" ON public.waiter_calls FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "waiter_calls_delete" ON public.waiter_calls FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'waiter_calls: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 9: TABLE_SESSIONS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'table_sessions') THEN
  DROP POLICY IF EXISTS "table_sessions_all" ON public.table_sessions;
  DROP POLICY IF EXISTS "table_sessions_select" ON public.table_sessions;
  DROP POLICY IF EXISTS "table_sessions_insert" ON public.table_sessions;
  DROP POLICY IF EXISTS "table_sessions_update" ON public.table_sessions;
  DROP POLICY IF EXISTS "table_sessions_delete" ON public.table_sessions;
  
  CREATE POLICY "table_sessions_select" ON public.table_sessions FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "table_sessions_insert" ON public.table_sessions FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "table_sessions_update" ON public.table_sessions FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "table_sessions_delete" ON public.table_sessions FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'table_sessions: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 10: DRIVER_RATINGS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'driver_ratings') THEN
  DROP POLICY IF EXISTS "driver_ratings_all" ON public.driver_ratings;
  DROP POLICY IF EXISTS "driver_ratings_select" ON public.driver_ratings;
  DROP POLICY IF EXISTS "driver_ratings_insert" ON public.driver_ratings;
  DROP POLICY IF EXISTS "driver_ratings_update" ON public.driver_ratings;
  DROP POLICY IF EXISTS "driver_ratings_delete" ON public.driver_ratings;
  
  CREATE POLICY "driver_ratings_select" ON public.driver_ratings FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "driver_ratings_insert" ON public.driver_ratings FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "driver_ratings_update" ON public.driver_ratings FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "driver_ratings_delete" ON public.driver_ratings FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'driver_ratings: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 11: SCHEDULING_SLOTS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scheduling_slots') THEN
  DROP POLICY IF EXISTS "scheduling_slots_all" ON public.scheduling_slots;
  DROP POLICY IF EXISTS "scheduling_slots_select" ON public.scheduling_slots;
  DROP POLICY IF EXISTS "scheduling_slots_insert" ON public.scheduling_slots;
  DROP POLICY IF EXISTS "scheduling_slots_update" ON public.scheduling_slots;
  DROP POLICY IF EXISTS "scheduling_slots_delete" ON public.scheduling_slots;
  
  CREATE POLICY "scheduling_slots_select" ON public.scheduling_slots FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "scheduling_slots_insert" ON public.scheduling_slots FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "scheduling_slots_update" ON public.scheduling_slots FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "scheduling_slots_delete" ON public.scheduling_slots FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'scheduling_slots: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 12: PRODUCT_KITS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_kits') THEN
  DROP POLICY IF EXISTS "product_kits_all" ON public.product_kits;
  DROP POLICY IF EXISTS "product_kits_select" ON public.product_kits;
  DROP POLICY IF EXISTS "product_kits_insert" ON public.product_kits;
  DROP POLICY IF EXISTS "product_kits_update" ON public.product_kits;
  DROP POLICY IF EXISTS "product_kits_delete" ON public.product_kits;
  
  CREATE POLICY "product_kits_select" ON public.product_kits FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "product_kits_insert" ON public.product_kits FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "product_kits_update" ON public.product_kits FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "product_kits_delete" ON public.product_kits FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'product_kits: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 13: PRODUCT_KIT_ITEMS (via product_kits)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_kit_items') THEN
  DROP POLICY IF EXISTS "product_kit_items_all" ON public.product_kit_items;
  DROP POLICY IF EXISTS "product_kit_items_select" ON public.product_kit_items;
  DROP POLICY IF EXISTS "product_kit_items_insert" ON public.product_kit_items;
  DROP POLICY IF EXISTS "product_kit_items_update" ON public.product_kit_items;
  DROP POLICY IF EXISTS "product_kit_items_delete" ON public.product_kit_items;
  
  CREATE POLICY "product_kit_items_select" ON public.product_kit_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.product_kits pk WHERE pk.id = product_kit_items.kit_id AND public.user_has_store_access(pk.store_id))
  );
  CREATE POLICY "product_kit_items_insert" ON public.product_kit_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.product_kits pk WHERE pk.id = product_kit_items.kit_id AND public.user_has_store_access(pk.store_id))
  );
  CREATE POLICY "product_kit_items_update" ON public.product_kit_items FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.product_kits pk WHERE pk.id = product_kit_items.kit_id AND public.user_has_store_access(pk.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.product_kits pk WHERE pk.id = product_kit_items.kit_id AND public.user_has_store_access(pk.store_id)));
  CREATE POLICY "product_kit_items_delete" ON public.product_kit_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.product_kits pk WHERE pk.id = product_kit_items.kit_id AND public.user_has_store_access(pk.store_id))
  );
  RAISE NOTICE 'product_kit_items: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 14: CUSTOMIZATION_GROUPS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customization_groups') THEN
  DROP POLICY IF EXISTS "customization_groups_all" ON public.customization_groups;
  DROP POLICY IF EXISTS "customization_groups_select" ON public.customization_groups;
  DROP POLICY IF EXISTS "customization_groups_insert" ON public.customization_groups;
  DROP POLICY IF EXISTS "customization_groups_update" ON public.customization_groups;
  DROP POLICY IF EXISTS "customization_groups_delete" ON public.customization_groups;
  
  CREATE POLICY "customization_groups_select" ON public.customization_groups FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "customization_groups_insert" ON public.customization_groups FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "customization_groups_update" ON public.customization_groups FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "customization_groups_delete" ON public.customization_groups FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'customization_groups: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 15: CUSTOMIZATION_OPTIONS (via customization_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customization_options') THEN
  DROP POLICY IF EXISTS "customization_options_all" ON public.customization_options;
  DROP POLICY IF EXISTS "customization_options_select" ON public.customization_options;
  DROP POLICY IF EXISTS "customization_options_insert" ON public.customization_options;
  DROP POLICY IF EXISTS "customization_options_update" ON public.customization_options;
  DROP POLICY IF EXISTS "customization_options_delete" ON public.customization_options;
  
  CREATE POLICY "customization_options_select" ON public.customization_options FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = customization_options.group_id AND public.user_has_store_access(cg.store_id))
  );
  CREATE POLICY "customization_options_insert" ON public.customization_options FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = customization_options.group_id AND public.user_has_store_access(cg.store_id))
  );
  CREATE POLICY "customization_options_update" ON public.customization_options FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = customization_options.group_id AND public.user_has_store_access(cg.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = customization_options.group_id AND public.user_has_store_access(cg.store_id)));
  CREATE POLICY "customization_options_delete" ON public.customization_options FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = customization_options.group_id AND public.user_has_store_access(cg.store_id))
  );
  RAISE NOTICE 'customization_options: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 16: PRODUCT_CUSTOMIZATION_GROUPS (via customization_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_customization_groups') THEN
  DROP POLICY IF EXISTS "product_customization_groups_all" ON public.product_customization_groups;
  DROP POLICY IF EXISTS "product_customization_groups_select" ON public.product_customization_groups;
  DROP POLICY IF EXISTS "product_customization_groups_insert" ON public.product_customization_groups;
  DROP POLICY IF EXISTS "product_customization_groups_update" ON public.product_customization_groups;
  DROP POLICY IF EXISTS "product_customization_groups_delete" ON public.product_customization_groups;
  
  CREATE POLICY "product_customization_groups_select" ON public.product_customization_groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = product_customization_groups.group_id AND public.user_has_store_access(cg.store_id))
  );
  CREATE POLICY "product_customization_groups_insert" ON public.product_customization_groups FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = product_customization_groups.group_id AND public.user_has_store_access(cg.store_id))
  );
  CREATE POLICY "product_customization_groups_update" ON public.product_customization_groups FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = product_customization_groups.group_id AND public.user_has_store_access(cg.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = product_customization_groups.group_id AND public.user_has_store_access(cg.store_id)));
  CREATE POLICY "product_customization_groups_delete" ON public.product_customization_groups FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.customization_groups cg WHERE cg.id = product_customization_groups.group_id AND public.user_has_store_access(cg.store_id))
  );
  RAISE NOTICE 'product_customization_groups: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 17: CUSTOM_ORDERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_orders') THEN
  DROP POLICY IF EXISTS "custom_orders_all" ON public.custom_orders;
  DROP POLICY IF EXISTS "custom_orders_select" ON public.custom_orders;
  DROP POLICY IF EXISTS "custom_orders_insert" ON public.custom_orders;
  DROP POLICY IF EXISTS "custom_orders_update" ON public.custom_orders;
  DROP POLICY IF EXISTS "custom_orders_delete" ON public.custom_orders;
  
  CREATE POLICY "custom_orders_select" ON public.custom_orders FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "custom_orders_insert" ON public.custom_orders FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "custom_orders_update" ON public.custom_orders FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "custom_orders_delete" ON public.custom_orders FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'custom_orders: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 18: CUSTOM_ORDER_ITEMS (via custom_orders)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_order_items') THEN
  DROP POLICY IF EXISTS "custom_order_items_all" ON public.custom_order_items;
  DROP POLICY IF EXISTS "custom_order_items_select" ON public.custom_order_items;
  DROP POLICY IF EXISTS "custom_order_items_insert" ON public.custom_order_items;
  DROP POLICY IF EXISTS "custom_order_items_update" ON public.custom_order_items;
  DROP POLICY IF EXISTS "custom_order_items_delete" ON public.custom_order_items;
  
  CREATE POLICY "custom_order_items_select" ON public.custom_order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.custom_orders co WHERE co.id = custom_order_items.order_id AND public.user_has_store_access(co.store_id))
  );
  CREATE POLICY "custom_order_items_insert" ON public.custom_order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.custom_orders co WHERE co.id = custom_order_items.order_id AND public.user_has_store_access(co.store_id))
  );
  CREATE POLICY "custom_order_items_update" ON public.custom_order_items FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.custom_orders co WHERE co.id = custom_order_items.order_id AND public.user_has_store_access(co.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.custom_orders co WHERE co.id = custom_order_items.order_id AND public.user_has_store_access(co.store_id)));
  CREATE POLICY "custom_order_items_delete" ON public.custom_order_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.custom_orders co WHERE co.id = custom_order_items.order_id AND public.user_has_store_access(co.store_id))
  );
  RAISE NOTICE 'custom_order_items: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 19: PRODUCTION_CALENDAR
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'production_calendar') THEN
  DROP POLICY IF EXISTS "production_calendar_all" ON public.production_calendar;
  DROP POLICY IF EXISTS "production_calendar_select" ON public.production_calendar;
  DROP POLICY IF EXISTS "production_calendar_insert" ON public.production_calendar;
  DROP POLICY IF EXISTS "production_calendar_update" ON public.production_calendar;
  DROP POLICY IF EXISTS "production_calendar_delete" ON public.production_calendar;
  
  CREATE POLICY "production_calendar_select" ON public.production_calendar FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "production_calendar_insert" ON public.production_calendar FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "production_calendar_update" ON public.production_calendar FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "production_calendar_delete" ON public.production_calendar FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'production_calendar: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 20: NOTIFICATIONS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
  DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
  DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
  DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
  DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
  DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
  
  CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'notifications: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 21: NOTIFICATION_SETTINGS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_settings') THEN
  DROP POLICY IF EXISTS "notification_settings_all" ON public.notification_settings;
  DROP POLICY IF EXISTS "notification_settings_select" ON public.notification_settings;
  DROP POLICY IF EXISTS "notification_settings_insert" ON public.notification_settings;
  DROP POLICY IF EXISTS "notification_settings_update" ON public.notification_settings;
  DROP POLICY IF EXISTS "notification_settings_delete" ON public.notification_settings;
  
  CREATE POLICY "notification_settings_select" ON public.notification_settings FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "notification_settings_insert" ON public.notification_settings FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "notification_settings_update" ON public.notification_settings FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "notification_settings_delete" ON public.notification_settings FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'notification_settings: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 22: PRODUCT_VARIATIONS (via products)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variations') THEN
  DROP POLICY IF EXISTS "product_variations_select" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_insert" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_update" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_delete" ON public.product_variations;
  
  CREATE POLICY "product_variations_select" ON public.product_variations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  CREATE POLICY "product_variations_insert" ON public.product_variations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  CREATE POLICY "product_variations_update" ON public.product_variations FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)));
  CREATE POLICY "product_variations_delete" ON public.product_variations FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  RAISE NOTICE 'product_variations: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 23: ADDON_GROUPS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addon_groups') THEN
  DROP POLICY IF EXISTS "addon_groups_select" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_insert" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_update" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_delete" ON public.addon_groups;
  
  CREATE POLICY "addon_groups_select" ON public.addon_groups FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "addon_groups_insert" ON public.addon_groups FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "addon_groups_update" ON public.addon_groups FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "addon_groups_delete" ON public.addon_groups FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'addon_groups: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 24: ADDONS (via addon_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addons') THEN
  DROP POLICY IF EXISTS "addons_select" ON public.addons;
  DROP POLICY IF EXISTS "addons_insert" ON public.addons;
  DROP POLICY IF EXISTS "addons_update" ON public.addons;
  DROP POLICY IF EXISTS "addons_delete" ON public.addons;
  
  CREATE POLICY "addons_select" ON public.addons FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  CREATE POLICY "addons_insert" ON public.addons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  CREATE POLICY "addons_update" ON public.addons FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)));
  CREATE POLICY "addons_delete" ON public.addons FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  RAISE NOTICE 'addons: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 25: PRODUCT_ADDON_GROUPS (via addon_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_addon_groups') THEN
  DROP POLICY IF EXISTS "product_addon_groups_select" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_insert" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_update" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_delete" ON public.product_addon_groups;
  
  CREATE POLICY "product_addon_groups_select" ON public.product_addon_groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  CREATE POLICY "product_addon_groups_insert" ON public.product_addon_groups FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  CREATE POLICY "product_addon_groups_update" ON public.product_addon_groups FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)));
  CREATE POLICY "product_addon_groups_delete" ON public.product_addon_groups FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  RAISE NOTICE 'product_addon_groups: policies criadas';
END IF;
END $$;

-- ############################################################################
-- PARTE 26: RESERVATIONS (manter INSERT público)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
  DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_delete" ON public.reservations;
  
  CREATE POLICY "reservations_select" ON public.reservations FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "reservations_update" ON public.reservations FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "reservations_delete" ON public.reservations FOR DELETE USING (public.user_has_store_access(store_id));
  RAISE NOTICE 'reservations: policies criadas (INSERT público mantido)';
END IF;
END $$;

-- ############################################################################
-- FIM - RESUMO
-- ############################################################################

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS aplicado com sucesso!';
  RAISE NOTICE 'Verifique as mensagens acima para ver quais tabelas foram processadas.';
  RAISE NOTICE '========================================';
END $$;

-- ############################################################################
-- QUERIES DE VALIDAÇÃO (execute separadamente após aplicar)
-- ############################################################################

-- QUERY 1: Verificar se sobrou alguma policy USING(true)
-- SELECT tablename, policyname, qual, with_check
-- FROM pg_policies
-- WHERE schemaname='public'
--   AND (qual='true' OR with_check='true')
-- ORDER BY tablename, policyname;

-- QUERY 2: Verificar RLS ligado nas tabelas core
-- SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r'
--   AND c.relname IN (
--     'orders', 'order_items', 'products', 'categories', 
--     'customers', 'store_settings', 'coupons', 'kitchen_chefs'
--   )
-- ORDER BY c.relname;
