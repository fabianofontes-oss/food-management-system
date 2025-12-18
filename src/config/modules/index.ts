// Tipos e interfaces
export * from './types'

// Categorias
export { CATEGORIES, INTEGRATION_SUBCATEGORIES } from './categories'

// Módulos por categoria
export { STORE_MODULES } from './store'
export { SALES_MODULES } from './sales'
export { PAYMENTS_MODULES } from './payments'
export { OPERATIONS_MODULES } from './operations'
export { MARKETING_MODULES } from './marketing'
export { NOTIFICATIONS_MODULES } from './notifications'

// Importar tipos
import type { Module } from './types'
import { STORE_MODULES } from './store'
import { SALES_MODULES } from './sales'
import { PAYMENTS_MODULES } from './payments'
import { OPERATIONS_MODULES } from './operations'
import { MARKETING_MODULES } from './marketing'
import { NOTIFICATIONS_MODULES } from './notifications'

// Para integrações, importamos do arquivo original temporariamente
// até que seja modularizado completamente
import { MODULES as ORIGINAL_MODULES } from '../modules_OLD'

// Filtrar apenas os módulos de integrações do arquivo original
const INTEGRATIONS_FROM_ORIGINAL = ORIGINAL_MODULES.filter(
  (m: Module) => m.category === 'integrations'
)

// Array unificado de todos os módulos
export const MODULES: Module[] = [
  ...STORE_MODULES,
  ...SALES_MODULES,
  ...PAYMENTS_MODULES,
  ...OPERATIONS_MODULES,
  ...INTEGRATIONS_FROM_ORIGINAL,
  ...MARKETING_MODULES,
  ...NOTIFICATIONS_MODULES,
]

// Helpers para buscar módulos
export function getModuleById(id: string): Module | undefined {
  return MODULES.find(m => m.id === id)
}

export function getModulesByCategory(category: Module['category']): Module[] {
  return MODULES.filter(m => m.category === category)
}

export function getModulesBySubcategory(subcategory: string): Module[] {
  return MODULES.filter(m => m.subcategory === subcategory)
}
