
-- ======================================================================
-- FILE: supabase\migrations\20251215_01_store_public_profile_and_theme.sql
-- ======================================================================

-- Migration: Add public_profile and menu_theme to stores
-- Purpose: Enable public menu theming and store public profile (hours, address, social media)

-- Add public_profile column (public info: hours, address, social media)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS public_profile jsonb DEFAULT '{}'::jsonb;

-- Add menu_theme column (theme settings: preset, card variant, colors)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS menu_theme jsonb DEFAULT '{}'::jsonb;

-- Comment columns
COMMENT ON COLUMN public.stores.public_profile IS 'Public store information: name, slogan, address, phone, social media, business hours';
COMMENT ON COLUMN public.stores.menu_theme IS 'Menu theme settings: preset (layout), cardVariant, colors, layout options';

-- RLS: SELECT on stores remains public for active stores (already exists)
-- RLS: UPDATE on menu_theme and public_profile only for authenticated users with store access

-- Drop existing UPDATE policy if it exists and recreate with new columns
DROP POLICY IF EXISTS "Users can update their own store" ON public.stores;

-- Allow authenticated users to update their store (including new theme fields)
CREATE POLICY "Users can update their own store"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT store_id 
    FROM public.user_stores 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT store_id 
    FROM public.user_stores 
    WHERE user_id = auth.uid()
  )
);

-- ======================================================================
-- FILE: supabase\migrations\20251215_03_public_menu_select_policies.sql
-- ======================================================================

-- ============================================================================
-- FIX: Restaurar SELECT público para cardápio (stores/categories/products + modifiers)
-- Objetivo: permitir que anon leia somente dados necessários do cardápio quando a loja estiver ativa
-- ============================================================================

-- STORES: permitir SELECT público somente para lojas ativas
DROP POLICY IF EXISTS stores_public_select ON public.stores;
CREATE POLICY stores_public_select
ON public.stores
FOR SELECT
USING (is_active = true);

-- CATEGORIES: permitir SELECT público somente para categorias ativas de lojas ativas
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select
ON public.categories
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- PRODUCTS: permitir SELECT público somente para produtos ativos de lojas ativas
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select
ON public.products
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- MODIFIER_GROUPS: permitir SELECT público para grupos de modificadores de lojas ativas
DROP POLICY IF EXISTS modifier_groups_public_select ON public.modifier_groups;
CREATE POLICY modifier_groups_public_select
ON public.modifier_groups
FOR SELECT
USING (
  store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- MODIFIER_OPTIONS: permitir SELECT público para opções de grupos de lojas ativas
DROP POLICY IF EXISTS modifier_options_public_select ON public.modifier_options;
CREATE POLICY modifier_options_public_select
ON public.modifier_options
FOR SELECT
USING (
  group_id IN (
    SELECT mg.id
    FROM public.modifier_groups mg
    WHERE mg.store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- PRODUCT_MODIFIER_GROUPS: permitir SELECT público para vínculos de lojas ativas
DROP POLICY IF EXISTS product_modifier_groups_public_select ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_public_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND mg.store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- ======================================================================
-- FILE: supabase\migrations\20251215_04_fix_stores_rls_public_and_member.sql
-- ======================================================================

-- ============================================================================
-- AUDIT-01: Corrigir RLS de stores para permitir SELECT público (anon) + autenticado (member)
-- Problema: stores_select bloqueava tudo; stores_public_select não foi suficiente
-- Solução: DROP todas policies antigas, criar 2 novas (public + member)
-- ============================================================================

-- 1) Garantir que a função user_has_store_access existe e usa store_users (não user_stores)
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
  );
$$;

-- 2) STORES: DROP todas policies antigas que podem estar conflitando
DROP POLICY IF EXISTS stores_select ON public.stores;
DROP POLICY IF EXISTS stores_public_select ON public.stores;
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Super admin can view all stores" ON public.stores;

-- 3) STORES: Criar 2 policies novas (público + membro)
DROP POLICY IF EXISTS stores_public_select_active ON public.stores;
DROP POLICY IF EXISTS stores_member_select ON public.stores;

-- Policy 1: Anônimos e autenticados podem ver stores ATIVAS (para cardápio público)
CREATE POLICY stores_public_select_active
ON public.stores
FOR SELECT
USING (is_active = true);

-- Policy 2: Membros autenticados podem ver SUAS stores (mesmo inativas, para dashboard)
CREATE POLICY stores_member_select
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
);

-- 4) STORES: UPDATE somente para membros autenticados
DROP POLICY IF EXISTS stores_update ON public.stores;
CREATE POLICY stores_update
ON public.stores
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
);

-- 5) STORES: INSERT bloqueado (criação via signup flow separado)
DROP POLICY IF EXISTS stores_insert ON public.stores;
CREATE POLICY stores_insert
ON public.stores
FOR INSERT
WITH CHECK (false);

-- 6) CATEGORIES: Garantir SELECT público para categorias ativas de lojas ativas
DROP POLICY IF EXISTS categories_public_select ON public.categories;
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_member_select ON public.categories;

CREATE POLICY categories_public_select
ON public.categories
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = categories.store_id
      AND s.is_active = true
  )
);

CREATE POLICY categories_member_select
ON public.categories
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 7) PRODUCTS: Garantir SELECT público para produtos ativos de lojas ativas
DROP POLICY IF EXISTS products_public_select ON public.products;
DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_member_select ON public.products;

CREATE POLICY products_public_select
ON public.products
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = products.store_id
      AND s.is_active = true
  )
);

CREATE POLICY products_member_select
ON public.products
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 8) MODIFIER_GROUPS: SELECT público + membro
DROP POLICY IF EXISTS modifier_groups_public_select ON public.modifier_groups;
DROP POLICY IF EXISTS modifier_groups_select ON public.modifier_groups;
DROP POLICY IF EXISTS modifier_groups_member_select ON public.modifier_groups;

CREATE POLICY modifier_groups_public_select
ON public.modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = modifier_groups.store_id
      AND s.is_active = true
  )
);

CREATE POLICY modifier_groups_member_select
ON public.modifier_groups
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 9) MODIFIER_OPTIONS: SELECT público + membro
DROP POLICY IF EXISTS modifier_options_public_select ON public.modifier_options;
DROP POLICY IF EXISTS modifier_options_select ON public.modifier_options;
DROP POLICY IF EXISTS modifier_options_member_select ON public.modifier_options;

CREATE POLICY modifier_options_public_select
ON public.modifier_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    INNER JOIN public.stores s ON s.id = mg.store_id
    WHERE mg.id = modifier_options.group_id
      AND s.is_active = true
  )
);

CREATE POLICY modifier_options_member_select
ON public.modifier_options
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- 10) PRODUCT_MODIFIER_GROUPS: SELECT público + membro
DROP POLICY IF EXISTS product_modifier_groups_public_select ON public.product_modifier_groups;
DROP POLICY IF EXISTS product_modifier_groups_select ON public.product_modifier_groups;
DROP POLICY IF EXISTS product_modifier_groups_member_select ON public.product_modifier_groups;

CREATE POLICY product_modifier_groups_public_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    INNER JOIN public.stores s ON s.id = mg.store_id
    WHERE mg.id = product_modifier_groups.group_id
      AND s.is_active = true
  )
);

CREATE POLICY product_modifier_groups_member_select
ON public.product_modifier_groups
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- ======================================================================
-- FILE: supabase\migrations\20251215_05_expand_niches_features.sql
-- ======================================================================

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

-- ======================================================================
-- FILE: supabase\migrations\20251215_06_expand_niches_weight_based.sql
-- ======================================================================

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

DROP POLICY IF EXISTS meat_cuts_store_access ON public.meat_cuts;
CREATE POLICY meat_cuts_store_access ON public.meat_cuts
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Meat Seasonings
ALTER TABLE public.meat_seasonings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meat_seasonings_store_access ON public.meat_seasonings;
CREATE POLICY meat_seasonings_store_access ON public.meat_seasonings
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Fish Preparations
ALTER TABLE public.fish_preparations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fish_preparations_store_access ON public.fish_preparations;
CREATE POLICY fish_preparations_store_access ON public.fish_preparations
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Produce Promotions
ALTER TABLE public.produce_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS produce_promotions_store_access ON public.produce_promotions;
CREATE POLICY produce_promotions_store_access ON public.produce_promotions
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Product Meat Cuts (via product)
ALTER TABLE public.product_meat_cuts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_meat_cuts_access ON public.product_meat_cuts;
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

DROP POLICY IF EXISTS product_seasonings_access ON public.product_seasonings;
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

DROP POLICY IF EXISTS product_fish_preparations_access ON public.product_fish_preparations;
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

-- ======================================================================
-- FILE: supabase\migrations\20251215_07_tropical_features.sql
-- ======================================================================

-- Migration: Tropical Freeze Features
-- Features: MIMO, Fidelidade, KDS Avançado, TV Menu Board, Marketing Studio, Hardware

