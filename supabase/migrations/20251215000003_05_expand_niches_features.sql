-- Migration: Expand system to support more niches
-- Nichos: Fit/Healthy, Confeitaria, Sushi/Rodízio, Bar/Pub, Dark Kitchen

-- ============================================
-- 1. FIT/HEALTHY - Campos nutricionais
-- ============================================

-- Adicionar campos nutricionais na tabela de produtos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS protein_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fat_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fiber_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sodium_mg DECIMAL(10,2) DEFAULT NULL;

-- Flags dietéticas para filtros
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_lactose_free BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_sugar_free BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_low_carb BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_keto BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT FALSE;

-- Alérgenos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

-- ============================================
-- 2. CONFEITARIA - Sistema de encomendas
-- ============================================

-- Tabela de encomendas (pedidos com data futura)
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Dados do cliente (caso não tenha cadastro)
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Data de entrega/retirada
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  delivery_type VARCHAR(20) DEFAULT 'pickup', -- pickup, delivery
  delivery_address JSONB,
  
  -- Detalhes da encomenda
  description TEXT NOT NULL,
  reference_images TEXT[] DEFAULT '{}', -- URLs das imagens de referência
  personalization_text VARCHAR(255), -- Texto para escrever no bolo
  servings INTEGER, -- Quantidade de pessoas/porções
  
  -- Produto base (opcional)
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Valores
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  deposit_amount DECIMAL(10,2), -- Sinal/entrada
  deposit_paid BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending', -- pending, quoted, confirmed, in_production, ready, delivered, cancelled
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quoted_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Configurações de encomenda por loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS accepts_custom_orders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_order_lead_days INTEGER DEFAULT 2, -- Dias mínimos de antecedência
ADD COLUMN IF NOT EXISTS custom_order_deposit_percent DECIMAL(5,2) DEFAULT 50.00; -- % de sinal

-- ============================================
-- 3. SUSHI/JAPONÊS - Modo rodízio
-- ============================================

-- Tabela de configuração de rodízio
CREATE TABLE IF NOT EXISTS public.rodizio_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL, -- "Rodízio Premium", "Rodízio Básico"
  description TEXT,
  
  -- Preços
  price_adult DECIMAL(10,2) NOT NULL,
  price_child DECIMAL(10,2), -- Preço criança
  child_age_limit INTEGER DEFAULT 10, -- Até qual idade é criança
  
  -- Tempo
  duration_minutes INTEGER DEFAULT 120, -- Tempo do rodízio
  
  -- Limites
  max_items_per_round INTEGER, -- Máximo de itens por rodada
  max_waste_items INTEGER, -- Limite de desperdício
  waste_fee_per_item DECIMAL(10,2), -- Taxa por item desperdiçado
  
  -- Categorias incluídas
  included_category_ids UUID[] DEFAULT '{}',
  
  -- Dias e horários disponíveis
  available_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=domingo
  start_time TIME,
  end_time TIME,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessão de rodízio (cliente consumindo)
CREATE TABLE IF NOT EXISTS public.rodizio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  rodizio_config_id UUID NOT NULL REFERENCES public.rodizio_configs(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Pessoas na mesa
  adults_count INTEGER DEFAULT 1,
  children_count INTEGER DEFAULT 0,
  
  -- Controle de tempo
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  
  -- Controle de consumo
  items_consumed INTEGER DEFAULT 0,
  items_wasted INTEGER DEFAULT 0,
  
  -- Valores
  base_total DECIMAL(10,2),
  waste_fee_total DECIMAL(10,2) DEFAULT 0,
  extras_total DECIMAL(10,2) DEFAULT 0, -- Itens fora do rodízio
  final_total DECIMAL(10,2),
  
  status VARCHAR(20) DEFAULT 'active', -- active, finished, cancelled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens consumidos no rodízio
CREATE TABLE IF NOT EXISTS public.rodizio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.rodizio_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_wasted BOOLEAN DEFAULT FALSE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Flag para produtos que são de rodízio
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_rodizio_item BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rodizio_limit_per_round INTEGER; -- Limite por rodada

-- ============================================
-- 4. BAR/PUB - Comanda aberta
-- ============================================

-- Tabela de comandas abertas (tabs)
CREATE TABLE IF NOT EXISTS public.tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Identificação
  tab_number VARCHAR(20), -- Número da comanda
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Controle
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Limite de crédito
  credit_limit DECIMAL(10,2),
  
  -- Valores
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0, -- Taxa de serviço (10%)
  total DECIMAL(10,2) DEFAULT 0,
  
  -- Pagamento
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  
  -- Gorjeta
  tip_amount DECIMAL(10,2) DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'open', -- open, pending_payment, paid, cancelled
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens da comanda
CREATE TABLE IF NOT EXISTS public.tab_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id UUID NOT NULL REFERENCES public.tabs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Quem pediu (para split)
  ordered_by VARCHAR(100), -- Nome da pessoa
  
  modifiers JSONB DEFAULT '[]',
  notes TEXT,
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  served_at TIMESTAMP WITH TIME ZONE
);

-- Split de conta
CREATE TABLE IF NOT EXISTS public.tab_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id UUID NOT NULL REFERENCES public.tabs(id) ON DELETE CASCADE,
  
  person_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  
  paid BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de bar na loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS has_tab_system BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_service_fee_percent DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS auto_service_fee BOOLEAN DEFAULT FALSE;

