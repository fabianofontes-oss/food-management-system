// Template: Fit / Healthy
import { NicheTemplate, createModules } from './types'

export const FIT_HEALTHY_TEMPLATE: NicheTemplate = {
  id: 'fit_healthy',
  name: 'Fit / Healthy',
  description: 'Refeições saudáveis, low carb e fitness',
  icon: 'Leaf',
  color: '#16A34A',
  
  modules: createModules(['menu', 'orders', 'delivery', 'pos', 'nutritional', 'loyalty', 'reports', 'crm']),
  
  categories: [
    { name: 'Pratos Principais', icon: '🍽️', sort_order: 0 },
    { name: 'Saladas', icon: '🥗', sort_order: 1 },
    { name: 'Bowls', icon: '🥣', sort_order: 2 },
    { name: 'Smoothies', icon: '🥤', sort_order: 3 },
    { name: 'Lanches', icon: '🥪', sort_order: 4 },
    { name: 'Sobremesas Fit', icon: '🍨', sort_order: 5 },
  ],
  
  products: [
    // Pratos com info nutricional
    { name: 'Frango + Legumes', price: 28.00, cost: 12.00, category: 'Pratos Principais', unit: 'un', calories: 350, protein_g: 40, carbs_g: 15, fat_g: 12 },
    { name: 'Salmão + Quinoa', price: 42.00, cost: 20.00, category: 'Pratos Principais', unit: 'un', calories: 450, protein_g: 35, carbs_g: 30, fat_g: 18 },
    { name: 'Tilápia + Arroz Integral', price: 32.00, cost: 14.00, category: 'Pratos Principais', unit: 'un', calories: 380, protein_g: 32, carbs_g: 35, fat_g: 10 },
    { name: 'Carne + Batata Doce', price: 30.00, cost: 13.00, category: 'Pratos Principais', unit: 'un', calories: 400, protein_g: 35, carbs_g: 40, fat_g: 12 },
    { name: 'Omelete de Claras', price: 18.00, cost: 7.00, category: 'Pratos Principais', unit: 'un', calories: 180, protein_g: 25, carbs_g: 5, fat_g: 6 },
    
    // Saladas
    { name: 'Salada Caesar Fit', price: 26.00, cost: 11.00, category: 'Saladas', unit: 'un', calories: 280, protein_g: 28, carbs_g: 12, fat_g: 14 },
    { name: 'Salada de Atum', price: 28.00, cost: 12.00, category: 'Saladas', unit: 'un', calories: 260, protein_g: 30, carbs_g: 10, fat_g: 12 },
    { name: 'Salada Proteica', price: 32.00, cost: 14.00, category: 'Saladas', unit: 'un', calories: 380, protein_g: 40, carbs_g: 15, fat_g: 16 },
    
    // Bowls
    { name: 'Bowl de Atum', price: 32.00, cost: 14.00, category: 'Bowls', unit: 'un', calories: 380, protein_g: 32, carbs_g: 35, fat_g: 12 },
    { name: 'Bowl Vegano', price: 28.00, cost: 12.00, category: 'Bowls', unit: 'un', calories: 320, protein_g: 15, carbs_g: 45, fat_g: 10, tags: ['vegano'] },
    { name: 'Açaí Fit (sem açúcar)', price: 22.00, cost: 9.00, category: 'Bowls', unit: '300ml', calories: 250, protein_g: 5, carbs_g: 30, fat_g: 12 },
    
    // Smoothies
    { name: 'Smoothie Verde Detox', price: 16.00, cost: 6.00, category: 'Smoothies', unit: 'un', calories: 120, protein_g: 3, carbs_g: 25, fat_g: 2, tags: ['vegano'] },
    { name: 'Smoothie Proteico', price: 22.00, cost: 10.00, category: 'Smoothies', unit: 'un', calories: 350, protein_g: 30, carbs_g: 35, fat_g: 8 },
    { name: 'Smoothie Frutas Vermelhas', price: 18.00, cost: 7.00, category: 'Smoothies', unit: 'un', calories: 180, protein_g: 4, carbs_g: 38, fat_g: 2 },
    
    // Lanches
    { name: 'Wrap Integral Frango', price: 22.00, cost: 9.00, category: 'Lanches', unit: 'un', calories: 320, protein_g: 28, carbs_g: 30, fat_g: 10 },
    { name: 'Tapioca Proteica', price: 18.00, cost: 7.00, category: 'Lanches', unit: 'un', calories: 220, protein_g: 18, carbs_g: 25, fat_g: 6 },
    
    // Sobremesas
    { name: 'Mousse Maracujá Fit', price: 12.00, cost: 4.00, category: 'Sobremesas Fit', unit: 'un', calories: 120, protein_g: 8, carbs_g: 12, fat_g: 4 },
    { name: 'Brownie Fit', price: 10.00, cost: 4.00, category: 'Sobremesas Fit', unit: 'un', calories: 150, protein_g: 6, carbs_g: 18, fat_g: 6 },
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
    nutritional_info_enabled: true,
    weight_based_enabled: false,
    loyalty_type: 'points',
  },
  
  suggested_kit_ids: ['fit_meals'],
}
