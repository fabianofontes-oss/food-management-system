'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * ETAPA 5B - Billing Enforcement P0
 * 
 * Sistema de enforcement que bloqueia tenants com billing inválido
 * de acessar o dashboard e fazer mutações.
 */

export type BillingStatus = 
  | 'active'           // Tudo OK, pode usar
  | 'trial'            // Em trial válido
  | 'trial_expired'    // Trial expirou
  | 'past_due'         // Pagamento atrasado (0-3 dias grace period)
  | 'suspended'        // Suspenso por falta de pagamento
  | 'cancelled'        // Cancelado pelo cliente
  | 'unknown'          // Sem informação de billing

export interface BillingCheckResult {
  allowed: boolean
  status: BillingStatus
  tenantId: string
  tenantName?: string
  trialEndsAt?: string
  graceDaysRemaining?: number
  redirectTo?: string
  message?: string
}

/**
 * Verifica o status de billing de um tenant
 * 
 * @param tenantId - ID do tenant a verificar
 * @returns Resultado da verificação com status e se está permitido
 */
export async function checkBillingStatus(tenantId: string): Promise<BillingCheckResult> {
  const supabase = await createClient()

  try {
    // Buscar tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status, trial_ends_at')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return {
        allowed: false,
        status: 'unknown',
        tenantId,
        message: 'Tenant não encontrado',
        redirectTo: '/unauthorized'
      }
    }

    const now = new Date()
    const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null

    // 1. Verificar se está cancelado
    if (tenant.status === 'cancelled') {
      return {
        allowed: false,
        status: 'cancelled',
        tenantId,
        tenantName: tenant.name,
        message: 'Conta cancelada',
        redirectTo: '/billing/cancelled'
      }
    }

    // 2. Verificar se está suspenso
    if (tenant.status === 'suspended') {
      return {
        allowed: false,
        status: 'suspended',
        tenantId,
        tenantName: tenant.name,
        message: 'Conta suspensa por falta de pagamento',
        redirectTo: '/billing/suspended'
      }
    }

    // 3. Verificar trial
    if (tenant.status === 'trial') {
      if (!trialEndsAt) {
        // Trial sem data de expiração (erro de dados)
        return {
          allowed: true,
          status: 'trial',
          tenantId,
          tenantName: tenant.name,
          message: 'Trial ativo (sem data de expiração)'
        }
      }

      if (now > trialEndsAt) {
        // Trial expirado
        return {
          allowed: false,
          status: 'trial_expired',
          tenantId,
          tenantName: tenant.name,
          trialEndsAt: tenant.trial_ends_at,
          message: 'Trial expirado',
          redirectTo: '/billing/trial-expired'
        }
      }

      // Trial válido
      const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        allowed: true,
        status: 'trial',
        tenantId,
        tenantName: tenant.name,
        trialEndsAt: tenant.trial_ends_at,
        graceDaysRemaining: daysRemaining,
        message: `Trial válido (${daysRemaining} dias restantes)`
      }
    }

    // 4. Verificar se está ativo
    if (tenant.status === 'active') {
      // Buscar subscription para verificar se está em dia
      const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('status, current_period_end')
        .eq('tenant_id', tenantId)
        .single()

      if (subscription) {
        const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null

        // Verificar se está past_due
        if (subscription.status === 'past_due') {
          const gracePeriodDays = 3
          const gracePeriodEnd = periodEnd ? new Date(periodEnd.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000) : null

          if (gracePeriodEnd && now > gracePeriodEnd) {
            // Grace period expirado, deve estar suspenso
            return {
              allowed: false,
              status: 'suspended',
              tenantId,
              tenantName: tenant.name,
              message: 'Pagamento atrasado - grace period expirado',
              redirectTo: '/billing/overdue'
            }
          }

          // Ainda em grace period
          const daysRemaining = gracePeriodEnd 
            ? Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0

          return {
            allowed: true,
            status: 'past_due',
            tenantId,
            tenantName: tenant.name,
            graceDaysRemaining: daysRemaining,
            message: `Pagamento atrasado - ${daysRemaining} dias de grace period restantes`,
            redirectTo: undefined // Permite acesso mas pode mostrar banner
          }
        }

        // Subscription ativa
        return {
          allowed: true,
          status: 'active',
          tenantId,
          tenantName: tenant.name,
          message: 'Conta ativa'
        }
      }

      // Ativo mas sem subscription (pode ser plano gratuito)
      return {
        allowed: true,
        status: 'active',
        tenantId,
        tenantName: tenant.name,
        message: 'Conta ativa (sem subscription)'
      }
    }

    // Status desconhecido
    return {
      allowed: false,
      status: 'unknown',
      tenantId,
      tenantName: tenant.name,
      message: `Status desconhecido: ${tenant.status}`,
      redirectTo: '/unauthorized'
    }
  } catch (error) {
    console.error('Erro ao verificar billing status:', error)
    return {
      allowed: false,
      status: 'unknown',
      tenantId,
      message: 'Erro ao verificar status de billing',
      redirectTo: '/error'
    }
  }
}

/**
 * Enforcement para Middleware
 * Bloqueia acesso a rotas protegidas se billing não estiver OK
 * 
 * @param tenantId - ID do tenant
 * @param request - Request object (para extrair pathname)
 * @returns Resultado com allowed e redirectTo
 */
export async function enforceBillingInMiddleware(
  tenantId: string,
  request: Request
): Promise<BillingCheckResult> {
  const result = await checkBillingStatus(tenantId)

  // Se não está permitido, já tem redirectTo definido
  if (!result.allowed) {
    return result
  }

  // Se está em past_due, permitir acesso mas pode mostrar banner
  // (não bloquear no middleware, apenas avisar na UI)
  return result
}

/**
 * Enforcement para Server Actions
 * Bloqueia mutações (create/update/delete) se billing não estiver OK
 * 
 * @param tenantId - ID do tenant
 * @returns Resultado com allowed e message
 */
export async function enforceBillingInAction(
  tenantId: string
): Promise<BillingCheckResult> {
  const result = await checkBillingStatus(tenantId)

  // Bloquear qualquer mutação se não estiver allowed
  if (!result.allowed) {
    return {
      ...result,
      message: result.message || 'Ação bloqueada: billing inválido'
    }
  }

  // Se está em past_due, PERMITIR mutações (grace period)
  // mas pode logar warning
  if (result.status === 'past_due') {
    console.warn(`[BILLING] Tenant ${tenantId} em past_due executando mutação (grace period: ${result.graceDaysRemaining} dias)`)
  }

  return result
}

/**
 * Helper para usar em Server Actions
 * Lança erro se billing não estiver OK
 * 
 * @param tenantId - ID do tenant
 * @throws Error se billing não estiver OK
 */
export async function assertBillingOk(tenantId: string): Promise<void> {
  const result = await enforceBillingInAction(tenantId)

  if (!result.allowed) {
    throw new Error(result.message || 'Billing inválido')
  }
}

/**
 * Buscar tenant_id a partir de store_id
 * Helper para usar quando só temos store_id
 * 
 * @param storeId - ID da store
 * @returns tenant_id ou null
 */
export async function getTenantIdFromStore(storeId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('tenant_id')
    .eq('id', storeId)
    .single()

  return store?.tenant_id || null
}
