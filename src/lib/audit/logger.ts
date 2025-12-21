/**
 * Audit Logger
 * 
 * Sistema de auditoria que registra todas as ações críticas do sistema.
 * Executa em background e não bloqueia requests.
 */

import { createClient } from '@/lib/supabase/server'

export interface AuditLogParams {
  action: string
  resourceType: string
  resourceId?: string
  changes?: {
    before?: any
    after?: any
  }
  metadata?: Record<string, any>
}

/**
 * Registra uma ação de auditoria
 * 
 * @example
 * await logAudit({
 *   action: 'product.create',
 *   resourceType: 'product',
 *   resourceId: product.id,
 *   changes: { after: product },
 *   metadata: { storeId: product.store_id }
 * })
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  // Executar em background sem bloquear
  setImmediate(async () => {
    try {
      const supabase = await createClient()
      
      // Buscar informações do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      // Buscar tenant_id do usuário
      let tenantId: string | null = null
      if (user) {
        const { data: storeUser } = await supabase
          .from('store_users')
          .select('store_id, stores!inner(tenant_id)')
          .eq('user_id', user.id)
          .limit(1)
          .single()
        
        if (storeUser) {
          tenantId = (storeUser as any).stores?.tenant_id
        }
      }
      
      // Se não encontrou tenant_id e tem no metadata, usar de lá
      if (!tenantId && params.metadata?.tenantId) {
        tenantId = params.metadata.tenantId
      }
      
      // Se ainda não tem tenant_id, tentar buscar do storeId
      if (!tenantId && params.metadata?.storeId) {
        const { data: store } = await supabase
          .from('stores')
          .select('tenant_id')
          .eq('id', params.metadata.storeId)
          .single()
        
        if (store) {
          tenantId = store.tenant_id
        }
      }
      
      // Se não conseguiu tenant_id, não logar (requisito de multi-tenant)
      if (!tenantId) {
        console.warn('[Audit] Não foi possível determinar tenant_id, pulando log')
        return
      }
      
      // Inserir log de auditoria
      await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        user_id: user?.id || null,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId || null,
        changes: params.changes || null,
        ip_address: null, // TODO: Capturar do request
        user_agent: null, // TODO: Capturar do request
        metadata: params.metadata || null,
      })
      
    } catch (error) {
      // Ignorar erros silenciosamente (não deve quebrar a aplicação)
      console.error('[Audit] Erro ao registrar log:', error)
    }
  })
}

/**
 * Helper para logar criação de recurso
 */
export async function logCreate(
  resourceType: string,
  resourceId: string,
  data: any,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: `${resourceType}.create`,
    resourceType,
    resourceId,
    changes: { after: data },
    metadata,
  })
}

/**
 * Helper para logar atualização de recurso
 */
export async function logUpdate(
  resourceType: string,
  resourceId: string,
  before: any,
  after: any,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: `${resourceType}.update`,
    resourceType,
    resourceId,
    changes: { before, after },
    metadata,
  })
}

/**
 * Helper para logar deleção de recurso
 */
export async function logDelete(
  resourceType: string,
  resourceId: string,
  data: any,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: `${resourceType}.delete`,
    resourceType,
    resourceId,
    changes: { before: data },
    metadata,
  })
}

/**
 * Helper para logar mudança de status
 */
export async function logStatusChange(
  resourceType: string,
  resourceId: string,
  fromStatus: string,
  toStatus: string,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: `${resourceType}.status_change`,
    resourceType,
    resourceId,
    changes: {
      before: { status: fromStatus },
      after: { status: toStatus },
    },
    metadata,
  })
}

/**
 * Helper para logar ações financeiras
 */
export async function logFinancial(
  action: string,
  amount: number,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: `financial.${action}`,
    resourceType,
    resourceId,
    metadata: {
      ...metadata,
      amount,
    },
  })
}

/**
 * Helper para logar mudanças de configuração
 */
export async function logConfigChange(
  configKey: string,
  before: any,
  after: any,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: 'config.update',
    resourceType: 'config',
    resourceId: configKey,
    changes: { before, after },
    metadata,
  })
}

/**
 * Helper para logar ações de usuário
 */
export async function logUserAction(
  action: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: `user.${action}`,
    resourceType: 'user',
    resourceId: userId,
    metadata,
  })
}

/**
 * Helper para logar mudanças de plano
 */
export async function logPlanChange(
  tenantId: string,
  fromPlan: string,
  toPlan: string,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: 'subscription.plan_change',
    resourceType: 'subscription',
    changes: {
      before: { plan: fromPlan },
      after: { plan: toPlan },
    },
    metadata: {
      ...metadata,
      tenantId,
    },
  })
}

/**
 * Helper para logar exports de dados
 */
export async function logDataExport(
  exportType: string,
  recordCount: number,
  metadata?: Record<string, any>
): Promise<void> {
  return logAudit({
    action: 'data.export',
    resourceType: 'export',
    metadata: {
      ...metadata,
      exportType,
      recordCount,
    },
  })
}
