'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { mergeWithDefaults, DEFAULT_MENU_THEME } from './types'
import type { StoreWithSettings, StoreSettings, MenuTheme } from './types'

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

    // Revalidar cache para o site público atualizar
    if (slug) {
      revalidatePath(`/${slug}`)
      revalidatePath(`/${slug}/dashboard/appearance`)
    }
    revalidatePath('/[slug]', 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('Erro na updateMenuThemeAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}
