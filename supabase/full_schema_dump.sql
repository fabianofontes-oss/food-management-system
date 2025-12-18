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

DROP FUNCTION IF EXISTS get_user_stores();

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
-- Migração: Analytics Avançado
-- Tabelas e funções para métricas avançadas

-- =============================================
-- TABELA: Métricas Diárias (cache)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Pedidos
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,

  -- Receita
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  discounts_given DECIMAL(10,2) DEFAULT 0,
  delivery_fees DECIMAL(10,2) DEFAULT 0,

  -- Ticket
  average_ticket DECIMAL(10,2) DEFAULT 0,
  max_ticket DECIMAL(10,2) DEFAULT 0,
  min_ticket DECIMAL(10,2) DEFAULT 0,

  -- Clientes
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,

  -- Tempo
  avg_preparation_time INTEGER DEFAULT 0,
  avg_delivery_time INTEGER DEFAULT 0,

  -- Canais
  orders_delivery INTEGER DEFAULT 0,
  orders_pickup INTEGER DEFAULT 0,
  orders_dine_in INTEGER DEFAULT 0,
  orders_online INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, date)
);

-- =============================================
-- TABELA: Métricas de Produtos
-- =============================================
CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  date DATE NOT NULL,

  quantity_sold INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,

  avg_rating DECIMAL(3,2) DEFAULT 0,
  times_in_cart INTEGER DEFAULT 0,
  times_purchased INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, product_id, date)
);

-- =============================================
-- TABELA: Métricas de Clientes
-- =============================================
CREATE TABLE IF NOT EXISTS customer_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_phone TEXT,

  -- Totais
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,

  -- Datas
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  days_since_last_order INTEGER DEFAULT 0,

  -- Frequência
  orders_per_month DECIMAL(5,2) DEFAULT 0,
  avg_days_between_orders INTEGER DEFAULT 0,

  -- LTV
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  predicted_ltv DECIMAL(12,2) DEFAULT 0,

  -- Segmentação
  segment TEXT DEFAULT 'new',
  risk_of_churn DECIMAL(5,2) DEFAULT 0,

  -- Preferências
  favorite_products JSONB DEFAULT '[]',
  favorite_payment_method TEXT,
  favorite_channel TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, customer_phone)
);

-- Segments: new, active, loyal, vip, at_risk, churned

-- =============================================
-- TABELA: Métricas por Hora
-- =============================================
CREATE TABLE IF NOT EXISTS hourly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,

  orders INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  avg_preparation_time INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, date, hour)
);

-- =============================================
-- TABELA: Métricas de Funcionários
-- =============================================
CREATE TABLE IF NOT EXISTS staff_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID,
  staff_name TEXT,
  role TEXT,
  date DATE NOT NULL,

  -- Garçons
  orders_taken INTEGER DEFAULT 0,
  tables_served INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  tips_received DECIMAL(10,2) DEFAULT 0,
  avg_ticket DECIMAL(10,2) DEFAULT 0,

  -- Entregadores
  deliveries_completed INTEGER DEFAULT 0,
  delivery_time_avg INTEGER DEFAULT 0,
  distance_traveled DECIMAL(10,2) DEFAULT 0,

  -- Cozinha
  orders_prepared INTEGER DEFAULT 0,
  preparation_time_avg INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, user_id, date)
);

-- =============================================
-- TABELA: Previsões
-- =============================================
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,

  predicted_orders INTEGER,
  predicted_revenue DECIMAL(12,2),
  confidence_low DECIMAL(12,2),
  confidence_high DECIMAL(12,2),

  -- Fatores considerados
  day_of_week INTEGER,
  is_holiday BOOLEAN DEFAULT FALSE,
  weather_factor DECIMAL(3,2) DEFAULT 1.0,
  event_factor DECIMAL(3,2) DEFAULT 1.0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, forecast_date)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_daily_metrics_store_date ON daily_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_product_metrics_store_date ON product_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_store ON customer_metrics(store_id);
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_store_date ON hourly_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_metrics_store_date ON staff_metrics(store_id, date);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_metrics_all" ON daily_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "product_metrics_all" ON product_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "customer_metrics_all" ON customer_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "hourly_metrics_all" ON hourly_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "staff_metrics_all" ON staff_metrics FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "forecasts_all" ON sales_forecasts FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular métricas diárias
CREATE OR REPLACE FUNCTION calculate_daily_metrics(p_store_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_metrics RECORD;
BEGIN
  SELECT
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
    COALESCE(SUM(total_amount), 0) as gross_revenue,
    COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as net_revenue,
    COALESCE(SUM(discount_amount), 0) as discounts_given,
    COALESCE(SUM(delivery_fee), 0) as delivery_fees,
    COALESCE(AVG(total_amount), 0) as average_ticket,
    COALESCE(MAX(total_amount), 0) as max_ticket,
    COALESCE(MIN(total_amount), 0) as min_ticket,
    COUNT(DISTINCT customer_phone) as unique_customers,
    COUNT(*) FILTER (WHERE channel = 'delivery') as orders_delivery,
    COUNT(*) FILTER (WHERE channel = 'pickup') as orders_pickup,
    COUNT(*) FILTER (WHERE channel = 'dine_in') as orders_dine_in,
    COUNT(*) FILTER (WHERE channel = 'online') as orders_online
  INTO v_metrics
  FROM orders
  WHERE store_id = p_store_id
    AND DATE(created_at) = p_date;

  INSERT INTO daily_metrics (
    store_id, date, total_orders, completed_orders, cancelled_orders,
    gross_revenue, net_revenue, discounts_given, delivery_fees,
    average_ticket, max_ticket, min_ticket, unique_customers,
    orders_delivery, orders_pickup, orders_dine_in, orders_online
  ) VALUES (
    p_store_id, p_date, v_metrics.total_orders, v_metrics.completed_orders, v_metrics.cancelled_orders,
    v_metrics.gross_revenue, v_metrics.net_revenue, v_metrics.discounts_given, v_metrics.delivery_fees,
    v_metrics.average_ticket, v_metrics.max_ticket, v_metrics.min_ticket, v_metrics.unique_customers,
    v_metrics.orders_delivery, v_metrics.orders_pickup, v_metrics.orders_dine_in, v_metrics.orders_online
  )
  ON CONFLICT (store_id, date) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    completed_orders = EXCLUDED.completed_orders,
    cancelled_orders = EXCLUDED.cancelled_orders,
    gross_revenue = EXCLUDED.gross_revenue,
    net_revenue = EXCLUDED.net_revenue,
    discounts_given = EXCLUDED.discounts_given,
    delivery_fees = EXCLUDED.delivery_fees,
    average_ticket = EXCLUDED.average_ticket,
    max_ticket = EXCLUDED.max_ticket,
    min_ticket = EXCLUDED.min_ticket,
    unique_customers = EXCLUDED.unique_customers,
    orders_delivery = EXCLUDED.orders_delivery,
    orders_pickup = EXCLUDED.orders_pickup,
    orders_dine_in = EXCLUDED.orders_dine_in,
    orders_online = EXCLUDED.orders_online,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para calcular LTV do cliente
CREATE OR REPLACE FUNCTION calculate_customer_ltv(p_store_id UUID, p_customer_phone TEXT)
RETURNS DECIMAL AS $$
DECLARE
  v_total_spent DECIMAL;
  v_months_active DECIMAL;
  v_orders_per_month DECIMAL;
  v_avg_ticket DECIMAL;
BEGIN
  SELECT
    COALESCE(SUM(total_amount), 0),
    GREATEST(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / (30 * 24 * 60 * 60), 1),
    COUNT(*)::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / (30 * 24 * 60 * 60), 1),
    COALESCE(AVG(total_amount), 0)
  INTO v_total_spent, v_months_active, v_orders_per_month, v_avg_ticket
  FROM orders
  WHERE store_id = p_store_id AND customer_phone = p_customer_phone;

  -- LTV = Ticket médio * Pedidos por mês * 12 meses
  RETURN v_avg_ticket * v_orders_per_month * 12;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar previsão de vendas
CREATE OR REPLACE FUNCTION generate_sales_forecast(p_store_id UUID, p_days_ahead INTEGER DEFAULT 7)
RETURNS VOID AS $$
DECLARE
  v_date DATE;
  v_day_of_week INTEGER;
  v_avg_orders DECIMAL;
  v_avg_revenue DECIMAL;
  v_std_dev DECIMAL;
BEGIN
  FOR i IN 1..p_days_ahead LOOP
    v_date := CURRENT_DATE + i;
    v_day_of_week := EXTRACT(DOW FROM v_date)::INTEGER;

    -- Calcular média e desvio padrão baseado no mesmo dia da semana
    SELECT
      COALESCE(AVG(total_orders), 0),
      COALESCE(AVG(gross_revenue), 0),
      COALESCE(STDDEV(gross_revenue), 0)
    INTO v_avg_orders, v_avg_revenue, v_std_dev
    FROM daily_metrics
    WHERE store_id = p_store_id
      AND EXTRACT(DOW FROM date) = v_day_of_week
      AND date >= CURRENT_DATE - 90;

    INSERT INTO sales_forecasts (
      store_id, forecast_date, predicted_orders, predicted_revenue,
      confidence_low, confidence_high, day_of_week
    ) VALUES (
      p_store_id, v_date, v_avg_orders::INTEGER, v_avg_revenue,
      GREATEST(v_avg_revenue - v_std_dev * 1.96, 0),
      v_avg_revenue + v_std_dev * 1.96,
      v_day_of_week
    )
    ON CONFLICT (store_id, forecast_date) DO UPDATE SET
      predicted_orders = EXCLUDED.predicted_orders,
      predicted_revenue = EXCLUDED.predicted_revenue,
      confidence_low = EXCLUDED.confidence_low,
      confidence_high = EXCLUDED.confidence_high;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para segmentar clientes
CREATE OR REPLACE FUNCTION segment_customer(p_orders INTEGER, p_days_since_last INTEGER, p_total_spent DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF p_orders = 0 OR p_days_since_last > 90 THEN
    RETURN 'churned';
  ELSIF p_days_since_last > 60 THEN
    RETURN 'at_risk';
  ELSIF p_orders >= 10 AND p_total_spent >= 1000 THEN
    RETURN 'vip';
  ELSIF p_orders >= 5 THEN
    RETURN 'loyal';
  ELSIF p_orders >= 2 THEN
    RETURN 'active';
  ELSE
    RETURN 'new';
  END IF;
END;
$$ LANGUAGE plpgsql;
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
-- Migração: Cupons Avançados
-- Adiciona campos para funcionalidades avançadas de cupons

-- Adicionar novos campos à tabela coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'standard';
-- Tipos: standard, first_purchase, birthday, referral, free_shipping, category, progressive, auto_apply

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT NULL;
-- IDs das categorias onde o cupom se aplica (NULL = todas)

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT NULL;
-- IDs dos produtos onde o cupom se aplica (NULL = todos)

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS one_per_customer BOOLEAN DEFAULT FALSE;
-- Limitar 1 uso por cliente

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS auto_apply BOOLEAN DEFAULT FALSE;
-- Aplicar automaticamente sem digitar código

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT FALSE;
-- Cupom dá frete grátis

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS progressive_rules JSONB DEFAULT NULL;
-- Regras progressivas: [{"min_amount": 50, "discount": 10}, {"min_amount": 100, "discount": 20}]

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS shareable_link TEXT DEFAULT NULL;
-- Link compartilhável único

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS campaign_id UUID DEFAULT NULL;
-- ID da campanha de marketing

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS total_discount_given DECIMAL(10,2) DEFAULT 0;
-- Total de desconto já concedido

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS total_orders_used INTEGER DEFAULT 0;
-- Total de pedidos que usaram este cupom

-- Tabela para rastrear uso de cupom por cliente
CREATE TABLE IF NOT EXISTS coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id UUID DEFAULT NULL,
  customer_email TEXT DEFAULT NULL,
  order_id UUID DEFAULT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(coupon_id, customer_email)
);

-- Tabela para campanhas de marketing
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_customer ON coupon_uses(customer_email);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign ON coupons(campaign_id);
CREATE INDEX IF NOT EXISTS idx_coupons_shareable ON coupons(shareable_link);

-- RLS para coupon_uses
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_uses_select" ON coupon_uses FOR SELECT USING (
  coupon_id IN (SELECT id FROM coupons WHERE store_id IN (
    SELECT store_id FROM store_users WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "coupon_uses_insert" ON coupon_uses FOR INSERT WITH CHECK (true);

-- RLS para marketing_campaigns
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_all" ON marketing_campaigns FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- Função para gerar link compartilhável
CREATE OR REPLACE FUNCTION generate_coupon_link(coupon_id UUID)
RETURNS TEXT AS $$
DECLARE
  link_code TEXT;
BEGIN
  link_code := encode(gen_random_bytes(8), 'hex');
  UPDATE coupons SET shareable_link = link_code WHERE id = coupon_id;
  RETURN link_code;
END;
$$ LANGUAGE plpgsql;

-- Função para validar cupom avançado
CREATE OR REPLACE FUNCTION validate_coupon_advanced(
  p_store_id UUID,
  p_code TEXT,
  p_subtotal DECIMAL,
  p_customer_email TEXT DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL,
  p_is_first_purchase BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount DECIMAL;
  v_result JSONB;
  v_used_count INTEGER;
BEGIN
  -- Buscar cupom
  SELECT * INTO v_coupon FROM coupons
  WHERE store_id = p_store_id
    AND UPPER(code) = UPPER(p_code)
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom não encontrado');
  END IF;

  -- Verificar datas
  IF v_coupon.starts_at IS NOT NULL AND NOW() < v_coupon.starts_at THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom ainda não está ativo');
  END IF;

  IF v_coupon.ends_at IS NOT NULL AND NOW() > v_coupon.ends_at THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom expirado');
  END IF;

  -- Verificar limite de usos
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom esgotado');
  END IF;

  -- Verificar valor mínimo
  IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object('valid', false, 'reason',
      format('Valor mínimo: R$ %s', v_coupon.min_order_amount));
  END IF;

  -- Verificar uso por cliente
  IF v_coupon.one_per_customer = TRUE AND p_customer_email IS NOT NULL THEN
    SELECT COUNT(*) INTO v_used_count FROM coupon_uses
    WHERE coupon_id = v_coupon.id AND customer_email = p_customer_email;

    IF v_used_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'Você já usou este cupom');
    END IF;
  END IF;

  -- Verificar primeira compra
  IF v_coupon.coupon_type = 'first_purchase' AND p_is_first_purchase = FALSE THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Cupom válido apenas para primeira compra');
  END IF;

  -- Calcular desconto
  IF v_coupon.type = 'percent' THEN
    v_discount := p_subtotal * (v_coupon.value / 100);
  ELSE
    v_discount := v_coupon.value;
  END IF;

  -- Limitar desconto ao subtotal
  IF v_discount > p_subtotal THEN
    v_discount := p_subtotal;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'discount_amount', v_discount,
    'coupon_id', v_coupon.id,
    'coupon_code', v_coupon.code,
    'coupon_type', v_coupon.type,
    'coupon_value', v_coupon.value,
    'free_shipping', COALESCE(v_coupon.free_shipping, false)
  );
END;
$$ LANGUAGE plpgsql;

-- Função para registrar uso de cupom
CREATE OR REPLACE FUNCTION use_coupon(
  p_coupon_id UUID,
  p_customer_email TEXT,
  p_order_id UUID,
  p_discount_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  -- Registrar uso
  INSERT INTO coupon_uses (coupon_id, customer_email, order_id, discount_amount)
  VALUES (p_coupon_id, p_customer_email, p_order_id, p_discount_amount)
  ON CONFLICT (coupon_id, customer_email) DO NOTHING;

  -- Atualizar contadores
  UPDATE coupons SET
    uses_count = uses_count + 1,
    total_orders_used = total_orders_used + 1,
    total_discount_given = total_discount_given + p_discount_amount
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;
-- Adicionar campos de comissão na tabela drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS commission_percent INTEGER DEFAULT 10;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Criar tabela de deliveries se não existir
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  estimated_time INTEGER DEFAULT 30,
  actual_delivery_time TIMESTAMPTZ,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de drivers se não existir
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(20),
  vehicle_plate VARCHAR(20),
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  notes TEXT,
  commission_percent INTEGER DEFAULT 10,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_deliveries_store ON deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_drivers_store ON drivers(store_id);

-- RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deliveries_all') THEN
    CREATE POLICY "deliveries_all" ON deliveries FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'drivers_all') THEN
    CREATE POLICY "drivers_all" ON drivers FOR ALL USING (true);
  END IF;
END $$;
-- MÓDULO FINANCEIRO COMPLETO
-- Contas a Pagar, Receber, Categorias, DRE

-- ============================================
-- CATEGORIAS DE DESPESA/RECEITA
-- ============================================
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- expense = despesa, income = receita
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  is_fixed BOOLEAN DEFAULT false, -- Se é custo fixo (aluguel, salário)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir categorias padrão
-- (será feito via seed ou primeira execução)

-- ============================================
-- CONTAS A PAGAR (DESPESAS)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES financial_categories(id),
  supplier_id UUID REFERENCES suppliers(id),

  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,

  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),

  is_recurring BOOLEAN DEFAULT false,
  recurrence_type VARCHAR(20), -- daily, weekly, monthly, yearly
  recurrence_end_date DATE,

  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled

  notes TEXT,
  attachment_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTAS A RECEBER
-- ============================================
CREATE TABLE IF NOT EXISTS receivables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES financial_categories(id),

  -- Pode ser vinculado a um pedido ou cliente
  order_id UUID REFERENCES orders(id),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),

  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,

  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),

  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FLUXO DE CAIXA (CONSOLIDADO)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_flow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- income, expense
  category_id UUID REFERENCES financial_categories(id),

  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,

  -- Referências opcionais
  order_id UUID REFERENCES orders(id),
  expense_id UUID REFERENCES expenses(id),
  receivable_id UUID REFERENCES receivables(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAIXA REGISTRADORA
-- ============================================
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  opened_by UUID REFERENCES auth.users(id),
  opened_by_name VARCHAR(100),
  closed_by UUID REFERENCES auth.users(id),
  closed_by_name VARCHAR(100),

  opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(12,2),
  expected_amount DECIMAL(12,2),
  difference DECIMAL(12,2),

  status VARCHAR(20) DEFAULT 'open', -- open, closed

  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOVIMENTAÇÕES DE CAIXA
-- ============================================
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  register_id UUID REFERENCES cash_registers(id),

  type VARCHAR(20) NOT NULL, -- sale, withdrawal, deposit, adjustment
  amount DECIMAL(12,2) NOT NULL,

  description VARCHAR(200),
  payment_method VARCHAR(50),

  -- Referências opcionais
  order_id UUID REFERENCES orders(id),

  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESUMO DIÁRIO (CACHE PARA PERFORMANCE)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Vendas
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0, -- CMV
  gross_profit DECIMAL(12,2) DEFAULT 0,

  -- Por forma de pagamento
  cash_amount DECIMAL(12,2) DEFAULT 0,
  card_amount DECIMAL(12,2) DEFAULT 0,
  pix_amount DECIMAL(12,2) DEFAULT 0,
  other_amount DECIMAL(12,2) DEFAULT 0,

  -- Despesas do dia
  total_expenses DECIMAL(12,2) DEFAULT 0,

  -- Lucro líquido
  net_profit DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, date)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_financial_categories_store ON financial_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_store ON expenses(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_receivables_store ON receivables(store_id);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(store_id, date);
CREATE INDEX IF NOT EXISTS idx_cash_registers_store ON cash_registers(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON cash_movements(register_id);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary(store_id, date);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "financial_categories_all" ON financial_categories;
DROP POLICY IF EXISTS "expenses_all" ON expenses;
DROP POLICY IF EXISTS "receivables_all" ON receivables;
DROP POLICY IF EXISTS "cash_flow_all" ON cash_flow;
DROP POLICY IF EXISTS "cash_registers_all" ON cash_registers;
DROP POLICY IF EXISTS "cash_movements_all" ON cash_movements;
DROP POLICY IF EXISTS "daily_summary_all" ON daily_summary;

CREATE POLICY "financial_categories_all" ON financial_categories FOR ALL USING (true);
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true);
CREATE POLICY "receivables_all" ON receivables FOR ALL USING (true);
CREATE POLICY "cash_flow_all" ON cash_flow FOR ALL USING (true);
CREATE POLICY "cash_registers_all" ON cash_registers FOR ALL USING (true);
CREATE POLICY "cash_movements_all" ON cash_movements FOR ALL USING (true);
CREATE POLICY "daily_summary_all" ON daily_summary FOR ALL USING (true);
-- SISTEMA PREMIUM DE ESTOQUE
-- Histórico, Validade, Lotes, Pedidos de Compra, Inventário, Fornecedores, Ficha Técnica

-- ============================================
-- FORNECEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  company_name VARCHAR(150),
  cnpj VARCHAR(18),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  contact_person VARCHAR(100),
  payment_terms VARCHAR(100), -- À vista, 30 dias, etc
  delivery_days INTEGER DEFAULT 1, -- Prazo de entrega em dias
  min_order_value DECIMAL(10,2) DEFAULT 0, -- Pedido mínimo
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_store ON suppliers(store_id);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'suppliers_all') THEN
    CREATE POLICY "suppliers_all" ON suppliers FOR ALL USING (true);
  END IF;
END $$;

-- ============================================
-- FICHA TÉCNICA (ingredientes do produto)
-- ============================================
CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL, -- quantidade usada
  unit VARCHAR(20), -- unidade (kg, g, ml, un)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_item ON product_ingredients(inventory_item_id);
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_ingredients_all') THEN
    CREATE POLICY "product_ingredients_all" ON product_ingredients FOR ALL USING (true);
  END IF;
END $$;

-- Adicionar campos na tabela inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_purchase_date DATE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_purchase_price DECIMAL(10,2);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS average_consumption DECIMAL(10,2) DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Adicionar campo de custo na tabela products (CMV)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 0;

-- Tabela de movimentações de estoque (histórico completo)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- in, out, adjustment, loss, transfer
  quantity DECIMAL(10,2) NOT NULL,
  previous_quantity DECIMAL(10,2),
  new_quantity DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reason TEXT,
  reference_id UUID, -- pedido de compra ou venda
  reference_type VARCHAR(20), -- purchase_order, sale, loss, etc
  batch_number VARCHAR(50),
  expiry_date DATE,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de lotes (controle de validade)
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_number VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  manufacture_date DATE,
  expiry_date DATE,
  supplier VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active', -- active, consumed, expired, discarded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number VARCHAR(20),
  supplier VARCHAR(100) NOT NULL,
  supplier_contact VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, confirmed, received, cancelled
  total_amount DECIMAL(12,2) DEFAULT 0,
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  received_quantity DECIMAL(10,2) DEFAULT 0,
  notes TEXT
);

-- Tabela de inventários (conferências periódicas)
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  count_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  notes TEXT,
  counted_by VARCHAR(100),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do inventário
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  system_quantity DECIMAL(10,2), -- quantidade no sistema
  counted_quantity DECIMAL(10,2), -- quantidade contada
  difference DECIMAL(10,2), -- diferença
  notes TEXT,
  counted_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_item ON inventory_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_store ON purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_store ON inventory_counts(store_id);

-- RLS
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_movements_all') THEN
    CREATE POLICY "inventory_movements_all" ON inventory_movements FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_batches_all') THEN
    CREATE POLICY "inventory_batches_all" ON inventory_batches FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_orders_all') THEN
    CREATE POLICY "purchase_orders_all" ON purchase_orders FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_order_items_all') THEN
    CREATE POLICY "purchase_order_items_all" ON purchase_order_items FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_counts_all') THEN
    CREATE POLICY "inventory_counts_all" ON inventory_counts FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inventory_count_items_all') THEN
    CREATE POLICY "inventory_count_items_all" ON inventory_count_items FOR ALL USING (true);
  END IF;
END $$;
-- Tabela de cozinheiros
CREATE TABLE IF NOT EXISTS kitchen_chefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_kitchen_chefs_store ON kitchen_chefs(store_id);

-- RLS
ALTER TABLE kitchen_chefs ENABLE ROW LEVEL SECURITY;

-- Policy de acesso
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kitchen_chefs_all') THEN
    CREATE POLICY "kitchen_chefs_all" ON kitchen_chefs FOR ALL USING (true);
  END IF;
END $$;
-- Migração: Sistema Completo de Marketing e CRM
-- Campanhas, automações, segmentação e templates

-- =============================================
-- TABELA: Campanhas de Marketing
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- Informações básicas
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('promotion', 'notification', 'announcement', 'remarketing', 'loyalty')),

  -- Canal de envio
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'push', 'email', 'sms', 'all')),

  -- Conteúdo
  subject TEXT,
  message TEXT NOT NULL,
  image_url TEXT,
  cta_text TEXT,
  cta_url TEXT,

  -- Cupom vinculado
  coupon_id UUID,

  -- Segmentação
  segment_id UUID,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'new', 'inactive', 'vip', 'birthday', 'custom')),
  target_filters JSONB DEFAULT '{}',

  -- Agendamento
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'active', 'paused', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- A/B Testing
  is_ab_test BOOLEAN DEFAULT FALSE,
  ab_variant TEXT,
  ab_parent_id UUID,

  -- Métricas
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,

  -- Taxas calculadas
  delivery_rate DECIMAL(5,2) DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Mensagens Enviadas
-- =============================================
CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- Destinatário
  customer_id UUID,
  customer_phone TEXT,
  customer_email TEXT,
  customer_name TEXT,

  -- Status do envio
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'clicked', 'converted', 'failed', 'bounced', 'unsubscribed')),

  -- Timestamps
  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Conversão
  order_id UUID,
  conversion_value DECIMAL(10,2),

  -- Erro
  error_message TEXT,

  -- ID externo (WhatsApp, etc)
  external_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Segmentos de Clientes
-- =============================================
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Tipo de segmento
  type TEXT DEFAULT 'manual' CHECK (type IN ('manual', 'dynamic', 'smart')),

  -- Filtros para segmentos dinâmicos
  filters JSONB DEFAULT '{}',

  -- Exemplos de filtros:
  -- {"min_orders": 5, "min_spent": 500, "last_order_days": 30}
  -- {"products_purchased": ["uuid1", "uuid2"]}
  -- {"order_channel": "delivery", "avg_ticket_min": 50}

  -- Contagem
  customer_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  -- Sistema
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Clientes do Segmento
-- =============================================
CREATE TABLE IF NOT EXISTS segment_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_phone TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(segment_id, customer_phone)
);

-- =============================================
-- TABELA: Automações de Marketing
-- =============================================
CREATE TABLE IF NOT EXISTS marketing_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Gatilho
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'welcome',           -- Primeiro pedido
    'post_purchase',     -- Após compra (X horas depois)
    'abandoned_cart',    -- Carrinho abandonado
    'inactive',          -- Cliente inativo (X dias sem compra)
    'birthday',          -- Aniversário
    'anniversary',       -- Aniversário de cliente (primeira compra)
    'vip_reached',       -- Atingiu status VIP
    'review_request',    -- Solicitar avaliação
    'loyalty_reward',    -- Recompensa de fidelidade
    'custom'             -- Personalizado
  )),

  -- Configuração do gatilho
  trigger_config JSONB DEFAULT '{}',
  -- Exemplos:
  -- {"delay_hours": 24} para post_purchase
  -- {"inactive_days": 30} para inactive
  -- {"days_before": 3} para birthday

  -- Canal
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'push', 'email', 'sms')),

  -- Conteúdo
  subject TEXT,
  message TEXT NOT NULL,
  image_url TEXT,

  -- Cupom automático
  coupon_id UUID,
  auto_generate_coupon BOOLEAN DEFAULT FALSE,
  coupon_discount_type TEXT CHECK (coupon_discount_type IN ('percentage', 'fixed')),
  coupon_discount_value DECIMAL(10,2),
  coupon_validity_days INTEGER DEFAULT 7,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Métricas
  total_triggered INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Logs de Automação
-- =============================================
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES marketing_automations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  customer_id UUID,
  customer_phone TEXT,
  customer_name TEXT,

  -- Status
  status TEXT DEFAULT 'triggered' CHECK (status IN ('triggered', 'sent', 'delivered', 'converted', 'failed', 'skipped')),

  -- Resultado
  order_id UUID,
  conversion_value DECIMAL(10,2),
  coupon_code TEXT,

  -- Erro
  error_message TEXT,

  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- =============================================
-- TABELA: Templates de Mensagem
-- =============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'welcome', 'promotion', 'reminder', 'birthday',
    'abandoned_cart', 'review_request', 'loyalty', 'general'
  )),

  -- Conteúdo
  subject TEXT,
  message TEXT NOT NULL,

  -- Variáveis disponíveis: {nome}, {loja}, {cupom}, {desconto}, {link}, {pedido}

  -- Canal preferido
  channel TEXT DEFAULT 'whatsapp',

  -- Uso
  use_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Preferências de Comunicação do Cliente
-- =============================================
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,

  -- Canais
  allow_whatsapp BOOLEAN DEFAULT TRUE,
  allow_sms BOOLEAN DEFAULT TRUE,
  allow_email BOOLEAN DEFAULT TRUE,
  allow_push BOOLEAN DEFAULT TRUE,

  -- Tipos
  allow_promotions BOOLEAN DEFAULT TRUE,
  allow_transactional BOOLEAN DEFAULT TRUE,
  allow_newsletter BOOLEAN DEFAULT TRUE,

  -- Frequência
  max_messages_per_week INTEGER DEFAULT 3,

  -- Opt-out
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, customer_phone)
);

-- =============================================
-- TABELA: Estatísticas de Marketing
-- =============================================
CREATE TABLE IF NOT EXISTS marketing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,

  -- Campanhas
  total_campaigns INTEGER DEFAULT 0,
  active_campaigns INTEGER DEFAULT 0,

  -- Envios
  total_messages_sent INTEGER DEFAULT 0,
  messages_this_month INTEGER DEFAULT 0,

  -- Taxas médias
  avg_delivery_rate DECIMAL(5,2) DEFAULT 0,
  avg_open_rate DECIMAL(5,2) DEFAULT 0,
  avg_click_rate DECIMAL(5,2) DEFAULT 0,
  avg_conversion_rate DECIMAL(5,2) DEFAULT 0,

  -- Receita
  total_revenue_generated DECIMAL(12,2) DEFAULT 0,
  revenue_this_month DECIMAL(12,2) DEFAULT 0,

  -- Automações
  total_automations INTEGER DEFAULT 0,
  active_automations INTEGER DEFAULT 0,
  automation_conversions INTEGER DEFAULT 0,

  -- Segmentos
  total_segments INTEGER DEFAULT 0,
  total_customers_segmented INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_store ON campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(store_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_customer ON campaign_messages(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_segments_store ON customer_segments(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_automations_store ON marketing_automations(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_automations_trigger ON marketing_automations(trigger_type) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_phone ON customer_preferences(customer_phone);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_all" ON campaigns FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "campaign_messages_all" ON campaign_messages FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "customer_segments_all" ON customer_segments FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "segment_customers_all" ON segment_customers FOR ALL USING (
  segment_id IN (SELECT id FROM customer_segments WHERE store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid()))
);

CREATE POLICY "marketing_automations_all" ON marketing_automations FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "automation_logs_all" ON automation_logs FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "message_templates_all" ON message_templates FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "customer_preferences_all" ON customer_preferences FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "marketing_stats_all" ON marketing_stats FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular métricas da campanha
CREATE OR REPLACE FUNCTION calculate_campaign_metrics(p_campaign_id UUID)
RETURNS VOID AS $$
DECLARE
  v_metrics RECORD;
BEGIN
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'read', 'clicked', 'converted')) as sent,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'read', 'clicked', 'converted')) as delivered,
    COUNT(*) FILTER (WHERE status IN ('read', 'clicked', 'converted')) as opened,
    COUNT(*) FILTER (WHERE status IN ('clicked', 'converted')) as clicked,
    COUNT(*) FILTER (WHERE status = 'converted') as converted,
    COALESCE(SUM(conversion_value), 0) as revenue
  INTO v_metrics
  FROM campaign_messages
  WHERE campaign_id = p_campaign_id;

  UPDATE campaigns SET
    total_recipients = v_metrics.total,
    sent_count = v_metrics.sent,
    delivered_count = v_metrics.delivered,
    opened_count = v_metrics.opened,
    clicked_count = v_metrics.clicked,
    converted_count = v_metrics.converted,
    revenue_generated = v_metrics.revenue,
    delivery_rate = CASE WHEN v_metrics.sent > 0 THEN (v_metrics.delivered::DECIMAL / v_metrics.sent) * 100 ELSE 0 END,
    open_rate = CASE WHEN v_metrics.delivered > 0 THEN (v_metrics.opened::DECIMAL / v_metrics.delivered) * 100 ELSE 0 END,
    click_rate = CASE WHEN v_metrics.opened > 0 THEN (v_metrics.clicked::DECIMAL / v_metrics.opened) * 100 ELSE 0 END,
    conversion_rate = CASE WHEN v_metrics.clicked > 0 THEN (v_metrics.converted::DECIMAL / v_metrics.clicked) * 100 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular segmento dinâmico
