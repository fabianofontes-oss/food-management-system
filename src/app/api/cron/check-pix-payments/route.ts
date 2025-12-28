import { createClient } from '@/lib/supabase/server'
import { mimoClient } from '@/lib/mimo/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Iniciando verificação de pagamentos PIX...')

    const supabase = await createClient()

    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select('id, pix_charge_id, created_at')
      .eq('payment_method', 'pix')
      .eq('status', 'pending')
      .not('pix_charge_id', 'is', null)

    if (error) {
      console.error('[Cron] Erro ao buscar pedidos:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('[Cron] Nenhum pedido PIX pendente encontrado')
      return NextResponse.json({ 
        success: true, 
        processed: 0,
        message: 'No pending PIX orders'
      })
    }

    console.log(`[Cron] Encontrados ${pendingOrders.length} pedidos PIX pendentes`)

    let confirmed = 0
    let expired = 0
    let errors = 0

    for (const order of pendingOrders) {
      try {
        const charge = await mimoClient.checkPaymentStatus(order.pix_charge_id)

        if (!charge) {
          console.warn(`[Cron] Charge não encontrado: ${order.pix_charge_id}`)
          errors++
          continue
        }

        if (charge.status === 'paid') {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          if (updateError) {
            console.error(`[Cron] Erro ao confirmar pedido ${order.id}:`, updateError)
            errors++
          } else {
            console.log(`[Cron] Pedido confirmado: ${order.id}`)
            confirmed++
          }
        } else if (charge.status === 'expired') {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              cancellation_reason: 'PIX expirado',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          if (updateError) {
            console.error(`[Cron] Erro ao cancelar pedido ${order.id}:`, updateError)
            errors++
          } else {
            console.log(`[Cron] Pedido cancelado por expiração: ${order.id}`)
            expired++
          }
        }
      } catch (err) {
        console.error(`[Cron] Erro ao processar pedido ${order.id}:`, err)
        errors++
      }
    }

    const result = {
      success: true,
      processed: pendingOrders.length,
      confirmed,
      expired,
      errors,
      timestamp: new Date().toISOString()
    }

    console.log('[Cron] Verificação concluída:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('[Cron] Erro geral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
