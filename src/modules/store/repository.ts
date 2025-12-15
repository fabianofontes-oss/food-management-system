import { createClient } from '@/lib/supabase/client'
import type { StoreRow, StoreWithSettings, StoreSettings } from './types'
import { mergeWithDefaults } from './types'

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
  }
}

/**
 * Converte StoreRow para StoreWithSettings (parseia o JSON de settings)
 */
function parseStoreWithSettings(store: StoreRow): StoreWithSettings {
  const rawSettings = store.settings as Partial<StoreSettings> | null
  const parsedSettings = mergeWithDefaults(rawSettings)

  return {
    ...store,
    parsedSettings
  }
}
