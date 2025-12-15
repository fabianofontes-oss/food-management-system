// Template: Confeitaria
import { NicheTemplate, createModules } from './types'

export const CONFEITARIA_TEMPLATE: NicheTemplate = {
  id: 'confeitaria',
  name: 'Confeitaria',
  description: 'Bolos, tortas, doces e encomendas',
  icon: 'Cake',
  color: '#DB2777',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'custom_orders', 'loyalty', 'reports', 'marketing']),
  
  categories: [
    { name: 'Bolos', icon: '🎂', sort_order: 0 },
    { name: 'Tortas', icon: '🥧', sort_order: 1 },
    { name: 'Doces', icon: '🍬', sort_order: 2 },
    { name: 'Salgados', icon: '🥟', sort_order: 3 },
    { name: 'Bebidas', icon: '☕', sort_order: 4 },
  ],
  
  products: [
    // Bolos Fatias
    { name: 'Fatia Bolo Chocolate', price: 14.00, cost: 5.00, category: 'Bolos', unit: 'fatia' },
    { name: 'Fatia Bolo Cenoura', price: 12.00, cost: 4.00, category: 'Bolos', unit: 'fatia' },
    { name: 'Fatia Red Velvet', price: 16.00, cost: 6.00, category: 'Bolos', unit: 'fatia' },
    { name: 'Fatia Bolo Morango', price: 15.00, cost: 5.50, category: 'Bolos', unit: 'fatia' },
    // Bolos Inteiros (encomenda)
    { name: 'Bolo Chocolate 1kg', price: 80.00, cost: 35.00, category: 'Bolos', unit: 'un', description: 'Encomenda 48h' },
    { name: 'Bolo Personalizado 1kg', price: 120.00, cost: 50.00, category: 'Bolos', unit: 'un', is_customizable: true },
    
    // Tortas
    { name: 'Torta Limão (fatia)', price: 14.00, cost: 5.00, category: 'Tortas', unit: 'fatia' },
    { name: 'Torta Holandesa (fatia)', price: 15.00, cost: 5.50, category: 'Tortas', unit: 'fatia' },
    { name: 'Cheesecake (fatia)', price: 18.00, cost: 7.00, category: 'Tortas', unit: 'fatia' },
    
    // Doces
    { name: 'Brigadeiro', price: 3.50, cost: 1.00, category: 'Doces', unit: 'un' },
    { name: 'Beijinho', price: 3.50, cost: 1.00, category: 'Doces', unit: 'un' },
    { name: 'Trufa', price: 5.00, cost: 2.00, category: 'Doces', unit: 'un' },
    { name: 'Brownie', price: 8.00, cost: 3.00, category: 'Doces', unit: 'un' },
    { name: 'Petit Gâteau', price: 18.00, cost: 7.00, category: 'Doces', unit: 'un' },
    { name: 'Cento Brigadeiro', price: 120.00, cost: 45.00, category: 'Doces', unit: '100un', description: 'Encomenda' },
    
    // Salgados
    { name: 'Coxinha', price: 6.00, cost: 2.00, category: 'Salgados', unit: 'un' },
    { name: 'Empada', price: 6.00, cost: 2.00, category: 'Salgados', unit: 'un' },
    { name: 'Pastel de Forno', price: 7.00, cost: 2.50, category: 'Salgados', unit: 'un' },
    { name: 'Cento Salgados', price: 180.00, cost: 70.00, category: 'Salgados', unit: '100un', description: 'Encomenda' },
    
    // Bebidas
    { name: 'Café Expresso', price: 5.00, cost: 1.50, category: 'Bebidas', unit: 'un' },
    { name: 'Cappuccino', price: 9.00, cost: 3.00, category: 'Bebidas', unit: 'un' },
    { name: 'Chocolate Quente', price: 10.00, cost: 4.00, category: 'Bebidas', unit: 'un' },
    { name: 'Suco Natural', price: 8.00, cost: 3.00, category: 'Bebidas', unit: 'un' },
  ],
  
  config: {
    has_delivery: true,
    has_pickup: true,
    has_table_service: false,
    has_counter_pickup: true,
    mimo_enabled: true,
    tab_system_enabled: false,
    rodizio_enabled: false,
    custom_orders_enabled: true,
    nutritional_info_enabled: false,
    weight_based_enabled: false,
    loyalty_type: 'stamps',
  },
  
  suggested_kit_ids: ['bakery_cakes', 'candy_chocolates', 'coffee_drinks'],
}
