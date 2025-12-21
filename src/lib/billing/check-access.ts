/**
 * Billing Access Control
 * 
 * Verifica se tenant tem acesso ao sistema baseado em subscription.
 */

import { createClient } from '@/lib/supabase/server'

export interface SubscriptionAccessResult {
  active: boolean
  reason?: string
  gracePeriodEndsAt?: Date
  trialEndsAt?: Date
  status?: string
}

/**
 * Verifica se tenant tem acesso ativo ao sistema
 * 
 * Lógica:
 * - Status 'trialing' + trial_ends_at > now() = ATIVO
 * - Status 'active' = ATIVO
 * - Status 'past_due' + dentro grace period = ATIVO (com aviso)
 * - Outros = SUSPENSO
 */
export async function checkSubscriptionAccess(
  tenantId: string
): Promise<SubscriptionAccessResult> {
  try {
    const supabase = await createClient()

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at, current_period_end, grace_period_ends_at')
      .eq('tenant_id', tenantId)
      .single()

    if (!subscription) {
      return {
        active: false,
        reason: 'Nenhuma assinatura encontrada',
      }
    }

    const now = new Date()

    // Trial ativo
    if (subscription.status === 'trialing') {
      if (subscription.trial_ends_at && new Date(subscription.trial_ends_at) > now) {
        return {
          active: true,
          status: 'trialing',
          trialEndsAt: new Date(subscription.trial_ends_at),
        }
      }
      return {
        active: false,
        reason: 'Trial expirado',
        status: 'trial_expired',
      }
    }

    // Assinatura ativa
    if (subscription.status === 'active') {
      return {
        active: true,
        status: 'active',
      }
    }

    // Pagamento atrasado mas dentro do grace period
    if (subscription.status === 'past_due') {
      if (subscription.grace_period_ends_at && new Date(subscription.grace_period_ends_at) > now) {
        return {
          active: true,
          status: 'past_due',
          gracePeriodEndsAt: new Date(subscription.grace_period_ends_at),
          reason: 'Pagamento pendente - acesso temporário',
        }
      }
      return {
        active: false,
        reason: 'Pagamento atrasado - período de graça expirado',
        status: 'suspended',
      }
    }

    // Cancelada ou não paga
    return {
      active: false,
      reason: subscription.status === 'canceled' 
        ? 'Assinatura cancelada' 
        : 'Assinatura suspensa por falta de pagamento',
      status: subscription.status,
    }
  } catch (error) {
    console.error('[Billing] Erro ao verificar acesso:', error)
    return {
      active: false,
      reason: 'Erro ao verificar assinatura',
    }
  }
}

/**
 * Verifica se tenant pode usar uma feature específica
 */
export async function checkFeatureAccess(
  tenantId: string,
  featureKey: string
): Promise<{ allowed: boolean; limit?: number; used?: number }> {
  try {
    const supabase = await createClient()

    // Buscar subscription e plano
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, subscription_plans!inner(features, limits)')
      .eq('tenant_id', tenantId)
      .single()

    if (!subscription) {
      return { allowed: false }
    }

    const plan = (subscription as any).subscription_plans
    const features = Array.isArray(plan?.features) ? plan.features : []
    const limits = plan?.limits || {}

    // Verificar se feature está incluída no plano
    const hasFeature = features.includes(featureKey)

    if (!hasFeature) {
      return { allowed: false }
    }

    // Verificar limites (ex: orders_per_month)
    const limitKey = `${featureKey}_limit`
    const limit = limits[limitKey]

    if (limit === undefined || limit === -1) {
      // Sem limite ou ilimitado
      return { allowed: true }
    }

    // TODO: Buscar uso atual (ex: contar orders do mês)
    // Por enquanto, apenas retornar que tem acesso
    return { allowed: true, limit }
  } catch (error) {
    console.error('[Billing] Erro ao verificar feature:', error)
    return { allowed: false }
  }
}
