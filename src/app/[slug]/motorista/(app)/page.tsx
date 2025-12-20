'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, MessageSquare, MapPin, Clock, Package, ChevronRight, Bike } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DriverHeader } from '@/modules/driver/components/ui/DriverHeader'
import { DriverCard, DriverCardContent } from '@/modules/driver/components/ui/DriverCard'
import { DriverButton } from '@/modules/driver/components/ui/DriverButton'
import { DriverStatusBadge } from '@/modules/driver/components/ui/DriverStatusBadge'
import { useDriverDeliveries } from '@/modules/driver/hooks/useDriverDeliveries'
import { useDriverStats } from '@/modules/driver/hooks/useDriverStats'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default function DriverDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const storeSlug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [store, setStore] = useState<{ id: string; name: string } | null>(null)
  const [driver, setDriver] = useState<{ id: string; name: string; phone: string; commission_percent: number; photo_url?: string } | null>(null)
  const [loading, setLoading] = useState(true)

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

  const { deliveries, pendingDeliveries } = useDriverDeliveries(store?.id || '', driver?.name || '')
  const { stats } = useDriverStats(deliveries, driver?.commission_percent || 10)

  const currentDelivery = pendingDeliveries.find(d => d.status === 'in_transit' || d.status === 'picked_up')
  const availableDeliveries = pendingDeliveries.filter(d => d.status === 'assigned' || d.status === 'pending')

  if (loading || !driver || !store) {
    return (
      <div className="min-h-screen bg-driver-background flex items-center justify-center">
        <Bike className="w-12 h-12 text-driver-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <DriverHeader
        driverName={driver.name}
        photoUrl={driver.photo_url}
        isOnline={true}
      />

      <main className="flex flex-col gap-5 p-4">
        {/* Earnings Summary Card */}
        <DriverCard variant="gradient" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Package className="w-28 h-28 text-driver-primary" />
          </div>
          <DriverCardContent className="relative z-10 p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-driver-text-secondary text-sm font-medium">Ganhos de Hoje</p>
              <Link
                href={`/${storeSlug}/motorista/historico`}
                className="text-driver-primary hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                Ver Histórico <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
              {formatCurrency(stats.todayEarnings)}
            </h1>
            <div className="grid grid-cols-2 gap-4 border-t border-driver-surface-lighter pt-4">
              <div>
                <p className="text-driver-text-secondary text-xs mb-1">Entregas</p>
                <p className="text-white text-lg font-bold flex items-center gap-1">
                  <Bike className="w-5 h-5 text-driver-primary" /> {stats.todayDeliveries}
                </p>
              </div>
              <div>
                <p className="text-driver-text-secondary text-xs mb-1">Tempo Online</p>
                <p className="text-white text-lg font-bold flex items-center gap-1">
                  <Clock className="w-5 h-5 text-driver-primary" /> 4h 20m
                </p>
              </div>
            </div>
          </DriverCardContent>
        </DriverCard>

        {/* Current Delivery */}
        {currentDelivery && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-lg font-bold">Entrega Atual</h3>
              <DriverStatusBadge status="em_andamento" />
            </div>
            <DriverCard variant="highlight">
              <div className="h-32 w-full relative bg-gray-700 rounded-t-xl overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{
                    backgroundImage: `url("https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(currentDelivery.address || 'São Paulo')}&zoom=14&size=400x200&maptype=roadmap&key=")`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-driver-surface to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <div className="bg-white p-1 rounded-md">
                    <Package className="w-6 h-6 text-driver-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">
                      {currentDelivery.order?.customer_name || 'Cliente'}
                    </p>
                    <p className="text-gray-300 text-xs">Pedido #{currentDelivery.id?.slice(-4)}</p>
                  </div>
                </div>
              </div>
              <DriverCardContent>
                <div className="relative pl-4 border-l border-driver-surface-lighter space-y-6 my-4 ml-2">
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-driver-primary ring-4 ring-driver-surface" />
                    <p className="text-driver-text-secondary text-xs line-through">
                      Coletar em {store.name}
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full border-2 border-driver-primary bg-driver-surface animate-pulse" />
                    <p className="text-white text-sm font-semibold">
                      Entregar em {currentDelivery.address}
                    </p>
                    <p className="text-driver-primary text-xs mt-0.5">
                      Est. 5 min
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <DriverButton variant="secondary" className="flex-1">
                    <MessageSquare className="w-4 h-4" /> Chat
                  </DriverButton>
                  <DriverButton variant="primary" className="flex-[2]">
                    <Check className="w-4 h-4" /> Finalizar Entrega
                  </DriverButton>
                </div>
              </DriverCardContent>
            </DriverCard>
          </section>
        )}

        {/* Available Deliveries */}
        <section>
          <div className="flex items-center justify-between mb-3 mt-2">
            <h3 className="text-white text-lg font-bold">Novas Corridas</h3>
            <span className="text-driver-text-secondary text-xs">Próximas a você</span>
          </div>
          <div className="flex flex-col gap-4">
            {availableDeliveries.length === 0 ? (
              <DriverCard>
                <DriverCardContent className="py-8 text-center">
                  <Bike className="w-12 h-12 text-driver-text-secondary mx-auto mb-3 opacity-50" />
                  <p className="text-driver-text-secondary">Nenhuma corrida disponível no momento</p>
                  <p className="text-driver-text-muted text-sm mt-1">Fique online para receber novas corridas</p>
                </DriverCardContent>
              </DriverCard>
            ) : (
              availableDeliveries.slice(0, 3).map((delivery) => (
                <DriverCard key={delivery.id} className="hover:border-driver-surface-lighter">
                  <DriverCardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-lg bg-white p-1 flex items-center justify-center">
                          <Package className="w-6 h-6 text-driver-primary" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base">
                            {delivery.order?.customer_name || 'Novo Pedido'}
                          </h4>
                          <div className="flex items-center gap-1 text-driver-text-secondary text-xs mt-0.5">
                            <MapPin className="w-3 h-3" /> {delivery.address?.split(',')[0] || 'Endereço'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-driver-primary font-extrabold text-xl">
                          {formatCurrency(delivery.delivery_fee || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-3 border-y border-driver-surface-lighter mb-3">
                      <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                        <MapPin className="w-4 h-4 text-driver-text-secondary" />
                        3.2 km
                      </div>
                      <div className="w-px h-4 bg-driver-surface-lighter" />
                      <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                        <Clock className="w-4 h-4 text-driver-text-secondary" />
                        15 min
                      </div>
                      <div className="w-px h-4 bg-driver-surface-lighter" />
                      <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                        <Package className="w-4 h-4 text-driver-text-secondary" />
                        2 Itens
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DriverButton variant="outline">Rejeitar</DriverButton>
                      <DriverButton variant="primary">Aceitar</DriverButton>
                    </div>
                  </DriverCardContent>
                </DriverCard>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
