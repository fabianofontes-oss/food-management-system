'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { CartItem, OrderData } from '@/types/menu'

const CreateOrderSchema = z
  .object({
  store_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
  channel: z.enum(['COUNTER', 'DELIVERY', 'TAKEAWAY']),
  payment_method: z.enum(['PIX', 'CASH', 'CARD', 'ONLINE']),
  notes: z.string().optional(),
  coupon_code: z.string().min(1).optional(),
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
        unit_type: z.enum(['unit', 'weight']),
        quantity: z.number().int().positive().optional(),
        weight: z.number().positive().optional(),
        modifiers: z
          .array(
            z.object({
              modifier_option_id: z.string().uuid(),
            })
          )
          .default([]),
      })
    )
    .min(1),
})
  .superRefine((data, ctx) => {
    if (data.channel === 'DELIVERY' && !data.delivery_address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'delivery_address é obrigatório quando channel=DELIVERY',
        path: ['delivery_address'],
      })
    }

    for (const [idx, item] of data.items.entries()) {
      if (item.unit_type === 'unit') {
        if (!item.quantity || item.quantity <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'quantity é obrigatório quando unit_type=unit',
            path: ['items', idx, 'quantity'],
          })
        }
      }

      if (item.unit_type === 'weight') {
        if (!item.weight || item.weight <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'weight é obrigatório quando unit_type=weight',
            path: ['items', idx, 'weight'],
          })
        }
      }
    }
  })

export async function createOrder(
  storeId: string,
  items: CartItem[],
  orderData: OrderData,
  idempotencyKey: string
) {
  const supabase = (await createClient()) as any

  try {
    const payload = CreateOrderSchema.parse({
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
      delivery_address:
        orderData.channel === 'DELIVERY' ? orderData.delivery_address : undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        unit_type: 'unit' as const,
        quantity: item.quantity,
        modifiers: item.modifiers.map((m) => ({
          modifier_option_id: m.option_id,
        })),
      })),
      discount_amount: orderData.discount_amount,
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
        items: payload.items.map((i) => ({
          product_id: i.product_id,
          unit_type: i.unit_type,
          quantity: i.quantity ?? null,
          weight: i.weight ?? null,
          modifiers: i.modifiers.map((m) => ({
            modifier_option_id: m.modifier_option_id,
          })),
        })),
        coupon_code: payload.coupon_code ?? null,
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
