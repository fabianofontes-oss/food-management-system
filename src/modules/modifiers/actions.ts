'use server'

import type {
  ModifierGroup,
  ModifierGroupWithOptions,
  ModifierOption,
  SelectedModifier,
} from './types'
import {
  createModifierGroupRepository,
  createModifierOptionRepository,
  deleteModifierGroupRepository,
  deleteModifierOptionRepository,
  getModifierGroupsRepository,
  getModifierOptionsRepository,
  getProductModifierGroupsRepository,
  linkModifierGroupToProductRepository,
  unlinkModifierGroupFromProductRepository,
  updateModifierGroupRepository,
  updateModifierOptionRepository,
  updateProductModifierGroupOrderRepository,
} from './repository'
import {
  calculateModifiersPrice,
  formatModifierPrice,
  validateModifierSelection,
} from './utils'

export async function getModifierGroups(storeId: string): Promise<ModifierGroupWithOptions[]> {
  return getModifierGroupsRepository(storeId)
}

export async function createModifierGroup(group: Omit<ModifierGroup, 'id' | 'created_at' | 'updated_at'>) {
  return createModifierGroupRepository(group)
}

export async function updateModifierGroup(id: string, updates: Partial<ModifierGroup>) {
  return updateModifierGroupRepository(id, updates)
}

export async function deleteModifierGroup(id: string) {
  return deleteModifierGroupRepository(id)
}

export async function getModifierOptions(groupId: string): Promise<ModifierOption[]> {
  return getModifierOptionsRepository(groupId)
}

export async function createModifierOption(option: Omit<ModifierOption, 'id' | 'created_at' | 'updated_at'>) {
  return createModifierOptionRepository(option)
}

export async function updateModifierOption(id: string, updates: Partial<ModifierOption>) {
  return updateModifierOptionRepository(id, updates)
}

export async function deleteModifierOption(id: string) {
  return deleteModifierOptionRepository(id)
}

export async function toggleModifierOption(id: string, isActive: boolean) {
  return updateModifierOption(id, { is_active: isActive })
}

export async function getProductModifierGroups(productId: string): Promise<ModifierGroupWithOptions[]> {
  return getProductModifierGroupsRepository(productId)
}

export async function linkModifierGroupToProduct(productId: string, groupId: string, sortOrder: number = 0) {
  return linkModifierGroupToProductRepository(productId, groupId, sortOrder)
}

export async function unlinkModifierGroupFromProduct(productId: string, groupId: string) {
  return unlinkModifierGroupFromProductRepository(productId, groupId)
}

export async function updateProductModifierGroupOrder(productId: string, groupId: string, sortOrder: number) {
  return updateProductModifierGroupOrderRepository(productId, groupId, sortOrder)
}

export { validateModifierSelection, calculateModifiersPrice, formatModifierPrice }
export type { SelectedModifier }
