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
