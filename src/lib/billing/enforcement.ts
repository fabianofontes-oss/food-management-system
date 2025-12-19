import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * ETAPA 5 - P0 Billing Enforcement
 * 
 * Sistema de enforcement em tempo real que bloqueia tenants com billing inválido
 * de acessar o dashboard e fazer mutações.
 */

export type BillingDecision =
  | { mode: 'ALLOW' }
  | { mode: 'READ_ONLY'; reason: 'PAST_DUE_GRACE'; banner: true }
  | { mode: 'BLOCK'; reason: 'TRIAL_EXPIRED' | 'SUSPENDED' | 'UNPAID'; redirectTo: string }

export type TenantBillingRow = {
  status: string | null
  trial_ends_at: string | null
  past_due_since: string | null
}

// Grace period para past_due (em dias)
const GRACE_DAYS = 3

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

/**
 * Decide o modo de billing baseado no status do tenant
 * 
 * Regras:
 * - active: ALLOW
 * - trialing (dentro do período): ALLOW
 * - trialing (expirado): BLOCK → /billing/trial-expired
 * - past_due (dentro do grace period): READ_ONLY (com banner)
 * - past_due (após grace period): BLOCK → /billing/overdue
 * - unpaid: BLOCK → /billing/overdue
 * - suspended: BLOCK → /billing/suspended
 * - default: BLOCK → /billing/overdue (seguro)
 */
export function decideBilling(t: TenantBillingRow): BillingDecision {
  const status = (t.status ?? '').toLowerCase()

  if (status === 'active') return { mode: 'ALLOW' }

  if (status === 'trialing' || status === 'trial') {
    if (!t.trial_ends_at) return { mode: 'BLOCK', reason: 'TRIAL_EXPIRED', redirectTo: '/billing/trial-expired' }
    const ends = new Date(t.trial_ends_at).getTime()
    if (Date.now() <= ends) return { mode: 'ALLOW' }
    return { mode: 'BLOCK', reason: 'TRIAL_EXPIRED', redirectTo: '/billing/trial-expired' }
  }

  if (status === 'past_due') {
    // Grace period: deixa entrar mas bloqueia mutações
    if (t.past_due_since) {
      const d = daysSince(t.past_due_since)
      if (d <= GRACE_DAYS) return { mode: 'READ_ONLY', reason: 'PAST_DUE_GRACE', banner: true }
    }
    return { mode: 'BLOCK', reason: 'UNPAID', redirectTo: '/billing/overdue' }
  }

  if (status === 'unpaid') return { mode: 'BLOCK', reason: 'UNPAID', redirectTo: '/billing/overdue' }
  if (status === 'suspended') return { mode: 'BLOCK', reason: 'SUSPENDED', redirectTo: '/billing/suspended' }

  // Default seguro: bloqueia
  return { mode: 'BLOCK', reason: 'UNPAID', redirectTo: '/billing/overdue' }
}

// ============================================================================
// COMPATIBILIDADE COM CÓDIGO EXISTENTE (ETAPA 5B)
// ============================================================================

export type BillingStatus = 
  | 'active'
  | 'trial'
  | 'trial_expired'
  | 'past_due'
  | 'suspended'
  | 'cancelled'
  | 'unknown'

export interface BillingCheckResult {
  allowed: boolean
  status: BillingStatus
  tenantId: string
  tenantName?: string
  trialEndsAt?: string
  graceDaysRemaining?: number
  redirectTo?: string
  message?: string
  mode?: 'ALLOW' | 'READ_ONLY' | 'BLOCK'
  decision?: BillingDecision
}

/**
 * Busca dados de billing do tenant e aplica decideBilling()
 * 
 * @param tenantId - ID do tenant a verificar
 * @returns Resultado da verificação com status e se está permitido
 */
export async function checkBillingStatus(tenantId: string): Promise<BillingCheckResult> {
  const supabase = await createClient()

  try {
    // Buscar tenant com campos necessários para decideBilling()
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status, trial_ends_at, past_due_since')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return {
        allowed: false,
        status: 'unknown',
        tenantId,
        message: 'Tenant não encontrado',
        redirectTo: '/unauthorized',
        mode: 'BLOCK'
      }
    }

    // Aplicar decideBilling()
    const decision = decideBilling({
      status: tenant.status,
      trial_ends_at: tenant.trial_ends_at,
      past_due_since: tenant.past_due_since
    })

    // Converter decision para BillingCheckResult (compatibilidade)
    if (decision.mode === 'ALLOW') {
      return {
        allowed: true,
        status: tenant.status === 'trial' || tenant.status === 'trialing' ? 'trial' : 'active',
        tenantId,
        tenantName: tenant.name,
        trialEndsAt: tenant.trial_ends_at,
        message: 'Conta ativa',
        mode: 'ALLOW',
        decision
      }
    }

    if (decision.mode === 'READ_ONLY') {
      const graceDays = tenant.past_due_since ? GRACE_DAYS - daysSince(tenant.past_due_since) : 0
      return {
        allowed: true, // Permite acesso mas bloqueia mutações
        status: 'past_due',
        tenantId,
        tenantName: tenant.name,
        graceDaysRemaining: Math.max(0, graceDays),
        message: `Pagamento atrasado - ${Math.max(0, graceDays)} dias de grace period restantes`,
        mode: 'READ_ONLY',
        decision
      }
    }

    // BLOCK
    const statusMap: Record<string, BillingStatus> = {
      'TRIAL_EXPIRED': 'trial_expired',
      'SUSPENDED': 'suspended',
      'UNPAID': 'past_due'
    }

    return {
      allowed: false,
      status: statusMap[decision.reason] || 'unknown',
      tenantId,
      tenantName: tenant.name,
      trialEndsAt: tenant.trial_ends_at,
      message: `Acesso bloqueado: ${decision.reason}`,
      redirectTo: decision.redirectTo,
      mode: 'BLOCK',
      decision
    }
  } catch (error) {
    console.error('Erro ao verificar billing status:', error)
    return {
      allowed: false,
      status: 'unknown',
      tenantId,
      message: 'Erro ao verificar status de billing',
      redirectTo: '/error',
      mode: 'BLOCK'
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
 * REGRAS:
 * - ALLOW: permite mutações
 * - READ_ONLY: BLOQUEIA mutações (grace period)
 * - BLOCK: BLOQUEIA mutações
 * 
 * @param tenantId - ID do tenant
 * @returns Resultado com allowed e message
 */
export async function enforceBillingInAction(
  tenantId: string
): Promise<BillingCheckResult> {
  const result = await checkBillingStatus(tenantId)

  // BLOCK: bloquear totalmente
  if (result.mode === 'BLOCK') {
    return {
      ...result,
      allowed: false,
      message: result.message || 'Ação bloqueada: billing inválido'
    }
  }

  // READ_ONLY: bloquear mutações (grace period)
  if (result.mode === 'READ_ONLY') {
    console.warn(`[BILLING] Tenant ${tenantId} em READ_ONLY (past_due grace period: ${result.graceDaysRemaining} dias) - BLOQUEANDO mutação`)
    return {
      ...result,
      allowed: false,
      message: `Ação bloqueada: pagamento atrasado (${result.graceDaysRemaining} dias de grace period restantes)`
    }
  }

  // ALLOW: permitir mutações
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