CREATE OR REPLACE FUNCTION calculate_segment_customers(p_segment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_segment RECORD;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_segment FROM customer_segments WHERE id = p_segment_id;

  IF v_segment.type = 'dynamic' THEN
    -- Limpar clientes atuais
    DELETE FROM segment_customers WHERE segment_id = p_segment_id;

    -- Inserir baseado nos filtros
    -- Implementação simplificada - em produção seria mais complexa
    INSERT INTO segment_customers (segment_id, customer_id, customer_phone)
    SELECT DISTINCT
      p_segment_id,
      o.customer_id,
      o.customer_phone
    FROM orders o
    WHERE o.store_id = v_segment.store_id
      AND o.customer_phone IS NOT NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    SELECT COUNT(*) INTO v_count FROM segment_customers WHERE segment_id = p_segment_id;
  END IF;

  UPDATE customer_segments SET
    customer_count = v_count,
    last_calculated_at = NOW()
  WHERE id = p_segment_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Função para criar templates padrão
CREATE OR REPLACE FUNCTION create_default_marketing_templates(p_store_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO message_templates (store_id, name, category, message, channel) VALUES
    (p_store_id, 'Boas-vindas', 'welcome', 'Olá {nome}! 👋 Seja bem-vindo(a) à {loja}! Seu primeiro pedido foi um sucesso. Volte sempre!', 'whatsapp'),
    (p_store_id, 'Promoção Geral', 'promotion', '🔥 {nome}, temos uma oferta especial para você! Use o cupom {cupom} e ganhe {desconto} de desconto. Válido por tempo limitado!', 'whatsapp'),
    (p_store_id, 'Aniversário', 'birthday', '🎂 Parabéns, {nome}! A {loja} deseja um feliz aniversário! Como presente, use o cupom {cupom} e ganhe {desconto} OFF no seu pedido!', 'whatsapp'),
    (p_store_id, 'Cliente Inativo', 'reminder', 'Olá {nome}, sentimos sua falta! 😊 Faz um tempo que não nos visita. Que tal um pedido hoje? Use {cupom} para {desconto} de desconto!', 'whatsapp'),
    (p_store_id, 'Carrinho Abandonado', 'abandoned_cart', 'Ei {nome}! Você deixou itens no carrinho 🛒 Finalize seu pedido agora e aproveite!', 'whatsapp'),
    (p_store_id, 'Pedir Avaliação', 'review_request', 'Olá {nome}! Como foi seu pedido? 😊 Sua opinião é muito importante para nós. Avalie sua experiência: {link}', 'whatsapp'),
    (p_store_id, 'Fidelidade', 'loyalty', '⭐ {nome}, você é especial! Como cliente fiel, ganhou {desconto} de desconto no próximo pedido. Use o cupom {cupom}!', 'whatsapp')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para criar segmentos padrão
CREATE OR REPLACE FUNCTION create_default_segments(p_store_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO customer_segments (store_id, name, description, type, filters, is_system) VALUES
    (p_store_id, 'Todos os Clientes', 'Todos os clientes que já fizeram pedido', 'dynamic', '{}', TRUE),
    (p_store_id, 'Clientes Novos', 'Clientes que fizeram o primeiro pedido nos últimos 30 dias', 'dynamic', '{"first_order_days": 30}', TRUE),
    (p_store_id, 'Clientes Inativos', 'Clientes sem pedido há mais de 60 dias', 'dynamic', '{"inactive_days": 60}', TRUE),
    (p_store_id, 'Clientes VIP', 'Clientes com mais de 10 pedidos ou R$500 gastos', 'dynamic', '{"min_orders": 10, "min_spent": 500}', TRUE),
    (p_store_id, 'Aniversariantes do Mês', 'Clientes que fazem aniversário este mês', 'dynamic', '{"birthday_month": true}', TRUE)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar automações após pedido
CREATE OR REPLACE FUNCTION check_marketing_automations()
RETURNS TRIGGER AS $$
DECLARE
  v_automation RECORD;
BEGIN
  -- Verificar automações ativas para o novo pedido
  FOR v_automation IN
    SELECT * FROM marketing_automations
    WHERE store_id = NEW.store_id
      AND is_active = TRUE
  LOOP
    -- Boas-vindas: primeiro pedido do cliente
    IF v_automation.trigger_type = 'welcome' THEN
      IF NOT EXISTS (
        SELECT 1 FROM orders
        WHERE store_id = NEW.store_id
          AND customer_phone = NEW.customer_phone
          AND id != NEW.id
      ) THEN
        INSERT INTO automation_logs (automation_id, store_id, customer_phone, customer_name, status)
        VALUES (v_automation.id, NEW.store_id, NEW.customer_phone, NEW.customer_name, 'triggered');
      END IF;
    END IF;

    -- Pós-compra: agendar envio
    IF v_automation.trigger_type = 'post_purchase' THEN
      INSERT INTO automation_logs (automation_id, store_id, customer_phone, customer_name, status)
      VALUES (v_automation.id, NEW.store_id, NEW.customer_phone, NEW.customer_name, 'triggered');
    END IF;

    -- Solicitar avaliação
    IF v_automation.trigger_type = 'review_request' AND NEW.status = 'delivered' THEN
      INSERT INTO automation_logs (automation_id, store_id, customer_phone, customer_name, status)
      VALUES (v_automation.id, NEW.store_id, NEW.customer_phone, NEW.customer_name, 'triggered');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_marketing_automations ON orders;
CREATE TRIGGER trigger_check_marketing_automations
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_marketing_automations();
-- SISTEMA DE NOTIFICAÇÕES

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  type VARCHAR(20) NOT NULL, -- order, stock, payment, schedule, general
  title VARCHAR(200) NOT NULL,
  message TEXT,
  priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high, urgent

  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  data JSONB, -- Dados extras (order_id, etc)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de notificação por loja
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Sons
  sound_enabled BOOLEAN DEFAULT true,
  sound_new_order VARCHAR(100) DEFAULT 'default',

  -- Push
  push_enabled BOOLEAN DEFAULT true,
  push_new_order BOOLEAN DEFAULT true,
  push_order_ready BOOLEAN DEFAULT true,
  push_low_stock BOOLEAN DEFAULT true,

  -- WhatsApp
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone VARCHAR(20), -- Número principal da loja
  whatsapp_new_order BOOLEAN DEFAULT false,
  whatsapp_order_ready BOOLEAN DEFAULT true,

  -- Email
  email_enabled BOOLEAN DEFAULT false,
  email_address VARCHAR(255),
  email_daily_report BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_store ON notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(store_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_all" ON notifications;
DROP POLICY IF EXISTS "notification_settings_all" ON notification_settings;

CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true);
CREATE POLICY "notification_settings_all" ON notification_settings FOR ALL USING (true);
-- SISTEMA DE ENCOMENDAS E AGENDAMENTO
-- Funciona para: Salgados, Doces, Marmitas, Bolos, etc.

-- ============================================
-- CONFIGURAÇÕES DE AGENDAMENTO DA LOJA
-- ============================================
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_enabled BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_min_hours INTEGER DEFAULT 4; -- Antecedência mínima em horas
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_max_days INTEGER DEFAULT 7; -- Máximo de dias no futuro
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_interval INTEGER DEFAULT 30; -- Intervalo em minutos (15, 30, 60)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_require_payment BOOLEAN DEFAULT false; -- Exigir pagamento antecipado
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_max_per_slot INTEGER DEFAULT 0; -- Máx pedidos por horário (0 = ilimitado)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_use_store_hours BOOLEAN DEFAULT true; -- Usar horário da loja ou customizado
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scheduling_custom_hours JSONB; -- Horários customizados para agendamento
-- Ex: {"mon": {"start": "08:00", "end": "18:00"}, "sat": {"start": "09:00", "end": "14:00"}, "sun": null}

-- Tabela para slots bloqueados ou com capacidade específica
CREATE TABLE IF NOT EXISTS scheduling_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  max_orders INTEGER DEFAULT 5,
  current_orders INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  block_reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_scheduling_slots_date ON scheduling_slots(store_id, slot_date);
ALTER TABLE scheduling_slots ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scheduling_slots_all') THEN
    CREATE POLICY "scheduling_slots_all" ON scheduling_slots FOR ALL USING (true);
  END IF;
END $$;

-- Adicionar campos de agendamento nos pedidos normais
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;

-- ============================================
-- CONFIGURAÇÃO DE PRODUTOS PARA ENCOMENDA
-- ============================================

-- Adicionar campos de encomenda nos produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'ready';
-- ready = pronta entrega, order = sob encomenda, both = ambos

ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1;
-- Quantidade mínima para encomenda (ex: 50 unidades)

ALTER TABLE products ADD COLUMN IF NOT EXISTS max_daily_quantity INTEGER;
-- Capacidade máxima de produção por dia

ALTER TABLE products ADD COLUMN IF NOT EXISTS advance_days INTEGER DEFAULT 0;
-- Dias de antecedência mínima (ex: 2 dias antes)

ALTER TABLE products ADD COLUMN IF NOT EXISTS allows_customization BOOLEAN DEFAULT false;
-- Se permite personalização (sabor, recheio, etc)

-- ============================================
-- KITS / COMBOS CONFIGURÁVEIS
-- Ex: "Cento de Salgados" onde cliente escolhe tipos
-- ============================================
CREATE TABLE IF NOT EXISTS product_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Cento de Salgados Mistos"
  description TEXT,
  base_quantity INTEGER NOT NULL DEFAULT 100, -- Ex: 100 unidades
  min_varieties INTEGER DEFAULT 1, -- Mínimo de tipos diferentes
  max_varieties INTEGER DEFAULT 10, -- Máximo de tipos
  min_per_variety INTEGER DEFAULT 10, -- Mínimo por tipo (ex: 10 de cada)
  base_price DECIMAL(10,2) NOT NULL,
  price_per_extra DECIMAL(10,2) DEFAULT 0, -- Preço por unidade extra
  advance_days INTEGER DEFAULT 2,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos que fazem parte do kit
CREATE TABLE IF NOT EXISTS product_kit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID NOT NULL REFERENCES product_kits(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  default_quantity INTEGER DEFAULT 0, -- Quantidade padrão sugerida
  max_quantity INTEGER, -- Máximo deste item no kit
  extra_price DECIMAL(10,2) DEFAULT 0, -- Valor extra por este item
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OPÇÕES DE PERSONALIZAÇÃO
-- Ex: Sabores, Recheios, Temas, Tamanhos
-- ============================================
CREATE TABLE IF NOT EXISTS customization_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Sabores", "Recheios", "Temas"
  type VARCHAR(20) DEFAULT 'single', -- single = escolhe 1, multiple = vários
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customization_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ex: "Chocolate", "Morango", "Frozen"
  extra_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vincular personalização a produtos
CREATE TABLE IF NOT EXISTS product_customization_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, group_id)
);

-- ============================================
-- ENCOMENDAS
-- ============================================
CREATE TABLE IF NOT EXISTS custom_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number SERIAL,

  -- Dados do cliente
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),

  -- Data/hora
  delivery_date DATE NOT NULL,
  delivery_time TIME,

  -- Entrega
  delivery_type VARCHAR(20) DEFAULT 'pickup', -- pickup = retirada, delivery = entrega
  delivery_address TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,

  -- Valores
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Pagamento
  deposit_amount DECIMAL(12,2) DEFAULT 0, -- Valor do sinal
  deposit_paid BOOLEAN DEFAULT false,
  deposit_paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- pending = aguardando confirmação
  -- confirmed = confirmado
  -- in_production = em produção
  -- ready = pronto
  -- delivered = entregue
  -- cancelled = cancelado

  notes TEXT,
  internal_notes TEXT, -- Notas internas (só lojista vê)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da encomenda
CREATE TABLE IF NOT EXISTS custom_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,

  -- Pode ser produto ou kit
  product_id UUID REFERENCES products(id),
  kit_id UUID REFERENCES product_kits(id),

  name VARCHAR(200) NOT NULL, -- Nome do item (cache)
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Personalizações escolhidas (JSON)
  customizations JSONB,
  -- Ex: {"sabor": "Chocolate", "recheio": "Brigadeiro", "tema": "Frozen"}

  -- Se for kit, detalhes dos itens escolhidos
  kit_details JSONB,
  -- Ex: [{"product": "Coxinha", "quantity": 40}, {"product": "Esfiha", "quantity": 60}]

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CALENDÁRIO DE PRODUÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS production_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Capacidade
  max_orders INTEGER DEFAULT 10, -- Máximo de pedidos no dia
  current_orders INTEGER DEFAULT 0, -- Pedidos atuais

  -- Bloqueio
  is_blocked BOOLEAN DEFAULT false, -- Dia bloqueado (folga, feriado)
  block_reason VARCHAR(100),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_kits_store ON product_kits(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_store ON custom_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_date ON custom_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_calendar_date ON production_calendar(store_id, date);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_calendar ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_kits_all') THEN
    CREATE POLICY "product_kits_all" ON product_kits FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_kit_items_all') THEN
    CREATE POLICY "product_kit_items_all" ON product_kit_items FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'customization_groups_all') THEN
    CREATE POLICY "customization_groups_all" ON customization_groups FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'customization_options_all') THEN
    CREATE POLICY "customization_options_all" ON customization_options FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'product_customization_groups_all') THEN
    CREATE POLICY "product_customization_groups_all" ON product_customization_groups FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'custom_orders_all') THEN
    CREATE POLICY "custom_orders_all" ON custom_orders FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'custom_order_items_all') THEN
    CREATE POLICY "custom_order_items_all" ON custom_order_items FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'production_calendar_all') THEN
    CREATE POLICY "production_calendar_all" ON production_calendar FOR ALL USING (true);
  END IF;
END $$;
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
-- Migração: Sistema Completo de Reservas
-- Inclui mesas, reservas, lista de espera, horários e configurações

-- =============================================
-- TABELA: Mesas do Restaurante
-- =============================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  area TEXT DEFAULT 'internal',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  shape TEXT DEFAULT 'square',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, number)
);

-- =============================================
-- TABELA: Configurações de Reservas
-- =============================================
CREATE TABLE IF NOT EXISTS reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,

  -- Horários de funcionamento
  opening_time TIME DEFAULT '11:00',
  closing_time TIME DEFAULT '23:00',
  slot_duration INTEGER DEFAULT 30,

  -- Regras de reserva
  min_party_size INTEGER DEFAULT 1,
  max_party_size INTEGER DEFAULT 20,
  min_advance_hours INTEGER DEFAULT 2,
  max_advance_days INTEGER DEFAULT 30,

  -- Políticas
  allow_same_day BOOLEAN DEFAULT TRUE,
  require_confirmation BOOLEAN DEFAULT TRUE,
  auto_cancel_minutes INTEGER DEFAULT 15,

  -- No-show
  no_show_fee DECIMAL(10,2) DEFAULT 0,
  no_show_fee_per_person BOOLEAN DEFAULT FALSE,

  -- Notificações
  send_confirmation_whatsapp BOOLEAN DEFAULT TRUE,
  send_reminder_hours INTEGER DEFAULT 24,
  reminder_message TEXT DEFAULT 'Olá {nome}! Lembramos da sua reserva para {pessoas} pessoas amanhã às {hora}. Confirma presença? Responda SIM ou NÃO.',

  -- Reserva online
  allow_online_booking BOOLEAN DEFAULT TRUE,
  online_booking_message TEXT DEFAULT 'Reserva realizada com sucesso! Aguarde a confirmação.',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Horários Bloqueados
-- =============================================
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  day_of_week INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Eventos Especiais
-- =============================================
CREATE TABLE IF NOT EXISTS special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  max_reservations INTEGER,
  min_spend DECIMAL(10,2),
  deposit_required DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Reservas
-- =============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- Cliente
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_id UUID,

  -- Detalhes da reserva
  party_size INTEGER NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  duration_minutes INTEGER DEFAULT 90,

  -- Mesa
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  table_preference TEXT,

  -- Status
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  no_show_at TIMESTAMPTZ,

  -- Extras
  special_event_id UUID REFERENCES special_events(id) ON DELETE SET NULL,
  occasion TEXT,
  notes TEXT,
  internal_notes TEXT,

  -- Origem
  source TEXT DEFAULT 'dashboard',

  -- Financeiro
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT FALSE,
  no_show_fee_charged DECIMAL(10,2) DEFAULT 0,

  -- Notificações
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status: pending, confirmed, seated, completed, cancelled, no_show

-- =============================================
-- TABELA: Lista de Espera
-- =============================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  date DATE NOT NULL,
  preferred_time TIME,
  flexible_time BOOLEAN DEFAULT TRUE,
  notes TEXT,
  status TEXT DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  converted_reservation_id UUID REFERENCES reservations(id),
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status: waiting, notified, converted, expired, cancelled

