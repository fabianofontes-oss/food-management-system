import { notFound } from 'next/navigation'
import { getStoreBySlug, getStoreCategories, getStoreProducts } from '@/lib/actions/menu'
import { MenuClient } from './menu-client'
import { createClient } from '@/lib/supabase/server'
import { StoreFront } from '@/modules/store/components/public'
import { safeParseTheme, DEFAULT_THEME } from '@/modules/store/utils'
import { mergeWithDefaults } from '@/modules/store/types'
import type { MenuTheme, PublicProfile } from '@/types/menu'
import type { StoreWithSettings } from '@/modules/store'

export default async function MenuPage({ params }: { params: { slug: string } }) {
  const store = await getStoreBySlug(params.slug)
  
  if (!store) {
    notFound()
  }

  const [categories, products] = await Promise.all([
    getStoreCategories(store.id),
    getStoreProducts(store.id),
  ])

  const supabase = await createClient()
  const { data: storeData } = await supabase
    .from('stores')
    .select('*')
    .eq('id', store.id)
    .single()

  // BLINDAGEM: Parse seguro do tema
  const rawTheme = (storeData as any)?.menu_theme
  const parsedTheme = safeParseTheme(rawTheme)
  
  // Parse seguro dos settings
  const parsedSettings = mergeWithDefaults((storeData as any)?.settings || null)

  // Monta o StoreWithSettings completo
  const storeWithSettings: StoreWithSettings = {
    ...storeData,
    parsedSettings,
    parsedTheme
  } as StoreWithSettings

  // Formata categorias com produtos para o StoreFront
  const formattedCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    products: products
      .filter(p => p.category_id === cat.id)
      .map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.base_price,
        image_url: p.image_url,
        is_available: p.is_active
      }))
  })).filter(cat => cat.products.length > 0)

  // Fallback: Se não tiver categorias, agrupa todos produtos em "Cardápio"
  const displayCategories = formattedCategories.length > 0 
    ? formattedCategories 
    : [{
        id: 'all',
        name: 'Cardápio',
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.base_price,
          image_url: p.image_url,
          is_available: p.is_active
        }))
      }]

  return (
    <StoreFront 
      store={storeWithSettings}
      categories={displayCategories}
    />
  )
}
