-- ============================================================================
-- RLS-REMAINDER-FIX-02: Versão SEGURA (verifica colunas dinamicamente)
-- Data: 2025-12-17
-- ============================================================================
-- 
-- Este script verifica a existência de cada tabela E coluna antes de criar policies
-- Evita erros de "column does not exist"
-- ============================================================================

-- ############################################################################
-- FUNÇÃO AUXILIAR: Criar policy de forma segura
-- ############################################################################

CREATE OR REPLACE FUNCTION _temp_create_store_policies(
  p_table_name TEXT,
  p_store_id_column TEXT DEFAULT 'store_id'
) RETURNS void AS $$
BEGIN
  -- Habilitar RLS
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table_name);
  
  -- Dropar policies antigas
  EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', p_table_name, p_table_name);
  
  -- Criar policies CRUD
  EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (public.user_has_store_access(%I))', 
    p_table_name, p_table_name, p_store_id_column);
  EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (public.user_has_store_access(%I))', 
    p_table_name, p_table_name, p_store_id_column);
  EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (public.user_has_store_access(%I)) WITH CHECK (public.user_has_store_access(%I))', 
    p_table_name, p_table_name, p_store_id_column, p_store_id_column);
  EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (public.user_has_store_access(%I))', 
    p_table_name, p_table_name, p_store_id_column);
  
  RAISE NOTICE '%: policies criadas com %', p_table_name, p_store_id_column;
END;
$$ LANGUAGE plpgsql;

-- ############################################################################
-- 1) STORE_SETTINGS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_settings') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_settings' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('store_settings', 'store_id');
  ELSE
    RAISE NOTICE 'store_settings: sem coluna store_id, pulando';
  END IF;
ELSE
  RAISE NOTICE 'store_settings: tabela não existe';
END IF;
END $$;

-- ############################################################################
-- 2) ADDON_GROUPS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addon_groups') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addon_groups' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('addon_groups', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 3) ADDONS (via addon_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addons') THEN
  ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "addons_all" ON public.addons;
  DROP POLICY IF EXISTS "addons_select" ON public.addons;
  DROP POLICY IF EXISTS "addons_insert" ON public.addons;
  DROP POLICY IF EXISTS "addons_update" ON public.addons;
  DROP POLICY IF EXISTS "addons_delete" ON public.addons;
  
  -- Verificar qual FK usar
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addons' AND column_name = 'addon_group_id') THEN
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
    RAISE NOTICE 'addons: policies via addon_group_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addons' AND column_name = 'group_id') THEN
    CREATE POLICY "addons_select" ON public.addons FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id))
    );
    CREATE POLICY "addons_insert" ON public.addons FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id))
    );
    CREATE POLICY "addons_update" ON public.addons FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id)));
    CREATE POLICY "addons_delete" ON public.addons FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id))
    );
    RAISE NOTICE 'addons: policies via group_id';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 4) PRODUCT_ADDON_GROUPS (via addon_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_addon_groups') THEN
  ALTER TABLE public.product_addon_groups ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "product_addon_groups_all" ON public.product_addon_groups;
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
-- 5) CASH_REGISTERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_registers') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_registers' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('cash_registers', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 6) CASH_MOVEMENTS (via cash_registers se não tiver store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_movements') THEN
  ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "cash_movements_all" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_select" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_insert" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_update" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_delete" ON public.cash_movements;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_movements' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('cash_movements', 'store_id');
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_movements' AND column_name = 'cash_register_id') THEN
    CREATE POLICY "cash_movements_select" ON public.cash_movements FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    CREATE POLICY "cash_movements_insert" ON public.cash_movements FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    CREATE POLICY "cash_movements_update" ON public.cash_movements FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)));
    CREATE POLICY "cash_movements_delete" ON public.cash_movements FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    RAISE NOTICE 'cash_movements: policies via cash_register_id';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 7) CASH_FLOW
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_flow') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_flow' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('cash_flow', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 8) DAILY_SUMMARY
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_summary') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_summary' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('daily_summary', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 9) EXPENSES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('expenses', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 10) FINANCIAL_CATEGORIES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_categories') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'financial_categories' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('financial_categories', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 11) RECEIVABLES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'receivables') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'receivables' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('receivables', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 12) INVENTORY_MOVEMENTS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_movements') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_movements' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('inventory_movements', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 13) INVENTORY_BATCHES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_batches') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_batches' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('inventory_batches', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 14) INVENTORY_COUNTS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_counts') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_counts' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('inventory_counts', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 15) INVENTORY_COUNT_ITEMS (via inventory_counts)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_count_items') THEN
  ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "inventory_count_items_all" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_select" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_insert" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_update" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_delete" ON public.inventory_count_items;
  
  CREATE POLICY "inventory_count_items_select" ON public.inventory_count_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  CREATE POLICY "inventory_count_items_insert" ON public.inventory_count_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  CREATE POLICY "inventory_count_items_update" ON public.inventory_count_items FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)));
  CREATE POLICY "inventory_count_items_delete" ON public.inventory_count_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  RAISE NOTICE 'inventory_count_items: policies criadas';
