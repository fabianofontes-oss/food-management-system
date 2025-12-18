-- ============================================================================
-- SISTEMA DE GESTÃO DE PEDIDOS MULTI-LOJA E MULTI-NICHO
-- Schema PostgreSQL para Supabase
-- Versão: 1.0 (Com melhorias arquiteturais)
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE store_niche_enum AS ENUM (
  'acai',
  'burger',
  'hotdog',
  'marmita',
  'butcher',
  'ice_cream',
  'other'
);

CREATE TYPE store_mode_enum AS ENUM (
  'store',
  'home'
);

CREATE TYPE user_role_enum AS ENUM (
  'OWNER',
  'MANAGER',
  'CASHIER',
  'KITCHEN',
  'DELIVERY'
);

CREATE TYPE product_unit_type_enum AS ENUM (
  'unit',
  'weight'
);

CREATE TYPE order_channel_enum AS ENUM (
  'COUNTER',
  'DELIVERY',
  'TAKEAWAY'
);

CREATE TYPE order_status_enum AS ENUM (
  'PENDING',
  'ACCEPTED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE payment_method_enum AS ENUM (
  'PIX',
  'CASH',
  'CARD',
  'ONLINE'
);

CREATE TYPE order_event_type_enum AS ENUM (
  'CREATED',
  'ACCEPTED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'NOTE'
);

CREATE TYPE notification_channel_enum AS ENUM (
  'IN_APP',
  'WHATSAPP',
  'PUSH'
);

CREATE TYPE notification_status_enum AS ENUM (
  'PENDING',
  'SENT',
  'FAILED'
);

CREATE TYPE cash_movement_type_enum AS ENUM (
  'sale',
  'withdrawal',
  'deposit',
  'adjustment'
);

CREATE TYPE discount_type_enum AS ENUM (
  'percentage',
  'fixed_amount'
);

CREATE TYPE printer_type_enum AS ENUM (
  'receipt',
  'kitchen',
  'bar'
);

-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TABELAS PRINCIPAIS
-- ============================================================================

-- Tenants (Redes/Franquias)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE tenants IS 'Representa um cliente maior ou uma rede de lojas (multi-tenant)';
COMMENT ON COLUMN tenants.name IS 'Nome do tenant (rede ou franquia)';

-- Stores (Lojas)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  niche store_niche_enum NOT NULL,
  mode store_mode_enum NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Informações de contato e localização
  logo_url VARCHAR(255),
  banner_url VARCHAR(255),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Configurações flexíveis por nicho (JSONB)
  settings JSONB,
  
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE stores IS 'Armazena informações sobre as lojas, cada uma pertencente a um tenant';
COMMENT ON COLUMN stores.slug IS 'Slug único para uso em URLs públicas (ex: /[slug])';
COMMENT ON COLUMN stores.settings IS 'Configurações flexíveis: horários, delivery, taxas, etc.';

CREATE INDEX idx_stores_tenant_created ON stores(tenant_id, created_at);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_active ON stores(is_active);

-- Users (Usuários do sistema - equipe)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Usuários do sistema (equipe das lojas), vinculados ao auth.users do Supabase';

-- Store Users (Associação usuário-loja com papéis)
CREATE TABLE store_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, user_id)
);

COMMENT ON TABLE store_users IS 'Associa usuários a lojas e define seus papéis';

CREATE INDEX idx_store_users_store ON store_users(store_id);
CREATE INDEX idx_store_users_user ON store_users(user_id);

-- ============================================================================
-- CARDÁPIO (MENU)
-- ============================================================================

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Categorias de produtos para organizar o cardápio de cada loja';

CREATE INDEX idx_categories_store_sort ON categories(store_id, sort_order);
CREATE INDEX idx_categories_store_active ON categories(store_id, is_active);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  unit_type product_unit_type_enum NOT NULL,
  price_per_unit DECIMAL(10, 2),
  image_url VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Controle de estoque
  stock_quantity INTEGER,
  track_inventory BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE products IS 'Produtos oferecidos por cada loja';