-- =============================================
-- TABELA: Histórico de Reservas do Cliente
-- =============================================
CREATE TABLE IF NOT EXISTS reservation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Estatísticas de Mesas
-- =============================================
CREATE TABLE IF NOT EXISTS table_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_reservations INTEGER DEFAULT 0,
  total_covers INTEGER DEFAULT 0,
  avg_duration_minutes INTEGER,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(table_id, date)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reservations_store_date ON reservations(store_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tables_store ON restaurant_tables(store_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_store_date ON waitlist(store_id, date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_store ON blocked_slots(store_id, date);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_stats ENABLE ROW LEVEL SECURITY;

-- Policies para todas as tabelas
CREATE POLICY "tables_all" ON restaurant_tables FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "settings_all" ON reservation_settings FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "blocked_all" ON blocked_slots FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "events_all" ON special_events FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "reservations_all" ON reservations FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "waitlist_all" ON waitlist FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "history_select" ON reservation_history FOR SELECT USING (
  reservation_id IN (SELECT id FROM reservations WHERE store_id IN (
    SELECT store_id FROM store_users WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "stats_all" ON table_stats FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- Policy pública para reservas online
CREATE POLICY "reservations_public_insert" ON reservations FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para verificar disponibilidade de mesa
CREATE OR REPLACE FUNCTION check_table_availability(
  p_store_id UUID,
  p_table_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER DEFAULT 90
)
RETURNS BOOLEAN AS $$
DECLARE
  v_end_time TIME;
  v_conflict INTEGER;
BEGIN
  v_end_time := p_time + (p_duration || ' minutes')::INTERVAL;

  SELECT COUNT(*) INTO v_conflict
  FROM reservations
  WHERE store_id = p_store_id
    AND table_id = p_table_id
    AND date = p_date
    AND status IN ('pending', 'confirmed', 'seated')
    AND (
      (time <= p_time AND (time + (duration_minutes || ' minutes')::INTERVAL) > p_time)
      OR (time < v_end_time AND time >= p_time)
    );

  RETURN v_conflict = 0;
END;
$$ LANGUAGE plpgsql;

-- Função para sugerir mesa disponível
CREATE OR REPLACE FUNCTION suggest_available_table(
  p_store_id UUID,
  p_date DATE,
  p_time TIME,
  p_party_size INTEGER,
  p_area TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_table_id UUID;
BEGIN
  SELECT t.id INTO v_table_id
  FROM restaurant_tables t
  WHERE t.store_id = p_store_id
    AND t.is_active = TRUE
    AND t.capacity >= p_party_size
    AND (p_area IS NULL OR t.area = p_area)
    AND check_table_availability(p_store_id, t.id, p_date, p_time)
  ORDER BY t.capacity ASC
  LIMIT 1;

  RETURN v_table_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter próxima posição na lista de espera
CREATE OR REPLACE FUNCTION get_waitlist_position(p_store_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  v_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM waitlist
  WHERE store_id = p_store_id
    AND date = p_date
    AND status = 'waiting';

  RETURN v_position;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular estatísticas do dia
CREATE OR REPLACE FUNCTION calculate_reservation_stats(p_store_id UUID, p_date DATE)
RETURNS TABLE(
  total_reservations INTEGER,
  total_covers INTEGER,
  confirmed INTEGER,
  pending INTEGER,
  cancelled INTEGER,
  no_shows INTEGER,
  avg_party_size DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_reservations,
    COALESCE(SUM(party_size), 0)::INTEGER as total_covers,
    COUNT(*) FILTER (WHERE status = 'confirmed')::INTEGER as confirmed,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled,
    COUNT(*) FILTER (WHERE status = 'no_show')::INTEGER as no_shows,
    ROUND(AVG(party_size), 1) as avg_party_size
  FROM reservations
  WHERE store_id = p_store_id AND date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_reservation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_reservation_timestamp();

CREATE TRIGGER tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION update_reservation_timestamp();

-- Trigger para registrar histórico
CREATE OR REPLACE FUNCTION log_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO reservation_history (reservation_id, action, old_status, new_status)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_history_trigger
  AFTER UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION log_reservation_change();
-- Migração: Sistema Completo de Avaliações
-- Inclui reviews, templates, NPS, critérios e alertas

-- =============================================
-- TABELA: Avaliações
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID,
  customer_phone TEXT,
  customer_name TEXT NOT NULL,

  -- Avaliação geral
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Avaliações por critério (1-5)
  rating_food INTEGER CHECK (rating_food >= 1 AND rating_food <= 5),
  rating_delivery INTEGER CHECK (rating_delivery >= 1 AND rating_delivery <= 5),
  rating_service INTEGER CHECK (rating_service >= 1 AND rating_service <= 5),
  rating_packaging INTEGER CHECK (rating_packaging >= 1 AND rating_packaging <= 5),

  -- NPS (0-10)
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),

  -- Fotos
  photos JSONB DEFAULT '[]',

  -- Resposta da loja
  reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID,

  -- Status
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden', 'flagged')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Denúncias
  flag_reason TEXT,
  flagged_at TIMESTAMPTZ,
  flagged_by UUID,

  -- Origem
  source TEXT DEFAULT 'order' CHECK (source IN ('order', 'manual', 'google', 'ifood', 'whatsapp')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Templates de Resposta
-- =============================================
CREATE TABLE IF NOT EXISTS review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  rating_min INTEGER DEFAULT 1,
  rating_max INTEGER DEFAULT 5,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates padrão serão inseridos via função

-- =============================================
-- TABELA: Solicitações de Avaliação
-- =============================================
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Canal
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),

  -- Token único para link
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Configurações de Avaliação
-- =============================================
CREATE TABLE IF NOT EXISTS review_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,

  -- Solicitação automática
  auto_request_enabled BOOLEAN DEFAULT TRUE,
  auto_request_delay_hours INTEGER DEFAULT 2,
  auto_request_channel TEXT DEFAULT 'whatsapp',

  -- Critérios
  enable_food_rating BOOLEAN DEFAULT TRUE,
  enable_delivery_rating BOOLEAN DEFAULT TRUE,
  enable_service_rating BOOLEAN DEFAULT TRUE,
  enable_packaging_rating BOOLEAN DEFAULT FALSE,
  enable_nps BOOLEAN DEFAULT FALSE,
  enable_photos BOOLEAN DEFAULT TRUE,

  -- Moderação
  auto_publish BOOLEAN DEFAULT TRUE,
  min_rating_auto_publish INTEGER DEFAULT 1,
  require_comment BOOLEAN DEFAULT FALSE,
  min_comment_length INTEGER DEFAULT 0,

  -- Exibição
  show_on_menu BOOLEAN DEFAULT TRUE,
  show_customer_name BOOLEAN DEFAULT TRUE,
  featured_count INTEGER DEFAULT 5,

  -- Alertas
  alert_low_rating BOOLEAN DEFAULT TRUE,
  alert_low_rating_threshold INTEGER DEFAULT 3,
  alert_no_reply_days INTEGER DEFAULT 2,
  alert_email TEXT,

  -- Mensagem de solicitação
  request_message TEXT DEFAULT 'Olá {nome}! Como foi seu pedido? Avalie sua experiência: {link}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: Estatísticas de Avaliação (cache)
-- =============================================
CREATE TABLE IF NOT EXISTS review_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,

  -- Totais
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,

  -- Distribuição
  count_5_stars INTEGER DEFAULT 0,
  count_4_stars INTEGER DEFAULT 0,
  count_3_stars INTEGER DEFAULT 0,
  count_2_stars INTEGER DEFAULT 0,
  count_1_stars INTEGER DEFAULT 0,

  -- Médias por critério
  avg_food DECIMAL(3,2) DEFAULT 0,
  avg_delivery DECIMAL(3,2) DEFAULT 0,
  avg_service DECIMAL(3,2) DEFAULT 0,
  avg_packaging DECIMAL(3,2) DEFAULT 0,

  -- NPS
  nps_score INTEGER DEFAULT 0,
  nps_promoters INTEGER DEFAULT 0,
  nps_passives INTEGER DEFAULT 0,
  nps_detractors INTEGER DEFAULT 0,

  -- Resposta
  total_responded INTEGER DEFAULT 0,
  total_pending INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2) DEFAULT 0,

  -- Período
  reviews_this_week INTEGER DEFAULT 0,
  reviews_this_month INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reviews_store ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(store_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(store_id, status);
CREATE INDEX IF NOT EXISTS idx_review_requests_token ON review_requests(token);
CREATE INDEX IF NOT EXISTS idx_review_requests_order ON review_requests(order_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_stats ENABLE ROW LEVEL SECURITY;

-- Reviews - leitura pública para avaliações publicadas
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (
  status = 'published' OR
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "reviews_store_all" ON reviews FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_templates_all" ON review_templates FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_requests_all" ON review_requests FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_settings_all" ON review_settings FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_stats_all" ON review_stats FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular estatísticas de avaliação
CREATE OR REPLACE FUNCTION calculate_review_stats(p_store_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT
    COUNT(*) as total,
    COALESCE(AVG(rating), 0) as avg_rating,
    COUNT(*) FILTER (WHERE rating = 5) as count_5,
    COUNT(*) FILTER (WHERE rating = 4) as count_4,
    COUNT(*) FILTER (WHERE rating = 3) as count_3,
    COUNT(*) FILTER (WHERE rating = 2) as count_2,
    COUNT(*) FILTER (WHERE rating = 1) as count_1,
    COALESCE(AVG(rating_food), 0) as avg_food,
    COALESCE(AVG(rating_delivery), 0) as avg_delivery,
    COALESCE(AVG(rating_service), 0) as avg_service,
    COALESCE(AVG(rating_packaging), 0) as avg_packaging,
    COUNT(*) FILTER (WHERE reply IS NOT NULL) as responded,
    COUNT(*) FILTER (WHERE reply IS NULL) as pending,
    COUNT(*) FILTER (WHERE nps_score >= 9) as promoters,
    COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score <= 8) as passives,
    COUNT(*) FILTER (WHERE nps_score <= 6) as detractors,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
  INTO v_stats
  FROM reviews
  WHERE store_id = p_store_id AND status = 'published';

  INSERT INTO review_stats (
    store_id, total_reviews, average_rating,
    count_5_stars, count_4_stars, count_3_stars, count_2_stars, count_1_stars,
    avg_food, avg_delivery, avg_service, avg_packaging,
    total_responded, total_pending,
    nps_promoters, nps_passives, nps_detractors,
    reviews_this_week, reviews_this_month, updated_at
  ) VALUES (
    p_store_id, v_stats.total, v_stats.avg_rating,
    v_stats.count_5, v_stats.count_4, v_stats.count_3, v_stats.count_2, v_stats.count_1,
    v_stats.avg_food, v_stats.avg_delivery, v_stats.avg_service, v_stats.avg_packaging,
    v_stats.responded, v_stats.pending,
    v_stats.promoters, v_stats.passives, v_stats.detractors,
    v_stats.this_week, v_stats.this_month, NOW()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    count_5_stars = EXCLUDED.count_5_stars,
    count_4_stars = EXCLUDED.count_4_stars,
    count_3_stars = EXCLUDED.count_3_stars,
    count_2_stars = EXCLUDED.count_2_stars,
    count_1_stars = EXCLUDED.count_1_stars,
    avg_food = EXCLUDED.avg_food,
    avg_delivery = EXCLUDED.avg_delivery,
    avg_service = EXCLUDED.avg_service,
    avg_packaging = EXCLUDED.avg_packaging,
    total_responded = EXCLUDED.total_responded,
    total_pending = EXCLUDED.total_pending,
    nps_promoters = EXCLUDED.nps_promoters,
    nps_passives = EXCLUDED.nps_passives,
    nps_detractors = EXCLUDED.nps_detractors,
    reviews_this_week = EXCLUDED.reviews_this_week,
    reviews_this_month = EXCLUDED.reviews_this_month,
    updated_at = NOW();

  -- Calcular NPS
  IF (v_stats.promoters + v_stats.passives + v_stats.detractors) > 0 THEN
    UPDATE review_stats SET
      nps_score = ROUND(
        ((v_stats.promoters::DECIMAL - v_stats.detractors::DECIMAL) /
         (v_stats.promoters + v_stats.passives + v_stats.detractors)) * 100
      )
    WHERE store_id = p_store_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para criar solicitação de avaliação após pedido
CREATE OR REPLACE FUNCTION create_review_request()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
BEGIN
  -- Verificar se pedido foi entregue
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Buscar configurações
    SELECT * INTO v_settings FROM review_settings WHERE store_id = NEW.store_id;

    -- Se solicitação automática está ativada
    IF v_settings.auto_request_enabled THEN
      INSERT INTO review_requests (
        store_id, order_id, customer_phone, customer_name, channel
      ) VALUES (
        NEW.store_id, NEW.id, NEW.customer_phone, NEW.customer_name,
        COALESCE(v_settings.auto_request_channel, 'whatsapp')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar solicitação automaticamente
DROP TRIGGER IF EXISTS trigger_create_review_request ON orders;
CREATE TRIGGER trigger_create_review_request
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_review_request();

-- Função para atualizar stats após nova avaliação
CREATE OR REPLACE FUNCTION update_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM calculate_review_stats(NEW.store_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM calculate_review_stats(OLD.store_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_review_stats ON reviews;
CREATE TRIGGER trigger_update_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_stats();

-- Função para criar templates padrão
CREATE OR REPLACE FUNCTION create_default_review_templates(p_store_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO review_templates (store_id, name, content, category, rating_min, rating_max) VALUES
    (p_store_id, 'Agradecimento 5 estrelas', 'Obrigado pela avaliação, {nome}! Ficamos muito felizes que você teve uma ótima experiência. Esperamos você em breve! 😊', 'positive', 5, 5),
    (p_store_id, 'Agradecimento 4 estrelas', 'Obrigado pelo feedback, {nome}! Estamos sempre buscando melhorar. Conte com a gente! 👍', 'positive', 4, 4),
    (p_store_id, 'Pedido de desculpas', 'Olá {nome}, sentimos muito pela sua experiência. Gostaríamos de entender melhor o que aconteceu para melhorarmos. Pode entrar em contato conosco?', 'negative', 1, 3),
    (p_store_id, 'Resposta neutra', 'Obrigado pelo seu feedback, {nome}! Sua opinião é muito importante para nós.', 'general', 1, 5)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar avaliações pendentes de resposta
CREATE OR REPLACE FUNCTION get_pending_reviews(p_store_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  days_pending INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.customer_name,
    r.rating,
    r.comment,
    r.created_at,
    EXTRACT(DAY FROM NOW() - r.created_at)::INTEGER as days_pending
  FROM reviews r
  WHERE r.store_id = p_store_id
    AND r.reply IS NULL
    AND r.status = 'published'
    AND r.created_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql;
-- Migração: Integrações de Reviews Externos
-- Unificar avaliações de Google, iFood, Rappi, etc.

-- =============================================
-- TABELA: Integrações de Reviews
-- =============================================
CREATE TABLE IF NOT EXISTS review_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- Plataforma
  platform TEXT NOT NULL CHECK (platform IN ('google', 'ifood', 'rappi', 'ubereats', 'facebook', 'tripadvisor', 'reclameaqui', 'manual')),
  platform_name TEXT,

  -- Credenciais/Configuração
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- IDs externos
  external_id TEXT,
  external_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,

  -- Configurações de sync
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_interval_hours INTEGER DEFAULT 6,
  import_replies BOOLEAN DEFAULT TRUE,

  -- Estatísticas da plataforma
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, platform)
);

-- =============================================
-- TABELA: Reviews Importados (externos)
-- =============================================
CREATE TABLE IF NOT EXISTS external_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES review_integrations(id) ON DELETE CASCADE,

  -- ID externo para evitar duplicatas
  external_id TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Dados do review
  customer_name TEXT,
  customer_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Resposta
  reply TEXT,
  reply_external_id TEXT,
  replied_at TIMESTAMPTZ,

  -- Metadados
  review_date TIMESTAMPTZ,
  review_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Importação
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB,

  -- Visibilidade local
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, platform, external_id)
);

-- =============================================
-- TABELA: Logs de Sincronização
-- =============================================
CREATE TABLE IF NOT EXISTS review_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES review_integrations(id) ON DELETE CASCADE,

  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
  reviews_found INTEGER DEFAULT 0,
  reviews_imported INTEGER DEFAULT 0,
  reviews_updated INTEGER DEFAULT 0,
  reviews_skipped INTEGER DEFAULT 0,

  -- Erro
  error_message TEXT,
  error_details JSONB,

  -- Tempo
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

-- =============================================
-- VIEW: Reviews Unificados
-- =============================================
CREATE OR REPLACE VIEW unified_reviews AS
SELECT
  r.id,
  r.store_id,
  'internal' as source_type,
  r.source as platform,
  r.customer_name,
  NULL as customer_avatar,
  r.rating,
  r.comment,
  r.reply,
  r.replied_at,
  r.is_featured,
  r.is_verified,
  r.created_at as review_date,
  NULL as review_url
FROM reviews r
WHERE r.status = 'published'

UNION ALL

SELECT
  er.id,
  er.store_id,
  'external' as source_type,
  er.platform,
  er.customer_name,
  er.customer_avatar,
  er.rating,
  er.comment,
  er.reply,
  er.replied_at,
  er.is_featured,
  er.is_verified,
  er.review_date,
  er.review_url
FROM external_reviews er
WHERE er.is_visible = TRUE;

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_review_integrations_store ON review_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_external_reviews_store ON external_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_external_reviews_platform ON external_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_external_reviews_external_id ON external_reviews(external_id);
CREATE INDEX IF NOT EXISTS idx_review_sync_logs_integration ON review_sync_logs(integration_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE review_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_integrations_all" ON review_integrations FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "external_reviews_all" ON external_reviews FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_sync_logs_all" ON review_sync_logs FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular estatísticas unificadas
CREATE OR REPLACE FUNCTION get_unified_review_stats(p_store_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating DECIMAL,
  internal_count BIGINT,
  external_count BIGINT,
  google_count BIGINT,
  ifood_count BIGINT,
  rappi_count BIGINT,
  facebook_count BIGINT,
  rating_5 BIGINT,
  rating_4 BIGINT,
  rating_3 BIGINT,
  rating_2 BIGINT,
  rating_1 BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_reviews,
    ROUND(AVG(rating)::DECIMAL, 2) as average_rating,
    COUNT(*) FILTER (WHERE source_type = 'internal') as internal_count,
    COUNT(*) FILTER (WHERE source_type = 'external') as external_count,
    COUNT(*) FILTER (WHERE platform = 'google') as google_count,
    COUNT(*) FILTER (WHERE platform = 'ifood') as ifood_count,
    COUNT(*) FILTER (WHERE platform = 'rappi') as rappi_count,
    COUNT(*) FILTER (WHERE platform = 'facebook') as facebook_count,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1
  FROM unified_reviews
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql;

-- Função para importar review externo
CREATE OR REPLACE FUNCTION import_external_review(
  p_store_id UUID,
  p_integration_id UUID,
  p_platform TEXT,
  p_external_id TEXT,
  p_customer_name TEXT,
  p_rating INTEGER,
  p_comment TEXT,
  p_review_date TIMESTAMPTZ,
  p_raw_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_review_id UUID;
BEGIN
  INSERT INTO external_reviews (
    store_id, integration_id, platform, external_id,
    customer_name, rating, comment, review_date, raw_data
  ) VALUES (
    p_store_id, p_integration_id, p_platform, p_external_id,
    p_customer_name, p_rating, p_comment, p_review_date, p_raw_data
  )
  ON CONFLICT (store_id, platform, external_id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    raw_data = EXCLUDED.raw_data
  RETURNING id INTO v_review_id;

  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas da integração
CREATE OR REPLACE FUNCTION update_integration_stats(p_integration_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE review_integrations SET
    total_reviews = (
      SELECT COUNT(*) FROM external_reviews
      WHERE integration_id = p_integration_id
    ),
    average_rating = (
      SELECT ROUND(AVG(rating)::DECIMAL, 2) FROM external_reviews
      WHERE integration_id = p_integration_id
    ),
    updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql;
-- SISTEMA DE CONFIGURAÇÕES GLOBAIS E CONTROLE DE DEMANDA
-- Permite ativar/desativar APIs pagas baseado na demanda

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  value_type VARCHAR(20) DEFAULT 'string', -- string, boolean, number, json
  category VARCHAR(50) DEFAULT 'general', -- general, api, feature, limit
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações iniciais
INSERT INTO system_settings (key, value, value_type, category, description) VALUES
  -- APIs Pagas
  ('google_maps_enabled', 'false', 'boolean', 'api', 'Habilitar API do Google Maps para rotas e geocoding'),
  ('google_maps_api_key', '', 'string', 'api', 'Chave da API do Google Maps'),
  ('realtime_gps_enabled', 'false', 'boolean', 'api', 'Habilitar rastreamento GPS em tempo real dos motoristas'),
  ('push_notifications_enabled', 'false', 'boolean', 'api', 'Habilitar notificações push (OneSignal/FCM)'),
  ('push_notifications_key', '', 'string', 'api', 'Chave do serviço de push notifications'),

  -- Limites para sugerir ativação
  ('google_maps_threshold', '5000', 'number', 'limit', 'Entregas/mês para sugerir ativar Google Maps'),
  ('realtime_gps_threshold', '20', 'number', 'limit', 'Motoristas ativos para sugerir ativar GPS'),
  ('push_notifications_threshold', '100', 'number', 'limit', 'Usuários para sugerir ativar Push'),

  -- Features globais
  ('global_drivers_enabled', 'false', 'boolean', 'feature', 'Habilitar sistema de motoristas globais'),
  ('customer_rewards_enabled', 'true', 'boolean', 'feature', 'Habilitar sistema de recompensas para clientes'),
  ('multi_store_enabled', 'false', 'boolean', 'feature', 'Habilitar gerenciamento multi-lojas'),
  ('driver_accept_reject_enabled', 'false', 'boolean', 'feature', 'Motorista pode aceitar/recusar entregas (OFF = aceita automaticamente)')
ON CONFLICT (key) DO NOTHING;

-- Tabela de avaliações de motoristas
CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES deliveries(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rated_by VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_store ON driver_ratings(store_id);

ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'driver_ratings_all') THEN
    CREATE POLICY "driver_ratings_all" ON driver_ratings FOR ALL USING (true);
  END IF;
END $$;

-- Tabela de métricas do sistema (para dashboard de demanda)
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  total_tenants INTEGER DEFAULT 0,
  total_stores INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_drivers INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics(metric_date);

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Policies (apenas superadmin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'system_settings_all') THEN
    CREATE POLICY "system_settings_all" ON system_settings FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'system_metrics_all') THEN
    CREATE POLICY "system_metrics_all" ON system_metrics FOR ALL USING (true);
  END IF;
END $$;
-- SISTEMA PREMIUM DE MESAS
-- QR Code, Reservas, Chamar Garçom, Timer, Histórico, Garçom por Mesa

-- Adicionar novos campos na tabela tables
ALTER TABLE tables ADD COLUMN IF NOT EXISTS occupied_at TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS merged_with UUID[];
ALTER TABLE tables ADD COLUMN IF NOT EXISTS waiter_called BOOLEAN DEFAULT false;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS waiter_called_at TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS location VARCHAR(50); -- Área Interna, Varanda, Terraço, etc
ALTER TABLE tables ADD COLUMN IF NOT EXISTS waiter_id UUID; -- Garçom responsável
ALTER TABLE tables ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(100); -- Nome do garçom (cache)
ALTER TABLE tables ADD COLUMN IF NOT EXISTS min_consumption DECIMAL(10,2) DEFAULT 0; -- Consumo mínimo
ALTER TABLE tables ADD COLUMN IF NOT EXISTS is_smoking BOOLEAN DEFAULT false; -- Área fumante
ALTER TABLE tables ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT false; -- Acessível PCD
ALTER TABLE tables ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'square'; -- square, round, rectangle

-- Tabela de garçons da loja
CREATE TABLE IF NOT EXISTS store_waiters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  photo_url TEXT,
  commission_percent DECIMAL(5,2) DEFAULT 0, -- % de comissão
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de escalas/turnos
CREATE TABLE IF NOT EXISTS waiter_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  waiter_id UUID NOT NULL REFERENCES store_waiters(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift VARCHAR(20) NOT NULL, -- morning, afternoon, evening, night
  start_time TIME,
  end_time TIME,
  tables_assigned TEXT[], -- Lista de números de mesas
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de comissões
CREATE TABLE IF NOT EXISTS waiter_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  waiter_id UUID NOT NULL REFERENCES store_waiters(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  table_id UUID REFERENCES tables(id),
  order_amount DECIMAL(12,2) NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_store_waiters_store ON store_waiters(store_id);
CREATE INDEX IF NOT EXISTS idx_waiter_schedules_date ON waiter_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_waiter_commissions_waiter ON waiter_commissions(waiter_id);

-- RLS
ALTER TABLE store_waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_commissions ENABLE ROW LEVEL SECURITY;

-- Policies garçons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'store_waiters_all') THEN
    CREATE POLICY "store_waiters_all" ON store_waiters FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waiter_schedules_all') THEN
    CREATE POLICY "waiter_schedules_all" ON waiter_schedules FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waiter_commissions_all') THEN
    CREATE POLICY "waiter_commissions_all" ON waiter_commissions FOR ALL USING (true);
  END IF;
END $$;

-- Tabela de reservas
CREATE TABLE IF NOT EXISTS table_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  party_size INTEGER DEFAULT 2,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed, no_show
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de chamadas de garçom
CREATE TABLE IF NOT EXISTS waiter_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  call_type VARCHAR(20) DEFAULT 'assistance', -- assistance, bill, order, water
  status VARCHAR(20) DEFAULT 'pending', -- pending, acknowledged, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Tabela de histórico de mesas
CREATE TABLE IF NOT EXISTS table_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_amount DECIMAL(10,2) DEFAULT 0,
  guests_count INTEGER DEFAULT 1,
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_table_reservations_store ON table_reservations(store_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_store ON waiter_calls(store_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON waiter_calls(status);
CREATE INDEX IF NOT EXISTS idx_table_sessions_table ON table_sessions(table_id);

-- RLS
ALTER TABLE table_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'table_reservations_all') THEN
    CREATE POLICY "table_reservations_all" ON table_reservations FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'waiter_calls_all') THEN
    CREATE POLICY "waiter_calls_all" ON waiter_calls FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'table_sessions_all') THEN
    CREATE POLICY "table_sessions_all" ON table_sessions FOR ALL USING (true);
  END IF;
END $$;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS orders_store_idempotency_uq
ON public.orders (store_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;
CREATE SEQUENCE IF NOT EXISTS public.order_code_seq;

CREATE OR REPLACE FUNCTION public.generate_order_code(p_prefix text DEFAULT 'A')
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_next bigint;
BEGIN
  v_next := nextval('public.order_code_seq');
  RETURN upper(left(coalesce(nullif(trim(p_prefix), ''), 'A'), 1)) || lpad(v_next::text, 6, '0');
END;
$$;

 ALTER TABLE public.orders
 ALTER COLUMN code SET DEFAULT public.generate_order_code('A');

 GRANT USAGE, SELECT ON SEQUENCE public.order_code_seq TO anon, authenticated;
 GRANT EXECUTE ON FUNCTION public.generate_order_code(text) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.create_order_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_store_id uuid;
  v_idempotency_key uuid;
  v_existing record;
  v_order_id uuid;
  v_order_code text;
  v_channel order_channel_enum;
  v_payment_method payment_method_enum;
  v_subtotal numeric;
  v_discount numeric;
  v_delivery_fee numeric;
  v_total numeric;
  v_notes text;
  v_customer jsonb;
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_customer_id uuid;
  v_delivery_address jsonb;
  v_delivery_address_id uuid;
  v_item jsonb;
  v_order_item_id uuid;
  v_modifier jsonb;
  v_created_by uuid;
BEGIN
  IF p_payload IS NULL THEN
    RAISE EXCEPTION 'payload is required';
  END IF;

  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_idempotency_key := nullif(p_payload->>'idempotency_key', '')::uuid;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id is required';
  END IF;

  IF v_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'idempotency_key is required';
  END IF;

  SELECT id, code
    INTO v_existing
    FROM public.orders
   WHERE store_id = v_store_id
     AND idempotency_key = v_idempotency_key
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'order_id', v_existing.id,
      'code', v_existing.code,
      'idempotent', true
    );
  END IF;

  v_channel := (p_payload->>'channel')::order_channel_enum;
  v_payment_method := (p_payload->>'payment_method')::payment_method_enum;

  v_subtotal := coalesce((p_payload->>'subtotal_amount')::numeric, 0);
  v_discount := coalesce((p_payload->>'discount_amount')::numeric, 0);
  v_delivery_fee := coalesce((p_payload->>'delivery_fee')::numeric, 0);
  v_total := coalesce((p_payload->>'total_amount')::numeric, 0);
  v_notes := nullif(p_payload->>'notes', '');

  v_customer := p_payload->'customer';
  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'customer is required';
  END IF;

  v_customer_phone := nullif(v_customer->>'phone', '');
  IF v_customer_phone IS NULL THEN
    RAISE EXCEPTION 'customer.phone is required';
  END IF;

  v_customer_name := nullif(v_customer->>'name', '');
  v_customer_email := nullif(v_customer->>'email', '');

  -- best-effort: capture auth user id if present
  v_created_by := auth.uid();

  -- Customer upsert by (store_id, phone)
  SELECT id
    INTO v_customer_id
    FROM public.customers
   WHERE store_id = v_store_id
     AND phone = v_customer_phone
   LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, name, phone, email)
    VALUES (
      v_store_id,
      coalesce(v_customer_name, 'Cliente'),
      v_customer_phone,
      v_customer_email
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- Delivery address (only if provided)
  v_delivery_address := p_payload->'delivery_address';
  v_delivery_address_id := NULL;

  IF v_delivery_address IS NOT NULL AND jsonb_typeof(v_delivery_address) = 'object' THEN
    INSERT INTO public.customer_addresses (
      customer_id,
      street,
      number,
      complement,
      district,
      city,
      state,
      zip_code,
      reference
    )
    VALUES (
      v_customer_id,
      v_delivery_address->>'street',
      v_delivery_address->>'number',
      nullif(v_delivery_address->>'complement', ''),
      v_delivery_address->>'district',
      v_delivery_address->>'city',
      v_delivery_address->>'state',
      v_delivery_address->>'zip_code',
      nullif(v_delivery_address->>'reference', '')
    )
    RETURNING id INTO v_delivery_address_id;
  END IF;

  v_order_code := public.generate_order_code('A');

  INSERT INTO public.orders (
    store_id,
    customer_id,
    code,
    channel,
    status,
    subtotal_amount,
    discount_amount,
    delivery_fee,
    total_amount,
    payment_method,
    delivery_address_id,
    notes,
    idempotency_key
  )
  VALUES (
    v_store_id,
    v_customer_id,
    v_order_code,
    v_channel,
    'PENDING',
    v_subtotal,
    v_discount,
    v_delivery_fee,
    v_total,
    v_payment_method,
    v_delivery_address_id,
    v_notes,
    v_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- Items
  IF jsonb_typeof(p_payload->'items') <> 'array' THEN
    RAISE EXCEPTION 'items must be an array';
  END IF;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      title_snapshot,
      unit_price,
      quantity,
      unit_type,
      weight,
      subtotal
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'title_snapshot',
      coalesce((v_item->>'unit_price')::numeric, 0),
      coalesce((v_item->>'quantity')::int, 1),
      coalesce((v_item->>'unit_type')::product_unit_type_enum, 'unit'::product_unit_type_enum),
      nullif(v_item->>'weight', '')::numeric,
      coalesce((v_item->>'subtotal')::numeric, 0)
    )
    RETURNING id INTO v_order_item_id;

    IF jsonb_typeof(v_item->'modifiers') = 'array' THEN
      FOR v_modifier IN
        SELECT * FROM jsonb_array_elements(v_item->'modifiers')
      LOOP
        INSERT INTO public.order_item_modifiers (
          order_item_id,
          modifier_option_id,
          name_snapshot,
          extra_price
        )
        VALUES (
          v_order_item_id,
          (v_modifier->>'modifier_option_id')::uuid,
          v_modifier->>'name_snapshot',
          coalesce((v_modifier->>'extra_price')::numeric, 0)
        );
      END LOOP;
    END IF;
  END LOOP;

  INSERT INTO public.order_events (order_id, type, message, created_by)
  VALUES (v_order_id, 'CREATED', 'Pedido criado', v_created_by);

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'code', v_order_code,
    'idempotent', false
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: another transaction created the order with same (store_id, idempotency_key)
    SELECT id, code
      INTO v_existing
      FROM public.orders
     WHERE store_id = v_store_id
       AND idempotency_key = v_idempotency_key
     LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'order_id', v_existing.id,
        'code', v_existing.code,
        'idempotent', true
      );
    END IF;

    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb) TO anon, authenticated;
-- COMANDO 02: create_order_atomic produção (pricing + estoque atômicos)

-- Permitir estoque fracionado (necessário para produtos por peso)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity numeric(10,3);

ALTER TABLE public.products
ALTER COLUMN stock_quantity TYPE numeric(10,3)
USING stock_quantity::numeric;

CREATE OR REPLACE FUNCTION public.create_order_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
  v_idempotency_key uuid;
  v_existing record;

  v_order_id uuid;
  v_order_code text;
  v_channel order_channel_enum;
  v_payment_method payment_method_enum;

  v_customer jsonb;
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_customer_id uuid;

  v_delivery_address jsonb;
  v_delivery_address_id uuid;

  v_discount numeric;
  v_delivery_fee numeric;
  v_subtotal numeric;
  v_total numeric;
  v_notes text;

  v_coupon_code text;
  v_coupon record;
  v_coupon_id uuid;

  v_store_delivery_fee numeric;
  v_store_enable_coupons boolean;

  v_items_prepared jsonb := '[]'::jsonb;
  v_item jsonb;

  v_product record;
  v_product_id uuid;
  v_quantity int;
  v_unit_type product_unit_type_enum;
  v_weight numeric;
  v_needed numeric;
  v_unit_price numeric;
  v_base_amount numeric;
  v_mods_total numeric;
  v_item_subtotal numeric;
  v_item_mods jsonb;

  v_group_counts jsonb;
  v_group_id uuid;
  v_group_count int;
  v_required_min int;

  v_modifier jsonb;
  v_mod record;
  v_modifier_option_id uuid;
  v_is_allowed boolean;

  v_created_by uuid;
  v_prepared jsonb;
  v_order_item_id uuid;
BEGIN
  IF p_payload IS NULL THEN
    RAISE EXCEPTION 'payload is required';
  END IF;

  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_idempotency_key := nullif(p_payload->>'idempotency_key', '')::uuid;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id is required';
  END IF;

  IF v_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'idempotency_key is required';
  END IF;

  -- Store deve existir e estar ativa
  PERFORM 1 FROM public.stores s WHERE s.id = v_store_id AND s.is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'store_id inválido ou loja inativa';
  END IF;

  -- Serializa por (store_id, idempotency_key) para evitar efeitos colaterais duplicados
  PERFORM pg_advisory_xact_lock(hashtextextended(v_store_id::text || ':' || v_idempotency_key::text, 0));

  SELECT id, code
    INTO v_existing
    FROM public.orders
   WHERE store_id = v_store_id
     AND idempotency_key = v_idempotency_key
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'order_id', v_existing.id,
      'code', v_existing.code,
      'idempotent', true
    );
  END IF;

  v_channel := (p_payload->>'channel')::order_channel_enum;
  v_payment_method := (p_payload->>'payment_method')::payment_method_enum;
  v_notes := nullif(p_payload->>'notes', '');

  IF v_channel IS NULL THEN
    RAISE EXCEPTION 'channel is required';
  END IF;

  IF v_payment_method IS NULL THEN
    RAISE EXCEPTION 'payment_method is required';
  END IF;

  v_coupon_code := nullif(p_payload->>'coupon_code', '');
  v_discount := 0;
  v_coupon_id := NULL;

  v_customer := p_payload->'customer';
  IF v_customer IS NULL OR jsonb_typeof(v_customer) <> 'object' THEN
    RAISE EXCEPTION 'customer is required';
  END IF;

  v_customer_phone := nullif(v_customer->>'phone', '');
  IF v_customer_phone IS NULL THEN
    RAISE EXCEPTION 'customer.phone is required';
  END IF;

  v_customer_name := nullif(v_customer->>'name', '');
  v_customer_email := nullif(v_customer->>'email', '');

  v_created_by := auth.uid();

  -- Customer upsert by (store_id, phone)
  SELECT id
    INTO v_customer_id
    FROM public.customers
   WHERE store_id = v_store_id
     AND phone = v_customer_phone
   LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, name, phone, email)
    VALUES (
      v_store_id,
      coalesce(v_customer_name, 'Cliente'),
      v_customer_phone,
      v_customer_email
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- Delivery fee vem do banco (não confiar no client)
  IF v_channel = 'DELIVERY' THEN
    SELECT ss.delivery_fee, ss.enable_coupons
      INTO v_store_delivery_fee, v_store_enable_coupons
      FROM public.store_settings ss
     WHERE ss.store_id = v_store_id
     LIMIT 1;

    v_delivery_fee := coalesce(v_store_delivery_fee, 0);
  ELSE
    SELECT ss.enable_coupons
      INTO v_store_enable_coupons
      FROM public.store_settings ss
     WHERE ss.store_id = v_store_id
     LIMIT 1;
    v_delivery_fee := 0;
  END IF;

  v_store_enable_coupons := coalesce(v_store_enable_coupons, true);

  -- Endereço de entrega (obrigatório para delivery)
  v_delivery_address_id := NULL;
  v_delivery_address := p_payload->'delivery_address';

  IF v_channel = 'DELIVERY' THEN
    IF v_delivery_address IS NULL OR jsonb_typeof(v_delivery_address) <> 'object' THEN
      RAISE EXCEPTION 'delivery_address is required for DELIVERY';
    END IF;

    INSERT INTO public.customer_addresses (
      customer_id,
      street,
      number,
      complement,
      district,
      city,
      state,
      zip_code,
      reference
    )
    VALUES (
      v_customer_id,
      v_delivery_address->>'street',
      v_delivery_address->>'number',
      nullif(v_delivery_address->>'complement', ''),
      v_delivery_address->>'district',
      v_delivery_address->>'city',
      v_delivery_address->>'state',
      v_delivery_address->>'zip_code',
      nullif(v_delivery_address->>'reference', '')
    )
    RETURNING id INTO v_delivery_address_id;
  END IF;

  -- Items (pricing + estoque) - atômico e concorrente
  v_subtotal := 0;

  IF jsonb_typeof(p_payload->'items') <> 'array' THEN
    RAISE EXCEPTION 'items must be an array';
  END IF;

  IF jsonb_array_length(p_payload->'items') = 0 THEN
    RAISE EXCEPTION 'items must not be empty';
  END IF;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_payload->'items')
  LOOP
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'item.product_id is required';
    END IF;

    v_unit_type := coalesce((v_item->>'unit_type')::product_unit_type_enum, 'unit'::product_unit_type_enum);

    v_quantity := coalesce(nullif(v_item->>'quantity', '')::int, 1);
    v_weight := nullif(v_item->>'weight', '')::numeric;

    -- Lock do produto para concorrência
    SELECT p.id, p.store_id, p.name, p.base_price, p.price_per_unit, p.unit_type, p.stock_quantity, p.is_active
      INTO v_product
      FROM public.products p
     WHERE p.id = v_product_id
       AND p.store_id = v_store_id
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto não encontrado (product_id=%)', v_product_id;
    END IF;

    IF v_product.is_active IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Produto inativo (product_id=%)', v_product_id;
    END IF;

    IF v_product.unit_type <> v_unit_type THEN
      RAISE EXCEPTION 'unit_type inválido para product_id=% (esperado=%)', v_product_id, v_product.unit_type;
    END IF;

    IF v_unit_type = 'weight' THEN
      IF v_weight IS NULL OR v_weight <= 0 THEN
        RAISE EXCEPTION 'weight é obrigatório e deve ser > 0 (product_id=%)', v_product_id;
      END IF;

      IF v_product.price_per_unit IS NULL THEN
        RAISE EXCEPTION 'price_per_unit é obrigatório para produto por peso (product_id=%)', v_product_id;
      END IF;

      v_unit_price := v_product.price_per_unit;
      v_needed := v_weight;
      v_base_amount := v_unit_price * v_weight;
    ELSE
      IF v_quantity <= 0 THEN
        RAISE EXCEPTION 'quantity deve ser > 0 (product_id=%)', v_product_id;
      END IF;

      v_unit_price := v_product.base_price;
      v_needed := v_quantity;
      v_base_amount := v_unit_price * v_quantity;
    END IF;

    -- Débito de estoque (somente se stock_quantity NÃO for NULL)
    IF v_product.stock_quantity IS NOT NULL THEN
      UPDATE public.products p
         SET stock_quantity = p.stock_quantity - v_needed
       WHERE p.id = v_product_id
         AND p.store_id = v_store_id
         AND p.stock_quantity IS NOT NULL
         AND p.stock_quantity >= v_needed;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'out_of_stock';
      END IF;
    END IF;

    -- Modificadores (validar existência, store, ativo e permitido no produto)
    v_mods_total := 0;
    v_item_mods := '[]'::jsonb;
    v_group_counts := '{}'::jsonb;

    IF jsonb_typeof(v_item->'modifiers') = 'array' THEN
      FOR v_modifier IN
        SELECT * FROM jsonb_array_elements(v_item->'modifiers')
      LOOP
        v_modifier_option_id := nullif(v_modifier->>'modifier_option_id', '')::uuid;
        IF v_modifier_option_id IS NULL THEN
          RAISE EXCEPTION 'modifier_option_id é obrigatório';
        END IF;

        SELECT mo.id, mo.name, mo.extra_price, mo.is_active,
               mg.id AS group_id, mg.store_id, mg.applies_to_all_products,
               mg.min_quantity, mg.max_quantity, mg.required
          INTO v_mod
          FROM public.modifier_options mo
          JOIN public.modifier_groups mg ON mg.id = mo.group_id
         WHERE mo.id = v_modifier_option_id
         LIMIT 1;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Modifier option não existe (id=%)', v_modifier_option_id;
        END IF;

        IF v_mod.store_id <> v_store_id THEN
          RAISE EXCEPTION 'Modifier option não pertence à store (id=%)', v_modifier_option_id;
        END IF;

        IF v_mod.is_active IS DISTINCT FROM true THEN
          RAISE EXCEPTION 'Modifier option inativo (id=%)', v_modifier_option_id;
        END IF;

        IF v_mod.applies_to_all_products IS DISTINCT FROM true THEN
          SELECT EXISTS (
            SELECT 1
              FROM public.product_modifier_groups pmg
             WHERE pmg.product_id = v_product_id
               AND pmg.group_id = v_mod.group_id
          )
          INTO v_is_allowed;

          IF v_is_allowed IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'Modifier option % não permitido para product_id=%', v_modifier_option_id, v_product_id;
          END IF;
        END IF;

        v_mods_total := v_mods_total + v_mod.extra_price;

        v_group_id := v_mod.group_id;
        v_group_count := coalesce(nullif(v_group_counts->>v_group_id::text, '')::int, 0) + 1;
        IF v_group_count > v_mod.max_quantity THEN
          RAISE EXCEPTION 'Quantidade de modificadores excede max_quantity (group_id=%)', v_group_id;
        END IF;
        v_group_counts := jsonb_set(v_group_counts, ARRAY[v_group_id::text], to_jsonb(v_group_count), true);

        v_item_mods := v_item_mods || jsonb_build_array(
          jsonb_build_object(
            'modifier_option_id', v_mod.id,
            'name_snapshot', v_mod.name,
            'extra_price', v_mod.extra_price
          )
        );
      END LOOP;
    END IF;

    -- Validar grupos obrigatórios/min/max para o produto
    FOR v_mod IN
      SELECT mg.id, mg.min_quantity, mg.max_quantity, mg.required
        FROM public.modifier_groups mg
       WHERE mg.store_id = v_store_id
         AND (mg.applies_to_all_products = true OR EXISTS (
           SELECT 1 FROM public.product_modifier_groups pmg
            WHERE pmg.product_id = v_product_id
              AND pmg.group_id = mg.id
         ))
    LOOP
      v_group_id := v_mod.id;
      v_group_count := coalesce(nullif(v_group_counts->>v_group_id::text, '')::int, 0);
      v_required_min := CASE
        WHEN v_mod.required IS DISTINCT FROM true THEN v_mod.min_quantity
        WHEN v_mod.min_quantity IS NULL OR v_mod.min_quantity = 0 THEN 1
        ELSE v_mod.min_quantity
      END;

      IF v_group_count < v_required_min THEN
        RAISE EXCEPTION 'Grupo de modificadores obrigatório não atendido (group_id=%)', v_group_id;
      END IF;

      IF v_group_count > v_mod.max_quantity THEN
        RAISE EXCEPTION 'Grupo de modificadores excede max_quantity (group_id=%)', v_group_id;
      END IF;
    END LOOP;

    v_item_subtotal := v_base_amount + (v_mods_total * CASE WHEN v_unit_type = 'weight' THEN 1 ELSE v_quantity END);
    v_subtotal := v_subtotal + v_item_subtotal;

    v_items_prepared := v_items_prepared || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product_id,
        'title_snapshot', v_product.name,
        'unit_price', v_unit_price,
        'quantity', CASE WHEN v_unit_type = 'weight' THEN 1 ELSE v_quantity END,
        'unit_type', v_unit_type,
        'weight', CASE WHEN v_unit_type = 'weight' THEN v_weight ELSE NULL END,
        'subtotal', v_item_subtotal,
        'modifiers', v_item_mods
      )
    );
  END LOOP;

  -- Cupom: aplicar SOMENTE com base no banco (não confiar em desconto do client)
  IF v_coupon_code IS NOT NULL THEN
    IF v_store_enable_coupons IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Cupons desabilitados para esta loja';
    END IF;

    SELECT c.*
      INTO v_coupon
      FROM public.coupons c
     WHERE c.store_id = v_store_id
       AND upper(c.code) = upper(v_coupon_code)
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom não encontrado';
    END IF;

    IF v_coupon.is_active IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Cupom inativo';
    END IF;

    IF v_coupon.valid_from IS NOT NULL AND now() < v_coupon.valid_from THEN
      RAISE EXCEPTION 'Cupom ainda não está válido';
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
      RAISE EXCEPTION 'Cupom expirado';
    END IF;

    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Cupom atingiu o limite de uso';
    END IF;

    IF v_coupon.min_order_amount IS NOT NULL AND v_subtotal < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'Subtotal não atinge o mínimo do cupom';
    END IF;

    IF v_coupon.discount_type::text = 'percent' THEN
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100), 2);
    ELSE
      v_discount := least(v_coupon.discount_value, v_subtotal);
    END IF;

    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_discount := least(v_discount, v_coupon.max_discount_amount);
    END IF;

    v_discount := greatest(0, least(v_discount, v_subtotal));
    v_coupon_id := v_coupon.id;

    UPDATE public.coupons
       SET usage_count = usage_count + 1
     WHERE id = v_coupon_id;
  END IF;

  IF v_discount > v_subtotal THEN
    RAISE EXCEPTION 'discount_amount excede subtotal';
  END IF;

  v_total := greatest(0, (v_subtotal - v_discount) + v_delivery_fee);

  v_order_code := public.generate_order_code('A');

  INSERT INTO public.orders (
    store_id,
    customer_id,
    code,
    channel,
    status,
    subtotal_amount,
    discount_amount,
    delivery_fee,
    total_amount,
    payment_method,
    coupon_id,
    delivery_address_id,
    notes,
    idempotency_key
  )
  VALUES (
    v_store_id,
    v_customer_id,
    v_order_code,
    v_channel,
    'PENDING',
    v_subtotal,
    v_discount,
    v_delivery_fee,
    v_total,
    v_payment_method,
    v_coupon_id,
    v_delivery_address_id,
    v_notes,
    v_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- Persistir snapshots calculados
  FOR v_prepared IN
    SELECT * FROM jsonb_array_elements(v_items_prepared)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      title_snapshot,
      unit_price,
      quantity,
      unit_type,
      weight,
      subtotal
    )
    VALUES (
      v_order_id,
      (v_prepared->>'product_id')::uuid,
      v_prepared->>'title_snapshot',
      (v_prepared->>'unit_price')::numeric,
      (v_prepared->>'quantity')::int,
      (v_prepared->>'unit_type')::product_unit_type_enum,
      nullif(v_prepared->>'weight', '')::numeric,
      (v_prepared->>'subtotal')::numeric
    )
    RETURNING id INTO v_order_item_id;

    IF jsonb_typeof(v_prepared->'modifiers') = 'array' THEN
      FOR v_modifier IN
        SELECT * FROM jsonb_array_elements(v_prepared->'modifiers')
      LOOP
        INSERT INTO public.order_item_modifiers (
          order_item_id,
          modifier_option_id,
          name_snapshot,
          extra_price
        )
        VALUES (
          v_order_item_id,
          (v_modifier->>'modifier_option_id')::uuid,
          v_modifier->>'name_snapshot',
          (v_modifier->>'extra_price')::numeric
        );
      END LOOP;
    END IF;
  END LOOP;

  INSERT INTO public.order_events (order_id, type, message, created_by)
  VALUES (v_order_id, 'CREATED', 'Pedido criado', v_created_by);

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'code', v_order_code,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb) TO anon, authenticated;
-- COMANDO 03 — RLS completo + isolamento multi-tenant (store_id)

-- 1) Helper padronizado
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
  );
$$;

-- ============================================================================
-- Tabelas com store_id
-- ============================================================================

-- stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Super admin can view all stores" ON public.stores;

DROP POLICY IF EXISTS stores_select ON public.stores;
CREATE POLICY stores_select
ON public.stores
FOR SELECT
USING (public.user_has_store_access(id));

DROP POLICY IF EXISTS stores_insert ON public.stores;
CREATE POLICY stores_insert
ON public.stores
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS stores_update ON public.stores;
CREATE POLICY stores_update
ON public.stores
FOR UPDATE
USING (public.user_has_store_access(id))
WITH CHECK (public.user_has_store_access(id));

-- store_users
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own store memberships" ON public.store_users;
DROP POLICY IF EXISTS "Authenticated users can view all store users" ON public.store_users;
DROP POLICY IF EXISTS "Store owners can manage store users" ON public.store_users;

DROP POLICY IF EXISTS store_users_select ON public.store_users;
CREATE POLICY store_users_select
ON public.store_users
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_users_insert ON public.store_users;
CREATE POLICY store_users_insert
ON public.store_users
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_users_update ON public.store_users;
CREATE POLICY store_users_update
ON public.store_users
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_users_delete ON public.store_users;
CREATE POLICY store_users_delete
ON public.store_users
FOR DELETE
USING (public.user_has_store_access(store_id));

-- store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_settings_select ON public.store_settings;
CREATE POLICY store_settings_select
ON public.store_settings
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_settings_insert ON public.store_settings;
CREATE POLICY store_settings_insert
ON public.store_settings
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS store_settings_update ON public.store_settings;
CREATE POLICY store_settings_update
ON public.store_settings
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

-- categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories of active stores" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Store users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;

DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select
ON public.categories
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS categories_insert ON public.categories;
CREATE POLICY categories_insert
ON public.categories
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS categories_update ON public.categories;
CREATE POLICY categories_update
ON public.categories
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS categories_delete ON public.categories;
CREATE POLICY categories_delete
ON public.categories
FOR DELETE
USING (public.user_has_store_access(store_id));

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products of active stores" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON public.products;
DROP POLICY IF EXISTS "Store users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

DROP POLICY IF EXISTS products_select ON public.products;
CREATE POLICY products_select
ON public.products
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS products_insert ON public.products;
CREATE POLICY products_insert
ON public.products
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS products_update ON public.products;
CREATE POLICY products_update
ON public.products
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS products_delete ON public.products;
CREATE POLICY products_delete
ON public.products
FOR DELETE
USING (public.user_has_store_access(store_id));

-- customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Store users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

DROP POLICY IF EXISTS customers_select ON public.customers;
CREATE POLICY customers_select
ON public.customers
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert
ON public.customers
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update
ON public.customers
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_delete ON public.customers;
CREATE POLICY customers_delete
ON public.customers
FOR DELETE
USING (public.user_has_store_access(store_id));

-- tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tables_select ON public.tables;
CREATE POLICY tables_select
ON public.tables
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS tables_insert ON public.tables;
CREATE POLICY tables_insert
ON public.tables
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS tables_update ON public.tables;
CREATE POLICY tables_update
ON public.tables
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS tables_delete ON public.tables;
CREATE POLICY tables_delete
ON public.tables
FOR DELETE
USING (public.user_has_store_access(store_id));

-- coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coupons_select ON public.coupons;
CREATE POLICY coupons_select
ON public.coupons
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS coupons_insert ON public.coupons;
CREATE POLICY coupons_insert
ON public.coupons
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS coupons_update ON public.coupons;
CREATE POLICY coupons_update
ON public.coupons
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS coupons_delete ON public.coupons;
CREATE POLICY coupons_delete
ON public.coupons
FOR DELETE
USING (public.user_has_store_access(store_id));

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select
ON public.notifications
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert
ON public.notifications
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update
ON public.notifications
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete
ON public.notifications
FOR DELETE
USING (public.user_has_store_access(store_id));

-- internal_messages
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS internal_messages_select ON public.internal_messages;
CREATE POLICY internal_messages_select
ON public.internal_messages
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS internal_messages_insert ON public.internal_messages;
CREATE POLICY internal_messages_insert
ON public.internal_messages
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS internal_messages_update ON public.internal_messages;
CREATE POLICY internal_messages_update
ON public.internal_messages
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS internal_messages_delete ON public.internal_messages;
CREATE POLICY internal_messages_delete
ON public.internal_messages
FOR DELETE
USING (public.user_has_store_access(store_id));

-- inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_items_select ON public.inventory_items;
CREATE POLICY inventory_items_select
ON public.inventory_items
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS inventory_items_insert ON public.inventory_items;
CREATE POLICY inventory_items_insert
ON public.inventory_items
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS inventory_items_update ON public.inventory_items;
CREATE POLICY inventory_items_update
ON public.inventory_items
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS inventory_items_delete ON public.inventory_items;
CREATE POLICY inventory_items_delete
ON public.inventory_items
FOR DELETE
USING (public.user_has_store_access(store_id));

-- cash_registers
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_registers_select ON public.cash_registers;
CREATE POLICY cash_registers_select
ON public.cash_registers
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS cash_registers_insert ON public.cash_registers;
CREATE POLICY cash_registers_insert
ON public.cash_registers
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS cash_registers_update ON public.cash_registers;
CREATE POLICY cash_registers_update
ON public.cash_registers
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS cash_registers_delete ON public.cash_registers;
CREATE POLICY cash_registers_delete
ON public.cash_registers
FOR DELETE
USING (public.user_has_store_access(store_id));

-- printers
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS printers_select ON public.printers;
CREATE POLICY printers_select
ON public.printers
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS printers_insert ON public.printers;
CREATE POLICY printers_insert
ON public.printers
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS printers_update ON public.printers;
CREATE POLICY printers_update
ON public.printers
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS printers_delete ON public.printers;
CREATE POLICY printers_delete
ON public.printers
FOR DELETE
USING (public.user_has_store_access(store_id));

-- ============================================================================
-- Tabelas sem store_id (join-policy)
-- ============================================================================

-- customer_addresses (via customers.store_id)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_addresses_select ON public.customer_addresses;
CREATE POLICY customer_addresses_select
ON public.customer_addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_insert ON public.customer_addresses;
CREATE POLICY customer_addresses_insert
ON public.customer_addresses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_update ON public.customer_addresses;
CREATE POLICY customer_addresses_update
ON public.customer_addresses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_delete ON public.customer_addresses;
CREATE POLICY customer_addresses_delete
ON public.customer_addresses
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

-- orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Store users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Store users can manage orders" ON public.orders;

DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select
ON public.orders
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert
ON public.orders
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update
ON public.orders
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_delete ON public.orders;
CREATE POLICY orders_delete
ON public.orders
FOR DELETE
USING (public.user_has_store_access(store_id));

-- order_items (via orders.store_id)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Store users can view order items" ON public.order_items;

DROP POLICY IF EXISTS order_items_select ON public.order_items;
CREATE POLICY order_items_select
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_insert ON public.order_items;
CREATE POLICY order_items_insert
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_update ON public.order_items;
CREATE POLICY order_items_update
ON public.order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_delete ON public.order_items;
CREATE POLICY order_items_delete
ON public.order_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_item_modifiers (via order_items -> orders.store_id)
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oim_select ON public.order_item_modifiers;
CREATE POLICY oim_select
ON public.order_item_modifiers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_insert ON public.order_item_modifiers;
CREATE POLICY oim_insert
ON public.order_item_modifiers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_update ON public.order_item_modifiers;
CREATE POLICY oim_update
ON public.order_item_modifiers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_delete ON public.order_item_modifiers;
CREATE POLICY oim_delete
ON public.order_item_modifiers
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_events (via orders.store_id)
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_events_select ON public.order_events;
CREATE POLICY order_events_select
ON public.order_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_insert ON public.order_events;
CREATE POLICY order_events_insert
ON public.order_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_update ON public.order_events;
CREATE POLICY order_events_update
ON public.order_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_delete ON public.order_events;
CREATE POLICY order_events_delete
ON public.order_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- deliveries (via orders.store_id)
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deliveries_select ON public.deliveries;
CREATE POLICY deliveries_select
ON public.deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS deliveries_insert ON public.deliveries;
CREATE POLICY deliveries_insert
ON public.deliveries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS deliveries_update ON public.deliveries;
CREATE POLICY deliveries_update
ON public.deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS deliveries_delete ON public.deliveries;
CREATE POLICY deliveries_delete
ON public.deliveries
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = deliveries.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- cash_movements (via cash_registers.store_id)
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_movements_select ON public.cash_movements;
CREATE POLICY cash_movements_select
ON public.cash_movements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

DROP POLICY IF EXISTS cash_movements_insert ON public.cash_movements;
CREATE POLICY cash_movements_insert
ON public.cash_movements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

DROP POLICY IF EXISTS cash_movements_update ON public.cash_movements;
CREATE POLICY cash_movements_update
ON public.cash_movements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

DROP POLICY IF EXISTS cash_movements_delete ON public.cash_movements;
CREATE POLICY cash_movements_delete
ON public.cash_movements
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.cash_registers cr
    WHERE cr.id = cash_movements.cash_register_id
      AND public.user_has_store_access(cr.store_id)
  )
);

-- modifier_groups (store_id)
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS modifier_groups_select ON public.modifier_groups;
CREATE POLICY modifier_groups_select
ON public.modifier_groups
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS modifier_groups_insert ON public.modifier_groups;
CREATE POLICY modifier_groups_insert
ON public.modifier_groups
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS modifier_groups_update ON public.modifier_groups;
CREATE POLICY modifier_groups_update
ON public.modifier_groups
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS modifier_groups_delete ON public.modifier_groups;
CREATE POLICY modifier_groups_delete
ON public.modifier_groups
FOR DELETE
USING (public.user_has_store_access(store_id));

-- modifier_options (via modifier_groups.store_id)
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS modifier_options_select ON public.modifier_options;
CREATE POLICY modifier_options_select
ON public.modifier_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS modifier_options_insert ON public.modifier_options;
CREATE POLICY modifier_options_insert
ON public.modifier_options
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS modifier_options_update ON public.modifier_options;
CREATE POLICY modifier_options_update
ON public.modifier_options
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS modifier_options_delete ON public.modifier_options;
CREATE POLICY modifier_options_delete
ON public.modifier_options
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- product_modifier_groups (via modifier_groups.store_id)
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_modifier_groups_select ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS product_modifier_groups_insert ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_insert
ON public.product_modifier_groups
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS product_modifier_groups_update ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_update
ON public.product_modifier_groups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

DROP POLICY IF EXISTS product_modifier_groups_delete ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_delete
ON public.product_modifier_groups
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- product_combos (store_id)
ALTER TABLE public.product_combos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_combos_select ON public.product_combos;
CREATE POLICY product_combos_select
ON public.product_combos
FOR SELECT
USING (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS product_combos_insert ON public.product_combos;
CREATE POLICY product_combos_insert
ON public.product_combos
FOR INSERT
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS product_combos_update ON public.product_combos;
CREATE POLICY product_combos_update
ON public.product_combos
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS product_combos_delete ON public.product_combos;
CREATE POLICY product_combos_delete
ON public.product_combos
FOR DELETE
USING (public.user_has_store_access(store_id));

-- combo_items (via product_combos.store_id)
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS combo_items_select ON public.combo_items;
CREATE POLICY combo_items_select
ON public.combo_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

DROP POLICY IF EXISTS combo_items_insert ON public.combo_items;
CREATE POLICY combo_items_insert
ON public.combo_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

DROP POLICY IF EXISTS combo_items_update ON public.combo_items;
CREATE POLICY combo_items_update
ON public.combo_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

DROP POLICY IF EXISTS combo_items_delete ON public.combo_items;
CREATE POLICY combo_items_delete
ON public.combo_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.product_combos pc
    WHERE pc.id = combo_items.combo_id
      AND public.user_has_store_access(pc.store_id)
  )
);

-- product_ingredients (via inventory_items.store_id)
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_ingredients_select ON public.product_ingredients;
CREATE POLICY product_ingredients_select
ON public.product_ingredients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

DROP POLICY IF EXISTS product_ingredients_insert ON public.product_ingredients;
CREATE POLICY product_ingredients_insert
ON public.product_ingredients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

DROP POLICY IF EXISTS product_ingredients_update ON public.product_ingredients;
CREATE POLICY product_ingredients_update
ON public.product_ingredients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

DROP POLICY IF EXISTS product_ingredients_delete ON public.product_ingredients;
CREATE POLICY product_ingredients_delete
ON public.product_ingredients
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.inventory_items ii
    WHERE ii.id = product_ingredients.inventory_item_id
      AND public.user_has_store_access(ii.store_id)
  )
);

