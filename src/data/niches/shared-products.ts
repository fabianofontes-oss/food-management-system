// Produtos compartilhados entre todos os nichos
import { NicheProduct } from './types'

// Bebidas - servem pra TODOS os nichos
export const SHARED_BEVERAGES: NicheProduct[] = [
  { name: 'Água Mineral 500ml', price: 4.00, cost: 1.50, category: 'Bebidas', unit: 'un' },
  { name: 'Água com Gás 500ml', price: 4.50, cost: 2.00, category: 'Bebidas', unit: 'un' },
  { name: 'Coca-Cola Lata 350ml', price: 6.00, cost: 3.50, category: 'Bebidas', unit: 'un' },
  { name: 'Coca-Cola 600ml', price: 8.00, cost: 4.50, category: 'Bebidas', unit: 'un' },
  { name: 'Coca-Cola Zero Lata', price: 6.00, cost: 3.50, category: 'Bebidas', unit: 'un' },
  { name: 'Guaraná Antarctica Lata', price: 5.50, cost: 3.00, category: 'Bebidas', unit: 'un' },
  { name: 'Guaraná Antarctica 600ml', price: 7.00, cost: 4.00, category: 'Bebidas', unit: 'un' },
  { name: 'Fanta Laranja Lata', price: 5.50, cost: 3.00, category: 'Bebidas', unit: 'un' },
  { name: 'Sprite Lata', price: 5.50, cost: 3.00, category: 'Bebidas', unit: 'un' },
  { name: 'Suco Del Valle 290ml', price: 6.00, cost: 3.00, category: 'Bebidas', unit: 'un' },
]

export const SHARED_BEVERAGES_2L: NicheProduct[] = [
  { name: 'Coca-Cola 2L', price: 14.00, cost: 7.00, category: 'Bebidas', unit: 'un' },
  { name: 'Guaraná 2L', price: 10.00, cost: 6.00, category: 'Bebidas', unit: 'un' },
]

export const SHARED_ENERGY_DRINKS: NicheProduct[] = [
  { name: 'Red Bull 250ml', price: 12.00, cost: 7.00, category: 'Bebidas', unit: 'un' },
  { name: 'Monster 473ml', price: 10.00, cost: 6.00, category: 'Bebidas', unit: 'un' },
]

export const SHARED_BEERS: NicheProduct[] = [
  { name: 'Brahma Lata 350ml', price: 6.00, cost: 3.00, category: 'Cervejas', unit: 'un' },
  { name: 'Skol Lata 350ml', price: 6.00, cost: 3.00, category: 'Cervejas', unit: 'un' },
  { name: 'Heineken Long Neck', price: 12.00, cost: 6.00, category: 'Cervejas', unit: 'un' },
  { name: 'Budweiser Long Neck', price: 10.00, cost: 5.00, category: 'Cervejas', unit: 'un' },
  { name: 'Corona Long Neck', price: 14.00, cost: 7.00, category: 'Cervejas', unit: 'un' },
  { name: 'Stella Artois Long Neck', price: 12.00, cost: 6.00, category: 'Cervejas', unit: 'un' },
]

// Categoria de bebidas padrão
export const BEVERAGES_CATEGORY = { name: 'Bebidas', icon: '🥤', sort_order: 99 }
