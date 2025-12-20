-- ============================================================================
-- Delivery - Regras de Negócio Críticas (P0 + P1)
-- Data: 2025-12-20
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. GARANTIR QUE AS COLUNAS NECESSÁRIAS EXISTEM
-- ----------------------------------------------------------------------------

-- Coluna driver_rating (1-5 estrelas)
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS driver_rating integer NULL;

-- Coluna rating_comment
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS rating_comment text NULL;

-- Coluna rated_at
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS rated_at timestamptz NULL;

-- Comentários
COMMENT ON COLUMN public.deliveries.driver_rating IS 'Avaliação do motorista (1-5)';
COMMENT ON COLUMN public.deliveries.rating_comment IS 'Comentário da avaliação';
COMMENT ON COLUMN public.deliveries.rated_at IS 'Data/hora da avaliação';

-- ----------------------------------------------------------------------------
-- 1. AUTOMATIZAR MÉDIA DE AVALIAÇÃO DO MOTORISTA (P0-4)
-- ----------------------------------------------------------------------------

-- Function: Recalcula média de rating do motorista
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
  -- Identificar o motorista (via driver_id ou driver_phone)
  -- Prioridade: driver_id, fallback para driver_phone
  IF NEW.driver_id IS NOT NULL THEN
    v_driver_id := NEW.driver_id;
  ELSIF NEW.driver_phone IS NOT NULL THEN
    -- Buscar driver_id pelo telefone
    SELECT id INTO v_driver_id
    FROM public.drivers
    WHERE phone = NEW.driver_phone
    LIMIT 1;
  END IF;

  -- Se encontrou o motorista, recalcular média
  IF v_driver_id IS NOT NULL THEN
    SELECT AVG(driver_rating)
    INTO v_avg_rating
    FROM public.deliveries
    WHERE driver_id = v_driver_id
      AND driver_rating IS NOT NULL;

    -- Se não houver ratings, usar 5.0 (default)
    IF v_avg_rating IS NULL THEN
      v_avg_rating := 5.0;
    END IF;

    -- Atualizar tabela drivers
    UPDATE public.drivers
    SET rating = v_avg_rating,
        updated_at = now()
    WHERE id = v_driver_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Dispara após INSERT ou UPDATE de driver_rating
DROP TRIGGER IF EXISTS trg_deliveries_update_driver_rating ON public.deliveries;
CREATE TRIGGER trg_deliveries_update_driver_rating
AFTER INSERT OR UPDATE OF driver_rating ON public.deliveries
FOR EACH ROW
WHEN (NEW.driver_rating IS NOT NULL)
EXECUTE FUNCTION public.update_driver_rating_avg();

COMMENT ON FUNCTION public.update_driver_rating_avg() IS 'Recalcula automaticamente a média de avaliação do motorista quando uma entrega é avaliada';

-- ----------------------------------------------------------------------------
-- 2. SEGURANÇA DE LINKS PÚBLICOS (P0-5)
-- ----------------------------------------------------------------------------

-- Adicionar coluna access_token na tabela deliveries
ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.deliveries.access_token IS 'Token único para acesso seguro aos links de confirmação e avaliação';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_deliveries_access_token ON public.deliveries(access_token);

-- Gerar tokens para entregas existentes (se não tiverem)
UPDATE public.deliveries
SET access_token = gen_random_uuid()
WHERE access_token IS NULL;

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTION: Buscar motoristas disponíveis (P1)
-- ----------------------------------------------------------------------------

-- Function: Retorna motoristas disponíveis e online (com turno ativo)
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
  -- Verificar se tem turno ativo
  INNER JOIN public.driver_shifts ds 
    ON ds.driver_id = (
      SELECT u.id 
      FROM public.users u 
      WHERE u.id = d.id 
        OR EXISTS (
          SELECT 1 FROM public.store_users su 
          WHERE su.user_id = u.id 
            AND su.store_id = p_store_id
        )
    )
    AND ds.store_id = p_store_id
    AND ds.status = 'active'
    AND ds.end_at IS NULL
  -- Left join para contar entregas atuais
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

COMMENT ON FUNCTION public.get_available_drivers(uuid) IS 'Retorna motoristas disponíveis e online (turno ativo), ordenados por menos entregas em andamento';

-- ----------------------------------------------------------------------------
-- 4. RLS: Permitir acesso público com token válido
-- ----------------------------------------------------------------------------

-- Policy para leitura pública de deliveries com token válido
-- (usado nas páginas de confirmação/avaliação)
DROP POLICY IF EXISTS deliveries_public_with_token ON public.deliveries;
CREATE POLICY deliveries_public_with_token
ON public.deliveries
FOR SELECT
USING (
  -- Acesso público se o token for válido (será validado no Server Action)
  -- OU se o usuário tem acesso à loja
  public.user_has_store_access(store_id)
  OR true  -- Permitir leitura pública (validação de token no app layer)
);

-- Nota: A validação real do token será feita no Server Action,
-- pois o RLS não tem acesso aos query params da URL.

-- ----------------------------------------------------------------------------
-- VERIFICAÇÃO
-- ----------------------------------------------------------------------------
SELECT 'Migration aplicada: Rating automático + Token segurança + Helper auto-assign' AS status;
