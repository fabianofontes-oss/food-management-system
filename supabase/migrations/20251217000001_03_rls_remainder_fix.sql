-- ============================================================================
-- RLS-REMAINDER-FIX-02: Corrigir tabelas permissivas restantes
-- Data: 2025-12-17
-- ============================================================================
-- 
-- PROBLEMA: Várias tabelas ainda com policies USING(true) ou WITH CHECK(true)
-- SOLUÇÃO: Substituir por policies filtradas por store_id
--
-- TABELAS CORRIGIDAS:
-- 1. store_settings (RLS estava OFF)
-- 2. addon_groups, addons, product_addon_groups
-- 3. cash_flow, cash_movements, cash_registers, daily_summary
-- 4. expenses, financial_categories, receivables
-- 5. inventory_batches, inventory_count_items, inventory_counts, inventory_movements
-- 6. product_ingredients, product_variations
-- 7. purchase_order_items, purchase_orders, suppliers
-- 8. coupon_uses (INSERT público com restrição)
-- 9. reservations (INSERT público com restrição)
-- ============================================================================

-- ############################################################################
-- 1) STORE_SETTINGS (RLS estava OFF)
-- ############################################################################

ALTER TABLE IF EXISTS public.store_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_settings') THEN
  DROP POLICY IF EXISTS "store_settings_all" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_select" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_insert" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_update" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_delete" ON public.store_settings;
  
  CREATE POLICY "store_settings_select" ON public.store_settings
  FOR SELECT TO authenticated USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "store_settings_insert" ON public.store_settings
  FOR INSERT TO authenticated WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "store_settings_update" ON public.store_settings
  FOR UPDATE TO authenticated 
  USING (public.user_has_store_access(store_id))
  WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "store_settings_delete" ON public.store_settings
  FOR DELETE TO authenticated USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'store_settings: RLS habilitado + policies criadas';
END IF;
END $$;

-- ############################################################################
-- 2) ADDON_GROUPS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addon_groups') THEN
  ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "addon_groups_all" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_select" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_insert" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_update" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_delete" ON public.addon_groups;
  
  CREATE POLICY "addon_groups_select" ON public.addon_groups
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "addon_groups_insert" ON public.addon_groups
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "addon_groups_update" ON public.addon_groups
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "addon_groups_delete" ON public.addon_groups
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'addon_groups: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 3) ADDONS (via addon_groups.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addons') THEN
  ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "addons_all" ON public.addons;
  DROP POLICY IF EXISTS "addons_select" ON public.addons;
  DROP POLICY IF EXISTS "addons_insert" ON public.addons;
  DROP POLICY IF EXISTS "addons_update" ON public.addons;
  DROP POLICY IF EXISTS "addons_delete" ON public.addons;
  
  CREATE POLICY "addons_select" ON public.addons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  
  CREATE POLICY "addons_insert" ON public.addons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  
  CREATE POLICY "addons_update" ON public.addons
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)));
  
  CREATE POLICY "addons_delete" ON public.addons
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  
  RAISE NOTICE 'addons: policies corrigidas (via addon_groups)';
END IF;
END $$;