COMMENT ON COLUMN products.price_per_unit IS 'Preço por unidade de peso, se unit_type for "weight"';

CREATE INDEX idx_products_store_category ON products(store_id, category_id);
CREATE INDEX idx_products_store_active ON products(store_id, is_active);
CREATE INDEX idx_products_store_name ON products(store_id, name);

-- Modifier Groups
CREATE TABLE modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  max_quantity INTEGER NOT NULL DEFAULT 1,
  required BOOLEAN NOT NULL DEFAULT false,
  applies_to_all_products BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE modifier_groups IS 'Grupos de opções adicionais ou escolhas para produtos';

CREATE INDEX idx_modifier_groups_store_sort ON modifier_groups(store_id, sort_order);

-- Modifier Options
CREATE TABLE modifier_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  extra_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE modifier_options IS 'Opções individuais dentro de um grupo de modificadores';

CREATE INDEX idx_modifier_options_group_sort ON modifier_options(group_id, sort_order);

-- Product Modifier Groups (N:N)
CREATE TABLE product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(product_id, group_id)
);

COMMENT ON TABLE product_modifier_groups IS 'Tabela de junção para a relação N:N entre produtos e grupos de modificadores';

CREATE INDEX idx_product_modifier_groups_product ON product_modifier_groups(product_id);
CREATE INDEX idx_product_modifier_groups_group ON product_modifier_groups(group_id);

-- ============================================================================
-- COMBOS/KITS
-- ============================================================================

CREATE TABLE product_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  combo_price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE product_combos IS 'Combos/kits de produtos (ex: Combo Burger + Batata + Refrigerante)';

CREATE INDEX idx_product_combos_store_active ON product_combos(store_id, is_active);

CREATE TABLE combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES product_combos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  allow_substitution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE combo_items IS 'Itens que compõem um combo';

CREATE INDEX idx_combo_items_combo ON combo_items(combo_id);

-- ============================================================================
-- CUPONS E PROMOÇÕES
-- ============================================================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type discount_type_enum NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, code)
);

COMMENT ON TABLE coupons IS 'Cupons de desconto e promoções';

CREATE INDEX idx_coupons_store_code ON coupons(store_id, code);
CREATE INDEX idx_coupons_store_active_valid ON coupons(store_id, is_active, valid_until);

-- ============================================================================
-- CLIENTES
-- ============================================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, phone)
);

COMMENT ON TABLE customers IS 'Clientes finais que realizam pedidos nas lojas';

CREATE INDEX idx_customers_store_phone ON customers(store_id, phone);
CREATE INDEX idx_customers_store_email ON customers(store_id, email);

-- Customer Addresses
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(255),
  street VARCHAR(255) NOT NULL,
  number VARCHAR(50) NOT NULL,
  complement VARCHAR(255),
  district VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  reference TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE customer_addresses IS 'Endereços de entrega dos clientes';

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);

-- ============================================================================
-- MESAS (DINE-IN)
-- ============================================================================

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  qr_code VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, number)
);

COMMENT ON TABLE tables IS 'Mesas para atendimento presencial (dine-in)';

CREATE INDEX idx_tables_store_active ON tables(store_id, is_active);

-- ============================================================================
-- PEDIDOS (ORDERS)
-- ============================================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  code VARCHAR(50) NOT NULL,
  channel order_channel_enum NOT NULL,
  status order_status_enum NOT NULL,
  
  -- Valores
  subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Pagamento
  payment_method payment_method_enum NOT NULL,
  
  -- Cupom aplicado
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  
  -- Endereço de entrega
  delivery_address_id UUID REFERENCES customer_addresses(id) ON DELETE RESTRICT,
  
  -- Observações
  notes TEXT,
  
  -- Caixa
  cash_register_id UUID,
  
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, code)
);

COMMENT ON TABLE orders IS 'Registra os pedidos realizados nas lojas';

