/**
 * Guards para verificar acesso a features por plano
 */

import { PLANS, FEATURE_REQUIREMENTS, type PlanType, type TenantSubscription } from './types'

export interface FeatureCheckResult {
  allowed: boolean
  reason?: string
  requiredPlan?: PlanType
}

/**
 * Verifica se o tenant tem acesso a uma feature
 */
export function canAccessFeature(
  subscription: TenantSubscription | null,
  featureId: string
): FeatureCheckResult {
  // Sem subscription = plano free
  const plan = subscription?.plan || 'free'
  const status = subscription?.status || 'active'

  // Verificar se subscription está ativa
  if (status === 'expired' || status === 'cancelled') {
    return {
      allowed: false,
      reason: 'Sua assinatura expirou. Renove para continuar usando.',
    }
  }

  // Verificar se feature requer plano específico
  const requiredPlans = FEATURE_REQUIREMENTS[featureId]
  
  if (!requiredPlans) {
    // Feature não tem restrição = disponível para todos
    return { allowed: true }
  }

  if (requiredPlans.includes(plan)) {
    return { allowed: true }
  }

  // Encontrar o menor plano necessário
  const requiredPlan = requiredPlans[0]

  return {
    allowed: false,
    reason: `Esta funcionalidade requer o plano ${PLANS[requiredPlan].name}`,
    requiredPlan,
  }
}

/**
 * Verifica se o tenant atingiu o limite de lojas
 */
export function canCreateStore(
  subscription: TenantSubscription | null,
  currentStoreCount: number
): FeatureCheckResult {
  const plan = subscription?.plan || 'free'
  const limits = PLANS[plan].limits

  if (limits.maxStores === 0) {
    // 0 = ilimitado
    return { allowed: true }
  }

  if (currentStoreCount >= limits.maxStores) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limits.maxStores} loja(s) do plano ${PLANS[plan].name}`,
      requiredPlan: plan === 'free' ? 'pro' : 'enterprise',
    }
  }

  return { allowed: true }
}

/**
 * Verifica se a loja atingiu o limite de produtos
 */
export function canCreateProduct(
  subscription: TenantSubscription | null,
  currentProductCount: number
): FeatureCheckResult {
  const plan = subscription?.plan || 'free'
  const limits = PLANS[plan].limits

  if (limits.maxProducts === 0) {
    return { allowed: true }
  }

  if (currentProductCount >= limits.maxProducts) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limits.maxProducts} produtos do plano ${PLANS[plan].name}`,
      requiredPlan: plan === 'free' ? 'pro' : 'enterprise',
    }
  }

  return { allowed: true }
}

/**
 * Verifica se a loja atingiu o limite de usuários
 */
export function canAddUser(
  subscription: TenantSubscription | null,
  currentUserCount: number
): FeatureCheckResult {
  const plan = subscription?.plan || 'free'
  const limits = PLANS[plan].limits

  if (limits.maxUsers === 0) {
    return { allowed: true }
  }

  if (currentUserCount >= limits.maxUsers) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limits.maxUsers} usuários do plano ${PLANS[plan].name}`,
      requiredPlan: plan === 'free' ? 'pro' : 'enterprise',
    }
  }

  return { allowed: true }
}
