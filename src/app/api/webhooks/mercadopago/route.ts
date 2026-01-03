import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWebhook, verifyPaymentExists } from '@/lib/billing/mercadopago'
import crypto from 'crypto'

const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET

/**
 * Valida a assinatura do webhook MercadoPago
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validateSignature(request: NextRequest, body: string): boolean {
  // Se não tiver secret configurado, bloquear em produção
  if (!MP_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[MP Webhook] MP_WEBHOOK_SECRET não configurado em produção')
      return false
    }
    // Em desenvolvimento, permitir sem validação (com warning)
    console.warn('[MP Webhook] Sem validação de assinatura (desenvolvimento)')
    return true
  }

  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  if (!xSignature || !xRequestId) {
    console.error('[MP Webhook] Headers de assinatura ausentes')
    return false
  }

  // Extrair ts e v1 do header x-signature
  const parts = xSignature.split(',')
  const tsMatch = parts.find(p => p.startsWith('ts='))
  const hashMatch = parts.find(p => p.startsWith('v1='))

  if (!tsMatch || !hashMatch) {
    console.error('[MP Webhook] Formato de assinatura inválido')
    return false
  }

  const ts = tsMatch.split('=')[1]
  const hash = hashMatch.split('=')[1]

  // Gerar hash esperado
  const manifest = `id:;request-id:${xRequestId};ts:${ts};`
  const expectedHash = crypto
    .createHmac('sha256', MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex')

  return hash === expectedHash
}

/**
 * Webhook do MercadoPago para receber notificações de pagamento
 * URL: /api/webhooks/mercadopago
 * 
 * SEGURANÇA:
 * 1. Valida assinatura do MP (x-signature)
 * 2. Consulta API do MP para confirmar pagamento
 * 3. Só então processa a ativação
 * 
 * Configurar no painel do MercadoPago:
 * https://www.mercadopago.com.br/developers/panel/app
 */
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)
    
    // SEGURANÇA: Validar assinatura
    if (!validateSignature(request, bodyText)) {
      console.error('[MP Webhook] Assinatura inválida - possível fraude')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('[MP Webhook] Recebido:', body.type, body.data?.id)

    // MercadoPago envia diferentes tipos de notificação
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id.toString()
      
      // SEGURANÇA: Verificar se o pagamento realmente existe no MP
      const paymentExists = await verifyPaymentExists(paymentId)
      if (!paymentExists) {
        console.error('[MP Webhook] Pagamento não existe no MP:', paymentId)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      
      const success = await processPaymentWebhook(paymentId)
      
      if (success) {
        console.log('[MP Webhook] Processado com sucesso:', paymentId)
        return NextResponse.json({ success: true })
      } else {
        console.error('[MP Webhook] Falha ao processar:', paymentId)
        return NextResponse.json({ success: false }, { status: 500 })
      }
    }

    // Para outros tipos de notificação, apenas confirmar recebimento
    return NextResponse.json({ success: true, message: 'Notification received' })
  } catch (error) {
    console.error('[MP Webhook] Erro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// MercadoPago também faz GET para verificar se o endpoint existe
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'mercadopago-webhook' })
}
