// Template: Hamburgueria
import { NicheTemplate, createModules } from './types'
import { SHARED_BEVERAGES, BEVERAGES_CATEGORY } from './shared-products'

export const HAMBURGUERIA_TEMPLATE: NicheTemplate = {
  id: 'hamburgueria',
  name: 'Hamburgueria',
  description: 'Hambúrgueres artesanais, batatas e combos',
  icon: 'Beef',
  color: '#DC2626',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'kitchen', 'tables', 'loyalty', 'reports', 'inventory', 'mimo']),
  
  categories: [
    { name: 'Hambúrgueres', icon: '🍔', sort_order: 0 },
    { name: 'Combos', icon: '🍟', sort_order: 1 },
    { name: 'Acompanhamentos', icon: '🥔', sort_order: 2 },
    { name: 'Adicionais', icon: '🧀', sort_order: 3 },
    { name: 'Sobremesas', icon: '🍰', sort_order: 4 },
    BEVERAGES_CATEGORY,
  ],
  
  products: [
    // Hambúrgueres
    { name: 'X-Burguer', price: 22.00, cost: 10.00, category: 'Hambúrgueres', unit: 'un', prep_time_minutes: 15, description: 'Pão, blend 150g, queijo, salada, maionese' },
    { name: 'X-Bacon', price: 28.00, cost: 13.00, category: 'Hambúrgueres', unit: 'un', prep_time_minutes: 15 },
    { name: 'X-Tudo', price: 35.00, cost: 16.00, category: 'Hambúrgueres', unit: 'un', prep_time_minutes: 18 },
    { name: 'X-Salada', price: 20.00, cost: 9.00, category: 'Hambúrgueres', unit: 'un', prep_time_minutes: 12 },
    { name: 'Duplo Cheddar', price: 38.00, cost: 18.00, category: 'Hambúrgueres', unit: 'un', prep_time_minutes: 18 },
    { name: 'Smash Burger', price: 25.00, cost: 11.00, category: 'Hambúrgueres', unit: 'un', prep_time_minutes: 10 },
    { name: 'Vegetariano', price: 26.00, cost: 12.00, category: 'Hambúrgueres', unit: 'un', prep_time_minutes: 15 },
    
    // Combos
    { name: 'Combo X-Burguer', price: 32.00, cost: 14.00, category: 'Combos', unit: 'un', description: 'Lanche + Batata P + Refri' },
    { name: 'Combo X-Bacon', price: 38.00, cost: 17.00, category: 'Combos', unit: 'un' },
    { name: 'Combo Duplo', price: 48.00, cost: 22.00, category: 'Combos', unit: 'un' },
    
    // Acompanhamentos
    { name: 'Batata Frita P', price: 12.00, cost: 4.00, category: 'Acompanhamentos', unit: 'un' },
    { name: 'Batata Frita M', price: 16.00, cost: 6.00, category: 'Acompanhamentos', unit: 'un' },
    { name: 'Batata Frita G', price: 22.00, cost: 8.00, category: 'Acompanhamentos', unit: 'un' },
    { name: 'Onion Rings', price: 18.00, cost: 7.00, category: 'Acompanhamentos', unit: 'un' },
    { name: 'Nuggets 6un', price: 15.00, cost: 6.00, category: 'Acompanhamentos', unit: 'un' },
    
    // Adicionais
    { name: 'Bacon Extra', price: 5.00, cost: 2.50, category: 'Adicionais', unit: 'porção' },
    { name: 'Queijo Cheddar', price: 4.00, cost: 2.00, category: 'Adicionais', unit: 'fatia' },
    { name: 'Ovo', price: 3.00, cost: 1.00, category: 'Adicionais', unit: 'un' },
    { name: 'Cebola Caramelizada', price: 4.00, cost: 2.00, category: 'Adicionais', unit: 'porção' },
    { name: 'Blend Extra', price: 10.00, cost: 5.00, category: 'Adicionais', unit: 'un' },
    
    // Sobremesas
    { name: 'Brownie', price: 10.00, cost: 4.00, category: 'Sobremesas', unit: 'un' },
    { name: 'Brownie com Sorvete', price: 16.00, cost: 7.00, category: 'Sobremesas', unit: 'un' },
    
    ...SHARED_BEVERAGES,
  ],
  
  config: {
    has_delivery: true,
    has_pickup: true,
    has_table_service: true,
    has_counter_pickup: true,
    mimo_enabled: true,
    tab_system_enabled: false,
    rodizio_enabled: false,
    custom_orders_enabled: false,
    nutritional_info_enabled: false,
    weight_based_enabled: false,
    loyalty_type: 'points',
  },
  
  suggested_kit_ids: ['burger_proteins', 'burger_toppings', 'beverages_sodas'],
}
