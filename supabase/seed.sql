-- ============================================================================
-- DADOS DE EXEMPLO (SEED)
-- ============================================================================

-- Tenant de exemplo
INSERT INTO tenants (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Rede FoodTech Brasil');

-- Lojas de exemplo (diferentes nichos)
INSERT INTO stores (id, tenant_id, name, slug, niche, mode, phone, whatsapp, address, settings) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Açaí da Praia',
    'acai-da-praia',
    'acai',
    'store',
    '11987654321',
    '11987654321',
    'Av. Atlântica, 1000 - Copacabana, Rio de Janeiro - RJ',
    '{"opening_hours": {"mon": "10:00-22:00", "tue": "10:00-22:00", "wed": "10:00-22:00", "thu": "10:00-22:00", "fri": "10:00-23:00", "sat": "10:00-23:00", "sun": "10:00-22:00"}, "delivery": {"enabled": true, "min_order": 15.00, "radius_km": 5, "fee": 5.00}}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Burger House',
    'burger-house',
    'burger',
    'store',
    '11976543210',
    '11976543210',
    'Rua Augusta, 500 - Consolação, São Paulo - SP',
    '{"opening_hours": {"mon": "18:00-23:00", "tue": "18:00-23:00", "wed": "18:00-23:00", "thu": "18:00-23:00", "fri": "18:00-01:00", "sat": "18:00-01:00", "sun": "18:00-23:00"}, "delivery": {"enabled": true, "min_order": 25.00, "radius_km": 3, "fee": 8.00}}'::jsonb
  );

-- Categorias de exemplo para Açaí da Praia
INSERT INTO categories (id, store_id, name, description, sort_order) VALUES
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Açaí', 'Açaí puro e cremoso', 1),
  ('c1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Bebidas', 'Sucos e vitaminas', 2);

-- Categorias de exemplo para Burger House
INSERT INTO categories (id, store_id, name, description, sort_order) VALUES
  ('c2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Burgers', 'Hambúrgueres artesanais', 1),
  ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Acompanhamentos', 'Batatas e onion rings', 2),
  ('c2222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'Bebidas', 'Refrigerantes e sucos', 3);

-- Produtos de exemplo - Açaí da Praia
INSERT INTO products (id, store_id, category_id, name, description, base_price, unit_type) VALUES
  ('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Açaí 300ml', 'Açaí puro batido na hora', 12.00, 'unit'),
  ('p1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Açaí 500ml', 'Açaí puro batido na hora', 18.00, 'unit'),
  ('p1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111112', 'Suco Natural', 'Suco de frutas naturais', 8.00, 'unit');

-- Produtos de exemplo - Burger House
INSERT INTO products (id, store_id, category_id, name, description, base_price, unit_type) VALUES
  ('p2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222221', 'Classic Burger', 'Hambúrguer 180g, queijo, alface, tomate', 25.00, 'unit'),
  ('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222221', 'Bacon Burger', 'Hambúrguer 180g, bacon, queijo cheddar', 30.00, 'unit'),
  ('p2222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Batata Frita', 'Batata frita crocante', 12.00, 'unit');

-- Grupos de modificadores - Açaí
INSERT INTO modifier_groups (id, store_id, name, min_quantity, max_quantity, required) VALUES
  ('m1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Frutas', 0, 5, false),
  ('m1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Complementos', 0, 5, false),
  ('m1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Caldas', 0, 2, false);

-- Opções de modificadores - Açaí
INSERT INTO modifier_options (group_id, name, extra_price, sort_order) VALUES
  ('m1111111-1111-1111-1111-111111111111', 'Banana', 2.00, 1),
  ('m1111111-1111-1111-1111-111111111111', 'Morango', 3.00, 2),
  ('m1111111-1111-1111-1111-111111111111', 'Kiwi', 3.50, 3),
  ('m1111111-1111-1111-1111-111111111112', 'Granola', 2.00, 1),
  ('m1111111-1111-1111-1111-111111111112', 'Leite em Pó', 1.50, 2),
  ('m1111111-1111-1111-1111-111111111112', 'Paçoca', 2.50, 3),
  ('m1111111-1111-1111-1111-111111111113', 'Mel', 2.00, 1),
  ('m1111111-1111-1111-1111-111111111113', 'Chocolate', 2.50, 2),
  ('m1111111-1111-1111-1111-111111111113', 'Leite Condensado', 2.00, 3);

-- Associar modificadores aos produtos de açaí
INSERT INTO product_modifier_groups (product_id, group_id) VALUES
  ('p1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111'),
  ('p1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111112'),
  ('p1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111113'),
  ('p1111111-1111-1111-1111-111111111112', 'm1111111-1111-1111-1111-111111111111'),
  ('p1111111-1111-1111-1111-111111111112', 'm1111111-1111-1111-1111-111111111112'),
  ('p1111111-1111-1111-1111-111111111112', 'm1111111-1111-1111-1111-111111111113');

-- Grupos de modificadores - Burger
INSERT INTO modifier_groups (id, store_id, name, min_quantity, max_quantity, required) VALUES
  ('m2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Ponto da Carne', 1, 1, true),
  ('m2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Adicionais', 0, 5, false);

-- Opções de modificadores - Burger
INSERT INTO modifier_options (group_id, name, extra_price, sort_order) VALUES
  ('m2222222-2222-2222-2222-222222222221', 'Mal Passado', 0.00, 1),
  ('m2222222-2222-2222-2222-222222222221', 'Ao Ponto', 0.00, 2),
  ('m2222222-2222-2222-2222-222222222221', 'Bem Passado', 0.00, 3),
  ('m2222222-2222-2222-2222-222222222222', 'Queijo Extra', 3.00, 1),
  ('m2222222-2222-2222-2222-222222222222', 'Bacon Extra', 5.00, 2),
  ('m2222222-2222-2222-2222-222222222222', 'Ovo', 3.00, 3),
  ('m2222222-2222-2222-2222-222222222222', 'Cebola Caramelizada', 2.00, 4);

-- Associar modificadores aos burgers
INSERT INTO product_modifier_groups (product_id, group_id) VALUES
  ('p2222222-2222-2222-2222-222222222221', 'm2222222-2222-2222-2222-222222222221'),
  ('p2222222-2222-2222-2222-222222222221', 'm2222222-2222-2222-2222-222222222222'),
  ('p2222222-2222-2222-2222-222222222222', 'm2222222-2222-2222-2222-222222222221'),
  ('p2222222-2222-2222-2222-222222222222', 'm2222222-2222-2222-2222-222222222222');

-- Mesas de exemplo
INSERT INTO tables (store_id, number, capacity) VALUES
  ('11111111-1111-1111-1111-111111111111', '1', 4),
  ('11111111-1111-1111-1111-111111111111', '2', 4),
  ('11111111-1111-1111-1111-111111111111', '3', 2),
  ('22222222-2222-2222-2222-222222222222', 'A1', 4),
  ('22222222-2222-2222-2222-222222222222', 'A2', 6),
  ('22222222-2222-2222-2222-222222222222', 'B1', 2);

-- Cupom de exemplo
INSERT INTO coupons (store_id, code, description, discount_type, discount_value, min_order_amount, valid_until) VALUES
  ('11111111-1111-1111-1111-111111111111', 'PRIMEIRACOMPRA', 'Desconto de 10% na primeira compra', 'percentage', 10.00, 20.00, '2025-12-31 23:59:59'),
  ('22222222-2222-2222-2222-222222222222', 'BURGER20', 'R$ 20 de desconto', 'fixed_amount', 20.00, 50.00, '2025-12-31 23:59:59');
