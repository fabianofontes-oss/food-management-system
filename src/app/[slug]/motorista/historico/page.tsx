'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HistoryTab } from '@/modules/driver'
import type { Delivery } from '@/modules/driver/types'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface DriverContext {
  driver: {
    id: string
    name: string
    phone: string
    commission_percent: number
  }
  store: {
    id: string
    name: string
    slug: string
  }
}

export default function HistoricoPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [commissionPercent, setCommissionPercent] = useState(10)

  useEffect(() => {
    async function loadData() {
      // 1. Verificar autenticação local (localStorage)
      const driverDataStr = localStorage.getItem(`driver_${params.slug}`)
      if (!driverDataStr) {
        router.push(`/${params.slug}/motorista`)
        return
      }

      try {
        const driverContext: DriverContext = JSON.parse(driverDataStr)
        const supabase = createClient()

        // 2. Buscar entregas do motorista
        const { data: deliveriesData } = await supabase
          .from('deliveries')
          .select(`
            *,
            order:orders(
              order_code,
              customer_name,
              total_amount
            )
          `)
          .eq('driver_phone', driverContext.driver.phone.replace(/\D/g, ''))
          .eq('store_id', driverContext.store.id)
          .order('created_at', { ascending: false })

        setDeliveries((deliveriesData || []) as Delivery[])
        setCommissionPercent(driverContext.driver.commission_percent || 10)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        router.push(`/${params.slug}/motorista`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.slug, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Histórico de Entregas</h1>
      <HistoryTab 
        deliveries={deliveries} 
        commissionPercent={commissionPercent} 
      />
    </div>
  )
}
