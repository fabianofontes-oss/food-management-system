-- Migração: Controle de Caixa (PDV)
-- Data: 2025-12-18

-- Tabela de sessões de caixa
CREATE TABLE IF NOT EXISTS cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_register_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'deposit')),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  attendant TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cash_sessions_store ON cash_register_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_register_sessions(store_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_date ON cash_register_sessions(store_id, opened_at);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(cash_session_id);

-- RLS Policies
ALTER TABLE cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver/gerenciar sessões da própria loja
CREATE POLICY "cash_sessions_store_access" ON cash_register_sessions
  FOR ALL USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cash_movements_store_access" ON cash_movements
  FOR ALL USING (
    cash_session_id IN (
      SELECT id FROM cash_register_sessions WHERE store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_cash_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cash_session_updated
  BEFORE UPDATE ON cash_register_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_session_timestamp();

-- Função para atualizar vendas na sessão de caixa
CREATE OR REPLACE FUNCTION update_cash_session_on_order()
RETURNS TRIGGER AS $$
DECLARE
  active_session UUID;
BEGIN
  -- Encontrar sessão ativa da loja
  SELECT id INTO active_session
  FROM cash_register_sessions
  WHERE store_id = NEW.store_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  IF active_session IS NOT NULL THEN
    -- Atualizar valores baseado no método de pagamento
    IF NEW.payment_method = 'cash' THEN
      UPDATE cash_register_sessions
      SET cash_sales = cash_sales + NEW.total_amount
      WHERE id = active_session;
    ELSIF NEW.payment_method IN ('credit_card', 'debit_card', 'card') THEN
      UPDATE cash_register_sessions
      SET card_sales = card_sales + NEW.total_amount
      WHERE id = active_session;
    ELSIF NEW.payment_method = 'pix' THEN
      UPDATE cash_register_sessions
      SET pix_sales = pix_sales + NEW.total_amount
      WHERE id = active_session;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_updates_cash_session
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION update_cash_session_on_order();

COMMENT ON TABLE cash_register_sessions IS 'Sessões de caixa do PDV';
COMMENT ON TABLE cash_movements IS 'Movimentações de caixa (sangria/suprimento)';
