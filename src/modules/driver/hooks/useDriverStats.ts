'use client'

import { useMemo } from 'react'
import { calculateDriverStats } from '../repository'
import type { Delivery, DriverStats } from '../types'

interface UseDriverStatsReturn {
  stats: DriverStats
}

export function useDriverStats(deliveries: Delivery[], commissionPercent: number): UseDriverStatsReturn {
  const stats = useMemo(() => {
    return calculateDriverStats(deliveries, commissionPercent)
  }, [deliveries, commissionPercent])

  return { stats }
}
