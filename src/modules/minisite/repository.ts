/**
 * Módulo Minisite - Repository
 * Apenas chamadas ao Supabase (Data Layer)
 */

import { createClient } from '@/lib/supabase/server'
import type { MinisiteStore, MinisiteCategory, MinisiteTheme } from './types'
import { DEFAULT_THEME, MinisiteThemeSchema } from './types'

export const MinisiteRepository = {
  /**
   * Busca loja pelo slug com tema parseado
   */
  async getStoreBySlug(slug: string): Promise<{ store: MinisiteStore; theme: MinisiteTheme } | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, slug, logo_url, banner_url, address, phone, whatsapp, menu_theme')
      .eq('slug', slug)
      .single()

    if (error || !data) return null

    const theme = this.parseTheme(data.menu_theme)
    
    return {
      store: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        address: data.address,
        phone: data.phone,
        whatsapp: data.whatsapp,
      },
      theme,
    }
  },

  /**
   * Busca categorias com produtos ativos
   */
  async getCategoriesWithProducts(storeId: string): Promise<MinisiteCategory[]> {
    const supabase = await createClient()

    const [categoriesRes, productsRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, color')
        .eq('store_id', storeId)
        .order('sort_order'),
      supabase
        .from('products')
        .select('id, name, description, base_price, image_url, is_active, category_id')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('sort_order'),
    ])

    const categories = categoriesRes.data || []
    const products = productsRes.data || []

    return categories
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        products: products
          .filter(p => p.category_id === cat.id)
          .map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.base_price,
            image_url: p.image_url,
            is_available: p.is_active,
          })),
      }))
      .filter(cat => cat.products.length > 0)
  },

  /**
   * Atualiza tema do minisite
   */
  async updateTheme(storeId: string, theme: MinisiteTheme): Promise<boolean> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('stores')
      .update({ menu_theme: theme })
      .eq('id', storeId)

    return !error
  },

  /**
   * Atualiza banner URL
   */
  async updateBannerUrl(storeId: string, bannerUrl: string | null): Promise<boolean> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('stores')
      .update({ banner_url: bannerUrl })
      .eq('id', storeId)

    return !error
  },

  /**
   * Parse seguro do tema com fallback para default
   */
  parseTheme(raw: unknown): MinisiteTheme {
    try {
      if (!raw || typeof raw !== 'object') return DEFAULT_THEME
      const result = MinisiteThemeSchema.safeParse(raw)
      if (result.success) return result.data
      return { ...DEFAULT_THEME, ...(raw as object) }
    } catch {
      return DEFAULT_THEME
    }
  },
}
