// Template: Sacolão / Hortifruti
import { NicheTemplate, createModules } from './types'

export const SACOLAO_TEMPLATE: NicheTemplate = {
  id: 'sacolao',
  name: 'Sacolão / Hortifruti',
  description: 'Frutas, verduras, legumes e produtos naturais',
  icon: 'Apple',
  color: '#22C55E',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'weight', 'inventory', 'reports']),
  
  categories: [
    { name: 'Frutas', icon: '🍎', sort_order: 0 },
    { name: 'Verduras', icon: '🥬', sort_order: 1 },
    { name: 'Legumes', icon: '🥕', sort_order: 2 },
    { name: 'Orgânicos', icon: '🌱', sort_order: 3 },
    { name: 'Temperos', icon: '🌿', sort_order: 4 },
  ],
  
  products: [
    // Frutas (por kg)
    { name: 'Banana Prata', price: 6.90, cost: 4.00, category: 'Frutas', unit: 'kg' },
    { name: 'Maçã Fuji', price: 12.90, cost: 8.00, category: 'Frutas', unit: 'kg' },
    { name: 'Laranja Pera', price: 5.90, cost: 3.50, category: 'Frutas', unit: 'kg' },
    { name: 'Mamão Papaya', price: 9.90, cost: 6.00, category: 'Frutas', unit: 'kg' },
    { name: 'Melancia', price: 3.90, cost: 2.00, category: 'Frutas', unit: 'kg' },
    { name: 'Abacaxi', price: 7.90, cost: 4.50, category: 'Frutas', unit: 'un' },
    { name: 'Morango', price: 18.90, cost: 12.00, category: 'Frutas', unit: 'bandeja' },
    { name: 'Uva Itália', price: 15.90, cost: 10.00, category: 'Frutas', unit: 'kg' },
    
    // Verduras
    { name: 'Alface', price: 3.50, cost: 1.80, category: 'Verduras', unit: 'un' },
    { name: 'Couve', price: 4.00, cost: 2.00, category: 'Verduras', unit: 'maço' },
    { name: 'Espinafre', price: 5.00, cost: 2.80, category: 'Verduras', unit: 'maço' },
    { name: 'Rúcula', price: 4.50, cost: 2.50, category: 'Verduras', unit: 'maço' },
    { name: 'Agrião', price: 4.50, cost: 2.50, category: 'Verduras', unit: 'maço' },
    { name: 'Brócolis', price: 8.90, cost: 5.00, category: 'Verduras', unit: 'un' },
    
    // Legumes (por kg)
    { name: 'Tomate', price: 8.90, cost: 5.50, category: 'Legumes', unit: 'kg' },
    { name: 'Cebola', price: 5.90, cost: 3.50, category: 'Legumes', unit: 'kg' },
    { name: 'Batata', price: 6.90, cost: 4.00, category: 'Legumes', unit: 'kg' },
    { name: 'Cenoura', price: 5.90, cost: 3.50, category: 'Legumes', unit: 'kg' },
    { name: 'Abobrinha', price: 7.90, cost: 4.50, category: 'Legumes', unit: 'kg' },
    { name: 'Berinjela', price: 8.90, cost: 5.50, category: 'Legumes', unit: 'kg' },
    { name: 'Pimentão', price: 12.90, cost: 8.00, category: 'Legumes', unit: 'kg' },
    
    // Orgânicos
    { name: 'Alface Orgânica', price: 6.90, cost: 4.00, category: 'Orgânicos', unit: 'un', tags: ['orgânico'] },
    { name: 'Tomate Orgânico', price: 14.90, cost: 9.00, category: 'Orgânicos', unit: 'kg', tags: ['orgânico'] },
    { name: 'Cenoura Orgânica', price: 9.90, cost: 6.00, category: 'Orgânicos', unit: 'kg', tags: ['orgânico'] },
    
    // Temperos
    { name: 'Alho', price: 35.90, cost: 22.00, category: 'Temperos', unit: 'kg' },
    { name: 'Gengibre', price: 25.90, cost: 16.00, category: 'Temperos', unit: 'kg' },
    { name: 'Cheiro Verde', price: 3.00, cost: 1.50, category: 'Temperos', unit: 'maço' },
    { name: 'Salsinha', price: 2.50, cost: 1.20, category: 'Temperos', unit: 'maço' },
    { name: 'Cebolinha', price: 2.50, cost: 1.20, category: 'Temperos', unit: 'maço' },
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
