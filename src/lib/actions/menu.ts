'use server'

import { createClient } from '@/lib/supabase/server'
import type { Store, Category, Product, ModifierGroup, ProductWithModifiers } from '@/types/menu'

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
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
    .select(`
      *,
      category:categories(*)
    `)
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

  const groupIds = productModifierGroups?.map(pmg => pmg.group_id) || []

  if (groupIds.length === 0) {
    return { ...product, modifier_groups: [] } as ProductWithModifiers
  }

  const { data: modifierGroups } = await supabase
    .from('modifier_groups')
    .select(`
      *,
      options:modifier_options(*)
    `)
    .in('id', groupIds)
    .order('sort_order', { ascending: true })

  const groups = (modifierGroups || []).map(group => ({
    ...group,
    options: (group.options || [])
      .filter((opt: any) => opt.is_active)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
  }))

  return {
    ...product,
    modifier_groups: groups
  } as ProductWithModifiers
}
