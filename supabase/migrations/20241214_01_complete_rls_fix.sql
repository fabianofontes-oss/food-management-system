-- ============================================================================
-- FIX COMPLETO: RLS Policies para TODO o sistema
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. REMOVER TODAS AS POLICIES ANTIGAS
-- ============================================================================

-- Tenants
DROP POLICY IF EXISTS "Super admin can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON tenants;
DROP POLICY IF EXISTS "Super admin can manage tenants" ON tenants;

-- Stores
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON stores;
DROP POLICY IF EXISTS "Super admin can view all stores" ON stores;

-- Store Users
DROP POLICY IF EXISTS "Users can read their own store memberships" ON store_users;
DROP POLICY IF EXISTS "Store owners can manage store users" ON store_users;

-- Categories
DROP POLICY IF EXISTS "Public can view categories of active stores" ON categories;
DROP POLICY IF EXISTS "Store users can manage categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

-- Products
DROP POLICY IF EXISTS "Public can view products of active stores" ON products;
DROP POLICY IF EXISTS "Store users can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Orders
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Store users can view orders" ON orders;
DROP POLICY IF EXISTS "Store users can manage orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "Public can create order items" ON order_items;
DROP POLICY IF EXISTS "Store users can view order items" ON order_items;

-- Customers
DROP POLICY IF EXISTS "Store users can view customers" ON customers;
DROP POLICY IF EXISTS "Store users can manage customers" ON customers;
DROP POLICY IF EXISTS "Public can create customers" ON customers;

-- ============================================================================
-- 3. TENANTS: Super Admin pode ver e gerenciar tudo
-- ============================================================================
CREATE POLICY "Authenticated users can view tenants"
  ON tenants FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage tenants"
  ON tenants FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 4. STORES: Acesso público para lojas ativas + gestão por usuários
-- ============================================================================
CREATE POLICY "Public can view active stores"
  ON stores FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all stores"
  ON stores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Store users can manage their stores"
  ON stores FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 5. STORE_USERS: Usuários veem suas associações, owners gerenciam
-- ============================================================================
CREATE POLICY "Users can read their own store memberships"
  ON store_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view all store users"
  ON store_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Store owners can manage store users"
  ON store_users FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'OWNER'
    )
  );

-- ============================================================================
-- 6. CATEGORIES: Público vê ativas, usuários gerenciam suas lojas
-- ============================================================================
CREATE POLICY "Public can view categories of active stores"
  ON categories FOR SELECT
  USING (
    is_active = true AND
    store_id IN (SELECT id FROM stores WHERE is_active = true)
  );

CREATE POLICY "Authenticated users can view all categories"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Store users can manage categories"
  ON categories FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 7. PRODUCTS: Público vê ativos, usuários gerenciam suas lojas
-- ============================================================================
CREATE POLICY "Public can view products of active stores"
  ON products FOR SELECT
  USING (
    is_active = true AND
    store_id IN (SELECT id FROM stores WHERE is_active = true)
  );

CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Store users can manage products"
  ON products FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 8. USERS: Usuários veem e atualizam próprio perfil
-- ============================================================================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 9. ORDERS: Público cria pedidos, loja gerencia
-- ============================================================================
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view own orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can view all orders"
  ON orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Store users can manage orders"
  ON orders FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 10. ORDER_ITEMS: Público cria, loja visualiza
-- ============================================================================
CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view order items"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can view all order items"
  ON order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 11. CUSTOMERS: Público cria, loja gerencia
-- ============================================================================
CREATE POLICY "Public can create customers"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Store users can manage customers"
  ON customers FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
