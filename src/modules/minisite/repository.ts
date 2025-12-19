/**
 * Módulo Minisite - Repository
 * Apenas chamadas ao Supabase (Data Layer)
 */

import { createClient } from '@/lib/supabase/server'
import type { MinisiteStore, MinisiteCategory, MinisiteTheme } from './types'
import { DEFAULT_THEME, parseTheme } from './types'

export const MinisiteRepository = {
  /**
   * Busca loja pelo slug com tema parseado
   */
  async getStoreBySlug(slug: string): Promise<{ store: MinisiteStore; theme: MinisiteTheme } | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, slug, logo_url, banner_url, address, phone, whatsapp, menu_theme, status')
      .eq('slug', slug)
      .single()

    if (error || !data) return null
    
    // Bloquear lojas em DRAFT - só mostrar lojas publicadas
    if (data.status === 'draft') return null

    const theme = parseTheme(data.menu_theme)
    
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

    console.log('[getCategoriesWithProducts] storeId:', storeId)

    const [categoriesRes, productsRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, color')
        .eq('store_id', storeId)
        .order('name'),
      supabase
        .from('products')
        .select('id, name, description, base_price, image_url, is_active, category_id')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name'),
    ])

    console.log('[getCategoriesWithProducts] categoriesRes:', categoriesRes.error?.message, categoriesRes.data?.length)
    console.log('[getCategoriesWithProducts] productsRes:', productsRes.error?.message, productsRes.data?.length)

    const categories = categoriesRes.data || []
    const products = productsRes.data || []

    console.log('[getCategoriesWithProducts] categories:', categories.length, 'products:', products.length)

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
    
    console.log('[MinisiteRepository.updateTheme] storeId:', storeId)
    console.log('[MinisiteRepository.updateTheme] theme:', JSON.stringify(theme))
    
    const { data, error } = await supabase
      .from('stores')
      .update({ menu_theme: theme })
      .eq('id', storeId)
      .select('id, menu_theme')

    console.log('[MinisiteRepository.updateTheme] result:', data, error?.message)
    
    if (error) {
      console.error('[MinisiteRepository.updateTheme] ERROR:', error)
      return false
    }
    
    if (!data || data.length === 0) {
      console.error('[MinisiteRepository.updateTheme] Nenhuma linha atualizada - RLS ou storeId inválido')
      return false
    }

    return true
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

  }
