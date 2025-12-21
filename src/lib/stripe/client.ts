/**
 * Stripe Client
 * 
 * Cliente Stripe server-side com suporte a MOCK.
 * Funciona sem configuração para desenvolvimento.
 */

import 'server-only'
import Stripe from 'stripe'
import { isStripeConfigured } from './config'

// Cliente Stripe (lazy initialization)
let stripeClient: Stripe | null = null

/**
 * Retorna cliente Stripe ou null se não configurado
 */
export function getStripeClient(): Stripe | null {
  if (stripeClient) return stripeClient

  if (!isStripeConfigured()) {
    console.warn('⚠️ [Stripe] Não configurado - usando modo MOCK')
    return null
  }

  try {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
    
    console.log('✅ [Stripe] Cliente inicializado')
    return stripeClient
  } catch (error) {
    console.error('❌ [Stripe] Erro ao inicializar:', error)
    return null
  }
}

/**
 * Cria ou busca customer no Stripe
 * 
 * MOCK: Retorna customer_id fake
 */
export async function createOrGetCustomer(params: {
  tenantId: string
  email: string
  name: string
}): Promise<{ customerId: string; isMock: boolean }> {
  const stripe = getStripeClient()

  // MOCK
  if (!stripe) {
    const mockId = `cus_mock_${params.tenantId.slice(0, 8)}`
    console.log(`[Stripe MOCK] createCustomer → ${mockId}`)
    return { customerId: mockId, isMock: true }
  }

  try {
    // Buscar customer existente
    const customers = await stripe.customers.list({
      email: params.email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      return { customerId: customers.data[0].id, isMock: false }
    }

    // Criar novo customer
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        tenant_id: params.tenantId,
      },
    })

    return { customerId: customer.id, isMock: false }
  } catch (error) {
    console.error('[Stripe] Erro ao criar customer:', error)
    throw error
  }
}

/**
 * Cria checkout session
 * 
 * MOCK: Retorna URL fake que simula sucesso
 */
export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  tenantId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string; sessionId: string; isMock: boolean }> {
  const stripe = getStripeClient()

  // MOCK
  if (!stripe) {
    const mockSessionId = `cs_mock_${Date.now()}`
    const mockUrl = `${params.successUrl}?session_id=${mockSessionId}&mock=true`
    console.log(`[Stripe MOCK] createCheckoutSession → ${mockUrl}`)
    return { url: mockUrl, sessionId: mockSessionId, isMock: true }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        tenant_id: params.tenantId,
      },
      subscription_data: {
        metadata: {
          tenant_id: params.tenantId,
        },
      },
    })

    return { url: session.url!, sessionId: session.id, isMock: false }
  } catch (error) {
    console.error('[Stripe] Erro ao criar checkout session:', error)
    throw error
  }
}

/**
 * Cria portal session para gerenciar assinatura
 * 
 * MOCK: Retorna URL fake
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<{ url: string; isMock: boolean }> {
  const stripe = getStripeClient()

  // MOCK
  if (!stripe) {
    const mockUrl = `${params.returnUrl}?portal=mock`
    console.log(`[Stripe MOCK] createPortalSession → ${mockUrl}`)
    return { url: mockUrl, isMock: true }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    })

    return { url: session.url, isMock: false }
  } catch (error) {
    console.error('[Stripe] Erro ao criar portal session:', error)
    throw error
  }
}

/**
 * Busca subscription do Stripe
 * 
 * MOCK: Retorna dados fake
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripe = getStripeClient()

  // MOCK
  if (!stripe) {
    console.log(`[Stripe MOCK] getSubscription → mock data`)
    return {
      id: subscriptionId,
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      cancel_at_period_end: false,
    } as Stripe.Subscription
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('[Stripe] Erro ao buscar subscription:', error)
    return null
  }
}

/**
 * Cancela subscription
 * 
 * MOCK: Simula cancelamento
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<boolean> {
  const stripe = getStripeClient()

  // MOCK
  if (!stripe) {
    console.log(`[Stripe MOCK] cancelSubscription → ${immediately ? 'immediately' : 'at_period_end'}`)
    return true
  }

  try {
    if (immediately) {
      await stripe.subscriptions.cancel(subscriptionId)
    } else {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    }
    return true
  } catch (error) {
    console.error('[Stripe] Erro ao cancelar subscription:', error)
    return false
  }
}
