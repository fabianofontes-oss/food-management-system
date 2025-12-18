-- ============================================================================
-- SISTEMA DE BILLING AUTOMATIZADO
-- Data: 2025-12-18
-- Descrição: Tabelas para faturas, pagamentos e automação de cobrança
-- ============================================================================

-- Enum para status da fatura
DO $$ BEGIN
  CREATE TYPE invoice_status_enum AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para método de pagamento
DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM ('pix', 'credit_card', 'boleto', 'debit_card', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABELA: invoices (Faturas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  
  -- Valores
  amount_cents INTEGER NOT NULL, -- Valor em centavos
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  
  -- Datas
  reference_month VARCHAR(7) NOT NULL, -- YYYY-MM
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Gateway de pagamento
  payment_gateway VARCHAR(50), -- 'mercadopago', 'stripe', etc
  gateway_invoice_id VARCHAR(255), -- ID no gateway
  gateway_payment_id VARCHAR(255), -- ID do pagamento no gateway
  payment_method VARCHAR(50),
  
  -- PIX
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expiration TIMESTAMP,
  
  -- Boleto
  boleto_url TEXT,
  boleto_barcode VARCHAR(50),
  boleto_expiration DATE,
  
  -- Metadados
  notes TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABELA: payment_history (Histórico de Pagamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Valores
  amount_cents INTEGER NOT NULL,
  
  -- Pagamento
  payment_method VARCHAR(50),
  gateway_payment_id VARCHAR(255),
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'approved', 'pending', 'rejected', 'refunded'
  gateway_status VARCHAR(100), -- Status original do gateway
  
  -- Dados do gateway
  gateway_response JSONB,
  
  -- Timestamps
  paid_at TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABELA: billing_config (Configurações de Billing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gateway padrão
  default_gateway VARCHAR(50) DEFAULT 'mercadopago',
  
  -- MercadoPago
  mp_access_token TEXT,
  mp_public_key TEXT,
  mp_webhook_secret TEXT,
  
  -- Stripe
  stripe_secret_key TEXT,
  stripe_public_key TEXT,
  stripe_webhook_secret TEXT,
  
  -- Configurações gerais
  trial_days INTEGER DEFAULT 7,
  grace_period_days INTEGER DEFAULT 3, -- Dias após vencimento antes de suspender
  auto_suspend_enabled BOOLEAN DEFAULT true,
  
  -- Notificações
  send_invoice_email BOOLEAN DEFAULT true,
  send_overdue_reminder BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Inserir configuração padrão se não existir
INSERT INTO billing_config (id, default_gateway, trial_days, grace_period_days)
SELECT gen_random_uuid(), 'mercadopago', 7, 3
WHERE NOT EXISTS (SELECT 1 FROM billing_config LIMIT 1);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_reference_month ON invoices(reference_month);
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice ON payment_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON payment_history(tenant_id);

-- ============================================================================
-- FUNÇÃO: Verificar inadimplentes e suspender automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void AS $$
DECLARE
  grace_days INTEGER;
  overdue_tenant RECORD;
BEGIN
  -- Buscar dias de carência
  SELECT grace_period_days INTO grace_days FROM billing_config LIMIT 1;
  IF grace_days IS NULL THEN grace_days := 3; END IF;
  
  -- Marcar faturas vencidas como 'overdue'
  UPDATE invoices
  SET status = 'overdue', updated_at = now()
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
  
  -- Suspender tenants com faturas vencidas além do período de carência
  FOR overdue_tenant IN
    SELECT DISTINCT i.tenant_id
    FROM invoices i
    WHERE i.status = 'overdue'
      AND i.due_date < (CURRENT_DATE - grace_days)
  LOOP
    UPDATE tenants
    SET status = 'suspended',
        suspended_at = now(),
        suspended_reason = 'Fatura vencida - suspensão automática'
    WHERE id = overdue_tenant.tenant_id
      AND status != 'suspended';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO: Verificar trials expirados
-- ============================================================================
CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE tenants
  SET status = 'suspended',
      suspended_at = now(),
      suspended_reason = 'Trial expirado'
  WHERE status = 'trial'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE invoices IS 'Faturas mensais dos tenants';
COMMENT ON TABLE payment_history IS 'Histórico de tentativas de pagamento';
COMMENT ON TABLE billing_config IS 'Configurações globais de billing';
COMMENT ON FUNCTION check_overdue_invoices() IS 'Verifica faturas vencidas e suspende inadimplentes';
COMMENT ON FUNCTION check_expired_trials() IS 'Verifica e suspende trials expirados';
