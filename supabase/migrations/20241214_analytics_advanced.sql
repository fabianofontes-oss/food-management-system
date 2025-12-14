-- Migração: Analytics Avançado
-- Tabelas e funções para métricas avançadas

-- =============================================
-- TABELA: Métricas Diárias (cache)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Pedidos
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  -- Receita
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  discounts_given DECIMAL(10,2) DEFAULT 0,
  delivery_fees DECIMAL(10,2) DEFAULT 0,
  
  -- Ticket
  average_ticket DECIMAL(10,2) DEFAULT 0,
  max_ticket DECIMAL(10,2) DEFAULT 0,
  min_ticket DECIMAL(10,2) DEFAULT 0,
  
  -- Clientes
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  
  -- Tempo
  avg_preparation_time INTEGER DEFAULT 0,
  avg_delivery_time INTEGER DEFAULT 0,
  
  -- Canais
  orders_delivery INTEGER DEFAULT 0,
  orders_pickup INTEGER DEFAULT 0,
  orders_dine_in INTEGER DEFAULT 0,
  orders_online INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, date)
);

-- =============================================
-- TABELA: Métricas de Produtos
-- =============================================
CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  date DATE NOT NULL,
  
  quantity_sold INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  
  avg_rating DECIMAL(3,2) DEFAULT 0,
  times_in_cart INTEGER DEFAULT 0,
  times_purchased INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, product_id, date)
);

-- =============================================
-- TABELA: Métricas de Clientes
-- =============================================
CREATE TABLE IF NOT EXISTS customer_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_phone TEXT,
  
  -- Totais
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  
  -- Datas
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  days_since_last_order INTEGER DEFAULT 0,
  
  -- Frequência
  orders_per_month DECIMAL(5,2) DEFAULT 0,
  avg_days_between_orders INTEGER DEFAULT 0,
  
  -- LTV
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  predicted_ltv DECIMAL(12,2) DEFAULT 0,
  
  -- Segmentação
  segment TEXT DEFAULT 'new',
  risk_of_churn DECIMAL(5,2) DEFAULT 0,
  
  -- Preferências
  favorite_products JSONB DEFAULT '[]',
  favorite_payment_method TEXT,
  favorite_channel TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, customer_phone)
);

-- Segments: new, active, loyal, vip, at_risk, churned

-- =============================================
-- TABELA: Métricas por Hora
-- =============================================
CREATE TABLE IF NOT EXISTS hourly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,
  
  orders INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  avg_preparation_time INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, date, hour)
);

-- =============================================
-- TABELA: Métricas de Funcionários
-- =============================================
CREATE TABLE IF NOT EXISTS staff_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID,
  staff_name TEXT,
  role TEXT,
  date DATE NOT NULL,
  
  -- Garçons
  orders_taken INTEGER DEFAULT 0,
  tables_served INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  tips_received DECIMAL(10,2) DEFAULT 0,
  avg_ticket DECIMAL(10,2) DEFAULT 0,
  
  -- Entregadores
  deliveries_completed INTEGER DEFAULT 0,
  delivery_time_avg INTEGER DEFAULT 0,
  distance_traveled DECIMAL(10,2) DEFAULT 0,
  
  -- Cozinha
  orders_prepared INTEGER DEFAULT 0,
  preparation_time_avg INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, user_id, date)
);