END IF;
END $$;

-- ############################################################################
-- 16) PURCHASE_ORDERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('purchase_orders', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 17) PURCHASE_ORDER_ITEMS (via purchase_orders)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
  ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "purchase_order_items_all" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_select" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_insert" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_update" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_delete" ON public.purchase_order_items;
  
  CREATE POLICY "purchase_order_items_select" ON public.purchase_order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  CREATE POLICY "purchase_order_items_insert" ON public.purchase_order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  CREATE POLICY "purchase_order_items_update" ON public.purchase_order_items FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)));
  CREATE POLICY "purchase_order_items_delete" ON public.purchase_order_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  RAISE NOTICE 'purchase_order_items: policies criadas';
END IF;
END $$;

-- ############################################################################
-- 18) SUPPLIERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('suppliers', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 19) PRODUCT_INGREDIENTS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_ingredients') THEN
  ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "product_ingredients_all" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_select" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_insert" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_update" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_delete" ON public.product_ingredients;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_ingredients' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('product_ingredients', 'store_id');
  ELSE
    CREATE POLICY "product_ingredients_select" ON public.product_ingredients FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    CREATE POLICY "product_ingredients_insert" ON public.product_ingredients FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    CREATE POLICY "product_ingredients_update" ON public.product_ingredients FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)));
    CREATE POLICY "product_ingredients_delete" ON public.product_ingredients FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    RAISE NOTICE 'product_ingredients: policies via products';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 20) PRODUCT_VARIATIONS (via products)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variations') THEN
  ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "product_variations_all" ON public.product_variations;
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
-- 21) COUPON_USES (INSERT público com restrição)
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
  
  -- SELECT/UPDATE/DELETE: via coupon -> store
  CREATE POLICY "coupon_uses_select" ON public.coupon_uses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );
  CREATE POLICY "coupon_uses_update" ON public.coupon_uses FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)));
  CREATE POLICY "coupon_uses_delete" ON public.coupon_uses FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );
  
  -- INSERT público: cupom deve existir e estar ativo em loja ativa
  CREATE POLICY "coupon_uses_public_insert" ON public.coupon_uses FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coupons c 
      JOIN public.stores s ON s.id = c.store_id
      WHERE c.id = coupon_uses.coupon_id 
        AND c.is_active = true 
        AND s.is_active = true
    )
  );
  RAISE NOTICE 'coupon_uses: policies corrigidas (INSERT público com validação)';
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
  CREATE POLICY "reservations_select" ON public.reservations FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "reservations_update" ON public.reservations FOR UPDATE 
    USING (public.user_has_store_access(store_id)) 
    WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "reservations_delete" ON public.reservations FOR DELETE USING (public.user_has_store_access(store_id));
  
  -- INSERT público: loja deve estar ativa
  CREATE POLICY "reservations_public_insert" ON public.reservations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = reservations.store_id AND s.is_active = true)
  );
  RAISE NOTICE 'reservations: policies corrigidas (INSERT público para lojas ativas)';
END IF;
END $$;

-- ############################################################################
-- LIMPEZA: Remover função auxiliar temporária
-- ############################################################################

DROP FUNCTION IF EXISTS _temp_create_store_policies(TEXT, TEXT);

-- ############################################################################
-- FIM
-- ############################################################################

DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS-REMAINDER-FIX-02 (SAFE) aplicado!';
  RAISE NOTICE 'Todas as verificações dinâmicas executadas';
  RAISE NOTICE '========================================';
END $$;
