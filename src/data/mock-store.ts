// Mock data for fallback when database is not connected

export const mockStoreData = {
  id: 'mock-store-id',
  name: 'Açaí Sabor Real',
  slug: 'acai-sabor-real',
  description: 'O melhor açaí da cidade, com frutas frescas e ingredientes selecionados.',
  logo_url: null,
  banner_url: null,
  address: 'Rua das Flores, 123',
  phone: '(11) 99999-9999',
  settings: {
    businessHours: [
      { day: 0, open: '10:00', close: '22:00', isOpen: true },
      { day: 1, open: '10:00', close: '22:00', isOpen: true },
      { day: 2, open: '10:00', close: '22:00', isOpen: true },
      { day: 3, open: '10:00', close: '22:00', isOpen: true },
      { day: 4, open: '10:00', close: '22:00', isOpen: true },
      { day: 5, open: '10:00', close: '23:00', isOpen: true },
      { day: 6, open: '10:00', close: '23:00', isOpen: true },
    ],
    delivery: {
      enabled: true,
      minimumOrder: 15,
      fees: [{ distance: 5, price: 5 }, { distance: 10, price: 10 }]
    }
  },
  menu_theme: {
    layout: 'tabs',
    cardStyle: 'standard',
    primaryColor: '#8E44AD'
  },
  tenants: {
    timezone: 'America/Sao_Paulo'
  },
  scheduling_enabled: false
}

export const mockCategories = [
  { id: 'cat-1', name: 'Açaí', sort_order: 1, store_id: 'mock-store-id' },
  { id: 'cat-2', name: 'Bebidas', sort_order: 2, store_id: 'mock-store-id' },
  { id: 'cat-3', name: 'Lanches', sort_order: 3, store_id: 'mock-store-id' },
]

export const mockProducts = [
  {
    id: 'prod-1',
    name: 'Açaí Tradicional 300ml',
    description: 'Açaí puro batido com banana e guaraná.',
    base_price: 15.00,
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=1000',
    category_id: 'cat-1',
    store_id: 'mock-store-id',
    is_active: true,
    sort_order: 1
  },
  {
    id: 'prod-2',
    name: 'Açaí Tradicional 500ml',
    description: 'Açaí puro batido com banana e guaraná.',
    base_price: 22.00,
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=1000',
    category_id: 'cat-1',
    store_id: 'mock-store-id',
    is_active: true,
    sort_order: 2
  },
  {
    id: 'prod-3',
    name: 'Suco de Laranja',
    description: 'Suco natural da fruta, feito na hora.',
    base_price: 8.00,
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=1000',
    category_id: 'cat-2',
    store_id: 'mock-store-id',
    is_active: true,
    sort_order: 1
  },
  {
    id: 'prod-4',
    name: 'Sanduíche Natural',
    description: 'Pão integral, frango desfiado, alface e tomate.',
    base_price: 12.00,
    image_url: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?auto=format&fit=crop&q=80&w=1000',
    category_id: 'cat-3',
    store_id: 'mock-store-id',
    is_active: true,
    sort_order: 1
  }
]
