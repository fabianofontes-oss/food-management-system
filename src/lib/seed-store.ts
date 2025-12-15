import { createClient } from '@/lib/supabase/server'
import { getNicheTemplateById, NicheTemplate, NicheProduct, NicheCategory } from '@/data/niches'

export interface SeedResult {
  success: boolean
  categoriesCreated: number
  productsCreated: number
  error?: string
}

export async function seedStoreFromNiche(
  storeId: string,
  nicheId: string
): Promise<SeedResult> {
  const supabase = await createClient()
  
  // 1. Buscar template do nicho
  const template = getNicheTemplateById(nicheId)
  if (!template) {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: `Nicho "${nicheId}" não encontrado`
    }
  }

  try {
    // 2. Criar categorias
    const categoryMap: Record<string, string> = {}
    
    for (const category of template.categories) {
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
          store_id: storeId,
          name: category.name,
          icon: category.icon || null,
          sort_order: category.sort_order,
          is_active: true,
        })
        .select('id')
        .single()

      if (error) {
        console.error(`Erro ao criar categoria ${category.name}:`, error)
        continue
      }

      if (newCategory) {
        categoryMap[category.name] = newCategory.id
      }
    }

    // 3. Criar produtos
    let productsCreated = 0

    for (const product of template.products) {
      const categoryId = categoryMap[product.category]
      if (!categoryId) {
        console.warn(`Categoria "${product.category}" não encontrada para produto "${product.name}"`)
        continue
      }

      const { error } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          category_id: categoryId,
          name: product.name,
          description: product.description || null,
          price: product.price,
          cost: product.cost || null,
          unit: product.unit || 'un',
          is_active: true,
          is_available: true,
          has_addons: product.has_addons || false,
          is_customizable: product.is_customizable || false,
          prep_time_minutes: product.prep_time_minutes || null,
          // Nutricionais
          calories: product.calories || null,
          protein_g: product.protein_g || null,
          carbs_g: product.carbs_g || null,
          fat_g: product.fat_g || null,
          // Tags como JSON
          tags: product.tags || null,
        })

      if (error) {
        console.error(`Erro ao criar produto ${product.name}:`, error)
        continue
      }

      productsCreated++
    }

    // 4. Atualizar configs da loja baseado no nicho
    const { error: configError } = await supabase
      .from('stores')
      .update({
        niche: nicheId,
        primary_color: template.color,
        // Configs específicas
        has_delivery: template.config.has_delivery,
        has_pickup: template.config.has_pickup,
        has_table_service: template.config.has_table_service,
        // Módulos (se existirem as colunas)
        // mimo_enabled: template.config.mimo_enabled,
        // tab_system_enabled: template.config.tab_system_enabled,
      })
      .eq('id', storeId)

    if (configError) {
      console.error('Erro ao atualizar configs da loja:', configError)
    }

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
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para limpar produtos existentes antes de re-seed (opcional)
export async function clearStoreProducts(storeId: string): Promise<boolean> {
  const supabase = await createClient()
  
  try {
    // Deletar produtos primeiro (por causa de foreign keys)
    await supabase
      .from('products')
      .delete()
      .eq('store_id', storeId)

    // Deletar categorias
    await supabase
      .from('categories')
      .delete()
      .eq('store_id', storeId)

    return true
  } catch (error) {
    console.error('Erro ao limpar produtos:', error)
    return false
  }
}

// Função para re-seed (limpa e popula novamente)
export async function reseedStoreFromNiche(
  storeId: string,
  nicheId: string
): Promise<SeedResult> {
  const cleared = await clearStoreProducts(storeId)
  if (!cleared) {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: 'Falha ao limpar produtos existentes'
    }
  }

  return seedStoreFromNiche(storeId, nicheId)
}
