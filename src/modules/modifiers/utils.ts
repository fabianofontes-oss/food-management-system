import type { ModifierGroupWithOptions, SelectedModifier } from './types'

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
      error: `Selecione pelo menos ${group.min_select} opção(ões) em ${group.name}`,
    }
  }

  // Check max_select
  if (group.max_select && selectedOptions.length > group.max_select) {
    return {
      valid: false,
      error: `Selecione no máximo ${group.max_select} opção(ões) em ${group.name}`,
    }
  }

  // Check single selection
  if (group.selection_type === 'single' && selectedOptions.length > 1) {
    return {
      valid: false,
      error: `Selecione apenas uma opção em ${group.name}`,
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
