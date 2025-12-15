// Template: Dark Kitchen
import { NicheTemplate, createModules } from './types'
import { SHARED_BEVERAGES } from './shared-products'

export const DARK_KITCHEN_TEMPLATE: NicheTemplate = {
  id: 'dark_kitchen',
  name: 'Dark Kitchen',
  description: 'Cozinha virtual com múltiplas marcas',
  icon: 'ChefHat',
  color: '#1F2937',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'kitchen', 'reports', 'inventory', 'marketing']),
  
  categories: [
    { name: 'Pratos Principais', icon: '🍽️', sort_order: 0 },
    { name: 'Combos', icon: '📦', sort_order: 1 },
    { name: 'Acompanhamentos', icon: '🍟', sort_order: 2 },
    { name: 'Bebidas', icon: '🥤', sort_order: 3 },
  ],
  
  products: [
    // Pratos (genérico - dark kitchen customiza)
    { name: 'Prato Principal 1', price: 32.00, cost: 14.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 20 },
    { name: 'Prato Principal 2', price: 35.00, cost: 15.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 20 },
    { name: 'Prato Principal 3', price: 38.00, cost: 16.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 22 },
    
    // Combos
    { name: 'Combo 1 (Prato + Bebida)', price: 38.00, cost: 16.00, category: 'Combos', unit: 'un' },
    { name: 'Combo 2 (Prato + Acomp + Bebida)', price: 45.00, cost: 19.00, category: 'Combos', unit: 'un' },
    { name: 'Combo Família', price: 85.00, cost: 38.00, category: 'Combos', unit: 'un' },
    
    // Acompanhamentos
    { name: 'Acompanhamento 1', price: 12.00, cost: 4.00, category: 'Acompanhamentos', unit: 'un' },
    { name: 'Acompanhamento 2', price: 14.00, cost: 5.00, category: 'Acompanhamentos', unit: 'un' },
    
    ...SHARED_BEVERAGES.slice(0, 4),
  ],
  
  config: {
    has_delivery: true,
    has_pickup: false,
    has_table_service: false,
    has_counter_pickup: false,
    mimo_enabled: true,
    tab_system_enabled: false,
    rodizio_enabled: false,
    custom_orders_enabled: false,
    nutritional_info_enabled: false,
    weight_based_enabled: false,
    loyalty_type: 'points',
  },
  
  suggested_kit_ids: ['beverages_sodas'],
}
