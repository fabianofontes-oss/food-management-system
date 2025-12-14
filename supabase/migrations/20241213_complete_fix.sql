-- ============================================================================
-- FIX COMPLETO: RLS Policies + Função get_user_stores
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REMOVER POLICIES ANTIGAS
-- ============================================================================
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON stores;

DROP POLICY IF EXISTS "Public can view categories of active stores" ON categories;
DROP POLICY IF EXISTS "Store users can manage categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

DROP POLICY IF EXISTS "Public can view products of active stores" ON products;
DROP POLICY IF EXISTS "Store users can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

DROP POLICY IF EXISTS "Users can read their own store memberships" ON store_users;
DROP POLICY IF EXISTS "Store owners can manage store users" ON store_users;

-- ============================================================================
-- STORES: Políticas de acesso
-- ============================================================================

-- Qualquer pessoa pode ver lojas ativas
CREATE POLICY "Public can view active stores"
  ON stores FOR SELECT
  USING (is_active = true);

-- Usuários podem gerenciar lojas onde estão cadastrados
CREATE POLICY "Store users can manage their stores"
  ON stores FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- CATEGORIES: Políticas de acesso
-- ============================================================================

-- Qualquer pessoa pode ver categorias ativas de lojas ativas
CREATE POLICY "Public can view categories of active stores"
  ON categories FOR SELECT
  USING (
    is_active = true AND
    store_id IN (SELECT id FROM stores WHERE is_active = true)
  );

-- Usuários podem gerenciar categorias das suas lojas
CREATE POLICY "Store users can manage categories"
  ON categories FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- PRODUCTS: Políticas de acesso
-- ============================================================================

-- Qualquer pessoa pode ver produtos ativos de lojas ativas
CREATE POLICY "Public can view products of active stores"
  ON products FOR SELECT
  USING (
    is_active = true AND
    store_id IN (SELECT id FROM stores WHERE is_active = true)
  );

-- Usuários podem gerenciar produtos das suas lojas
CREATE POLICY "Store users can manage products"
  ON products FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- STORE_USERS: Políticas de acesso
-- ============================================================================

-- Usuários podem ver suas próprias associações
CREATE POLICY "Users can read their own store memberships"
  ON store_users FOR SELECT
  USING (auth.uid() = user_id);

-- Owners podem gerenciar usuários da loja
CREATE POLICY "Store owners can manage store users"
  ON store_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'OWNER'
    )
  );

-- ============================================================================
-- FUNÇÃO: get_user_stores (opcional, para compatibilidade)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_stores()
RETURNS TABLE (
  store_id UUID,
  store_slug TEXT,
  store_name TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.slug::TEXT,
    s.name::TEXT,
    su.role::TEXT
  FROM stores s
  INNER JOIN store_users su ON s.id = su.store_id
  WHERE su.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver policies criadas
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
