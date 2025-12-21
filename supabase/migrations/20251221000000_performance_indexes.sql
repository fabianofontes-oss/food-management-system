-- ============================================================
-- MIGRATION: Performance Indexes
-- Data: 21/12/2024
-- Objetivo: Adicionar índices para otimizar queries e eliminar N+1
-- ============================================================

-- ÍNDICES PARA TENANT_ID (Multi-tenant isolation)
-- Todas as tabelas devem ter índice em tenant_id para queries rápidas

CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_tenant_id ON product_categories(tenant_id);

-- ÍNDICES PARA STORE_ID (Queries mais comuns)
-- Praticamente todas as queries filtram por store_id

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_store_id ON product_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_store_active ON product_categories(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tables_store_id ON tables(store_id);
CREATE INDEX IF NOT EXISTS idx_tables_store_status ON tables(store_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_store_id ON deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_store_status ON deliveries(store_id, status);
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_store_active ON coupons(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_store_id ON cash_registers(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_store_status ON cash_registers(store_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_store_id ON cash_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register_id ON cash_movements(register_id);
CREATE INDEX IF NOT EXISTS idx_store_users_store_id ON store_users(store_id);
CREATE INDEX IF NOT EXISTS idx_store_users_user_id ON store_users(user_id);

-- ÍNDICES COMPOSTOS PARA QUERIES ESPECÍFICAS

-- Orders: busca por loja + status + data
CREATE INDEX IF NOT EXISTS idx_orders_store_status_date ON orders(store_id, status, created_at DESC);

-- Orders: busca por loja + tipo + status
CREATE INDEX IF NOT EXISTS idx_orders_store_type_status ON orders(store_id, order_type, status);

-- Orders: busca por mesa
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id) WHERE table_id IS NOT NULL;

-- Orders: busca por código (tracking)
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);

-- Orders: busca por idempotency key
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Products: busca por categoria
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Products: busca por loja + categoria + ativo
CREATE INDEX IF NOT EXISTS idx_products_store_category_active ON products(store_id, category_id, is_active);

-- Deliveries: busca por motorista
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id) WHERE driver_id IS NOT NULL;

-- Deliveries: busca por token de acesso (links públicos)
CREATE INDEX IF NOT EXISTS idx_deliveries_access_token ON deliveries(access_token) WHERE access_token IS NOT NULL;

-- Coupons: busca por código (validação)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(store_id, code);

-- Customers: busca por telefone
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(store_id, phone);

-- Customers: busca por email
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(store_id, email) WHERE email IS NOT NULL;

-- Store Users: busca por usuário + loja (autenticação)
CREATE INDEX IF NOT EXISTS idx_store_users_user_store ON store_users(user_id, store_id);

-- Subscriptions: busca por tenant
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);

-- Subscriptions: busca por status
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Subscriptions: busca por trial expirando
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends ON subscriptions(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- Draft Stores: busca por token
CREATE INDEX IF NOT EXISTS idx_draft_stores_token ON draft_stores(draft_token);

-- Draft Stores: busca por slug
CREATE INDEX IF NOT EXISTS idx_draft_stores_slug ON draft_stores(slug);

-- ÍNDICES PARA BUSCA TEXTUAL (ILIKE/LIKE)

-- Stores: busca por nome ou slug
CREATE INDEX IF NOT EXISTS idx_stores_name_trgm ON stores USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stores_slug_trgm ON stores USING gin(slug gin_trgm_ops);

-- Products: busca por nome
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Customers: busca por nome
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);

-- ÍNDICES PARA TIMESTAMPS (Queries por data)

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created_at ON cash_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);

-- ÍNDICES PARA FOREIGN KEYS (JOINs)

CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- COMENTÁRIOS PARA DOCUMENTAÇÃO

COMMENT ON INDEX idx_orders_store_status_date IS 'Otimiza queries de listagem de pedidos por loja, status e data';
COMMENT ON INDEX idx_products_store_category_active IS 'Otimiza queries de produtos por categoria no cardápio público';
COMMENT ON INDEX idx_orders_idempotency IS 'Previne pedidos duplicados via idempotency key';
COMMENT ON INDEX idx_deliveries_access_token IS 'Otimiza validação de links públicos de entrega';
COMMENT ON INDEX idx_coupons_code IS 'Otimiza validação de cupons no checkout';

-- ANALYZE para atualizar estatísticas do planner
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
ANALYZE product_categories;
ANALYZE stores;
ANALYZE customers;
ANALYZE deliveries;
ANALYZE coupons;
ANALYZE cash_registers;
ANALYZE cash_movements;
