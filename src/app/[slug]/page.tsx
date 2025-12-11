import { notFound } from 'next/navigation'
import { getStoreBySlug, getStoreCategories, getStoreProducts } from '@/lib/actions/menu'
import { MenuClient } from './menu-client'

export default async function MenuPage({ params }: { params: { slug: string } }) {
  const store = await getStoreBySlug(params.slug)
  
  if (!store) {
    notFound()
  }

  const [categories, products] = await Promise.all([
    getStoreCategories(store.id),
    getStoreProducts(store.id),
  ])

  return <MenuClient store={store} categories={categories} products={products} />
}
