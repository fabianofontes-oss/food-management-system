-- Migration: Create RPC for secure public order tracking
-- Date: 2026-01-02
-- Purpose: Allow public access to order status with token validation (no PII exposure)

CREATE OR REPLACE FUNCTION public.get_public_order(
  p_slug TEXT,
  p_code TEXT,
  p_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_order RECORD;
  v_items JSONB;
  v_events JSONB;
BEGIN
  -- Validate inputs
  IF p_slug IS NULL OR p_code IS NULL OR p_token IS NULL THEN
    RAISE EXCEPTION 'Parâmetros obrigatórios: slug, code, token';
  END IF;

  -- Get store_id by slug
  SELECT id INTO v_store_id
  FROM public.stores
  WHERE slug = p_slug AND is_active = true
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Loja não encontrada';
  END IF;

  -- Get order with token validation
  SELECT
    o.id,
    o.code,
    o.status,
    o.channel,
    o.payment_method,
    o.subtotal_amount,
    o.discount_amount,
    o.delivery_fee,
    o.total_amount,
    o.notes,
    o.created_at,
    o.updated_at,
    -- SANITIZED customer data (no PII)
    CASE 
      WHEN c.name IS NOT NULL THEN substring(c.name, 1, 1) || '***'
      ELSE 'Cliente'
    END as customer_name,
    -- Partial phone: (11) ****-4321
    CASE
      WHEN c.phone IS NOT NULL AND length(c.phone) >= 4 THEN 
        substring(c.phone, 1, GREATEST(0, length(c.phone) - 4)) || '****' || substring(c.phone, length(c.phone) - 3, 4)
      ELSE '***'
    END as customer_phone_partial,
    -- Address only for delivery (city/state only)
    CASE
      WHEN o.channel = 'DELIVERY' AND da.city IS NOT NULL THEN
        da.city || ' - ' || da.state
      ELSE NULL
    END as delivery_location
  INTO v_order
  FROM public.orders o
  LEFT JOIN public.customers c ON c.id = o.customer_id
  LEFT JOIN public.customer_addresses da ON da.id = o.delivery_address_id
  WHERE o.store_id = v_store_id
    AND o.code = p_code
    AND o.public_token = p_token
  LIMIT 1;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado ou token inválido';
  END IF;

  -- Get order items (sanitized)
  SELECT jsonb_agg(
    jsonb_build_object(
      'title', oi.title_snapshot,
      'quantity', oi.quantity,
      'unit_type', oi.unit_type,
      'weight', oi.weight,
      'subtotal', oi.subtotal,
      'modifiers', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', oim.name_snapshot,
            'extra_price', oim.extra_price
          )
        )
        FROM public.order_item_modifiers oim
        WHERE oim.order_item_id = oi.id
      )
    )
  ) INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  -- Get order events (public timeline)
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', oe.type,
      'message', oe.message,
      'created_at', oe.created_at
    ) ORDER BY oe.created_at ASC
  ) INTO v_events
  FROM public.order_events oe
  WHERE oe.order_id = v_order.id;

  -- Return sanitized order data
  RETURN jsonb_build_object(
    'code', v_order.code,
    'status', v_order.status,
    'channel', v_order.channel,
    'payment_method', v_order.payment_method,
    'subtotal_amount', v_order.subtotal_amount,
    'discount_amount', v_order.discount_amount,
    'delivery_fee', v_order.delivery_fee,
    'total_amount', v_order.total_amount,
    'notes', v_order.notes,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'customer_name', v_order.customer_name,
    'customer_phone_partial', v_order.customer_phone_partial,
    'delivery_location', v_order.delivery_location,
    'items', COALESCE(v_items, '[]'::jsonb),
    'events', COALESCE(v_events, '[]'::jsonb)
  );
END;
$$;

-- Grant execute to anon and authenticated
REVOKE ALL ON FUNCTION public.get_public_order(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(TEXT, TEXT, UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_order IS 'Retorna pedido público sanitizado (sem PII completo) validando token UUID';
