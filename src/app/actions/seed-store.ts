'use server'

import { createClient } from '@/lib/supabase/server'
import { seedStoreFromNiche, reseedStoreFromNiche, SeedResult } from '@/lib/seed-store'
import { revalidatePath } from 'next/cache'

export async function seedStoreAction(
  storeId: string,
  nicheId: string
): Promise<SeedResult> {
  const supabase = await createClient()

  // Verificar se usuário tem permissão na loja
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: 'Usuário não autenticado'
    }
  }

  // Verificar se é owner da loja
  const { data: member } = await supabase
    .from('store_members')
    .select('role')
    .eq('store_id', storeId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: 'Sem permissão para modificar esta loja'
    }
  }

  // Executar seed
  const result = await seedStoreFromNiche(storeId, nicheId)

  if (result.success) {
    // Revalidar cache das páginas
    revalidatePath(`/[slug]/dashboard/products`)
    revalidatePath(`/[slug]/dashboard`)
  }

  return result
}

export async function reseedStoreAction(
  storeId: string,
  nicheId: string
): Promise<SeedResult> {
  const supabase = await createClient()

  // Verificar se usuário tem permissão na loja
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: 'Usuário não autenticado'
    }
  }

  // Verificar se é owner da loja
  const { data: member } = await supabase
    .from('store_members')
    .select('role')
    .eq('store_id', storeId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    return {
      success: false,
      categoriesCreated: 0,
      productsCreated: 0,
      error: 'Sem permissão para modificar esta loja'
    }
  }

  // Executar reseed (limpa e popula novamente)
  const result = await reseedStoreFromNiche(storeId, nicheId)

  if (result.success) {
    revalidatePath(`/[slug]/dashboard/products`)
    revalidatePath(`/[slug]/dashboard`)
  }

  return result
}
