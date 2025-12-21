/**
 * Stripe Configuration
 * 
 * Configuração de produtos e preços do Stripe.
 * Usa MOCK quando Stripe não está configurado.
 */

import { createClient } from '@/lib/supabase/server'

export interface StripePlan {
  id: string
  name: string
  priceMonthly: number
  stripePriceId: string | null
  features: string[]
}

/**
 * Busca planos do banco de dados
 * 
 * TODO: Após criar produtos no Stripe Dashboard:
 * 1. Criar produto "Básico" → copiar price_id
 * 2. Criar produto "Pro" → copiar price_id
 * 3. Criar produto "Enterprise" → copiar price_id
 * 4. Executar SQL:
 *    UPDATE subscription_plans SET stripe_price_id = 'price_xxx' WHERE id = 'basic';
 *    UPDATE subscription_plans SET stripe_price_id = 'price_xxx' WHERE id = 'pro';
 *    UPDATE subscription_plans SET stripe_price_id = 'price_xxx' WHERE id = 'enterprise';
 */
export async function getStripePlans(): Promise<StripePlan[]> {
  try {
    const supabase = await createClient()
    
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly_cents, stripe_price_id, features')
      .eq('is_active', true)
      .neq('id', 'trial')
      .order('display_order')
    
    if (!plans) return []
    
    return plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      priceMonthly: plan.price_monthly_cents / 100,
      stripePriceId: plan.stripe_price_id,
      features: Array.isArray(plan.features) ? plan.features : [],
    }))
  } catch (error) {
    console.error('[Stripe Config] Erro ao buscar planos:', error)
    return []
  }
}

/**
 * Busca stripe_price_id de um plano
 */
export async function getStripePriceId(planId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('stripe_price_id')
      .eq('id', planId)
      .single()
    
    return plan?.stripe_price_id || null
  } catch (error) {
    console.error('[Stripe Config] Erro ao buscar price_id:', error)
    return null
  }
}

/**
 * Verifica se Stripe está configurado
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
}

/**
 * Retorna modo de operação (live ou mock)
 */
export function getStripeMode(): 'live' | 'mock' {
  return isStripeConfigured() ? 'live' : 'mock'
}
