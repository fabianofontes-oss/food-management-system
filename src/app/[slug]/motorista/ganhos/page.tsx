'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { calculateDriverStats } from '@/modules/driver/repository'

export default function GanhosPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [slug])

  async function loadData() {
    try {
      const driverData = localStorage.getItem(`driver_${slug}`)
      if (!driverData) {
        window.location.href = `/${slug}/motorista`
        return
      }

      const parsed = JSON.parse(driverData)
      setDriver(parsed.driver)

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()

      if (store) {
        const { data: deliveries } = await supabase
          .from('deliveries')
          .select('*')
          .eq('store_id', store.id)
          .eq('driver_name', parsed.driver.name)

        if (deliveries) {
          const calculatedStats = calculateDriverStats(deliveries, parsed.driver.commission_percent || 10)
          setStats(calculatedStats)
        }
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Erro ao carregar dados</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Meus Ganhos</h1>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Resumo de Ganhos
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-700">Hoje</div>
              <div className="text-sm text-slate-500">{stats.todayDeliveries} entregas</div>
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(stats.todayEarnings)}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-700">Esta Semana</div>
              <div className="text-sm text-slate-500">{stats.weekDeliveries} entregas</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.weekEarnings)}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-700">Total</div>
              <div className="text-sm text-slate-500">{stats.totalDeliveries} entregas</div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalEarnings)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <p className="text-sm text-cyan-800">
          💡 Sua comissão: {driver?.commission_percent || 10}% por entrega
        </p>
      </div>
    </div>
  )
}