-- ============================================
-- 1. MIMO - PAGAMENTO SOCIAL ("Paga pra mim?")
-- ============================================

-- Campos MIMO na tabela de pedidos
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS mimo_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS mimo_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mimo_target_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS mimo_message TEXT,
ADD COLUMN IF NOT EXISTS mimo_payer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mimo_payer_id UUID,
ADD COLUMN IF NOT EXISTS mimo_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mimo_shared_via VARCHAR(20);

-- Índices para MIMO
CREATE INDEX IF NOT EXISTS idx_orders_mimo_token ON public.orders(mimo_token) WHERE mimo_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_mimo_expires ON public.orders(mimo_expires_at) WHERE mimo_expires_at IS NOT NULL;

-- Configurações de MIMO por loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS mimo_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mimo_expiration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS mimo_allow_table_orders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mimo_min_order_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mimo_payer_earns_points BOOLEAN DEFAULT TRUE;

-- ============================================
-- 2. CARTÃO FIDELIDADE / LOYALTY
-- ============================================

-- Configuração do programa de fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL DEFAULT 'Programa Fidelidade',
  description TEXT,
  
  program_type VARCHAR(20) NOT NULL DEFAULT 'points',
  
  points_per_currency DECIMAL(10,2) DEFAULT 1,
  points_per_order INTEGER DEFAULT 0,
  
  points_value DECIMAL(10,4) DEFAULT 0.01,
  min_points_redeem INTEGER DEFAULT 100,
  max_discount_percent DECIMAL(5,2) DEFAULT 100,
  
  cashback_percent DECIMAL(5,2) DEFAULT 0,
  cashback_expiry_days INTEGER DEFAULT 90,
  
  stamps_required INTEGER DEFAULT 10,
  stamp_reward_type VARCHAR(20) DEFAULT 'free_item',
  stamp_reward_value DECIMAL(10,2),
  stamp_reward_product_id UUID REFERENCES public.products(id),
  
  has_tiers BOOLEAN DEFAULT FALSE,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Níveis de fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  
  name VARCHAR(50) NOT NULL,
  min_points INTEGER NOT NULL,
  
  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  free_delivery BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  exclusive_products BOOLEAN DEFAULT FALSE,
  
  badge_color VARCHAR(20),
  badge_icon VARCHAR(50),
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saldo e histórico do cliente
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.loyalty_programs(id) ON DELETE SET NULL,
  
  points_balance INTEGER DEFAULT 0,
  points_earned_total INTEGER DEFAULT 0,
  points_redeemed_total INTEGER DEFAULT 0,
  
  cashback_balance DECIMAL(10,2) DEFAULT 0,
  
  stamps_current INTEGER DEFAULT 0,
  stamps_completed INTEGER DEFAULT 0,
  
  current_tier_id UUID REFERENCES public.loyalty_tiers(id),
  tier_achieved_at TIMESTAMP WITH TIME ZONE,
  
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(customer_id, store_id)
);

-- Transações de pontos
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  transaction_type VARCHAR(20) NOT NULL,
  points_amount INTEGER NOT NULL,
  
  description VARCHAR(255),
  
  cashback_amount DECIMAL(10,2) DEFAULT 0,
  stamps_amount INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Régua de relacionamento
CREATE TABLE IF NOT EXISTS public.customer_engagement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  trigger_type VARCHAR(30) NOT NULL,
  trigger_days INTEGER,
  
  action_type VARCHAR(30) NOT NULL,
  message_template TEXT,
  coupon_id UUID REFERENCES public.coupons(id),
  bonus_points INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log de engajamento
CREATE TABLE IF NOT EXISTS public.customer_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.customer_engagement_rules(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  channel VARCHAR(20),
  status VARCHAR(20) DEFAULT 'sent',
  converted_order_id UUID REFERENCES public.orders(id)
);

-- ============================================
-- 3. KDS AVANÇADO (Kitchen Display System)
-- ============================================

-- Configuração do KDS por loja
CREATE TABLE IF NOT EXISTS public.kds_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  columns JSONB DEFAULT '[
    {"id": "pending", "name": "Pendente", "color": "#FCD34D"},
    {"id": "preparing", "name": "Preparando", "color": "#60A5FA"},
    {"id": "ready", "name": "Pronto", "color": "#34D399"}
  ]'::jsonb,
  
  sla_green_minutes INTEGER DEFAULT 5,
  sla_yellow_minutes INTEGER DEFAULT 10,
  
  batch_mode_enabled BOOLEAN DEFAULT FALSE,
  batch_group_by VARCHAR(20) DEFAULT 'product',
  
  sound_new_order BOOLEAN DEFAULT TRUE,
  sound_file VARCHAR(255) DEFAULT '/sounds/new-order.mp3',
  
  auto_refresh_seconds INTEGER DEFAULT 10,
  
  font_size VARCHAR(10) DEFAULT 'medium',
  show_customer_name BOOLEAN DEFAULT TRUE,
  show_order_notes BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id)
);

-- Tempo de preparo por produto
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS kds_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kds_station VARCHAR(50);

-- Estações de preparo
CREATE TABLE IF NOT EXISTS public.kds_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  
  category_ids UUID[] DEFAULT '{}',
  
  color VARCHAR(20) DEFAULT '#6366F1',
  icon VARCHAR(50) DEFAULT 'ChefHat',
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id, code)
);

-- Log de tempo de preparo
CREATE TABLE IF NOT EXISTS public.kds_order_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  
  wait_time_seconds INTEGER,
  prep_time_seconds INTEGER,
  total_time_seconds INTEGER,
  
  sla_status VARCHAR(10),
  estimated_prep_minutes INTEGER,
  
  prepared_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TV MENU BOARD (Digital Signage)
-- ============================================

CREATE TABLE IF NOT EXISTS public.tv_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  
  display_type VARCHAR(20) DEFAULT 'menu',
  
  layout VARCHAR(20) DEFAULT 'grid',
  columns INTEGER DEFAULT 3,
  rows INTEGER DEFAULT 4,
  
  category_ids UUID[] DEFAULT '{}',
  show_prices BOOLEAN DEFAULT TRUE,
  show_images BOOLEAN DEFAULT TRUE,
  show_descriptions BOOLEAN DEFAULT FALSE,
  
  show_qr_code BOOLEAN DEFAULT TRUE,
  qr_position VARCHAR(20) DEFAULT 'bottom-right',
  qr_size INTEGER DEFAULT 150,
  
  promo_rotation_seconds INTEGER DEFAULT 10,
  promo_ids UUID[] DEFAULT '{}',
  
  theme VARCHAR(20) DEFAULT 'dark',
  background_color VARCHAR(20) DEFAULT '#1F2937',
  text_color VARCHAR(20) DEFAULT '#FFFFFF',
  accent_color VARCHAR(20) DEFAULT '#8B5CF6',
  font_size VARCHAR(10) DEFAULT 'large',
  
  is_active BOOLEAN DEFAULT TRUE,
  last_ping_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id, code)
);

-- Promoções para TV
CREATE TABLE IF NOT EXISTS public.tv_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(255),
  
  image_url VARCHAR(500),
  background_color VARCHAR(20),
  text_color VARCHAR(20),
  
  product_id UUID REFERENCES public.products(id),
  
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. MARKETING STUDIO
-- ============================================

-- Templates de posts
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  template_type VARCHAR(30) NOT NULL,
  
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  
  design_json JSONB NOT NULL,
  
  preview_url VARCHAR(500),
  
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts gerados
CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.marketing_templates(id),
  
  title VARCHAR(255),
  
  image_url VARCHAR(500),
  
  product_id UUID REFERENCES public.products(id),
  
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  instagram_post_id VARCHAR(100),
  facebook_post_id VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Cam (Molduras)
