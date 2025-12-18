-- ============================================================================
-- FIX: Adicionar RLS policies para acesso público às lojas
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REMOVER POLICIES ANTIGAS (evitar conflitos)
-- ============================================================================
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON stores;
DROP POLICY IF EXISTS "Store users can view their stores" ON stores;
DROP POLICY IF EXISTS "Public can view categories of active stores" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
DROP POLICY IF EXISTS "Store users can manage categories" ON categories;
DROP POLICY IF EXISTS "Public can view products of active stores" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Store users can manage products" ON products;

-- ============================================================================
-- STORES: Políticas de acesso
-- ============================================================================

-- Qualquer pessoa pode ver lojas ativas (cardápio público)
CREATE POLICY "Public can view active stores"
  ON stores FOR SELECT
  USING (is_active = true);

-- Usuários autenticados podem gerenciar lojas onde estão cadastrados via store_users
CREATE POLICY "Store users can manage their stores"
  ON stores FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    id IN (
      SELECT store_id FROM store_users WHERE user_id = auth.uid()
    )
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

-- Usuários autenticados podem gerenciar categorias das suas lojas
CREATE POLICY "Store users can manage categories"
  ON categories FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (
      SELECT store_id FROM store_users WHERE user_id = auth.uid()
    )
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

-- Usuários autenticados podem gerenciar produtos das suas lojas
CREATE POLICY "Store users can manage products"
  ON products FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (
      SELECT store_id FROM store_users WHERE user_id = auth.uid()
    )
  );
