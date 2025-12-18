import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StoreFront } from '@/modules/store/components/public'
import { safeParseTheme } from '@/modules/store/utils'
import { mergeWithDefaults } from '@/modules/store/types'
import { getStoreStatus } from '@/modules/store/utils/storeHours'
import type { StoreWithSettings, BusinessHour } from '@/modules/store'
import { mockStoreData, mockCategories, mockProducts } from '@/data/mock-store'

// CRÍTICO: Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * PÁGINA PÚBLICA DO CARDÁPIO
 * 
 * Fluxo: 
 * 1. Busca loja pelo slug
 * 2. Busca categorias e produtos
 * 3. Lê menu_theme do banco (salvo pela página de Aparência)
 * 4. Renderiza StoreFront com o layout correto
 */
export default async function MenuPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  // 1. Buscar loja pelo slug (incluindo dados de agendamento)
  let { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select(`
      *,
      tenants!inner(timezone)
    `)
    .eq('slug', params.slug)
    .single()

  // Fallback to mock data if database connection fails or store not found
  let categories = []
  let products = []

  if (storeError || !storeData) {
    if (params.slug === 'acai-sabor-real') {
        storeData = mockStoreData as any;
        storeError = null;
        console.log('Using mock data for acai-sabor-real');
    } else {
        notFound()
    }
  }

  // 2. Buscar categorias e produtos (SEM filtro is_active para garantir que apareçam)
  if (storeData.id === 'mock-store-id') {
      categories = mockCategories;
      products = mockProducts;
  } else {
      const [categoriesResult, productsResult] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .order('sort_order', { ascending: true })
      ])
      categories = categoriesResult.data || []
      products = productsResult.data || []
  }
  
  // DEBUG: Log para verificar produtos
  console.log('=== PRODUTOS DEBUG ===')
  console.log('Total categorias:', categories.length || 0)
  console.log('Total produtos:', products.length || 0)
  console.log('Produtos:', products.map((p: any) => ({ name: p.name, is_active: p.is_active })))
  console.log('======================')

  // 3. Parse do tema (CRÍTICO: ler de menu_theme)
  const rawTheme = (storeData as any).menu_theme
  const parsedTheme = safeParseTheme(rawTheme)
  
  // DEBUG: Log para verificar o tema
  console.log('=== TEMA DO CARDÁPIO ===')
  console.log('Slug:', params.slug)
  console.log('Raw theme:', JSON.stringify(rawTheme))
  console.log('Parsed layout:', parsedTheme.layout)
  console.log('========================')

  // 4. Montar StoreWithSettings
  const parsedSettings = mergeWithDefaults((storeData as any)?.settings || null)
  
  const storeWithSettings: StoreWithSettings = {
    ...storeData,
    parsedSettings,
    parsedTheme
  } as StoreWithSettings

  // 5. Calcular status da loja (aberta/fechada)
  const businessHours: BusinessHour[] = parsedSettings.businessHours || []
  const timezone = ((storeData as any).tenants as any)?.timezone || 'America/Sao_Paulo'
  const schedulingEnabled = (storeData as any).scheduling_enabled || false
  
  let storeStatus = undefined
  if (businessHours.length > 0) {
    const status = getStoreStatus(businessHours, timezone)
    storeStatus = {
      isOpen: status.isOpen,
      nextOpenFormatted: status.nextOpenFormatted,
      schedulingEnabled,
    }
  }

  // 5. Formatar categorias com produtos
  const formattedCategories = categories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color || null,
    products: products
      .filter((p: any) => p.category_id === cat.id)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.base_price,
        image_url: p.image_url,
        is_available: p.is_active
      }))
  })).filter((cat: any) => cat.products.length > 0)

  // Fallback se não tiver categorias
  const displayCategories = formattedCategories.length > 0 
    ? formattedCategories 
    : products.length > 0
      ? [{
          id: 'all',
          name: 'Cardápio',
          color: null,
          products: products.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.base_price,
            image_url: p.image_url,
            is_available: p.is_active
          }))
        }]
      : []

  // 7. Renderizar StoreFront com isOwner=true para mostrar botão de emergência
  return (
    <StoreFront 
      store={storeWithSettings}
      categories={displayCategories}
      isOwner={true}
      storeStatus={storeStatus}
    />
  )
}