CREATE TABLE IF NOT EXISTS public.social_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  
  frame_url VARCHAR(500) NOT NULL,
  
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  
  photo_x INTEGER NOT NULL,
  photo_y INTEGER NOT NULL,
  photo_width INTEGER NOT NULL,
  photo_height INTEGER NOT NULL,
  
  frame_type VARCHAR(20) DEFAULT 'portrait',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. HARDWARE INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.hardware_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  device_type VARCHAR(30) NOT NULL,
  
  connection_type VARCHAR(20) NOT NULL,
  connection_config JSONB,
  
  scale_protocol VARCHAR(30),
  scale_unit VARCHAR(10) DEFAULT 'kg',
  
  printer_width INTEGER,
  printer_driver VARCHAR(30),
  
  is_active BOOLEAN DEFAULT TRUE,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_store ON public.loyalty_programs(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer ON public.customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_store ON public.customer_loyalty(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON public.loyalty_transactions(customer_loyalty_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_log_order ON public.kds_order_log(order_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_log_store ON public.kds_order_log(store_id);
CREATE INDEX IF NOT EXISTS idx_tv_displays_store ON public.tv_displays(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_templates_store ON public.marketing_templates(store_id);

-- ============================================
-- 8. RLS POLICIES
-- ============================================

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_programs_store_access ON public.loyalty_programs;
CREATE POLICY loyalty_programs_store_access ON public.loyalty_programs
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_tiers_access ON public.loyalty_tiers;
CREATE POLICY loyalty_tiers_access ON public.loyalty_tiers
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = program_id AND public.user_has_store_access(lp.store_id))
);

ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS customer_loyalty_store_access ON public.customer_loyalty;
CREATE POLICY customer_loyalty_store_access ON public.customer_loyalty
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_transactions_store_access ON public.loyalty_transactions;
CREATE POLICY loyalty_transactions_store_access ON public.loyalty_transactions
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.customer_engagement_rules ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS engagement_rules_store_access ON public.customer_engagement_rules;
CREATE POLICY engagement_rules_store_access ON public.customer_engagement_rules
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.customer_engagement_log ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS engagement_log_access ON public.customer_engagement_log;
CREATE POLICY engagement_log_access ON public.customer_engagement_log
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.customer_engagement_rules r WHERE r.id = rule_id AND public.user_has_store_access(r.store_id))
);

ALTER TABLE public.kds_config ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_config_store_access ON public.kds_config;
CREATE POLICY kds_config_store_access ON public.kds_config
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.kds_stations ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_stations_store_access ON public.kds_stations;
CREATE POLICY kds_stations_store_access ON public.kds_stations
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.kds_order_log ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_order_log_store_access ON public.kds_order_log;
CREATE POLICY kds_order_log_store_access ON public.kds_order_log
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.tv_displays ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS tv_displays_store_access ON public.tv_displays;
CREATE POLICY tv_displays_store_access ON public.tv_displays
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.tv_promotions ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS tv_promotions_store_access ON public.tv_promotions;
CREATE POLICY tv_promotions_store_access ON public.tv_promotions
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS marketing_templates_access ON public.marketing_templates;
CREATE POLICY marketing_templates_access ON public.marketing_templates
FOR ALL USING (store_id IS NULL OR public.user_has_store_access(store_id));

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS marketing_posts_store_access ON public.marketing_posts;
CREATE POLICY marketing_posts_store_access ON public.marketing_posts
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.social_frames ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS social_frames_access ON public.social_frames;
CREATE POLICY social_frames_access ON public.social_frames
FOR ALL USING (store_id IS NULL OR public.user_has_store_access(store_id));

ALTER TABLE public.hardware_devices ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS hardware_devices_store_access ON public.hardware_devices;
CREATE POLICY hardware_devices_store_access ON public.hardware_devices
FOR ALL USING (public.user_has_store_access(store_id));

-- ============================================
-- 9. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_loyalty_programs_updated_at ON public.loyalty_programs;
CREATE TRIGGER update_loyalty_programs_updated_at
  BEFORE UPDATE ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_loyalty_updated_at ON public.customer_loyalty;
CREATE TRIGGER update_customer_loyalty_updated_at
  BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_rules_updated_at ON public.customer_engagement_rules;
CREATE TRIGGER update_engagement_rules_updated_at
  BEFORE UPDATE ON public.customer_engagement_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kds_config_updated_at ON public.kds_config;
CREATE TRIGGER update_kds_config_updated_at
  BEFORE UPDATE ON public.kds_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tv_displays_updated_at ON public.tv_displays;
CREATE TRIGGER update_tv_displays_updated_at
  BEFORE UPDATE ON public.tv_displays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hardware_devices_updated_at ON public.hardware_devices;
CREATE TRIGGER update_hardware_devices_updated_at
  BEFORE UPDATE ON public.hardware_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. FUNCTIONS
-- ============================================

-- Função para expirar MIMOs antigos
CREATE OR REPLACE FUNCTION expire_mimo_orders()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.orders
  SET status = 'mimo_expired',
      updated_at = NOW()
  WHERE status = 'awaiting_mimo'
    AND mimo_expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular pontos de fidelidade
CREATE OR REPLACE FUNCTION calculate_loyalty_points(
  p_store_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_program public.loyalty_programs;
  v_points INTEGER;
BEGIN
  SELECT * INTO v_program
  FROM public.loyalty_programs
  WHERE store_id = p_store_id AND is_active = TRUE
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  v_points := FLOOR(p_order_total * v_program.points_per_currency);
  v_points := v_points + COALESCE(v_program.points_per_order, 0);
  
  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para creditar pontos após pedido
CREATE OR REPLACE FUNCTION credit_loyalty_points(
  p_customer_id UUID,
  p_store_id UUID,
  p_order_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
  v_loyalty_id UUID;
BEGIN
  v_points := calculate_loyalty_points(p_store_id, p_order_total);
  
  IF v_points <= 0 THEN
    RETURN 0;
  END IF;
  
  INSERT INTO public.customer_loyalty (customer_id, store_id, points_balance, points_earned_total, total_orders, total_spent, last_order_at)
  VALUES (p_customer_id, p_store_id, v_points, v_points, 1, p_order_total, NOW())
  ON CONFLICT (customer_id, store_id)
  DO UPDATE SET
    points_balance = customer_loyalty.points_balance + v_points,
    points_earned_total = customer_loyalty.points_earned_total + v_points,
    total_orders = customer_loyalty.total_orders + 1,
    total_spent = customer_loyalty.total_spent + p_order_total,
    last_order_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_loyalty_id;
  
  INSERT INTO public.loyalty_transactions (customer_loyalty_id, store_id, order_id, transaction_type, points_amount, description)
  VALUES (v_loyalty_id, p_store_id, p_order_id, 'earn', v_points, 'Pontos do pedido');
  
  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar token MIMO
CREATE OR REPLACE FUNCTION validate_mimo_token(
  p_order_id UUID,
  p_token VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_order public.orders;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND mimo_token = p_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token inválido');
  END IF;
  
  IF v_order.status = 'mimo_expired' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este link expirou');
  END IF;
  
  IF v_order.status != 'awaiting_mimo' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este pedido já foi pago');
  END IF;
  
  IF v_order.mimo_expires_at < NOW() THEN
    UPDATE public.orders SET status = 'mimo_expired' WHERE id = p_order_id;
    RETURN jsonb_build_object('valid', false, 'error', 'Este link expirou');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'order_id', v_order.id,
    'total', v_order.total,
    'target_name', v_order.mimo_target_name,
    'message', v_order.mimo_message,
    'expires_at', v_order.mimo_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================
-- FILE: supabase\migrations\20251215_08_niche_templates_tables.sql
-- ======================================================================

-- Migration: Tabelas para Templates de Nicho
-- Permite edição dos nichos/módulos/produtos pelo SuperAdmin

-- =============================================
-- TABELA: niche_templates (Nichos principais)
-- =============================================
CREATE TABLE IF NOT EXISTS niche_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'UtensilsCrossed',
  color TEXT NOT NULL DEFAULT '#7C3AED',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Configurações
  has_delivery BOOLEAN NOT NULL DEFAULT true,
  has_pickup BOOLEAN NOT NULL DEFAULT true,
  has_table_service BOOLEAN NOT NULL DEFAULT false,
  has_counter_pickup BOOLEAN NOT NULL DEFAULT true,
  mimo_enabled BOOLEAN NOT NULL DEFAULT true,
  tab_system_enabled BOOLEAN NOT NULL DEFAULT false,
  rodizio_enabled BOOLEAN NOT NULL DEFAULT false,
  custom_orders_enabled BOOLEAN NOT NULL DEFAULT false,
  nutritional_info_enabled BOOLEAN NOT NULL DEFAULT false,
  weight_based_enabled BOOLEAN NOT NULL DEFAULT false,
  loyalty_type TEXT CHECK (loyalty_type IN ('points', 'stamps', 'cashback')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: niche_modules (Módulos por nicho)
-- =============================================
CREATE TABLE IF NOT EXISTS niche_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niche_templates(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(niche_id, module_id)
);

-- =============================================
-- TABELA: niche_categories (Categorias por nicho)
-- =============================================
CREATE TABLE IF NOT EXISTS niche_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niche_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: niche_products (Produtos por nicho)
-- =============================================
CREATE TABLE IF NOT EXISTS niche_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niche_templates(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2),
  unit TEXT NOT NULL DEFAULT 'un',
  
  -- Flags
  has_addons BOOLEAN DEFAULT false,
  is_customizable BOOLEAN DEFAULT false,
  prep_time_minutes INTEGER,
  
  -- Nutricionais
  calories INTEGER,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  
  tags TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: niche_suggested_kits (Kits sugeridos)
-- =============================================
CREATE TABLE IF NOT EXISTS niche_suggested_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id TEXT NOT NULL REFERENCES niche_templates(id) ON DELETE CASCADE,
  kit_id TEXT NOT NULL,
  
  UNIQUE(niche_id, kit_id)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_niche_modules_niche ON niche_modules(niche_id);
CREATE INDEX IF NOT EXISTS idx_niche_categories_niche ON niche_categories(niche_id);
CREATE INDEX IF NOT EXISTS idx_niche_products_niche ON niche_products(niche_id);
CREATE INDEX IF NOT EXISTS idx_niche_products_category ON niche_products(niche_id, category_name);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_niche_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_niche_templates_updated_at ON niche_templates;
CREATE TRIGGER trigger_niche_templates_updated_at
  BEFORE UPDATE ON niche_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_niche_updated_at();

-- =============================================
-- RLS (Row Level Security) - SuperAdmin only
-- =============================================
ALTER TABLE niche_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_suggested_kits ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (para onboarding)
DROP POLICY IF EXISTS "niche_templates_read_all" ON niche_templates;
CREATE POLICY "niche_templates_read_all" ON niche_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_modules_read_all" ON niche_modules;
CREATE POLICY "niche_modules_read_all" ON niche_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_categories_read_all" ON niche_categories;
CREATE POLICY "niche_categories_read_all" ON niche_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_products_read_all" ON niche_products;
CREATE POLICY "niche_products_read_all" ON niche_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_suggested_kits_read_all" ON niche_suggested_kits;
CREATE POLICY "niche_suggested_kits_read_all" ON niche_suggested_kits FOR SELECT USING (true);

-- Políticas de escrita apenas para superadmin
DROP POLICY IF EXISTS "niche_templates_write_superadmin" ON niche_templates;
CREATE POLICY "niche_templates_write_superadmin" ON niche_templates 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_modules_write_superadmin" ON niche_modules;
CREATE POLICY "niche_modules_write_superadmin" ON niche_modules 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_categories_write_superadmin" ON niche_categories;
CREATE POLICY "niche_categories_write_superadmin" ON niche_categories 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_products_write_superadmin" ON niche_products;
CREATE POLICY "niche_products_write_superadmin" ON niche_products 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_suggested_kits_write_superadmin" ON niche_suggested_kits;
CREATE POLICY "niche_suggested_kits_write_superadmin" ON niche_suggested_kits 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE niche_templates IS 'Templates de nicho editáveis pelo SuperAdmin';
COMMENT ON TABLE niche_modules IS 'Módulos habilitados por nicho';
COMMENT ON TABLE niche_categories IS 'Categorias pré-definidas por nicho';
COMMENT ON TABLE niche_products IS 'Produtos pré-definidos por nicho';
COMMENT ON TABLE niche_suggested_kits IS 'Kits sugeridos por nicho';

-- ======================================================================
-- FILE: supabase\migrations\20251215_09_niche_seed_data.sql
-- ======================================================================

-- Seed: Dados iniciais dos templates de nicho
-- Popula as tabelas com os dados dos 14 nichos

-- =============================================
-- 1. NICHOS PRINCIPAIS
-- =============================================
INSERT INTO niche_templates (id, name, description, icon, color, sort_order, has_delivery, has_pickup, has_table_service, has_counter_pickup, mimo_enabled, tab_system_enabled, rodizio_enabled, custom_orders_enabled, nutritional_info_enabled, weight_based_enabled, loyalty_type) VALUES
('acaiteria', 'Açaíteria / Sorveteria', 'Açaí, sorvetes, milkshakes e sobremesas geladas', 'IceCream', '#7C3AED', 1, true, true, false, true, true, false, false, false, false, false, 'stamps'),
('hamburgueria', 'Hamburgueria', 'Hambúrgueres artesanais, batatas e combos', 'Beef', '#DC2626', 2, true, true, true, true, true, false, false, false, false, false, 'points'),
('pizzaria', 'Pizzaria', 'Pizzas tradicionais e especiais, bordas recheadas', 'Pizza', '#EA580C', 3, true, true, true, false, true, false, false, false, false, false, 'stamps'),
('bar_pub', 'Bar / Pub', 'Bebidas, petiscos, comanda aberta e happy hour', 'Beer', '#CA8A04', 4, false, false, true, true, false, true, false, false, false, false, 'points'),
('sushi_japones', 'Sushi / Japonês', 'Sushis, sashimis, temakis e rodízio', 'Fish', '#0891B2', 5, true, true, true, false, true, false, true, false, false, false, 'points'),
('confeitaria', 'Confeitaria', 'Bolos, tortas, doces e encomendas', 'Cake', '#DB2777', 6, true, true, false, true, true, false, false, true, false, false, 'stamps'),
('fit_healthy', 'Fit / Healthy', 'Refeições saudáveis, low carb e fitness', 'Leaf', '#16A34A', 7, true, true, false, true, true, false, false, false, true, false, 'points'),
('acougue', 'Açougue', 'Carnes, cortes especiais e temperos', 'Beef', '#B91C1C', 8, true, true, false, true, false, false, false, false, false, true, 'points'),
('cafeteria', 'Cafeteria', 'Cafés especiais, bebidas e lanches rápidos', 'Coffee', '#78350F', 9, true, true, true, true, true, false, false, false, false, false, 'stamps'),
('marmitaria', 'Marmitaria', 'Marmitas, pratos do dia e refeições completas', 'UtensilsCrossed', '#EA580C', 10, true, true, false, true, true, false, false, false, false, false, 'stamps'),
('padaria', 'Padaria', 'Pães, frios, café da manhã e lanches', 'Croissant', '#D97706', 11, true, true, false, true, false, false, false, false, false, true, 'stamps'),
('restaurante', 'Restaurante', 'Restaurante completo com mesas e cardápio variado', 'UtensilsCrossed', '#7C3AED', 12, true, true, true, false, true, false, false, false, false, false, 'points'),
('sacolao', 'Sacolão / Hortifruti', 'Frutas, verduras, legumes e produtos naturais', 'Apple', '#22C55E', 13, true, true, false, true, false, false, false, false, false, true, 'points'),
('dark_kitchen', 'Dark Kitchen', 'Cozinha virtual com múltiplas marcas', 'ChefHat', '#1F2937', 14, true, false, false, false, true, false, false, false, false, false, 'points')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =============================================
-- 2. MÓDULOS BASE (para todos os nichos)
-- =============================================
-- Função helper para inserir módulos
CREATE OR REPLACE FUNCTION insert_niche_modules(p_niche_id TEXT, p_enabled_modules TEXT[])
RETURNS VOID AS $$
DECLARE
  modules TEXT[][] := ARRAY[
    ['menu', 'Cardápio Digital'],
    ['orders', 'Pedidos'],
    ['delivery', 'Delivery'],
    ['pos', 'PDV'],
    ['kitchen', 'Cozinha (KDS)'],
    ['tables', 'Mesas'],
    ['tabs', 'Comanda Aberta'],
    ['rodizio', 'Rodízio'],
    ['custom_orders', 'Encomendas'],
    ['nutritional', 'Info Nutricional'],
    ['weight', 'Venda por Peso'],
    ['loyalty', 'Fidelidade'],
    ['reports', 'Relatórios'],
    ['inventory', 'Estoque'],
    ['crm', 'CRM'],
    ['marketing', 'Marketing'],
    ['mimo', 'MIMO']
  ];
  m TEXT[];
  i INTEGER := 0;
BEGIN
  FOREACH m SLICE 1 IN ARRAY modules LOOP
    INSERT INTO niche_modules (niche_id, module_id, module_name, is_enabled, sort_order)
    VALUES (p_niche_id, m[1], m[2], m[1] = ANY(p_enabled_modules), i)
    ON CONFLICT (niche_id, module_id) DO UPDATE SET is_enabled = m[1] = ANY(p_enabled_modules);
    i := i + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Inserir módulos para cada nicho
SELECT insert_niche_modules('acaiteria', ARRAY['menu','orders','delivery','pos','kitchen','loyalty','reports','crm','mimo','marketing']);
SELECT insert_niche_modules('hamburgueria', ARRAY['menu','orders','delivery','pos','kitchen','tables','loyalty','reports','inventory','mimo']);
SELECT insert_niche_modules('pizzaria', ARRAY['menu','orders','delivery','pos','kitchen','tables','loyalty','reports','mimo']);
SELECT insert_niche_modules('bar_pub', ARRAY['menu','orders','pos','tables','tabs','reports','inventory']);
SELECT insert_niche_modules('sushi_japones', ARRAY['menu','orders','delivery','pos','kitchen','tables','rodizio','loyalty','reports','mimo']);
SELECT insert_niche_modules('confeitaria', ARRAY['menu','orders','delivery','pos','custom_orders','loyalty','reports','marketing']);
SELECT insert_niche_modules('fit_healthy', ARRAY['menu','orders','delivery','pos','nutritional','loyalty','reports','crm']);
SELECT insert_niche_modules('acougue', ARRAY['menu','orders','delivery','pos','weight','inventory','reports']);
SELECT insert_niche_modules('cafeteria', ARRAY['menu','orders','delivery','pos','loyalty','reports','crm','marketing']);
SELECT insert_niche_modules('marmitaria', ARRAY['menu','orders','delivery','pos','kitchen','loyalty','reports','inventory']);
SELECT insert_niche_modules('padaria', ARRAY['menu','orders','delivery','pos','weight','loyalty','reports','inventory']);
SELECT insert_niche_modules('restaurante', ARRAY['menu','orders','delivery','pos','kitchen','tables','loyalty','reports','inventory','crm','mimo']);
SELECT insert_niche_modules('sacolao', ARRAY['menu','orders','delivery','pos','weight','inventory','reports']);
SELECT insert_niche_modules('dark_kitchen', ARRAY['menu','orders','delivery','pos','kitchen','reports','inventory','marketing']);

-- Limpar função temporária
DROP FUNCTION IF EXISTS insert_niche_modules(TEXT, TEXT[]);

-- ======================================================================
-- FILE: supabase\migrations\20251215_10_niche_seed_categories.sql
-- ======================================================================

-- Seed: Categorias por nicho

-- Açaíteria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('acaiteria', 'Açaí', '🍇', 0),
('acaiteria', 'Adicionais', '🍓', 1),
('acaiteria', 'Sorvetes', '🍦', 2),
('acaiteria', 'Milkshakes', '🥤', 3),
('acaiteria', 'Bebidas', '💧', 4);

-- Hamburgueria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('hamburgueria', 'Hambúrgueres', '🍔', 0),
('hamburgueria', 'Combos', '🍟', 1),
('hamburgueria', 'Acompanhamentos', '🥔', 2),
('hamburgueria', 'Adicionais', '🧀', 3),
('hamburgueria', 'Sobremesas', '🍰', 4),
('hamburgueria', 'Bebidas', '🥤', 5);

-- Pizzaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('pizzaria', 'Pizzas Tradicionais', '🍕', 0),
('pizzaria', 'Pizzas Especiais', '⭐', 1),
('pizzaria', 'Pizzas Doces', '🍫', 2),
('pizzaria', 'Bordas', '🧀', 3),
('pizzaria', 'Bebidas', '🥤', 4);

-- Bar/Pub
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('bar_pub', 'Cervejas', '🍺', 0),
('bar_pub', 'Drinks', '🍸', 1),
('bar_pub', 'Doses', '🥃', 2),
('bar_pub', 'Porções', '🍗', 3),
('bar_pub', 'Não Alcoólicos', '🥤', 4);

-- Sushi
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('sushi_japones', 'Sushis', '🍣', 0),
('sushi_japones', 'Sashimis', '🐟', 1),
('sushi_japones', 'Temakis', '🍙', 2),
('sushi_japones', 'Hot Rolls', '🔥', 3),
('sushi_japones', 'Combos', '📦', 4),
('sushi_japones', 'Pratos Quentes', '🍜', 5),
('sushi_japones', 'Bebidas', '🥤', 6);

-- Confeitaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('confeitaria', 'Bolos', '🎂', 0),
('confeitaria', 'Tortas', '🥧', 1),
('confeitaria', 'Doces', '🍬', 2),
('confeitaria', 'Salgados', '🥟', 3),
('confeitaria', 'Bebidas', '☕', 4);

-- Fit/Healthy
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('fit_healthy', 'Pratos Principais', '🍽️', 0),
('fit_healthy', 'Saladas', '🥗', 1),
('fit_healthy', 'Bowls', '🥣', 2),
('fit_healthy', 'Smoothies', '🥤', 3),
('fit_healthy', 'Lanches', '🥪', 4),
('fit_healthy', 'Sobremesas Fit', '🍨', 5);

-- Açougue
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('acougue', 'Bovinos', '🥩', 0),
('acougue', 'Suínos', '🐷', 1),
('acougue', 'Aves', '🐔', 2),
('acougue', 'Linguiças', '🌭', 3),
('acougue', 'Churrasquinho', '🍢', 4);

-- Cafeteria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('cafeteria', 'Cafés', '☕', 0),
('cafeteria', 'Bebidas Geladas', '🧊', 1),
('cafeteria', 'Chás', '🍵', 2),
('cafeteria', 'Lanches', '🥪', 3),
('cafeteria', 'Doces', '🍰', 4);

-- Marmitaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('marmitaria', 'Marmitas', '🍱', 0),
('marmitaria', 'Pratos do Dia', '🍽️', 1),
('marmitaria', 'Acompanhamentos', '🥗', 2),
('marmitaria', 'Bebidas', '🥤', 3);

-- Padaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('padaria', 'Pães', '🍞', 0),
('padaria', 'Frios', '🧀', 1),
('padaria', 'Doces', '🧁', 2),
('padaria', 'Salgados', '🥐', 3),
('padaria', 'Café da Manhã', '☕', 4),
('padaria', 'Bebidas', '🥤', 5);

-- Restaurante
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('restaurante', 'Entradas', '🥗', 0),
('restaurante', 'Pratos Principais', '🍽️', 1),
('restaurante', 'Massas', '🍝', 2),
('restaurante', 'Grelhados', '🥩', 3),
('restaurante', 'Acompanhamentos', '🍚', 4),
('restaurante', 'Sobremesas', '🍮', 5),
('restaurante', 'Bebidas', '🥤', 6);

-- Sacolão
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('sacolao', 'Frutas', '🍎', 0),
('sacolao', 'Verduras', '🥬', 1),
('sacolao', 'Legumes', '🥕', 2),
('sacolao', 'Orgânicos', '🌱', 3),
('sacolao', 'Temperos', '🌿', 4);

-- Dark Kitchen
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('dark_kitchen', 'Pratos Principais', '🍽️', 0),
('dark_kitchen', 'Combos', '📦', 1),
('dark_kitchen', 'Acompanhamentos', '🍟', 2),
('dark_kitchen', 'Bebidas', '🥤', 3);

-- ======================================================================
-- FILE: supabase\migrations\20251215_11_niche_seed_products.sql
-- ======================================================================

-- Seed: Produtos por nicho (principais)

-- =============================================
-- AÇAÍTERIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, price, cost, unit, has_addons, is_customizable, sort_order) VALUES
('acaiteria', 'Açaí', 'Açaí 300ml', 15.00, 6.00, 'un', true, true, 1),
('acaiteria', 'Açaí', 'Açaí 500ml', 22.00, 9.00, 'un', true, true, 2),
('acaiteria', 'Açaí', 'Açaí 700ml', 28.00, 12.00, 'un', true, true, 3),
('acaiteria', 'Açaí', 'Açaí Premium 300ml', 20.00, 8.00, 'un', true, true, 4),
('acaiteria', 'Açaí', 'Açaí Premium 500ml', 28.00, 12.00, 'un', true, true, 5),
('acaiteria', 'Adicionais', 'Leite Ninho', 3.00, 1.50, 'porção', false, false, 1),
('acaiteria', 'Adicionais', 'Granola', 2.00, 0.80, 'porção', false, false, 2),
('acaiteria', 'Adicionais', 'Paçoca', 2.50, 1.00, 'porção', false, false, 3),
('acaiteria', 'Adicionais', 'Banana', 2.00, 0.70, 'porção', false, false, 4),
('acaiteria', 'Adicionais', 'Morango', 3.00, 1.50, 'porção', false, false, 5),
('acaiteria', 'Adicionais', 'Nutella', 5.00, 3.00, 'porção', false, false, 6),
('acaiteria', 'Adicionais', 'Leite Condensado', 2.50, 1.00, 'porção', false, false, 7),
('acaiteria', 'Adicionais', 'Ovomaltine', 3.50, 2.00, 'porção', false, false, 8),
('acaiteria', 'Bebidas', 'Água Mineral 500ml', 4.00, 1.50, 'un', false, false, 1),
('acaiteria', 'Bebidas', 'Coca-Cola Lata', 6.00, 3.50, 'un', false, false, 2),
('acaiteria', 'Bebidas', 'Guaraná Lata', 5.50, 3.00, 'un', false, false, 3);

-- =============================================
-- HAMBURGUERIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, prep_time_minutes, sort_order) VALUES
('hamburgueria', 'Hambúrgueres', 'X-Burguer', 'Pão, blend 150g, queijo, salada, maionese', 22.00, 10.00, 'un', 15, 1),
('hamburgueria', 'Hambúrgueres', 'X-Bacon', 'Com bacon crocante', 28.00, 13.00, 'un', 15, 2),
('hamburgueria', 'Hambúrgueres', 'X-Tudo', 'Completo', 35.00, 16.00, 'un', 18, 3),
('hamburgueria', 'Hambúrgueres', 'Duplo Cheddar', '2 blends, cheddar, cebola caramelizada', 38.00, 18.00, 'un', 18, 4),
('hamburgueria', 'Hambúrgueres', 'Smash Burger', '2 smash 90g', 25.00, 11.00, 'un', 10, 5),
('hamburgueria', 'Combos', 'Combo X-Burguer', 'Lanche + Batata P + Refri', 32.00, 14.00, 'un', NULL, 1),
('hamburgueria', 'Combos', 'Combo X-Bacon', 'Lanche + Batata P + Refri', 38.00, 17.00, 'un', NULL, 2),
('hamburgueria', 'Acompanhamentos', 'Batata Frita P', NULL, 12.00, 4.00, 'un', NULL, 1),
('hamburgueria', 'Acompanhamentos', 'Batata Frita M', NULL, 16.00, 6.00, 'un', NULL, 2),
('hamburgueria', 'Acompanhamentos', 'Batata Frita G', NULL, 22.00, 8.00, 'un', NULL, 3),
('hamburgueria', 'Acompanhamentos', 'Onion Rings', NULL, 18.00, 7.00, 'un', NULL, 4),
('hamburgueria', 'Adicionais', 'Bacon Extra', NULL, 5.00, 2.50, 'porção', NULL, 1),
('hamburgueria', 'Adicionais', 'Queijo Cheddar', NULL, 4.00, 2.00, 'fatia', NULL, 2),
('hamburgueria', 'Adicionais', 'Ovo', NULL, 3.00, 1.00, 'un', NULL, 3),
('hamburgueria', 'Bebidas', 'Coca-Cola Lata', NULL, 6.00, 3.50, 'un', NULL, 1),
('hamburgueria', 'Bebidas', 'Coca-Cola 600ml', NULL, 8.00, 4.50, 'un', NULL, 2),
('hamburgueria', 'Bebidas', 'Água Mineral', NULL, 3.50, 1.50, 'un', NULL, 3);

-- =============================================
-- PIZZARIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, prep_time_minutes, sort_order) VALUES
('pizzaria', 'Pizzas Tradicionais', 'Mussarela', 'Molho, mussarela, orégano', 45.00, 18.00, 'un', 25, 1),
('pizzaria', 'Pizzas Tradicionais', 'Calabresa', 'Mussarela, calabresa, cebola', 48.00, 20.00, 'un', 25, 2),
('pizzaria', 'Pizzas Tradicionais', 'Portuguesa', 'Presunto, ovo, cebola, azeitona', 52.00, 24.00, 'un', 25, 3),
('pizzaria', 'Pizzas Tradicionais', 'Margherita', 'Tomate, manjericão', 50.00, 22.00, 'un', 25, 4),
('pizzaria', 'Pizzas Tradicionais', 'Frango c/ Catupiry', NULL, 52.00, 24.00, 'un', 25, 5),
('pizzaria', 'Pizzas Especiais', '4 Queijos', NULL, 55.00, 26.00, 'un', 25, 1),
('pizzaria', 'Pizzas Especiais', 'Pepperoni', NULL, 55.00, 26.00, 'un', 25, 2),
('pizzaria', 'Pizzas Doces', 'Chocolate', NULL, 45.00, 18.00, 'un', 20, 1),
('pizzaria', 'Pizzas Doces', 'Romeu e Julieta', NULL, 48.00, 20.00, 'un', 20, 2),
('pizzaria', 'Bordas', 'Borda Catupiry', NULL, 8.00, 3.00, 'un', NULL, 1),
('pizzaria', 'Bordas', 'Borda Cheddar', NULL, 8.00, 3.00, 'un', NULL, 2),
('pizzaria', 'Bebidas', 'Coca-Cola 2L', NULL, 14.00, 7.00, 'un', NULL, 1),
('pizzaria', 'Bebidas', 'Guaraná 2L', NULL, 10.00, 6.00, 'un', NULL, 2);

-- =============================================
-- BAR/PUB
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, price, cost, unit, sort_order) VALUES
('bar_pub', 'Cervejas', 'Brahma Lata', 6.00, 3.00, 'un', 1),
('bar_pub', 'Cervejas', 'Heineken Long Neck', 12.00, 6.00, 'un', 2),
('bar_pub', 'Cervejas', 'Corona Long Neck', 14.00, 7.00, 'un', 3),
('bar_pub', 'Cervejas', 'Chopp 300ml', 8.00, 3.00, 'un', 4),
('bar_pub', 'Cervejas', 'Balde 5 Long Necks', 45.00, 22.00, 'un', 5),
('bar_pub', 'Drinks', 'Caipirinha', 18.00, 6.00, 'un', 1),
('bar_pub', 'Drinks', 'Caipiroska', 20.00, 7.00, 'un', 2),
('bar_pub', 'Drinks', 'Mojito', 22.00, 8.00, 'un', 3),
('bar_pub', 'Drinks', 'Gin Tônica', 22.00, 9.00, 'un', 4),
('bar_pub', 'Doses', 'Dose Whisky', 18.00, 8.00, 'dose', 1),
('bar_pub', 'Doses', 'Dose Vodka', 12.00, 5.00, 'dose', 2),
('bar_pub', 'Porções', 'Batata Frita', 28.00, 10.00, 'un', 1),
('bar_pub', 'Porções', 'Frango à Passarinho', 38.00, 15.00, 'un', 2),
('bar_pub', 'Porções', 'Calabresa Acebolada', 35.00, 14.00, 'un', 3),
('bar_pub', 'Não Alcoólicos', 'Água Mineral', 4.00, 1.50, 'un', 1),
('bar_pub', 'Não Alcoólicos', 'Refrigerante Lata', 6.00, 3.00, 'un', 2),
('bar_pub', 'Não Alcoólicos', 'Red Bull', 15.00, 8.00, 'un', 3);

-- =============================================
-- SUSHI
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, prep_time_minutes, sort_order) VALUES
('sushi_japones', 'Sushis', 'Sushi Salmão (2un)', NULL, 10.00, 5.00, 'dupla', 8, 1),
('sushi_japones', 'Sushis', 'Sushi Atum (2un)', NULL, 12.00, 6.00, 'dupla', 8, 2),
('sushi_japones', 'Sushis', 'Sushi Camarão (2un)', NULL, 14.00, 7.00, 'dupla', 8, 3),
('sushi_japones', 'Sashimis', 'Sashimi Salmão 5 fatias', NULL, 18.00, 9.00, 'porção', 5, 1),
('sushi_japones', 'Sashimis', 'Sashimi Atum 5 fatias', NULL, 22.00, 11.00, 'porção', 5, 2),
('sushi_japones', 'Temakis', 'Temaki Salmão', NULL, 22.00, 10.00, 'un', 8, 1),
('sushi_japones', 'Temakis', 'Temaki Atum', NULL, 25.00, 12.00, 'un', 8, 2),
('sushi_japones', 'Hot Rolls', 'Hot Roll 8 peças', NULL, 22.00, 10.00, 'porção', 12, 1),
('sushi_japones', 'Hot Rolls', 'Hot Filadélfia 8 peças', NULL, 26.00, 12.00, 'porção', 12, 2),
('sushi_japones', 'Combos', 'Combo Salmão 20 peças', NULL, 65.00, 28.00, 'un', 20, 1),
('sushi_japones', 'Combos', 'Combo Casal 30 peças', NULL, 95.00, 42.00, 'un', 25, 2),
('sushi_japones', 'Combos', 'Rodízio Adulto', '2 horas', 89.90, 35.00, 'pessoa', NULL, 3),
('sushi_japones', 'Pratos Quentes', 'Yakisoba', NULL, 35.00, 14.00, 'un', 15, 1),
('sushi_japones', 'Pratos Quentes', 'Lámen', NULL, 38.00, 16.00, 'un', 18, 2);

