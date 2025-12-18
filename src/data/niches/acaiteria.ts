// Template: Açaíteria / Sorveteria
import { NicheTemplate, createModules } from './types'
import { SHARED_BEVERAGES, BEVERAGES_CATEGORY } from './shared-products'

export const ACAITERIA_TEMPLATE: NicheTemplate = {
  id: 'acaiteria',
  name: 'Açaíteria / Sorveteria',
  description: 'Açaí, sorvetes, milkshakes e sobremesas geladas',
  icon: 'IceCream',
  color: '#7C3AED',
  
  modules: createModules(['menu', 'orders', 'delivery', 'kitchen', 'loyalty', 'reports', 'crm', 'mimo', 'marketing']),
  
  categories: [
    { name: 'Açaí', icon: '🍇', sort_order: 0 },
    { name: 'Adicionais', icon: '🍓', sort_order: 1 },
    { name: 'Sorvetes', icon: '🍦', sort_order: 2 },
    { name: 'Milkshakes', icon: '🥤', sort_order: 3 },
    { name: 'Picolés', icon: '🧊', sort_order: 4 },
    BEVERAGES_CATEGORY,
  ],
  
  products: [
    // Açaí
    { name: 'Açaí 300ml', price: 15.00, cost: 6.00, category: 'Açaí', unit: 'un', has_addons: true, is_customizable: true },
    { name: 'Açaí 500ml', price: 22.00, cost: 9.00, category: 'Açaí', unit: 'un', has_addons: true, is_customizable: true },
    { name: 'Açaí 700ml', price: 28.00, cost: 12.00, category: 'Açaí', unit: 'un', has_addons: true, is_customizable: true },
    { name: 'Açaí Premium 300ml', price: 20.00, cost: 8.00, category: 'Açaí', unit: 'un', has_addons: true, description: '3 adicionais inclusos' },
    { name: 'Açaí Premium 500ml', price: 28.00, cost: 12.00, category: 'Açaí', unit: 'un', has_addons: true },
    
    // Adicionais
    { name: 'Leite Ninho', price: 3.00, cost: 1.50, category: 'Adicionais', unit: 'porção' },
    { name: 'Granola', price: 2.00, cost: 0.80, category: 'Adicionais', unit: 'porção' },
    { name: 'Paçoca', price: 2.50, cost: 1.00, category: 'Adicionais', unit: 'porção' },
    { name: 'Banana', price: 2.00, cost: 0.70, category: 'Adicionais', unit: 'porção' },
    { name: 'Morango', price: 3.00, cost: 1.50, category: 'Adicionais', unit: 'porção' },
    { name: 'Nutella', price: 5.00, cost: 3.00, category: 'Adicionais', unit: 'porção' },
    { name: 'Leite Condensado', price: 2.50, cost: 1.00, category: 'Adicionais', unit: 'porção' },
    { name: 'Ovomaltine', price: 3.50, cost: 2.00, category: 'Adicionais', unit: 'porção' },
    { name: 'Mel', price: 2.50, cost: 1.20, category: 'Adicionais', unit: 'porção' },
    { name: 'Amendoim', price: 2.00, cost: 0.80, category: 'Adicionais', unit: 'porção' },
    { name: 'Confete', price: 2.50, cost: 1.00, category: 'Adicionais', unit: 'porção' },
    { name: 'Calda Chocolate', price: 2.50, cost: 1.00, category: 'Adicionais', unit: 'porção' },
    { name: 'Calda Morango', price: 2.50, cost: 1.00, category: 'Adicionais', unit: 'porção' },
    
    // Sorvetes
    { name: 'Sorvete 1 Bola', price: 8.00, cost: 3.00, category: 'Sorvetes', unit: 'un', is_customizable: true },
    { name: 'Sorvete 2 Bolas', price: 14.00, cost: 5.00, category: 'Sorvetes', unit: 'un', is_customizable: true },
    { name: 'Sundae', price: 16.00, cost: 6.00, category: 'Sorvetes', unit: 'un' },
    
    // Milkshakes
    { name: 'Milkshake 400ml', price: 16.00, cost: 6.00, category: 'Milkshakes', unit: 'un', is_customizable: true },
    { name: 'Milkshake 500ml', price: 20.00, cost: 8.00, category: 'Milkshakes', unit: 'un', is_customizable: true },
    
    // Bebidas compartilhadas
    ...SHARED_BEVERAGES,
  ],
  
  config: {
    has_delivery: true,
    has_pickup: true,
    has_table_service: false,
    has_counter_pickup: true,
    mimo_enabled: true,
    tab_system_enabled: false,
    rodizio_enabled: false,
    custom_orders_enabled: false,
    nutritional_info_enabled: false,
    weight_based_enabled: false,
    loyalty_type: 'stamps',
  },
  
  suggested_kit_ids: ['acai_toppings', 'icecream_flavors', 'beverages_sodas'],
}
