import { Database } from '@/types/database'

// Tipos Puros do Banco
export type ProductRow = Database['public']['Tables']['products']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type ModifierGroupRow = Database['public']['Tables']['modifier_groups']['Row']
export type ModifierOptionRow = Database['public']['Tables']['modifier_options']['Row']

// Grupo de Modificadores com suas Opções
export type ModifierGroupWithOptions = ModifierGroupRow & {
  options: ModifierOptionRow[]
}

// Produto com todos os relacionamentos
export type ProductWithDetails = ProductRow & {
  category: CategoryRow | null
  modifier_groups: ModifierGroupWithOptions[]
}

// Catálogo completo do cardápio
export type MenuCatalog = {
  categories: CategoryRow[]
  products: ProductWithDetails[]
}

// Tipos para operações de escrita
export type CreateProductInput = {
  store_id: string
  category_id: string
  name: string
  description?: string
  base_price: number
  unit_type: 'unit' | 'weight'
  price_per_unit?: number
  image_url?: string
  is_active?: boolean
  stock_quantity?: number
  track_inventory?: boolean
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'store_id'>>

export type CreateCategoryInput = {
  store_id: string
  name: string
  description?: string
  sort_order?: number
  is_active?: boolean
}

export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, 'store_id'>>
