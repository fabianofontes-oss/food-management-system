-- ================================================
-- SCRIPT PARA LIMPAR LOJAS FICTÍCIAS
-- Execute no Supabase SQL Editor
-- ================================================

-- 1. Ver todas as lojas antes de excluir
SELECT id, name, slug, created_at FROM stores ORDER BY created_at;

-- 2. Ver todos os tenants
SELECT id, name, created_at FROM tenants ORDER BY created_at;

-- ================================================
-- OPÇÃO A: EXCLUIR TUDO (começar do zero)
-- Descomente as linhas abaixo se quiser limpar tudo
-- ================================================

-- DELETE FROM stores;
-- DELETE FROM tenants;

-- ================================================
-- OPÇÃO B: EXCLUIR LOJAS ESPECÍFICAS POR SLUG
-- Substitua 'slug-da-loja' pelo slug real
-- ================================================

-- DELETE FROM stores WHERE slug = 'slug-da-loja';

-- ================================================
-- OPÇÃO C: EXCLUIR TODAS AS LOJAS DEMO/TESTE
-- Exclui lojas com nomes que contenham 'demo', 'teste', 'example', etc.
-- ================================================

-- DELETE FROM stores WHERE 
--   LOWER(name) LIKE '%demo%' OR 
--   LOWER(name) LIKE '%teste%' OR 
--   LOWER(name) LIKE '%test%' OR 
--   LOWER(name) LIKE '%example%' OR
--   LOWER(slug) LIKE '%demo%' OR 
--   LOWER(slug) LIKE '%teste%';

-- ================================================
-- DEPOIS DE EXCLUIR, VERIFIQUE:
-- ================================================

-- SELECT COUNT(*) as total_lojas FROM stores;
-- SELECT COUNT(*) as total_tenants FROM tenants;
