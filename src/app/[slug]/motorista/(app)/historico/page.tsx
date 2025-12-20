'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { History, Search, Filter, Bike, Check, X, Clock, DollarSign, MapPin } from 'lucide-react'
import { DriverCard, DriverCardContent } from '@/modules/driver/components/ui/DriverCard'
import { DriverStatusBadge } from '@/modules/driver/components/ui/DriverStatusBadge'
import { useDriverDeliveries } from '@/modules/driver/hooks/useDriverDeliveries'
import { useDriverStats } from '@/modules/driver/hooks/useDriverStats'
import { formatCurrency } from '@/lib/utils'

export default function HistoricoPage() {
  const params = useParams()
  const router = useRouter()
  const storeSlug = params.slug as string

  const [store, setStore] = useState<{ id: string; name: string } | null>(null)
  const [driver, setDriver] = useState<{ id: string; name: string; commission_percent: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'hoje' | 'semana' | 'mes' | 'periodo'>('hoje')
  const [searchQuery, setSearchQuery] = useState('')

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <Check className="w-4 h-4 text-green-400" />
      case 'cancelled': return <X className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return 'concluida'
      case 'cancelled': return 'cancelada'
      default: return 'pendente'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-driver-background flex items-center justify-center">
        <History className="w-12 h-12 text-driver-primary animate-pulse" />
      </div>
    )
  }

  // Group deliveries by date
  const groupedDeliveries = deliveries.reduce((groups, delivery) => {
    const date = new Date(delivery.created_at).toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(delivery)
    return groups
  }, {} as Record<string, typeof deliveries>)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-driver-background/95 backdrop-blur-md border-b border-driver-surface">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-white text-xl font-bold">Histórico</h1>
          <button className="p-2 rounded-lg bg-driver-surface text-white hover:bg-driver-surface-lighter transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Period Filters */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {(['hoje', 'semana', 'mes', 'periodo'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-driver-primary text-white'
                  : 'bg-driver-surface text-driver-text-secondary'
              }`}
            >
              {filter === 'hoje' && 'Hoje'}
              {filter === 'semana' && 'Esta Semana'}
              {filter === 'mes' && 'Este Mês'}
              {filter === 'periodo' && 'Período'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-col gap-4 p-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <DriverCard>
            <DriverCardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-driver-primary" />
                <span className="text-driver-text-secondary text-xs">GANHOS</span>
              </div>
              <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
            </DriverCardContent>
          </DriverCard>
          <DriverCard>
            <DriverCardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bike className="w-4 h-4 text-driver-primary" />
                <span className="text-driver-text-secondary text-xs">CORRIDAS</span>
              </div>
              <p className="text-white text-2xl font-bold">{stats.totalDeliveries}</p>
            </DriverCardContent>
          </DriverCard>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-driver-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar ID, restaurante ou data..."
            className="w-full pl-12 pr-4 py-3 bg-driver-surface border border-driver-surface-lighter rounded-xl text-white placeholder:text-driver-text-secondary focus:outline-none focus:border-driver-primary"
          />
        </div>

        {/* Deliveries List */}
        {Object.entries(groupedDeliveries).map(([date, dateDeliveries]) => (
          <section key={date}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold capitalize">{date}</h3>
              <span className="text-driver-text-secondary text-sm">{dateDeliveries.length} corridas</span>
            </div>
            <div className="flex flex-col gap-3">
              {dateDeliveries.map((delivery) => (
                <DriverCard key={delivery.id}>
                  <DriverCardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="size-12 rounded-lg bg-white p-1 flex items-center justify-center">
                          {getStatusIcon(delivery.status)}
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{delivery.order?.customer_name || 'Cliente'}</h4>
                          <p className="text-driver-text-secondary text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(delivery.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • #{delivery.id.slice(-4)}
                          </p>
                          <p className="text-driver-text-muted text-xs flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {delivery.address?.split(',')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${delivery.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-driver-primary'}`}>
                          {formatCurrency(delivery.delivery_fee)}
                        </p>
                        <p className="text-driver-text-secondary text-xs mt-0.5">
                          {delivery.status === 'delivered' ? 'Crédito' : ''}
                        </p>
                        <DriverStatusBadge status={getStatusBadge(delivery.status)} className="mt-1" />
                      </div>
                    </div>
                  </DriverCardContent>
                </DriverCard>
              ))}
            </div>
          </section>
        ))}

        {deliveries.length === 0 && (
          <DriverCard>
            <DriverCardContent className="py-12 text-center">
              <History className="w-16 h-16 text-driver-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-driver-text-secondary">Nenhuma corrida encontrada</p>
              <p className="text-driver-text-muted text-sm mt-1">Suas entregas aparecerão aqui</p>
            </DriverCardContent>
          </DriverCard>
        )}
      </main>
    </div>
  )
}
