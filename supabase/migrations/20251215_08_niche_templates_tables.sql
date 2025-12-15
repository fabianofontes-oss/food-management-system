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
CREATE POLICY "niche_templates_read_all" ON niche_templates FOR SELECT USING (true);
CREATE POLICY "niche_modules_read_all" ON niche_modules FOR SELECT USING (true);
CREATE POLICY "niche_categories_read_all" ON niche_categories FOR SELECT USING (true);
CREATE POLICY "niche_products_read_all" ON niche_products FOR SELECT USING (true);
CREATE POLICY "niche_suggested_kits_read_all" ON niche_suggested_kits FOR SELECT USING (true);

-- Políticas de escrita apenas para superadmin
CREATE POLICY "niche_templates_write_superadmin" ON niche_templates 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "niche_modules_write_superadmin" ON niche_modules 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "niche_categories_write_superadmin" ON niche_categories 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "niche_products_write_superadmin" ON niche_products 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

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
