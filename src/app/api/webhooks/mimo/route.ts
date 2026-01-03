import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MIMO_WEBHOOK_SECRET = process.env.MIMO_WEBHOOK_SECRET

/**
 * Valida o token de autenticação do webhook MIMO
 */
function validateWebhookAuth(request: NextRequest): boolean {
  // Se não tiver secret configurado, bloquear em produção
  if (!MIMO_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[MIMO Webhook] MIMO_WEBHOOK_SECRET não configurado em produção')
      return false
    }
    // Em desenvolvimento, permitir sem validação (com warning)
    console.warn('[MIMO Webhook] Sem validação de token (desenvolvimento)')
    return true
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== MIMO_WEBHOOK_SECRET) {
    console.error('[MIMO Webhook] Token inválido')
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  try {
    // SEGURANÇA: Validar token de autenticação
    if (!validateWebhookAuth(request)) {
      console.error('[MIMO Webhook] Autenticação falhou - possível fraude')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const { chargeId, status, orderId, amount, paidAt } = payload

    console.log('[MIMO Webhook] Recebido:', { chargeId, status, orderId })

    if (!chargeId || !status || !orderId) {
      console.error('[MIMO Webhook] Payload inválido:', payload)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = await createClient()

    // SEGURANÇA: Verificar se o pedido existe e tem o pix_charge_id correto
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, pix_charge_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      console.error('[MIMO Webhook] Pedido não encontrado:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verificar se o chargeId corresponde ao pedido
    if (order.pix_charge_id && order.pix_charge_id !== chargeId) {
      console.error('[MIMO Webhook] ChargeId não corresponde ao pedido:', { chargeId, expected: order.pix_charge_id })
      return NextResponse.json({ error: 'Invalid charge' }, { status: 400 })
    }

    if (status === 'paid') {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          paid_at: paidAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('[MIMO Webhook] Erro ao atualizar pedido:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      console.log('[MIMO Webhook] Pedido confirmado:', orderId)
    } else if (status === 'expired') {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: 'PIX expirado',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('[MIMO Webhook] Erro ao cancelar pedido:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      console.log('[MIMO Webhook] Pedido cancelado por expiração:', orderId)
    }

    return NextResponse.json({ 
      success: true,
      orderId,
      status 
    })

  } catch (error) {
    console.error('[MIMO Webhook] Erro geral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
