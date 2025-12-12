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
  created_at: string
  updated_at: string
  category?: ProductCategory
  unit?: MeasurementUnit
  ingredients?: ProductIngredient[]
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
  ingredients: {
    ingredient_id: string
    quantity: number
    unit_id: string | null
    is_optional: boolean
  }[]
}