CREATE INDEX idx_orders_store_created ON orders(store_id, created_at);
CREATE INDEX idx_orders_store_status ON orders(store_id, status);
CREATE INDEX idx_orders_store_status_created ON orders(store_id, status, created_at);
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at);
CREATE INDEX idx_orders_code ON orders(store_id, code);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  title_snapshot VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_type product_unit_type_enum NOT NULL,
  weight DECIMAL(10, 3),
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_items IS 'Itens individuais que compõem um pedido';
COMMENT ON COLUMN order_items.title_snapshot IS 'Nome do produto no momento do pedido (para histórico)';

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(order_id, product_id);

-- Order Item Modifiers
CREATE TABLE order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_option_id UUID NOT NULL REFERENCES modifier_options(id) ON DELETE RESTRICT,
  name_snapshot VARCHAR(255) NOT NULL,
  extra_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_item_modifiers IS 'Modificadores (adicionais) escolhidos para cada item de pedido';

CREATE INDEX idx_order_item_modifiers_item ON order_item_modifiers(order_item_id);

-- Order Events (Timeline)
CREATE TABLE order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type order_event_type_enum NOT NULL,
  message TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_events IS 'Linha do tempo de eventos e mudanças de status de um pedido';

CREATE INDEX idx_order_events_order_created ON order_events(order_id, created_at);
CREATE INDEX idx_order_events_order_type_created ON order_events(order_id, type, created_at);

-- ============================================================================
-- DELIVERY
-- ============================================================================

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  delivery_person_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_address_id UUID NOT NULL REFERENCES customer_addresses(id) ON DELETE RESTRICT,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estimated_time INTEGER,
  actual_delivery_time TIMESTAMP,
  distance_km DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE deliveries IS 'Informações de entrega para pedidos de delivery';
COMMENT ON COLUMN deliveries.estimated_time IS 'Tempo estimado de entrega em minutos';

CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_person_created ON deliveries(delivery_person_id, created_at);

-- ============================================================================
-- NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  recipient_type VARCHAR(50) NOT NULL,
  recipient_id UUID,
  recipient_phone VARCHAR(20),
  channel notification_channel_enum NOT NULL,
  status notification_status_enum NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'Notificações a serem enviadas aos clientes ou equipe';
COMMENT ON COLUMN notifications.recipient_type IS 'Tipo: customer, staff, delivery_person';

CREATE INDEX idx_notifications_store_status_created ON notifications(store_id, status, created_at);
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at);

-- ============================================================================
-- COMUNICAÇÃO INTERNA
-- ============================================================================

CREATE TABLE internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE internal_messages IS 'Sistema de comunicação interna entre equipe';
COMMENT ON COLUMN internal_messages.to_user_id IS 'NULL = broadcast para todos da loja';

CREATE INDEX idx_internal_messages_store_to_read ON internal_messages(store_id, to_user_id, is_read);
CREATE INDEX idx_internal_messages_order ON internal_messages(order_id, created_at);

-- ============================================================================
-- ESTOQUE/INVENTÁRIO
-- ============================================================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  current_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10, 2),
  supplier VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE inventory_items IS 'Itens de estoque/ingredientes';
COMMENT ON COLUMN inventory_items.unit IS 'Unidade de medida: kg, un, L, etc.';

CREATE INDEX idx_inventory_items_store_name ON inventory_items(store_id, name);

CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(product_id, inventory_item_id)
);

COMMENT ON TABLE product_ingredients IS 'Ingredientes necessários para cada produto';
COMMENT ON COLUMN product_ingredients.quantity_needed IS 'Quantidade consumida por unidade de produto';

CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_inventory ON product_ingredients(inventory_item_id);

-- ============================================================================
-- CAIXA (PDV)
-- ============================================================================

CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  closed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  opening_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  closing_amount DECIMAL(10, 2),
  expected_amount DECIMAL(10, 2),
  difference_amount DECIMAL(10, 2),
  opened_at TIMESTAMP NOT NULL DEFAULT now(),
  closed_at TIMESTAMP,
  notes TEXT
);

COMMENT ON TABLE cash_registers IS 'Controle de abertura e fechamento de caixa';