-- =============================================
-- CONFEITARIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, is_customizable, sort_order) VALUES
('confeitaria', 'Bolos', 'Fatia Bolo Chocolate', NULL, 14.00, 5.00, 'fatia', false, 1),
('confeitaria', 'Bolos', 'Fatia Bolo Cenoura', NULL, 12.00, 4.00, 'fatia', false, 2),
('confeitaria', 'Bolos', 'Fatia Red Velvet', NULL, 16.00, 6.00, 'fatia', false, 3),
('confeitaria', 'Bolos', 'Bolo Chocolate 1kg', 'Encomenda 48h', 80.00, 35.00, 'un', false, 4),
('confeitaria', 'Bolos', 'Bolo Personalizado 1kg', 'Consulte opções', 120.00, 50.00, 'un', true, 5),
('confeitaria', 'Tortas', 'Torta Limão (fatia)', NULL, 14.00, 5.00, 'fatia', false, 1),
('confeitaria', 'Tortas', 'Cheesecake (fatia)', NULL, 18.00, 7.00, 'fatia', false, 2),
('confeitaria', 'Doces', 'Brigadeiro', NULL, 3.50, 1.00, 'un', false, 1),
('confeitaria', 'Doces', 'Beijinho', NULL, 3.50, 1.00, 'un', false, 2),
('confeitaria', 'Doces', 'Trufa', NULL, 5.00, 2.00, 'un', false, 3),
('confeitaria', 'Doces', 'Brownie', NULL, 8.00, 3.00, 'un', false, 4),
('confeitaria', 'Doces', 'Cento Brigadeiro', 'Encomenda', 120.00, 45.00, '100un', false, 5),
('confeitaria', 'Salgados', 'Coxinha', NULL, 6.00, 2.00, 'un', false, 1),
('confeitaria', 'Salgados', 'Empada', NULL, 6.00, 2.00, 'un', false, 2),
('confeitaria', 'Salgados', 'Cento Salgados', 'Encomenda', 180.00, 70.00, '100un', false, 3),
('confeitaria', 'Bebidas', 'Café Expresso', NULL, 5.00, 1.50, 'un', false, 1),
('confeitaria', 'Bebidas', 'Cappuccino', NULL, 9.00, 3.00, 'un', false, 2);

