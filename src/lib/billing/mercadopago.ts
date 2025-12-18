/**
 * Integração MercadoPago para Billing Automatizado
 * 
 * CONFIGURAÇÃO NECESSÁRIA (.env):
 * - MP_ACCESS_TOKEN: Token de acesso do MercadoPago
 * - MP_PUBLIC_KEY: Chave pública do MercadoPago
 * - NEXT_PUBLIC_APP_URL: URL base da aplicação
 */

import { createClient } from '@/lib/supabase/server'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const MP_API_URL = 'https://api.mercadopago.com'

export interface CreatePixPaymentParams {
  invoiceId: string
  tenantId: string
  amount: number // em reais
  description: string
  email: string
  expirationMinutes?: number
}

export interface PixPaymentResult {
  success: boolean
  paymentId?: string
  qrCode?: string
  qrCodeBase64?: string
  expirationDate?: string
  error?: string
}

export interface PaymentStatus {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  statusDetail: string
  paymentMethod: string
  paidAt?: string
}

/**
 * Cria um pagamento PIX no MercadoPago
 */
export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  if (!MP_ACCESS_TOKEN) {
    console.error('MP_ACCESS_TOKEN não configurado')
    return { success: false, error: 'Gateway de pagamento não configurado' }
  }

  try {
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + (params.expirationMinutes || 30))

    const response = await fetch(`${MP_API_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': params.invoiceId
      },
      body: JSON.stringify({
        transaction_amount: params.amount,
        description: params.description,
        payment_method_id: 'pix',
        payer: {
          email: params.email
        },
        date_of_expiration: expirationDate.toISOString(),
        external_reference: params.invoiceId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro MercadoPago:', data)
      return { success: false, error: data.message || 'Erro ao criar pagamento' }
    }

    const pointOfInteraction = data.point_of_interaction?.transaction_data

    return {
      success: true,
      paymentId: data.id?.toString(),
      qrCode: pointOfInteraction?.qr_code,
      qrCodeBase64: pointOfInteraction?.qr_code_base64,
      expirationDate: data.date_of_expiration
    }
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error)
    return { success: false, error: 'Erro de conexão com gateway' }
  }
}

/**
 * Consulta o status de um pagamento no MercadoPago
 */
export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
  if (!MP_ACCESS_TOKEN) {
    console.error('MP_ACCESS_TOKEN não configurado')
    return null
  }

  try {
    const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    })

    if (!response.ok) {
      console.error('Erro ao consultar pagamento:', response.status)
      return null
    }

    const data = await response.json()

    return {
      id: data.id?.toString(),
      status: mapMPStatus(data.status),
      statusDetail: data.status_detail,
      paymentMethod: data.payment_method_id,
      paidAt: data.date_approved
    }
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error)
    return null
  }
}

/**
 * Processa webhook do MercadoPago
 */
export async function processPaymentWebhook(paymentId: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Buscar status do pagamento
  const paymentStatus = await getPaymentStatus(paymentId)
  if (!paymentStatus) {
    console.error('Não foi possível obter status do pagamento:', paymentId)
    return false
  }

  // Buscar fatura pelo gateway_payment_id
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, tenant_id, status')
    .eq('gateway_payment_id', paymentId)
    .single()

  if (invoiceError || !invoice) {
    console.error('Fatura não encontrada para pagamento:', paymentId)
    return false
  }

  // Registrar no histórico
  await supabase.from('payment_history').insert({
    invoice_id: invoice.id,
    tenant_id: invoice.tenant_id,
    amount_cents: 0, // Será atualizado
    payment_method: paymentStatus.paymentMethod,
    gateway_payment_id: paymentId,
    status: paymentStatus.status,
    gateway_status: paymentStatus.statusDetail,
    paid_at: paymentStatus.paidAt || new Date().toISOString()
  })

  // Se aprovado, atualizar fatura e reativar tenant
  if (paymentStatus.status === 'approved') {
    // Atualizar fatura
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: paymentStatus.paidAt || new Date().toISOString(),
        payment_method: paymentStatus.paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)

    // Reativar tenant se estava suspenso
    await supabase
      .from('tenants')
      .update({
        status: 'active',
        suspended_at: null,
        suspended_reason: null
      })
      .eq('id', invoice.tenant_id)
      .eq('status', 'suspended')

    console.log('Pagamento aprovado e tenant reativado:', invoice.tenant_id)
  }

  return true
}

/**
 * Mapeia status do MercadoPago para nosso enum
 */
function mapMPStatus(mpStatus: string): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'> = {
    'pending': 'pending',
    'approved': 'approved',
    'authorized': 'approved',
    'in_process': 'pending',
    'in_mediation': 'pending',
    'rejected': 'rejected',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'charged_back': 'refunded'
  }
  return statusMap[mpStatus] || 'pending'
}

/**
 * Gera uma fatura para o mês atual
 */
export async function generateMonthlyInvoice(tenantId: string): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  const supabase = await createClient()

  // Buscar tenant e seu plano
  const { data: subscription, error: subError } = await supabase
    .from('tenant_subscriptions')
    .select(`
      tenant_id,
      plan:plans(id, name, price_monthly_cents),
      tenant:tenants(id, name, email, status)
    `)
    .eq('tenant_id', tenantId)
    .single()

  if (subError || !subscription) {
    return { success: false, error: 'Tenant não encontrado ou sem plano' }
  }

  const plan = subscription.plan as any
  const tenant = subscription.tenant as any

  if (!plan?.price_monthly_cents) {
    return { success: false, error: 'Plano sem preço definido' }
  }

  // Verificar se já existe fatura para o mês
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('reference_month', currentMonth)
    .single()

  if (existingInvoice) {
    return { success: true, invoiceId: existingInvoice.id }
  }

  // Calcular data de vencimento
  const billingDay = (tenant as any).billing_day || 10
  const dueDate = new Date()
  dueDate.setDate(billingDay)
  if (dueDate < new Date()) {
    dueDate.setMonth(dueDate.getMonth() + 1)
  }

  // Criar fatura
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      plan_id: plan.id,
      amount_cents: plan.price_monthly_cents,
      reference_month: currentMonth,
      due_date: dueDate.toISOString().slice(0, 10),
      status: 'pending',
      payment_gateway: 'mercadopago'
    })
    .select()
    .single()

  if (invoiceError) {
    console.error('Erro ao criar fatura:', invoiceError)
    return { success: false, error: 'Erro ao criar fatura' }
  }

  // Gerar PIX se tiver email
  if (tenant?.email) {
    const pixResult = await createPixPayment({
      invoiceId: invoice.id,
      tenantId,
      amount: plan.price_monthly_cents / 100,
      description: `${plan.name} - ${currentMonth}`,
      email: tenant.email
    })

    if (pixResult.success) {
      await supabase
        .from('invoices')
        .update({
          gateway_payment_id: pixResult.paymentId,
          pix_qr_code: pixResult.qrCode,
          pix_qr_code_base64: pixResult.qrCodeBase64,
          pix_expiration: pixResult.expirationDate
        })
        .eq('id', invoice.id)
    }
  }

  return { success: true, invoiceId: invoice.id }
}
