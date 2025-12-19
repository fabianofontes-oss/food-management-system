'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Sistema de Audit Log para SuperAdmin
 * 
 * SECURITY: Registra todas as ações administrativas críticas
 * em uma tabela append-only (sem UPDATE/DELETE via API)
 */

export interface AuditLogParams {
  action: string
  targetType: string
  targetId?: string
  targetName?: string
  metadata?: Record<string, any>
  request?: Request
}

/**
 * Registra uma ação administrativa no audit log
 * 
 * @param params - Parâmetros da ação a ser registrada
 */
export async function logAdminAction(params: AuditLogParams): Promise<void> {
  const supabase = await createClient()

  try {
    // 1. Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Audit log: usuário não autenticado', authError)
      return
    }

    // 2. Extrair IP e User-Agent do request (se disponível)
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (params.request) {
      ipAddress = params.request.headers.get('x-forwarded-for') || 
                  params.request.headers.get('x-real-ip') || 
                  null
      userAgent = params.request.headers.get('user-agent') || null
    }

    // 3. Inserir no audit log
    const { error: insertError } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId || null,
        target_name: params.targetName || null,
        metadata: params.metadata || null,
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (insertError) {
      console.error('Erro ao inserir audit log:', insertError)
    }
  } catch (error) {
    console.error('Erro ao registrar audit log:', error)
  }
}

/**
 * Registra uma ação de CREATE
 */
export async function logCreate(
  targetType: string,
  targetId: string,
  targetName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAdminAction({
    action: `create_${targetType}`,
    targetType,
    targetId,
    targetName,
    metadata
  })
}

/**
 * Registra uma ação de UPDATE
 */
export async function logUpdate(
  targetType: string,
  targetId: string,
  targetName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAdminAction({
    action: `update_${targetType}`,
    targetType,
    targetId,
    targetName,
    metadata
  })
}

/**
 * Registra uma ação de DELETE
 */
export async function logDelete(
  targetType: string,
  targetId: string,
  targetName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAdminAction({
    action: `delete_${targetType}`,
    targetType,
    targetId,
    targetName,
    metadata
  })
}

/**
 * Registra uma ação de SUSPEND
 */
export async function logSuspend(
  targetType: string,
  targetId: string,
  targetName: string,
  reason?: string
): Promise<void> {
  await logAdminAction({
    action: `suspend_${targetType}`,
    targetType,
    targetId,
    targetName,
    metadata: { reason }
  })
}

/**
 * Registra uma ação de CHANGE PLAN
 */
export async function logChangePlan(
  tenantId: string,
  tenantName: string,
  oldPlanId: string | null,
  newPlanId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAdminAction({
    action: 'change_tenant_plan',
    targetType: 'tenant',
    targetId: tenantId,
    targetName: tenantName,
    metadata: {
      old_plan_id: oldPlanId,
      new_plan_id: newPlanId,
      ...metadata
    }
  })
}

/**
 * Busca logs de auditoria (apenas para super admins)
 * 
 * @param filters - Filtros opcionais
 */
export async function getAuditLogs(filters?: {
  action?: string
  targetType?: string
  targetId?: string
  adminUserId?: string
  limit?: number
  offset?: number
}): Promise<any[]> {
  const supabase = await createClient()

  let query = supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.action) {
    query = query.eq('action', filters.action)
  }

  if (filters?.targetType) {
    query = query.eq('target_type', filters.targetType)
  }

  if (filters?.targetId) {
    query = query.eq('target_id', filters.targetId)
  }

  if (filters?.adminUserId) {
    query = query.eq('admin_user_id', filters.adminUserId)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar audit logs:', error)
    return []
  }

  return data || []
}
