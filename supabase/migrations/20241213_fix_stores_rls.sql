-- ============================================================================
-- FIX: Adicionar RLS policies para acesso público às lojas
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- 1. Garantir que RLS está habilitado (se já estiver, não faz nada)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Policy para leitura PÚBLICA de lojas ativas (cardápio público)
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
CREATE POLICY "Public can view active stores"
  ON stores FOR SELECT
  USING (is_active = true);

-- 3. Policy para leitura PÚBLICA de categorias de lojas ativas
DROP POLICY IF EXISTS "Public can view categories of active stores" ON categories;
CREATE POLICY "Public can view categories of active stores"
  ON categories FOR SELECT
  USING (
    is_active = true AND
    store_id IN (SELECT id FROM stores WHERE is_active = true)
  );

-- 4. Policy para leitura PÚBLICA de produtos de lojas ativas
DROP POLICY IF EXISTS "Public can view products of active stores" ON products;
CREATE POLICY "Public can view products of active stores"
  ON products FOR SELECT
  USING (
    is_active = true AND
    store_id IN (SELECT id FROM stores WHERE is_active = true)
  );

-- 5. Policy para usuários autenticados gerenciarem suas lojas
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON stores;
CREATE POLICY "Authenticated users can manage their stores"
  ON stores FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- 6. Policy para usuários autenticados gerenciarem categorias
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (
      SELECT s.id FROM stores s
      INNER JOIN users u ON s.tenant_id = u.tenant_id
      WHERE u.id = auth.uid()
    )
  );

-- 7. Policy para usuários autenticados gerenciarem produtos
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (
      SELECT s.id FROM stores s
      INNER JOIN users u ON s.tenant_id = u.tenant_id
      WHERE u.id = auth.uid()
    )
  );
