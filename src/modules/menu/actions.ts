'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  CreateProductInput, 
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput
} from './types'
import type { Store, Category, Product, ProductWithModifiers } from '@/types/menu'

// ============================================
// PRODUCT ACTIONS
// ============================================

export async function createProductAction(
  storeSlug: string,
  data: CreateProductInput
) {
  const supabase = await createClient()

  try {
    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`) // Cardápio público

    return { success: true, data: product }
  } catch (error: unknown) {
    console.error('Erro ao criar produto:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    if (error) {
      console.error('getStoreBySlug error', { slug, error })
    }
    return null
  }
  return data as Store
}

export async function getStoreCategories(storeId: string): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data as Category[]
}

export async function getStoreProducts(storeId: string): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*)
    `
    )
    .eq('store_id', storeId)
    .eq('is_active', true)

  if (error || !data) return []
  return data as Product[]
}

export async function getProductWithModifiers(productId: string): Promise<ProductWithModifiers | null> {
  const supabase = await createClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError || !product) return null

  const { data: productModifierGroups } = await supabase
    .from('product_modifier_groups')
    .select('group_id')
    .eq('product_id', productId)

  const groupIds =
    (productModifierGroups as Array<{ group_id: string }> | null)?.map((pmg) => pmg.group_id) || []

  if (groupIds.length === 0) {
    return { ...product, modifier_groups: [] } as ProductWithModifiers
  }

  const { data: modifierGroups } = await supabase
    .from('modifier_groups')
    .select(
      `
      *,
      options:modifier_options(*)
    `
    )
    .in('id', groupIds)
    .order('sort_order', { ascending: true })

  const groups = (modifierGroups || []).map((group: unknown) => {
    const record = group && typeof group === 'object' ? (group as Record<string, unknown>) : {}
    const optionsRaw = record.options
    const optionsArray = Array.isArray(optionsRaw) ? optionsRaw : []

    const options = optionsArray
      .filter((opt): opt is Record<string, unknown> => typeof opt === 'object' && opt !== null)
      .filter((opt) => opt.is_active === true)
      .sort((a, b) => {
        const aOrder = typeof a.sort_order === 'number' ? a.sort_order : 0
        const bOrder = typeof b.sort_order === 'number' ? b.sort_order : 0
        return aOrder - bOrder
      })

    return {
      ...record,
      options,
    }
  })

  return {
    ...product,
    modifier_groups: groups,
  } as ProductWithModifiers
}

export async function updateProductAction(
  storeSlug: string,
  productId: string,
  data: UpdateProductInput
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', productId)

    if (error) throw error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao atualizar produto:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

export async function toggleProductStatusAction(
  storeSlug: string,
  productId: string,
  isActive: boolean
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId)

    if (error) throw error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao alternar status do produto:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

export async function deleteProductAction(
  storeSlug: string,
  productId: string
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao deletar produto:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

// ============================================
// CATEGORY ACTIONS
// ============================================

export async function createCategoryAction(
  storeSlug: string,
  data: CreateCategoryInput
) {
  const supabase = await createClient()

  try {
    const { data: category, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`)

    return { success: true, data: category }
  } catch (error: unknown) {
    console.error('Erro ao criar categoria:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

export async function updateCategoryAction(
  storeSlug: string,
  categoryId: string,
  data: UpdateCategoryInput
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', categoryId)

    if (error) throw error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao atualizar categoria:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

export async function deleteCategoryAction(
  storeSlug: string,
  categoryId: string
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao deletar categoria:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

export async function reorderCategoriesAction(
  storeSlug: string,
  categoryIds: string[]
) {
  const supabase = await createClient()

  try {
    // Atualiza sort_order de cada categoria
    const updates = categoryIds.map((id, index) => 
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    
    // Verifica se algum update falhou
    const failed = results.find(r => r.error)
    if (failed?.error) throw failed.error

    revalidatePath(`/${storeSlug}/dashboard/menu`)
    revalidatePath(`/${storeSlug}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('Erro ao reordenar categorias:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}
