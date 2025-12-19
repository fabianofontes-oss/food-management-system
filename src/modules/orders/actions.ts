'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CartItem, OrderData } from '@/types/menu'
import { getTenantIdFromStore, enforceBillingInAction } from '@/lib/billing/enforcement'

export async function createOrderAction(
  storeId: string,
  items: CartItem[],
  orderData: OrderData,
  idempotencyKey: string
) {
  const supabase = await createClient()

  // ETAPA 5B: Billing Enforcement
  const tenantId = await getTenantIdFromStore(storeId)
  if (tenantId) {
    const billingCheck = await enforceBillingInAction(tenantId)
    if (!billingCheck.allowed) {
      return { 
        success: false, 
        error: billingCheck.message || 'Ação bloqueada: billing inválido' 
      }
    }
  }

  try {
    // Monta o payload para a RPC create_order_atomic
    const payload = {
      store_id: storeId,
      idempotency_key: idempotencyKey,
      channel: orderData.channel,
      payment_method: orderData.payment_method,
      notes: orderData.notes,
      coupon_code: orderData.coupon_code,
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone || '',
        email: orderData.customer.email,
      },
      delivery_address: orderData.channel === 'DELIVERY' ? orderData.delivery_address : null,
      items: items.map((item) => ({
        product_id: item.product_id,
        unit_type: 'unit',
        quantity: item.quantity,
        modifiers: item.modifiers.map((m) => ({
          modifier_option_id: m.option_id,
        })),
      })),
    }

    const { data, error } = await (supabase.rpc as any)('create_order_atomic', {
      p_payload: payload,
    })

    if (error) throw new Error(error.message)

    return { success: true, data }
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error)
    return { success: false, error: error.message }
  }
}
