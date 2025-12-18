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