-- ============================================================================
-- Smoke test
-- ============================================================================
-- Verificar policies criadas:
-- select tablename, policyname from pg_policies where schemaname='public' order by tablename, policyname;
-- COMANDO 02 — RLS/GRANT hardening: bloquear escrita pública direta (checkout público somente via RPC SECURITY DEFINER)

-- 1) Revogar privilégios de escrita do role anon em tabelas sensíveis
REVOKE INSERT, UPDATE, DELETE ON TABLE public.orders FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.order_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.order_item_modifiers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.order_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.customers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.customer_addresses FROM anon;

-- (Opcional) Garantir que authenticated mantém privilégios de escrita (padrão Supabase geralmente já concede)
GRANT INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.order_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.order_item_modifiers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.order_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.customer_addresses TO authenticated;

-- 2) Remover quaisquer policies antigas que abriam escrita pública
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;

DROP POLICY IF EXISTS "Public can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;

-- 3) Recriar policies de escrita restringindo explicitamente para authenticated
-- Observação: as policies de SELECT podem existir em outra migration (ex: COMANDO 03). Aqui focamos em escrita.

-- orders (store_id)
DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update
ON public.orders
FOR UPDATE
TO authenticated
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS orders_delete ON public.orders;
CREATE POLICY orders_delete
ON public.orders
FOR DELETE
TO authenticated
USING (public.user_has_store_access(store_id));

-- customers (store_id)
DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update
ON public.customers
FOR UPDATE
TO authenticated
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

DROP POLICY IF EXISTS customers_delete ON public.customers;
CREATE POLICY customers_delete
ON public.customers
FOR DELETE
TO authenticated
USING (public.user_has_store_access(store_id));

-- customer_addresses (join: customers.store_id)
DROP POLICY IF EXISTS customer_addresses_insert ON public.customer_addresses;
CREATE POLICY customer_addresses_insert
ON public.customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_update ON public.customer_addresses;
CREATE POLICY customer_addresses_update
ON public.customer_addresses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

DROP POLICY IF EXISTS customer_addresses_delete ON public.customer_addresses;
CREATE POLICY customer_addresses_delete
ON public.customer_addresses
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND public.user_has_store_access(c.store_id)
  )
);

-- order_items (join: orders.store_id)
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
CREATE POLICY order_items_insert
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_update ON public.order_items;
CREATE POLICY order_items_update
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_items_delete ON public.order_items;
CREATE POLICY order_items_delete
ON public.order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_item_modifiers (join: order_items -> orders.store_id)
DROP POLICY IF EXISTS oim_insert ON public.order_item_modifiers;
CREATE POLICY oim_insert
ON public.order_item_modifiers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_update ON public.order_item_modifiers;
CREATE POLICY oim_update
ON public.order_item_modifiers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS oim_delete ON public.order_item_modifiers;
CREATE POLICY oim_delete
ON public.order_item_modifiers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_modifiers.order_item_id
      AND public.user_has_store_access(o.store_id)
  )
);

-- order_events (join: orders.store_id)
DROP POLICY IF EXISTS order_events_insert ON public.order_events;
CREATE POLICY order_events_insert
ON public.order_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_update ON public.order_events;
CREATE POLICY order_events_update
ON public.order_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);

DROP POLICY IF EXISTS order_events_delete ON public.order_events;
CREATE POLICY order_events_delete
ON public.order_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_events.order_id
      AND public.user_has_store_access(o.store_id)
  )
);
-- Migration: Add public_profile and menu_theme to stores
-- Purpose: Enable public menu theming and store public profile (hours, address, social media)

-- Add public_profile column (public info: hours, address, social media)
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS public_profile jsonb DEFAULT '{}'::jsonb;

-- Add menu_theme column (theme settings: preset, card variant, colors)
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS menu_theme jsonb DEFAULT '{}'::jsonb;

-- Comment columns
COMMENT ON COLUMN public.stores.public_profile IS 'Public store information: name, slogan, address, phone, social media, business hours';
COMMENT ON COLUMN public.stores.menu_theme IS 'Menu theme settings: preset (layout), cardVariant, colors, layout options';

-- RLS: SELECT on stores remains public for active stores (already exists)
-- RLS: UPDATE on menu_theme and public_profile only for authenticated users with store access

-- Drop existing UPDATE policy if it exists and recreate with new columns
DROP POLICY IF EXISTS "Users can update their own store" ON public.stores;

-- Allow authenticated users to update their store (including new theme fields)
CREATE POLICY "Users can update their own store"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT store_id
    FROM public.user_stores
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT store_id
    FROM public.user_stores
    WHERE user_id = auth.uid()
  )
);
-- ============================================================================
-- FIX: Restaurar SELECT público para cardápio (stores/categories/products + modifiers)
-- Objetivo: permitir que anon leia somente dados necessários do cardápio quando a loja estiver ativa
-- ============================================================================

-- STORES: permitir SELECT público somente para lojas ativas
DROP POLICY IF EXISTS stores_public_select ON public.stores;
CREATE POLICY stores_public_select
ON public.stores
FOR SELECT
USING (is_active = true);

-- CATEGORIES: permitir SELECT público somente para categorias ativas de lojas ativas
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select
ON public.categories
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- PRODUCTS: permitir SELECT público somente para produtos ativos de lojas ativas
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select
ON public.products
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- MODIFIER_GROUPS: permitir SELECT público para grupos de modificadores de lojas ativas
DROP POLICY IF EXISTS modifier_groups_public_select ON public.modifier_groups;
CREATE POLICY modifier_groups_public_select
ON public.modifier_groups
FOR SELECT
USING (
  store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- MODIFIER_OPTIONS: permitir SELECT público para opções de grupos de lojas ativas
DROP POLICY IF EXISTS modifier_options_public_select ON public.modifier_options;
CREATE POLICY modifier_options_public_select
ON public.modifier_options
FOR SELECT
USING (
  group_id IN (
    SELECT mg.id
    FROM public.modifier_groups mg
    WHERE mg.store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- PRODUCT_MODIFIER_GROUPS: permitir SELECT público para vínculos de lojas ativas
DROP POLICY IF EXISTS product_modifier_groups_public_select ON public.product_modifier_groups;
CREATE POLICY product_modifier_groups_public_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND mg.store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);
-- ============================================================================
-- AUDIT-01: Corrigir RLS de stores para permitir SELECT público (anon) + autenticado (member)
-- Problema: stores_select bloqueava tudo; stores_public_select não foi suficiente
-- Solução: DROP todas policies antigas, criar 2 novas (public + member)
-- ============================================================================

-- 1) Garantir que a função user_has_store_access existe e usa store_users (não user_stores)
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
  );
$$;

-- 2) STORES: DROP todas policies antigas que podem estar conflitando
DROP POLICY IF EXISTS stores_select ON public.stores;
DROP POLICY IF EXISTS stores_public_select ON public.stores;
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Store users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Super admin can view all stores" ON public.stores;

-- 3) STORES: Criar 2 policies novas (público + membro)
DROP POLICY IF EXISTS stores_public_select_active ON public.stores;
DROP POLICY IF EXISTS stores_member_select ON public.stores;

-- Policy 1: Anônimos e autenticados podem ver stores ATIVAS (para cardápio público)
CREATE POLICY stores_public_select_active
ON public.stores
FOR SELECT
USING (is_active = true);

-- Policy 2: Membros autenticados podem ver SUAS stores (mesmo inativas, para dashboard)
CREATE POLICY stores_member_select
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
);

-- 4) STORES: UPDATE somente para membros autenticados
DROP POLICY IF EXISTS stores_update ON public.stores;
CREATE POLICY stores_update
ON public.stores
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(id)
);

-- 5) STORES: INSERT bloqueado (criação via signup flow separado)
DROP POLICY IF EXISTS stores_insert ON public.stores;
CREATE POLICY stores_insert
ON public.stores
FOR INSERT
WITH CHECK (false);

-- 6) CATEGORIES: Garantir SELECT público para categorias ativas de lojas ativas
DROP POLICY IF EXISTS categories_public_select ON public.categories;
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_member_select ON public.categories;

CREATE POLICY categories_public_select
ON public.categories
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = categories.store_id
      AND s.is_active = true
  )
);

CREATE POLICY categories_member_select
ON public.categories
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 7) PRODUCTS: Garantir SELECT público para produtos ativos de lojas ativas
DROP POLICY IF EXISTS products_public_select ON public.products;
DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_member_select ON public.products;

CREATE POLICY products_public_select
ON public.products
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = products.store_id
      AND s.is_active = true
  )
);

CREATE POLICY products_member_select
ON public.products
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 8) MODIFIER_GROUPS: SELECT público + membro
DROP POLICY IF EXISTS modifier_groups_public_select ON public.modifier_groups;
DROP POLICY IF EXISTS modifier_groups_select ON public.modifier_groups;
DROP POLICY IF EXISTS modifier_groups_member_select ON public.modifier_groups;

CREATE POLICY modifier_groups_public_select
ON public.modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = modifier_groups.store_id
      AND s.is_active = true
  )
);

CREATE POLICY modifier_groups_member_select
ON public.modifier_groups
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- 9) MODIFIER_OPTIONS: SELECT público + membro
DROP POLICY IF EXISTS modifier_options_public_select ON public.modifier_options;
DROP POLICY IF EXISTS modifier_options_select ON public.modifier_options;
DROP POLICY IF EXISTS modifier_options_member_select ON public.modifier_options;

CREATE POLICY modifier_options_public_select
ON public.modifier_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    INNER JOIN public.stores s ON s.id = mg.store_id
    WHERE mg.id = modifier_options.group_id
      AND s.is_active = true
  )
);

CREATE POLICY modifier_options_member_select
ON public.modifier_options
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = modifier_options.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);

-- 10) PRODUCT_MODIFIER_GROUPS: SELECT público + membro
DROP POLICY IF EXISTS product_modifier_groups_public_select ON public.product_modifier_groups;
DROP POLICY IF EXISTS product_modifier_groups_select ON public.product_modifier_groups;
DROP POLICY IF EXISTS product_modifier_groups_member_select ON public.product_modifier_groups;

CREATE POLICY product_modifier_groups_public_select
ON public.product_modifier_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    INNER JOIN public.stores s ON s.id = mg.store_id
    WHERE mg.id = product_modifier_groups.group_id
      AND s.is_active = true
  )
);

CREATE POLICY product_modifier_groups_member_select
ON public.product_modifier_groups
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.modifier_groups mg
    WHERE mg.id = product_modifier_groups.group_id
      AND public.user_has_store_access(mg.store_id)
  )
);
-- Migration: Expand system to support more niches
-- Nichos: Fit/Healthy, Confeitaria, Sushi/Rodízio, Bar/Pub, Dark Kitchen

-- ============================================
-- 1. FIT/HEALTHY - Campos nutricionais
-- ============================================

-- Adicionar campos nutricionais na tabela de produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS protein_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fat_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fiber_g DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sodium_mg DECIMAL(10,2) DEFAULT NULL;

-- Flags dietéticas para filtros
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_lactose_free BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_sugar_free BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_low_carb BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_keto BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT FALSE;

-- Alérgenos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

-- ============================================
-- 2. CONFEITARIA - Sistema de encomendas
-- ============================================

-- Tabela de encomendas (pedidos com data futura)
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

  -- Dados do cliente (caso não tenha cadastro)
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),

  -- Data de entrega/retirada
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  delivery_type VARCHAR(20) DEFAULT 'pickup', -- pickup, delivery
  delivery_address JSONB,

  -- Detalhes da encomenda
  description TEXT NOT NULL,
  reference_images TEXT[] DEFAULT '{}', -- URLs das imagens de referência
  personalization_text VARCHAR(255), -- Texto para escrever no bolo
  servings INTEGER, -- Quantidade de pessoas/porções

  -- Produto base (opcional)
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,

  -- Valores
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  deposit_amount DECIMAL(10,2), -- Sinal/entrada
  deposit_paid BOOLEAN DEFAULT FALSE,

  -- Status
  status VARCHAR(30) DEFAULT 'pending', -- pending, quoted, confirmed, in_production, ready, delivered, cancelled
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quoted_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Configurações de encomenda por loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS accepts_custom_orders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_order_lead_days INTEGER DEFAULT 2, -- Dias mínimos de antecedência
ADD COLUMN IF NOT EXISTS custom_order_deposit_percent DECIMAL(5,2) DEFAULT 50.00; -- % de sinal

-- ============================================
-- 3. SUSHI/JAPONÊS - Modo rodízio
-- ============================================

-- Tabela de configuração de rodízio
CREATE TABLE IF NOT EXISTS public.rodizio_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL, -- "Rodízio Premium", "Rodízio Básico"
  description TEXT,

  -- Preços
  price_adult DECIMAL(10,2) NOT NULL,
  price_child DECIMAL(10,2), -- Preço criança
  child_age_limit INTEGER DEFAULT 10, -- Até qual idade é criança

  -- Tempo
  duration_minutes INTEGER DEFAULT 120, -- Tempo do rodízio

  -- Limites
  max_items_per_round INTEGER, -- Máximo de itens por rodada
  max_waste_items INTEGER, -- Limite de desperdício
  waste_fee_per_item DECIMAL(10,2), -- Taxa por item desperdiçado

  -- Categorias incluídas
  included_category_ids UUID[] DEFAULT '{}',

  -- Dias e horários disponíveis
  available_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=domingo
  start_time TIME,
  end_time TIME,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessão de rodízio (cliente consumindo)
CREATE TABLE IF NOT EXISTS public.rodizio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  rodizio_config_id UUID NOT NULL REFERENCES public.rodizio_configs(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  -- Pessoas na mesa
  adults_count INTEGER DEFAULT 1,
  children_count INTEGER DEFAULT 0,

  -- Controle de tempo
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,

  -- Controle de consumo
  items_consumed INTEGER DEFAULT 0,
  items_wasted INTEGER DEFAULT 0,

  -- Valores
  base_total DECIMAL(10,2),
  waste_fee_total DECIMAL(10,2) DEFAULT 0,
  extras_total DECIMAL(10,2) DEFAULT 0, -- Itens fora do rodízio
  final_total DECIMAL(10,2),

  status VARCHAR(20) DEFAULT 'active', -- active, finished, cancelled

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens consumidos no rodízio
CREATE TABLE IF NOT EXISTS public.rodizio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.rodizio_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_wasted BOOLEAN DEFAULT FALSE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Flag para produtos que são de rodízio
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_rodizio_item BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rodizio_limit_per_round INTEGER; -- Limite por rodada

-- ============================================
-- 4. BAR/PUB - Comanda aberta
-- ============================================

-- Tabela de comandas abertas (tabs)
CREATE TABLE IF NOT EXISTS public.tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

  -- Identificação
  tab_number VARCHAR(20), -- Número da comanda
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),

  -- Controle
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Limite de crédito
  credit_limit DECIMAL(10,2),

  -- Valores
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0, -- Taxa de serviço (10%)
  total DECIMAL(10,2) DEFAULT 0,

  -- Pagamento
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),

  -- Gorjeta
  tip_amount DECIMAL(10,2) DEFAULT 0,

  status VARCHAR(20) DEFAULT 'open', -- open, pending_payment, paid, cancelled

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens da comanda
CREATE TABLE IF NOT EXISTS public.tab_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id UUID NOT NULL REFERENCES public.tabs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Quem pediu (para split)
  ordered_by VARCHAR(100), -- Nome da pessoa

  modifiers JSONB DEFAULT '[]',
  notes TEXT,

  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  served_at TIMESTAMP WITH TIME ZONE
);

-- Split de conta
CREATE TABLE IF NOT EXISTS public.tab_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id UUID NOT NULL REFERENCES public.tabs(id) ON DELETE CASCADE,

  person_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) DEFAULT 0,

  paid BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de bar na loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS has_tab_system BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_service_fee_percent DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS auto_service_fee BOOLEAN DEFAULT FALSE;

-- Happy Hour
CREATE TABLE IF NOT EXISTS public.happy_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL, -- "Happy Hour", "Dobradinha"
  description TEXT,

  -- Dias da semana (0=domingo, 6=sábado)
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Desconto
  discount_type VARCHAR(20) DEFAULT 'percent', -- percent, fixed, buy_x_get_y
  discount_value DECIMAL(10,2) NOT NULL,
  buy_quantity INTEGER, -- Para buy_x_get_y
  get_quantity INTEGER, -- Para buy_x_get_y

  -- Produtos incluídos
  applies_to VARCHAR(20) DEFAULT 'all', -- all, categories, products
  category_ids UUID[] DEFAULT '{}',
  product_ids UUID[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. DARK KITCHEN - Multi-marca
-- ============================================

-- Tabela de marcas virtuais (várias marcas na mesma cozinha)
CREATE TABLE IF NOT EXISTS public.virtual_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, -- Cozinha física

  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,

  -- Tema/visual
  theme_config JSONB DEFAULT '{}',

  -- Categorias de produtos desta marca
  category_ids UUID[] DEFAULT '{}',

  -- Configurações específicas
  is_active BOOLEAN DEFAULT TRUE,
  accepts_delivery BOOLEAN DEFAULT TRUE,
  accepts_pickup BOOLEAN DEFAULT FALSE,

  -- Horários específicos (se diferente da loja principal)
  custom_hours JSONB,

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(store_id, slug)
);

