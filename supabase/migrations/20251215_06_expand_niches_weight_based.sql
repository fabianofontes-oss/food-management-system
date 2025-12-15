-- Migration: Expand system for weight-based niches
-- Nichos: Açougue, Sacolão/Hortifruti, Peixaria, Empório, Mercearia

-- ============================================
-- 1. VENDA POR PESO/KG
-- ============================================

-- Adicionar campos para venda por peso nos produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sell_by_weight BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'kg', -- kg, g, lb
ADD COLUMN IF NOT EXISTS min_weight DECIMAL(10,3), -- Peso mínimo para venda
ADD COLUMN IF NOT EXISTS weight_increment DECIMAL(10,3) DEFAULT 0.100, -- Incremento (ex: 100g)
ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10,2), -- Preço por kg (alternativo ao price)
ADD COLUMN IF NOT EXISTS average_unit_weight DECIMAL(10,3); -- Peso médio da unidade (ex: 1 frango = ~1.5kg)

-- ============================================
-- 2. AÇOUGUE - Cortes e preparos
-- ============================================

-- Tipos de corte disponíveis
CREATE TABLE IF NOT EXISTS public.meat_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Bife fino", "Cubos", "Moído", "Inteiro"
  description TEXT,
  additional_price DECIMAL(10,2) DEFAULT 0, -- Taxa adicional pelo corte
  preparation_time_minutes INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tipos de preparo/tempero
CREATE TABLE IF NOT EXISTS public.meat_seasonings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Temperado", "Marinado", "Alho e sal"
  description TEXT,
  additional_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relacionar produtos com cortes disponíveis
CREATE TABLE IF NOT EXISTS public.product_meat_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  meat_cut_id UUID NOT NULL REFERENCES public.meat_cuts(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, meat_cut_id)
);

-- Relacionar produtos com temperos disponíveis
CREATE TABLE IF NOT EXISTS public.product_seasonings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seasoning_id UUID NOT NULL REFERENCES public.meat_seasonings(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, seasoning_id)
);

-- Campos específicos para açougue nos produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS meat_origin VARCHAR(100), -- "Angus", "Nelore", "Importado"
ADD COLUMN IF NOT EXISTS meat_grade VARCHAR(50), -- "Premium", "Standard"
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS defrost_time_hours INTEGER; -- Tempo para descongelar

-- ============================================
-- 3. SACOLÃO/HORTIFRUTI
-- ============================================

-- Categorização de produtos hortifruti
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS produce_type VARCHAR(50), -- 'fruit', 'vegetable', 'greens', 'tuber', 'legume'
ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT FALSE, -- Já existe, mas reforçando
ADD COLUMN IF NOT EXISTS origin_location VARCHAR(100), -- "Local", "Importado", "Fazenda X"
ADD COLUMN IF NOT EXISTS harvest_date DATE, -- Data da colheita
ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER; -- Validade em dias

-- Promoções de feira (ex: "Segunda da banana")
CREATE TABLE IF NOT EXISTS public.produce_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Segunda da Banana", "Quarta Verde"
  description TEXT,
  
  -- Dias da semana (0=domingo)
  days_of_week INTEGER[] DEFAULT '{}',
  
  -- Desconto
  discount_percent DECIMAL(5,2),
  
  -- Produtos incluídos
  product_ids UUID[] DEFAULT '{}',
  category_ids UUID[] DEFAULT '{}',
  
  -- Validade
  start_date DATE,
  end_date DATE,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. PEIXARIA
-- ============================================

-- Tipos de preparo de peixe
CREATE TABLE IF NOT EXISTS public.fish_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Inteiro", "Filé", "Posta", "Limpo", "Escamado"
  description TEXT,
  additional_price_per_kg DECIMAL(10,2) DEFAULT 0, -- Taxa por kg
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relacionar produtos com preparos
CREATE TABLE IF NOT EXISTS public.product_fish_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  preparation_id UUID NOT NULL REFERENCES public.fish_preparations(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, preparation_id)
);

-- Campos específicos para peixaria
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS fish_type VARCHAR(50), -- 'fresh', 'frozen', 'salted'
ADD COLUMN IF NOT EXISTS catch_method VARCHAR(100), -- "Linha", "Rede", "Cativeiro"
ADD COLUMN IF NOT EXISTS catch_location VARCHAR(100); -- Local de pesca

