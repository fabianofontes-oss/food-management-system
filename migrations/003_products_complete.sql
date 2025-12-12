-- Migration: Sistema Completo de Produtos
-- Produtos simples, compostos, unidades, tempo de preparo, categorias

-- Tabela de Categorias de Produtos
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Unidades de Medida
CREATE TABLE IF NOT EXISTS measurement_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  is_fractional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir unidades padrão
INSERT INTO measurement_units (code, name, type, is_fractional) VALUES
  ('kg', 'Quilograma', 'weight', true),
  ('g', 'Grama', 'weight', true),
  ('l', 'Litro', 'volume', true),
  ('ml', 'Mililitro', 'volume', true),
  ('un', 'Unidade', 'unit', false),
  ('pc', 'Peça', 'unit', false),
  ('cx', 'Caixa', 'unit', false),
  ('pct', 'Pacote', 'unit', false),
  ('dz', 'Dúzia', 'unit', false)
ON CONFLICT (code) DO NOTHING;

-- Atualizar tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES measurement_units(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_composed BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_kitchen BOOLEAN DEFAULT false;

-- Tabela de Ingredientes
CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL,
  unit_id UUID REFERENCES measurement_units(id),
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_unit ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
