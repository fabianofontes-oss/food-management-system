import { createClient } from '@/lib/supabase/server'

export async function insertCategoryRepository(params: {
  storeId: string
  name: string
  icon: string | null
  sort_order: number
}): Promise<{ id: string } | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      store_id: params.storeId,
      name: params.name,
      icon: params.icon,
      sort_order: params.sort_order,
      is_active: true,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error(`Erro ao criar categoria ${params.name}:`, error)
    return null
  }

  return data as { id: string }
}

export async function insertProductRepository(params: {
  storeId: string
  categoryId: string
  product: {
    name: string
    description?: string | null
    price: number
    cost?: number | null
    unit?: string | null
    has_addons?: boolean
    is_customizable?: boolean
    prep_time_minutes?: number | null
    calories?: number | null
    protein_g?: number | null
    carbs_g?: number | null
    fat_g?: number | null
    tags?: unknown | null
    is_available?: boolean
  }
}): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('products').insert({
    store_id: params.storeId,
    category_id: params.categoryId,
    name: params.product.name,
    description: params.product.description ?? null,
    price: params.product.price,
    cost: params.product.cost ?? null,
    unit: params.product.unit ?? 'un',
    is_active: true,
    is_available: params.product.is_available ?? true,
    has_addons: params.product.has_addons ?? false,
    is_customizable: params.product.is_customizable ?? false,
    prep_time_minutes: params.product.prep_time_minutes ?? null,
    calories: params.product.calories ?? null,
    protein_g: params.product.protein_g ?? null,
    carbs_g: params.product.carbs_g ?? null,
    fat_g: params.product.fat_g ?? null,
    tags: (params.product.tags as any) ?? null,
  })

  if (error) {
    console.error(`Erro ao criar produto ${params.product.name}:`, error)
    return false
  }

  return true
}

export async function updateStoreFromTemplateRepository(params: {
  storeId: string
  nicheId: string
  primaryColor: string
  config: {
    has_delivery: boolean
    has_pickup: boolean
    has_table_service: boolean
  }
}): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({
      niche: params.nicheId,
      primary_color: params.primaryColor,
      has_delivery: params.config.has_delivery,
      has_pickup: params.config.has_pickup,
      has_table_service: params.config.has_table_service,
    })
    .eq('id', params.storeId)

  if (error) {
    console.error('Erro ao atualizar configs da loja:', error)
    return false
  }

  return true
}

export async function deleteProductsByStoreRepository(storeId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('products').delete().eq('store_id', storeId)

  if (error) {
    console.error('Erro ao limpar produtos:', error)
    return false
  }

  return true
}

export async function deleteCategoriesByStoreRepository(storeId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('categories').delete().eq('store_id', storeId)

  if (error) {
    console.error('Erro ao limpar categorias:', error)
    return false
  }

  return true
}