-- ############################################################################
-- 4) PRODUCT_ADDON_GROUPS (via addon_groups.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_addon_groups') THEN
  ALTER TABLE public.product_addon_groups ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "product_addon_groups_all" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_select" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_insert" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_update" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_delete" ON public.product_addon_groups;
  
  CREATE POLICY "product_addon_groups_select" ON public.product_addon_groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  
  CREATE POLICY "product_addon_groups_insert" ON public.product_addon_groups
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  
  CREATE POLICY "product_addon_groups_update" ON public.product_addon_groups
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)));
  
  CREATE POLICY "product_addon_groups_delete" ON public.product_addon_groups
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  
  RAISE NOTICE 'product_addon_groups: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 5) CASH_REGISTERS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_registers') THEN
  ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "cash_registers_all" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_select" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_insert" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_update" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_delete" ON public.cash_registers;
  
  CREATE POLICY "cash_registers_select" ON public.cash_registers
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "cash_registers_insert" ON public.cash_registers
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "cash_registers_update" ON public.cash_registers
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "cash_registers_delete" ON public.cash_registers
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'cash_registers: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 6) CASH_MOVEMENTS (pode ter store_id ou cash_register_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_movements') THEN
  ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "cash_movements_all" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_select" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_insert" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_update" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_delete" ON public.cash_movements;
  
  -- Verificar se tem store_id direto ou precisa de join via cash_registers
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_movements' AND column_name = 'store_id') THEN
    CREATE POLICY "cash_movements_select" ON public.cash_movements
    FOR SELECT USING (public.user_has_store_access(store_id));
    
    CREATE POLICY "cash_movements_insert" ON public.cash_movements
    FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
    
    CREATE POLICY "cash_movements_update" ON public.cash_movements
    FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
    
    CREATE POLICY "cash_movements_delete" ON public.cash_movements
    FOR DELETE USING (public.user_has_store_access(store_id));
    
    RAISE NOTICE 'cash_movements: policies corrigidas (store_id direto)';
  ELSE
    CREATE POLICY "cash_movements_select" ON public.cash_movements
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    
    CREATE POLICY "cash_movements_insert" ON public.cash_movements
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    
    CREATE POLICY "cash_movements_update" ON public.cash_movements
    FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)));
    
    CREATE POLICY "cash_movements_delete" ON public.cash_movements
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    
    RAISE NOTICE 'cash_movements: policies corrigidas (via cash_registers)';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 7) CASH_FLOW (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_flow') THEN
  ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "cash_flow_all" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_select" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_insert" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_update" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_delete" ON public.cash_flow;
  
  CREATE POLICY "cash_flow_select" ON public.cash_flow
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "cash_flow_insert" ON public.cash_flow
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "cash_flow_update" ON public.cash_flow
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "cash_flow_delete" ON public.cash_flow
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'cash_flow: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 8) DAILY_SUMMARY (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_summary') THEN
  ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "daily_summary_all" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_select" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_insert" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_update" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_delete" ON public.daily_summary;
  
  CREATE POLICY "daily_summary_select" ON public.daily_summary
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "daily_summary_insert" ON public.daily_summary
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "daily_summary_update" ON public.daily_summary
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "daily_summary_delete" ON public.daily_summary
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'daily_summary: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 9) EXPENSES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
  ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
  
  CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "expenses_update" ON public.expenses
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "expenses_delete" ON public.expenses
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'expenses: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 10) FINANCIAL_CATEGORIES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_categories') THEN
  ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "financial_categories_all" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_select" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_insert" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_update" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_delete" ON public.financial_categories;
  
  CREATE POLICY "financial_categories_select" ON public.financial_categories
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "financial_categories_insert" ON public.financial_categories
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "financial_categories_update" ON public.financial_categories
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "financial_categories_delete" ON public.financial_categories
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'financial_categories: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 11) RECEIVABLES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'receivables') THEN
  ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "receivables_all" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_select" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_insert" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_update" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_delete" ON public.receivables;
  
  CREATE POLICY "receivables_select" ON public.receivables
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "receivables_insert" ON public.receivables
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "receivables_update" ON public.receivables
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "receivables_delete" ON public.receivables
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'receivables: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 12) INVENTORY_MOVEMENTS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_movements') THEN
  ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "inventory_movements_all" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_update" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_delete" ON public.inventory_movements;
  
  CREATE POLICY "inventory_movements_select" ON public.inventory_movements
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_movements_insert" ON public.inventory_movements
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_movements_update" ON public.inventory_movements
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_movements_delete" ON public.inventory_movements
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'inventory_movements: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 13) INVENTORY_BATCHES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_batches') THEN
  ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "inventory_batches_all" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_select" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_insert" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_update" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_delete" ON public.inventory_batches;
  
  CREATE POLICY "inventory_batches_select" ON public.inventory_batches
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_batches_insert" ON public.inventory_batches
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_batches_update" ON public.inventory_batches
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_batches_delete" ON public.inventory_batches
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'inventory_batches: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 14) INVENTORY_COUNTS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_counts') THEN
  ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "inventory_counts_all" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_select" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_insert" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_update" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_delete" ON public.inventory_counts;
  
  CREATE POLICY "inventory_counts_select" ON public.inventory_counts
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_counts_insert" ON public.inventory_counts
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_counts_update" ON public.inventory_counts
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "inventory_counts_delete" ON public.inventory_counts
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'inventory_counts: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 15) INVENTORY_COUNT_ITEMS (via inventory_counts.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_count_items') THEN
  ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "inventory_count_items_all" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_select" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_insert" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_update" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_delete" ON public.inventory_count_items;
  
  CREATE POLICY "inventory_count_items_select" ON public.inventory_count_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  
  CREATE POLICY "inventory_count_items_insert" ON public.inventory_count_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  
  CREATE POLICY "inventory_count_items_update" ON public.inventory_count_items
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)));
  
  CREATE POLICY "inventory_count_items_delete" ON public.inventory_count_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  
  RAISE NOTICE 'inventory_count_items: policies corrigidas (via inventory_counts)';
END IF;
END $$;

-- ############################################################################
-- 16) PURCHASE_ORDERS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
  ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "purchase_orders_all" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_select" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_insert" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_update" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_delete" ON public.purchase_orders;
  
  CREATE POLICY "purchase_orders_select" ON public.purchase_orders
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "purchase_orders_insert" ON public.purchase_orders
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "purchase_orders_update" ON public.purchase_orders
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "purchase_orders_delete" ON public.purchase_orders
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'purchase_orders: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 17) PURCHASE_ORDER_ITEMS (via purchase_orders.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
  ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "purchase_order_items_all" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_select" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_insert" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_update" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_delete" ON public.purchase_order_items;
  
  CREATE POLICY "purchase_order_items_select" ON public.purchase_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  
  CREATE POLICY "purchase_order_items_insert" ON public.purchase_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  
  CREATE POLICY "purchase_order_items_update" ON public.purchase_order_items
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)));
  
  CREATE POLICY "purchase_order_items_delete" ON public.purchase_order_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  
  RAISE NOTICE 'purchase_order_items: policies corrigidas (via purchase_orders)';