-- ============================================
-- 5. EMPÓRIO/MERCEARIA/LOJA DE CONVENIÊNCIA
-- ============================================

-- Campos para produtos de mercearia
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50), -- Código de barras EAN
ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50), -- Código do fornecedor
ADD COLUMN IF NOT EXISTS brand VARCHAR(100), -- Marca do produto
ADD COLUMN IF NOT EXISTS expiry_date DATE, -- Data de validade
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50), -- Número do lote
ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER, -- Alerta de estoque mínimo
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER; -- Quantidade para reposição

-- ============================================
-- 6. CONFIGURAÇÕES DE LOJA POR NICHO
-- ============================================

-- Flags de nicho na loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS is_butcher_shop BOOLEAN DEFAULT FALSE, -- Açougue
ADD COLUMN IF NOT EXISTS is_produce_market BOOLEAN DEFAULT FALSE, -- Sacolão
ADD COLUMN IF NOT EXISTS is_fish_market BOOLEAN DEFAULT FALSE, -- Peixaria
ADD COLUMN IF NOT EXISTS is_grocery_store BOOLEAN DEFAULT FALSE, -- Mercearia
ADD COLUMN IF NOT EXISTS is_convenience_store BOOLEAN DEFAULT FALSE, -- Conveniência
ADD COLUMN IF NOT EXISTS uses_weight_scale BOOLEAN DEFAULT FALSE, -- Usa balança
ADD COLUMN IF NOT EXISTS scale_integration VARCHAR(50); -- Tipo de integração (Toledo, Filizola, etc)

-- ============================================
-- 7. PEDIDOS COM PESO ESTIMADO vs REAL
-- ============================================

-- Adicionar campos de peso nos itens do pedido
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS estimated_weight DECIMAL(10,3), -- Peso estimado pelo cliente
ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,3), -- Peso real após pesagem
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2), -- Preço por kg/unidade
ADD COLUMN IF NOT EXISTS weight_adjusted BOOLEAN DEFAULT FALSE, -- Se o peso foi ajustado
ADD COLUMN IF NOT EXISTS meat_cut_id UUID REFERENCES public.meat_cuts(id),
ADD COLUMN IF NOT EXISTS seasoning_id UUID REFERENCES public.meat_seasonings(id),
ADD COLUMN IF NOT EXISTS fish_preparation_id UUID REFERENCES public.fish_preparations(id);

-- ============================================
-- 8. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meat_cuts_store_id ON public.meat_cuts(store_id);
CREATE INDEX IF NOT EXISTS idx_meat_seasonings_store_id ON public.meat_seasonings(store_id);
CREATE INDEX IF NOT EXISTS idx_fish_preparations_store_id ON public.fish_preparations(store_id);
CREATE INDEX IF NOT EXISTS idx_produce_promotions_store_id ON public.produce_promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sell_by_weight ON public.products(sell_by_weight);

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Meat Cuts
ALTER TABLE public.meat_cuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY meat_cuts_store_access ON public.meat_cuts
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Meat Seasonings
ALTER TABLE public.meat_seasonings ENABLE ROW LEVEL SECURITY;

CREATE POLICY meat_seasonings_store_access ON public.meat_seasonings
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Fish Preparations
ALTER TABLE public.fish_preparations ENABLE ROW LEVEL SECURITY;

CREATE POLICY fish_preparations_store_access ON public.fish_preparations
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Produce Promotions
ALTER TABLE public.produce_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY produce_promotions_store_access ON public.produce_promotions
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Product Meat Cuts (via product)
ALTER TABLE public.product_meat_cuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_meat_cuts_access ON public.product_meat_cuts
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_meat_cuts.product_id
    AND public.user_has_store_access(p.store_id)
  )
);

-- Product Seasonings (via product)
ALTER TABLE public.product_seasonings ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_seasonings_access ON public.product_seasonings
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_seasonings.product_id
    AND public.user_has_store_access(p.store_id)
  )
);

-- Product Fish Preparations (via product)
ALTER TABLE public.product_fish_preparations ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_fish_preparations_access ON public.product_fish_preparations
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_fish_preparations.product_id
    AND public.user_has_store_access(p.store_id)
  )
);

-- ============================================
-- 10. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_produce_promotions_updated_at ON public.produce_promotions;
CREATE TRIGGER update_produce_promotions_updated_at
  BEFORE UPDATE ON public.produce_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
