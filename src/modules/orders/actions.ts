'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CartItem, OrderData } from '@/types/menu'
import { getTenantIdFromStore, enforceBillingInAction } from '@/lib/billing/enforcement'
import { validateCheckout } from '@/modules/orders/validations/validateCheckout'

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

export interface CreateOrderOptions {
  scheduledDate?: string | null
  scheduledTime?: string | null
  skipValidation?: boolean
}

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

    // ETAPA 5C: Verificar limite de pedidos por mês
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, subscription_plans!inner(limits)')
      .eq('tenant_id', tenantId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (subscription?.subscription_plans) {
      const limits = (subscription.subscription_plans as any).limits || {}
      const ordersLimit = limits.orders_per_month

      // Se há limite definido e não é ilimitado (-1)
      if (ordersLimit && ordersLimit !== -1) {
        // Calcular início do mês atual
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        startOfMonth.setHours(0, 0, 0, 0)

        // Contar pedidos do mês atual da loja (excluindo cancelados e drafts)
        const { count } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .not('status', 'in', '("cancelled","canceled","draft")')
          .gte('created_at', startOfMonth.toISOString())

        if (count !== null && count >= ordersLimit) {
          return {
            success: false,
            error: `Limite de ${ordersLimit} pedidos/mês atingido. Faça upgrade do seu plano para continuar recebendo pedidos.`
          }
        }
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

    const rpc = (supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message?: string } | null }>
    }).rpc

    const { data, error } = await rpc('create_order_atomic', {
      p_payload: payload as unknown as Record<string, unknown>,
    })

    if (error) throw new Error(error.message)

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Erro ao criar pedido:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: message }
  }
}

export async function createOrder(
  storeId: string,
  items: CartItem[],
  orderData: OrderData,
  idempotencyKey: string,
  options: CreateOrderOptions = {}
) {
  const supabase = await createClient()

  try {
    // 1. Validação centralizada (se não for PDV com skipValidation)
    if (!options.skipValidation) {
      const validation = await validateCheckout({
        storeId,
        channel: orderData.channel,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          modifiers: item.modifiers.map((m) => ({ option_id: m.option_id })),
        })),
        customer: orderData.customer,
        address: orderData.delivery_address,
        scheduledDate: options.scheduledDate,
        scheduledTime: options.scheduledTime,
      })

      if (!validation.ok) {
        return {
          success: false,
          error: validation.error.message,
          errorCode: validation.error.code,
          errorDetails: validation.error.details,
        }
      }
    }

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
      delivery_address: orderData.channel === 'DELIVERY' ? orderData.delivery_address : undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        unit_type: 'unit' as const,
        quantity: item.quantity,
        modifiers: item.modifiers.map((m) => ({
          modifier_option_id: m.option_id,
        })),
      })),
    })

    const rpc = (supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message?: string } | null }>
    }).rpc

    const { data, error } = await rpc('create_order_atomic', {
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
        scheduled_date: options.scheduledDate ?? null,
        scheduled_time: options.scheduledTime ?? null,
      },
    })

    if (error) {
      console.error('create_order_atomic error:', error)
      return { success: false, error: error.message || 'Falha ao criar pedido' }
    }

    const parsed = z
      .object({
        order_id: z.string().uuid(),
        code: z.string().min(1),
        public_token: z.string().uuid(),
        idempotent: z.boolean(),
      })
      .parse(data)

    return {
      success: true,
      orderId: parsed.order_id,
      code: parsed.code,
      publicToken: parsed.public_token,
      idempotent: parsed.idempotent,
    }
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
    .select(
      `
      *,
      customer:customers(*),
      items:order_items(
        *,
        modifiers:order_item_modifiers(*)
      ),
      events:order_events(*)
    `
    )
    .eq('id', orderId)
    .single()

  if (error || !order) return null
  return order
}
