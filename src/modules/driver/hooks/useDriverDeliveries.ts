'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDriverDeliveries, getPendingDeliveries, getCompletedDeliveries, updateDeliveryStatus } from '../repository'
import type { Delivery } from '../types'

interface UseDriverDeliveriesReturn {
  deliveries: Delivery[]
  pendingDeliveries: Delivery[]
  completedDeliveries: Delivery[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateStatus: (deliveryId: string, newStatus: string) => Promise<void>
}

export function useDriverDeliveries(storeId: string | null, driverName: string): UseDriverDeliveriesReturn {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveries = useCallback(async () => {
    if (!storeId || !driverName) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getDriverDeliveries(storeId, driverName)
      setDeliveries(data)
    } catch (err) {
      console.error('Erro ao carregar entregas:', err)
      setError('Erro ao carregar entregas')
    } finally {
      setLoading(false)
    }
  }, [storeId, driverName])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const updateStatusHandler = async (deliveryId: string, newStatus: string) => {
    try {
      await updateDeliveryStatus(deliveryId, newStatus)
      await fetchDeliveries()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      throw err
    }
  }

  return {
    deliveries,
    pendingDeliveries: getPendingDeliveries(deliveries),
    completedDeliveries: getCompletedDeliveries(deliveries),
    loading,
    error,
    refresh: fetchDeliveries,
    updateStatus: updateStatusHandler
  }
}
