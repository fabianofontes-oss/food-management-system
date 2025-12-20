'use server'

import { getNicheTemplateById } from '@/data/niches'
import type { SeedResult } from './types'
import {
  deleteCategoriesByStoreRepository,
  deleteProductsByStoreRepository,
  insertCategoryRepository,
  insertProductRepository,
  updateStoreFromTemplateRepository,
} from './repository'

export async function seedStoreFromNiche(storeId: string, nicheId: string): Promise<SeedResult> {
  const template = getNicheTemplateById(nicheId)
  if (!template) {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: `Nicho "${nicheId}" não encontrado`,
    }
  }

  try {
    const categoryMap: Record<string, string> = {}

    for (const category of template.categories) {
      const created = await insertCategoryRepository({
        storeId,
        name: category.name,
        icon: category.icon || null,
        sort_order: category.sort_order,
      })

      if (created) {
        categoryMap[category.name] = created.id
      }
    }

    let productsCreated = 0

    for (const product of template.products) {
      const categoryId = categoryMap[product.category]
      if (!categoryId) {
        console.warn(`Categoria "${product.category}" não encontrada para produto "${product.name}"`)
        continue
      }

      const ok = await insertProductRepository({
        storeId,
        categoryId,
        product: {
          name: product.name,
          description: product.description || null,
          price: product.price,
          cost: product.cost || null,
          unit: product.unit || 'un',
          has_addons: product.has_addons || false,
          is_customizable: product.is_customizable || false,
          prep_time_minutes: product.prep_time_minutes || null,
          calories: product.calories || null,
          protein_g: product.protein_g || null,
          carbs_g: product.carbs_g || null,
          fat_g: product.fat_g || null,
          tags: product.tags || null,
          is_available: true,
        },
      })

      if (ok) productsCreated++
    }

    await updateStoreFromTemplateRepository({
      storeId,
      nicheId,
      primaryColor: template.color,
      config: {
        has_delivery: template.config.has_delivery,
        has_pickup: template.config.has_pickup,
        has_table_service: template.config.has_table_service,
      },
    })

    return {
      success: true,
      categoriesCreated: Object.keys(categoryMap).length,
      productsCreated,
    }
  } catch (error) {
    console.error('Erro no seed:', error)
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function clearStoreProducts(storeId: string): Promise<boolean> {
  try {
    const productsOk = await deleteProductsByStoreRepository(storeId)
    if (!productsOk) return false

    const categoriesOk = await deleteCategoriesByStoreRepository(storeId)
    if (!categoriesOk) return false

    return true
  } catch (error) {
    console.error('Erro ao limpar produtos:', error)
    return false
  }
}

export async function reseedStoreFromNiche(storeId: string, nicheId: string): Promise<SeedResult> {
  const cleared = await clearStoreProducts(storeId)
  if (!cleared) {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: 'Falha ao limpar produtos existentes',
    }
  }

  return seedStoreFromNiche(storeId, nicheId)
}
