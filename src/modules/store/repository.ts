import { createClient } from '@/lib/supabase/client'
import type { StoreRow, StoreWithSettings, StoreSettings, MenuTheme } from './types'
import { mergeWithDefaults, DEFAULT_MENU_THEME } from './types'

const supabase = createClient()

export const StoreRepository = {
  /**
   * Busca uma loja pelo slug
   */
  async getBySlug(slug: string): Promise<StoreWithSettings | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Erro ao buscar loja por slug:', {
        message: error.message,
        code: error.code,
        slug
      })
      return null
    }

    return parseStoreWithSettings(data)
  },

  /**
   * Busca uma loja pelo ID
   */
  async getById(storeId: string): Promise<StoreWithSettings | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (error) {
      console.error('Erro ao buscar loja por ID:', {
        message: error.message,
        code: error.code,
        storeId
      })
      return null
    }

    return parseStoreWithSettings(data)
  },

  /**
   * Atualiza dados básicos da loja
   */
  async update(storeId: string, data: Partial<StoreRow>): Promise<boolean> {
    const { error } = await supabase
      .from('stores')
      .update(data)
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao atualizar loja:', {
        message: error.message,
        code: error.code,
        storeId
      })
      return false
    }

    return true
  },

  /**
   * Atualiza o JSON de configurações (merge com existente)
   */
  async updateSettings(storeId: string, newSettings: Partial<StoreSettings>): Promise<boolean> {
    // Primeiro busca as configs atuais
    const store = await this.getById(storeId)
    if (!store) return false

    // Faz merge das configs existentes (do campo raw settings) com as novas
    const currentSettings = (store.settings as Record<string, unknown>) || {}
    const mergedSettings = {
      ...currentSettings,
      ...newSettings
    }

    // Atualiza no banco
    const { error } = await supabase
      .from('stores')
      .update({ settings: mergedSettings })
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao atualizar settings:', {
        message: error.message,
        code: error.code,
        storeId
      })
      return false
    }

    return true
  },

  /**
   * Substitui completamente as configurações
   */
  async replaceSettings(storeId: string, settings: StoreSettings): Promise<boolean> {
    const { error } = await supabase
      .from('stores')
      .update({ settings })
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao substituir settings:', {
        message: error.message,
        code: error.code,
        storeId
      })
      return false
    }

    return true
  },

  /**
   * Busca apenas as configurações de uma loja
   */
  async getSettings(storeId: string): Promise<StoreSettings | null> {
    const store = await this.getById(storeId)
    return store?.parsedSettings || null
  },

  /**
   * Atualiza o tema do menu (Site Builder)
   */
  async updateMenuTheme(storeId: string, theme: MenuTheme): Promise<boolean> {
    const { error } = await supabase
      .from('stores')
      .update({ menu_theme: theme })
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao atualizar tema do menu:', {
        message: error.message,
        code: error.code,
        storeId
      })
      return false
    }

    return true
  },

  /**
   * Busca apenas o tema do menu
   */
  async getMenuTheme(storeId: string): Promise<MenuTheme | null> {
    const store = await this.getById(storeId)
    return store?.parsedTheme || null
  }
}

/**
 * Converte StoreRow para StoreWithSettings (parseia o JSON de settings e theme)
 */
function parseStoreWithSettings(store: StoreRow): StoreWithSettings {
  const rawSettings = store.settings as Partial<StoreSettings> | null
  const parsedSettings = mergeWithDefaults(rawSettings)
  
  // Parse do tema do menu (usa campo menu_theme se existir)
  const rawTheme = (store as Record<string, unknown>).menu_theme as Partial<MenuTheme> | null
  const parsedTheme = mergeThemeWithDefaults(rawTheme)

  return {
    ...store,
    parsedSettings,
    parsedTheme
  }
}

/**
 * Mescla tema parcial com valores padrão
 */
function mergeThemeWithDefaults(partial: Partial<MenuTheme> | null): MenuTheme {
  if (!partial) return DEFAULT_MENU_THEME

  return {
    layout: partial.layout || DEFAULT_MENU_THEME.layout,
    colors: {
      ...DEFAULT_MENU_THEME.colors,
      ...partial.colors
    },
    display: {
      ...DEFAULT_MENU_THEME.display,
      ...partial.display
    },
    bannerUrl: partial.bannerUrl ?? DEFAULT_MENU_THEME.bannerUrl
  }
}
