'use server'

import { createClient } from '@/lib/supabase/server'

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

// Modifier Groups CRUD
export async function getModifierGroups(storeId: string): Promise<ModifierGroupWithOptions[]> {
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

  // Fetch options for each group
  const groupsWithOptions = await Promise.all(
    (groups || []).map(async (group) => {
      const { data: options } = await supabase
        .from('modifier_options')
        .select('*')
        .eq('group_id', group.id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      return {
        ...group,
        options: options || []
      }
    })
  )

  return groupsWithOptions as ModifierGroupWithOptions[]
}

export async function createModifierGroup(group: Omit<ModifierGroup, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modifier_groups')
    .insert(group)
    .select()
    .single()

  if (error) {
    console.error('Error creating modifier group:', error)
    throw new Error(error.message)
  }

  return data as ModifierGroup
}

export async function updateModifierGroup(id: string, updates: Partial<ModifierGroup>) {
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

export async function deleteModifierGroup(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('modifier_groups')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting modifier group:', error)
    throw new Error(error.message)
  }

  return true
}

// Modifier Options CRUD
export async function getModifierOptions(groupId: string): Promise<ModifierOption[]> {
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

export async function createModifierOption(option: Omit<ModifierOption, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modifier_options')
    .insert(option)
    .select()
    .single()

  if (error) {
    console.error('Error creating modifier option:', error)
    throw new Error(error.message)
  }

  return data as ModifierOption
}

export async function updateModifierOption(id: string, updates: Partial<ModifierOption>) {
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

export async function deleteModifierOption(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('modifier_options')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting modifier option:', error)
    throw new Error(error.message)
  }

  return true
}

export async function toggleModifierOption(id: string, isActive: boolean) {
  return updateModifierOption(id, { is_active: isActive })
}

// Product Modifier Links
export async function getProductModifierGroups(productId: string): Promise<ModifierGroupWithOptions[]> {
  const supabase = await createClient()

  const { data: links, error } = await supabase
    .from('product_modifier_groups')
    .select(`
      sort_order,
      modifier_groups (*)
    `)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching product modifier groups:', error)
    return []
  }

  // Fetch options for each group
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
        options: options || []
      }
    })
  )

  return groupsWithOptions as ModifierGroupWithOptions[]
}

export async function linkModifierGroupToProduct(productId: string, groupId: string, sortOrder: number = 0) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_modifier_groups')
    .insert({
      product_id: productId,
      group_id: groupId,
      sort_order: sortOrder
    })

  if (error) {
    console.error('Error linking modifier group to product:', error)
    throw new Error(error.message)
  }

  return true
}

export async function unlinkModifierGroupFromProduct(productId: string, groupId: string) {
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

export async function updateProductModifierGroupOrder(productId: string, groupId: string, sortOrder: number) {
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

// Validation helpers
export function validateModifierSelection(
  group: ModifierGroupWithOptions,
  selectedOptions: string[]
): { valid: boolean; error?: string } {
  // Check required
  if (group.is_required && selectedOptions.length === 0) {
    return { valid: false, error: `${group.name} é obrigatório` }
  }

  // Check min_select
  if (group.min_select > 0 && selectedOptions.length < group.min_select) {
    return { 
      valid: false, 
      error: `Selecione pelo menos ${group.min_select} opção(ões) em ${group.name}` 
    }
  }

  // Check max_select
  if (group.max_select && selectedOptions.length > group.max_select) {
    return { 
      valid: false, 
      error: `Selecione no máximo ${group.max_select} opção(ões) em ${group.name}` 
    }
  }

  // Check single selection
  if (group.selection_type === 'single' && selectedOptions.length > 1) {
    return { 
      valid: false, 
      error: `Selecione apenas uma opção em ${group.name}` 
    }
  }

  return { valid: true }
}

export function calculateModifiersPrice(selectedModifiers: SelectedModifier[]): number {
  return selectedModifiers.reduce((sum, mod) => sum + mod.price_delta, 0)
}

export function formatModifierPrice(priceDelta: number): string {
  if (priceDelta === 0) return ''
  if (priceDelta > 0) return `+R$ ${priceDelta.toFixed(2)}`
  return `-R$ ${Math.abs(priceDelta).toFixed(2)}`
}
