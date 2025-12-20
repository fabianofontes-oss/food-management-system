'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Wallet, Bike, Clock, TrendingUp, ChevronRight, Banknote, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DriverCard, DriverCardContent } from '@/modules/driver/components/ui/DriverCard'
import { DriverButton } from '@/modules/driver/components/ui/DriverButton'
import { DriverStatusBadge } from '@/modules/driver/components/ui/DriverStatusBadge'
import { useDriverDeliveries } from '@/modules/driver/hooks/useDriverDeliveries'
import { useDriverStats } from '@/modules/driver/hooks/useDriverStats'
import { formatCurrency } from '@/lib/utils'

export default function GanhosPage() {
  const params = useParams()
  const router = useRouter()
  const storeSlug = params.slug as string

  const [store, setStore] = useState<{ id: string; name: string } | null>(null)
  const [driver, setDriver] = useState<{ id: string; name: string; commission_percent: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'tudo' | 'corridas' | 'saques' | 'bonus'>('tudo')

  useEffect(() => {
    const driverData = localStorage.getItem(`driver_${storeSlug}`)
    if (!driverData) {
      router.push(`/${storeSlug}/motorista`)
      return
    }
    const parsed = JSON.parse(driverData)
    setDriver(parsed.driver)
    setStore(parsed.store)
    setLoading(false)
  }, [storeSlug, router])

  const { deliveries } = useDriverDeliveries(store?.id || '', driver?.name || '')
  const { stats } = useDriverStats(deliveries, driver?.commission_percent || 10)

  // Simulated wallet data
  const walletData = {
    available: stats.totalEarnings * 0.7,
    pending: stats.totalEarnings * 0.3,
  }

  // Weekly chart data (simulated)
  const weekDays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
  const weekData = [85, 120, 95, 150, 180, 220, 140]
  const maxValue = Math.max(...weekData)

  if (loading) {
    return (
      <div className="min-h-screen bg-driver-background flex items-center justify-center">
        <Wallet className="w-12 h-12 text-driver-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-driver-background/95 backdrop-blur-md border-b border-driver-surface">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-driver-surface rounded-full size-10 flex items-center justify-center border-2 border-driver-primary">
                <Wallet className="w-5 h-5 text-driver-primary" />
              </div>
            </div>
            <div>
              <p className="text-xs text-driver-text-secondary font-medium">Bom dia,</p>
              <h2 className="text-white text-lg font-bold leading-none">{driver?.name}</h2>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        {/* Balance Card */}
        <div className="text-center py-4">
          <p className="text-driver-text-secondary text-sm mb-1">Saldo Disponível</p>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            {formatCurrency(walletData.available)}
          </h1>
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-driver-surface rounded-full">
            <Clock className="w-3 h-3 text-driver-primary" />
            <span className="text-driver-primary text-xs font-medium">
              Pendente: {formatCurrency(walletData.pending)}
            </span>
          </div>
        </div>

        {/* Withdraw Button */}
        <DriverButton variant="primary" size="lg" className="w-full">
          <Banknote className="w-5 h-5" /> Solicitar Saque
        </DriverButton>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <DriverCard>
            <DriverCardContent className="p-3 text-center">
              <p className="text-driver-text-secondary text-xs mb-1">Hoje</p>
              <p className="text-driver-primary text-lg font-bold">{formatCurrency(stats.todayEarnings)}</p>
            </DriverCardContent>
          </DriverCard>
          <DriverCard>
            <DriverCardContent className="p-3 text-center">
              <p className="text-driver-text-secondary text-xs mb-1">Entregas</p>
              <p className="text-white text-lg font-bold">{stats.todayDeliveries}</p>
            </DriverCardContent>
          </DriverCard>
          <DriverCard>
            <DriverCardContent className="p-3 text-center">
              <p className="text-driver-text-secondary text-xs mb-1">Horas Online</p>
              <p className="text-white text-lg font-bold">4.5h</p>
            </DriverCardContent>
          </DriverCard>
        </div>

        {/* Weekly Performance */}
        <DriverCard>
          <DriverCardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Desempenho Semanal</h3>
              <span className="text-driver-primary text-sm font-bold">
                Total: {formatCurrency(stats.weekEarnings)}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weekDays.map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-driver-primary/80 rounded-t transition-all"
                    style={{ height: `${(weekData[i] / maxValue) * 100}%` }}
                  />
                  <span className="text-driver-text-secondary text-[10px]">{day}</span>
                </div>
              ))}
            </div>
          </DriverCardContent>
        </DriverCard>

        {/* History Section */}
        <section>
          <h3 className="text-white font-bold mb-3">Histórico</h3>
          
          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['tudo', 'corridas', 'saques', 'bonus'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'bg-driver-primary text-white'
                    : 'bg-driver-surface text-driver-text-secondary border border-driver-surface-lighter'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <div className="flex flex-col gap-3">
            {deliveries.slice(0, 5).map((delivery) => (
              <DriverCard key={delivery.id}>
                <DriverCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-driver-surface-lighter flex items-center justify-center">
                        <Bike className="w-5 h-5 text-driver-primary" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Entrega #{delivery.id.slice(-4)}</p>
                        <p className="text-driver-text-secondary text-xs">
                          {delivery.order?.customer_name || 'Cliente'} • {new Date(delivery.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">
                        +{formatCurrency(delivery.delivery_fee * (driver?.commission_percent || 10) / 100)}
                      </p>
                      <DriverStatusBadge status={delivery.status === 'delivered' ? 'concluida' : 'pendente'} />
                    </div>
                  </div>
                </DriverCardContent>
              </DriverCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
