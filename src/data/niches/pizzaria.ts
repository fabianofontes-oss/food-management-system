// Template: Pizzaria
import { NicheTemplate, createModules } from './types'
import { SHARED_BEVERAGES_2L, SHARED_BEVERAGES, BEVERAGES_CATEGORY } from './shared-products'

export const PIZZARIA_TEMPLATE: NicheTemplate = {
  id: 'pizzaria',
  name: 'Pizzaria',
  description: 'Pizzas tradicionais e especiais, bordas recheadas',
  icon: 'Pizza',
  color: '#EA580C',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'kitchen', 'tables', 'loyalty', 'reports', 'mimo']),
  
  categories: [
    { name: 'Pizzas Tradicionais', icon: '🍕', sort_order: 0 },
    { name: 'Pizzas Especiais', icon: '⭐', sort_order: 1 },
    { name: 'Pizzas Doces', icon: '🍫', sort_order: 2 },
    { name: 'Bordas', icon: '🧀', sort_order: 3 },
    BEVERAGES_CATEGORY,
  ],
  
  products: [
    // Tradicionais
    { name: 'Mussarela', price: 45.00, cost: 18.00, category: 'Pizzas Tradicionais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Calabresa', price: 48.00, cost: 20.00, category: 'Pizzas Tradicionais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Portuguesa', price: 52.00, cost: 24.00, category: 'Pizzas Tradicionais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Margherita', price: 50.00, cost: 22.00, category: 'Pizzas Tradicionais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Frango c/ Catupiry', price: 52.00, cost: 24.00, category: 'Pizzas Tradicionais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Bacon', price: 52.00, cost: 24.00, category: 'Pizzas Tradicionais', unit: 'un', prep_time_minutes: 25 },
    
    // Especiais
    { name: '4 Queijos', price: 55.00, cost: 26.00, category: 'Pizzas Especiais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Pepperoni', price: 55.00, cost: 26.00, category: 'Pizzas Especiais', unit: 'un', prep_time_minutes: 25 },
    { name: 'À Moda da Casa', price: 58.00, cost: 28.00, category: 'Pizzas Especiais', unit: 'un', prep_time_minutes: 28 },
    
    // Doces
    { name: 'Chocolate', price: 45.00, cost: 18.00, category: 'Pizzas Doces', unit: 'un', prep_time_minutes: 20 },
    { name: 'Romeu e Julieta', price: 48.00, cost: 20.00, category: 'Pizzas Doces', unit: 'un', prep_time_minutes: 20 },
    { name: 'Banana c/ Canela', price: 45.00, cost: 18.00, category: 'Pizzas Doces', unit: 'un', prep_time_minutes: 20 },
    
    // Bordas
    { name: 'Borda Catupiry', price: 8.00, cost: 3.00, category: 'Bordas', unit: 'un' },
    { name: 'Borda Cheddar', price: 8.00, cost: 3.00, category: 'Bordas', unit: 'un' },
    { name: 'Borda Chocolate', price: 10.00, cost: 4.00, category: 'Bordas', unit: 'un' },
    
    ...SHARED_BEVERAGES_2L,
    ...SHARED_BEVERAGES.slice(0, 4),
  ],
  
  config: {
    has_delivery: true,
    has_pickup: true,
    has_table_service: true,
    has_counter_pickup: false,
    mimo_enabled: true,
    tab_system_enabled: false,
    rodizio_enabled: false,
    custom_orders_enabled: false,
    nutritional_info_enabled: false,
    weight_based_enabled: false,
    loyalty_type: 'stamps',
  },
  
  suggested_kit_ids: ['pizza_flavors', 'beverages_sodas'],
}
