import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderRepository } from '../repository'
import { OrderWithDetails, OrderStatus } from '../types'
import { toast } from 'sonner' 

export function useOrders(storeId?: string) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!storeId) return
    try {
      const data = await OrderRepository.getActiveOrders(storeId)
      setOrders(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  // Realtime
  useEffect(() => {
    if (!storeId) return

    fetchOrders()

    const supabase = createClient()
    const channel = supabase
      .channel(`orders_realtime:${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload: { eventType: string }) => {
          if (payload.eventType === 'INSERT') {
            const audio = new Audio('/sounds/notification.mp3')
            audio.play().catch(() => {})
            toast.success('Novo pedido recebido!')
            fetchOrders() 
          } else {
            fetchOrders()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [storeId, fetchOrders])

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const previousOrders = [...orders]
    // Optimistic Update
    setOrders(current => 
      current.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    )

    try {
      await OrderRepository.updateStatus(orderId, newStatus)
      toast.success('Status atualizado')
    } catch (error) {
      setOrders(previousOrders)
      toast.error('Erro ao atualizar status')
    }
  }

  return { orders, loading, updateStatus, refresh: fetchOrders }
}
