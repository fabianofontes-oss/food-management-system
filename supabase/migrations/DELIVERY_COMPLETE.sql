-- ============================================================================
-- DELIVERY MODULE - MIGRATION COMPLETA
-- Data: 2025-12-20
-- Execute este arquivo ÚNICO no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. COLUNAS ADICIONAIS NA TABELA DRIVERS (tabela já existe)
-- ============================================================================

ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS photo_url text NULL;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS commission_percent integer DEFAULT 10;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS total_earnings decimal(10,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_drivers_store ON public.drivers(store_id);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.drivers(phone);

-- ============================================================================
-- 2. COLUNAS ADICIONAIS NA TABELA DELIVERIES (tabela já existe)
-- ============================================================================

-- Comprovação
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS proof_photo_url text NULL;

-- Avaliação
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS driver_rating integer NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS rating_comment text NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS rated_at timestamptz NULL;

-- Confirmação do cliente
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamptz NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS confirmation_code text NULL;

-- Localização GPS
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS driver_latitude double precision NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS driver_longitude double precision NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS driver_location_updated_at timestamptz NULL;

-- Assinatura digital
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS customer_signature_url text NULL;

-- Timeout/Recusa
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS timeout_at timestamptz NULL;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS refusal_reason text NULL;

-- Token de segurança para links públicos
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_deliveries_store ON public.deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_access_token ON public.deliveries(access_token);

-- ============================================================================
-- 3. TABELA DELIVERY_SETTINGS (Configurações por loja)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.delivery_settings (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  delivery_mode text NOT NULL DEFAULT 'internal' CHECK (delivery_mode IN ('internal', 'hybrid')),
  require_proof_photo boolean NOT NULL DEFAULT true,
  auto_assign_orders boolean NOT NULL DEFAULT false,
  delivery_fee_type text NOT NULL DEFAULT 'fixed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.delivery_settings IS 'Configurações do módulo de delivery por loja (1:1)';
COMMENT ON COLUMN public.delivery_settings.delivery_mode IS 'internal | hybrid';
COMMENT ON COLUMN public.delivery_settings.require_proof_photo IS 'Se true, exige foto para finalizar';
COMMENT ON COLUMN public.delivery_settings.auto_assign_orders IS 'Se true, atribui pedidos automaticamente';
COMMENT ON COLUMN public.delivery_settings.delivery_fee_type IS 'fixed | distance';

-- ============================================================================
-- 4. TABELA DRIVER_SHIFTS (Turnos dos motoristas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.driver_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_shifts_store_status ON public.driver_shifts(store_id, status);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_status ON public.driver_shifts(driver_id, status);

COMMENT ON TABLE public.driver_shifts IS 'Turnos de motoristas. status=active significa online';

-- ============================================================================
-- 5. TRIGGERS DE UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS trg_drivers_updated_at ON public.drivers;
CREATE TRIGGER trg_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER trg_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_delivery_settings_updated_at ON public.delivery_settings;
CREATE TRIGGER trg_delivery_settings_updated_at
BEFORE UPDATE ON public.delivery_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_driver_shifts_updated_at ON public.driver_shifts;
CREATE TRIGGER trg_driver_shifts_updated_at
BEFORE UPDATE ON public.driver_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. FUNCTION: Recalcula média de rating do motorista
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_driver_rating_avg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id uuid;
  v_avg_rating numeric;
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    v_driver_id := NEW.driver_id;
  ELSIF NEW.driver_phone IS NOT NULL THEN
    SELECT id INTO v_driver_id
    FROM public.drivers
    WHERE phone = NEW.driver_phone
    LIMIT 1;
  END IF;

  IF v_driver_id IS NOT NULL THEN
    SELECT AVG(driver_rating)
    INTO v_avg_rating
    FROM public.deliveries
    WHERE driver_id = v_driver_id
      AND driver_rating IS NOT NULL;

    IF v_avg_rating IS NULL THEN
      v_avg_rating := 5.0;
    END IF;

    UPDATE public.drivers
    SET rating = v_avg_rating,
        updated_at = now()
    WHERE id = v_driver_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger de rating automático
DROP TRIGGER IF EXISTS trg_deliveries_update_driver_rating ON public.deliveries;
CREATE TRIGGER trg_deliveries_update_driver_rating
AFTER INSERT OR UPDATE OF driver_rating ON public.deliveries
FOR EACH ROW
WHEN (NEW.driver_rating IS NOT NULL)
EXECUTE FUNCTION public.update_driver_rating_avg();

COMMENT ON FUNCTION public.update_driver_rating_avg() IS 'Recalcula média de rating do motorista automaticamente';

-- ============================================================================
-- 7. FUNCTION: Helper para verificar role na loja
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_store_role(p_store_id uuid, p_role public.user_role_enum)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
      AND su.role = p_role
  ) INTO v_has_role;

  RETURN COALESCE(v_has_role, false);
END;
$$;

-- ============================================================================
-- 8. FUNCTION: Buscar motoristas disponíveis (para auto-atribuição)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_available_drivers(p_store_id uuid)
RETURNS TABLE (
  driver_id uuid,
  driver_name text,
  driver_phone text,
  current_deliveries_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id AS driver_id,
    d.name AS driver_name,
    d.phone AS driver_phone,
    COUNT(del.id) FILTER (WHERE del.status IN ('assigned', 'picked_up', 'in_transit')) AS current_deliveries_count
  FROM public.drivers d
  LEFT JOIN public.deliveries del 
    ON del.driver_id = d.id 
    AND del.status IN ('assigned', 'picked_up', 'in_transit')
  WHERE d.store_id = p_store_id
    AND d.is_available = true
    AND d.is_active = true
  GROUP BY d.id, d.name, d.phone
  ORDER BY current_deliveries_count ASC, d.rating DESC
  LIMIT 10;
$$;

COMMENT ON FUNCTION public.get_available_drivers(uuid) IS 'Retorna motoristas disponíveis ordenados por menos entregas em andamento';

-- ============================================================================
-- 9. FUNCTION: Exigir foto de comprovação ao finalizar
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_delivery_proof_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_require_photo boolean;
  v_proof_url text;
BEGIN
  IF NEW.status = 'DELIVERED' AND (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT ds.require_proof_photo
    INTO v_require_photo
    FROM public.delivery_settings ds
    WHERE ds.store_id = NEW.store_id;

    IF v_require_photo IS NULL THEN
      v_require_photo := true;
    END IF;

    IF v_require_photo THEN
      SELECT d.proof_photo_url
      INTO v_proof_url
      FROM public.deliveries d
      WHERE d.order_id = NEW.id
      LIMIT 1;

      IF v_proof_url IS NULL THEN
        RAISE EXCEPTION 'A foto de comprovação é obrigatória para finalizar a entrega.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_require_proof_photo ON public.orders;
CREATE TRIGGER trg_orders_require_proof_photo
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_delivery_proof_photo();

-- ============================================================================
-- 10. RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;

-- Drivers: acesso por loja
DROP POLICY IF EXISTS drivers_store_access ON public.drivers;
CREATE POLICY drivers_store_access ON public.drivers
FOR ALL USING (public.user_has_store_access(store_id));

-- Deliveries: acesso por loja OU público (validação de token no app)
DROP POLICY IF EXISTS deliveries_store_access ON public.deliveries;
CREATE POLICY deliveries_store_access ON public.deliveries
FOR ALL USING (public.user_has_store_access(store_id) OR true);

-- Delivery Settings: acesso por loja
DROP POLICY IF EXISTS delivery_settings_select ON public.delivery_settings;
CREATE POLICY delivery_settings_select ON public.delivery_settings
FOR SELECT USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS delivery_settings_insert ON public.delivery_settings;
CREATE POLICY delivery_settings_insert ON public.delivery_settings
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS delivery_settings_update ON public.delivery_settings;
CREATE POLICY delivery_settings_update ON public.delivery_settings
FOR UPDATE USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

-- Driver Shifts: motorista vê os seus, owner/manager vê todos
DROP POLICY IF EXISTS driver_shifts_select ON public.driver_shifts;
CREATE POLICY driver_shifts_select ON public.driver_shifts
FOR SELECT USING (
  driver_id = auth.uid()
  OR public.user_has_store_role(store_id, 'OWNER')
  OR public.user_has_store_role(store_id, 'MANAGER')
);

DROP POLICY IF EXISTS driver_shifts_insert ON public.driver_shifts;
CREATE POLICY driver_shifts_insert ON public.driver_shifts
FOR INSERT WITH CHECK (
  driver_id = auth.uid()
  AND public.user_has_store_access(store_id)
);

DROP POLICY IF EXISTS driver_shifts_update ON public.driver_shifts;
CREATE POLICY driver_shifts_update ON public.driver_shifts
FOR UPDATE USING (
  driver_id = auth.uid()
  OR public.user_has_store_role(store_id, 'OWNER')
  OR public.user_has_store_role(store_id, 'MANAGER')
);

-- ============================================================================
-- 11. SEED: Configurações para lojas existentes
-- ============================================================================

INSERT INTO public.delivery_settings (store_id)
SELECT s.id
FROM public.stores s
LEFT JOIN public.delivery_settings ds ON ds.store_id = s.id
WHERE ds.store_id IS NULL
ON CONFLICT DO NOTHING;

-- Gerar tokens para entregas existentes
UPDATE public.deliveries
SET access_token = gen_random_uuid()
WHERE access_token IS NULL;

-- Gerar códigos de confirmação
UPDATE public.deliveries 
SET confirmation_code = UPPER(SUBSTRING(id::text, 1, 8))
WHERE confirmation_code IS NULL;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT 'DELIVERY MODULE: Migration completa aplicada com sucesso!' AS status;
