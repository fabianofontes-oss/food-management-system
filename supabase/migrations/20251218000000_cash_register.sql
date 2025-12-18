-- Migração: Controle de Caixa (PDV)
-- Data: 2025-12-18

-- ============================================================================
-- 1. CRIAR TABELAS
-- ============================================================================

-- Tabela de sessões de caixa
CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  attendant TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(10,2),
  expected_balance DECIMAL(10,2),
  difference DECIMAL(10,2),
  cash_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  card_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  pix_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  withdrawals DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposits DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de movimentações de caixa (sangria/suprimento)
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES public.cash_register_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'deposit')),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  attendant TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cash_sessions_store ON public.cash_register_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_register_sessions(store_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_date ON public.cash_register_sessions(store_id, opened_at);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(cash_session_id);

-- ============================================================================
-- 3. RLS - Usando a função user_has_store_access do sistema
-- ============================================================================
ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- Sessões de caixa: SELECT para membros da loja
DROP POLICY IF EXISTS cash_sessions_select ON public.cash_register_sessions;
CREATE POLICY cash_sessions_select ON public.cash_register_sessions
  FOR SELECT USING (public.user_has_store_access(store_id));

-- Sessões de caixa: INSERT para membros da loja
DROP POLICY IF EXISTS cash_sessions_insert ON public.cash_register_sessions;
CREATE POLICY cash_sessions_insert ON public.cash_register_sessions
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

-- Sessões de caixa: UPDATE para membros da loja
DROP POLICY IF EXISTS cash_sessions_update ON public.cash_register_sessions;
CREATE POLICY cash_sessions_update ON public.cash_register_sessions
  FOR UPDATE USING (public.user_has_store_access(store_id));

-- Movimentações: SELECT
DROP POLICY IF EXISTS cash_movements_select ON public.cash_movements;
CREATE POLICY cash_movements_select ON public.cash_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cash_register_sessions s 
      WHERE s.id = cash_session_id AND public.user_has_store_access(s.store_id)
    )
  );

-- Movimentações: INSERT
DROP POLICY IF EXISTS cash_movements_insert ON public.cash_movements;
CREATE POLICY cash_movements_insert ON public.cash_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cash_register_sessions s 
      WHERE s.id = cash_session_id AND public.user_has_store_access(s.store_id)
    )
  );

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_cash_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cash_session_updated ON public.cash_register_sessions;
CREATE TRIGGER trigger_cash_session_updated
  BEFORE UPDATE ON public.cash_register_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cash_session_timestamp();

-- ============================================================================
-- 5. FUNÇÃO PARA ATUALIZAR VENDAS (SECURITY DEFINER para bypass RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_cash_session_on_order()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_session UUID;
BEGIN
  SELECT id INTO active_session
  FROM public.cash_register_sessions
  WHERE store_id = NEW.store_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  IF active_session IS NOT NULL THEN
    IF NEW.payment_method = 'cash' THEN
      UPDATE public.cash_register_sessions
      SET cash_sales = cash_sales + NEW.total_amount
      WHERE id = active_session;
    ELSIF NEW.payment_method IN ('credit_card', 'debit_card', 'card') THEN
      UPDATE public.cash_register_sessions
      SET card_sales = card_sales + NEW.total_amount
      WHERE id = active_session;
    ELSIF NEW.payment_method = 'pix' THEN
      UPDATE public.cash_register_sessions
      SET pix_sales = pix_sales + NEW.total_amount
      WHERE id = active_session;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_updates_cash_session ON public.orders;
CREATE TRIGGER trigger_order_updates_cash_session
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.update_cash_session_on_order();

-- ============================================================================
-- 6. COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.cash_register_sessions IS 'Sessões de caixa do PDV';
COMMENT ON TABLE public.cash_movements IS 'Movimentações de caixa (sangria/suprimento)';
