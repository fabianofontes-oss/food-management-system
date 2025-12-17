-- =============================================================
-- SEED DETERMINÍSTICO PARA TESTES E2E
-- 
-- Este seed cria dados específicos para os testes Playwright.
-- IDs são fixos para garantir determinismo nos testes.
-- =============================================================

-- IDs fixos para testes E2E
-- Tenant E2E
DO $$
DECLARE
  v_tenant_id UUID := 'e2e00000-0000-0000-0000-000000000001';
  v_store_a_id UUID := 'e2e00000-0000-0000-0000-000000000010';
  v_store_b_id UUID := 'e2e00000-0000-0000-0000-000000000020';
  v_cat_a_id UUID := 'e2e00000-0000-0000-0000-000000000100';
  v_cat_b_id UUID := 'e2e00000-0000-0000-0000-000000000200';
  v_prod_a1_id UUID := 'e2e00000-0000-0000-0000-000000001001';
  v_prod_a2_id UUID := 'e2e00000-0000-0000-0000-000000001002';
  v_prod_b1_id UUID := 'e2e00000-0000-0000-0000-000000002001';
BEGIN
  -- =============================================================
  -- 1. TENANT E2E
  -- =============================================================
  INSERT INTO tenants (id, name, country, language, currency, timezone)
  VALUES (v_tenant_id, 'E2E Test Tenant', 'BR', 'pt-BR', 'BRL', 'America/Sao_Paulo')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- =============================================================
  -- 2. STORE A - Com agendamento habilitado
  -- Horários configurados para estar "fechada" em horário de teste (madrugada)
  -- =============================================================
  INSERT INTO stores (
    id, 
    tenant_id, 
    name, 
    slug, 
    niche, 
    mode, 
    is_active,
    scheduling_enabled,
    scheduling_min_hours,
    scheduling_max_days,
    scheduling_interval,
    settings
  ) VALUES (
    v_store_a_id,
    v_tenant_id,
    'E2E Loja Agendamento',
    'e2e-loja-agendamento',
    'burger',
    'store',
    true,
    true,  -- scheduling_enabled = true
    2,     -- min_hours = 2
    7,     -- max_days = 7
    30,    -- interval = 30 min
    jsonb_build_object(
      'businessHours', jsonb_build_array(
        jsonb_build_object('day', 'monday', 'name', 'Seg', 'enabled', true, 'open', '10:00', 'close', '22:00'),
        jsonb_build_object('day', 'tuesday', 'name', 'Ter', 'enabled', true, 'open', '10:00', 'close', '22:00'),
        jsonb_build_object('day', 'wednesday', 'name', 'Qua', 'enabled', true, 'open', '10:00', 'close', '22:00'),
        jsonb_build_object('day', 'thursday', 'name', 'Qui', 'enabled', true, 'open', '10:00', 'close', '22:00'),
        jsonb_build_object('day', 'friday', 'name', 'Sex', 'enabled', true, 'open', '10:00', 'close', '23:00'),
        jsonb_build_object('day', 'saturday', 'name', 'Sáb', 'enabled', true, 'open', '10:00', 'close', '23:00'),
        jsonb_build_object('day', 'sunday', 'name', 'Dom', 'enabled', true, 'open', '12:00', 'close', '20:00')
      ),
      'sales', jsonb_build_object(
        'delivery', jsonb_build_object('enabled', true, 'fee', 5, 'minOrder', 20, 'radius', 10),
        'pickup', jsonb_build_object('enabled', true, 'time', 20)
      ),
      'payments', jsonb_build_object(
        'cash', true,
        'pix', jsonb_build_object('enabled', true)
      ),
      'checkout', jsonb_build_object('mode', 'guest')
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    scheduling_enabled = EXCLUDED.scheduling_enabled,
    settings = EXCLUDED.settings;

  -- =============================================================
  -- 3. STORE B - Sem agendamento (para teste multi-store)
  -- =============================================================
  INSERT INTO stores (
    id, 
    tenant_id, 
    name, 
    slug, 
    niche, 
    mode, 
    is_active,
    scheduling_enabled,
    settings
  ) VALUES (
    v_store_b_id,
    v_tenant_id,
    'E2E Loja Secundária',
    'e2e-loja-secundaria',
    'acai',
    'store',
    true,
    false, -- scheduling_enabled = false
    jsonb_build_object(
      'businessHours', jsonb_build_array(
        jsonb_build_object('day', 'monday', 'name', 'Seg', 'enabled', true, 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'tuesday', 'name', 'Ter', 'enabled', true, 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'wednesday', 'name', 'Qua', 'enabled', true, 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'thursday', 'name', 'Qui', 'enabled', true, 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'friday', 'name', 'Sex', 'enabled', true, 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'saturday', 'name', 'Sáb', 'enabled', true, 'open', '08:00', 'close', '22:00'),
        jsonb_build_object('day', 'sunday', 'name', 'Dom', 'enabled', false, 'open', '08:00', 'close', '22:00')
      ),
      'checkout', jsonb_build_object('mode', 'guest')
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings;

  -- =============================================================
  -- 4. CATEGORIAS
  -- =============================================================
  INSERT INTO categories (id, store_id, name, sort_order, is_active)
  VALUES 
    (v_cat_a_id, v_store_a_id, 'Lanches E2E', 1, true),
    (v_cat_b_id, v_store_b_id, 'Açaís E2E', 1, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active;

  -- =============================================================
  -- 5. PRODUTOS
  -- =============================================================
  -- Produtos para Store A
  INSERT INTO products (id, store_id, category_id, name, description, base_price, unit_type, is_active)
  VALUES 
    (v_prod_a1_id, v_store_a_id, v_cat_a_id, 'X-Burguer E2E', 'Hambúrguer de teste para E2E', 25.90, 'unit', true),
    (v_prod_a2_id, v_store_a_id, v_cat_a_id, 'X-Salada E2E', 'Hambúrguer com salada para E2E', 28.90, 'unit', true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    is_active = EXCLUDED.is_active;

  -- Produtos para Store B
  INSERT INTO products (id, store_id, category_id, name, description, base_price, unit_type, is_active)
  VALUES 
    (v_prod_b1_id, v_store_b_id, v_cat_b_id, 'Açaí 500ml E2E', 'Açaí de teste para E2E', 22.00, 'unit', true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    is_active = EXCLUDED.is_active;

  RAISE NOTICE 'Seed E2E executado com sucesso!';
  RAISE NOTICE 'Store A (agendamento): e2e-loja-agendamento';
  RAISE NOTICE 'Store B (secundária): e2e-loja-secundaria';
END $$;
