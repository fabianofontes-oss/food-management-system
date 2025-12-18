-- SISTEMA DE ENCOMENDAS E AGENDAMENTO
-- Funciona para: Salgados, Doces, Marmitas, Bolos, etc.

-- ============================================
-- CONFIGURAÇÕES DE AGENDAMENTO DA LOJA
-- ============================================
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_enabled BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_min_hours INTEGER DEFAULT 4; -- Antecedência mínima em horas
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_max_days INTEGER DEFAULT 7; -- Máximo de dias no futuro
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_interval INTEGER DEFAULT 30; -- Intervalo em minutos (15, 30, 60)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_require_payment BOOLEAN DEFAULT false; -- Exigir pagamento antecipado
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_max_per_slot INTEGER DEFAULT 0; -- Máx pedidos por horário (0 = ilimitado)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_use_store_hours BOOLEAN DEFAULT true; -- Usar horário da loja ou customizado
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_custom_hours JSONB; -- Horários customizados para agendamento
-- Ex: {"mon": {"start": "08:00", "end": "18:00"}, "sat": {"start": "09:00", "end": "14:00"}, "sun": null}

-- Tabela para slots bloqueados ou com capacidade específica
CREATE TABLE IF NOT EXISTS scheduling_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  max_orders INTEGER DEFAULT 5,
  current_orders INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  block_reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_scheduling_slots_date ON scheduling_slots(store_id, slot_date);
ALTER TABLE scheduling_slots ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scheduling_slots_all') THEN
    CREATE POLICY "scheduling_slots_all" ON scheduling_slots FOR ALL USING (true);
  END IF;
END $$;

-- Adicionar campos de agendamento nos pedidos normais
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;

-- ============================================
-- CONFIGURAÇÃO DE PRODUTOS PARA ENCOMENDA
-- ============================================

-- Adicionar campos de encomenda nos produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'ready'; 
-- ready = pronta entrega, order = sob encomenda, both = ambos

ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1;
-- Quantidade mínima para encomenda (ex: 50 unidades)

ALTER TABLE products ADD COLUMN IF NOT EXISTS max_daily_quantity INTEGER;
-- Capacidade máxima de produção por dia

ALTER TABLE products ADD COLUMN IF NOT EXISTS advance_days INTEGER DEFAULT 0;
-- Dias de antecedência mínima (ex: 2 dias antes)

ALTER TABLE products ADD COLUMN IF NOT EXISTS allows_customization BOOLEAN DEFAULT false;
-- Se permite personalização (sabor, recheio, etc)

-- ============================================
-- KITS / COMBOS CONFIGURÁVEIS
-- Ex: "Cento de Salgados" onde cliente escolhe tipos
-- ============================================
CREATE TABLE IF NOT EXISTS product_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Cento de Salgados Mistos"
  description TEXT,
  base_quantity INTEGER NOT NULL DEFAULT 100, -- Ex: 100 unidades
  min_varieties INTEGER DEFAULT 1, -- Mínimo de tipos diferentes
  max_varieties INTEGER DEFAULT 10, -- Máximo de tipos
  min_per_variety INTEGER DEFAULT 10, -- Mínimo por tipo (ex: 10 de cada)
  base_price DECIMAL(10,2) NOT NULL,
  price_per_extra DECIMAL(10,2) DEFAULT 0, -- Preço por unidade extra
  advance_days INTEGER DEFAULT 2,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos que fazem parte do kit
CREATE TABLE IF NOT EXISTS product_kit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID NOT NULL REFERENCES product_kits(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  default_quantity INTEGER DEFAULT 0, -- Quantidade padrão sugerida
  max_quantity INTEGER, -- Máximo deste item no kit
  extra_price DECIMAL(10,2) DEFAULT 0, -- Valor extra por este item
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OPÇÕES DE PERSONALIZAÇÃO
-- Ex: Sabores, Recheios, Temas, Tamanhos
-- ============================================
CREATE TABLE IF NOT EXISTS customization_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Sabores", "Recheios", "Temas"
  type VARCHAR(20) DEFAULT 'single', -- single = escolhe 1, multiple = vários
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customization_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Chocolate", "Morango", "Frozen"
  extra_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vincular personalização a produtos
CREATE TABLE IF NOT EXISTS product_customization_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, group_id)
);

-- ============================================
-- ENCOMENDAS
-- ============================================
CREATE TABLE IF NOT EXISTS custom_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number SERIAL,
  
  -- Dados do cliente
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Data/hora
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  
  -- Entrega
  delivery_type VARCHAR(20) DEFAULT 'pickup', -- pickup = retirada, delivery = entrega
  delivery_address TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Valores
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Pagamento
  deposit_amount DECIMAL(12,2) DEFAULT 0, -- Valor do sinal
  deposit_paid BOOLEAN DEFAULT false,
  deposit_paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- pending = aguardando confirmação
  -- confirmed = confirmado
  -- in_production = em produção
  -- ready = pronto
  -- delivered = entregue
  -- cancelled = cancelado
  
  notes TEXT,
  internal_notes TEXT, -- Notas internas (só lojista vê)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da encomenda
CREATE TABLE IF NOT EXISTS custom_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
  
  -- Pode ser produto ou kit
  product_id UUID REFERENCES products(id),
  kit_id UUID REFERENCES product_kits(id),
  
  name VARCHAR(200) NOT NULL, -- Nome do item (cache)
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Personalizações escolhidas (JSON)
  customizations JSONB,
  -- Ex: {"sabor": "Chocolate", "recheio": "Brigadeiro", "tema": "Frozen"}
  
  -- Se for kit, detalhes dos itens escolhidos
  kit_details JSONB,
  -- Ex: [{"product": "Coxinha", "quantity": 40}, {"product": "Esfiha", "quantity": 60}]
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CALENDÁRIO DE PRODUÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS production_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Capacidade
  max_orders INTEGER DEFAULT 10, -- Máximo de pedidos no dia
  current_orders INTEGER DEFAULT 0, -- Pedidos atuais
  
  -- Bloqueio
  is_blocked BOOLEAN DEFAULT false, -- Dia bloqueado (folga, feriado)
  block_reason VARCHAR(100),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_kits_store ON product_kits(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_store ON custom_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_date ON custom_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_calendar_date ON production_calendar(store_id, date);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_calendar ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_kits_all') THEN
    CREATE POLICY "product_kits_all" ON product_kits FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_kit_items_all') THEN
    CREATE POLICY "product_kit_items_all" ON product_kit_items FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'customization_groups_all') THEN
    CREATE POLICY "customization_groups_all" ON customization_groups FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'customization_options_all') THEN
    CREATE POLICY "customization_options_all" ON customization_options FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_customization_groups_all') THEN
    CREATE POLICY "product_customization_groups_all" ON product_customization_groups FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'custom_orders_all') THEN
    CREATE POLICY "custom_orders_all" ON custom_orders FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'custom_order_items_all') THEN
    CREATE POLICY "custom_order_items_all" ON custom_order_items FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'production_calendar_all') THEN
    CREATE POLICY "production_calendar_all" ON production_calendar FOR ALL USING (true);
  END IF;
END $$;
