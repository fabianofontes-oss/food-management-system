// Template: Marmitaria
import { NicheTemplate, createModules } from './types'
import { SHARED_BEVERAGES, BEVERAGES_CATEGORY } from './shared-products'

export const MARMITARIA_TEMPLATE: NicheTemplate = {
  id: 'marmitaria',
  name: 'Marmitaria',
  description: 'Marmitas, pratos do dia e refeições completas',
  icon: 'UtensilsCrossed',
  color: '#EA580C',
  
  modules: createModules(['menu', 'orders', 'delivery', 'kitchen', 'loyalty', 'reports', 'inventory']),
  
  categories: [
    { name: 'Marmitas', icon: '🍱', sort_order: 0 },
    { name: 'Pratos do Dia', icon: '🍽️', sort_order: 1 },
    { name: 'Acompanhamentos', icon: '🥗', sort_order: 2 },
    BEVERAGES_CATEGORY,
  ],
  
  products: [
    // Marmitas por tamanho
    { name: 'Marmita P', price: 18.00, cost: 8.00, category: 'Marmitas', unit: 'un', description: '1 proteína + arroz + feijão + salada' },
    { name: 'Marmita M', price: 22.00, cost: 10.00, category: 'Marmitas', unit: 'un', description: '1 proteína + arroz + feijão + 2 acompanhamentos' },
    { name: 'Marmita G', price: 28.00, cost: 13.00, category: 'Marmitas', unit: 'un', description: '2 proteínas + arroz + feijão + 2 acompanhamentos' },
    { name: 'Marmita Fit', price: 25.00, cost: 11.00, category: 'Marmitas', unit: 'un', description: 'Proteína + legumes + salada (sem arroz/feijão)' },
    
    // Pratos do dia
    { name: 'Bife Acebolado', price: 22.00, cost: 10.00, category: 'Pratos do Dia', unit: 'un' },
    { name: 'Frango Grelhado', price: 20.00, cost: 9.00, category: 'Pratos do Dia', unit: 'un' },
    { name: 'Peixe Frito', price: 24.00, cost: 11.00, category: 'Pratos do Dia', unit: 'un' },
    { name: 'Carne de Panela', price: 22.00, cost: 10.00, category: 'Pratos do Dia', unit: 'un' },
    { name: 'Feijoada', price: 28.00, cost: 13.00, category: 'Pratos do Dia', unit: 'un' },
    { name: 'Strogonoff', price: 24.00, cost: 11.00, category: 'Pratos do Dia', unit: 'un' },
    { name: 'Lasanha', price: 26.00, cost: 12.00, category: 'Pratos do Dia', unit: 'un' },
    
    // Acompanhamentos extras
    { name: 'Arroz Extra', price: 5.00, cost: 1.50, category: 'Acompanhamentos', unit: 'porção' },
    { name: 'Feijão Extra', price: 5.00, cost: 1.50, category: 'Acompanhamentos', unit: 'porção' },
    { name: 'Farofa', price: 4.00, cost: 1.00, category: 'Acompanhamentos', unit: 'porção' },
    { name: 'Salada Extra', price: 6.00, cost: 2.00, category: 'Acompanhamentos', unit: 'porção' },
    { name: 'Ovo Frito', price: 3.00, cost: 1.00, category: 'Acompanhamentos', unit: 'un' },
    
    ...SHARED_BEVERAGES.slice(0, 6),
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
  
  suggested_kit_ids: ['beverages_sodas'],
}