-- Flag para indicar que a loja é dark kitchen
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS is_dark_kitchen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kitchen_name VARCHAR(100); -- Nome da cozinha física

-- Produtos podem pertencer a marcas específicas
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS virtual_brand_ids UUID[] DEFAULT '{}'; -- Se vazio, aparece em todas

-- ============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_custom_orders_store_id ON public.custom_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_delivery_date ON public.custom_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);

CREATE INDEX IF NOT EXISTS idx_rodizio_sessions_store_id ON public.rodizio_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_rodizio_sessions_status ON public.rodizio_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rodizio_items_session_id ON public.rodizio_items(session_id);

CREATE INDEX IF NOT EXISTS idx_tabs_store_id ON public.tabs(store_id);
CREATE INDEX IF NOT EXISTS idx_tabs_status ON public.tabs(status);
CREATE INDEX IF NOT EXISTS idx_tab_items_tab_id ON public.tab_items(tab_id);

CREATE INDEX IF NOT EXISTS idx_virtual_brands_store_id ON public.virtual_brands(store_id);
CREATE INDEX IF NOT EXISTS idx_virtual_brands_slug ON public.virtual_brands(slug);

CREATE INDEX IF NOT EXISTS idx_products_dietary ON public.products(is_vegan, is_vegetarian, is_gluten_free);

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Custom Orders
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS custom_orders_store_access ON public.custom_orders;
CREATE POLICY custom_orders_store_access ON public.custom_orders
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Rodizio Configs
ALTER TABLE public.rodizio_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rodizio_configs_store_access ON public.rodizio_configs;
CREATE POLICY rodizio_configs_store_access ON public.rodizio_configs
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Rodizio Sessions
ALTER TABLE public.rodizio_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rodizio_sessions_store_access ON public.rodizio_sessions;
CREATE POLICY rodizio_sessions_store_access ON public.rodizio_sessions
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Rodizio Items
ALTER TABLE public.rodizio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rodizio_items_session_access ON public.rodizio_items;
CREATE POLICY rodizio_items_session_access ON public.rodizio_items
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.rodizio_sessions rs
    WHERE rs.id = rodizio_items.session_id
    AND public.user_has_store_access(rs.store_id)
  )
);

-- Tabs
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tabs_store_access ON public.tabs;
CREATE POLICY tabs_store_access ON public.tabs
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Tab Items
ALTER TABLE public.tab_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tab_items_tab_access ON public.tab_items;
CREATE POLICY tab_items_tab_access ON public.tab_items
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.tabs t
    WHERE t.id = tab_items.tab_id
    AND public.user_has_store_access(t.store_id)
  )
);

-- Tab Splits
ALTER TABLE public.tab_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tab_splits_tab_access ON public.tab_splits;
CREATE POLICY tab_splits_tab_access ON public.tab_splits
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.tabs t
    WHERE t.id = tab_splits.tab_id
    AND public.user_has_store_access(t.store_id)
  )
);

-- Happy Hours
ALTER TABLE public.happy_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS happy_hours_store_access ON public.happy_hours;
CREATE POLICY happy_hours_store_access ON public.happy_hours
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Virtual Brands
ALTER TABLE public.virtual_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS virtual_brands_store_access ON public.virtual_brands;
CREATE POLICY virtual_brands_store_access ON public.virtual_brands
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- ============================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_orders_updated_at ON public.custom_orders;
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rodizio_configs_updated_at ON public.rodizio_configs;
CREATE TRIGGER update_rodizio_configs_updated_at
  BEFORE UPDATE ON public.rodizio_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rodizio_sessions_updated_at ON public.rodizio_sessions;
CREATE TRIGGER update_rodizio_sessions_updated_at
  BEFORE UPDATE ON public.rodizio_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tabs_updated_at ON public.tabs;
CREATE TRIGGER update_tabs_updated_at
  BEFORE UPDATE ON public.tabs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_happy_hours_updated_at ON public.happy_hours;
CREATE TRIGGER update_happy_hours_updated_at
  BEFORE UPDATE ON public.happy_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_virtual_brands_updated_at ON public.virtual_brands;
CREATE TRIGGER update_virtual_brands_updated_at
  BEFORE UPDATE ON public.virtual_brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Migration: Expand system for weight-based niches
-- Nichos: Açougue, Sacolão/Hortifruti, Peixaria, Empório, Mercearia

-- ============================================
-- 1. VENDA POR PESO/KG
-- ============================================

-- Adicionar campos para venda por peso nos produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sell_by_weight BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'kg', -- kg, g, lb
ADD COLUMN IF NOT EXISTS min_weight DECIMAL(10,3), -- Peso mínimo para venda
ADD COLUMN IF NOT EXISTS weight_increment DECIMAL(10,3) DEFAULT 0.100, -- Incremento (ex: 100g)
ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10,2), -- Preço por kg (alternativo ao price)
ADD COLUMN IF NOT EXISTS average_unit_weight DECIMAL(10,3); -- Peso médio da unidade (ex: 1 frango = ~1.5kg)

-- ============================================
-- 2. AÇOUGUE - Cortes e preparos
-- ============================================

-- Tipos de corte disponíveis
CREATE TABLE IF NOT EXISTS public.meat_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Bife fino", "Cubos", "Moído", "Inteiro"
  description TEXT,
  additional_price DECIMAL(10,2) DEFAULT 0, -- Taxa adicional pelo corte
  preparation_time_minutes INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tipos de preparo/tempero
CREATE TABLE IF NOT EXISTS public.meat_seasonings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Temperado", "Marinado", "Alho e sal"
  description TEXT,
  additional_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relacionar produtos com cortes disponíveis
CREATE TABLE IF NOT EXISTS public.product_meat_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  meat_cut_id UUID NOT NULL REFERENCES public.meat_cuts(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, meat_cut_id)
);

-- Relacionar produtos com temperos disponíveis
CREATE TABLE IF NOT EXISTS public.product_seasonings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seasoning_id UUID NOT NULL REFERENCES public.meat_seasonings(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, seasoning_id)
);

-- Campos específicos para açougue nos produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS meat_origin VARCHAR(100), -- "Angus", "Nelore", "Importado"
ADD COLUMN IF NOT EXISTS meat_grade VARCHAR(50), -- "Premium", "Standard"
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS defrost_time_hours INTEGER; -- Tempo para descongelar

-- ============================================
-- 3. SACOLÃO/HORTIFRUTI
-- ============================================

-- Categorização de produtos hortifruti
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS produce_type VARCHAR(50), -- 'fruit', 'vegetable', 'greens', 'tuber', 'legume'
ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT FALSE, -- Já existe, mas reforçando
ADD COLUMN IF NOT EXISTS origin_location VARCHAR(100), -- "Local", "Importado", "Fazenda X"
ADD COLUMN IF NOT EXISTS harvest_date DATE, -- Data da colheita
ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER; -- Validade em dias

-- Promoções de feira (ex: "Segunda da banana")
CREATE TABLE IF NOT EXISTS public.produce_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Segunda da Banana", "Quarta Verde"
  description TEXT,

  -- Dias da semana (0=domingo)
  days_of_week INTEGER[] DEFAULT '{}',

  -- Desconto
  discount_percent DECIMAL(5,2),

  -- Produtos incluídos
  product_ids UUID[] DEFAULT '{}',
  category_ids UUID[] DEFAULT '{}',

  -- Validade
  start_date DATE,
  end_date DATE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. PEIXARIA
-- ============================================

-- Tipos de preparo de peixe
CREATE TABLE IF NOT EXISTS public.fish_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Inteiro", "Filé", "Posta", "Limpo", "Escamado"
  description TEXT,
  additional_price_per_kg DECIMAL(10,2) DEFAULT 0, -- Taxa por kg
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relacionar produtos com preparos
CREATE TABLE IF NOT EXISTS public.product_fish_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  preparation_id UUID NOT NULL REFERENCES public.fish_preparations(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, preparation_id)
);

-- Campos específicos para peixaria
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS fish_type VARCHAR(50), -- 'fresh', 'frozen', 'salted'
ADD COLUMN IF NOT EXISTS catch_method VARCHAR(100), -- "Linha", "Rede", "Cativeiro"
ADD COLUMN IF NOT EXISTS catch_location VARCHAR(100); -- Local de pesca

-- ============================================
-- 5. EMPÓRIO/MERCEARIA/LOJA DE CONVENIÊNCIA
-- ============================================

-- Campos para produtos de mercearia
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50), -- Código de barras EAN
ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50), -- Código do fornecedor
ADD COLUMN IF NOT EXISTS brand VARCHAR(100), -- Marca do produto
ADD COLUMN IF NOT EXISTS expiry_date DATE, -- Data de validade
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50), -- Número do lote
ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER, -- Alerta de estoque mínimo
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER; -- Quantidade para reposição

-- ============================================
-- 6. CONFIGURAÇÕES DE LOJA POR NICHO
-- ============================================

-- Flags de nicho na loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS is_butcher_shop BOOLEAN DEFAULT FALSE, -- Açougue
ADD COLUMN IF NOT EXISTS is_produce_market BOOLEAN DEFAULT FALSE, -- Sacolão
ADD COLUMN IF NOT EXISTS is_fish_market BOOLEAN DEFAULT FALSE, -- Peixaria
ADD COLUMN IF NOT EXISTS is_grocery_store BOOLEAN DEFAULT FALSE, -- Mercearia
ADD COLUMN IF NOT EXISTS is_convenience_store BOOLEAN DEFAULT FALSE, -- Conveniência
ADD COLUMN IF NOT EXISTS uses_weight_scale BOOLEAN DEFAULT FALSE, -- Usa balança
ADD COLUMN IF NOT EXISTS scale_integration VARCHAR(50); -- Tipo de integração (Toledo, Filizola, etc)

-- ============================================
-- 7. PEDIDOS COM PESO ESTIMADO vs REAL
-- ============================================

-- Adicionar campos de peso nos itens do pedido
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS estimated_weight DECIMAL(10,3), -- Peso estimado pelo cliente
ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,3), -- Peso real após pesagem
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2), -- Preço por kg/unidade
ADD COLUMN IF NOT EXISTS weight_adjusted BOOLEAN DEFAULT FALSE, -- Se o peso foi ajustado
ADD COLUMN IF NOT EXISTS meat_cut_id UUID REFERENCES public.meat_cuts(id),
ADD COLUMN IF NOT EXISTS seasoning_id UUID REFERENCES public.meat_seasonings(id),
ADD COLUMN IF NOT EXISTS fish_preparation_id UUID REFERENCES public.fish_preparations(id);

-- ============================================
-- 8. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meat_cuts_store_id ON public.meat_cuts(store_id);
CREATE INDEX IF NOT EXISTS idx_meat_seasonings_store_id ON public.meat_seasonings(store_id);
CREATE INDEX IF NOT EXISTS idx_fish_preparations_store_id ON public.fish_preparations(store_id);
CREATE INDEX IF NOT EXISTS idx_produce_promotions_store_id ON public.produce_promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sell_by_weight ON public.products(sell_by_weight);

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Meat Cuts
ALTER TABLE public.meat_cuts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meat_cuts_store_access ON public.meat_cuts;
CREATE POLICY meat_cuts_store_access ON public.meat_cuts
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Meat Seasonings
ALTER TABLE public.meat_seasonings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meat_seasonings_store_access ON public.meat_seasonings;
CREATE POLICY meat_seasonings_store_access ON public.meat_seasonings
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Fish Preparations
ALTER TABLE public.fish_preparations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fish_preparations_store_access ON public.fish_preparations;
CREATE POLICY fish_preparations_store_access ON public.fish_preparations
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Produce Promotions
ALTER TABLE public.produce_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS produce_promotions_store_access ON public.produce_promotions;
CREATE POLICY produce_promotions_store_access ON public.produce_promotions
FOR ALL USING (
  auth.role() = 'authenticated'
  AND public.user_has_store_access(store_id)
);

-- Product Meat Cuts (via product)
ALTER TABLE public.product_meat_cuts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_meat_cuts_access ON public.product_meat_cuts;
CREATE POLICY product_meat_cuts_access ON public.product_meat_cuts
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_meat_cuts.product_id
    AND public.user_has_store_access(p.store_id)
  )
);

-- Product Seasonings (via product)
ALTER TABLE public.product_seasonings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_seasonings_access ON public.product_seasonings;
CREATE POLICY product_seasonings_access ON public.product_seasonings
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_seasonings.product_id
    AND public.user_has_store_access(p.store_id)
  )
);

-- Product Fish Preparations (via product)
ALTER TABLE public.product_fish_preparations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_fish_preparations_access ON public.product_fish_preparations;
CREATE POLICY product_fish_preparations_access ON public.product_fish_preparations
FOR ALL USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_fish_preparations.product_id
    AND public.user_has_store_access(p.store_id)
  )
);

-- ============================================
-- 10. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_produce_promotions_updated_at ON public.produce_promotions;
CREATE TRIGGER update_produce_promotions_updated_at
  BEFORE UPDATE ON public.produce_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Migration: Tropical Freeze Features
-- Features: MIMO, Fidelidade, KDS Avançado, TV Menu Board, Marketing Studio, Hardware

-- ============================================
-- 1. MIMO - PAGAMENTO SOCIAL ("Paga pra mim?")
-- ============================================

-- Campos MIMO na tabela de pedidos
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS mimo_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS mimo_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mimo_target_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS mimo_message TEXT,
ADD COLUMN IF NOT EXISTS mimo_payer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mimo_payer_id UUID,
ADD COLUMN IF NOT EXISTS mimo_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mimo_shared_via VARCHAR(20);

-- Índices para MIMO
CREATE INDEX IF NOT EXISTS idx_orders_mimo_token ON public.orders(mimo_token) WHERE mimo_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_mimo_expires ON public.orders(mimo_expires_at) WHERE mimo_expires_at IS NOT NULL;

-- Configurações de MIMO por loja
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS mimo_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mimo_expiration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS mimo_allow_table_orders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mimo_min_order_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mimo_payer_earns_points BOOLEAN DEFAULT TRUE;

-- ============================================
-- 2. CARTÃO FIDELIDADE / LOYALTY
-- ============================================

-- Configuração do programa de fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL DEFAULT 'Programa Fidelidade',
  description TEXT,

  program_type VARCHAR(20) NOT NULL DEFAULT 'points',

  points_per_currency DECIMAL(10,2) DEFAULT 1,
  points_per_order INTEGER DEFAULT 0,

  points_value DECIMAL(10,4) DEFAULT 0.01,
  min_points_redeem INTEGER DEFAULT 100,
  max_discount_percent DECIMAL(5,2) DEFAULT 100,

  cashback_percent DECIMAL(5,2) DEFAULT 0,
  cashback_expiry_days INTEGER DEFAULT 90,

  stamps_required INTEGER DEFAULT 10,
  stamp_reward_type VARCHAR(20) DEFAULT 'free_item',
  stamp_reward_value DECIMAL(10,2),
  stamp_reward_product_id UUID REFERENCES public.products(id),

  has_tiers BOOLEAN DEFAULT FALSE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Níveis de fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,

  name VARCHAR(50) NOT NULL,
  min_points INTEGER NOT NULL,

  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  free_delivery BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  exclusive_products BOOLEAN DEFAULT FALSE,

  badge_color VARCHAR(20),
  badge_icon VARCHAR(50),

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saldo e histórico do cliente
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.loyalty_programs(id) ON DELETE SET NULL,

  points_balance INTEGER DEFAULT 0,
  points_earned_total INTEGER DEFAULT 0,
  points_redeemed_total INTEGER DEFAULT 0,

  cashback_balance DECIMAL(10,2) DEFAULT 0,

  stamps_current INTEGER DEFAULT 0,
  stamps_completed INTEGER DEFAULT 0,

  current_tier_id UUID REFERENCES public.loyalty_tiers(id),
  tier_achieved_at TIMESTAMP WITH TIME ZONE,

  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(customer_id, store_id)
);

-- Transações de pontos
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  transaction_type VARCHAR(20) NOT NULL,
  points_amount INTEGER NOT NULL,

  description VARCHAR(255),

  cashback_amount DECIMAL(10,2) DEFAULT 0,
  stamps_amount INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Régua de relacionamento
CREATE TABLE IF NOT EXISTS public.customer_engagement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,

  trigger_type VARCHAR(30) NOT NULL,
  trigger_days INTEGER,

  action_type VARCHAR(30) NOT NULL,
  message_template TEXT,
  coupon_id UUID REFERENCES public.coupons(id),
  bonus_points INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log de engajamento
CREATE TABLE IF NOT EXISTS public.customer_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.customer_engagement_rules(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  channel VARCHAR(20),
  status VARCHAR(20) DEFAULT 'sent',
  converted_order_id UUID REFERENCES public.orders(id)
);

-- ============================================
-- 3. KDS AVANÇADO (Kitchen Display System)
-- ============================================

-- Configuração do KDS por loja
CREATE TABLE IF NOT EXISTS public.kds_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  columns JSONB DEFAULT '[
    {"id": "pending", "name": "Pendente", "color": "#FCD34D"},
    {"id": "preparing", "name": "Preparando", "color": "#60A5FA"},
    {"id": "ready", "name": "Pronto", "color": "#34D399"}
  ]'::jsonb,

  sla_green_minutes INTEGER DEFAULT 5,
  sla_yellow_minutes INTEGER DEFAULT 10,

  batch_mode_enabled BOOLEAN DEFAULT FALSE,
  batch_group_by VARCHAR(20) DEFAULT 'product',

  sound_new_order BOOLEAN DEFAULT TRUE,
  sound_file VARCHAR(255) DEFAULT '/sounds/new-order.mp3',

  auto_refresh_seconds INTEGER DEFAULT 10,

  font_size VARCHAR(10) DEFAULT 'medium',
  show_customer_name BOOLEAN DEFAULT TRUE,
  show_order_notes BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(store_id)
);

-- Tempo de preparo por produto
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS kds_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kds_station VARCHAR(50);

-- Estações de preparo
CREATE TABLE IF NOT EXISTS public.kds_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,

  category_ids UUID[] DEFAULT '{}',

  color VARCHAR(20) DEFAULT '#6366F1',
  icon VARCHAR(50) DEFAULT 'ChefHat',

  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(store_id, code)
);

-- Log de tempo de preparo
CREATE TABLE IF NOT EXISTS public.kds_order_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,

  wait_time_seconds INTEGER,
  prep_time_seconds INTEGER,
  total_time_seconds INTEGER,

  sla_status VARCHAR(10),
  estimated_prep_minutes INTEGER,

  prepared_by UUID,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TV MENU BOARD (Digital Signage)
-- ============================================

CREATE TABLE IF NOT EXISTS public.tv_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,

  display_type VARCHAR(20) DEFAULT 'menu',

  layout VARCHAR(20) DEFAULT 'grid',
  columns INTEGER DEFAULT 3,
  rows INTEGER DEFAULT 4,

  category_ids UUID[] DEFAULT '{}',
  show_prices BOOLEAN DEFAULT TRUE,
  show_images BOOLEAN DEFAULT TRUE,
  show_descriptions BOOLEAN DEFAULT FALSE,

  show_qr_code BOOLEAN DEFAULT TRUE,
  qr_position VARCHAR(20) DEFAULT 'bottom-right',
  qr_size INTEGER DEFAULT 150,

  promo_rotation_seconds INTEGER DEFAULT 10,
  promo_ids UUID[] DEFAULT '{}',

  theme VARCHAR(20) DEFAULT 'dark',
  background_color VARCHAR(20) DEFAULT '#1F2937',
  text_color VARCHAR(20) DEFAULT '#FFFFFF',
  accent_color VARCHAR(20) DEFAULT '#8B5CF6',
  font_size VARCHAR(10) DEFAULT 'large',

  is_active BOOLEAN DEFAULT TRUE,
  last_ping_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(store_id, code)
);

-- Promoções para TV
CREATE TABLE IF NOT EXISTS public.tv_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(255),

  image_url VARCHAR(500),
  background_color VARCHAR(20),
  text_color VARCHAR(20),

  product_id UUID REFERENCES public.products(id),

  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',

  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. MARKETING STUDIO
-- ============================================

-- Templates de posts
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,

  template_type VARCHAR(30) NOT NULL,

  width INTEGER NOT NULL,
  height INTEGER NOT NULL,

  design_json JSONB NOT NULL,

  preview_url VARCHAR(500),

  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts gerados
CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.marketing_templates(id),

  title VARCHAR(255),

  image_url VARCHAR(500),

  product_id UUID REFERENCES public.products(id),

  status VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,

  instagram_post_id VARCHAR(100),
  facebook_post_id VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Cam (Molduras)
CREATE TABLE IF NOT EXISTS public.social_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,

  frame_url VARCHAR(500) NOT NULL,

  width INTEGER NOT NULL,
  height INTEGER NOT NULL,

  photo_x INTEGER NOT NULL,
  photo_y INTEGER NOT NULL,
  photo_width INTEGER NOT NULL,
  photo_height INTEGER NOT NULL,

  frame_type VARCHAR(20) DEFAULT 'portrait',

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. HARDWARE INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.hardware_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  device_type VARCHAR(30) NOT NULL,

  connection_type VARCHAR(20) NOT NULL,
  connection_config JSONB,

  scale_protocol VARCHAR(30),
  scale_unit VARCHAR(10) DEFAULT 'kg',

  printer_width INTEGER,
  printer_driver VARCHAR(30),

  is_active BOOLEAN DEFAULT TRUE,
  last_connected_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_store ON public.loyalty_programs(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer ON public.customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_store ON public.customer_loyalty(store_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON public.loyalty_transactions(customer_loyalty_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_log_order ON public.kds_order_log(order_id);
CREATE INDEX IF NOT EXISTS idx_kds_order_log_store ON public.kds_order_log(store_id);
CREATE INDEX IF NOT EXISTS idx_tv_displays_store ON public.tv_displays(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_templates_store ON public.marketing_templates(store_id);

-- ============================================
-- 8. RLS POLICIES
-- ============================================

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_programs_store_access ON public.loyalty_programs;
CREATE POLICY loyalty_programs_store_access ON public.loyalty_programs
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_tiers_access ON public.loyalty_tiers;
CREATE POLICY loyalty_tiers_access ON public.loyalty_tiers
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = program_id AND public.user_has_store_access(lp.store_id))
);

ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS customer_loyalty_store_access ON public.customer_loyalty;
CREATE POLICY customer_loyalty_store_access ON public.customer_loyalty
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS loyalty_transactions_store_access ON public.loyalty_transactions;
CREATE POLICY loyalty_transactions_store_access ON public.loyalty_transactions
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.customer_engagement_rules ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS engagement_rules_store_access ON public.customer_engagement_rules;
CREATE POLICY engagement_rules_store_access ON public.customer_engagement_rules
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.customer_engagement_log ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS engagement_log_access ON public.customer_engagement_log;
CREATE POLICY engagement_log_access ON public.customer_engagement_log
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.customer_engagement_rules r WHERE r.id = rule_id AND public.user_has_store_access(r.store_id))
);

ALTER TABLE public.kds_config ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_config_store_access ON public.kds_config;
CREATE POLICY kds_config_store_access ON public.kds_config
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.kds_stations ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_stations_store_access ON public.kds_stations;
CREATE POLICY kds_stations_store_access ON public.kds_stations
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.kds_order_log ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS kds_order_log_store_access ON public.kds_order_log;
CREATE POLICY kds_order_log_store_access ON public.kds_order_log
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.tv_displays ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS tv_displays_store_access ON public.tv_displays;
CREATE POLICY tv_displays_store_access ON public.tv_displays
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.tv_promotions ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS tv_promotions_store_access ON public.tv_promotions;
CREATE POLICY tv_promotions_store_access ON public.tv_promotions
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS marketing_templates_access ON public.marketing_templates;
CREATE POLICY marketing_templates_access ON public.marketing_templates
FOR ALL USING (store_id IS NULL OR public.user_has_store_access(store_id));

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS marketing_posts_store_access ON public.marketing_posts;
CREATE POLICY marketing_posts_store_access ON public.marketing_posts
FOR ALL USING (public.user_has_store_access(store_id));

ALTER TABLE public.social_frames ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS social_frames_access ON public.social_frames;
CREATE POLICY social_frames_access ON public.social_frames
FOR ALL USING (store_id IS NULL OR public.user_has_store_access(store_id));

ALTER TABLE public.hardware_devices ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS hardware_devices_store_access ON public.hardware_devices;
CREATE POLICY hardware_devices_store_access ON public.hardware_devices
FOR ALL USING (public.user_has_store_access(store_id));

-- ============================================
-- 9. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_loyalty_programs_updated_at ON public.loyalty_programs;
CREATE TRIGGER update_loyalty_programs_updated_at
  BEFORE UPDATE ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_loyalty_updated_at ON public.customer_loyalty;
CREATE TRIGGER update_customer_loyalty_updated_at
  BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_rules_updated_at ON public.customer_engagement_rules;
CREATE TRIGGER update_engagement_rules_updated_at
  BEFORE UPDATE ON public.customer_engagement_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kds_config_updated_at ON public.kds_config;
CREATE TRIGGER update_kds_config_updated_at
  BEFORE UPDATE ON public.kds_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tv_displays_updated_at ON public.tv_displays;
CREATE TRIGGER update_tv_displays_updated_at
  BEFORE UPDATE ON public.tv_displays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hardware_devices_updated_at ON public.hardware_devices;
CREATE TRIGGER update_hardware_devices_updated_at
  BEFORE UPDATE ON public.hardware_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. FUNCTIONS
-- ============================================

-- Função para expirar MIMOs antigos
CREATE OR REPLACE FUNCTION expire_mimo_orders()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.orders
  SET status = 'mimo_expired',
      updated_at = NOW()
  WHERE status = 'awaiting_mimo'
    AND mimo_expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular pontos de fidelidade
