'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { CartItem, OrderData } from '@/types/menu'

const CreateOrderSchema = z.object({
  store_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
  channel: z.enum(['COUNTER', 'DELIVERY', 'TAKEAWAY']),
  payment_method: z.enum(['PIX', 'CASH', 'CARD', 'ONLINE']),
  notes: z.string().optional(),
  customer: z.object({
    name: z.string().optional(),
    phone: z.string().min(1),
    email: z.string().email().optional(),
  }),
  delivery_address: z
    .object({
      street: z.string().min(1),
      number: z.string().min(1),
      complement: z.string().optional(),
      district: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip_code: z.string().min(1),
      reference: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        title_snapshot: z.string().min(1),
        unit_price: z.number().nonnegative(),
        quantity: z.number().int().positive(),
        unit_type: z.enum(['unit', 'weight']),
        weight: z.number().positive().optional(),
        modifiers: z
          .array(
            z.object({
              modifier_option_id: z.string().uuid(),
              name_snapshot: z.string().min(1),
              extra_price: z.number().nonnegative(),
            })
          )
          .default([]),
      })
    )
    .min(1),
  subtotal_amount: z.number().nonnegative(),
  discount_amount: z.number().nonnegative(),
  delivery_fee: z.number().nonnegative(),
  total_amount: z.number().nonnegative(),
})

export async function createOrder(
  storeId: string,
  items: CartItem[],
  orderData: OrderData,
  idempotencyKey: string
) {
  const supabase = await createClient()

  try {
    const deliveryFee = orderData.channel === 'DELIVERY' ? 5.0 : 0
    const discountAmount = Math.max(0, orderData.discount_amount ?? 0)

    const payloadItems = items.map((item) => {
      const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.extra_price, 0)
      const unitTotal = item.unit_price + modifiersTotal
      const computedSubtotal = unitTotal * item.quantity

      return {
        product_id: item.product_id,
        title_snapshot: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        unit_type: 'unit' as const,
        weight: undefined,
        subtotal: computedSubtotal,
        modifiers: item.modifiers.map((m) => ({
          modifier_option_id: m.option_id,
          name_snapshot: m.name,
          extra_price: m.extra_price,
        })),
      }
    })

    const subtotalAmount = payloadItems.reduce((sum, i) => sum + i.subtotal, 0)
    const boundedDiscount = Math.min(discountAmount, subtotalAmount)
    const totalAmount = Math.max(0, subtotalAmount + deliveryFee - boundedDiscount)

    const payload = CreateOrderSchema.parse({
      store_id: storeId,
      idempotency_key: idempotencyKey,
      channel: orderData.channel,
      payment_method: orderData.payment_method,
      notes: orderData.notes,
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone || '',
        email: orderData.customer.email,
      },
      delivery_address:
        orderData.channel === 'DELIVERY' ? orderData.delivery_address : undefined,
      items: payloadItems.map((i) => ({
        product_id: i.product_id,
        title_snapshot: i.title_snapshot,
        unit_price: i.unit_price,
        quantity: i.quantity,
        unit_type: i.unit_type,
        weight: i.weight,
        modifiers: i.modifiers,
      })),
      subtotal_amount: subtotalAmount,
      discount_amount: boundedDiscount,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
    })

    const { data, error } = await supabase.rpc('create_order_atomic', {
      p_payload: {
        store_id: payload.store_id,
        idempotency_key: payload.idempotency_key,
        channel: payload.channel,
        payment_method: payload.payment_method,
        notes: payload.notes ?? null,
        customer: payload.customer,
        delivery_address: payload.delivery_address ?? null,
        items: payload.items.map((i, idx) => ({
          product_id: i.product_id,
          title_snapshot: i.title_snapshot,
          unit_price: i.unit_price,
          quantity: i.quantity,
          unit_type: i.unit_type,
          weight: i.weight ?? null,
          subtotal: payloadItems[idx]?.subtotal ?? 0,
          modifiers: i.modifiers.map((m) => ({
            modifier_option_id: m.modifier_option_id,
            name_snapshot: m.name_snapshot,
            extra_price: m.extra_price,
          })),
        })),
        subtotal_amount: payload.subtotal_amount,
        discount_amount: payload.discount_amount,
        delivery_fee: payload.delivery_fee,
        total_amount: payload.total_amount,
      },
    })

    if (error) {
      console.error('create_order_atomic error:', error)
      return { success: false, error: 'Falha ao criar pedido (atomic)' }
    }

    const parsed = z
      .object({
        order_id: z.string().uuid(),
        code: z.string().min(1),
        idempotent: z.boolean(),
      })
      .parse(data)

    return { success: true, orderId: parsed.order_id, orderCode: parsed.code, idempotent: parsed.idempotent }
  } catch (error) {
    console.error('Error creating order:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: `Erro ao criar pedido: ${message}` }
  }
}

export async function getOrderStatus(orderId: string) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        *,
        modifiers:order_item_modifiers(*)
      ),
      events:order_events(*)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) return null
  return order
}
