-- Migration 006: RLS Policies for Critical Tables
-- Implements Row Level Security for multi-tenant data isolation

-- ============================================
-- HELPER FUNCTION
-- ============================================
-- Function to check if user has access to a store
CREATE OR REPLACE FUNCTION user_has_store_access(p_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM store_users
    WHERE user_id = auth.uid()
      AND store_id = p_store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_has_store_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_store_access(UUID) TO anon;

-- ============================================
-- STORES TABLE
-- ============================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read stores they are members of
CREATE POLICY "Users can read their stores"
  ON stores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = stores.id
        AND store_users.user_id = auth.uid()
    )
  );

-- ============================================
-- PRODUCTS TABLE
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read products from their stores
CREATE POLICY "Users can read products from their stores"
  ON products
  FOR SELECT
  USING (user_has_store_access(store_id));

-- Policy: Users can insert products to their stores
CREATE POLICY "Users can insert products to their stores"
  ON products
  FOR INSERT
  WITH CHECK (user_has_store_access(store_id));

-- Policy: Users can update products in their stores
CREATE POLICY "Users can update products in their stores"
  ON products
  FOR UPDATE
  USING (user_has_store_access(store_id));

-- Policy: Users can delete products from their stores
CREATE POLICY "Users can delete products from their stores"
  ON products
  FOR DELETE
  USING (user_has_store_access(store_id));

-- ============================================
-- ORDERS TABLE
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read orders from their stores
CREATE POLICY "Users can read orders from their stores"
  ON orders
  FOR SELECT
  USING (user_has_store_access(store_id));

-- Policy: Users can insert orders to their stores
CREATE POLICY "Users can insert orders to their stores"
  ON orders
  FOR INSERT
  WITH CHECK (user_has_store_access(store_id));

-- Policy: Users can update orders in their stores
CREATE POLICY "Users can update orders in their stores"
  ON orders
  FOR UPDATE
  USING (user_has_store_access(store_id));

-- Policy: Users can delete orders from their stores
CREATE POLICY "Users can delete orders from their stores"
  ON orders
  FOR DELETE
  USING (user_has_store_access(store_id));

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read order items from their stores
CREATE POLICY "Users can read order items from their stores"
  ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- Policy: Users can insert order items to their stores
CREATE POLICY "Users can insert order items to their stores"
  ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- Policy: Users can update order items in their stores
CREATE POLICY "Users can update order items in their stores"
  ON order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- Policy: Users can delete order items from their stores
CREATE POLICY "Users can delete order items from their stores"
  ON order_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- ============================================
-- DELIVERIES TABLE
-- ============================================
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read deliveries from their stores
CREATE POLICY "Users can read deliveries from their stores"
  ON deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliveries.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- Policy: Users can insert deliveries to their stores
CREATE POLICY "Users can insert deliveries to their stores"
  ON deliveries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliveries.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- Policy: Users can update deliveries in their stores
CREATE POLICY "Users can update deliveries in their stores"
  ON deliveries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliveries.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- Policy: Users can delete deliveries from their stores
CREATE POLICY "Users can delete deliveries from their stores"
  ON deliveries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliveries.order_id
        AND user_has_store_access(orders.store_id)
    )
  );

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read customers from their stores
CREATE POLICY "Users can read customers from their stores"
  ON customers
  FOR SELECT
  USING (user_has_store_access(store_id));

-- Policy: Users can insert customers to their stores
CREATE POLICY "Users can insert customers to their stores"
  ON customers
  FOR INSERT
  WITH CHECK (user_has_store_access(store_id));

-- Policy: Users can update customers in their stores
CREATE POLICY "Users can update customers in their stores"
  ON customers
  FOR UPDATE
  USING (user_has_store_access(store_id));

-- Policy: Users can delete customers from their stores
CREATE POLICY "Users can delete customers from their stores"
  ON customers
  FOR DELETE
  USING (user_has_store_access(store_id));

-- ============================================
-- CUSTOMER_ADDRESSES TABLE
-- ============================================
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read customer addresses from their stores
CREATE POLICY "Users can read customer addresses from their stores"
  ON customer_addresses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
        AND user_has_store_access(customers.store_id)
    )
  );

-- Policy: Users can insert customer addresses to their stores
CREATE POLICY "Users can insert customer addresses to their stores"
  ON customer_addresses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
        AND user_has_store_access(customers.store_id)
    )
  );

-- Policy: Users can update customer addresses in their stores
CREATE POLICY "Users can update customer addresses in their stores"
  ON customer_addresses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
        AND user_has_store_access(customers.store_id)
    )
  );

-- Policy: Users can delete customer addresses from their stores
CREATE POLICY "Users can delete customer addresses from their stores"
  ON customer_addresses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
        AND user_has_store_access(customers.store_id)
    )
  );
