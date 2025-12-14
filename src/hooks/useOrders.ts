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
}

export function useOrders(storeId?: string) {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  async function fetchOrders() {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar pedidos:', error)
        throw error
      }
      
      setOrders(data || [])
    } catch (err) {
      console.error('Erro no fetchOrders:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos')
      setOrders([]) // Define array vazio em caso de erro
    } finally {
      setLoading(false)
    }
  }

  async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'order_code'>) {
    try {
      const orderCode = `A${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{ ...order, order_code: orderCode }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw err
    }
  }

  async function updateOrderStatus(id: string, status: Order['status']) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      await fetchOrders()
    } catch (err) {
      throw err
    }
  }

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrderStatus
  }
}
