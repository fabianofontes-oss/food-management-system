-- COMANDO 02: create_order_atomic produção (pricing + estoque atômicos)

-- Permitir estoque fracionado (necessário para produtos por peso)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity numeric(10,3);

ALTER TABLE public.products
ALTER COLUMN stock_quantity TYPE numeric(10,3)
USING stock_quantity::numeric;

CREATE OR REPLACE FUNCTION public.create_order_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
  v_idempotency_key uuid;
  v_existing record;

  v_order_id uuid;
  v_order_code text;
  v_channel order_channel_enum;
  v_payment_method payment_method_enum;

  v_customer jsonb;
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_customer_id uuid;

  v_delivery_address jsonb;
  v_delivery_address_id uuid;

  v_discount numeric;
  v_delivery_fee numeric;
  v_subtotal numeric;
  v_total numeric;
  v_notes text;

  v_coupon_code text;
  v_coupon record;
  v_coupon_id uuid;

  v_store_delivery_fee numeric;
  v_store_enable_coupons boolean;

  v_items_prepared jsonb := '[]'::jsonb;
  v_item jsonb;

  v_product record;
  v_product_id uuid;
  v_quantity int;
  v_unit_type product_unit_type_enum;
  v_weight numeric;
  v_needed numeric;
  v_unit_price numeric;
  v_base_amount numeric;
  v_mods_total numeric;
  v_item_subtotal numeric;
  v_item_mods jsonb;

  v_group_counts jsonb;
  v_group_id uuid;
  v_group_count int;
  v_required_min int;

  v_modifier jsonb;
  v_mod record;
  v_modifier_option_id uuid;
  v_is_allowed boolean;

  v_created_by uuid;
  v_prepared jsonb;
  v_order_item_id uuid;
