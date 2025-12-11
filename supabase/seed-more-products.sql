-- Script para adicionar mais produtos de exemplo ao banco de dados
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos buscar os IDs das categorias existentes
-- Você precisa substituir os IDs abaixo pelos IDs reais das suas categorias

-- Supondo que você já tem as categorias:
-- Açaí: 24c2c435-a158-4b9d-b132-d7b5c0ffac20
-- Adicionais: (ID da categoria Adicionais)
-- Bebidas: a5592c88-70f1-402c-8cbf-6d385919a640

-- Adicionar mais produtos de Açaí
INSERT INTO products (store_id, category_id, name, description, base_price, unit_type, is_active)
VALUES
  -- Açaí Especiais
  ('00000000-0000-0000-0000-000000000002', '24c2c435-a158-4b9d-b132-d7b5c0ffac20', 'Açaí 1L', 'Açaí tradicional batido - tamanho família', 35.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', '24c2c435-a158-4b9d-b132-d7b5c0ffac20', 'Açaí Premium 300ml', 'Açaí premium com frutas', 15.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', '24c2c435-a158-4b9d-b132-d7b5c0ffac20', 'Açaí Premium 500ml', 'Açaí premium com frutas', 22.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', '24c2c435-a158-4b9d-b132-d7b5c0ffac20', 'Açaí com Nutella 300ml', 'Açaí com Nutella e morango', 18.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', '24c2c435-a158-4b9d-b132-d7b5c0ffac20', 'Açaí com Nutella 500ml', 'Açaí com Nutella e morango', 26.00, 'unit', true),
  
  -- Bebidas variadas
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Suco de Laranja 300ml', 'Suco natural de laranja', 8.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Suco de Laranja 500ml', 'Suco natural de laranja', 12.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Suco de Morango 300ml', 'Suco natural de morango', 9.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Suco de Morango 500ml', 'Suco natural de morango', 13.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Suco de Abacaxi 300ml', 'Suco natural de abacaxi', 8.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Suco de Abacaxi 500ml', 'Suco natural de abacaxi', 12.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Refrigerante Lata', 'Refrigerante 350ml', 5.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Refrigerante 2L', 'Refrigerante 2 litros', 10.00, 'unit', true),
  ('00000000-0000-0000-0000-000000000002', 'a5592c88-70f1-402c-8cbf-6d385919a640', 'Água com Gás', 'Água com gás 500ml', 4.00, 'unit', true);

-- Verificar produtos inseridos
SELECT 
  p.id,
  p.name,
  p.base_price,
  c.name as category_name
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.store_id = '00000000-0000-0000-0000-000000000002'
ORDER BY c.name, p.base_price;