-- =============================================
-- FIT/HEALTHY (com nutricionais)
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, price, cost, unit, calories, protein_g, carbs_g, fat_g, sort_order) VALUES
('fit_healthy', 'Pratos Principais', 'Frango + Legumes', 28.00, 12.00, 'un', 350, 40, 15, 12, 1),
('fit_healthy', 'Pratos Principais', 'Salmão + Quinoa', 42.00, 20.00, 'un', 450, 35, 30, 18, 2),
('fit_healthy', 'Pratos Principais', 'Tilápia + Arroz Integral', 32.00, 14.00, 'un', 380, 32, 35, 10, 3),
('fit_healthy', 'Saladas', 'Salada Caesar Fit', 26.00, 11.00, 'un', 280, 28, 12, 14, 1),
('fit_healthy', 'Saladas', 'Salada Proteica', 32.00, 14.00, 'un', 380, 40, 15, 16, 2),
('fit_healthy', 'Bowls', 'Bowl de Atum', 32.00, 14.00, 'un', 380, 32, 35, 12, 1),
('fit_healthy', 'Bowls', 'Açaí Fit (sem açúcar)', 22.00, 9.00, '300ml', 250, 5, 30, 12, 2),
('fit_healthy', 'Smoothies', 'Smoothie Verde Detox', 16.00, 6.00, 'un', 120, 3, 25, 2, 1),
('fit_healthy', 'Smoothies', 'Smoothie Proteico', 22.00, 10.00, 'un', 350, 30, 35, 8, 2),
('fit_healthy', 'Lanches', 'Wrap Integral Frango', 22.00, 9.00, 'un', 320, 28, 30, 10, 1),
('fit_healthy', 'Sobremesas Fit', 'Brownie Fit', 10.00, 4.00, 'un', 150, 6, 18, 6, 1);