-- =============================================
-- TABELA: Previsões
-- =============================================
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  
  predicted_orders INTEGER,
  predicted_revenue DECIMAL(12,2),
  confidence_low DECIMAL(12,2),
  confidence_high DECIMAL(12,2),
  
  -- Fatores considerados
  day_of_week INTEGER,
  is_holiday BOOLEAN DEFAULT FALSE,
  weather_factor DECIMAL(3,2) DEFAULT 1.0,
  event_factor DECIMAL(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, forecast_date)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_daily_metrics_store_date ON daily_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_product_metrics_store_date ON product_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_store ON customer_metrics(store_id);
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_store_date ON hourly_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_metrics_store_date ON staff_metrics(store_id, date);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_metrics_all" ON daily_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "product_metrics_all" ON product_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "customer_metrics_all" ON customer_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "hourly_metrics_all" ON hourly_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "staff_metrics_all" ON staff_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "forecasts_all" ON sales_forecasts FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular métricas diárias
CREATE OR REPLACE FUNCTION calculate_daily_metrics(p_store_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_metrics RECORD;
BEGIN
  SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
    COALESCE(SUM(total_amount), 0) as gross_revenue,
    COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as net_revenue,
    COALESCE(SUM(discount_amount), 0) as discounts_given,
    COALESCE(SUM(delivery_fee), 0) as delivery_fees,
    COALESCE(AVG(total_amount), 0) as average_ticket,
    COALESCE(MAX(total_amount), 0) as max_ticket,
    COALESCE(MIN(total_amount), 0) as min_ticket,
    COUNT(DISTINCT customer_phone) as unique_customers,
    COUNT(*) FILTER (WHERE channel = 'delivery') as orders_delivery,
    COUNT(*) FILTER (WHERE channel = 'pickup') as orders_pickup,
    COUNT(*) FILTER (WHERE channel = 'dine_in') as orders_dine_in,
    COUNT(*) FILTER (WHERE channel = 'online') as orders_online
  INTO v_metrics
  FROM orders
  WHERE store_id = p_store_id
    AND DATE(created_at) = p_date;

  INSERT INTO daily_metrics (
    store_id, date, total_orders, completed_orders, cancelled_orders,
    gross_revenue, net_revenue, discounts_given, delivery_fees,
    average_ticket, max_ticket, min_ticket, unique_customers,
    orders_delivery, orders_pickup, orders_dine_in, orders_online
  ) VALUES (
    p_store_id, p_date, v_metrics.total_orders, v_metrics.completed_orders, v_metrics.cancelled_orders,
    v_metrics.gross_revenue, v_metrics.net_revenue, v_metrics.discounts_given, v_metrics.delivery_fees,
    v_metrics.average_ticket, v_metrics.max_ticket, v_metrics.min_ticket, v_metrics.unique_customers,
    v_metrics.orders_delivery, v_metrics.orders_pickup, v_metrics.orders_dine_in, v_metrics.orders_online
  )
  ON CONFLICT (store_id, date) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    completed_orders = EXCLUDED.completed_orders,
    cancelled_orders = EXCLUDED.cancelled_orders,
    gross_revenue = EXCLUDED.gross_revenue,
    net_revenue = EXCLUDED.net_revenue,
    discounts_given = EXCLUDED.discounts_given,
    delivery_fees = EXCLUDED.delivery_fees,
    average_ticket = EXCLUDED.average_ticket,
    max_ticket = EXCLUDED.max_ticket,
    min_ticket = EXCLUDED.min_ticket,
    unique_customers = EXCLUDED.unique_customers,
    orders_delivery = EXCLUDED.orders_delivery,
    orders_pickup = EXCLUDED.orders_pickup,
    orders_dine_in = EXCLUDED.orders_dine_in,
    orders_online = EXCLUDED.orders_online,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para calcular LTV do cliente
CREATE OR REPLACE FUNCTION calculate_customer_ltv(p_store_id UUID, p_customer_phone TEXT)
RETURNS DECIMAL AS $$
DECLARE
  v_total_spent DECIMAL;
  v_months_active DECIMAL;
  v_orders_per_month DECIMAL;
  v_avg_ticket DECIMAL;
BEGIN
  SELECT 
    COALESCE(SUM(total_amount), 0),
    GREATEST(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / (30 * 24 * 60 * 60), 1),
    COUNT(*)::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / (30 * 24 * 60 * 60), 1),
    COALESCE(AVG(total_amount), 0)
  INTO v_total_spent, v_months_active, v_orders_per_month, v_avg_ticket
  FROM orders
  WHERE store_id = p_store_id AND customer_phone = p_customer_phone;
  
  -- LTV = Ticket médio * Pedidos por mês * 12 meses
  RETURN v_avg_ticket * v_orders_per_month * 12;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar previsão de vendas
CREATE OR REPLACE FUNCTION generate_sales_forecast(p_store_id UUID, p_days_ahead INTEGER DEFAULT 7)
RETURNS VOID AS $$
DECLARE
  v_date DATE;
  v_day_of_week INTEGER;
  v_avg_orders DECIMAL;
  v_avg_revenue DECIMAL;
  v_std_dev DECIMAL;
BEGIN
  FOR i IN 1..p_days_ahead LOOP
    v_date := CURRENT_DATE + i;
    v_day_of_week := EXTRACT(DOW FROM v_date)::INTEGER;
    
    -- Calcular média e desvio padrão baseado no mesmo dia da semana
    SELECT 
      COALESCE(AVG(total_orders), 0),
      COALESCE(AVG(gross_revenue), 0),
      COALESCE(STDDEV(gross_revenue), 0)
    INTO v_avg_orders, v_avg_revenue, v_std_dev
    FROM daily_metrics
    WHERE store_id = p_store_id
      AND EXTRACT(DOW FROM date) = v_day_of_week
      AND date >= CURRENT_DATE - 90;
    
    INSERT INTO sales_forecasts (
      store_id, forecast_date, predicted_orders, predicted_revenue,
      confidence_low, confidence_high, day_of_week
    ) VALUES (
      p_store_id, v_date, v_avg_orders::INTEGER, v_avg_revenue,
      GREATEST(v_avg_revenue - v_std_dev * 1.96, 0),
      v_avg_revenue + v_std_dev * 1.96,
      v_day_of_week
    )
    ON CONFLICT (store_id, forecast_date) DO UPDATE SET
      predicted_orders = EXCLUDED.predicted_orders,
      predicted_revenue = EXCLUDED.predicted_revenue,
      confidence_low = EXCLUDED.confidence_low,
      confidence_high = EXCLUDED.confidence_high;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para segmentar clientes
CREATE OR REPLACE FUNCTION segment_customer(p_orders INTEGER, p_days_since_last INTEGER, p_total_spent DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF p_orders = 0 OR p_days_since_last > 90 THEN
    RETURN 'churned';
  ELSIF p_days_since_last > 60 THEN
    RETURN 'at_risk';
  ELSIF p_orders >= 10 AND p_total_spent >= 1000 THEN
    RETURN 'vip';
  ELSIF p_orders >= 5 THEN
    RETURN 'loyal';
  ELSIF p_orders >= 2 THEN
    RETURN 'active';
  ELSE
    RETURN 'new';
  END IF;
END;
$$ LANGUAGE plpgsql;
