import { createClient } from '@/lib/supabase/server'
import type { ModifierGroup, ModifierGroupWithOptions, ModifierOption } from './types'

export async function getModifierGroupsRepository(storeId: string): Promise<ModifierGroupWithOptions[]> {
  const supabase = await createClient()

  const { data: groups, error } = await supabase
    .from('modifier_groups')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching modifier groups:', error)
    return []
  }

  const groupsWithOptions = await Promise.all(
    (groups || []).map(async (group: any) => {
      const { data: options } = await supabase
        .from('modifier_options')
        .select('*')
        .eq('group_id', group.id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      return {
        ...group,
        options: options || [],
      }
    })
  )

  return groupsWithOptions as ModifierGroupWithOptions[]
}

export async function createModifierGroupRepository(
  group: Omit<ModifierGroup, 'id' | 'created_at' | 'updated_at'>
): Promise<ModifierGroup> {
  const supabase = await createClient()

  const { data, error } = await supabase.from('modifier_groups').insert(group).select().single()

  if (error) {
    console.error('Error creating modifier group:', error)
    throw new Error(error.message)
  }

  return data as ModifierGroup
}

export async function updateModifierGroupRepository(id: string, updates: Partial<ModifierGroup>): Promise<ModifierGroup> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modifier_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating modifier group:', error)
    throw new Error(error.message)
  }

  return data as ModifierGroup
}

export async function deleteModifierGroupRepository(id: string): Promise<true> {
  const supabase = await createClient()

  const { error } = await supabase.from('modifier_groups').delete().eq('id', id)

  if (error) {
    console.error('Error deleting modifier group:', error)
    throw new Error(error.message)
  }

  return true
}

export async function getModifierOptionsRepository(groupId: string): Promise<ModifierOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modifier_options')
    .select('*')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching modifier options:', error)
    return []
  }

  return data as ModifierOption[]
}

export async function createModifierOptionRepository(
  option: Omit<ModifierOption, 'id' | 'created_at' | 'updated_at'>
): Promise<ModifierOption> {
  const supabase = await createClient()

  const { data, error } = await supabase.from('modifier_options').insert(option).select().single()

  if (error) {
    console.error('Error creating modifier option:', error)
    throw new Error(error.message)
  }

  return data as ModifierOption
}

export async function updateModifierOptionRepository(id: string, updates: Partial<ModifierOption>): Promise<ModifierOption> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modifier_options')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating modifier option:', error)
    throw new Error(error.message)
  }

  return data as ModifierOption
}

export async function deleteModifierOptionRepository(id: string): Promise<true> {
  const supabase = await createClient()

  const { error } = await supabase.from('modifier_options').delete().eq('id', id)

  if (error) {
    console.error('Error deleting modifier option:', error)
    throw new Error(error.message)
  }

  return true
}

export async function getProductModifierGroupsRepository(productId: string): Promise<ModifierGroupWithOptions[]> {
  const supabase = await createClient()

  const { data: links, error } = await supabase
    .from('product_modifier_groups')
    .select(
      `
      sort_order,
      modifier_groups (*)
    `
    )
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching product modifier groups:', error)
    return []
  }

  const groupsWithOptions = await Promise.all(
    (links || []).map(async (link: any) => {
      const group = link.modifier_groups
      const { data: options } = await supabase
        .from('modifier_options')
        .select('*')
        .eq('group_id', group.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      return {
        ...group,
        options: options || [],
      }
    })
  )

  return groupsWithOptions as ModifierGroupWithOptions[]
}

export async function linkModifierGroupToProductRepository(
  productId: string,
  groupId: string,
  sortOrder: number = 0
): Promise<true> {
  const supabase = await createClient()

  const { error } = await supabase.from('product_modifier_groups').insert({
    product_id: productId,
    group_id: groupId,
    sort_order: sortOrder,
  })

  if (error) {
    console.error('Error linking modifier group to product:', error)
    throw new Error(error.message)
  }

  return true
}

export async function unlinkModifierGroupFromProductRepository(productId: string, groupId: string): Promise<true> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_modifier_groups')
    .delete()
    .eq('product_id', productId)
    .eq('group_id', groupId)

  if (error) {
    console.error('Error unlinking modifier group from product:', error)
    throw new Error(error.message)
  }

  return true
}

export async function updateProductModifierGroupOrderRepository(
  productId: string,
  groupId: string,
  sortOrder: number
): Promise<true> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_modifier_groups')
    .update({ sort_order: sortOrder })
    .eq('product_id', productId)
    .eq('group_id', groupId)

  if (error) {
    console.error('Error updating modifier group order:', error)
    throw new Error(error.message)
  }

  return true
}
