// Index - Exporta todos os templates de nicho
export * from './types'
export * from './shared-products'

// Templates individuais
export { ACAITERIA_TEMPLATE } from './acaiteria'
export { HAMBURGUERIA_TEMPLATE } from './hamburgueria'
export { PIZZARIA_TEMPLATE } from './pizzaria'
export { BAR_PUB_TEMPLATE } from './bar-pub'
export { SUSHI_JAPONES_TEMPLATE } from './sushi-japones'
export { CONFEITARIA_TEMPLATE } from './confeitaria'
export { FIT_HEALTHY_TEMPLATE } from './fit-healthy'
export { ACOUGUE_TEMPLATE } from './acougue'
export { CAFETERIA_TEMPLATE } from './cafeteria'
export { MARMITARIA_TEMPLATE } from './marmitaria'
export { PADARIA_TEMPLATE } from './padaria'
export { RESTAURANTE_TEMPLATE } from './restaurante'
export { SACOLAO_TEMPLATE } from './sacolao'
export { DARK_KITCHEN_TEMPLATE } from './dark-kitchen'

import { NicheTemplate } from './types'
import { ACAITERIA_TEMPLATE } from './acaiteria'
import { HAMBURGUERIA_TEMPLATE } from './hamburgueria'
import { PIZZARIA_TEMPLATE } from './pizzaria'
import { BAR_PUB_TEMPLATE } from './bar-pub'
import { SUSHI_JAPONES_TEMPLATE } from './sushi-japones'
import { CONFEITARIA_TEMPLATE } from './confeitaria'
import { FIT_HEALTHY_TEMPLATE } from './fit-healthy'
import { ACOUGUE_TEMPLATE } from './acougue'
import { CAFETERIA_TEMPLATE } from './cafeteria'
import { MARMITARIA_TEMPLATE } from './marmitaria'
import { PADARIA_TEMPLATE } from './padaria'
import { RESTAURANTE_TEMPLATE } from './restaurante'
import { SACOLAO_TEMPLATE } from './sacolao'
import { DARK_KITCHEN_TEMPLATE } from './dark-kitchen'

// Array com todos os templates
export const ALL_NICHE_TEMPLATES: NicheTemplate[] = [
  ACAITERIA_TEMPLATE,
  HAMBURGUERIA_TEMPLATE,
  PIZZARIA_TEMPLATE,
  BAR_PUB_TEMPLATE,
  SUSHI_JAPONES_TEMPLATE,
  CONFEITARIA_TEMPLATE,
  FIT_HEALTHY_TEMPLATE,
  ACOUGUE_TEMPLATE,
  CAFETERIA_TEMPLATE,
  MARMITARIA_TEMPLATE,
  PADARIA_TEMPLATE,
  RESTAURANTE_TEMPLATE,
  SACOLAO_TEMPLATE,
  DARK_KITCHEN_TEMPLATE,
]

// Helpers
export function getNicheTemplateById(id: string): NicheTemplate | undefined {
  return ALL_NICHE_TEMPLATES.find(t => t.id === id)
}

export function getNicheTemplateByName(name: string): NicheTemplate | undefined {
  return ALL_NICHE_TEMPLATES.find(t => 
    t.name.toLowerCase().includes(name.toLowerCase())
  )
}

// Estatísticas
export function getNicheStats() {
  return {
    totalNiches: ALL_NICHE_TEMPLATES.length,
    totalProducts: ALL_NICHE_TEMPLATES.reduce((acc, t) => acc + t.products.length, 0),
    totalCategories: ALL_NICHE_TEMPLATES.reduce((acc, t) => acc + t.categories.length, 0),
    niches: ALL_NICHE_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      productsCount: t.products.length,
      categoriesCount: t.categories.length,
    }))
  }
}

// Lista simplificada para seleção no onboarding
export const NICHE_OPTIONS = ALL_NICHE_TEMPLATES.map(t => ({
  id: t.id,
  name: t.name,
  description: t.description,
  icon: t.icon,
  color: t.color,
}))
