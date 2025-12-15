'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { mergeWithDefaults, DEFAULT_MENU_THEME } from './types'
import type { StoreWithSettings, StoreSettings, MenuTheme } from './types'
import { NICHE_TEMPLATES } from '@/lib/templates/niche-data'

/**
 * Server Action para buscar loja pelo slug (para uso em Server Components)
 */
export async function getStoreAction(slug: string): Promise<{
  success: boolean
  data?: StoreWithSettings
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Erro ao buscar loja:', error)
      return { success: false, error: 'Loja não encontrada' }
    }

    // Parse settings com valores padrão
    const rawSettings = data.settings as Partial<StoreSettings> | null
    const parsedSettings = mergeWithDefaults(rawSettings)

    // Parse theme com valores padrão
    const rawTheme = (data as Record<string, unknown>).menu_theme as Partial<MenuTheme> | null
    const parsedTheme = rawTheme ? {
      layout: rawTheme.layout || DEFAULT_MENU_THEME.layout,
      colors: { ...DEFAULT_MENU_THEME.colors, ...rawTheme.colors },
      display: { ...DEFAULT_MENU_THEME.display, ...rawTheme.display },
      bannerUrl: rawTheme.bannerUrl ?? DEFAULT_MENU_THEME.bannerUrl
    } : DEFAULT_MENU_THEME

    const storeWithSettings: StoreWithSettings = {
      ...data,
      parsedSettings,
      parsedTheme
    }

    return { success: true, data: storeWithSettings }
  } catch (error: any) {
    console.error('Erro na getStoreAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Server Action para atualizar configurações da loja
 */
export async function updateStoreSettingsAction(
  storeId: string,
  settings: Partial<StoreSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Busca settings atuais
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Loja não encontrada' }
    }

    // Merge com settings existentes
    const currentSettings = (store.settings as Record<string, unknown>) || {}
    const mergedSettings = { ...currentSettings, ...settings }

    // Atualiza no banco
    const { error: updateError } = await supabase
      .from('stores')
      .update({ settings: mergedSettings })
      .eq('id', storeId)

    if (updateError) {
      console.error('Erro ao atualizar settings:', updateError)
      return { success: false, error: 'Erro ao salvar configurações' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro na updateStoreSettingsAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Server Action para atualizar dados básicos da loja
 */
export async function updateStoreAction(
  storeId: string,
  data: {
    name?: string
    description?: string
    logo_url?: string
    banner_url?: string
    phone?: string
    whatsapp?: string
    address?: string
    city?: string
    state?: string
    cep?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('stores')
      .update(data)
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao atualizar loja:', error)
      return { success: false, error: 'Erro ao salvar dados' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro na updateStoreAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Server Action para atualizar tema do menu (Site Builder)
 */
export async function updateMenuThemeAction(
  storeId: string,
  theme: MenuTheme,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('stores')
      .update({ menu_theme: theme })
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao atualizar tema do menu:', error)
      return { success: false, error: 'Erro ao salvar tema' }
    }

    // Revalidar TUDO para garantir que o cache seja limpo
    revalidatePath('/', 'layout')
    revalidatePath('/[slug]', 'page')
    
    if (slug) {
      revalidatePath(`/${slug}`)
      revalidatePath(`/${slug}/dashboard/appearance`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro na updateMenuThemeAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * 🧠 Kit Preguiçoso - Aplica template de nicho completo
 * 
 * Esta action faz a mágica:
 * 1. Arquiva categorias/produtos existentes
 * 2. Cria novas categorias e produtos do template
 * 3. Atualiza as cores do tema
 */
export async function applyNicheAction(
  storeId: string,
  nicheKey: string,
  slug?: string
): Promise<{
  success: boolean
  error?: string
  categoriesCreated?: number
  productsCreated?: number
}> {
  const supabase = await createClient()

  // Busca o template
  const template = NICHE_TEMPLATES[nicheKey]
  if (!template) {
    return { success: false, error: 'Template não encontrado' }
  }

  try {
    // 1. ARQUIVAR categorias existentes (desativar, não deletar)
    const { error: archiveError } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('store_id', storeId)

    if (archiveError) {
      console.error('Erro ao arquivar categorias:', archiveError)
      // Continua mesmo se falhar (pode não ter categorias)
    }

    // 2. ARQUIVAR produtos existentes
    const { error: archiveProductsError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('store_id', storeId)

    if (archiveProductsError) {
      console.error('Erro ao arquivar produtos:', archiveProductsError)
    }

    // 3. CRIAR novas categorias
    let categoriesCreated = 0
    let productsCreated = 0

    for (const category of template.categories) {
      // Inserir categoria
      const { data: newCategory, error: catError } = await supabase
        .from('categories')
        .insert({
          store_id: storeId,
          name: category.name,
          description: category.description,
          sort_order: category.sortOrder,
          is_active: true
        })
        .select('id')
        .single()

      if (catError) {
        console.error('Erro ao criar categoria:', catError)
        continue
      }

      categoriesCreated++

      // 4. CRIAR produtos da categoria
      for (const product of category.products) {
        const { error: prodError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            category_id: newCategory.id,
            name: product.name,
            description: product.description,
            price: product.price * 100, // Converter para centavos
            sort_order: product.sortOrder,
            is_active: true
          })

        if (prodError) {
          console.error('Erro ao criar produto:', prodError)
          continue
        }

        productsCreated++
      }
    }

    // 5. ATUALIZAR tema da loja com as cores do nicho
    const newTheme: MenuTheme = {
      layout: 'modern',
      colors: {
        primary: template.colors.primary,
        background: template.colors.background,
        header: '#ffffff'
      },
      display: {
        showBanner: true,
        showLogo: true,
        showSocial: true,
        showAddress: true,
        showSearch: true
      },
      bannerUrl: null
    }

    const { error: themeError } = await supabase
      .from('stores')
      .update({ 
        menu_theme: newTheme,
        niche: nicheKey as any
      })
      .eq('id', storeId)

    if (themeError) {
      console.error('Erro ao atualizar tema:', themeError)
    }

    // 6. Revalidar cache
    if (slug) {
      revalidatePath(`/${slug}`)
      revalidatePath(`/${slug}/dashboard`)
      revalidatePath(`/${slug}/dashboard/products`)
      revalidatePath(`/${slug}/dashboard/settings/niche`)
    }
    revalidatePath('/[slug]', 'layout')

    return {
      success: true,
      categoriesCreated,
      productsCreated
    }
  } catch (error: any) {
    console.error('Erro na applyNicheAction:', error)
    return { success: false, error: error.message || 'Erro ao aplicar template' }
  }
}