-- =============================================
-- KITS SUGERIDOS
-- =============================================
INSERT INTO niche_suggested_kits (niche_id, kit_id) VALUES
('acaiteria', 'acai_toppings'),
('acaiteria', 'icecream_flavors'),
('acaiteria', 'beverages_sodas'),
('hamburgueria', 'burger_proteins'),
('hamburgueria', 'burger_toppings'),
('hamburgueria', 'beverages_sodas'),
('pizzaria', 'pizza_flavors'),
('pizzaria', 'beverages_sodas'),
('bar_pub', 'beverages_beer'),
('bar_pub', 'beverages_energy'),
('sushi_japones', 'sushi_pieces'),
('sushi_japones', 'beverages_sodas'),
('confeitaria', 'bakery_cakes'),
('confeitaria', 'candy_chocolates'),
('confeitaria', 'coffee_drinks'),
('fit_healthy', 'fit_meals'),
('cafeteria', 'coffee_drinks'),
('marmitaria', 'beverages_sodas'),
('padaria', 'coffee_drinks'),
('padaria', 'beverages_sodas'),
('restaurante', 'beverages_sodas'),
('restaurante', 'beverages_beer'),
('dark_kitchen', 'beverages_sodas')
ON CONFLICT (niche_id, kit_id) DO NOTHING;

