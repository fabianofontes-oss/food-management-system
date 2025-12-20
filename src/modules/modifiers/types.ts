export type SelectionType = 'single' | 'multiple'

export type ModifierGroup = {
  id: string
  store_id: string
  name: string
  selection_type: SelectionType
  is_required: boolean
  min_select: number
  max_select: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type ModifierOption = {
  id: string
  group_id: string
  name: string
  price_delta: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ModifierGroupWithOptions = ModifierGroup & {
  options: ModifierOption[]
}

export type ProductModifierLink = {
  product_id: string
  group_id: string
  sort_order: number
}

export type SelectedModifier = {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_delta: number
}
