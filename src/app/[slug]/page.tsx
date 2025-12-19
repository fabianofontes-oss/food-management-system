/**
 * Página do Cardápio Público (Minisite)
 * Página compacta que usa o módulo minisite
 */

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { MinisiteRepository } from '@/modules/minisite/repository'
import { StoreFront, type MinisiteData } from '@/modules/minisite'

interface PageProps {
  params: { slug: string }
}

export default async function MinisitePage({ params }: PageProps) {
  const { slug } = params

  // Buscar loja e tema
  const storeData = await MinisiteRepository.getStoreBySlug(slug)
  
  if (!storeData) {
    notFound()
  }

  // Buscar categorias com produtos
  const categories = await MinisiteRepository.getCategoriesWithProducts(storeData.store.id)

  // Montar dados do minisite
  const data: MinisiteData = {
    store: storeData.store,
    theme: storeData.theme,
    categories,
  }

  return <StoreFront data={data} />
}

export async function generateMetadata({ params }: PageProps) {
  const storeData = await MinisiteRepository.getStoreBySlug(params.slug)
  
  if (!storeData) {
    return { title: 'Loja não encontrada' }
  }

  return {
    title: `${storeData.store.name} - Cardápio`,
    description: `Confira o cardápio de ${storeData.store.name}`,
  }
}
