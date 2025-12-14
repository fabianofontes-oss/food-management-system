-- MÓDULO FINANCEIRO COMPLETO
-- Contas a Pagar, Receber, Categorias, DRE

-- ============================================
-- CATEGORIAS DE DESPESA/RECEITA
-- ============================================
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- expense = despesa, income = receita
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  is_fixed BOOLEAN DEFAULT false, -- Se é custo fixo (aluguel, salário)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir categorias padrão
-- (será feito via seed ou primeira execução)

-- ============================================
-- CONTAS A PAGAR (DESPESAS)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES financial_categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type VARCHAR(20), -- daily, weekly, monthly, yearly
  recurrence_end_date DATE,
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  
  notes TEXT,
  attachment_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTAS A RECEBER
-- ============================================
CREATE TABLE IF NOT EXISTS receivables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES financial_categories(id),
  
  -- Pode ser vinculado a um pedido ou cliente
  order_id UUID REFERENCES orders(id),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FLUXO DE CAIXA (CONSOLIDADO)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_flow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- income, expense
  category_id UUID REFERENCES financial_categories(id),
  
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  -- Referências opcionais
  order_id UUID REFERENCES orders(id),
  expense_id UUID REFERENCES expenses(id),
  receivable_id UUID REFERENCES receivables(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAIXA REGISTRADORA
-- ============================================
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  opened_by UUID REFERENCES auth.users(id),
  opened_by_name VARCHAR(100),
  closed_by UUID REFERENCES auth.users(id),
  closed_by_name VARCHAR(100),
  
  opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(12,2),
  expected_amount DECIMAL(12,2),
  difference DECIMAL(12,2),
  
  status VARCHAR(20) DEFAULT 'open', -- open, closed
  
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOVIMENTAÇÕES DE CAIXA
-- ============================================
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  register_id UUID REFERENCES cash_registers(id),
  
  type VARCHAR(20) NOT NULL, -- sale, withdrawal, deposit, adjustment
  amount DECIMAL(12,2) NOT NULL,
  
  description VARCHAR(200),
  payment_method VARCHAR(50),
  
  -- Referências opcionais
  order_id UUID REFERENCES orders(id),
  
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESUMO DIÁRIO (CACHE PARA PERFORMANCE)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  
  -- Vendas
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0, -- CMV
  gross_profit DECIMAL(12,2) DEFAULT 0,
  
  -- Por forma de pagamento
  cash_amount DECIMAL(12,2) DEFAULT 0,
  card_amount DECIMAL(12,2) DEFAULT 0,
  pix_amount DECIMAL(12,2) DEFAULT 0,
  other_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Despesas do dia
  total_expenses DECIMAL(12,2) DEFAULT 0,
  
  -- Lucro líquido
  net_profit DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, date)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_financial_categories_store ON financial_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_store ON expenses(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_receivables_store ON receivables(store_id);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(store_id, date);
CREATE INDEX IF NOT EXISTS idx_cash_registers_store ON cash_registers(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON cash_movements(register_id);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary(store_id, date);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "financial_categories_all" ON financial_categories;
DROP POLICY IF EXISTS "expenses_all" ON expenses;
DROP POLICY IF EXISTS "receivables_all" ON receivables;
DROP POLICY IF EXISTS "cash_flow_all" ON cash_flow;
DROP POLICY IF EXISTS "cash_registers_all" ON cash_registers;
DROP POLICY IF EXISTS "cash_movements_all" ON cash_movements;
DROP POLICY IF EXISTS "daily_summary_all" ON daily_summary;

CREATE POLICY "financial_categories_all" ON financial_categories FOR ALL USING (true);
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true);
CREATE POLICY "receivables_all" ON receivables FOR ALL USING (true);
CREATE POLICY "cash_flow_all" ON cash_flow FOR ALL USING (true);
CREATE POLICY "cash_registers_all" ON cash_registers FOR ALL USING (true);
CREATE POLICY "cash_movements_all" ON cash_movements FOR ALL USING (true);
CREATE POLICY "daily_summary_all" ON daily_summary FOR ALL USING (true);