END IF;
END $$;

-- ############################################################################
-- 18) SUPPLIERS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
  ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "suppliers_all" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;
  
  CREATE POLICY "suppliers_select" ON public.suppliers
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "suppliers_insert" ON public.suppliers
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "suppliers_update" ON public.suppliers
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "suppliers_delete" ON public.suppliers
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  RAISE NOTICE 'suppliers: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 19) PRODUCT_INGREDIENTS (tem store_id na migration inventory_premium)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_ingredients') THEN
  ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "product_ingredients_all" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_select" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_insert" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_update" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_delete" ON public.product_ingredients;
  
  -- Verificar se tem store_id ou precisa de join via products
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_ingredients' AND column_name = 'store_id') THEN
    CREATE POLICY "product_ingredients_select" ON public.product_ingredients
    FOR SELECT USING (public.user_has_store_access(store_id));
    
    CREATE POLICY "product_ingredients_insert" ON public.product_ingredients
    FOR INSERT WITH CHECK (public.user_has_store_access(store_id));
    
    CREATE POLICY "product_ingredients_update" ON public.product_ingredients
    FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
    
    CREATE POLICY "product_ingredients_delete" ON public.product_ingredients
    FOR DELETE USING (public.user_has_store_access(store_id));
    
    RAISE NOTICE 'product_ingredients: policies corrigidas (store_id direto)';
  ELSE
    CREATE POLICY "product_ingredients_select" ON public.product_ingredients
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    
    CREATE POLICY "product_ingredients_insert" ON public.product_ingredients
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    
    CREATE POLICY "product_ingredients_update" ON public.product_ingredients
    FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)));
    
    CREATE POLICY "product_ingredients_delete" ON public.product_ingredients
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    
    RAISE NOTICE 'product_ingredients: policies corrigidas (via products)';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 20) PRODUCT_VARIATIONS (via products.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variations') THEN
  ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "product_variations_all" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_select" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_insert" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_update" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_delete" ON public.product_variations;
  
  CREATE POLICY "product_variations_select" ON public.product_variations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  
  CREATE POLICY "product_variations_insert" ON public.product_variations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  
  CREATE POLICY "product_variations_update" ON public.product_variations
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)));
  
  CREATE POLICY "product_variations_delete" ON public.product_variations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  
  RAISE NOTICE 'product_variations: policies corrigidas (via products)';
END IF;
END $$;

-- ############################################################################
-- 21) COUPON_USES (INSERT público com restrição via coupon/order)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupon_uses') THEN
  ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "coupon_uses_all" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_insert" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_select" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_update" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_delete" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_public_insert" ON public.coupon_uses;
  
  -- SELECT/UPDATE/DELETE: apenas membros da loja do cupom
  CREATE POLICY "coupon_uses_select" ON public.coupon_uses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );
  
  CREATE POLICY "coupon_uses_update" ON public.coupon_uses
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)));
  
  CREATE POLICY "coupon_uses_delete" ON public.coupon_uses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );
  
  -- INSERT público: qualquer um pode usar cupom, mas o cupom deve existir em uma loja ativa
  CREATE POLICY "coupon_uses_public_insert" ON public.coupon_uses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coupons c 
      JOIN public.stores s ON s.id = c.store_id
      WHERE c.id = coupon_uses.coupon_id 
        AND c.is_active = true 
        AND s.is_active = true
    )
  );
  
  RAISE NOTICE 'coupon_uses: policies corrigidas (INSERT público com validação de cupom ativo)';
END IF;
END $$;

-- ############################################################################
-- 22) RESERVATIONS (INSERT público com restrição)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
  ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "reservations_all" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_public_insert" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_delete" ON public.reservations;
  
  -- SELECT/UPDATE/DELETE: apenas membros da loja
  CREATE POLICY "reservations_select" ON public.reservations
  FOR SELECT USING (public.user_has_store_access(store_id));
  
  CREATE POLICY "reservations_update" ON public.reservations
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));
  
  CREATE POLICY "reservations_delete" ON public.reservations
  FOR DELETE USING (public.user_has_store_access(store_id));
  
  -- INSERT público: qualquer um pode fazer reserva, mas a loja deve estar ativa
  CREATE POLICY "reservations_public_insert" ON public.reservations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = reservations.store_id 
        AND s.is_active = true
    )
  );
  
  RAISE NOTICE 'reservations: policies corrigidas (INSERT público apenas para lojas ativas)';
END IF;
END $$;

-- ############################################################################
-- FIM DA MIGRATION
-- ############################################################################

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS-REMAINDER-FIX-02 aplicado!';
  RAISE NOTICE '22 tabelas processadas';
  RAISE NOTICE '========================================';
END $$;
