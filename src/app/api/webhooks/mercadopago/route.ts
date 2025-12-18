import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWebhook } from '@/lib/billing/mercadopago'

/**
 * Webhook do MercadoPago para receber notificações de pagamento
 * URL: /api/webhooks/mercadopago
 * 
 * Configurar no painel do MercadoPago:
 * https://www.mercadopago.com.br/developers/panel/app
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Webhook MercadoPago recebido:', JSON.stringify(body, null, 2))

    // MercadoPago envia diferentes tipos de notificação
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id.toString()
      
      console.log('Processando pagamento:', paymentId)
      
      const success = await processPaymentWebhook(paymentId)
      
      if (success) {
        console.log('Webhook processado com sucesso:', paymentId)
        return NextResponse.json({ success: true })
      } else {
        console.error('Falha ao processar webhook:', paymentId)
        return NextResponse.json({ success: false }, { status: 500 })
      }
    }

    // Para outros tipos de notificação, apenas confirmar recebimento
    return NextResponse.json({ success: true, message: 'Notification received' })
  } catch (error) {
    console.error('Erro no webhook MercadoPago:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// MercadoPago também faz GET para verificar se o endpoint existe
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'mercadopago-webhook' })
}
