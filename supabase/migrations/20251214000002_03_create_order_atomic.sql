CREATE OR REPLACE FUNCTION public.create_order_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_store_id uuid;
  v_idempotency_key uuid;
  v_existing record;
  v_order_id uuid;
  v_order_code text;
  v_channel order_channel_enum;
  v_payment_method payment_method_enum;
  v_subtotal numeric;
  v_discount numeric;
  v_delivery_fee numeric;
  v_total numeric;
  v_notes text;
  v_customer jsonb;
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_customer_id uuid;
  v_delivery_address jsonb;
  v_delivery_address_id uuid;
  v_item jsonb;
  v_order_item_id uuid;
  v_modifier jsonb;
  v_created_by uuid;
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

  v_subtotal := coalesce((p_payload->>'subtotal_amount')::numeric, 0);
  v_discount := coalesce((p_payload->>'discount_amount')::numeric, 0);
  v_delivery_fee := coalesce((p_payload->>'delivery_fee')::numeric, 0);
  v_total := coalesce((p_payload->>'total_amount')::numeric, 0);
  v_notes := nullif(p_payload->>'notes', '');

  v_customer := p_payload->'customer';
  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'customer is required';
  END IF;

  v_customer_phone := nullif(v_customer->>'phone', '');
  IF v_customer_phone IS NULL THEN
    RAISE EXCEPTION 'customer.phone is required';
  END IF;

  v_customer_name := nullif(v_customer->>'name', '');
  v_customer_email := nullif(v_customer->>'email', '');

  -- best-effort: capture auth user id if present
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

  -- Delivery address (only if provided)
  v_delivery_address := p_payload->'delivery_address';
  v_delivery_address_id := NULL;

  IF v_delivery_address IS NOT NULL AND jsonb_typeof(v_delivery_address) = 'object' THEN
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
    v_delivery_address_id,
    v_notes,
    v_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- Items
  IF jsonb_typeof(p_payload->'items') <> 'array' THEN
    RAISE EXCEPTION 'items must be an array';
  END IF;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_payload->'items')
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
      (v_item->>'product_id')::uuid,
      v_item->>'title_snapshot',
      coalesce((v_item->>'unit_price')::numeric, 0),
      coalesce((v_item->>'quantity')::int, 1),
      coalesce((v_item->>'unit_type')::product_unit_type_enum, 'unit'::product_unit_type_enum),
      nullif(v_item->>'weight', '')::numeric,
      coalesce((v_item->>'subtotal')::numeric, 0)
    )
    RETURNING id INTO v_order_item_id;

    IF jsonb_typeof(v_item->'modifiers') = 'array' THEN
      FOR v_modifier IN
        SELECT * FROM jsonb_array_elements(v_item->'modifiers')
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
          coalesce((v_modifier->>'extra_price')::numeric, 0)
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
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: another transaction created the order with same (store_id, idempotency_key)
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

    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb) TO anon, authenticated;
