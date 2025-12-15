'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '@/lib/auth/super-admin'

const DEMO_SLUG = 'loja-demo'
const DEMO_NAME = 'Loja Demo'

const DEMO_CATEGORIES = [
  { name: 'Lanches', sort_order: 0 },
  { name: 'Bebidas', sort_order: 1 },
  { name: 'Sobremesas', sort_order: 2 },
]

const DEMO_PRODUCTS = [
  { name: 'X-Burguer Especial', description: 'Hambúrguer artesanal com queijo cheddar, bacon crocante e molho especial', price: 28.90, category_index: 0 },
  { name: 'X-Salada', description: 'Hambúrguer com alface, tomate, queijo e maionese caseira', price: 22.90, category_index: 0 },
  { name: 'Coca-Cola 350ml', description: 'Refrigerante gelado', price: 6.00, category_index: 1 },
  { name: 'Suco Natural 500ml', description: 'Laranja, limão ou maracujá', price: 9.90, category_index: 1 },
  { name: 'Petit Gateau', description: 'Bolo de chocolate com sorvete de creme e calda quente', price: 19.90, category_index: 2 },
]

const DEMO_THEME = {
  layout: 'classic' as const,
  colors: {
    primary: '#ea1d2c',
    background: '#f4f4f5',
    header: '#ffffff'
  },
  display: {
    showBanner: true,
    showLogo: true,
    showDescription: true,
    showSearch: true,
    showCategories: true
  }
}

/**
 * Reseta a loja demo com dados de exemplo
 * Apenas Super Admins podem executar
 */
export async function resetDemoStoreAction(): Promise<{ 
  success: boolean
  slug?: string
  error?: string 
}> {
  const supabase = await createClient()

  // Verificar se é Super Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdmin(user.email)) {
    return { success: false, error: 'Acesso não autorizado' }
  }

  try {
    // 1. Verificar se existe tenant padrão ou criar
    let tenantId: string

    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'demo-tenant')
      .single()

    if (existingTenant) {
      tenantId = existingTenant.id
    } else {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Demo Tenant',
          slug: 'demo-tenant',
          owner_id: user.id
        })
        .select()
        .single()

      if (tenantError) throw tenantError
      tenantId = newTenant.id
    }

    // 2. Verificar se existe loja demo ou criar
    let storeId: string

    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', DEMO_SLUG)
      .single()

    if (existingStore) {
      storeId = existingStore.id

      // Limpar dados antigos
      await supabase.from('products').delete().eq('store_id', storeId)
      await supabase.from('categories').delete().eq('store_id', storeId)

      // Atualizar loja
      await supabase
        .from('stores')
        .update({
          name: DEMO_NAME,
          theme: DEMO_THEME,
          is_active: true
        })
        .eq('id', storeId)
    } else {
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: DEMO_NAME,
          slug: DEMO_SLUG,
          tenant_id: tenantId,
          niche: 'burger',
          mode: 'store',
          theme: DEMO_THEME,
          is_active: true
        })
        .select()
        .single()

      if (storeError) throw storeError
      storeId = newStore.id
    }

    // 3. Vincular usuário como OWNER
    const { data: existingLink } = await supabase
      .from('store_users')
      .select('id')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .single()

    if (!existingLink) {
      await supabase
        .from('store_users')
        .insert({
          store_id: storeId,
          user_id: user.id,
          role: 'OWNER'
        })
    }

    // 4. Criar categorias
    const categoryIds: string[] = []
    for (const cat of DEMO_CATEGORIES) {
      const { data: category, error: catError } = await supabase
        .from('categories')
        .insert({
          store_id: storeId,
          name: cat.name,
          sort_order: cat.sort_order
        })
        .select()
        .single()

      if (catError) throw catError
      categoryIds.push(category.id)
    }

    // 5. Criar produtos
    for (const prod of DEMO_PRODUCTS) {
      const { error: prodError } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          category_id: categoryIds[prod.category_index],
          name: prod.name,
          description: prod.description,
          price: prod.price,
          is_active: true
        })

      if (prodError) throw prodError
    }

    // 6. Revalidar caches
    revalidatePath('/admin')
    revalidatePath(`/${DEMO_SLUG}`)
    revalidatePath(`/${DEMO_SLUG}/dashboard`)

    return { success: true, slug: DEMO_SLUG }

  } catch (error: any) {
    console.error('Erro ao resetar loja demo:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}
