// Tipos para Templates de Nicho

export interface NicheModule {
  id: string
  name: string
  enabled: boolean
}

export interface NicheCategory {
  name: string
  icon?: string
  sort_order: number
}

export interface NicheProduct {
  name: string
  description?: string
  price: number
  cost?: number
  category: string
  unit: string
  tags?: string[]
  has_addons?: boolean
  is_customizable?: boolean
  prep_time_minutes?: number
  // Nutricionais
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

export interface NicheConfig {
  has_delivery: boolean
  has_pickup: boolean
  has_table_service: boolean
  has_counter_pickup: boolean
  mimo_enabled: boolean
  tab_system_enabled: boolean
  rodizio_enabled: boolean
  custom_orders_enabled: boolean
  nutritional_info_enabled: boolean
  weight_based_enabled: boolean
  loyalty_type?: 'points' | 'stamps' | 'cashback'
}

export interface NicheTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  modules: NicheModule[]
  categories: NicheCategory[]
  products: NicheProduct[]
  config: NicheConfig
  suggested_kit_ids: string[]
}

// Módulos base disponíveis
export const BASE_MODULES: NicheModule[] = [
  { id: 'menu', name: 'Cardápio Digital', enabled: true },
  { id: 'orders', name: 'Pedidos', enabled: true },
  { id: 'delivery', name: 'Delivery', enabled: true },
  { id: 'kitchen', name: 'Cozinha (KDS)', enabled: true },
  { id: 'tables', name: 'Mesas', enabled: false },
  { id: 'tabs', name: 'Comanda Aberta', enabled: false },
  { id: 'rodizio', name: 'Rodízio', enabled: false },
  { id: 'custom_orders', name: 'Encomendas', enabled: false },
  { id: 'nutritional', name: 'Info Nutricional', enabled: false },
  { id: 'weight', name: 'Venda por Peso', enabled: false },
  { id: 'loyalty', name: 'Fidelidade', enabled: true },
  { id: 'reports', name: 'Relatórios', enabled: true },
  { id: 'inventory', name: 'Estoque', enabled: true },
  { id: 'crm', name: 'CRM', enabled: true },
  { id: 'marketing', name: 'Marketing', enabled: true },
  { id: 'mimo', name: 'MIMO', enabled: true },
]

// Helper para criar módulos habilitando apenas os necessários
export function createModules(enabledIds: string[]): NicheModule[] {
  return BASE_MODULES.map(m => ({
    ...m,
    enabled: enabledIds.includes(m.id)
  }))
}