-- Happy Hour
CREATE TABLE IF NOT EXISTS public.happy_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL, -- "Happy Hour", "Dobradinha"
  description TEXT,
  
  -- Dias da semana (0=domingo, 6=sábado)
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Desconto
  discount_type VARCHAR(20) DEFAULT 'percent', -- percent, fixed, buy_x_get_y
  discount_value DECIMAL(10,2) NOT NULL,
  buy_quantity INTEGER, -- Para buy_x_get_y
  get_quantity INTEGER, -- Para buy_x_get_y
  
  -- Produtos incluídos
  applies_to VARCHAR(20) DEFAULT 'all', -- all, categories, products
  category_ids UUID[] DEFAULT '{}',
  product_ids UUID[] DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. DARK KITCHEN - Multi-marca
-- ============================================

-- Tabela de marcas virtuais (várias marcas na mesma cozinha)
CREATE TABLE IF NOT EXISTS public.virtual_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, -- Cozinha física
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Tema/visual
  theme_config JSONB DEFAULT '{}',
  
  -- Categorias de produtos desta marca
  category_ids UUID[] DEFAULT '{}',
  
  -- Configurações específicas
  is_active BOOLEAN DEFAULT TRUE,
  accepts_delivery BOOLEAN DEFAULT TRUE,
  accepts_pickup BOOLEAN DEFAULT FALSE,
  
  -- Horários específicos (se diferente da loja principal)
  custom_hours JSONB,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id, slug)
);

-- Flag para indicar que a loja é dark kitchen
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS is_dark_kitchen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kitchen_name VARCHAR(100); -- Nome da cozinha física

-- Produtos podem pertencer a marcas específicas
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS virtual_brand_ids UUID[] DEFAULT '{}'; -- Se vazio, aparece em todas

-- ============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_custom_orders_store_id ON public.custom_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_delivery_date ON public.custom_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);

CREATE INDEX IF NOT EXISTS idx_rodizio_sessions_store_id ON public.rodizio_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_rodizio_sessions_status ON public.rodizio_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rodizio_items_session_id ON public.rodizio_items(session_id);

CREATE INDEX IF NOT EXISTS idx_tabs_store_id ON public.tabs(store_id);
CREATE INDEX IF NOT EXISTS idx_tabs_status ON public.tabs(status);
CREATE INDEX IF NOT EXISTS idx_tab_items_tab_id ON public.tab_items(tab_id);

CREATE INDEX IF NOT EXISTS idx_virtual_brands_store_id ON public.virtual_brands(store_id);
CREATE INDEX IF NOT EXISTS idx_virtual_brands_slug ON public.virtual_brands(slug);

CREATE INDEX IF NOT EXISTS idx_products_dietary ON public.products(is_vegan, is_vegetarian, is_gluten_free);

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Custom Orders
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS custom_orders_store_access ON public.custom_orders;
CREATE POLICY custom_orders_store_access ON public.custom_orders
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Rodizio Configs
ALTER TABLE public.rodizio_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rodizio_configs_store_access ON public.rodizio_configs;
CREATE POLICY rodizio_configs_store_access ON public.rodizio_configs
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Rodizio Sessions
ALTER TABLE public.rodizio_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rodizio_sessions_store_access ON public.rodizio_sessions;
CREATE POLICY rodizio_sessions_store_access ON public.rodizio_sessions
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Rodizio Items
ALTER TABLE public.rodizio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rodizio_items_session_access ON public.rodizio_items;
CREATE POLICY rodizio_items_session_access ON public.rodizio_items
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.rodizio_sessions rs
    WHERE rs.id = rodizio_items.session_id
    AND public.user_has_store_access(rs.store_id)
  )
);

-- Tabs
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tabs_store_access ON public.tabs;
CREATE POLICY tabs_store_access ON public.tabs
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Tab Items
ALTER TABLE public.tab_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tab_items_tab_access ON public.tab_items;
CREATE POLICY tab_items_tab_access ON public.tab_items
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.tabs t
    WHERE t.id = tab_items.tab_id
    AND public.user_has_store_access(t.store_id)
  )
);

-- Tab Splits
ALTER TABLE public.tab_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tab_splits_tab_access ON public.tab_splits;
CREATE POLICY tab_splits_tab_access ON public.tab_splits
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.tabs t
    WHERE t.id = tab_splits.tab_id
    AND public.user_has_store_access(t.store_id)
  )
);

-- Happy Hours
ALTER TABLE public.happy_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS happy_hours_store_access ON public.happy_hours;
CREATE POLICY happy_hours_store_access ON public.happy_hours
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Virtual Brands
ALTER TABLE public.virtual_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS virtual_brands_store_access ON public.virtual_brands;
CREATE POLICY virtual_brands_store_access ON public.virtual_brands
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- ============================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_orders_updated_at ON public.custom_orders;
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rodizio_configs_updated_at ON public.rodizio_configs;
CREATE TRIGGER update_rodizio_configs_updated_at
  BEFORE UPDATE ON public.rodizio_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rodizio_sessions_updated_at ON public.rodizio_sessions;
CREATE TRIGGER update_rodizio_sessions_updated_at
  BEFORE UPDATE ON public.rodizio_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tabs_updated_at ON public.tabs;
CREATE TRIGGER update_tabs_updated_at
  BEFORE UPDATE ON public.tabs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_happy_hours_updated_at ON public.happy_hours;
CREATE TRIGGER update_happy_hours_updated_at
  BEFORE UPDATE ON public.happy_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_virtual_brands_updated_at ON public.virtual_brands;
CREATE TRIGGER update_virtual_brands_updated_at
  BEFORE UPDATE ON public.virtual_brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
