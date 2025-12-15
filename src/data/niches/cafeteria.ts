// Template: Cafeteria
import { NicheTemplate, createModules } from './types'

export const CAFETERIA_TEMPLATE: NicheTemplate = {
  id: 'cafeteria',
  name: 'Cafeteria',
  description: 'Cafés especiais, bebidas e lanches rápidos',
  icon: 'Coffee',
  color: '#78350F',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'loyalty', 'reports', 'crm', 'marketing']),
  
  categories: [
    { name: 'Cafés', icon: '☕', sort_order: 0 },
    { name: 'Bebidas Geladas', icon: '🧊', sort_order: 1 },
    { name: 'Chás', icon: '🍵', sort_order: 2 },
    { name: 'Lanches', icon: '🥪', sort_order: 3 },
    { name: 'Doces', icon: '🍰', sort_order: 4 },
  ],
  
  products: [
    // Cafés
    { name: 'Espresso', price: 6.00, cost: 2.00, category: 'Cafés', unit: 'un' },
    { name: 'Espresso Duplo', price: 8.00, cost: 3.00, category: 'Cafés', unit: 'un' },
    { name: 'Americano', price: 7.00, cost: 2.50, category: 'Cafés', unit: 'un' },
    { name: 'Cappuccino', price: 10.00, cost: 4.00, category: 'Cafés', unit: 'un' },
    { name: 'Latte', price: 12.00, cost: 5.00, category: 'Cafés', unit: 'un' },
    { name: 'Mocha', price: 14.00, cost: 6.00, category: 'Cafés', unit: 'un' },
    { name: 'Macchiato', price: 8.00, cost: 3.00, category: 'Cafés', unit: 'un' },
    { name: 'Café com Leite', price: 8.00, cost: 3.00, category: 'Cafés', unit: 'un' },
    
    // Bebidas Geladas
    { name: 'Iced Coffee', price: 12.00, cost: 5.00, category: 'Bebidas Geladas', unit: 'un' },
    { name: 'Iced Latte', price: 14.00, cost: 6.00, category: 'Bebidas Geladas', unit: 'un' },
    { name: 'Frappuccino Chocolate', price: 16.00, cost: 7.00, category: 'Bebidas Geladas', unit: 'un' },
    { name: 'Frappuccino Caramelo', price: 16.00, cost: 7.00, category: 'Bebidas Geladas', unit: 'un' },
    { name: 'Chocolate Gelado', price: 14.00, cost: 6.00, category: 'Bebidas Geladas', unit: 'un' },
    
    // Chás
    { name: 'Chá Verde', price: 8.00, cost: 3.00, category: 'Chás', unit: 'un' },
    { name: 'Chá de Camomila', price: 8.00, cost: 3.00, category: 'Chás', unit: 'un' },
    { name: 'Chá Preto', price: 8.00, cost: 3.00, category: 'Chás', unit: 'un' },
    { name: 'Chocolate Quente', price: 12.00, cost: 5.00, category: 'Chás', unit: 'un' },
    
    // Lanches
    { name: 'Pão de Queijo', price: 5.00, cost: 1.50, category: 'Lanches', unit: 'un' },
    { name: 'Croissant', price: 8.00, cost: 3.00, category: 'Lanches', unit: 'un' },
    { name: 'Misto Quente', price: 12.00, cost: 4.00, category: 'Lanches', unit: 'un' },
    { name: 'Sanduíche Natural', price: 14.00, cost: 5.00, category: 'Lanches', unit: 'un' },
    { name: 'Toast de Abacate', price: 18.00, cost: 7.00, category: 'Lanches', unit: 'un' },
    
    // Doces
    { name: 'Bolo (fatia)', price: 12.00, cost: 4.00, category: 'Doces', unit: 'fatia' },
    { name: 'Brownie', price: 10.00, cost: 4.00, category: 'Doces', unit: 'un' },
    { name: 'Cookie', price: 6.00, cost: 2.00, category: 'Doces', unit: 'un' },
    { name: 'Cheesecake (fatia)', price: 16.00, cost: 6.00, category: 'Doces', unit: 'fatia' },
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
    loyalty_type: 'stamps',
  },
  
  suggested_kit_ids: ['coffee_drinks'],
}