-- ======================================================================
-- FILE: supabase\migrations\20251215_12_loyalty_complete.sql
-- ======================================================================

-- Migration: Sistema Completo de Fidelidade e Retenção
-- Baseado na especificação Tropical Freeze OS

-- ============================================
-- 1. CAMPO BIRTH_DATE EM CUSTOMERS
-- ============================================
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_date_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_bonus_given BOOLEAN DEFAULT FALSE;

-- Índice para busca de aniversariantes
CREATE INDEX IF NOT EXISTS idx_customers_birth_date ON public.customers(birth_date);

-- ============================================
-- 2. CONFIGURAÇÃO DE FIDELIDADE POR LOJA
-- ============================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS loyalty_active BOOLEAN DEFAULT TRUE,

-- Configuração de Aniversário
ADD COLUMN IF NOT EXISTS loyalty_birthday_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS loyalty_birthday_discount_percent INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS loyalty_birthday_window VARCHAR(10) DEFAULT 'week',

-- Configuração de Bônus de Cadastro
ADD COLUMN IF NOT EXISTS loyalty_registration_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS loyalty_registration_bonus_stamps INTEGER DEFAULT 2,

-- Configuração de Retenção (Régua de Relacionamento)
ADD COLUMN IF NOT EXISTS loyalty_retention_first_warning_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS loyalty_retention_second_warning_days INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS loyalty_retention_second_warning_discount INTEGER DEFAULT 15,

-- Configuração de Pontos/Selos
ADD COLUMN IF NOT EXISTS loyalty_calculation_type VARCHAR(10) DEFAULT 'order',
ADD COLUMN IF NOT EXISTS loyalty_order_value_per_stamp DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS loyalty_stamps_to_reward INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS loyalty_reward_type VARCHAR(20) DEFAULT 'credit',
ADD COLUMN IF NOT EXISTS loyalty_reward_value DECIMAL(10,2) DEFAULT 15.00;

-- ============================================
-- 3. TABELA DE MENSAGENS DE RETENÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.retention_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  trigger_type VARCHAR(20) NOT NULL, -- 'first_warning', 'second_warning', 'birthday'
  
  message_template TEXT NOT NULL,
  include_coupon BOOLEAN DEFAULT FALSE,
  coupon_code VARCHAR(50),
  coupon_discount_percent INTEGER,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens padrão para cada loja (trigger function)
