'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '@/lib/auth/super-admin'

/**
 * Vincula um usuário como OWNER de uma loja
 * Apenas Super Admins podem executar esta ação
 */
export async function assignStoreOwnerAction(
  storeId: string, 
  userEmail: string
): Promise<{ success: boolean; error?: string; storeSlug?: string }> {
  const supabase = await createClient()

  // Verificar se o usuário atual é Super Admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  if (!isSuperAdmin(currentUser.email)) {
    return { success: false, error: 'Acesso não autorizado - apenas Super Admins' }
  }

  try {
    // Usar o ID do usuário atual (Super Admin logado)
    const userId = currentUser.id

    // Verificar se existe na tabela public.users, se não, criar
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingUser) {
      // Criar registro em public.users
      await supabase
        .from('users')
        .insert({
          id: userId,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Super Admin'
        })
    }

    // 2. Buscar dados da loja para retornar o slug
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, slug, name')
      .eq('id', storeId)
      .single()

    if (storeError || !storeData) {
      return { success: false, error: 'Loja não encontrada' }
    }

    // 3. Verificar se já existe vínculo em store_users
    const { data: existingLink, error: linkError } = await supabase
      .from('store_users')
      .select('id, role')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingLink) {
      // Atualizar role para OWNER
      const { error: updateError } = await supabase
        .from('store_users')
        .update({ role: 'OWNER' })
        .eq('id', existingLink.id)

      if (updateError) {
        console.error('Erro ao atualizar vínculo:', updateError)
        return { success: false, error: 'Erro ao atualizar permissão' }
      }
    } else {
      // Inserir novo vínculo como OWNER
      const { error: insertError } = await supabase
        .from('store_users')
        .insert({
          store_id: storeId,
          user_id: userId,
          role: 'OWNER'
        })

      if (insertError) {
        console.error('Erro ao criar vínculo:', insertError)
        return { success: false, error: 'Erro ao criar vínculo com a loja' }
      }
    }

    // 4. Revalidar caches
    revalidatePath('/admin/stores')
    revalidatePath(`/${storeData.slug}/dashboard`)

    return { 
      success: true, 
      storeSlug: storeData.slug 
    }
  } catch (error: any) {
    console.error('Erro em assignStoreOwnerAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Remove vínculo de um usuário com uma loja
 */
export async function removeStoreUserAction(
  storeId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar se o usuário atual é Super Admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser || !isSuperAdmin(currentUser.email)) {
    return { success: false, error: 'Acesso não autorizado' }
  }

  try {
    const { error } = await supabase
      .from('store_users')
      .delete()
      .eq('store_id', storeId)
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao remover vínculo:', error)
      return { success: false, error: 'Erro ao remover vínculo' }
    }

    revalidatePath('/admin/stores')
    return { success: true }
  } catch (error: any) {
    console.error('Erro em removeStoreUserAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Exclui uma loja e todos os dados relacionados
 * Apenas Super Admins podem executar esta ação
 */
export async function deleteStoreAction(
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar se o usuário atual é Super Admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser || !isSuperAdmin(currentUser.email)) {
    return { success: false, error: 'Acesso não autorizado - apenas Super Admins' }
  }

  try {
    // O banco tem ON DELETE CASCADE, então excluir a loja exclui tudo relacionado
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao excluir loja:', error)
      return { success: false, error: `Erro ao excluir loja: ${error.message}` }
    }

    revalidatePath('/admin/stores')
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    console.error('Erro em deleteStoreAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Exclui um tenant e todas as lojas relacionadas
 * Apenas Super Admins podem executar esta ação
 */
export async function deleteTenantAction(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar se o usuário atual é Super Admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser || !isSuperAdmin(currentUser.email)) {
    return { success: false, error: 'Acesso não autorizado - apenas Super Admins' }
  }

  try {
    // O banco tem ON DELETE CASCADE, então excluir o tenant exclui todas as lojas
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) {
      console.error('Erro ao excluir tenant:', error)
      return { success: false, error: `Erro ao excluir tenant: ${error.message}` }
    }

    revalidatePath('/admin/tenants')
    revalidatePath('/admin/stores')
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    console.error('Erro em deleteTenantAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}