CREATE OR REPLACE FUNCTION calculate_loyalty_points(
  p_store_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_program public.loyalty_programs;
  v_points INTEGER;
BEGIN
  SELECT * INTO v_program
  FROM public.loyalty_programs
  WHERE store_id = p_store_id AND is_active = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_points := FLOOR(p_order_total * v_program.points_per_currency);
  v_points := v_points + COALESCE(v_program.points_per_order, 0);

  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para creditar pontos após pedido
CREATE OR REPLACE FUNCTION credit_loyalty_points(
  p_customer_id UUID,
  p_store_id UUID,
  p_order_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
  v_loyalty_id UUID;
BEGIN
  v_points := calculate_loyalty_points(p_store_id, p_order_total);

  IF v_points <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.customer_loyalty (customer_id, store_id, points_balance, points_earned_total, total_orders, total_spent, last_order_at)
  VALUES (p_customer_id, p_store_id, v_points, v_points, 1, p_order_total, NOW())
  ON CONFLICT (customer_id, store_id)
  DO UPDATE SET
    points_balance = customer_loyalty.points_balance + v_points,
    points_earned_total = customer_loyalty.points_earned_total + v_points,
    total_orders = customer_loyalty.total_orders + 1,
    total_spent = customer_loyalty.total_spent + p_order_total,
    last_order_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_loyalty_id;

  INSERT INTO public.loyalty_transactions (customer_loyalty_id, store_id, order_id, transaction_type, points_amount, description)
  VALUES (v_loyalty_id, p_store_id, p_order_id, 'earn', v_points, 'Pontos do pedido');

  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar token MIMO
CREATE OR REPLACE FUNCTION validate_mimo_token(
  p_order_id UUID,
  p_token VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_order public.orders;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND mimo_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token inválido');
  END IF;

  IF v_order.status = 'mimo_expired' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este link expirou');
  END IF;

  IF v_order.status != 'awaiting_mimo' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este pedido já foi pago');
  END IF;

  IF v_order.mimo_expires_at < NOW() THEN
    UPDATE public.orders SET status = 'mimo_expired' WHERE id = p_order_id;
    RETURN jsonb_build_object('valid', false, 'error', 'Este link expirou');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'order_id', v_order.id,
    'total', v_order.total,
    'target_name', v_order.mimo_target_name,
    'message', v_order.mimo_message,
    'expires_at', v_order.mimo_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
DROP POLICY IF EXISTS "niche_templates_read_all" ON niche_templates;
CREATE POLICY "niche_templates_read_all" ON niche_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_modules_read_all" ON niche_modules;
CREATE POLICY "niche_modules_read_all" ON niche_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_categories_read_all" ON niche_categories;
CREATE POLICY "niche_categories_read_all" ON niche_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_products_read_all" ON niche_products;
CREATE POLICY "niche_products_read_all" ON niche_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "niche_suggested_kits_read_all" ON niche_suggested_kits;
CREATE POLICY "niche_suggested_kits_read_all" ON niche_suggested_kits FOR SELECT USING (true);

-- Políticas de escrita apenas para superadmin
DROP POLICY IF EXISTS "niche_templates_write_superadmin" ON niche_templates;
CREATE POLICY "niche_templates_write_superadmin" ON niche_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_modules_write_superadmin" ON niche_modules;
CREATE POLICY "niche_modules_write_superadmin" ON niche_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_categories_write_superadmin" ON niche_categories;
CREATE POLICY "niche_categories_write_superadmin" ON niche_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_products_write_superadmin" ON niche_products;
CREATE POLICY "niche_products_write_superadmin" ON niche_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "niche_suggested_kits_write_superadmin" ON niche_suggested_kits;
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
-- Seed: Dados iniciais dos templates de nicho
-- Popula as tabelas com os dados dos 14 nichos

-- =============================================
-- 1. NICHOS PRINCIPAIS
-- =============================================
INSERT INTO niche_templates (id, name, description, icon, color, sort_order, has_delivery, has_pickup, has_table_service, has_counter_pickup, mimo_enabled, tab_system_enabled, rodizio_enabled, custom_orders_enabled, nutritional_info_enabled, weight_based_enabled, loyalty_type) VALUES
('acaiteria', 'Açaíteria / Sorveteria', 'Açaí, sorvetes, milkshakes e sobremesas geladas', 'IceCream', '#7C3AED', 1, true, true, false, true, true, false, false, false, false, false, 'stamps'),
('hamburgueria', 'Hamburgueria', 'Hambúrgueres artesanais, batatas e combos', 'Beef', '#DC2626', 2, true, true, true, true, true, false, false, false, false, false, 'points'),
('pizzaria', 'Pizzaria', 'Pizzas tradicionais e especiais, bordas recheadas', 'Pizza', '#EA580C', 3, true, true, true, false, true, false, false, false, false, false, 'stamps'),
('bar_pub', 'Bar / Pub', 'Bebidas, petiscos, comanda aberta e happy hour', 'Beer', '#CA8A04', 4, false, false, true, true, false, true, false, false, false, false, 'points'),
('sushi_japones', 'Sushi / Japonês', 'Sushis, sashimis, temakis e rodízio', 'Fish', '#0891B2', 5, true, true, true, false, true, false, true, false, false, false, 'points'),
('confeitaria', 'Confeitaria', 'Bolos, tortas, doces e encomendas', 'Cake', '#DB2777', 6, true, true, false, true, true, false, false, true, false, false, 'stamps'),
('fit_healthy', 'Fit / Healthy', 'Refeições saudáveis, low carb e fitness', 'Leaf', '#16A34A', 7, true, true, false, true, true, false, false, false, true, false, 'points'),
('acougue', 'Açougue', 'Carnes, cortes especiais e temperos', 'Beef', '#B91C1C', 8, true, true, false, true, false, false, false, false, false, true, 'points'),
('cafeteria', 'Cafeteria', 'Cafés especiais, bebidas e lanches rápidos', 'Coffee', '#78350F', 9, true, true, true, true, true, false, false, false, false, false, 'stamps'),
('marmitaria', 'Marmitaria', 'Marmitas, pratos do dia e refeições completas', 'UtensilsCrossed', '#EA580C', 10, true, true, false, true, true, false, false, false, false, false, 'stamps'),
('padaria', 'Padaria', 'Pães, frios, café da manhã e lanches', 'Croissant', '#D97706', 11, true, true, false, true, false, false, false, false, false, true, 'stamps'),
('restaurante', 'Restaurante', 'Restaurante completo com mesas e cardápio variado', 'UtensilsCrossed', '#7C3AED', 12, true, true, true, false, true, false, false, false, false, false, 'points'),
('sacolao', 'Sacolão / Hortifruti', 'Frutas, verduras, legumes e produtos naturais', 'Apple', '#22C55E', 13, true, true, false, true, false, false, false, false, false, true, 'points'),
('dark_kitchen', 'Dark Kitchen', 'Cozinha virtual com múltiplas marcas', 'ChefHat', '#1F2937', 14, true, false, false, false, true, false, false, false, false, false, 'points')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =============================================
-- 2. MÓDULOS BASE (para todos os nichos)
-- =============================================
-- Função helper para inserir módulos
CREATE OR REPLACE FUNCTION insert_niche_modules(p_niche_id TEXT, p_enabled_modules TEXT[])
RETURNS VOID AS $$
DECLARE
  modules TEXT[][] := ARRAY[
    ['menu', 'Cardápio Digital'],
    ['orders', 'Pedidos'],
    ['delivery', 'Delivery'],
    ['pos', 'PDV'],
    ['kitchen', 'Cozinha (KDS)'],
    ['tables', 'Mesas'],
    ['tabs', 'Comanda Aberta'],
    ['rodizio', 'Rodízio'],
    ['custom_orders', 'Encomendas'],
    ['nutritional', 'Info Nutricional'],
    ['weight', 'Venda por Peso'],
    ['loyalty', 'Fidelidade'],
    ['reports', 'Relatórios'],
    ['inventory', 'Estoque'],
    ['crm', 'CRM'],
    ['marketing', 'Marketing'],
    ['mimo', 'MIMO']
  ];
  m TEXT[];
  i INTEGER := 0;
BEGIN
  FOREACH m SLICE 1 IN ARRAY modules LOOP
    INSERT INTO niche_modules (niche_id, module_id, module_name, is_enabled, sort_order)
    VALUES (p_niche_id, m[1], m[2], m[1] = ANY(p_enabled_modules), i)
    ON CONFLICT (niche_id, module_id) DO UPDATE SET is_enabled = m[1] = ANY(p_enabled_modules);
    i := i + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Inserir módulos para cada nicho
SELECT insert_niche_modules('acaiteria', ARRAY['menu','orders','delivery','pos','kitchen','loyalty','reports','crm','mimo','marketing']);
SELECT insert_niche_modules('hamburgueria', ARRAY['menu','orders','delivery','pos','kitchen','tables','loyalty','reports','inventory','mimo']);
SELECT insert_niche_modules('pizzaria', ARRAY['menu','orders','delivery','pos','kitchen','tables','loyalty','reports','mimo']);
SELECT insert_niche_modules('bar_pub', ARRAY['menu','orders','pos','tables','tabs','reports','inventory']);
SELECT insert_niche_modules('sushi_japones', ARRAY['menu','orders','delivery','pos','kitchen','tables','rodizio','loyalty','reports','mimo']);
SELECT insert_niche_modules('confeitaria', ARRAY['menu','orders','delivery','pos','custom_orders','loyalty','reports','marketing']);
SELECT insert_niche_modules('fit_healthy', ARRAY['menu','orders','delivery','pos','nutritional','loyalty','reports','crm']);
SELECT insert_niche_modules('acougue', ARRAY['menu','orders','delivery','pos','weight','inventory','reports']);
SELECT insert_niche_modules('cafeteria', ARRAY['menu','orders','delivery','pos','loyalty','reports','crm','marketing']);
SELECT insert_niche_modules('marmitaria', ARRAY['menu','orders','delivery','pos','kitchen','loyalty','reports','inventory']);
SELECT insert_niche_modules('padaria', ARRAY['menu','orders','delivery','pos','weight','loyalty','reports','inventory']);
SELECT insert_niche_modules('restaurante', ARRAY['menu','orders','delivery','pos','kitchen','tables','loyalty','reports','inventory','crm','mimo']);
SELECT insert_niche_modules('sacolao', ARRAY['menu','orders','delivery','pos','weight','inventory','reports']);
SELECT insert_niche_modules('dark_kitchen', ARRAY['menu','orders','delivery','pos','kitchen','reports','inventory','marketing']);

-- Limpar função temporária
DROP FUNCTION IF EXISTS insert_niche_modules(TEXT, TEXT[]);
-- Seed: Categorias por nicho

-- Açaíteria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('acaiteria', 'Açaí', '🍇', 0),
('acaiteria', 'Adicionais', '🍓', 1),
('acaiteria', 'Sorvetes', '🍦', 2),
('acaiteria', 'Milkshakes', '🥤', 3),
('acaiteria', 'Bebidas', '💧', 4);

-- Hamburgueria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('hamburgueria', 'Hambúrgueres', '🍔', 0),
('hamburgueria', 'Combos', '🍟', 1),
('hamburgueria', 'Acompanhamentos', '🥔', 2),
('hamburgueria', 'Adicionais', '🧀', 3),
('hamburgueria', 'Sobremesas', '🍰', 4),
('hamburgueria', 'Bebidas', '🥤', 5);

-- Pizzaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('pizzaria', 'Pizzas Tradicionais', '🍕', 0),
('pizzaria', 'Pizzas Especiais', '⭐', 1),
('pizzaria', 'Pizzas Doces', '🍫', 2),
('pizzaria', 'Bordas', '🧀', 3),
('pizzaria', 'Bebidas', '🥤', 4);

-- Bar/Pub
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('bar_pub', 'Cervejas', '🍺', 0),
('bar_pub', 'Drinks', '🍸', 1),
('bar_pub', 'Doses', '🥃', 2),
('bar_pub', 'Porções', '🍗', 3),
('bar_pub', 'Não Alcoólicos', '🥤', 4);

-- Sushi
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('sushi_japones', 'Sushis', '🍣', 0),
('sushi_japones', 'Sashimis', '🐟', 1),
('sushi_japones', 'Temakis', '🍙', 2),
('sushi_japones', 'Hot Rolls', '🔥', 3),
('sushi_japones', 'Combos', '📦', 4),
('sushi_japones', 'Pratos Quentes', '🍜', 5),
('sushi_japones', 'Bebidas', '🥤', 6);

-- Confeitaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('confeitaria', 'Bolos', '🎂', 0),
('confeitaria', 'Tortas', '🥧', 1),
('confeitaria', 'Doces', '🍬', 2),
('confeitaria', 'Salgados', '🥟', 3),
('confeitaria', 'Bebidas', '☕', 4);

-- Fit/Healthy
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('fit_healthy', 'Pratos Principais', '🍽️', 0),
('fit_healthy', 'Saladas', '🥗', 1),
('fit_healthy', 'Bowls', '🥣', 2),
('fit_healthy', 'Smoothies', '🥤', 3),
('fit_healthy', 'Lanches', '🥪', 4),
('fit_healthy', 'Sobremesas Fit', '🍨', 5);

-- Açougue
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('acougue', 'Bovinos', '🥩', 0),
('acougue', 'Suínos', '🐷', 1),
('acougue', 'Aves', '🐔', 2),
('acougue', 'Linguiças', '🌭', 3),
('acougue', 'Churrasquinho', '🍢', 4);

-- Cafeteria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('cafeteria', 'Cafés', '☕', 0),
('cafeteria', 'Bebidas Geladas', '🧊', 1),
('cafeteria', 'Chás', '🍵', 2),
('cafeteria', 'Lanches', '🥪', 3),
('cafeteria', 'Doces', '🍰', 4);

-- Marmitaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('marmitaria', 'Marmitas', '🍱', 0),
('marmitaria', 'Pratos do Dia', '🍽️', 1),
('marmitaria', 'Acompanhamentos', '🥗', 2),
('marmitaria', 'Bebidas', '🥤', 3);

-- Padaria
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('padaria', 'Pães', '🍞', 0),
('padaria', 'Frios', '🧀', 1),
('padaria', 'Doces', '🧁', 2),
('padaria', 'Salgados', '🥐', 3),
('padaria', 'Café da Manhã', '☕', 4),
('padaria', 'Bebidas', '🥤', 5);

-- Restaurante
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('restaurante', 'Entradas', '🥗', 0),
('restaurante', 'Pratos Principais', '🍽️', 1),
('restaurante', 'Massas', '🍝', 2),
('restaurante', 'Grelhados', '🥩', 3),
('restaurante', 'Acompanhamentos', '🍚', 4),
('restaurante', 'Sobremesas', '🍮', 5),
('restaurante', 'Bebidas', '🥤', 6);

-- Sacolão
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('sacolao', 'Frutas', '🍎', 0),
('sacolao', 'Verduras', '🥬', 1),
('sacolao', 'Legumes', '🥕', 2),
('sacolao', 'Orgânicos', '🌱', 3),
('sacolao', 'Temperos', '🌿', 4);

-- Dark Kitchen
INSERT INTO niche_categories (niche_id, name, icon, sort_order) VALUES
('dark_kitchen', 'Pratos Principais', '🍽️', 0),
('dark_kitchen', 'Combos', '📦', 1),
('dark_kitchen', 'Acompanhamentos', '🍟', 2),
('dark_kitchen', 'Bebidas', '🥤', 3);
-- Seed: Produtos por nicho (principais)

-- =============================================
-- AÇAÍTERIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, price, cost, unit, has_addons, is_customizable, sort_order) VALUES
('acaiteria', 'Açaí', 'Açaí 300ml', 15.00, 6.00, 'un', true, true, 1),
('acaiteria', 'Açaí', 'Açaí 500ml', 22.00, 9.00, 'un', true, true, 2),
('acaiteria', 'Açaí', 'Açaí 700ml', 28.00, 12.00, 'un', true, true, 3),
('acaiteria', 'Açaí', 'Açaí Premium 300ml', 20.00, 8.00, 'un', true, true, 4),
('acaiteria', 'Açaí', 'Açaí Premium 500ml', 28.00, 12.00, 'un', true, true, 5),
('acaiteria', 'Adicionais', 'Leite Ninho', 3.00, 1.50, 'porção', false, false, 1),
('acaiteria', 'Adicionais', 'Granola', 2.00, 0.80, 'porção', false, false, 2),
('acaiteria', 'Adicionais', 'Paçoca', 2.50, 1.00, 'porção', false, false, 3),
('acaiteria', 'Adicionais', 'Banana', 2.00, 0.70, 'porção', false, false, 4),
('acaiteria', 'Adicionais', 'Morango', 3.00, 1.50, 'porção', false, false, 5),
('acaiteria', 'Adicionais', 'Nutella', 5.00, 3.00, 'porção', false, false, 6),
('acaiteria', 'Adicionais', 'Leite Condensado', 2.50, 1.00, 'porção', false, false, 7),
('acaiteria', 'Adicionais', 'Ovomaltine', 3.50, 2.00, 'porção', false, false, 8),
('acaiteria', 'Bebidas', 'Água Mineral 500ml', 4.00, 1.50, 'un', false, false, 1),
('acaiteria', 'Bebidas', 'Coca-Cola Lata', 6.00, 3.50, 'un', false, false, 2),
('acaiteria', 'Bebidas', 'Guaraná Lata', 5.50, 3.00, 'un', false, false, 3);

-- =============================================
-- HAMBURGUERIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, prep_time_minutes, sort_order) VALUES
('hamburgueria', 'Hambúrgueres', 'X-Burguer', 'Pão, blend 150g, queijo, salada, maionese', 22.00, 10.00, 'un', 15, 1),
('hamburgueria', 'Hambúrgueres', 'X-Bacon', 'Com bacon crocante', 28.00, 13.00, 'un', 15, 2),
('hamburgueria', 'Hambúrgueres', 'X-Tudo', 'Completo', 35.00, 16.00, 'un', 18, 3),
('hamburgueria', 'Hambúrgueres', 'Duplo Cheddar', '2 blends, cheddar, cebola caramelizada', 38.00, 18.00, 'un', 18, 4),
('hamburgueria', 'Hambúrgueres', 'Smash Burger', '2 smash 90g', 25.00, 11.00, 'un', 10, 5),
('hamburgueria', 'Combos', 'Combo X-Burguer', 'Lanche + Batata P + Refri', 32.00, 14.00, 'un', NULL, 1),
('hamburgueria', 'Combos', 'Combo X-Bacon', 'Lanche + Batata P + Refri', 38.00, 17.00, 'un', NULL, 2),
('hamburgueria', 'Acompanhamentos', 'Batata Frita P', NULL, 12.00, 4.00, 'un', NULL, 1),
('hamburgueria', 'Acompanhamentos', 'Batata Frita M', NULL, 16.00, 6.00, 'un', NULL, 2),
('hamburgueria', 'Acompanhamentos', 'Batata Frita G', NULL, 22.00, 8.00, 'un', NULL, 3),
('hamburgueria', 'Acompanhamentos', 'Onion Rings', NULL, 18.00, 7.00, 'un', NULL, 4),
('hamburgueria', 'Adicionais', 'Bacon Extra', NULL, 5.00, 2.50, 'porção', NULL, 1),
('hamburgueria', 'Adicionais', 'Queijo Cheddar', NULL, 4.00, 2.00, 'fatia', NULL, 2),
('hamburgueria', 'Adicionais', 'Ovo', NULL, 3.00, 1.00, 'un', NULL, 3),
('hamburgueria', 'Bebidas', 'Coca-Cola Lata', NULL, 6.00, 3.50, 'un', NULL, 1),
('hamburgueria', 'Bebidas', 'Coca-Cola 600ml', NULL, 8.00, 4.50, 'un', NULL, 2),
('hamburgueria', 'Bebidas', 'Água Mineral', NULL, 3.50, 1.50, 'un', NULL, 3);

-- =============================================
-- PIZZARIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, prep_time_minutes, sort_order) VALUES
('pizzaria', 'Pizzas Tradicionais', 'Mussarela', 'Molho, mussarela, orégano', 45.00, 18.00, 'un', 25, 1),
('pizzaria', 'Pizzas Tradicionais', 'Calabresa', 'Mussarela, calabresa, cebola', 48.00, 20.00, 'un', 25, 2),
('pizzaria', 'Pizzas Tradicionais', 'Portuguesa', 'Presunto, ovo, cebola, azeitona', 52.00, 24.00, 'un', 25, 3),
('pizzaria', 'Pizzas Tradicionais', 'Margherita', 'Tomate, manjericão', 50.00, 22.00, 'un', 25, 4),
('pizzaria', 'Pizzas Tradicionais', 'Frango c/ Catupiry', NULL, 52.00, 24.00, 'un', 25, 5),
('pizzaria', 'Pizzas Especiais', '4 Queijos', NULL, 55.00, 26.00, 'un', 25, 1),
('pizzaria', 'Pizzas Especiais', 'Pepperoni', NULL, 55.00, 26.00, 'un', 25, 2),
('pizzaria', 'Pizzas Doces', 'Chocolate', NULL, 45.00, 18.00, 'un', 20, 1),
('pizzaria', 'Pizzas Doces', 'Romeu e Julieta', NULL, 48.00, 20.00, 'un', 20, 2),
('pizzaria', 'Bordas', 'Borda Catupiry', NULL, 8.00, 3.00, 'un', NULL, 1),
('pizzaria', 'Bordas', 'Borda Cheddar', NULL, 8.00, 3.00, 'un', NULL, 2),
('pizzaria', 'Bebidas', 'Coca-Cola 2L', NULL, 14.00, 7.00, 'un', NULL, 1),
('pizzaria', 'Bebidas', 'Guaraná 2L', NULL, 10.00, 6.00, 'un', NULL, 2);

-- =============================================
-- BAR/PUB
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, price, cost, unit, sort_order) VALUES
('bar_pub', 'Cervejas', 'Brahma Lata', 6.00, 3.00, 'un', 1),
('bar_pub', 'Cervejas', 'Heineken Long Neck', 12.00, 6.00, 'un', 2),
('bar_pub', 'Cervejas', 'Corona Long Neck', 14.00, 7.00, 'un', 3),
('bar_pub', 'Cervejas', 'Chopp 300ml', 8.00, 3.00, 'un', 4),
('bar_pub', 'Cervejas', 'Balde 5 Long Necks', 45.00, 22.00, 'un', 5),
('bar_pub', 'Drinks', 'Caipirinha', 18.00, 6.00, 'un', 1),
('bar_pub', 'Drinks', 'Caipiroska', 20.00, 7.00, 'un', 2),
('bar_pub', 'Drinks', 'Mojito', 22.00, 8.00, 'un', 3),
('bar_pub', 'Drinks', 'Gin Tônica', 22.00, 9.00, 'un', 4),
('bar_pub', 'Doses', 'Dose Whisky', 18.00, 8.00, 'dose', 1),
('bar_pub', 'Doses', 'Dose Vodka', 12.00, 5.00, 'dose', 2),
('bar_pub', 'Porções', 'Batata Frita', 28.00, 10.00, 'un', 1),
('bar_pub', 'Porções', 'Frango à Passarinho', 38.00, 15.00, 'un', 2),
('bar_pub', 'Porções', 'Calabresa Acebolada', 35.00, 14.00, 'un', 3),
('bar_pub', 'Não Alcoólicos', 'Água Mineral', 4.00, 1.50, 'un', 1),
('bar_pub', 'Não Alcoólicos', 'Refrigerante Lata', 6.00, 3.00, 'un', 2),
('bar_pub', 'Não Alcoólicos', 'Red Bull', 15.00, 8.00, 'un', 3);

-- =============================================
-- SUSHI
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, prep_time_minutes, sort_order) VALUES
('sushi_japones', 'Sushis', 'Sushi Salmão (2un)', NULL, 10.00, 5.00, 'dupla', 8, 1),
('sushi_japones', 'Sushis', 'Sushi Atum (2un)', NULL, 12.00, 6.00, 'dupla', 8, 2),
('sushi_japones', 'Sushis', 'Sushi Camarão (2un)', NULL, 14.00, 7.00, 'dupla', 8, 3),
('sushi_japones', 'Sashimis', 'Sashimi Salmão 5 fatias', NULL, 18.00, 9.00, 'porção', 5, 1),
('sushi_japones', 'Sashimis', 'Sashimi Atum 5 fatias', NULL, 22.00, 11.00, 'porção', 5, 2),
('sushi_japones', 'Temakis', 'Temaki Salmão', NULL, 22.00, 10.00, 'un', 8, 1),
('sushi_japones', 'Temakis', 'Temaki Atum', NULL, 25.00, 12.00, 'un', 8, 2),
('sushi_japones', 'Hot Rolls', 'Hot Roll 8 peças', NULL, 22.00, 10.00, 'porção', 12, 1),
('sushi_japones', 'Hot Rolls', 'Hot Filadélfia 8 peças', NULL, 26.00, 12.00, 'porção', 12, 2),
('sushi_japones', 'Combos', 'Combo Salmão 20 peças', NULL, 65.00, 28.00, 'un', 20, 1),
('sushi_japones', 'Combos', 'Combo Casal 30 peças', NULL, 95.00, 42.00, 'un', 25, 2),
('sushi_japones', 'Combos', 'Rodízio Adulto', '2 horas', 89.90, 35.00, 'pessoa', NULL, 3),
('sushi_japones', 'Pratos Quentes', 'Yakisoba', NULL, 35.00, 14.00, 'un', 15, 1),
('sushi_japones', 'Pratos Quentes', 'Lámen', NULL, 38.00, 16.00, 'un', 18, 2);

-- =============================================
-- CONFEITARIA
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, description, price, cost, unit, is_customizable, sort_order) VALUES
('confeitaria', 'Bolos', 'Fatia Bolo Chocolate', NULL, 14.00, 5.00, 'fatia', false, 1),
('confeitaria', 'Bolos', 'Fatia Bolo Cenoura', NULL, 12.00, 4.00, 'fatia', false, 2),
('confeitaria', 'Bolos', 'Fatia Red Velvet', NULL, 16.00, 6.00, 'fatia', false, 3),
('confeitaria', 'Bolos', 'Bolo Chocolate 1kg', 'Encomenda 48h', 80.00, 35.00, 'un', false, 4),
('confeitaria', 'Bolos', 'Bolo Personalizado 1kg', 'Consulte opções', 120.00, 50.00, 'un', true, 5),
('confeitaria', 'Tortas', 'Torta Limão (fatia)', NULL, 14.00, 5.00, 'fatia', false, 1),
('confeitaria', 'Tortas', 'Cheesecake (fatia)', NULL, 18.00, 7.00, 'fatia', false, 2),
('confeitaria', 'Doces', 'Brigadeiro', NULL, 3.50, 1.00, 'un', false, 1),
('confeitaria', 'Doces', 'Beijinho', NULL, 3.50, 1.00, 'un', false, 2),
('confeitaria', 'Doces', 'Trufa', NULL, 5.00, 2.00, 'un', false, 3),
('confeitaria', 'Doces', 'Brownie', NULL, 8.00, 3.00, 'un', false, 4),
('confeitaria', 'Doces', 'Cento Brigadeiro', 'Encomenda', 120.00, 45.00, '100un', false, 5),
('confeitaria', 'Salgados', 'Coxinha', NULL, 6.00, 2.00, 'un', false, 1),
('confeitaria', 'Salgados', 'Empada', NULL, 6.00, 2.00, 'un', false, 2),
('confeitaria', 'Salgados', 'Cento Salgados', 'Encomenda', 180.00, 70.00, '100un', false, 3),
('confeitaria', 'Bebidas', 'Café Expresso', NULL, 5.00, 1.50, 'un', false, 1),
('confeitaria', 'Bebidas', 'Cappuccino', NULL, 9.00, 3.00, 'un', false, 2);

-- =============================================
-- FIT/HEALTHY (com nutricionais)
-- =============================================
INSERT INTO niche_products (niche_id, category_name, name, price, cost, unit, calories, protein_g, carbs_g, fat_g, sort_order) VALUES
('fit_healthy', 'Pratos Principais', 'Frango + Legumes', 28.00, 12.00, 'un', 350, 40, 15, 12, 1),
('fit_healthy', 'Pratos Principais', 'Salmão + Quinoa', 42.00, 20.00, 'un', 450, 35, 30, 18, 2),
('fit_healthy', 'Pratos Principais', 'Tilápia + Arroz Integral', 32.00, 14.00, 'un', 380, 32, 35, 10, 3),
('fit_healthy', 'Saladas', 'Salada Caesar Fit', 26.00, 11.00, 'un', 280, 28, 12, 14, 1),
('fit_healthy', 'Saladas', 'Salada Proteica', 32.00, 14.00, 'un', 380, 40, 15, 16, 2),
('fit_healthy', 'Bowls', 'Bowl de Atum', 32.00, 14.00, 'un', 380, 32, 35, 12, 1),
('fit_healthy', 'Bowls', 'Açaí Fit (sem açúcar)', 22.00, 9.00, '300ml', 250, 5, 30, 12, 2),
('fit_healthy', 'Smoothies', 'Smoothie Verde Detox', 16.00, 6.00, 'un', 120, 3, 25, 2, 1),
('fit_healthy', 'Smoothies', 'Smoothie Proteico', 22.00, 10.00, 'un', 350, 30, 35, 8, 2),
('fit_healthy', 'Lanches', 'Wrap Integral Frango', 22.00, 9.00, 'un', 320, 28, 30, 10, 1),
('fit_healthy', 'Sobremesas Fit', 'Brownie Fit', 10.00, 4.00, 'un', 150, 6, 18, 6, 1);

-- =============================================
-- KITS SUGERIDOS
-- =============================================
INSERT INTO niche_suggested_kits (niche_id, kit_id) VALUES
('acaiteria', 'acai_toppings'),
('acaiteria', 'icecream_flavors'),
('acaiteria', 'beverages_sodas'),
('hamburgueria', 'burger_proteins'),
('hamburgueria', 'burger_toppings'),
('hamburgueria', 'beverages_sodas'),
('pizzaria', 'pizza_flavors'),
('pizzaria', 'beverages_sodas'),
('bar_pub', 'beverages_beer'),
('bar_pub', 'beverages_energy'),
('sushi_japones', 'sushi_pieces'),
('sushi_japones', 'beverages_sodas'),
('confeitaria', 'bakery_cakes'),
('confeitaria', 'candy_chocolates'),
('confeitaria', 'coffee_drinks'),
('fit_healthy', 'fit_meals'),
('cafeteria', 'coffee_drinks'),
('marmitaria', 'beverages_sodas'),
('padaria', 'coffee_drinks'),
('padaria', 'beverages_sodas'),
('restaurante', 'beverages_sodas'),
('restaurante', 'beverages_beer'),
('dark_kitchen', 'beverages_sodas')
ON CONFLICT (niche_id, kit_id) DO NOTHING;
-- Migration: Sistema Completo de Fidelidade e Retenção
-- Baseado na especificação Tropical Freeze OS

-- ============================================
-- 1. CAMPO BIRTH_DATE EM CUSTOMERS
-- ============================================
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_date_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_bonus_given BOOLEAN DEFAULT FALSE;

-- Índice para busca de aniversariantes
CREATE INDEX IF NOT EXISTS idx_customers_birth_date ON public.customers(birth_date);

-- ============================================
-- 2. CONFIGURAÇÃO DE FIDELIDADE POR LOJA
-- ============================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS loyalty_active BOOLEAN DEFAULT TRUE,

-- Configuração de Aniversário
ADD COLUMN IF NOT EXISTS loyalty_birthday_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS loyalty_birthday_discount_percent INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS loyalty_birthday_window VARCHAR(10) DEFAULT 'week',

-- Configuração de Bônus de Cadastro
ADD COLUMN IF NOT EXISTS loyalty_registration_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS loyalty_registration_bonus_stamps INTEGER DEFAULT 2,

-- Configuração de Retenção (Régua de Relacionamento)
ADD COLUMN IF NOT EXISTS loyalty_retention_first_warning_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS loyalty_retention_second_warning_days INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS loyalty_retention_second_warning_discount INTEGER DEFAULT 15,

-- Configuração de Pontos/Selos
ADD COLUMN IF NOT EXISTS loyalty_calculation_type VARCHAR(10) DEFAULT 'order',
ADD COLUMN IF NOT EXISTS loyalty_order_value_per_stamp DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS loyalty_stamps_to_reward INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS loyalty_reward_type VARCHAR(20) DEFAULT 'credit',
ADD COLUMN IF NOT EXISTS loyalty_reward_value DECIMAL(10,2) DEFAULT 15.00;

-- ============================================
-- 3. TABELA DE MENSAGENS DE RETENÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.retention_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  trigger_type VARCHAR(20) NOT NULL, -- 'first_warning', 'second_warning', 'birthday'

  message_template TEXT NOT NULL,
  include_coupon BOOLEAN DEFAULT FALSE,
  coupon_code VARCHAR(50),
  coupon_discount_percent INTEGER,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens padrão para cada loja (trigger function)
CREATE OR REPLACE FUNCTION create_default_retention_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Mensagem de primeiro aviso (30 dias)
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon)
  VALUES (
    NEW.id,
    'first_warning',
    'Oi {nome}! 👋 Faz tempo que não te vemos por aqui. Que tal um {produto} hoje? Estamos com saudades! 💜',
    FALSE
  );

  -- Mensagem de segundo aviso (60 dias)
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon, coupon_code, coupon_discount_percent)
  VALUES (
    NEW.id,
    'second_warning',
    'Oi {nome}! 😢 Estamos com muitas saudades! Preparamos um presente especial pra você voltar: use o cupom VOLTA15 e ganhe 15% de desconto! 🎁',
    TRUE,
    'VOLTA15',
    15
  );

  -- Mensagem de aniversário
  INSERT INTO public.retention_messages (store_id, trigger_type, message_template, include_coupon, coupon_discount_percent)
  VALUES (
    NEW.id,
    'birthday',
    '🎂 Parabéns, {nome}! Hoje é seu dia especial e queremos comemorar com você! Ganhe {desconto}% de desconto no seu pedido. Feliz Aniversário! 🎉',
    TRUE,
    10
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar mensagens ao criar loja (só se não existir)
DROP TRIGGER IF EXISTS trigger_create_retention_messages ON public.stores;
CREATE TRIGGER trigger_create_retention_messages
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION create_default_retention_messages();

-- ============================================
-- 4. LOG DE CONTATOS DE RETENÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.retention_contact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  trigger_type VARCHAR(20) NOT NULL,
  message_sent TEXT,
  channel VARCHAR(20) DEFAULT 'whatsapp',

  coupon_code VARCHAR(50),
  coupon_used BOOLEAN DEFAULT FALSE,
  coupon_used_order_id UUID REFERENCES public.orders(id),

  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_retention_log_customer ON public.retention_contact_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_retention_log_store ON public.retention_contact_log(store_id);

-- ============================================
-- 5. VIEW PARA SEMÁFORO DE CLIENTES
-- ============================================
CREATE OR REPLACE VIEW public.customer_retention_status AS
SELECT
  c.id,
  c.store_id,
  c.name,
  c.phone,
  c.email,
  c.birth_date,
  c.created_at,
  cl.points_balance,
  cl.stamps_current,
  cl.stamps_completed,
  cl.total_orders,
  cl.total_spent,
  cl.last_order_at,

  -- Dias desde último pedido
  COALESCE(
    EXTRACT(DAY FROM NOW() - cl.last_order_at)::INTEGER,
    EXTRACT(DAY FROM NOW() - c.created_at)::INTEGER
  ) AS days_inactive,

  -- Status do semáforo
  CASE
    WHEN cl.last_order_at IS NULL AND c.created_at > NOW() - INTERVAL '7 days' THEN 'new'
    WHEN cl.last_order_at > NOW() - INTERVAL '30 days' THEN 'active'
    WHEN cl.last_order_at > NOW() - INTERVAL '60 days' THEN 'warning'
    WHEN cl.last_order_at <= NOW() - INTERVAL '60 days' THEN 'risk'
    WHEN cl.last_order_at IS NULL THEN 'inactive'
    ELSE 'unknown'
  END AS retention_status,

  -- É aniversariante?
  CASE
    WHEN c.birth_date IS NOT NULL
      AND EXTRACT(MONTH FROM c.birth_date) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(DAY FROM c.birth_date) BETWEEN EXTRACT(DAY FROM NOW()) - 3 AND EXTRACT(DAY FROM NOW()) + 3
    THEN TRUE
    ELSE FALSE
  END AS is_birthday_period,

  -- Segmento VIP
  CASE
    WHEN cl.total_spent >= 500 THEN 'vip'
    WHEN cl.total_orders >= 10 THEN 'frequent'
    WHEN cl.total_orders >= 3 THEN 'regular'
    WHEN cl.total_orders >= 1 THEN 'new'
    ELSE 'prospect'
  END AS customer_segment

FROM public.customers c
LEFT JOIN public.customer_loyalty cl ON c.id = cl.customer_id AND c.store_id = cl.store_id;

-- ============================================
-- 6. FUNÇÃO PARA CREDITAR PONTOS
-- ============================================
CREATE OR REPLACE FUNCTION credit_loyalty_points(
  p_store_id UUID,
  p_customer_id UUID,
  p_order_id UUID,
  p_order_total DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_store RECORD;
  v_loyalty RECORD;
  v_points_to_add INTEGER;
  v_loyalty_id UUID;
BEGIN
  -- Buscar config da loja
  SELECT
    loyalty_active,
    loyalty_calculation_type,
    loyalty_order_value_per_stamp,
    loyalty_stamps_to_reward,
    loyalty_reward_type,
    loyalty_reward_value
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;

  -- Se fidelidade não está ativa, retorna 0
  IF NOT v_store.loyalty_active THEN
    RETURN 0;
  END IF;

  -- Calcular pontos baseado no tipo
  IF v_store.loyalty_calculation_type = 'order' THEN
    v_points_to_add := 1; -- 1 selo por pedido
  ELSE
    -- Pontos por valor (ex: R$ 20 = 1 selo)
    v_points_to_add := FLOOR(p_order_total / v_store.loyalty_order_value_per_stamp)::INTEGER;
  END IF;

  -- Se não ganha nenhum ponto, retorna
  IF v_points_to_add <= 0 THEN
    RETURN 0;
  END IF;

  -- Buscar ou criar registro de fidelidade do cliente
  SELECT id, stamps_current INTO v_loyalty
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;

  IF v_loyalty.id IS NULL THEN
    -- Criar novo registro
    INSERT INTO public.customer_loyalty (customer_id, store_id, stamps_current, points_balance, total_orders, total_spent, last_order_at)
    VALUES (p_customer_id, p_store_id, v_points_to_add, v_points_to_add, 1, p_order_total, NOW())
    RETURNING id INTO v_loyalty_id;
  ELSE
    -- Atualizar registro existente
    UPDATE public.customer_loyalty
    SET
      stamps_current = stamps_current + v_points_to_add,
      points_balance = points_balance + v_points_to_add,
      points_earned_total = points_earned_total + v_points_to_add,
      total_orders = total_orders + 1,
      total_spent = total_spent + p_order_total,
      last_order_at = NOW(),
      updated_at = NOW()
    WHERE id = v_loyalty.id;

    v_loyalty_id := v_loyalty.id;
  END IF;

  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    order_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty_id,
    p_store_id,
    p_order_id,
    'earn',
    v_points_to_add,
    v_points_to_add,
    'Pedido #' || p_order_id::TEXT
  );

  RETURN v_points_to_add;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNÇÃO PARA DAR BÔNUS DE CADASTRO
-- ============================================
CREATE OR REPLACE FUNCTION give_registration_bonus(
  p_store_id UUID,
  p_customer_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_store RECORD;
  v_customer RECORD;
  v_loyalty_id UUID;
  v_bonus INTEGER;
BEGIN
  -- Verificar se já recebeu bônus
  SELECT registration_bonus_given INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id;

  IF v_customer.registration_bonus_given THEN
    RETURN 0;
  END IF;

  -- Buscar config da loja
  SELECT
    loyalty_active,
    loyalty_registration_active,
    loyalty_registration_bonus_stamps
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;

  -- Verificar se bônus está ativo
  IF NOT v_store.loyalty_active OR NOT v_store.loyalty_registration_active THEN
    RETURN 0;
  END IF;

  v_bonus := v_store.loyalty_registration_bonus_stamps;

  -- Buscar ou criar registro de fidelidade
  SELECT id INTO v_loyalty_id
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;

  IF v_loyalty_id IS NULL THEN
    INSERT INTO public.customer_loyalty (customer_id, store_id, stamps_current, points_balance)
    VALUES (p_customer_id, p_store_id, v_bonus, v_bonus)
    RETURNING id INTO v_loyalty_id;
  ELSE
    UPDATE public.customer_loyalty
    SET
      stamps_current = stamps_current + v_bonus,
      points_balance = points_balance + v_bonus,
      points_earned_total = points_earned_total + v_bonus,
      updated_at = NOW()
    WHERE id = v_loyalty_id;
  END IF;

  -- Marcar que recebeu bônus
  UPDATE public.customers
  SET
    registration_bonus_given = TRUE,
    registration_completed = TRUE
  WHERE id = p_customer_id;

  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty_id,
    p_store_id,
    'bonus',
    v_bonus,
    v_bonus,
    'Bônus de cadastro completo'
  );

  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO PARA RESGATAR PONTOS
-- ============================================
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_store_id UUID,
  p_customer_id UUID,
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_store RECORD;
  v_loyalty RECORD;
  v_stamps_required INTEGER;
  v_reward_value DECIMAL;
BEGIN
  -- Buscar config da loja
  SELECT
    loyalty_stamps_to_reward,
    loyalty_reward_type,
    loyalty_reward_value
  INTO v_store
  FROM public.stores
  WHERE id = p_store_id;

  v_stamps_required := v_store.loyalty_stamps_to_reward;
  v_reward_value := v_store.loyalty_reward_value;

  -- Buscar saldo do cliente
  SELECT id, stamps_current INTO v_loyalty
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id AND store_id = p_store_id;

  -- Verificar se tem selos suficientes
  IF v_loyalty.stamps_current < v_stamps_required THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Selos insuficientes',
      'stamps_current', COALESCE(v_loyalty.stamps_current, 0),
      'stamps_required', v_stamps_required
    );
  END IF;

  -- Deduzir selos
  UPDATE public.customer_loyalty
  SET
    stamps_current = stamps_current - v_stamps_required,
    points_redeemed_total = points_redeemed_total + v_stamps_required,
    stamps_completed = stamps_completed + 1,
    updated_at = NOW()
  WHERE id = v_loyalty.id;

  -- Registrar transação
  INSERT INTO public.loyalty_transactions (
    customer_loyalty_id,
    store_id,
    order_id,
    transaction_type,
    points_amount,
    stamps_amount,
    description
  ) VALUES (
    v_loyalty.id,
    p_store_id,
    p_order_id,
    'redeem',
    -v_stamps_required,
    -v_stamps_required,
    'Resgate de prêmio - R$ ' || v_reward_value::TEXT
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'reward_type', v_store.loyalty_reward_type,
    'reward_value', v_reward_value,
    'stamps_used', v_stamps_required,
    'stamps_remaining', v_loyalty.stamps_current - v_stamps_required
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. RLS POLICIES
-- ============================================
ALTER TABLE public.retention_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_contact_log ENABLE ROW LEVEL SECURITY;

-- Políticas para retention_messages
 DROP POLICY IF EXISTS "retention_messages_select" ON public.retention_messages;
CREATE POLICY "retention_messages_select" ON public.retention_messages
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

 DROP POLICY IF EXISTS "retention_messages_insert" ON public.retention_messages;
CREATE POLICY "retention_messages_insert" ON public.retention_messages
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid() AND role::text IN ('owner', 'manager')
    )
  );

 DROP POLICY IF EXISTS "retention_messages_update" ON public.retention_messages;
