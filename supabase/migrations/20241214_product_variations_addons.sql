-- Variações de produto (tamanhos: 300ml, 500ml, 1L, etc)
CREATE TABLE IF NOT EXISTS product_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna has_variations na tabela products se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_variations') THEN
    ALTER TABLE products ADD COLUMN has_variations BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Grupos de adicionais (ex: "Frutas", "Caldas", "Extras")
CREATE TABLE IF NOT EXISTS addon_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 10,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens adicionais
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  addon_group_id UUID NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity DECIMAL(10,2), -- quantidade em g, ml, un
  unit VARCHAR(10) DEFAULT 'g', -- g, ml, un
  image_url TEXT, -- foto do adicional
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se não existirem (para migração)
ALTER TABLE addons ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2);
ALTER TABLE addons ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'g';
ALTER TABLE addons ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Relação produto <-> grupo de adicionais
CREATE TABLE IF NOT EXISTS product_addon_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_group_id UUID NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, addon_group_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_variations_product ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_addon_groups_store ON addon_groups(store_id);
CREATE INDEX IF NOT EXISTS idx_addons_group ON addons(addon_group_id);
CREATE INDEX IF NOT EXISTS idx_product_addon_groups_product ON product_addon_groups(product_id);

-- RLS Policies
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addon_groups ENABLE ROW LEVEL SECURITY;

-- Policies para product_variations (herda do produto)
CREATE POLICY "product_variations_select" ON product_variations FOR SELECT USING (true);
CREATE POLICY "product_variations_insert" ON product_variations FOR INSERT WITH CHECK (true);
CREATE POLICY "product_variations_update" ON product_variations FOR UPDATE USING (true);
CREATE POLICY "product_variations_delete" ON product_variations FOR DELETE USING (true);

-- Policies para addon_groups
CREATE POLICY "addon_groups_select" ON addon_groups FOR SELECT USING (true);
CREATE POLICY "addon_groups_insert" ON addon_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "addon_groups_update" ON addon_groups FOR UPDATE USING (true);
CREATE POLICY "addon_groups_delete" ON addon_groups FOR DELETE USING (true);

-- Policies para addons
CREATE POLICY "addons_select" ON addons FOR SELECT USING (true);
CREATE POLICY "addons_insert" ON addons FOR INSERT WITH CHECK (true);
CREATE POLICY "addons_update" ON addons FOR UPDATE USING (true);
CREATE POLICY "addons_delete" ON addons FOR DELETE USING (true);

-- Policies para product_addon_groups
CREATE POLICY "product_addon_groups_select" ON product_addon_groups FOR SELECT USING (true);
CREATE POLICY "product_addon_groups_insert" ON product_addon_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "product_addon_groups_update" ON product_addon_groups FOR UPDATE USING (true);
CREATE POLICY "product_addon_groups_delete" ON product_addon_groups FOR DELETE USING (true);
