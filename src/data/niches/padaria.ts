// Template: Padaria
import { NicheTemplate, createModules } from './types'

export const PADARIA_TEMPLATE: NicheTemplate = {
  id: 'padaria',
  name: 'Padaria',
  description: 'Pães, frios, café da manhã e lanches',
  icon: 'Croissant',
  color: '#D97706',
  
  modules: createModules(['menu', 'orders', 'delivery', 'weight', 'loyalty', 'reports', 'inventory']),
  
  categories: [
    { name: 'Pães', icon: '🍞', sort_order: 0 },
    { name: 'Frios', icon: '🧀', sort_order: 1 },
    { name: 'Doces', icon: '🧁', sort_order: 2 },
    { name: 'Salgados', icon: '🥐', sort_order: 3 },
    { name: 'Café da Manhã', icon: '☕', sort_order: 4 },
    { name: 'Bebidas', icon: '🥤', sort_order: 5 },
  ],
  
  products: [
    // Pães
    { name: 'Pão Francês', price: 0.80, cost: 0.30, category: 'Pães', unit: 'un' },
    { name: 'Pão de Forma', price: 8.00, cost: 3.50, category: 'Pães', unit: 'un' },
    { name: 'Pão Integral', price: 12.00, cost: 5.00, category: 'Pães', unit: 'un' },
    { name: 'Pão de Queijo', price: 4.00, cost: 1.50, category: 'Pães', unit: 'un' },
    { name: 'Croissant', price: 6.00, cost: 2.50, category: 'Pães', unit: 'un' },
    { name: 'Bisnaguinha', price: 1.50, cost: 0.50, category: 'Pães', unit: 'un' },
    
    // Frios (por kg)
    { name: 'Presunto', price: 45.90, cost: 30.00, category: 'Frios', unit: 'kg' },
    { name: 'Queijo Mussarela', price: 55.90, cost: 38.00, category: 'Frios', unit: 'kg' },
    { name: 'Queijo Prato', price: 59.90, cost: 42.00, category: 'Frios', unit: 'kg' },
    { name: 'Mortadela', price: 25.90, cost: 16.00, category: 'Frios', unit: 'kg' },
    { name: 'Peito de Peru', price: 65.90, cost: 45.00, category: 'Frios', unit: 'kg' },
    
    // Doces
    { name: 'Sonho', price: 6.00, cost: 2.00, category: 'Doces', unit: 'un' },
    { name: 'Bomba de Chocolate', price: 7.00, cost: 2.50, category: 'Doces', unit: 'un' },
    { name: 'Carolina', price: 5.00, cost: 1.50, category: 'Doces', unit: 'un' },
    { name: 'Bolo (fatia)', price: 8.00, cost: 3.00, category: 'Doces', unit: 'fatia' },
    { name: 'Pão Doce', price: 4.00, cost: 1.50, category: 'Doces', unit: 'un' },
    
    // Salgados
    { name: 'Coxinha', price: 6.00, cost: 2.00, category: 'Salgados', unit: 'un' },
    { name: 'Empada', price: 6.00, cost: 2.00, category: 'Salgados', unit: 'un' },
    { name: 'Enroladinho', price: 5.00, cost: 1.50, category: 'Salgados', unit: 'un' },
    { name: 'Pastel de Forno', price: 6.00, cost: 2.00, category: 'Salgados', unit: 'un' },
    { name: 'Misto Quente', price: 10.00, cost: 4.00, category: 'Salgados', unit: 'un' },
    
    // Café da Manhã
    { name: 'Café Expresso', price: 5.00, cost: 1.50, category: 'Café da Manhã', unit: 'un' },
    { name: 'Café com Leite', price: 6.00, cost: 2.00, category: 'Café da Manhã', unit: 'un' },
    { name: 'Cappuccino', price: 8.00, cost: 3.00, category: 'Café da Manhã', unit: 'un' },
    { name: 'Vitamina', price: 10.00, cost: 4.00, category: 'Café da Manhã', unit: 'un' },
    
    // Bebidas
    { name: 'Suco Natural', price: 8.00, cost: 3.00, category: 'Bebidas', unit: 'un' },
    { name: 'Água Mineral', price: 3.50, cost: 1.50, category: 'Bebidas', unit: 'un' },
    { name: 'Refrigerante Lata', price: 5.50, cost: 3.00, category: 'Bebidas', unit: 'un' },
  ],
  
  config: {
    has_delivery: true,
    has_pickup: true,
    has_table_service: false,
    has_counter_pickup: true,
    mimo_enabled: false,
    tab_system_enabled: false,
    rodizio_enabled: false,
    custom_orders_enabled: false,
    nutritional_info_enabled: false,
    weight_based_enabled: true,
    loyalty_type: 'stamps',
  },
  
  suggested_kit_ids: ['coffee_drinks', 'beverages_sodas'],
}
