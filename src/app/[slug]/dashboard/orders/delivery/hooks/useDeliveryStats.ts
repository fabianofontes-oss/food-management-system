import { useState, useEffect, useMemo } from 'react'
import { DeliveryStats } from '../types'

export const useDeliveryStats = (deliveryOrders: any[]) => {
  const [stats, setStats] = useState<DeliveryStats>({
    deliveredToday: 0,
    avgDeliveryTime: 0,
    deliveryTimes: {}
  })

  const orderIds = useMemo(() => deliveryOrders.map(o => o.id).join(','), [deliveryOrders])

  useEffect(() => {
    const calculateStats = () => {
      const today = new Date().toDateString()
      const delivered = deliveryOrders.filter(d => 
        d.status === 'delivered' && new Date(d.created_at).toDateString() === today
      )
      
      const times: Record<string, number> = {}
      deliveryOrders.forEach(order => {
        if (order.status === 'out_for_delivery') {
          const created = new Date(order.created_at).getTime()
          const now = Date.now()
          times[order.id] = Math.floor((now - created) / 60000)
        }
      })
      
      let avgTime = 0
      if (delivered.length > 0) {
        const totalTime = delivered.reduce((acc, order) => {
          const created = new Date(order.created_at).getTime()
          const completed = new Date(order.updated_at || order.created_at).getTime()
          return acc + (completed - created)
        }, 0)
        avgTime = Math.floor(totalTime / delivered.length / 60000)
      }
      
      setStats({
        deliveredToday: delivered.length,
        avgDeliveryTime: avgTime,
        deliveryTimes: times
      })
    }

    calculateStats()
    const interval = setInterval(calculateStats, 30000)
    
    return () => clearInterval(interval)
  }, [orderIds, deliveryOrders])

  return stats
}
