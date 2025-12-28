'use server'

import { createClient } from '@/lib/supabase/server'
import { mimoClient } from '@/lib/mimo/client'

export async function processPixPayment(orderId: string, amount: number) {
  try {
    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pedido não encontrado' }
    }

    const charge = await mimoClient.createPixCharge({
      amount,
      orderId,
      customerName: order.customer?.name || 'Cliente',
      customerEmail: order.customer?.email,
      customerDocument: order.customer?.document
    })

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        pix_charge_id: charge.id,
        pix_qr_code: charge.qrCode,
        pix_qr_code_image: charge.qrCodeImage,
        pix_expires_at: charge.expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('[PIX] Erro ao atualizar pedido:', updateError)
      return { success: false, error: 'Erro ao gerar PIX' }
    }

    return {
      success: true,
      charge: {
        id: charge.id,
        qrCode: charge.qrCode,
        qrCodeImage: charge.qrCodeImage,
        expiresAt: charge.expiresAt
      }
    }
  } catch (error) {
    console.error('[PIX] Erro ao processar pagamento:', error)
    return { success: false, error: 'Erro ao processar pagamento PIX' }
  }
}

export async function checkPixPaymentStatus(orderId: string) {
  try {
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('pix_charge_id, status, payment_status')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return { success: false, error: 'Pedido não encontrado' }
    }

    if (!order.pix_charge_id) {
      return { success: false, error: 'Pedido sem PIX gerado' }
    }

    const charge = await mimoClient.checkPaymentStatus(order.pix_charge_id)

    if (!charge) {
      return { success: false, error: 'Charge não encontrado' }
    }

    return {
      success: true,
      status: charge.status,
      isPaid: charge.status === 'paid',
      isExpired: charge.status === 'expired'
    }
  } catch (error) {
    console.error('[PIX] Erro ao verificar status:', error)
    return { success: false, error: 'Erro ao verificar status do pagamento' }
  }
}
