-- Script para adicionar modificadores (complementos) aos produtos
-- Execute este script no SQL Editor do Supabase

-- IDs necessários (substitua pelos IDs reais do seu banco)
-- Store ID: 00000000-0000-0000-0000-000000000002
-- Product IDs: busque os IDs dos produtos de Açaí

-- 1. Criar Grupos de Modificadores
INSERT INTO modifier_groups (store_id, name, min_options, max_options, is_required)
VALUES
  -- Grupo: Tamanho da Fruta
  ('00000000-0000-0000-0000-000000000002', 'Tamanho da Fruta', 0, 1, false),
  
  -- Grupo: Complementos
  ('00000000-0000-0000-0000-000000000002', 'Complementos', 0, 10, false),
  
  -- Grupo: Coberturas
  ('00000000-0000-0000-0000-000000000002', 'Coberturas', 0, 3, false),
  
  -- Grupo: Frutas
  ('00000000-0000-0000-0000-000000000002', 'Frutas', 0, 5, false);

-- 2. Buscar IDs dos grupos criados
-- Você precisará substituir os IDs abaixo pelos IDs reais retornados
-- SELECT id, name FROM modifier_groups WHERE store_id = '00000000-0000-0000-0000-000000000002';

-- Exemplo de IDs (SUBSTITUA pelos seus):
-- Tamanho da Fruta: 'GRUPO_ID_1'
-- Complementos: 'GRUPO_ID_2'
-- Coberturas: 'GRUPO_ID_3'
-- Frutas: 'GRUPO_ID_4'

-- 3. Criar Opções de Modificadores

-- Tamanho da Fruta
INSERT INTO modifier_options (group_id, name, price_adjustment)
VALUES
  ('GRUPO_ID_1', 'Fruta Picada', 0.00),
  ('GRUPO_ID_1', 'Fruta em Pedaços', 1.00);

-- Complementos
INSERT INTO modifier_options (group_id, name, price_adjustment)
VALUES
  ('GRUPO_ID_2', 'Granola', 2.00),
  ('GRUPO_ID_2', 'Leite em Pó', 1.50),
  ('GRUPO_ID_2', 'Leite Condensado', 2.00),
  ('GRUPO_ID_2', 'Paçoca', 2.50),
  ('GRUPO_ID_2', 'Amendoim', 2.00),
  ('GRUPO_ID_2', 'Castanha', 3.00),
  ('GRUPO_ID_2', 'Coco Ralado', 1.50),
  ('GRUPO_ID_2', 'Aveia', 1.50);

-- Coberturas
INSERT INTO modifier_options (group_id, name, price_adjustment)
VALUES
  ('GRUPO_ID_3', 'Mel', 2.00),
  ('GRUPO_ID_3', 'Chocolate', 3.00),
  ('GRUPO_ID_3', 'Nutella', 5.00),
  ('GRUPO_ID_3', 'Doce de Leite', 3.00),
  ('GRUPO_ID_3', 'Calda de Morango', 2.50);

-- Frutas
INSERT INTO modifier_options (group_id, name, price_adjustment)
VALUES
  ('GRUPO_ID_4', 'Banana', 1.50),
  ('GRUPO_ID_4', 'Morango', 2.50),
  ('GRUPO_ID_4', 'Kiwi', 3.00),
  ('GRUPO_ID_4', 'Manga', 2.00),
  ('GRUPO_ID_4', 'Uva', 2.50),
  ('GRUPO_ID_4', 'Abacaxi', 1.50);

-- 4. Vincular Grupos de Modificadores aos Produtos
-- Busque os IDs dos produtos de Açaí
-- SELECT id, name FROM products WHERE store_id = '00000000-0000-0000-0000-000000000002' AND name LIKE '%Açaí%';

-- Vincular todos os grupos aos produtos de Açaí
-- Substitua PRODUCT_ID_1, PRODUCT_ID_2, etc. pelos IDs reais

INSERT INTO product_modifier_groups (product_id, group_id, display_order)
VALUES
  -- Açaí 300ml
  ('PRODUCT_ID_1', 'GRUPO_ID_1', 1),
  ('PRODUCT_ID_1', 'GRUPO_ID_2', 2),
  ('PRODUCT_ID_1', 'GRUPO_ID_3', 3),
  ('PRODUCT_ID_1', 'GRUPO_ID_4', 4),
  
  -- Açaí 500ml
  ('PRODUCT_ID_2', 'GRUPO_ID_1', 1),
  ('PRODUCT_ID_2', 'GRUPO_ID_2', 2),
  ('PRODUCT_ID_2', 'GRUPO_ID_3', 3),
  ('PRODUCT_ID_2', 'GRUPO_ID_4', 4),
  
  -- Açaí 700ml
  ('PRODUCT_ID_3', 'GRUPO_ID_1', 1),
  ('PRODUCT_ID_3', 'GRUPO_ID_2', 2),
  ('PRODUCT_ID_3', 'GRUPO_ID_3', 3),
  ('PRODUCT_ID_3', 'GRUPO_ID_4', 4);

-- 5. Verificar os modificadores criados
SELECT 
  mg.name as grupo,
  mo.name as opcao,
  mo.price_adjustment as preco_adicional
FROM modifier_groups mg
JOIN modifier_options mo ON mo.group_id = mg.id
WHERE mg.store_id = '00000000-0000-0000-0000-000000000002'
ORDER BY mg.name, mo.name;

-- 6. Verificar vinculação com produtos
SELECT 
  p.name as produto,
  mg.name as grupo_modificador,
  pmg.display_order as ordem
FROM products p
JOIN product_modifier_groups pmg ON pmg.product_id = p.id
JOIN modifier_groups mg ON mg.id = pmg.group_id
WHERE p.store_id = '00000000-0000-0000-0000-000000000002'
ORDER BY p.name, pmg.display_order;
