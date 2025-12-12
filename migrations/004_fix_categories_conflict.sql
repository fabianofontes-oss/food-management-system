-- Migration: 004 - Correção do Conflito de Categorias
-- Unifica product_categories em categories e adiciona RLS policies

-- 1. Habilitar RLS na tabela categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar tenant_id à tabela categories (se não existir)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Preencher tenant_id baseado no store_id para registros existentes
UPDATE categories c
SET tenant_id = s.tenant_id
FROM stores s
WHERE c.store_id = s.id AND c.tenant_id IS NULL;

-- 4. Adicionar campos extras de product_categories em categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(20);

-- 5. Migrar dados de product_categories para categories (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    -- Inserir categorias que não existem
    INSERT INTO categories (id, tenant_id, store_id, name, description, sort_order, icon, color, is_active, created_at, updated_at)
    SELECT 
      pc.id, 
      pc.tenant_id, 
      pc.store_id, 
      pc.name, 
      pc.description, 
      pc.display_order, 
      pc.icon, 
      pc.color, 
      pc.is_active, 
      pc.created_at, 
      pc.updated_at
    FROM product_categories pc
    WHERE NOT EXISTS (
      SELECT 1 FROM categories c WHERE c.id = pc.id
    );
    
    -- Atualizar categorias existentes com campos extras
    UPDATE categories c
    SET 
      icon = pc.icon,
      color = pc.color
    FROM product_categories pc
    WHERE c.id = pc.id;
  END IF;
END $$;

-- 6. Remover a constraint antiga de category_id se existir referência a product_categories
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    -- Remover tabela product_categories (CASCADE remove as FKs)
    DROP TABLE IF EXISTS product_categories CASCADE;
  END IF;
END $$;

-- 7. Garantir que a FK de products aponta para categories
DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_category_id_fkey' 
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_category_id_fkey;
  END IF;
  
  -- Adicionar constraint correta
  ALTER TABLE products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES categories(id) 
    ON DELETE SET NULL;
END $$;

-- 8. Criar RLS Policies para categories
CREATE POLICY "Users can view categories from their tenant"
  ON categories FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories in their tenant"
  ON categories FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories in their tenant"
  ON categories FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories in their tenant"
  ON categories FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- 9. Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_store ON categories(tenant_id, store_id);

-- 10. Comentários
COMMENT ON COLUMN categories.tenant_id IS 'Tenant proprietário da categoria (isolamento multi-tenant)';
COMMENT ON COLUMN categories.icon IS 'Ícone da categoria (ex: lucide icon name)';
COMMENT ON COLUMN categories.color IS 'Cor da categoria em hex (ex: #FF5733)';
