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
  if (!currentUser || !isSuperAdmin(currentUser.email)) {
    return { success: false, error: 'Acesso não autorizado' }
  }

  try {
    // 1. Buscar o user_id pelo email na tabela public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single()

    if (userError || !userData) {
      // Tentar criar o usuário se não existir
      // Isso é útil se o Super Admin ainda não tem registro em public.users
      const { data: authUser } = await supabase.auth.admin.getUserByEmail(userEmail)
      
      if (!authUser?.user) {
        return { success: false, error: `Usuário não encontrado: ${userEmail}` }
      }

      // Inserir na tabela users
      const { data: newUser, error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: userEmail,
          name: authUser.user.user_metadata?.name || userEmail.split('@')[0]
        })
        .select()
        .single()

      if (insertUserError) {
        console.error('Erro ao criar usuário:', insertUserError)
        // Continuar mesmo com erro - pode ser que o usuário já exista
      }
    }

    // Buscar novamente o usuário (agora deve existir)
    const { data: finalUser, error: finalUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (finalUserError || !finalUser) {
      return { success: false, error: 'Não foi possível localizar/criar o usuário' }
    }

    const userId = finalUser.id

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