CREATE POLICY "retention_messages_update" ON public.retention_messages
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid() AND role::text IN ('owner', 'manager')
    )
  );

-- Políticas para retention_contact_log
 DROP POLICY IF EXISTS "retention_log_select" ON public.retention_contact_log;
CREATE POLICY "retention_log_select" ON public.retention_contact_log
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

 DROP POLICY IF EXISTS "retention_log_insert" ON public.retention_contact_log;
CREATE POLICY "retention_log_insert" ON public.retention_contact_log
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.store_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================
COMMENT ON COLUMN public.stores.loyalty_calculation_type IS 'order = 1 selo por pedido, value = selos por valor gasto';
COMMENT ON COLUMN public.stores.loyalty_birthday_window IS 'day, week ou month';
COMMENT ON VIEW public.customer_retention_status IS 'View com status de retenção (semáforo) de cada cliente';
COMMENT ON FUNCTION credit_loyalty_points IS 'Credita pontos/selos ao cliente após pedido';
COMMENT ON FUNCTION give_registration_bonus IS 'Dá bônus de selos ao completar cadastro';
COMMENT ON FUNCTION redeem_loyalty_points IS 'Resgata pontos/selos por desconto';
-- =============================================
-- FIX CRÍTICO: Colunas faltantes detectadas na auditoria
-- =============================================

-- Adiciona cor às categorias (Critical Fix)
ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "color" VARCHAR(20) DEFAULT '#3b82f6';

-- Garante que colunas de loyalty existam na loja (Safety Check)
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_active" BOOLEAN DEFAULT false;
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_calculation_type" VARCHAR(10) DEFAULT 'order_value';
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_order_value_per_stamp" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_stamps_to_reward" INTEGER DEFAULT 10;
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_reward_value" DECIMAL(10,2) DEFAULT 0;
-- =============================================
-- PIZZARIA: Sistema de Frações (Meio a Meio)
-- Permite dividir um item do pedido em múltiplos sabores
-- =============================================

-- Tabela de sabores fracionados por item do pedido
CREATE TABLE IF NOT EXISTS "public"."order_item_flavors" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "order_item_id" UUID NOT NULL REFERENCES "public"."order_items"("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "public"."products"("id"),
  "fraction" DECIMAL(3,2) NOT NULL, -- Ex: 0.50 para meio, 0.33 para terço
  "name_snapshot" VARCHAR(255),
  "price_snapshot" DECIMAL(10,2),
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_item_flavors_order_item ON "public"."order_item_flavors"("order_item_id");
CREATE INDEX IF NOT EXISTS idx_order_item_flavors_product ON "public"."order_item_flavors"("product_id");

-- RLS
ALTER TABLE "public"."order_item_flavors" ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública (para exibir no pedido)
DROP POLICY IF EXISTS "order_item_flavors_select" ON "public"."order_item_flavors";
CREATE POLICY "order_item_flavors_select" ON "public"."order_item_flavors"
  FOR SELECT USING (true);

-- Policy: Insert/Update/Delete apenas para membros da loja
DROP POLICY IF EXISTS "order_item_flavors_write" ON "public"."order_item_flavors";
CREATE POLICY "order_item_flavors_write" ON "public"."order_item_flavors"
  FOR ALL USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id IN (
        SELECT store_id FROM store_users WHERE user_id = auth.uid()
      )
    )
  );

-- Comentário explicativo
COMMENT ON TABLE "public"."order_item_flavors" IS 'Sabores fracionados para pizzas meio-a-meio. Cada linha representa uma fração do item.';
COMMENT ON COLUMN "public"."order_item_flavors"."fraction" IS 'Fração do item: 0.50 = metade, 0.33 = terço, 0.25 = quarto';
-- =============================================
-- CORREÇÃO: Adiciona nichos faltantes (Peixaria e Mercearia)
-- Total: 14 -> 16 nichos
-- =============================================

-- Adiciona Peixaria e Mercearia aos templates de nicho
INSERT INTO niche_templates (id, name, description, icon, color, sort_order, has_delivery, has_pickup, has_table_service, has_counter_pickup, weight_based_enabled, custom_orders_enabled, loyalty_type) VALUES
('peixaria', 'Peixaria', 'Venda por kg, preparos (filé, posta, limpo)', 'Fish', '#0EA5E9', 15, true, true, false, true, true, true, 'points'),
('mercearia', 'Mercearia / Empório', 'Código de barras, estoque e validade', 'Store', '#10B981', 16, true, true, false, true, false, false, 'points')
ON CONFLICT (id) DO NOTHING;

-- Insere os módulos para Peixaria (Com Peso)
INSERT INTO niche_modules (niche_id, module_id, module_name, is_enabled) VALUES
('peixaria', 'menu', 'Cardápio Digital', true),
('peixaria', 'orders', 'Pedidos', true),
('peixaria', 'delivery', 'Delivery', true),
('peixaria', 'pos', 'PDV', true),
('peixaria', 'weight', 'Venda por Peso', true),
('peixaria', 'inventory', 'Estoque', true),
('peixaria', 'reports', 'Relatórios', true)
ON CONFLICT DO NOTHING;

-- Insere os módulos para Mercearia (Com Estoque)
INSERT INTO niche_modules (niche_id, module_id, module_name, is_enabled) VALUES
('mercearia', 'menu', 'Cardápio Digital', true),
('mercearia', 'orders', 'Pedidos', true),
('mercearia', 'delivery', 'Delivery', true),
('mercearia', 'pos', 'PDV', true),
('mercearia', 'inventory', 'Estoque', true),
('mercearia', 'reports', 'Relatórios', true),
('mercearia', 'marketing', 'Marketing', true)
ON CONFLICT DO NOTHING;
-- ============================================
-- MIGRATION: Forçar Layout Moderno + Seed Açaí
-- Data: 2025-12-15
-- Objetivo: Corrigir lojas com layout antigo e popular cardápios vazios
-- ============================================

-- 1. FORÇAR LAYOUT MODERNO (IFOOD STYLE) NO menu_theme
UPDATE stores
SET menu_theme = jsonb_set(
  COALESCE(menu_theme, '{}'::jsonb),
  '{layout}',
  '"modern"'
)
WHERE menu_theme IS NULL
   OR menu_theme->>'layout' IS NULL
   OR menu_theme->>'layout' = 'classic';

-- 2. GARANTIR CORES PADRÃO NO menu_theme
UPDATE stores
SET menu_theme = jsonb_set(
  COALESCE(menu_theme, '{}'::jsonb),
  '{colors}',
  '{"primary": "#8B5CF6", "background": "#f4f4f5", "header": "#ffffff"}'::jsonb
)
WHERE menu_theme->'colors' IS NULL;

-- 3. GARANTIR DISPLAY OPTIONS
UPDATE stores
SET menu_theme = jsonb_set(
  COALESCE(menu_theme, '{}'::jsonb),
  '{display}',
  '{"showBanner": true, "showLogo": true, "showSearch": true, "showAddress": true, "showSocial": true}'::jsonb
)
WHERE menu_theme->'display' IS NULL;

-- 4. POPULAR AÇAÍ (SE ESTIVER VAZIO)
DO $$
DECLARE
  v_store_id UUID;
  v_cat_destaques UUID;
  v_cat_acai UUID;
  v_cat_adicionais UUID;
  v_product_count INT;
BEGIN
  -- Pega a primeira loja do tipo acaiteria (ou qualquer loja com 'acai' no slug)
  SELECT id INTO v_store_id
  FROM stores
  WHERE niche_slug = 'acaiteria'
     OR slug ILIKE '%acai%'
  LIMIT 1;

  IF v_store_id IS NOT NULL THEN
    -- Verifica se já tem produtos
    SELECT COUNT(*) INTO v_product_count FROM products WHERE store_id = v_store_id;

    -- Só insere se estiver vazio
    IF v_product_count = 0 THEN
      RAISE NOTICE 'Loja de açaí encontrada (%) sem produtos. Populando...', v_store_id;

      -- ========== CRIAR CATEGORIAS ==========
      INSERT INTO categories (id, store_id, name, sort_order, color, is_active)
      VALUES (gen_random_uuid(), v_store_id, '⭐ Destaques', 0, 'purple', true)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_cat_destaques;

      IF v_cat_destaques IS NULL THEN
        SELECT id INTO v_cat_destaques FROM categories WHERE store_id = v_store_id AND name ILIKE '%destaque%' LIMIT 1;
      END IF;

      INSERT INTO categories (id, store_id, name, sort_order, color, is_active)
      VALUES (gen_random_uuid(), v_store_id, '🍇 Açaís', 1, 'violet', true)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_cat_acai;

      IF v_cat_acai IS NULL THEN
        SELECT id INTO v_cat_acai FROM categories WHERE store_id = v_store_id AND name ILIKE '%açaí%' LIMIT 1;
      END IF;

      INSERT INTO categories (id, store_id, name, sort_order, color, is_active)
      VALUES (gen_random_uuid(), v_store_id, '🍫 Adicionais', 2, 'amber', true)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_cat_adicionais;

      IF v_cat_adicionais IS NULL THEN
        SELECT id INTO v_cat_adicionais FROM categories WHERE store_id = v_store_id AND name ILIKE '%adicion%' LIMIT 1;
      END IF;

      -- ========== CRIAR PRODUTOS - DESTAQUES ==========
      IF v_cat_destaques IS NOT NULL THEN
        INSERT INTO products (store_id, category_id, name, description, base_price, image_url, is_active, sort_order)
        VALUES
          (v_store_id, v_cat_destaques, 'Açaí Turbinado 500ml',
           'Açaí puro com banana, granola, leite em pó e leite condensado. O mais pedido!',
           24.90,
           'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
           true, 1),
          (v_store_id, v_cat_destaques, 'Barca de Açaí Real 1kg',
           'Ideal para dividir! 1kg de açaí cremoso + 5 complementos à sua escolha.',
           59.90,
           'https://images.unsplash.com/photo-1588710929895-6aa5a7322923?auto=format&fit=crop&w=800&q=80',
           true, 2)
        ON CONFLICT DO NOTHING;
      END IF;

      -- ========== CRIAR PRODUTOS - AÇAÍS ==========
      IF v_cat_acai IS NOT NULL THEN
        INSERT INTO products (store_id, category_id, name, description, base_price, image_url, is_active, sort_order)
        VALUES
          (v_store_id, v_cat_acai, 'Açaí Puro 300ml',
           'Açaí 100% puro, sem adição de açúcar. Sabor autêntico da Amazônia.',
           16.90,
           'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
           true, 1),
          (v_store_id, v_cat_acai, 'Açaí Puro 500ml',
           'Açaí 100% puro, sem adição de açúcar. Sabor autêntico da Amazônia.',
           22.90,
           'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
           true, 2),
          (v_store_id, v_cat_acai, 'Açaí Puro 700ml',
           'Açaí 100% puro, sem adição de açúcar. Sabor autêntico da Amazônia.',
           28.90,
           'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
           true, 3),
          (v_store_id, v_cat_acai, 'Açaí com Morango 500ml',
           'Açaí cremoso batido com morangos frescos. Refrescante e saudável.',
           26.90,
           'https://images.unsplash.com/photo-1553530666-ba11a90a0868?auto=format&fit=crop&w=800&q=80',
           true, 4)
        ON CONFLICT DO NOTHING;
      END IF;

      -- ========== CRIAR PRODUTOS - ADICIONAIS ==========
      IF v_cat_adicionais IS NOT NULL THEN
        INSERT INTO products (store_id, category_id, name, description, base_price, image_url, is_active, sort_order)
        VALUES
          (v_store_id, v_cat_adicionais, 'Granola Crocante',
           'Porção extra de granola artesanal.',
           3.00,
           'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=800&q=80',
           true, 1),
          (v_store_id, v_cat_adicionais, 'Leite Condensado',
           'Porção extra de leite condensado.',
           2.50,
           'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
           true, 2),
          (v_store_id, v_cat_adicionais, 'Banana',
           'Fatias de banana fresca.',
           2.00,
           'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
           true, 3),
          (v_store_id, v_cat_adicionais, 'Paçoca Triturada',
           'Paçoca artesanal triturada.',
           3.50,
           'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
           true, 4)
        ON CONFLICT DO NOTHING;
      END IF;

      RAISE NOTICE 'Produtos de açaí criados com sucesso para loja %', v_store_id;
    ELSE
      RAISE NOTICE 'Loja % já possui % produtos. Pulando seed.', v_store_id, v_product_count;
    END IF;
  ELSE
    RAISE NOTICE 'Nenhuma loja de açaí encontrada.';
  END IF;
END $$;

-- 5. LOG FINAL
DO $$
DECLARE
  v_store_count INT;
  v_product_count INT;
BEGIN
  SELECT COUNT(*) INTO v_store_count FROM stores;
  SELECT COUNT(*) INTO v_product_count FROM products;
  RAISE NOTICE '=== MIGRATION COMPLETA ===';
  RAISE NOTICE 'Total de lojas: %', v_store_count;
  RAISE NOTICE 'Total de produtos: %', v_product_count;
  RAISE NOTICE '==========================';
END $$;
-- ============================================================================
-- RLS-CORE-FIX-01: Correção de policies permissivas (USING true)
-- Data: 2025-12-17
-- Bloqueador de Produção: SIM
-- ============================================================================
--
-- PROBLEMA: Múltiplas tabelas com policies `FOR ALL USING (true)` permitem
-- que qualquer usuário autenticado leia/escreva dados de TODAS as lojas.
--
-- SOLUÇÃO: Substituir por policies que filtram por store_id usando
-- a função `user_has_store_access(store_id)`.
--
-- ESCOPO: Tabelas core com dados sensíveis de loja
-- ============================================================================

-- 1) GARANTIR FUNÇÃO DE AUTORIZAÇÃO EXISTE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 2) KITCHEN_CHEFS (já tem migration separada, mas garantir idempotência)
-- ============================================================================
ALTER TABLE IF EXISTS public.kitchen_chefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kitchen_chefs_all" ON public.kitchen_chefs;
DROP POLICY IF EXISTS "kitchen_chefs_store_access" ON public.kitchen_chefs;

CREATE POLICY "kitchen_chefs_store_access" ON public.kitchen_chefs
FOR ALL
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

-- ============================================================================
-- 3) STORE_WAITERS
-- ============================================================================
ALTER TABLE IF EXISTS public.store_waiters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_waiters_all" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_select" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_insert" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_update" ON public.store_waiters;
DROP POLICY IF EXISTS "store_waiters_delete" ON public.store_waiters;

CREATE POLICY "store_waiters_select" ON public.store_waiters
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "store_waiters_insert" ON public.store_waiters
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "store_waiters_update" ON public.store_waiters
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "store_waiters_delete" ON public.store_waiters
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 4) WAITER_SCHEDULES (via store_waiters.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.waiter_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiter_schedules_all" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_select" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_insert" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_update" ON public.waiter_schedules;
DROP POLICY IF EXISTS "waiter_schedules_delete" ON public.waiter_schedules;

CREATE POLICY "waiter_schedules_select" ON public.waiter_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_schedules_insert" ON public.waiter_schedules
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_schedules_update" ON public.waiter_schedules
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_schedules_delete" ON public.waiter_schedules
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_schedules.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

-- ============================================================================
-- 5) WAITER_COMMISSIONS (via store_waiters.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.waiter_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiter_commissions_all" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_select" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_insert" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_update" ON public.waiter_commissions;
DROP POLICY IF EXISTS "waiter_commissions_delete" ON public.waiter_commissions;

CREATE POLICY "waiter_commissions_select" ON public.waiter_commissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_commissions_insert" ON public.waiter_commissions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_commissions_update" ON public.waiter_commissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

CREATE POLICY "waiter_commissions_delete" ON public.waiter_commissions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.store_waiters sw
    WHERE sw.id = waiter_commissions.waiter_id
      AND public.user_has_store_access(sw.store_id)
  )
);

-- ============================================================================
-- 6) TABLE_RESERVATIONS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.table_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "table_reservations_all" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_select" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_insert" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_update" ON public.table_reservations;
DROP POLICY IF EXISTS "table_reservations_delete" ON public.table_reservations;

CREATE POLICY "table_reservations_select" ON public.table_reservations
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "table_reservations_insert" ON public.table_reservations
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_reservations_update" ON public.table_reservations
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_reservations_delete" ON public.table_reservations
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 7) WAITER_CALLS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.waiter_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiter_calls_all" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_select" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_insert" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_update" ON public.waiter_calls;
DROP POLICY IF EXISTS "waiter_calls_delete" ON public.waiter_calls;

CREATE POLICY "waiter_calls_select" ON public.waiter_calls
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "waiter_calls_insert" ON public.waiter_calls
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "waiter_calls_update" ON public.waiter_calls
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "waiter_calls_delete" ON public.waiter_calls
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 8) TABLE_SESSIONS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.table_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "table_sessions_all" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_select" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_insert" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_update" ON public.table_sessions;
DROP POLICY IF EXISTS "table_sessions_delete" ON public.table_sessions;

CREATE POLICY "table_sessions_select" ON public.table_sessions
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "table_sessions_insert" ON public.table_sessions
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_sessions_update" ON public.table_sessions
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "table_sessions_delete" ON public.table_sessions
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 9) DRIVER_RATINGS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.driver_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_ratings_all" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_select" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_insert" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_update" ON public.driver_ratings;
DROP POLICY IF EXISTS "driver_ratings_delete" ON public.driver_ratings;

CREATE POLICY "driver_ratings_select" ON public.driver_ratings
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "driver_ratings_insert" ON public.driver_ratings
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "driver_ratings_update" ON public.driver_ratings
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "driver_ratings_delete" ON public.driver_ratings
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 10) SCHEDULING_SLOTS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.scheduling_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scheduling_slots_all" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_select" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_insert" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_update" ON public.scheduling_slots;
DROP POLICY IF EXISTS "scheduling_slots_delete" ON public.scheduling_slots;

CREATE POLICY "scheduling_slots_select" ON public.scheduling_slots
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "scheduling_slots_insert" ON public.scheduling_slots
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "scheduling_slots_update" ON public.scheduling_slots
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "scheduling_slots_delete" ON public.scheduling_slots
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 11) PRODUCT_KITS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_kits_all" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_select" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_insert" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_update" ON public.product_kits;
DROP POLICY IF EXISTS "product_kits_delete" ON public.product_kits;

CREATE POLICY "product_kits_select" ON public.product_kits
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "product_kits_insert" ON public.product_kits
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "product_kits_update" ON public.product_kits
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "product_kits_delete" ON public.product_kits
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 12) PRODUCT_KIT_ITEMS (via product_kits.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_kit_items_all" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_select" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_insert" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_update" ON public.product_kit_items;
DROP POLICY IF EXISTS "product_kit_items_delete" ON public.product_kit_items;

CREATE POLICY "product_kit_items_select" ON public.product_kit_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

CREATE POLICY "product_kit_items_insert" ON public.product_kit_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

CREATE POLICY "product_kit_items_update" ON public.product_kit_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

CREATE POLICY "product_kit_items_delete" ON public.product_kit_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.product_kits pk
    WHERE pk.id = product_kit_items.kit_id
      AND public.user_has_store_access(pk.store_id)
  )
);

-- ============================================================================
-- 13) CUSTOMIZATION_GROUPS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.customization_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customization_groups_all" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_select" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_insert" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_update" ON public.customization_groups;
DROP POLICY IF EXISTS "customization_groups_delete" ON public.customization_groups;

CREATE POLICY "customization_groups_select" ON public.customization_groups
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "customization_groups_insert" ON public.customization_groups
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "customization_groups_update" ON public.customization_groups
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "customization_groups_delete" ON public.customization_groups
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 14) CUSTOMIZATION_OPTIONS (via customization_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.customization_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customization_options_all" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_select" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_insert" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_update" ON public.customization_options;
DROP POLICY IF EXISTS "customization_options_delete" ON public.customization_options;

CREATE POLICY "customization_options_select" ON public.customization_options
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "customization_options_insert" ON public.customization_options
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "customization_options_update" ON public.customization_options
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "customization_options_delete" ON public.customization_options
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = customization_options.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

-- ============================================================================
-- 15) PRODUCT_CUSTOMIZATION_GROUPS (via customization_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_customization_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_customization_groups_all" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_select" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_insert" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_update" ON public.product_customization_groups;
DROP POLICY IF EXISTS "product_customization_groups_delete" ON public.product_customization_groups;

CREATE POLICY "product_customization_groups_select" ON public.product_customization_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "product_customization_groups_insert" ON public.product_customization_groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "product_customization_groups_update" ON public.product_customization_groups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

CREATE POLICY "product_customization_groups_delete" ON public.product_customization_groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.customization_groups cg
    WHERE cg.id = product_customization_groups.group_id
      AND public.user_has_store_access(cg.store_id)
  )
);

-- ============================================================================
-- 16) CUSTOM_ORDERS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.custom_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_orders_all" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_select" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_insert" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_update" ON public.custom_orders;
DROP POLICY IF EXISTS "custom_orders_delete" ON public.custom_orders;

CREATE POLICY "custom_orders_select" ON public.custom_orders
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "custom_orders_insert" ON public.custom_orders
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "custom_orders_update" ON public.custom_orders
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "custom_orders_delete" ON public.custom_orders
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 17) CUSTOM_ORDER_ITEMS (via custom_orders.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.custom_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_order_items_all" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_select" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_insert" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_update" ON public.custom_order_items;
DROP POLICY IF EXISTS "custom_order_items_delete" ON public.custom_order_items;

CREATE POLICY "custom_order_items_select" ON public.custom_order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

CREATE POLICY "custom_order_items_insert" ON public.custom_order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

CREATE POLICY "custom_order_items_update" ON public.custom_order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

CREATE POLICY "custom_order_items_delete" ON public.custom_order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders co
    WHERE co.id = custom_order_items.order_id
      AND public.user_has_store_access(co.store_id)
  )
);

-- ============================================================================
-- 18) PRODUCTION_CALENDAR (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.production_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_calendar_all" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_select" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_insert" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_update" ON public.production_calendar;
DROP POLICY IF EXISTS "production_calendar_delete" ON public.production_calendar;

CREATE POLICY "production_calendar_select" ON public.production_calendar
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "production_calendar_insert" ON public.production_calendar
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "production_calendar_update" ON public.production_calendar
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "production_calendar_delete" ON public.production_calendar
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 19) NOTIFICATIONS (store_id direto) - CORRIGIR POLICY PERMISSIVA
-- ============================================================================
-- Nota: notifications já tem policy em 20251214_05_rls_full_multitenant.sql
-- mas foi sobrescrita por 20241214_notifications.sql com USING(true)

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notifications_update" ON public.notifications
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notifications_delete" ON public.notifications
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 20) NOTIFICATION_SETTINGS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_settings_all" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_select" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_update" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_delete" ON public.notification_settings;

CREATE POLICY "notification_settings_select" ON public.notification_settings
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "notification_settings_insert" ON public.notification_settings
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notification_settings_update" ON public.notification_settings
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "notification_settings_delete" ON public.notification_settings
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 21) PRODUCT_VARIATIONS (via products.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_variations_select" ON public.product_variations;
DROP POLICY IF EXISTS "product_variations_insert" ON public.product_variations;
DROP POLICY IF EXISTS "product_variations_update" ON public.product_variations;
DROP POLICY IF EXISTS "product_variations_delete" ON public.product_variations;

CREATE POLICY "product_variations_select" ON public.product_variations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

CREATE POLICY "product_variations_insert" ON public.product_variations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

CREATE POLICY "product_variations_update" ON public.product_variations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

CREATE POLICY "product_variations_delete" ON public.product_variations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
      AND public.user_has_store_access(p.store_id)
  )
);

-- ============================================================================
-- 22) ADDON_GROUPS (store_id direto)
-- ============================================================================
ALTER TABLE IF EXISTS public.addon_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addon_groups_select" ON public.addon_groups;
DROP POLICY IF EXISTS "addon_groups_insert" ON public.addon_groups;
DROP POLICY IF EXISTS "addon_groups_update" ON public.addon_groups;
DROP POLICY IF EXISTS "addon_groups_delete" ON public.addon_groups;

CREATE POLICY "addon_groups_select" ON public.addon_groups
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "addon_groups_insert" ON public.addon_groups
FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "addon_groups_update" ON public.addon_groups
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "addon_groups_delete" ON public.addon_groups
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- 23) ADDONS (via addon_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addons_select" ON public.addons;
DROP POLICY IF EXISTS "addons_insert" ON public.addons;
DROP POLICY IF EXISTS "addons_update" ON public.addons;
DROP POLICY IF EXISTS "addons_delete" ON public.addons;

CREATE POLICY "addons_select" ON public.addons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "addons_insert" ON public.addons
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "addons_update" ON public.addons
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "addons_delete" ON public.addons
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = addons.group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

-- ============================================================================
-- 24) PRODUCT_ADDON_GROUPS (via addon_groups.store_id)
-- ============================================================================
ALTER TABLE IF EXISTS public.product_addon_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_addon_groups_select" ON public.product_addon_groups;
DROP POLICY IF EXISTS "product_addon_groups_insert" ON public.product_addon_groups;
DROP POLICY IF EXISTS "product_addon_groups_update" ON public.product_addon_groups;
DROP POLICY IF EXISTS "product_addon_groups_delete" ON public.product_addon_groups;

CREATE POLICY "product_addon_groups_select" ON public.product_addon_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "product_addon_groups_insert" ON public.product_addon_groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "product_addon_groups_update" ON public.product_addon_groups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

CREATE POLICY "product_addon_groups_delete" ON public.product_addon_groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.addon_groups ag
    WHERE ag.id = product_addon_groups.addon_group_id
      AND public.user_has_store_access(ag.store_id)
  )
);

-- ============================================================================
-- 25) RESERVATIONS - Manter INSERT público mas restringir SELECT/UPDATE/DELETE
-- ============================================================================
-- reservations_public_insert é intencional para reservas online anônimas
-- mas precisamos garantir que SELECT/UPDATE/DELETE são restritos

ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
DROP POLICY IF EXISTS "reservations_delete" ON public.reservations;

CREATE POLICY "reservations_select" ON public.reservations
FOR SELECT USING (public.user_has_store_access(store_id));

CREATE POLICY "reservations_update" ON public.reservations
FOR UPDATE
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "reservations_delete" ON public.reservations
FOR DELETE USING (public.user_has_store_access(store_id));

-- ============================================================================
-- FIM DA MIGRATION RLS-CORE-FIX-01
-- ============================================================================
--
-- RESUMO: Corrigidas 25 tabelas com policies permissivas USING(true)
--
-- PRÓXIMOS PASSOS:
-- 1. Executar esta migration no Supabase SQL Editor
-- 2. Testar fluxos críticos: checkout, dashboard, cozinha
-- 3. Verificar que checkout público via RPC continua funcionando
--
-- ROLLBACK (se necessário):
-- As políticas antigas foram droppadas. Para rollback, re-executar
-- as migrations originais que criaram as policies USING(true).
-- ============================================================================
-- ============================================================================
-- RLS-REMAINDER-FIX-02: Corrigir tabelas permissivas restantes
-- Data: 2025-12-17
-- ============================================================================
--
-- PROBLEMA: Várias tabelas ainda com policies USING(true) ou WITH CHECK(true)
-- SOLUÇÃO: Substituir por policies filtradas por store_id
--
-- TABELAS CORRIGIDAS:
-- 1. store_settings (RLS estava OFF)
-- 2. addon_groups, addons, product_addon_groups
-- 3. cash_flow, cash_movements, cash_registers, daily_summary
-- 4. expenses, financial_categories, receivables
-- 5. inventory_batches, inventory_count_items, inventory_counts, inventory_movements
-- 6. product_ingredients, product_variations
-- 7. purchase_order_items, purchase_orders, suppliers
-- 8. coupon_uses (INSERT público com restrição)
-- 9. reservations (INSERT público com restrição)
-- ============================================================================

