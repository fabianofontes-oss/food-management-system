'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  CreateProductInput, 
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput
} from './types'

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
  } catch (error: any) {
    console.error('Erro ao criar produto:', error)
    return { success: false, error: error.message }
  }
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
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error)
    return { success: false, error: error.message }
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
  } catch (error: any) {
    console.error('Erro ao alternar status do produto:', error)
    return { success: false, error: error.message }
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
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error)
    return { success: false, error: error.message }
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
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error)
    return { success: false, error: error.message }
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
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error)
    return { success: false, error: error.message }
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
  } catch (error: any) {
    console.error('Erro ao deletar categoria:', error)
    return { success: false, error: error.message }
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
  } catch (error: any) {
    console.error('Erro ao reordenar categorias:', error)
    return { success: false, error: error.message }
  }
}