CREATE INDEX idx_cash_registers_store_opened ON cash_registers(store_id, opened_at);
CREATE INDEX idx_cash_registers_opened_by ON cash_registers(opened_by, opened_at);

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type cash_movement_type_enum NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE cash_movements IS 'Movimentações de caixa (vendas, sangrias, depósitos)';

CREATE INDEX idx_cash_movements_register_created ON cash_movements(cash_register_id, created_at);

-- Adicionar FK de cash_register_id em orders
ALTER TABLE orders ADD CONSTRAINT fk_orders_cash_register 
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE SET NULL;

-- ============================================================================
-- IMPRESSORAS
-- ============================================================================

CREATE TABLE printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type printer_type_enum NOT NULL,
  ip_address VARCHAR(50),
  port INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE printers IS 'Configuração de impressoras térmicas (recibos, cozinha, bar)';

CREATE INDEX idx_printers_store_type ON printers(store_id, type);

-- ============================================================================
-- TRIGGERS PARA updated_at
-- ============================================================================

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_users_updated_at BEFORE UPDATE ON store_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modifier_groups_updated_at BEFORE UPDATE ON modifier_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modifier_options_updated_at BEFORE UPDATE ON modifier_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_modifier_groups_updated_at BEFORE UPDATE ON product_modifier_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_combos_updated_at BEFORE UPDATE ON product_combos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_item_modifiers_updated_at BEFORE UPDATE ON order_item_modifiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_events_updated_at BEFORE UPDATE ON order_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_printers_updated_at BEFORE UPDATE ON printers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORE SETTINGS TABLE
-- =====================================================
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Funcionalidades Principais
  enable_pos BOOLEAN DEFAULT true,
  enable_kitchen BOOLEAN DEFAULT true,
  enable_delivery BOOLEAN DEFAULT true,
  enable_dine_in BOOLEAN DEFAULT true,
  enable_takeout BOOLEAN DEFAULT true,
  
  -- Formas de Pagamento
  enable_cash BOOLEAN DEFAULT true,
  enable_credit_card BOOLEAN DEFAULT true,
  enable_debit_card BOOLEAN DEFAULT true,
  enable_pix BOOLEAN DEFAULT true,
  
  -- Notificações
  enable_order_notifications BOOLEAN DEFAULT true,
  enable_whatsapp_notifications BOOLEAN DEFAULT false,
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_sound_alerts BOOLEAN DEFAULT true,
  
  -- Recursos Avançados
  enable_loyalty_program BOOLEAN DEFAULT false,
  enable_coupons BOOLEAN DEFAULT true,
  enable_scheduled_orders BOOLEAN DEFAULT false,
  enable_table_management BOOLEAN DEFAULT false,
  enable_inventory_control BOOLEAN DEFAULT false,
  
  -- Impressão
  enable_auto_print BOOLEAN DEFAULT false,
  enable_kitchen_print BOOLEAN DEFAULT true,
  
  -- Integrações
  enable_ifood BOOLEAN DEFAULT false,
  enable_rappi BOOLEAN DEFAULT false,
  enable_uber_eats BOOLEAN DEFAULT false,
  
  -- Operação
  minimum_order_value DECIMAL(10,2) DEFAULT 15.00,
  delivery_fee DECIMAL(10,2) DEFAULT 5.00,
  delivery_radius INTEGER DEFAULT 5,
  estimated_prep_time INTEGER DEFAULT 30,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id)
);

CREATE INDEX idx_store_settings_store_id ON store_settings(store_id);

-- RLS Policies para store_settings são criadas em migrations RLS separadas

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar configurações padrão ao criar uma loja
CREATE OR REPLACE FUNCTION create_default_store_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO store_settings (store_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_store_settings_on_store_creation
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION create_default_store_settings();

-- ============================================================================
-- KITCHEN_CHEFS - Cozinheiros da loja
-- ============================================================================
CREATE TABLE IF NOT EXISTS kitchen_chefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kitchen_chefs_store ON kitchen_chefs(store_id);

-- RLS para kitchen_chefs é criada em migrations RLS separadas
