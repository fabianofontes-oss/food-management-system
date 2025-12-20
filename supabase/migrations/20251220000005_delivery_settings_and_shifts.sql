-- ============================================================================
-- Delivery (Logística Interna) - Configurações e Turnos
-- Data: 2025-12-20
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A) delivery_settings (1:1 com stores)
-- ----------------------------------------------------------------------------

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
COMMENT ON COLUMN public.delivery_settings.delivery_mode IS 'internal | hybrid (sem integrações externas por enquanto)';
COMMENT ON COLUMN public.delivery_settings.require_proof_photo IS 'Se true, exige foto de comprovação para finalizar (DELIVERED)';
COMMENT ON COLUMN public.delivery_settings.auto_assign_orders IS 'Se true, sistema tenta atribuir pedidos automaticamente';
COMMENT ON COLUMN public.delivery_settings.delivery_fee_type IS 'fixed | distance (futuro)';

-- Garantir updated_at
DROP TRIGGER IF EXISTS trg_delivery_settings_updated_at ON public.delivery_settings;
CREATE TRIGGER trg_delivery_settings_updated_at
BEFORE UPDATE ON public.delivery_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed para lojas existentes
INSERT INTO public.delivery_settings (store_id)
SELECT s.id
FROM public.stores s
LEFT JOIN public.delivery_settings ds ON ds.store_id = s.id
WHERE ds.store_id IS NULL;

-- RLS
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS delivery_settings_select ON public.delivery_settings;
CREATE POLICY delivery_settings_select
ON public.delivery_settings
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS delivery_settings_insert ON public.delivery_settings;
CREATE POLICY delivery_settings_insert
ON public.delivery_settings
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS delivery_settings_update ON public.delivery_settings;
CREATE POLICY delivery_settings_update
ON public.delivery_settings
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

-- ----------------------------------------------------------------------------
-- Helpers de role (evita recursão de RLS pois é SECURITY DEFINER)
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- B) driver_shifts (turnos do estafeta)
-- ----------------------------------------------------------------------------

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

COMMENT ON TABLE public.driver_shifts IS 'Turnos de motoristas/estafetas. Um motorista online tem shift status=active';

CREATE INDEX IF NOT EXISTS idx_driver_shifts_store_status ON public.driver_shifts(store_id, status);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_status ON public.driver_shifts(driver_id, status);

-- Garantir updated_at
DROP TRIGGER IF EXISTS trg_driver_shifts_updated_at ON public.driver_shifts;
CREATE TRIGGER trg_driver_shifts_updated_at
BEFORE UPDATE ON public.driver_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;

-- SELECT: motorista vê os seus, owner/manager vê todos da loja
DROP POLICY IF EXISTS driver_shifts_select ON public.driver_shifts;
CREATE POLICY driver_shifts_select
ON public.driver_shifts
FOR SELECT
USING (
  driver_id = auth.uid()
  OR public.user_has_store_role(store_id, 'OWNER')
  OR public.user_has_store_role(store_id, 'MANAGER')
);

-- INSERT: motorista só cria turno para si e numa loja onde tem acesso
DROP POLICY IF EXISTS driver_shifts_insert ON public.driver_shifts;
CREATE POLICY driver_shifts_insert
ON public.driver_shifts
FOR INSERT
WITH CHECK (
  driver_id = auth.uid()
  AND public.user_has_store_access(store_id)
);

-- UPDATE: motorista só atualiza o seu; owner/manager pode gerir
DROP POLICY IF EXISTS driver_shifts_update ON public.driver_shifts;
CREATE POLICY driver_shifts_update
ON public.driver_shifts
FOR UPDATE
USING (
  driver_id = auth.uid()
  OR public.user_has_store_role(store_id, 'OWNER')
  OR public.user_has_store_role(store_id, 'MANAGER')
)
WITH CHECK (
  driver_id = auth.uid()
  OR public.user_has_store_role(store_id, 'OWNER')
  OR public.user_has_store_role(store_id, 'MANAGER')
);

-- ----------------------------------------------------------------------------
-- C) Trigger de segurança: exigir prova de foto ao finalizar (orders -> DELIVERED)
-- ----------------------------------------------------------------------------

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
  -- Só valida quando o status da encomenda muda para DELIVERED
  IF NEW.status = 'DELIVERED' AND (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Buscar setting. Se não existir, default é true (mais seguro)
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
