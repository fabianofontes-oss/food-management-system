// Template: Bar / Pub
import { NicheTemplate, createModules } from './types'
import { SHARED_BEERS, SHARED_BEVERAGES } from './shared-products'

export const BAR_PUB_TEMPLATE: NicheTemplate = {
  id: 'bar_pub',
  name: 'Bar / Pub',
  description: 'Bebidas, petiscos, comanda aberta e happy hour',
  icon: 'Beer',
  color: '#CA8A04',
  
  modules: createModules(['menu', 'orders', 'tables', 'tabs', 'reports', 'inventory']),
  
  categories: [
    { name: 'Cervejas', icon: '🍺', sort_order: 0 },
    { name: 'Drinks', icon: '🍸', sort_order: 1 },
    { name: 'Doses', icon: '🥃', sort_order: 2 },
    { name: 'Porções', icon: '🍗', sort_order: 3 },
    { name: 'Não Alcoólicos', icon: '🥤', sort_order: 4 },
  ],
  
  products: [
    ...SHARED_BEERS,
    { name: 'Chopp 300ml', price: 8.00, cost: 3.00, category: 'Cervejas', unit: 'un' },
    { name: 'Chopp 500ml', price: 12.00, cost: 5.00, category: 'Cervejas', unit: 'un' },
    { name: 'Balde 5 Long Necks', price: 45.00, cost: 22.00, category: 'Cervejas', unit: 'un' },
    
    // Drinks
    { name: 'Caipirinha', price: 18.00, cost: 6.00, category: 'Drinks', unit: 'un' },
    { name: 'Caipiroska', price: 20.00, cost: 7.00, category: 'Drinks', unit: 'un' },
    { name: 'Mojito', price: 22.00, cost: 8.00, category: 'Drinks', unit: 'un' },
    { name: 'Moscow Mule', price: 25.00, cost: 10.00, category: 'Drinks', unit: 'un' },
    { name: 'Gin Tônica', price: 22.00, cost: 9.00, category: 'Drinks', unit: 'un' },
    { name: 'Cuba Libre', price: 20.00, cost: 8.00, category: 'Drinks', unit: 'un' },
    
    // Doses
    { name: 'Dose Whisky', price: 18.00, cost: 8.00, category: 'Doses', unit: 'dose' },
    { name: 'Dose Vodka', price: 12.00, cost: 5.00, category: 'Doses', unit: 'dose' },
    { name: 'Dose Cachaça', price: 8.00, cost: 3.00, category: 'Doses', unit: 'dose' },
    { name: 'Dose Tequila', price: 15.00, cost: 6.00, category: 'Doses', unit: 'dose' },
    
    // Porções
    { name: 'Batata Frita', price: 28.00, cost: 10.00, category: 'Porções', unit: 'un' },
    { name: 'Frango à Passarinho', price: 38.00, cost: 15.00, category: 'Porções', unit: 'un' },
    { name: 'Calabresa Acebolada', price: 35.00, cost: 14.00, category: 'Porções', unit: 'un' },
    { name: 'Isca de Peixe', price: 42.00, cost: 18.00, category: 'Porções', unit: 'un' },
    { name: 'Bolinho Bacalhau 6un', price: 35.00, cost: 15.00, category: 'Porções', unit: 'un' },
    { name: 'Amendoim', price: 8.00, cost: 2.00, category: 'Porções', unit: 'un' },
    
    // Não Alcoólicos
    ...SHARED_BEVERAGES.slice(0, 4),
    { name: 'Red Bull', price: 15.00, cost: 8.00, category: 'Não Alcoólicos', unit: 'un' },
  ],
  
  config: {
    has_delivery: false,
    has_pickup: false,
    has_table_service: true,
    has_counter_pickup: true,
    mimo_enabled: false,
    tab_system_enabled: true,
    rodizio_enabled: false,
    custom_orders_enabled: false,
    nutritional_info_enabled: false,
    weight_based_enabled: false,
    loyalty_type: 'points',
  },
  
  suggested_kit_ids: ['beverages_beer', 'beverages_energy'],
}
