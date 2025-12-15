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
