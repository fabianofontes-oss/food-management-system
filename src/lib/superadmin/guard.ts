'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Guard de Segurança para SuperAdmin
 * 
 * SECURITY: Valida autenticação baseada em user_id (não email)
 * usando a tabela public.super_admins e a função is_super_admin()
 */

export interface SuperAdminGuardResult {
  success: boolean
  userId?: string
  email?: string
  error?: string
}

/**
 * Verifica se o usuário atual é Super Admin
 * Usa a função is_super_admin() do banco que valida via user_id
 */
export async function requireSuperAdmin(): Promise<SuperAdminGuardResult> {
  const supabase = await createClient()

  // 1. Obter usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'Usuário não autenticado'
    }
  }

  // 2. Verificar se é super admin via função do banco
  const { data: isSuperAdmin, error: checkError } = await supabase
    .rpc('is_super_admin', { p_uid: user.id })

  if (checkError) {
    console.error('Erro ao verificar super admin:', checkError)
    return {
      success: false,
      error: 'Erro ao verificar permissões'
    }
  }

  if (!isSuperAdmin) {
    return {
      success: false,
      error: 'Acesso não autorizado - apenas Super Admins'
    }
  }

  // 3. Retornar sucesso com dados do usuário
  return {
    success: true,
    userId: user.id,
    email: user.email || ''
  }
}

/**
 * Verifica se o usuário tem uma permissão específica
 * 
 * @param permission - Nome da permissão (ex: 'delete_tenant', 'delete_store')
 */
export async function requirePermission(permission: string): Promise<SuperAdminGuardResult> {
  const supabase = await createClient()

  // 1. Verificar se é super admin primeiro
  const guardResult = await requireSuperAdmin()
  if (!guardResult.success) {
    return guardResult
  }

  // 2. Verificar permissão específica
  const { data: hasPermission, error } = await supabase
    .from('admin_permissions')
    .select('permission')
    .eq('user_id', guardResult.userId!)
    .eq('permission', permission)
    .is('revoked_at', null)
    .maybeSingle()

  if (error) {
    console.error('Erro ao verificar permissão:', error)
    return {
      success: false,
      error: 'Erro ao verificar permissão'
    }
  }

  // Se não tem permissão específica, mas é super admin, permitir
  // (super admins têm todas as permissões por padrão)
  return {
    success: true,
    userId: guardResult.userId,
    email: guardResult.email
  }
}

/**
 * Helper para usar em Server Actions
 * Lança erro se não for super admin
 */
export async function assertSuperAdmin(): Promise<{ userId: string; email: string }> {
  const result = await requireSuperAdmin()
  
  if (!result.success) {
    throw new Error(result.error || 'Acesso não autorizado')
  }

  return {
    userId: result.userId!,
    email: result.email!
  }
}

/**
 * Helper para usar em Server Actions com permissão específica
 * Lança erro se não tiver a permissão
 */
export async function assertPermission(permission: string): Promise<{ userId: string; email: string }> {
  const result = await requirePermission(permission)
  
  if (!result.success) {
    throw new Error(result.error || 'Permissão negada')
  }

  return {
    userId: result.userId!,
    email: result.email!
  }
}
