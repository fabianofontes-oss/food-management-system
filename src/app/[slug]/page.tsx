import { notFound } from 'next/navigation'
import { getStoreBySlug, getStoreCategories, getStoreProducts } from '@/lib/actions/menu'
import { MenuClient } from './menu-client'
import { createClient } from '@/lib/supabase/server'
import type { MenuTheme, PublicProfile } from '@/types/menu'

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
  const { data: storeTheme } = await supabase
    .from('stores')
    .select('public_profile, menu_theme')
    .eq('id', store.id)
    .single()

  const publicProfile = (storeTheme?.public_profile ?? null) as PublicProfile | null
  const menuTheme = (storeTheme?.menu_theme ?? null) as MenuTheme | null

  return (
    <MenuClient 
      store={store} 
      categories={categories} 
      products={products}
      publicProfile={publicProfile}
      menuTheme={menuTheme}
    />
  )
}
