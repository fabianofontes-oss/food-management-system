import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { chargeId, status, orderId, amount, paidAt } = payload

    console.log('[MIMO Webhook] Recebido:', {
      chargeId,
      status,
      orderId,
      amount,
      paidAt
    })

    if (!chargeId || !status || !orderId) {
      console.error('[MIMO Webhook] Payload inválido:', payload)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createClient()

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
