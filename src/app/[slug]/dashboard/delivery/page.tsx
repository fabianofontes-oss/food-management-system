'use client'

import { useState, useEffect } from 'react'
import { Truck, MapPin, Clock, Phone, Package, User, Navigation, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Delivery {
  id: string
  order_id: string
  driver_name: string | null
  driver_phone: string | null
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  estimated_time: number
  actual_delivery_time: string | null
  delivery_fee: number
  address: string
  notes: string | null
  created_at: string
  updated_at: string
  order?: {
    order_code: string
    customer_name: string
    total_amount: number
  }
}

export default function DeliveryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [storeId, setStoreId] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchStore() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()

        if (error) throw error
        setStoreId(data.id)
      } catch (err) {
        console.error('Erro ao buscar loja:', err)
      }
    }

    if (slug) {
      fetchStore()
    }
  }, [slug])

  useEffect(() => {
    if (storeId) {
      fetchDeliveries()
    }
  }, [storeId])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders(
            order_code,
            customer_name,
            total_amount
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeliveries(data || [])
    } catch (err) {
      console.error('Erro ao carregar entregas:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      assigned: 'bg-blue-100 text-blue-700 border-blue-300',
      picked_up: 'bg-purple-100 text-purple-700 border-purple-300',
      in_transit: 'bg-orange-100 text-orange-700 border-orange-300',
      delivered: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      assigned: 'Atribuído',
      picked_up: 'Coletado',
      in_transit: 'Em Trânsito',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      assigned: User,
      picked_up: Package,
      in_transit: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
    }
    const Icon = icons[status] || Clock
    return <Icon className="w-4 h-4" />
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter === 'all') return true
    return delivery.status === filter
  })

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando entregas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="w-10 h-10 text-blue-600" />
              Delivery
            </h1>
            <p className="text-gray-600 mt-1">
              {deliveries.length} entrega{deliveries.length !== 1 ? 's' : ''} no total
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Total de Entregas</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Pendentes</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Em Trânsito</div>
            <div className="text-3xl font-bold text-orange-600">{stats.in_transit}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Entregues</div>
            <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              Todas ({deliveries.length})
            </Button>
            <Button
              onClick={() => setFilter('pending')}
              variant={filter === 'pending' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              Pendentes ({stats.pending})
            </Button>
            <Button
              onClick={() => setFilter('in_transit')}
              variant={filter === 'in_transit' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              Em Trânsito ({stats.in_transit})
            </Button>
            <Button
              onClick={() => setFilter('delivered')}
              variant={filter === 'delivered' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              Entregues ({stats.delivered})
            </Button>
          </div>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nenhuma entrega encontrada
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Ainda não há entregas cadastradas'
                : `Não há entregas com status "${getStatusLabel(filter)}"`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDeliveries.map(delivery => (
              <div key={delivery.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Pedido #{delivery.order?.order_code}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        {getStatusLabel(delivery.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <User className="w-4 h-4" />
                      <span>{delivery.order?.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{delivery.address}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCurrency(delivery.order?.total_amount || 0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Taxa: {formatCurrency(delivery.delivery_fee || 0)}
                    </div>
                  </div>
                </div>

                {delivery.driver_name && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 rounded-full p-2">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{delivery.driver_name}</div>
                          {delivery.driver_phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {delivery.driver_phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{delivery.estimated_time} min</span>
                      </div>
                    </div>
                  </div>
                )}

                {delivery.notes && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Observações:</strong> {delivery.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Criado em {new Date(delivery.created_at).toLocaleString('pt-BR')}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      Rastrear
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
