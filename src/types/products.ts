export type MeasurementUnitType = 'weight' | 'volume' | 'unit'

export interface MeasurementUnit {
  id: string
  code: string
  name: string
  type: MeasurementUnitType
  is_fractional: boolean
  created_at: string
}

export interface ProductCategory {
  id: string
  tenant_id: string
  store_id: string
  name: string
  description: string | null
  sort_order: number
  icon?: string | null
  color?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductIngredient {
  id: string
  product_id: string
  ingredient_id: string
  quantity: number
  unit_id: string | null
  is_optional: boolean
  created_at: string
  ingredient?: Product
  unit?: MeasurementUnit
}

// Variações do produto (tamanhos: 300ml, 500ml, 1L, etc)
export interface ProductVariation {
  id: string
  product_id: string
  name: string
  price: number
  sort_order: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

// Grupos de adicionais (ex: "Frutas", "Caldas", "Extras")
export interface AddonGroup {
  id: string
  store_id: string
  name: string
  description: string | null
  min_selections: number
  max_selections: number
  is_required: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  addons?: Addon[]
}

// Itens adicionais (ex: "Granola +R$2", "Leite Condensado +R$3")
export interface Addon {
  id: string
  addon_group_id: string
  name: string
  price: number
  sort_order: number
  is_active: boolean
  created_at: string
}

// Relação produto <-> grupo de adicionais
export interface ProductAddonGroup {
  id: string
  product_id: string
  addon_group_id: string
  sort_order: number
  addon_group?: AddonGroup
}

export interface Product {
  id: string
  tenant_id: string
  store_id: string
  name: string
  description: string | null
  base_price: number
  category_id: string | null
  unit_id: string | null
  prep_time: number
  is_composed: boolean
  cost_price: number
  stock_quantity: number
  min_stock: number
  sku: string | null
  barcode: string | null
  image_url: string | null
  requires_kitchen: boolean
  is_active: boolean
  has_variations: boolean
  created_at: string
  updated_at: string
  category?: ProductCategory
  unit?: MeasurementUnit
  ingredients?: ProductIngredient[]
  variations?: ProductVariation[]
  addon_groups?: ProductAddonGroup[]
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  category_id: string | null
  unit_id: string | null
  prep_time: number
  is_composed: boolean
  cost_price: number
  stock_quantity: number
  min_stock: number
  sku: string
  barcode: string
  image_url: string
  requires_kitchen: boolean
  is_active: boolean
  has_variations: boolean
  sale_type: 'ready' | 'order' | 'both'
  min_order_quantity: number
  advance_days: number
  max_daily_quantity: number | null
  ingredients: {
    ingredient_id: string
    quantity: number
    unit_id: string | null
    is_optional: boolean
  }[]
  variations: {
    id?: string
    name: string
    price: number
    is_default: boolean
  }[]
  addon_group_ids: string[]
}

// Dados para criação de grupo de adicionais
export interface AddonGroupFormData {
  name: string
  description: string
  min_selections: number
  max_selections: number
  is_required: boolean
  addons: {
    id?: string
    name: string
    price: number
  }[]
}
