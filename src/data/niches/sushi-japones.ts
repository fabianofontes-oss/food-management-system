// Template: Sushi / Japonês
import { NicheTemplate, createModules } from './types'
import { SHARED_BEVERAGES } from './shared-products'

export const SUSHI_JAPONES_TEMPLATE: NicheTemplate = {
  id: 'sushi_japones',
  name: 'Sushi / Japonês',
  description: 'Sushis, sashimis, temakis e rodízio',
  icon: 'Fish',
  color: '#0891B2',
  
  modules: createModules(['menu', 'orders', 'delivery', 'kitchen', 'tables', 'rodizio', 'loyalty', 'reports', 'mimo']),
  
  categories: [
    { name: 'Sushis', icon: '🍣', sort_order: 0 },
    { name: 'Sashimis', icon: '🐟', sort_order: 1 },
    { name: 'Temakis', icon: '🍙', sort_order: 2 },
    { name: 'Hot Rolls', icon: '🔥', sort_order: 3 },
    { name: 'Combos', icon: '📦', sort_order: 4 },
    { name: 'Pratos Quentes', icon: '🍜', sort_order: 5 },
    { name: 'Bebidas', icon: '🥤', sort_order: 6 },
  ],
  
  products: [
    // Sushis
    { name: 'Sushi Salmão (2un)', price: 10.00, cost: 5.00, category: 'Sushis', unit: 'dupla', prep_time_minutes: 8 },
    { name: 'Sushi Atum (2un)', price: 12.00, cost: 6.00, category: 'Sushis', unit: 'dupla', prep_time_minutes: 8 },
    { name: 'Sushi Camarão (2un)', price: 14.00, cost: 7.00, category: 'Sushis', unit: 'dupla', prep_time_minutes: 8 },
    { name: 'Sushi Skin (2un)', price: 8.00, cost: 4.00, category: 'Sushis', unit: 'dupla', prep_time_minutes: 8 },
    
    // Sashimis
    { name: 'Sashimi Salmão 5 fatias', price: 18.00, cost: 9.00, category: 'Sashimis', unit: 'porção', prep_time_minutes: 5 },
    { name: 'Sashimi Atum 5 fatias', price: 22.00, cost: 11.00, category: 'Sashimis', unit: 'porção', prep_time_minutes: 5 },
    
    // Temakis
    { name: 'Temaki Salmão', price: 22.00, cost: 10.00, category: 'Temakis', unit: 'un', prep_time_minutes: 8 },
    { name: 'Temaki Atum', price: 25.00, cost: 12.00, category: 'Temakis', unit: 'un', prep_time_minutes: 8 },
    { name: 'Temaki Skin', price: 18.00, cost: 8.00, category: 'Temakis', unit: 'un', prep_time_minutes: 8 },
    { name: 'Temaki Hot Filadélfia', price: 24.00, cost: 11.00, category: 'Temakis', unit: 'un', prep_time_minutes: 10 },
    
    // Hot Rolls
    { name: 'Hot Roll 8 peças', price: 22.00, cost: 10.00, category: 'Hot Rolls', unit: 'porção', prep_time_minutes: 12 },
    { name: 'Hot Filadélfia 8 peças', price: 26.00, cost: 12.00, category: 'Hot Rolls', unit: 'porção', prep_time_minutes: 12 },
    { name: 'Joe Salmão 4 peças', price: 18.00, cost: 8.00, category: 'Hot Rolls', unit: 'porção', prep_time_minutes: 10 },
    
    // Combos
    { name: 'Combo Salmão 20 peças', price: 65.00, cost: 28.00, category: 'Combos', unit: 'un', prep_time_minutes: 20 },
    { name: 'Combo Casal 30 peças', price: 95.00, cost: 42.00, category: 'Combos', unit: 'un', prep_time_minutes: 25 },
    { name: 'Rodízio Adulto', price: 89.90, cost: 35.00, category: 'Combos', unit: 'pessoa', description: '2 horas' },
    { name: 'Rodízio Criança', price: 44.90, cost: 18.00, category: 'Combos', unit: 'pessoa' },
    
    // Pratos Quentes
    { name: 'Yakisoba', price: 35.00, cost: 14.00, category: 'Pratos Quentes', unit: 'un', prep_time_minutes: 15 },
    { name: 'Lámen', price: 38.00, cost: 16.00, category: 'Pratos Quentes', unit: 'un', prep_time_minutes: 18 },
    
    ...SHARED_BEVERAGES.slice(0, 4),
    { name: 'Saquê (dose)', price: 12.00, cost: 5.00, category: 'Bebidas', unit: 'dose' },
  ],
  
  config: {
    has_delivery: true,
    has_pickup: true,
    has_table_service: true,
    has_counter_pickup: false,
    mimo_enabled: true,
    tab_system_enabled: false,
    rodizio_enabled: true,
    custom_orders_enabled: false,
    nutritional_info_enabled: false,
    weight_based_enabled: false,
    loyalty_type: 'points',
  },
  
  suggested_kit_ids: ['sushi_pieces', 'beverages_sodas'],
}