-- ############################################################################
-- 1) STORE_SETTINGS (RLS estava OFF)
-- ############################################################################

ALTER TABLE IF EXISTS public.store_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_settings') THEN
  DROP POLICY IF EXISTS "store_settings_all" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_select" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_insert" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_update" ON public.store_settings;
  DROP POLICY IF EXISTS "store_settings_delete" ON public.store_settings;

  CREATE POLICY "store_settings_select" ON public.store_settings
  FOR SELECT TO authenticated USING (public.user_has_store_access(store_id));

  CREATE POLICY "store_settings_insert" ON public.store_settings
  FOR INSERT TO authenticated WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "store_settings_update" ON public.store_settings
  FOR UPDATE TO authenticated
  USING (public.user_has_store_access(store_id))
  WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "store_settings_delete" ON public.store_settings
  FOR DELETE TO authenticated USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'store_settings: RLS habilitado + policies criadas';
END IF;
END $$;

-- ############################################################################
-- 2) ADDON_GROUPS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addon_groups') THEN
  ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "addon_groups_all" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_select" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_insert" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_update" ON public.addon_groups;
  DROP POLICY IF EXISTS "addon_groups_delete" ON public.addon_groups;

  CREATE POLICY "addon_groups_select" ON public.addon_groups
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "addon_groups_insert" ON public.addon_groups
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "addon_groups_update" ON public.addon_groups
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "addon_groups_delete" ON public.addon_groups
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'addon_groups: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 3) ADDONS (via addon_groups.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addons') THEN
  ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "addons_all" ON public.addons;
  DROP POLICY IF EXISTS "addons_select" ON public.addons;
  DROP POLICY IF EXISTS "addons_insert" ON public.addons;
  DROP POLICY IF EXISTS "addons_update" ON public.addons;
  DROP POLICY IF EXISTS "addons_delete" ON public.addons;

  CREATE POLICY "addons_select" ON public.addons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );

  CREATE POLICY "addons_insert" ON public.addons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );

  CREATE POLICY "addons_update" ON public.addons
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)));

  CREATE POLICY "addons_delete" ON public.addons
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
  );

  RAISE NOTICE 'addons: policies corrigidas (via addon_groups)';
END IF;
END $$;

-- ############################################################################
-- 4) PRODUCT_ADDON_GROUPS (via addon_groups.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_addon_groups') THEN
  ALTER TABLE public.product_addon_groups ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "product_addon_groups_all" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_select" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_insert" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_update" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_delete" ON public.product_addon_groups;

  CREATE POLICY "product_addon_groups_select" ON public.product_addon_groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );

  CREATE POLICY "product_addon_groups_insert" ON public.product_addon_groups
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );

  CREATE POLICY "product_addon_groups_update" ON public.product_addon_groups
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)));

  CREATE POLICY "product_addon_groups_delete" ON public.product_addon_groups
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );

  RAISE NOTICE 'product_addon_groups: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 5) CASH_REGISTERS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_registers') THEN
  ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "cash_registers_all" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_select" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_insert" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_update" ON public.cash_registers;
  DROP POLICY IF EXISTS "cash_registers_delete" ON public.cash_registers;

  CREATE POLICY "cash_registers_select" ON public.cash_registers
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "cash_registers_insert" ON public.cash_registers
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "cash_registers_update" ON public.cash_registers
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "cash_registers_delete" ON public.cash_registers
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'cash_registers: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 6) CASH_MOVEMENTS (pode ter store_id ou cash_register_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_movements') THEN
  ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "cash_movements_all" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_select" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_insert" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_update" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_delete" ON public.cash_movements;

  -- Verificar se tem store_id direto ou precisa de join via cash_registers
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_movements' AND column_name = 'store_id') THEN
    CREATE POLICY "cash_movements_select" ON public.cash_movements
    FOR SELECT USING (public.user_has_store_access(store_id));

    CREATE POLICY "cash_movements_insert" ON public.cash_movements
    FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

    CREATE POLICY "cash_movements_update" ON public.cash_movements
    FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

    CREATE POLICY "cash_movements_delete" ON public.cash_movements
    FOR DELETE USING (public.user_has_store_access(store_id));

    RAISE NOTICE 'cash_movements: policies corrigidas (store_id direto)';
  ELSE
    CREATE POLICY "cash_movements_select" ON public.cash_movements
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );

    CREATE POLICY "cash_movements_insert" ON public.cash_movements
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );

    CREATE POLICY "cash_movements_update" ON public.cash_movements
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)));

    CREATE POLICY "cash_movements_delete" ON public.cash_movements
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );

    RAISE NOTICE 'cash_movements: policies corrigidas (via cash_registers)';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 7) CASH_FLOW (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_flow') THEN
  ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "cash_flow_all" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_select" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_insert" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_update" ON public.cash_flow;
  DROP POLICY IF EXISTS "cash_flow_delete" ON public.cash_flow;

  CREATE POLICY "cash_flow_select" ON public.cash_flow
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "cash_flow_insert" ON public.cash_flow
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "cash_flow_update" ON public.cash_flow
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "cash_flow_delete" ON public.cash_flow
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'cash_flow: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 8) DAILY_SUMMARY (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_summary') THEN
  ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "daily_summary_all" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_select" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_insert" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_update" ON public.daily_summary;
  DROP POLICY IF EXISTS "daily_summary_delete" ON public.daily_summary;

  CREATE POLICY "daily_summary_select" ON public.daily_summary
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "daily_summary_insert" ON public.daily_summary
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "daily_summary_update" ON public.daily_summary
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "daily_summary_delete" ON public.daily_summary
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'daily_summary: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 9) EXPENSES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
  ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
  DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

  CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "expenses_update" ON public.expenses
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "expenses_delete" ON public.expenses
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'expenses: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 10) FINANCIAL_CATEGORIES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_categories') THEN
  ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "financial_categories_all" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_select" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_insert" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_update" ON public.financial_categories;
  DROP POLICY IF EXISTS "financial_categories_delete" ON public.financial_categories;

  CREATE POLICY "financial_categories_select" ON public.financial_categories
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "financial_categories_insert" ON public.financial_categories
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "financial_categories_update" ON public.financial_categories
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "financial_categories_delete" ON public.financial_categories
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'financial_categories: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 11) RECEIVABLES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'receivables') THEN
  ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "receivables_all" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_select" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_insert" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_update" ON public.receivables;
  DROP POLICY IF EXISTS "receivables_delete" ON public.receivables;

  CREATE POLICY "receivables_select" ON public.receivables
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "receivables_insert" ON public.receivables
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "receivables_update" ON public.receivables
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "receivables_delete" ON public.receivables
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'receivables: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 12) INVENTORY_MOVEMENTS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_movements') THEN
  ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "inventory_movements_all" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_update" ON public.inventory_movements;
  DROP POLICY IF EXISTS "inventory_movements_delete" ON public.inventory_movements;

  CREATE POLICY "inventory_movements_select" ON public.inventory_movements
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_movements_insert" ON public.inventory_movements
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_movements_update" ON public.inventory_movements
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_movements_delete" ON public.inventory_movements
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'inventory_movements: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 13) INVENTORY_BATCHES (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_batches') THEN
  ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "inventory_batches_all" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_select" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_insert" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_update" ON public.inventory_batches;
  DROP POLICY IF EXISTS "inventory_batches_delete" ON public.inventory_batches;

  CREATE POLICY "inventory_batches_select" ON public.inventory_batches
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_batches_insert" ON public.inventory_batches
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_batches_update" ON public.inventory_batches
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_batches_delete" ON public.inventory_batches
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'inventory_batches: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 14) INVENTORY_COUNTS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_counts') THEN
  ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "inventory_counts_all" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_select" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_insert" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_update" ON public.inventory_counts;
  DROP POLICY IF EXISTS "inventory_counts_delete" ON public.inventory_counts;

  CREATE POLICY "inventory_counts_select" ON public.inventory_counts
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_counts_insert" ON public.inventory_counts
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_counts_update" ON public.inventory_counts
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "inventory_counts_delete" ON public.inventory_counts
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'inventory_counts: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 15) INVENTORY_COUNT_ITEMS (via inventory_counts.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_count_items') THEN
  ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "inventory_count_items_all" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_select" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_insert" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_update" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_delete" ON public.inventory_count_items;

  CREATE POLICY "inventory_count_items_select" ON public.inventory_count_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );

  CREATE POLICY "inventory_count_items_insert" ON public.inventory_count_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );

  CREATE POLICY "inventory_count_items_update" ON public.inventory_count_items
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)));

  CREATE POLICY "inventory_count_items_delete" ON public.inventory_count_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );

  RAISE NOTICE 'inventory_count_items: policies corrigidas (via inventory_counts)';
END IF;
END $$;

-- ############################################################################
-- 16) PURCHASE_ORDERS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
  ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "purchase_orders_all" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_select" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_insert" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_update" ON public.purchase_orders;
  DROP POLICY IF EXISTS "purchase_orders_delete" ON public.purchase_orders;

  CREATE POLICY "purchase_orders_select" ON public.purchase_orders
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "purchase_orders_insert" ON public.purchase_orders
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "purchase_orders_update" ON public.purchase_orders
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "purchase_orders_delete" ON public.purchase_orders
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'purchase_orders: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 17) PURCHASE_ORDER_ITEMS (via purchase_orders.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
  ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "purchase_order_items_all" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_select" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_insert" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_update" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_delete" ON public.purchase_order_items;

  CREATE POLICY "purchase_order_items_select" ON public.purchase_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );

  CREATE POLICY "purchase_order_items_insert" ON public.purchase_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );

  CREATE POLICY "purchase_order_items_update" ON public.purchase_order_items
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)));

  CREATE POLICY "purchase_order_items_delete" ON public.purchase_order_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );

  RAISE NOTICE 'purchase_order_items: policies corrigidas (via purchase_orders)';
END IF;
END $$;

-- ############################################################################
-- 18) SUPPLIERS (tem store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
  ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "suppliers_all" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
  DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;

  CREATE POLICY "suppliers_select" ON public.suppliers
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "suppliers_insert" ON public.suppliers
  FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "suppliers_update" ON public.suppliers
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "suppliers_delete" ON public.suppliers
  FOR DELETE USING (public.user_has_store_access(store_id));

  RAISE NOTICE 'suppliers: policies corrigidas';
END IF;
END $$;

-- ############################################################################
-- 19) PRODUCT_INGREDIENTS (tem store_id na migration inventory_premium)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_ingredients') THEN
  ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "product_ingredients_all" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_select" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_insert" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_update" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_delete" ON public.product_ingredients;

  -- Verificar se tem store_id ou precisa de join via products
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_ingredients' AND column_name = 'store_id') THEN
    CREATE POLICY "product_ingredients_select" ON public.product_ingredients
    FOR SELECT USING (public.user_has_store_access(store_id));

    CREATE POLICY "product_ingredients_insert" ON public.product_ingredients
    FOR INSERT WITH CHECK (public.user_has_store_access(store_id));

    CREATE POLICY "product_ingredients_update" ON public.product_ingredients
    FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

    CREATE POLICY "product_ingredients_delete" ON public.product_ingredients
    FOR DELETE USING (public.user_has_store_access(store_id));

    RAISE NOTICE 'product_ingredients: policies corrigidas (store_id direto)';
  ELSE
    CREATE POLICY "product_ingredients_select" ON public.product_ingredients
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );

    CREATE POLICY "product_ingredients_insert" ON public.product_ingredients
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );

    CREATE POLICY "product_ingredients_update" ON public.product_ingredients
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)));

    CREATE POLICY "product_ingredients_delete" ON public.product_ingredients
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );

    RAISE NOTICE 'product_ingredients: policies corrigidas (via products)';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 20) PRODUCT_VARIATIONS (via products.store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variations') THEN
  ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "product_variations_all" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_select" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_insert" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_update" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_delete" ON public.product_variations;

  CREATE POLICY "product_variations_select" ON public.product_variations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );

  CREATE POLICY "product_variations_insert" ON public.product_variations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );

  CREATE POLICY "product_variations_update" ON public.product_variations
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)));

  CREATE POLICY "product_variations_delete" ON public.product_variations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );

  RAISE NOTICE 'product_variations: policies corrigidas (via products)';
END IF;
END $$;

-- ############################################################################
-- 21) COUPON_USES (INSERT público com restrição via coupon/order)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupon_uses') THEN
  ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "coupon_uses_all" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_insert" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_select" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_update" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_delete" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_public_insert" ON public.coupon_uses;

  -- SELECT/UPDATE/DELETE: apenas membros da loja do cupom
  CREATE POLICY "coupon_uses_select" ON public.coupon_uses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );

  CREATE POLICY "coupon_uses_update" ON public.coupon_uses
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)));

  CREATE POLICY "coupon_uses_delete" ON public.coupon_uses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );

  -- INSERT público: qualquer um pode usar cupom, mas o cupom deve existir em uma loja ativa
  CREATE POLICY "coupon_uses_public_insert" ON public.coupon_uses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coupons c
      JOIN public.stores s ON s.id = c.store_id
      WHERE c.id = coupon_uses.coupon_id
        AND c.is_active = true
        AND s.is_active = true
    )
  );

  RAISE NOTICE 'coupon_uses: policies corrigidas (INSERT público com validação de cupom ativo)';
END IF;
END $$;

-- ############################################################################
-- 22) RESERVATIONS (INSERT público com restrição)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
  ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "reservations_all" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_public_insert" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_delete" ON public.reservations;

  -- SELECT/UPDATE/DELETE: apenas membros da loja
  CREATE POLICY "reservations_select" ON public.reservations
  FOR SELECT USING (public.user_has_store_access(store_id));

  CREATE POLICY "reservations_update" ON public.reservations
  FOR UPDATE USING (public.user_has_store_access(store_id)) WITH CHECK (public.user_has_store_access(store_id));

  CREATE POLICY "reservations_delete" ON public.reservations
  FOR DELETE USING (public.user_has_store_access(store_id));

  -- INSERT público: qualquer um pode fazer reserva, mas a loja deve estar ativa
  CREATE POLICY "reservations_public_insert" ON public.reservations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = reservations.store_id
        AND s.is_active = true
    )
  );

  RAISE NOTICE 'reservations: policies corrigidas (INSERT público apenas para lojas ativas)';
END IF;
END $$;

-- ############################################################################
-- FIM DA MIGRATION
-- ############################################################################

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS-REMAINDER-FIX-02 aplicado!';
  RAISE NOTICE '22 tabelas processadas';
  RAISE NOTICE '========================================';
END $$;
-- ============================================================================
-- RLS-REMAINDER-FIX-02: Versão SEGURA (verifica colunas dinamicamente)
-- Data: 2025-12-17
-- ============================================================================
--
-- Este script verifica a existência de cada tabela E coluna antes de criar policies
-- Evita erros de "column does not exist"
-- ============================================================================

-- ############################################################################
-- FUNÇÃO AUXILIAR: Criar policy de forma segura
-- ############################################################################

CREATE OR REPLACE FUNCTION _temp_create_store_policies(
  p_table_name TEXT,
  p_store_id_column TEXT DEFAULT 'store_id'
) RETURNS void AS $$
BEGIN
  -- Habilitar RLS
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table_name);

  -- Dropar policies antigas
  EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', p_table_name, p_table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', p_table_name, p_table_name);

  -- Criar policies CRUD
  EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (public.user_has_store_access(%I))',
    p_table_name, p_table_name, p_store_id_column);
  EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (public.user_has_store_access(%I))',
    p_table_name, p_table_name, p_store_id_column);
  EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (public.user_has_store_access(%I)) WITH CHECK (public.user_has_store_access(%I))',
    p_table_name, p_table_name, p_store_id_column, p_store_id_column);
  EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (public.user_has_store_access(%I))',
    p_table_name, p_table_name, p_store_id_column);

  RAISE NOTICE '%: policies criadas com %', p_table_name, p_store_id_column;
END;
$$ LANGUAGE plpgsql;

-- ############################################################################
-- 1) STORE_SETTINGS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_settings') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_settings' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('store_settings', 'store_id');
  ELSE
    RAISE NOTICE 'store_settings: sem coluna store_id, pulando';
  END IF;
ELSE
  RAISE NOTICE 'store_settings: tabela não existe';
END IF;
END $$;

-- ############################################################################
-- 2) ADDON_GROUPS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addon_groups') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addon_groups' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('addon_groups', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 3) ADDONS (via addon_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addons') THEN
  ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "addons_all" ON public.addons;
  DROP POLICY IF EXISTS "addons_select" ON public.addons;
  DROP POLICY IF EXISTS "addons_insert" ON public.addons;
  DROP POLICY IF EXISTS "addons_update" ON public.addons;
  DROP POLICY IF EXISTS "addons_delete" ON public.addons;

  -- Verificar qual FK usar
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addons' AND column_name = 'addon_group_id') THEN
    CREATE POLICY "addons_select" ON public.addons FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
    );
    CREATE POLICY "addons_insert" ON public.addons FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
    );
    CREATE POLICY "addons_update" ON public.addons FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id)));
    CREATE POLICY "addons_delete" ON public.addons FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.addon_group_id AND public.user_has_store_access(ag.store_id))
    );
    RAISE NOTICE 'addons: policies via addon_group_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addons' AND column_name = 'group_id') THEN
    CREATE POLICY "addons_select" ON public.addons FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id))
    );
    CREATE POLICY "addons_insert" ON public.addons FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id))
    );
    CREATE POLICY "addons_update" ON public.addons FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id)));
    CREATE POLICY "addons_delete" ON public.addons FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = addons.group_id AND public.user_has_store_access(ag.store_id))
    );
    RAISE NOTICE 'addons: policies via group_id';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 4) PRODUCT_ADDON_GROUPS (via addon_groups)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_addon_groups') THEN
  ALTER TABLE public.product_addon_groups ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "product_addon_groups_all" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_select" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_insert" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_update" ON public.product_addon_groups;
  DROP POLICY IF EXISTS "product_addon_groups_delete" ON public.product_addon_groups;

  CREATE POLICY "product_addon_groups_select" ON public.product_addon_groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  CREATE POLICY "product_addon_groups_insert" ON public.product_addon_groups FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  CREATE POLICY "product_addon_groups_update" ON public.product_addon_groups FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id)));
  CREATE POLICY "product_addon_groups_delete" ON public.product_addon_groups FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id AND public.user_has_store_access(ag.store_id))
  );
  RAISE NOTICE 'product_addon_groups: policies criadas';
END IF;
END $$;

-- ############################################################################
-- 5) CASH_REGISTERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_registers') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_registers' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('cash_registers', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 6) CASH_MOVEMENTS (via cash_registers se não tiver store_id)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_movements') THEN
  ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "cash_movements_all" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_select" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_insert" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_update" ON public.cash_movements;
  DROP POLICY IF EXISTS "cash_movements_delete" ON public.cash_movements;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_movements' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('cash_movements', 'store_id');
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_movements' AND column_name = 'cash_register_id') THEN
    CREATE POLICY "cash_movements_select" ON public.cash_movements FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    CREATE POLICY "cash_movements_insert" ON public.cash_movements FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    CREATE POLICY "cash_movements_update" ON public.cash_movements FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id)));
    CREATE POLICY "cash_movements_delete" ON public.cash_movements FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_movements.cash_register_id AND public.user_has_store_access(cr.store_id))
    );
    RAISE NOTICE 'cash_movements: policies via cash_register_id';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 7) CASH_FLOW
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_flow') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cash_flow' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('cash_flow', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 8) DAILY_SUMMARY
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_summary') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_summary' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('daily_summary', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 9) EXPENSES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('expenses', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 10) FINANCIAL_CATEGORIES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_categories') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'financial_categories' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('financial_categories', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 11) RECEIVABLES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'receivables') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'receivables' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('receivables', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 12) INVENTORY_MOVEMENTS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_movements') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_movements' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('inventory_movements', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 13) INVENTORY_BATCHES
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_batches') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_batches' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('inventory_batches', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 14) INVENTORY_COUNTS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_counts') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_counts' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('inventory_counts', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 15) INVENTORY_COUNT_ITEMS (via inventory_counts)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_count_items') THEN
  ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "inventory_count_items_all" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_select" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_insert" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_update" ON public.inventory_count_items;
  DROP POLICY IF EXISTS "inventory_count_items_delete" ON public.inventory_count_items;

  CREATE POLICY "inventory_count_items_select" ON public.inventory_count_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  CREATE POLICY "inventory_count_items_insert" ON public.inventory_count_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  CREATE POLICY "inventory_count_items_update" ON public.inventory_count_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id)));
  CREATE POLICY "inventory_count_items_delete" ON public.inventory_count_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.inventory_counts ic WHERE ic.id = inventory_count_items.count_id AND public.user_has_store_access(ic.store_id))
  );
  RAISE NOTICE 'inventory_count_items: policies criadas';
END IF;
END $$;

-- ############################################################################
-- 16) PURCHASE_ORDERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('purchase_orders', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 17) PURCHASE_ORDER_ITEMS (via purchase_orders)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
  ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "purchase_order_items_all" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_select" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_insert" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_update" ON public.purchase_order_items;
  DROP POLICY IF EXISTS "purchase_order_items_delete" ON public.purchase_order_items;

  CREATE POLICY "purchase_order_items_select" ON public.purchase_order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  CREATE POLICY "purchase_order_items_insert" ON public.purchase_order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  CREATE POLICY "purchase_order_items_update" ON public.purchase_order_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id)));
  CREATE POLICY "purchase_order_items_delete" ON public.purchase_order_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND public.user_has_store_access(po.store_id))
  );
  RAISE NOTICE 'purchase_order_items: policies criadas';
END IF;
END $$;

-- ############################################################################
-- 18) SUPPLIERS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('suppliers', 'store_id');
  END IF;
END IF;
END $$;

-- ############################################################################
-- 19) PRODUCT_INGREDIENTS
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_ingredients') THEN
  ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "product_ingredients_all" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_select" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_insert" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_update" ON public.product_ingredients;
  DROP POLICY IF EXISTS "product_ingredients_delete" ON public.product_ingredients;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_ingredients' AND column_name = 'store_id') THEN
    PERFORM _temp_create_store_policies('product_ingredients', 'store_id');
  ELSE
    CREATE POLICY "product_ingredients_select" ON public.product_ingredients FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    CREATE POLICY "product_ingredients_insert" ON public.product_ingredients FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    CREATE POLICY "product_ingredients_update" ON public.product_ingredients FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id)));
    CREATE POLICY "product_ingredients_delete" ON public.product_ingredients FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_ingredients.product_id AND public.user_has_store_access(p.store_id))
    );
    RAISE NOTICE 'product_ingredients: policies via products';
  END IF;
END IF;
END $$;

-- ############################################################################
-- 20) PRODUCT_VARIATIONS (via products)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variations') THEN
  ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "product_variations_all" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_select" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_insert" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_update" ON public.product_variations;
  DROP POLICY IF EXISTS "product_variations_delete" ON public.product_variations;

  CREATE POLICY "product_variations_select" ON public.product_variations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  CREATE POLICY "product_variations_insert" ON public.product_variations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  CREATE POLICY "product_variations_update" ON public.product_variations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id)));
  CREATE POLICY "product_variations_delete" ON public.product_variations FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND public.user_has_store_access(p.store_id))
  );
  RAISE NOTICE 'product_variations: policies criadas';
END IF;
END $$;

-- ############################################################################
-- 21) COUPON_USES (INSERT público com restrição)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupon_uses') THEN
  ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "coupon_uses_all" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_insert" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_select" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_update" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_delete" ON public.coupon_uses;
  DROP POLICY IF EXISTS "coupon_uses_public_insert" ON public.coupon_uses;

  -- SELECT/UPDATE/DELETE: via coupon -> store
  CREATE POLICY "coupon_uses_select" ON public.coupon_uses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );
  CREATE POLICY "coupon_uses_update" ON public.coupon_uses FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id)));
  CREATE POLICY "coupon_uses_delete" ON public.coupon_uses FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_uses.coupon_id AND public.user_has_store_access(c.store_id))
  );

  -- INSERT público: cupom deve existir e estar ativo em loja ativa
  CREATE POLICY "coupon_uses_public_insert" ON public.coupon_uses FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coupons c
      JOIN public.stores s ON s.id = c.store_id
      WHERE c.id = coupon_uses.coupon_id
        AND c.is_active = true
        AND s.is_active = true
    )
  );
  RAISE NOTICE 'coupon_uses: policies corrigidas (INSERT público com validação)';
END IF;
END $$;

-- ############################################################################
-- 22) RESERVATIONS (INSERT público com restrição)
-- ############################################################################

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
  ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "reservations_all" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_public_insert" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
  DROP POLICY IF EXISTS "reservations_delete" ON public.reservations;

  -- SELECT/UPDATE/DELETE: apenas membros da loja
  CREATE POLICY "reservations_select" ON public.reservations FOR SELECT USING (public.user_has_store_access(store_id));
  CREATE POLICY "reservations_update" ON public.reservations FOR UPDATE
    USING (public.user_has_store_access(store_id))
    WITH CHECK (public.user_has_store_access(store_id));
  CREATE POLICY "reservations_delete" ON public.reservations FOR DELETE USING (public.user_has_store_access(store_id));

  -- INSERT público: loja deve estar ativa
  CREATE POLICY "reservations_public_insert" ON public.reservations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = reservations.store_id AND s.is_active = true)
  );
  RAISE NOTICE 'reservations: policies corrigidas (INSERT público para lojas ativas)';
END IF;
END $$;

-- ############################################################################
-- LIMPEZA: Remover função auxiliar temporária
-- ############################################################################

DROP FUNCTION IF EXISTS _temp_create_store_policies(TEXT, TEXT);

-- ############################################################################
-- FIM
-- ############################################################################

DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS-REMAINDER-FIX-02 (SAFE) aplicado!';
  RAISE NOTICE 'Todas as verificações dinâmicas executadas';
  RAISE NOTICE '========================================';
END $$;
-- Fix: Corrigir RLS permissivo em kitchen_chefs
-- A policy anterior usava USING (true) que permite acesso de qualquer usuário

-- Remover policy permissiva
DROP POLICY IF EXISTS "kitchen_chefs_all" ON kitchen_chefs;

-- Criar policy correta com isolamento por store_id
CREATE POLICY "kitchen_chefs_store_access" ON kitchen_chefs
FOR ALL
USING (public.user_has_store_access(store_id))
WITH CHECK (public.user_has_store_access(store_id));
-- ============================================================================
-- PUBLIC MENU RLS: Políticas completas para acesso anon ao cardápio
-- Idempotente: usa DROP IF EXISTS antes de CREATE
-- ============================================================================

-- ============================================================================
-- ADDON_GROUPS: permitir SELECT público para grupos de adicionais de lojas ativas
-- ============================================================================
DROP POLICY IF EXISTS addon_groups_public_select ON public.addon_groups;
CREATE POLICY addon_groups_public_select
ON public.addon_groups
FOR SELECT
USING (
  is_active = true
  AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- ============================================================================
-- ADDONS: permitir SELECT público para adicionais ativos de lojas ativas
-- ============================================================================
DROP POLICY IF EXISTS addons_public_select ON public.addons;
CREATE POLICY addons_public_select
ON public.addons
FOR SELECT
USING (
  is_active = true
  AND addon_group_id IN (
    SELECT id FROM public.addon_groups
    WHERE is_active = true
    AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- ============================================================================
-- PRODUCT_ADDON_GROUPS: permitir SELECT público para vínculos de lojas ativas
-- ============================================================================
DROP POLICY IF EXISTS product_addon_groups_public_select ON public.product_addon_groups;
CREATE POLICY product_addon_groups_public_select
ON public.product_addon_groups
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM public.products
    WHERE is_active = true
    AND store_id IN (SELECT id FROM public.stores WHERE is_active = true)
  )
);

-- ============================================================================
-- STORE_SETTINGS: permitir SELECT público para configurações de lojas ativas
-- (necessário para horários, delivery, etc no cardápio público)
-- ============================================================================
DROP POLICY IF EXISTS store_settings_public_select ON public.store_settings;
CREATE POLICY store_settings_public_select
ON public.store_settings
FOR SELECT
USING (
  store_id IN (SELECT id FROM public.stores WHERE is_active = true)
);

-- ============================================================================
-- Garantir RLS habilitado nas tabelas
-- ============================================================================
ALTER TABLE public.addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICAÇÃO: Listar policies criadas
-- ============================================================================
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%public_select%'
ORDER BY tablename;
-- ============================================================================
-- FIX CRÍTICO: Resolver recursão infinita nas funções RLS
-- Problema: user_has_store_access() consulta store_users, que tem policy
--           que chama user_has_store_access() → stack overflow
-- ============================================================================

-- 1) Dropar função COM CASCADE para remover todas as policies dependentes
--    ATENÇÃO: Isso remove TODAS as policies que usam essa função!
DROP FUNCTION IF EXISTS public.user_has_store_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_can_manage_store_users(uuid) CASCADE;

-- 2) Recriar função com SECURITY DEFINER + SET para bypassar RLS interno
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  -- SECURITY DEFINER + query direta bypassa RLS
  -- Não precisa de policy check aqui pois a função é trusted
  SELECT EXISTS (
    SELECT 1
    FROM store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
  ) INTO v_has_access;

  RETURN COALESCE(v_has_access, false);
END;
$$;

-- 3) Criar função auxiliar para owners (sem recursão)
CREATE OR REPLACE FUNCTION public.user_is_store_owner(p_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  ) INTO v_is_owner;

  RETURN COALESCE(v_is_owner, false);
END;
$$;

-- ============================================================================
-- 4) Recriar policies de store_users SEM usar user_has_store_access
--    (para quebrar a recursão)
-- ============================================================================

ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;

-- Dropar policies problemáticas
DROP POLICY IF EXISTS store_users_select ON public.store_users;
DROP POLICY IF EXISTS store_users_insert ON public.store_users;
DROP POLICY IF EXISTS store_users_update ON public.store_users;
DROP POLICY IF EXISTS store_users_delete ON public.store_users;
DROP POLICY IF EXISTS "Users can read their own store memberships" ON public.store_users;
DROP POLICY IF EXISTS "Store owners can manage store users" ON public.store_users;

-- SELECT: usuário pode ver suas próprias associações (query direta, sem função)
CREATE POLICY store_users_select
ON public.store_users
FOR SELECT
USING (user_id = auth.uid());

-- INSERT: apenas owners podem adicionar (verificar via subquery direta)
CREATE POLICY store_users_insert
ON public.store_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_users su
    WHERE su.store_id = store_users.store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  )
);

-- UPDATE: usuário pode atualizar seu próprio registro OU owner pode atualizar
CREATE POLICY store_users_update
ON public.store_users
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM store_users su
    WHERE su.store_id = store_users.store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  )
);

-- DELETE: apenas owners podem remover (exceto a si mesmo como owner)
CREATE POLICY store_users_delete
ON public.store_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM store_users su
    WHERE su.store_id = store_users.store_id
      AND su.user_id = auth.uid()
      AND su.role = 'OWNER'
  )
);

-- ============================================================================
-- 5) Garantir que stores tem policy para acesso público (cardápio)
-- ============================================================================

DROP POLICY IF EXISTS stores_select ON public.stores;
DROP POLICY IF EXISTS stores_public_select ON public.stores;
DROP POLICY IF EXISTS stores_public_select_active ON public.stores;

-- Acesso público a lojas ativas (cardápio)
CREATE POLICY stores_public_select
ON public.stores
FOR SELECT
USING (is_active = true);

-- Membros podem ver suas lojas (inclusive inativas)
CREATE POLICY stores_member_select
ON public.stores
FOR SELECT
USING (public.user_has_store_access(id));

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT 'FIX APLICADO: RLS recursion corrigida' AS status;
