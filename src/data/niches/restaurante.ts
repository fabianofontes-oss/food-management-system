// Template: Restaurante
import { NicheTemplate, createModules } from './types'
import { SHARED_BEVERAGES, SHARED_BEERS, BEVERAGES_CATEGORY } from './shared-products'

export const RESTAURANTE_TEMPLATE: NicheTemplate = {
  id: 'restaurante',
  name: 'Restaurante',
  description: 'Restaurante completo com mesas e cardápio variado',
  icon: 'UtensilsCrossed',
  color: '#7C3AED',
  
  modules: createModules(['menu', 'orders', 'delivery', 'kitchen', 'tables', 'loyalty', 'reports', 'inventory', 'crm', 'mimo']),
  
  categories: [
    { name: 'Entradas', icon: '🥗', sort_order: 0 },
    { name: 'Pratos Principais', icon: '🍽️', sort_order: 1 },
    { name: 'Massas', icon: '🍝', sort_order: 2 },
    { name: 'Grelhados', icon: '🥩', sort_order: 3 },
    { name: 'Acompanhamentos', icon: '🍚', sort_order: 4 },
    { name: 'Sobremesas', icon: '🍮', sort_order: 5 },
    BEVERAGES_CATEGORY,
  ],
  
  products: [
    // Entradas
    { name: 'Salada Caesar', price: 28.00, cost: 10.00, category: 'Entradas', unit: 'un' },
    { name: 'Carpaccio', price: 42.00, cost: 18.00, category: 'Entradas', unit: 'un' },
    { name: 'Bruschetta', price: 24.00, cost: 9.00, category: 'Entradas', unit: 'un' },
    { name: 'Sopa do Dia', price: 18.00, cost: 6.00, category: 'Entradas', unit: 'un' },
    
    // Pratos Principais
    { name: 'Filé à Parmegiana', price: 58.00, cost: 24.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Frango Grelhado', price: 42.00, cost: 16.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 20 },
    { name: 'Peixe do Dia', price: 55.00, cost: 22.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 25 },
    { name: 'Risoto de Camarão', price: 65.00, cost: 28.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 30 },
    { name: 'Strogonoff', price: 48.00, cost: 18.00, category: 'Pratos Principais', unit: 'un', prep_time_minutes: 20 },
    
    // Massas
    { name: 'Espaguete à Bolonhesa', price: 38.00, cost: 14.00, category: 'Massas', unit: 'un', prep_time_minutes: 18 },
    { name: 'Fettuccine Alfredo', price: 42.00, cost: 16.00, category: 'Massas', unit: 'un', prep_time_minutes: 18 },
    { name: 'Lasanha', price: 45.00, cost: 18.00, category: 'Massas', unit: 'un', prep_time_minutes: 20 },
    { name: 'Nhoque ao Sugo', price: 36.00, cost: 13.00, category: 'Massas', unit: 'un', prep_time_minutes: 15 },
    
    // Grelhados
    { name: 'Picanha 400g', price: 85.00, cost: 40.00, category: 'Grelhados', unit: 'un', prep_time_minutes: 25 },
    { name: 'Filé Mignon 300g', price: 78.00, cost: 35.00, category: 'Grelhados', unit: 'un', prep_time_minutes: 22 },
    { name: 'Costela 500g', price: 65.00, cost: 28.00, category: 'Grelhados', unit: 'un', prep_time_minutes: 30 },
    
    // Acompanhamentos
    { name: 'Arroz Branco', price: 12.00, cost: 4.00, category: 'Acompanhamentos', unit: 'porção' },
    { name: 'Batata Frita', price: 18.00, cost: 6.00, category: 'Acompanhamentos', unit: 'porção' },
    { name: 'Legumes Grelhados', price: 16.00, cost: 5.00, category: 'Acompanhamentos', unit: 'porção' },
    { name: 'Purê de Batata', price: 14.00, cost: 4.50, category: 'Acompanhamentos', unit: 'porção' },
    
    // Sobremesas
    { name: 'Petit Gâteau', price: 24.00, cost: 9.00, category: 'Sobremesas', unit: 'un' },
    { name: 'Pudim', price: 14.00, cost: 4.00, category: 'Sobremesas', unit: 'un' },
    { name: 'Cheesecake', price: 18.00, cost: 6.00, category: 'Sobremesas', unit: 'fatia' },
    { name: 'Sorvete 2 Bolas', price: 16.00, cost: 5.00, category: 'Sobremesas', unit: 'un' },
    
    ...SHARED_BEVERAGES,
    ...SHARED_BEERS.slice(0, 4),
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
    loyalty_type: 'points',
  },
  
  suggested_kit_ids: ['beverages_sodas', 'beverages_beer'],
}
