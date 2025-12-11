'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOrderCode } from '@/lib/utils'
import type { CartItem, OrderData } from '@/types/menu'

export async function createOrder(
  storeId: string,
  items: CartItem[],
  orderData: OrderData
) {
  const supabase = await createClient()

  try {
    let customerId: string | null = null

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('store_id', storeId)
      .eq('phone', orderData.customer.phone)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          store_id: storeId,
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          email: orderData.customer.email || null,
        })
        .select('id')
        .single()

      if (customerError) throw customerError
      customerId = newCustomer.id
    }

    let deliveryAddressId: string | null = null
    if (orderData.channel === 'DELIVERY' && orderData.delivery_address) {
      const { data: address, error: addressError } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: customerId,
          ...orderData.delivery_address,
        })
        .select('id')
        .single()

      if (addressError) throw addressError
      deliveryAddressId = address.id
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const deliveryFee = orderData.channel === 'DELIVERY' ? 5.00 : 0
    const total = subtotal + deliveryFee

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: customerId,
        code: generateOrderCode(),
        channel: orderData.channel,
        status: 'PENDING',
        subtotal_amount: subtotal,
        discount_amount: 0,
        delivery_fee: deliveryFee,
        total_amount: total,
        payment_method: orderData.payment_method,
        delivery_address_id: deliveryAddressId,
        notes: orderData.notes || null,
      })
      .select('id, code')
      .single()

    if (orderError) throw orderError

    for (const item of items) {
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          title_snapshot: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          unit_type: 'unit',
          subtotal: item.subtotal,
        })
        .select('id')
        .single()

      if (itemError) throw itemError

      if (item.modifiers.length > 0) {
        const modifiers = item.modifiers.map(mod => ({
          order_item_id: orderItem.id,
          modifier_option_id: mod.option_id,
          name_snapshot: mod.name,
          extra_price: mod.extra_price,
        }))

        const { error: modError } = await supabase
          .from('order_item_modifiers')
          .insert(modifiers)

        if (modError) throw modError
      }
    }

    await supabase.from('order_events').insert({
      order_id: order.id,
      type: 'CREATED',
      message: 'Pedido criado',
    })

    return { success: true, orderId: order.id, orderCode: order.code }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'Erro ao criar pedido' }
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