CREATE OR REPLACE FUNCTION create_default_retention_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Mensagem de primeiro aviso (30 dias)
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon)
  VALUES (
    NEW.id,
    'first_warning',
    'Oi {nome}! 👋 Faz tempo que não te vemos por aqui. Que tal um {produto} hoje? Estamos com saudades! 💜',
    FALSE
  );
  
  -- Mensagem de segundo aviso (60 dias)
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon, coupon_code, coupon_discount_percent)
  VALUES (
    NEW.id,
    'second_warning',
    'Oi {nome}! 😢 Estamos com muitas saudades! Preparamos um presente especial pra você voltar: use o cupom VOLTA15 e ganhe 15% de desconto! 🎁',
    TRUE,
    'VOLTA15',
    15
  );
  
  -- Mensagem de aniversário
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon, coupon_discount_percent)
  VALUES (
    NEW.id,
    'birthday',
    '🎂 Parabéns, {nome}! Hoje é seu dia especial e queremos comemorar com você! Ganhe {desconto}% de desconto no seu pedido. Feliz Aniversário! 🎉',
    TRUE,
    10
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar mensagens ao criar loja (só se não existir)
DROP TRIGGER IF EXISTS trigger_create_retention_messages ON public.stores;
CREATE TRIGGER trigger_create_retention_messages
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION create_default_retention_messages();

-- ============================================
-- 4. LOG DE CONTATOS DE RETENÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.retention_contact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  trigger_type VARCHAR(20) NOT NULL,
  message_sent TEXT,
  channel VARCHAR(20) DEFAULT 'whatsapp',
  
  coupon_code VARCHAR(50),
  coupon_used BOOLEAN DEFAULT FALSE,
  coupon_used_order_id UUID REFERENCES public.orders(id),
  
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_retention_log_customer ON public.retention_contact_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_retention_log_store ON public.retention_contact_log(store_id);

-- ============================================
-- 5. VIEW PARA SEMÁFORO DE CLIENTES
-- ============================================
CREATE OR REPLACE VIEW public.customer_retention_status AS
SELECT 
  c.id,
  c.store_id,
  c.name,
  c.phone,
  c.email,
  c.birth_date,
  c.created_at,
  cl.points_balance,
  cl.stamps_current,
  cl.stamps_completed,
  cl.total_orders,
  cl.total_spent,
  cl.last_order_at,
  
  -- Dias desde último pedido
  COALESCE(
    EXTRACT(DAY FROM NOW() - cl.last_order_at)::INTEGER,
    EXTRACT(DAY FROM NOW() - c.created_at)::INTEGER
  ) AS days_inactive,
  
  -- Status do semáforo
  CASE
    WHEN cl.last_order_at IS NULL AND c.created_at > NOW() - INTERVAL '7 days' THEN 'new'
    WHEN cl.last_order_at > NOW() - INTERVAL '30 days' THEN 'active'
    WHEN cl.last_order_at > NOW() - INTERVAL '60 days' THEN 'warning'
    WHEN cl.last_order_at <= NOW() - INTERVAL '60 days' THEN 'risk'
    WHEN cl.last_order_at IS NULL THEN 'inactive'
    ELSE 'unknown'
  END AS retention_status,
  
  -- É aniversariante?
  CASE
    WHEN c.birth_date IS NOT NULL 
      AND EXTRACT(MONTH FROM c.birth_date) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(DAY FROM c.birth_date) BETWEEN EXTRACT(DAY FROM NOW()) - 3 AND EXTRACT(DAY FROM NOW()) + 3
    THEN TRUE
    ELSE FALSE
  END AS is_birthday_period,
  
  -- Segmento VIP
  CASE
    WHEN cl.total_spent >= 500 THEN 'vip'
    WHEN cl.total_orders >= 10 THEN 'frequent'
    WHEN cl.total_orders >= 3 THEN 'regular'
    WHEN cl.total_orders >= 1 THEN 'new'
    ELSE 'prospect'
  END AS customer_segment

FROM public.customers c
LEFT JOIN public.customer_loyalty cl ON c.id = cl.customer_id AND c.store_id = cl.store_id;

-- ============================================
-- 6. FUNÇÃO PARA CREDITAR PONTOS
-- ============================================
CREATE OR REPLACE FUNCTION credit_loyalty_points(
  p_store_id UUID,
  p_customer_id UUID,
  p_order_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_store RECORD;
  v_loyalty RECORD;
  v_points_to_add INTEGER;
  v_loyalty_id UUID;
BEGIN
  -- Buscar config da loja
  SELECT 
    loyalty_active,
    loyalty_calculation_type,
    loyalty_order_value_per_stamp,
    loyalty_stamps_to_reward,
    loyalty_reward_type,
    loyalty_reward_value
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;
  
  -- Se fidelidade não está ativa, retorna 0
  IF NOT v_store.loyalty_active THEN
    RETURN 0;
  END IF;
  
  -- Calcular pontos baseado no tipo
  IF v_store.loyalty_calculation_type = 'order' THEN
    v_points_to_add := 1; -- 1 selo por pedido
  ELSE
    -- Pontos por valor (ex: R$ 20 = 1 selo)
    v_points_to_add := FLOOR(p_order_total / v_store.loyalty_order_value_per_stamp)::INTEGER;
  END IF;
  
  -- Se não ganha nenhum ponto, retorna
  IF v_points_to_add <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Buscar ou criar registro de fidelidade do cliente
  SELECT id, stamps_current INTO v_loyalty
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;
  
  IF v_loyalty.id IS NULL THEN
    -- Criar novo registro
    INSERT INTO public.customer_loyalty (customer_id, store_id, stamps_current, points_balance, total_orders, total_spent, last_order_at)
    VALUES (p_customer_id, p_store_id, v_points_to_add, v_points_to_add, 1, p_order_total, NOW())
    RETURNING id INTO v_loyalty_id;
  ELSE
    -- Atualizar registro existente
    UPDATE public.customer_loyalty
    SET 
      stamps_current = stamps_current + v_points_to_add,
      points_balance = points_balance + v_points_to_add,
      points_earned_total = points_earned_total + v_points_to_add,
      total_orders = total_orders + 1,
      total_spent = total_spent + p_order_total,
      last_order_at = NOW(),
      updated_at = NOW()
    WHERE id = v_loyalty.id;
    
    v_loyalty_id := v_loyalty.id;
  END IF;
  
  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    order_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty_id,
    p_store_id,
    p_order_id,
    'earn',
    v_points_to_add,
    v_points_to_add,
    'Pedido #' || p_order_id::TEXT
  );
  
  RETURN v_points_to_add;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNÇÃO PARA DAR BÔNUS DE CADASTRO
-- ============================================
CREATE OR REPLACE FUNCTION give_registration_bonus(
  p_store_id UUID,
  p_customer_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_store RECORD;
  v_customer RECORD;
  v_loyalty_id UUID;
  v_bonus INTEGER;
BEGIN
  -- Verificar se já recebeu bônus
  SELECT registration_bonus_given INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id;
  
  IF v_customer.registration_bonus_given THEN
    RETURN 0;
  END IF;
  
  -- Buscar config da loja
  SELECT 
    loyalty_active,
    loyalty_registration_active,
    loyalty_registration_bonus_stamps
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;
  
  -- Verificar se bônus está ativo
  IF NOT v_store.loyalty_active OR NOT v_store.loyalty_registration_active THEN
    RETURN 0;
  END IF;
  
  v_bonus := v_store.loyalty_registration_bonus_stamps;
  
  -- Buscar ou criar registro de fidelidade
  SELECT id INTO v_loyalty_id
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;
  
  IF v_loyalty_id IS NULL THEN
    INSERT INTO public.customer_loyalty (customer_id, store_id, stamps_current, points_balance)
    VALUES (p_customer_id, p_store_id, v_bonus, v_bonus)
    RETURNING id INTO v_loyalty_id;
  ELSE
    UPDATE public.customer_loyalty
    SET 
      stamps_current = stamps_current + v_bonus,
      points_balance = points_balance + v_bonus,
      points_earned_total = points_earned_total + v_bonus,
      updated_at = NOW()
    WHERE id = v_loyalty_id;
  END IF;
  
  -- Marcar que recebeu bônus
  UPDATE public.customers
  SET 
    registration_bonus_given = TRUE,
    registration_completed = TRUE
  WHERE id = p_customer_id;
  
  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty_id,
    p_store_id,
    'bonus',
    v_bonus,
    v_bonus,
    'Bônus de cadastro completo'
  );
  
  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO PARA RESGATAR PONTOS
-- ============================================
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_store_id UUID,
  p_customer_id UUID,
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_store RECORD;
  v_loyalty RECORD;
  v_stamps_required INTEGER;
  v_reward_value DECIMAL;
BEGIN
  -- Buscar config da loja
  SELECT 
    loyalty_stamps_to_reward,
    loyalty_reward_type,
    loyalty_reward_value
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;
  
  v_stamps_required := v_store.loyalty_stamps_to_reward;
  v_reward_value := v_store.loyalty_reward_value;
  
  -- Buscar saldo do cliente
  SELECT id, stamps_current INTO v_loyalty
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;
  
  -- Verificar se tem selos suficientes
  IF v_loyalty.stamps_current < v_stamps_required THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Selos insuficientes',
      'stamps_current', COALESCE(v_loyalty.stamps_current, 0),
      'stamps_required', v_stamps_required
    );
  END IF;
  
  -- Deduzir selos
  UPDATE public.customer_loyalty
  SET 
    stamps_current = stamps_current - v_stamps_required,
    points_redeemed_total = points_redeemed_total + v_stamps_required,
    stamps_completed = stamps_completed + 1,
    updated_at = NOW()
  WHERE id = v_loyalty.id;
  
  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    order_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty.id,
    p_store_id,
    p_order_id,
    'redeem',
    -v_stamps_required,
    -v_stamps_required,
    'Resgate de prêmio - R$ ' || v_reward_value::TEXT
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'reward_type', v_store.loyalty_reward_type,
    'reward_value', v_reward_value,
    'stamps_used', v_stamps_required,
    'stamps_remaining', v_loyalty.stamps_current - v_stamps_required
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. RLS POLICIES
-- ============================================
ALTER TABLE public.retention_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_contact_log ENABLE ROW LEVEL SECURITY;

-- Políticas para retention_messages
 DROP POLICY IF EXISTS "retention_messages_select" ON public.retention_messages;
CREATE POLICY "retention_messages_select" ON public.retention_messages
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

 DROP POLICY IF EXISTS "retention_messages_insert" ON public.retention_messages;
CREATE POLICY "retention_messages_insert" ON public.retention_messages
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid() AND role::text IN ('owner', 'manager')
    )
  );

 DROP POLICY IF EXISTS "retention_messages_update" ON public.retention_messages;
CREATE POLICY "retention_messages_update" ON public.retention_messages
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid() AND role::text IN ('owner', 'manager')
    )
  );

-- Políticas para retention_contact_log
 DROP POLICY IF EXISTS "retention_log_select" ON public.retention_contact_log;
CREATE POLICY "retention_log_select" ON public.retention_contact_log
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

 DROP POLICY IF EXISTS "retention_log_insert" ON public.retention_contact_log;
CREATE POLICY "retention_log_insert" ON public.retention_contact_log
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================
COMMENT ON COLUMN public.stores.loyalty_calculation_type IS 'order = 1 selo por pedido, value = selos por valor gasto';
COMMENT ON COLUMN public.stores.loyalty_birthday_window IS 'day, week ou month';
COMMENT ON VIEW public.customer_retention_status IS 'View com status de retenção (semáforo) de cada cliente';
COMMENT ON FUNCTION credit_loyalty_points IS 'Credita pontos/selos ao cliente após pedido';
COMMENT ON FUNCTION give_registration_bonus IS 'Dá bônus de selos ao completar cadastro';
COMMENT ON FUNCTION redeem_loyalty_points IS 'Resgata pontos/selos por desconto';
