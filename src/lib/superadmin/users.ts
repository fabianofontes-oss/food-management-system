'use server'

import { createClient } from '@/lib/supabase/server'

export interface SystemUser {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
  stores: {
    store_id: string
    store_name: string
    store_slug: string
    tenant_name: string
    role: string
  }[]
}

/**
 * Busca todos os usuários do sistema (tabela public.users)
 * com suas associações a lojas
 */
export async function getSystemUsers(): Promise<SystemUser[]> {
  const supabase = await createClient()

  // Buscar usuários
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Erro ao buscar usuários:', usersError)
    throw new Error('Erro ao carregar usuários')
  }

  if (!users || users.length === 0) {
    return []
  }

  // Buscar store_users com stores e tenants
  const { data: storeUsers, error: storeUsersError } = await supabase
    .from('store_users')
    .select(`
      user_id,
      role,
      store:stores(
        id,
        name,
        slug,
        tenant:tenants(name)
      )
    `)

  if (storeUsersError) {
    console.error('Erro ao buscar store_users:', storeUsersError)
  }

  // Mapear usuários com suas lojas
  const usersWithStores: SystemUser[] = users.map((user: any) => {
    const userStores = (storeUsers || [])
      .filter((su: any) => su.user_id === user.id)
      .map((su: any) => ({
        store_id: su.store?.id || '',
        store_name: su.store?.name || 'Loja desconhecida',
        store_slug: su.store?.slug || '',
        tenant_name: su.store?.tenant?.name || 'Tenant desconhecido',
        role: su.role || 'UNKNOWN'
      }))

    return {
      id: user.id,
      name: user.name || user.email?.split('@')[0] || 'Usuário',
      email: user.email || '',
      created_at: user.created_at,
      updated_at: user.updated_at,
      stores: userStores
    }
  })

  return usersWithStores
}

/**
 * Busca estatísticas de usuários
 */
export async function getUserStats(): Promise<{
  totalUsers: number
  usersWithStores: number
  roleDistribution: Record<string, number>
}> {
  const supabase = await createClient()

  // Total de usuários
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Usuários com lojas
  const { data: storeUsers } = await supabase
    .from('store_users')
    .select('user_id, role')

  const uniqueUsersWithStores = new Set(storeUsers?.map((su: any) => su.user_id) || []).size
  
  // Distribuição de roles
  const roleDistribution: Record<string, number> = {}
  storeUsers?.forEach((su: any) => {
    roleDistribution[su.role] = (roleDistribution[su.role] || 0) + 1
  })

  return {
    totalUsers: totalUsers || 0,
    usersWithStores: uniqueUsersWithStores,
    roleDistribution
  }
}

/**
 * Deleta um usuário do sistema
 * ATENÇÃO: Isso também remove da tabela auth.users via cascade
 */
export async function deleteSystemUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Primeiro remove da tabela users (vai cascadear para store_users)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Erro ao deletar usuário:', error)
    return { success: false, error: 'Erro ao deletar usuário' }
  }

  return { success: true }
}
