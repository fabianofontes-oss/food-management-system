// Template: Açougue
import { NicheTemplate, createModules } from './types'

export const ACOUGUE_TEMPLATE: NicheTemplate = {
  id: 'acougue',
  name: 'Açougue',
  description: 'Carnes, cortes especiais e temperos',
  icon: 'Beef',
  color: '#B91C1C',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'weight', 'inventory', 'reports']),
  
  categories: [
    { name: 'Bovinos', icon: '🥩', sort_order: 0 },
    { name: 'Suínos', icon: '🐷', sort_order: 1 },
    { name: 'Aves', icon: '🐔', sort_order: 2 },
    { name: 'Linguiças', icon: '🌭', sort_order: 3 },
    { name: 'Churrasquinho', icon: '🍢', sort_order: 4 },
  ],
  
  products: [
    // Bovinos (preço por kg)
    { name: 'Picanha', price: 89.90, cost: 60.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Contra Filé', price: 59.90, cost: 40.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Alcatra', price: 54.90, cost: 36.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Fraldinha', price: 49.90, cost: 32.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Maminha', price: 54.90, cost: 36.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Patinho', price: 39.90, cost: 26.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Coxão Mole', price: 42.90, cost: 28.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Acém', price: 34.90, cost: 22.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Carne Moída', price: 42.90, cost: 28.00, category: 'Bovinos', unit: 'kg' },
    { name: 'Costela', price: 32.90, cost: 20.00, category: 'Bovinos', unit: 'kg' },
    
    // Suínos
    { name: 'Pernil Suíno', price: 24.90, cost: 15.00, category: 'Suínos', unit: 'kg' },
    { name: 'Lombo Suíno', price: 29.90, cost: 18.00, category: 'Suínos', unit: 'kg' },
    { name: 'Costela Suína', price: 26.90, cost: 16.00, category: 'Suínos', unit: 'kg' },
    { name: 'Bacon', price: 45.90, cost: 28.00, category: 'Suínos', unit: 'kg' },
    
    // Aves
    { name: 'Frango Inteiro', price: 14.90, cost: 9.00, category: 'Aves', unit: 'kg' },
    { name: 'Peito de Frango', price: 19.90, cost: 12.00, category: 'Aves', unit: 'kg' },
    { name: 'Coxa e Sobrecoxa', price: 16.90, cost: 10.00, category: 'Aves', unit: 'kg' },
    { name: 'Asa de Frango', price: 18.90, cost: 11.00, category: 'Aves', unit: 'kg' },
    
    // Linguiças
    { name: 'Linguiça Toscana', price: 32.90, cost: 20.00, category: 'Linguiças', unit: 'kg' },
    { name: 'Linguiça de Frango', price: 28.90, cost: 17.00, category: 'Linguiças', unit: 'kg' },
    { name: 'Linguiça Calabresa', price: 34.90, cost: 22.00, category: 'Linguiças', unit: 'kg' },
    
    // Churrasquinho
    { name: 'Espetinho Bovino', price: 6.00, cost: 3.00, category: 'Churrasquinho', unit: 'un' },
    { name: 'Espetinho Frango', price: 5.00, cost: 2.50, category: 'Churrasquinho', unit: 'un' },
    { name: 'Espetinho Coração', price: 7.00, cost: 3.50, category: 'Churrasquinho', unit: 'un' },
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
    loyalty_type: 'points',
  },
  
  suggested_kit_ids: [],
}