BEGIN
  IF p_payload IS NULL THEN
    RAISE EXCEPTION 'payload is required';
  END IF;

  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_idempotency_key := nullif(p_payload->>'idempotency_key', '')::uuid;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id is required';
  END IF;

  IF v_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'idempotency_key is required';
  END IF;

  -- Store deve existir e estar ativa
  PERFORM 1 FROM public.stores s WHERE s.id = v_store_id AND s.is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'store_id inválido ou loja inativa';
  END IF;

  -- Serializa por (store_id, idempotency_key) para evitar efeitos colaterais duplicados
  PERFORM pg_advisory_xact_lock(hashtextextended(v_store_id::text || ':' || v_idempotency_key::text, 0));

  SELECT id, code
    INTO v_existing
    FROM public.orders
   WHERE store_id = v_store_id
     AND idempotency_key = v_idempotency_key
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'order_id', v_existing.id,
      'code', v_existing.code,
      'idempotent', true
    );
  END IF;

  v_channel := (p_payload->>'channel')::order_channel_enum;
  v_payment_method := (p_payload->>'payment_method')::payment_method_enum;
  v_notes := nullif(p_payload->>'notes', '');

  IF v_channel IS NULL THEN
    RAISE EXCEPTION 'channel is required';
  END IF;

  IF v_payment_method IS NULL THEN
    RAISE EXCEPTION 'payment_method is required';
  END IF;

  v_coupon_code := nullif(p_payload->>'coupon_code', '');
  v_discount := 0;
  v_coupon_id := NULL;

  v_customer := p_payload->'customer';
  IF v_customer IS NULL OR jsonb_typeof(v_customer) <> 'object' THEN
    RAISE EXCEPTION 'customer is required';
  END IF;

  v_customer_phone := nullif(v_customer->>'phone', '');
  IF v_customer_phone IS NULL THEN
    RAISE EXCEPTION 'customer.phone is required';
  END IF;

  v_customer_name := nullif(v_customer->>'name', '');
  v_customer_email := nullif(v_customer->>'email', '');

  v_created_by := auth.uid();

  -- Customer upsert by (store_id, phone)
  SELECT id
    INTO v_customer_id
    FROM public.customers
   WHERE store_id = v_store_id
     AND phone = v_customer_phone
   LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, name, phone, email)
    VALUES (
      v_store_id,
      coalesce(v_customer_name, 'Cliente'),
      v_customer_phone,
      v_customer_email
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- Delivery fee vem do banco (não confiar no client)
  IF v_channel = 'DELIVERY' THEN
    SELECT ss.delivery_fee, ss.enable_coupons
      INTO v_store_delivery_fee, v_store_enable_coupons
      FROM public.store_settings ss
     WHERE ss.store_id = v_store_id
     LIMIT 1;

    v_delivery_fee := coalesce(v_store_delivery_fee, 0);
  ELSE
    SELECT ss.enable_coupons
      INTO v_store_enable_coupons
      FROM public.store_settings ss
     WHERE ss.store_id = v_store_id
     LIMIT 1;
    v_delivery_fee := 0;
  END IF;

  v_store_enable_coupons := coalesce(v_store_enable_coupons, true);

  -- Endereço de entrega (obrigatório para delivery)
  v_delivery_address_id := NULL;
  v_delivery_address := p_payload->'delivery_address';

  IF v_channel = 'DELIVERY' THEN
    IF v_delivery_address IS NULL OR jsonb_typeof(v_delivery_address) <> 'object' THEN
      RAISE EXCEPTION 'delivery_address is required for DELIVERY';
    END IF;

    INSERT INTO public.customer_addresses (
      customer_id,
      street,
      number,
      complement,
      district,
      city,
      state,
      zip_code,
      reference
    )
    VALUES (
      v_customer_id,
      v_delivery_address->>'street',
      v_delivery_address->>'number',
      nullif(v_delivery_address->>'complement', ''),
      v_delivery_address->>'district',
      v_delivery_address->>'city',
      v_delivery_address->>'state',
      v_delivery_address->>'zip_code',
      nullif(v_delivery_address->>'reference', '')
    )
    RETURNING id INTO v_delivery_address_id;
  END IF;

  -- Items (pricing + estoque) - atômico e concorrente
  v_subtotal := 0;

  IF jsonb_typeof(p_payload->'items') <> 'array' THEN
    RAISE EXCEPTION 'items must be an array';
  END IF;

  IF jsonb_array_length(p_payload->'items') = 0 THEN
    RAISE EXCEPTION 'items must not be empty';
  END IF;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'item.product_id is required';
    END IF;

    v_unit_type := coalesce((v_item->>'unit_type')::product_unit_type_enum, 'unit'::product_unit_type_enum);

    v_quantity := coalesce(nullif(v_item->>'quantity', '')::int, 1);
    v_weight := nullif(v_item->>'weight', '')::numeric;

    -- Lock do produto para concorrência
    SELECT p.id, p.store_id, p.name, p.base_price, p.price_per_unit, p.unit_type, p.stock_quantity, p.is_active
      INTO v_product
      FROM public.products p
     WHERE p.id = v_product_id
       AND p.store_id = v_store_id
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto não encontrado (product_id=%)', v_product_id;
    END IF;

    IF v_product.is_active IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Produto inativo (product_id=%)', v_product_id;
    END IF;

    IF v_product.unit_type <> v_unit_type THEN
      RAISE EXCEPTION 'unit_type inválido para product_id=% (esperado=%)', v_product_id, v_product.unit_type;
    END IF;

    IF v_unit_type = 'weight' THEN
      IF v_weight IS NULL OR v_weight <= 0 THEN
        RAISE EXCEPTION 'weight é obrigatório e deve ser > 0 (product_id=%)', v_product_id;
      END IF;

      IF v_product.price_per_unit IS NULL THEN
        RAISE EXCEPTION 'price_per_unit é obrigatório para produto por peso (product_id=%)', v_product_id;
      END IF;

      v_unit_price := v_product.price_per_unit;
      v_needed := v_weight;
      v_base_amount := v_unit_price * v_weight;
    ELSE
      IF v_quantity <= 0 THEN
        RAISE EXCEPTION 'quantity deve ser > 0 (product_id=%)', v_product_id;
      END IF;

      v_unit_price := v_product.base_price;
      v_needed := v_quantity;
      v_base_amount := v_unit_price * v_quantity;
    END IF;

    -- Débito de estoque (somente se stock_quantity NÃO for NULL)
    IF v_product.stock_quantity IS NOT NULL THEN
      UPDATE public.products p
         SET stock_quantity = p.stock_quantity - v_needed
       WHERE p.id = v_product_id
         AND p.store_id = v_store_id
         AND p.stock_quantity IS NOT NULL
         AND p.stock_quantity >= v_needed;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'out_of_stock';
      END IF;
    END IF;

    -- Modificadores (validar existência, store, ativo e permitido no produto)
    v_mods_total := 0;
    v_item_mods := '[]'::jsonb;
    v_group_counts := '{}'::jsonb;

    IF jsonb_typeof(v_item->'modifiers') = 'array' THEN
      FOR v_modifier IN
        SELECT * FROM jsonb_array_elements(v_item->'modifiers')
      LOOP
        v_modifier_option_id := nullif(v_modifier->>'modifier_option_id', '')::uuid;
        IF v_modifier_option_id IS NULL THEN
          RAISE EXCEPTION 'modifier_option_id é obrigatório';
        END IF;

        SELECT mo.id, mo.name, mo.extra_price, mo.is_active,
               mg.id AS group_id, mg.store_id, mg.applies_to_all_products,
               mg.min_quantity, mg.max_quantity, mg.required
          INTO v_mod
          FROM public.modifier_options mo
          JOIN public.modifier_groups mg ON mg.id = mo.group_id
         WHERE mo.id = v_modifier_option_id
         LIMIT 1;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Modifier option não existe (id=%)', v_modifier_option_id;
        END IF;

        IF v_mod.store_id <> v_store_id THEN
          RAISE EXCEPTION 'Modifier option não pertence à store (id=%)', v_modifier_option_id;
        END IF;

        IF v_mod.is_active IS DISTINCT FROM true THEN
          RAISE EXCEPTION 'Modifier option inativo (id=%)', v_modifier_option_id;
        END IF;

        IF v_mod.applies_to_all_products IS DISTINCT FROM true THEN
          SELECT EXISTS (
            SELECT 1
              FROM public.product_modifier_groups pmg
             WHERE pmg.product_id = v_product_id
               AND pmg.group_id = v_mod.group_id
          )
          INTO v_is_allowed;

          IF v_is_allowed IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'Modifier option % não permitido para product_id=%', v_modifier_option_id, v_product_id;
          END IF;
        END IF;

        v_mods_total := v_mods_total + v_mod.extra_price;

        v_group_id := v_mod.group_id;
        v_group_count := coalesce(nullif(v_group_counts->>v_group_id::text, '')::int, 0) + 1;
        IF v_group_count > v_mod.max_quantity THEN
          RAISE EXCEPTION 'Quantidade de modificadores excede max_quantity (group_id=%)', v_group_id;
        END IF;
        v_group_counts := jsonb_set(v_group_counts, ARRAY[v_group_id::text], to_jsonb(v_group_count), true);

        v_item_mods := v_item_mods || jsonb_build_array(
          jsonb_build_object(
            'modifier_option_id', v_mod.id,
            'name_snapshot', v_mod.name,
            'extra_price', v_mod.extra_price
          )
        );
      END LOOP;
    END IF;

    -- Validar grupos obrigatórios/min/max para o produto
    FOR v_mod IN
      SELECT mg.id, mg.min_quantity, mg.max_quantity, mg.required
        FROM public.modifier_groups mg
       WHERE mg.store_id = v_store_id
         AND (mg.applies_to_all_products = true OR EXISTS (
           SELECT 1 FROM public.product_modifier_groups pmg
            WHERE pmg.product_id = v_product_id
              AND pmg.group_id = mg.id
         ))
    LOOP
      v_group_id := v_mod.id;
      v_group_count := coalesce(nullif(v_group_counts->>v_group_id::text, '')::int, 0);
      v_required_min := CASE
        WHEN v_mod.required IS DISTINCT FROM true THEN v_mod.min_quantity
        WHEN v_mod.min_quantity IS NULL OR v_mod.min_quantity = 0 THEN 1
        ELSE v_mod.min_quantity
      END;

      IF v_group_count < v_required_min THEN
        RAISE EXCEPTION 'Grupo de modificadores obrigatório não atendido (group_id=%)', v_group_id;
      END IF;

      IF v_group_count > v_mod.max_quantity THEN
        RAISE EXCEPTION 'Grupo de modificadores excede max_quantity (group_id=%)', v_group_id;
      END IF;
    END LOOP;

    v_item_subtotal := v_base_amount + (v_mods_total * CASE WHEN v_unit_type = 'weight' THEN 1 ELSE v_quantity END);
    v_subtotal := v_subtotal + v_item_subtotal;

    v_items_prepared := v_items_prepared || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product_id,
        'title_snapshot', v_product.name,
        'unit_price', v_unit_price,
        'quantity', CASE WHEN v_unit_type = 'weight' THEN 1 ELSE v_quantity END,
        'unit_type', v_unit_type,
        'weight', CASE WHEN v_unit_type = 'weight' THEN v_weight ELSE NULL END,
        'subtotal', v_item_subtotal,
        'modifiers', v_item_mods
      )
    );
  END LOOP;

  -- Cupom: aplicar SOMENTE com base no banco (não confiar em desconto do client)
  IF v_coupon_code IS NOT NULL THEN
    IF v_store_enable_coupons IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Cupons desabilitados para esta loja';
    END IF;

    SELECT c.*
      INTO v_coupon
      FROM public.coupons c
     WHERE c.store_id = v_store_id
       AND upper(c.code) = upper(v_coupon_code)
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom não encontrado';
    END IF;

    IF v_coupon.is_active IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Cupom inativo';
    END IF;

    IF v_coupon.valid_from IS NOT NULL AND now() < v_coupon.valid_from THEN
      RAISE EXCEPTION 'Cupom ainda não está válido';
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
      RAISE EXCEPTION 'Cupom expirado';
    END IF;

    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Cupom atingiu o limite de uso';
    END IF;

    IF v_coupon.min_order_amount IS NOT NULL AND v_subtotal < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'Subtotal não atinge o mínimo do cupom';
    END IF;

    IF v_coupon.discount_type::text = 'percent' THEN
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100), 2);
    ELSE
      v_discount := least(v_coupon.discount_value, v_subtotal);
    END IF;

    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_discount := least(v_discount, v_coupon.max_discount_amount);
    END IF;

    v_discount := greatest(0, least(v_discount, v_subtotal));
    v_coupon_id := v_coupon.id;

    UPDATE public.coupons
       SET usage_count = usage_count + 1
     WHERE id = v_coupon_id;
  END IF;

  IF v_discount > v_subtotal THEN
    RAISE EXCEPTION 'discount_amount excede subtotal';
  END IF;

  v_total := greatest(0, (v_subtotal - v_discount) + v_delivery_fee);

  v_order_code := public.generate_order_code('A');

  INSERT INTO public.orders (
    store_id,
    customer_id,
    code,
    channel,
    status,
    subtotal_amount,
    discount_amount,
    delivery_fee,
    total_amount,
    payment_method,
    coupon_id,
    delivery_address_id,
    notes,
    idempotency_key
  )
  VALUES (
    v_store_id,
    v_customer_id,
    v_order_code,
    v_channel,
    'PENDING',
    v_subtotal,
    v_discount,
    v_delivery_fee,
    v_total,
    v_payment_method,
    v_coupon_id,
    v_delivery_address_id,
    v_notes,
    v_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- Persistir snapshots calculados
  FOR v_prepared IN
    SELECT * FROM jsonb_array_elements(v_items_prepared)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      title_snapshot,
      unit_price,
      quantity,
      unit_type,
      weight,
      subtotal
    )
    VALUES (
      v_order_id,
      (v_prepared->>'product_id')::uuid,
      v_prepared->>'title_snapshot',
      (v_prepared->>'unit_price')::numeric,
      (v_prepared->>'quantity')::int,
      (v_prepared->>'unit_type')::product_unit_type_enum,
      nullif(v_prepared->>'weight', '')::numeric,
      (v_prepared->>'subtotal')::numeric
    )
    RETURNING id INTO v_order_item_id;

    IF jsonb_typeof(v_prepared->'modifiers') = 'array' THEN
      FOR v_modifier IN
        SELECT * FROM jsonb_array_elements(v_prepared->'modifiers')
      LOOP
        INSERT INTO public.order_item_modifiers (
          order_item_id,
          modifier_option_id,
          name_snapshot,
          extra_price
        )
        VALUES (
          v_order_item_id,
          (v_modifier->>'modifier_option_id')::uuid,
          v_modifier->>'name_snapshot',
          (v_modifier->>'extra_price')::numeric
        );
      END LOOP;
    END IF;
  END LOOP;

  INSERT INTO public.order_events (order_id, type, message, created_by)
  VALUES (v_order_id, 'CREATED', 'Pedido criado', v_created_by);

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'code', v_order_code,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb) TO anon, authenticated;
