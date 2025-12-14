import { createClient } from '@/lib/supabase/client'
import type { StoreSettings, DEFAULT_STORE_SETTINGS } from '@/types/settings'

export interface Store {
  id: string
  tenant_id: string
  name: string
  slug: string
  niche: string
  mode: string
  is_active: boolean
  logo_url: string | null
  banner_url: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  city?: string
  state?: string
  cep?: string
  email?: string
  description?: string
  latitude: number | null
  longitude: number | null
  settings: any
  created_at: string
  updated_at: string
}

class StoreService {
  private supabase = createClient()

  async getBySlug(slug: string): Promise<Store | null> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Erro ao buscar loja:', error)
      return null
    }

    return data
  }

  async getById(id: string): Promise<Store | null> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar loja:', error)
      return null
    }

    return data
  }

  async update(id: string, data: Partial<Store>): Promise<boolean> {
    const { error } = await this.supabase
      .from('stores')
      .update(data)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar loja:', error)
      return false
    }

    return true
  }

  async updateSettings(id: string, settings: Partial<StoreSettings>): Promise<boolean> {
    const store = await this.getById(id)
    if (!store) return false

    const currentSettings = store.settings || {}
    const newSettings = { ...currentSettings, ...settings }

    return this.update(id, { settings: newSettings })
  }

  async getSettings(id: string): Promise<any | null> {
    const store = await this.getById(id)
    return store?.settings || null
  }
}

export const storeService = new StoreService()
