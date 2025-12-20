'use client'

import { useMemo, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Order {
  id: string
  store_id: string
  order_code: string
  customer_name: string
  customer_phone: string
  customer_email: string
  delivery_address: string | null
  order_type: 'delivery' | 'pickup' | 'dine_in' | 'takeout'
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'card' | 'card_on_delivery' | 'online'
  payment_status: 'pending' | 'paid' | 'cancelled'
  subtotal: number
  delivery_fee: number
  discount: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export function useOrders(storeId?: string) {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) {
      setOrders([])
      setLoading(false)
      setError(null)
      return
    }

    fetchOrders()

    const channel = supabase
      .channel(`orders:${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  async function fetchOrders() {
    try {
      if (!storeId) {
        setOrders([])
        return
      }

      setLoading(true)
      setError(null)

      const query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar pedidos:', error)
        throw error
      }

      setOrders(data || [])
    } catch (err) {
      console.error('Erro no fetchOrders:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'order_code'>) {
    if (!storeId) throw new Error('storeId é obrigatório para criar pedido')

    const orderCode = `A${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`

    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...order, store_id: storeId, order_code: orderCode }])
      .select()
      .single()

    if (error) throw error

    return data
  }

  async function updateOrderStatus(id: string, status: Order['status']) {
    if (!storeId) throw new Error('storeId é obrigatório para atualizar pedido')

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .eq('store_id', storeId)

    if (error) throw error

    await fetchOrders()
  }

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    refreshOrders: fetchOrders,
  }
}
