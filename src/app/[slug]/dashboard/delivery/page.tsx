'use client'

import { useState, useEffect, useRef } from 'react'
import { Truck, MapPin, Clock, Phone, Package, User, Navigation, CheckCircle, XCircle, Loader2, Search, Calendar, BarChart3, TrendingUp, Printer, X, UserPlus, Play, CheckCheck, Ban, Bell, BellOff, Users, Edit, Trash2, Plus, Star } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Delivery {
  id: string
  order_id: string
  driver_id: string | null
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
  driver?: Driver
}

interface Driver {
  id: string
  tenant_id: string
  store_id: string
  name: string
  phone: string
  email: string | null
  vehicle_type: string | null
  vehicle_plate: string | null
  is_available: boolean
  is_active: boolean
  total_deliveries: number
  rating: number
  notes: string | null
  created_at: string
  updated_at: string
}

export default function DeliveryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [storeId, setStoreId] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)
  const [showDriversManager, setShowDriversManager] = useState(false)
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_type: 'moto',
    vehicle_plate: '',
    notes: ''
  })
  const [tenantId, setTenantId] = useState<string | null>(null)

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
          ),
          driver:drivers(
            id,
            name,
            phone,
            vehicle_type,
            rating
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

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setDrivers(data || [])
    } catch (err) {
      console.error('Erro ao carregar motoristas:', err)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('Delivery change:', payload)
          
          if (payload.eventType === 'INSERT') {
            playNotificationSound()
            showBrowserNotification('Nova Entrega!', 'Uma nova entrega foi criada')
          }
          
          fetchDeliveries()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(err => console.log('Erro ao tocar som:', err))
    }
  }

  const showBrowserNotification = (title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.png',
        badge: '/badge.png'
      })
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

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', deliveryId)

      if (error) throw error
      await fetchDeliveries()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status da entrega')
    }
  }

  const assignDriver = async (deliveryId: string, driverName: string, driverPhone: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          driver_name: driverName, 
          driver_phone: driverPhone,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (error) throw error
      await fetchDeliveries()
      setShowDriverModal(false)
      setSelectedDelivery(null)
      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '' })
    } catch (err) {
      console.error('Erro ao atribuir motorista:', err)
      alert('Erro ao atribuir motorista')
    }
  }

  const printDelivery = (delivery: Delivery) => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Entrega #${delivery.order?.order_code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .info { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Etiqueta de Entrega</h1>
          <div class="info"><span class="label">Pedido:</span> #${delivery.order?.order_code}</div>
          <div class="info"><span class="label">Cliente:</span> ${delivery.order?.customer_name}</div>
          <div class="info"><span class="label">Endereço:</span> ${delivery.address}</div>
          <div class="info"><span class="label">Telefone:</span> ${delivery.driver_phone || 'N/A'}</div>
          <div class="info"><span class="label">Valor:</span> ${formatCurrency(delivery.order?.total_amount || 0)}</div>
          <div class="info"><span class="label">Taxa de Entrega:</span> ${formatCurrency(delivery.delivery_fee || 0)}</div>
          ${delivery.notes ? `<div class="info"><span class="label">Observações:</span> ${delivery.notes}</div>` : ''}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesFilter = filter === 'all' || delivery.status === filter
    const matchesSearch = !searchTerm || 
      delivery.order?.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.order?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || delivery.created_at.startsWith(dateFilter)
    
    return matchesFilter && matchesSearch && matchesDate
  })

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
  }

  const metrics = {
    avgDeliveryTime: deliveries.filter(d => d.actual_delivery_time).length > 0
      ? Math.round(deliveries.filter(d => d.actual_delivery_time).reduce((acc, d) => acc + d.estimated_time, 0) / deliveries.filter(d => d.actual_delivery_time).length)
      : 0,
    successRate: deliveries.length > 0
      ? Math.round((deliveries.filter(d => d.status === 'delivered').length / deliveries.length) * 100)
      : 0,
    totalRevenue: deliveries.reduce((acc, d) => acc + (d.delivery_fee || 0), 0),
    todayDeliveries: deliveries.filter(d => d.created_at.startsWith(new Date().toISOString().split('T')[0])).length,
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

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por pedido, cliente ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={() => setShowMetrics(!showMetrics)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Métricas
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              Todas ({deliveries.length})
            </Button>
            <Button
              onClick={() => setFilter('pending')}
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
            >
              Pendentes ({stats.pending})
            </Button>
            <Button
              onClick={() => setFilter('in_transit')}
              variant={filter === 'in_transit' ? 'default' : 'outline'}
              size="sm"
            >
              Em Trânsito ({stats.in_transit})
            </Button>
            <Button
              onClick={() => setFilter('delivered')}
              variant={filter === 'delivered' ? 'default' : 'outline'}
              size="sm"
            >
              Entregues ({stats.delivered})
            </Button>
          </div>
        </div>

        {showMetrics && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Métricas de Desempenho</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Tempo Médio</div>
                <div className="text-3xl font-bold">{metrics.avgDeliveryTime} min</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Taxa de Sucesso</div>
                <div className="text-3xl font-bold">{metrics.successRate}%</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Receita de Taxas</div>
                <div className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm opacity-90 mb-1">Entregas Hoje</div>
                <div className="text-3xl font-bold">{metrics.todayDeliveries}</div>
              </div>
            </div>
          </div>
        )}

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

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {delivery.status === 'pending' && (
                      <Button
                        onClick={() => {
                          setSelectedDelivery(delivery)
                          setShowDriverModal(true)
                        }}
                        size="sm"
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        Atribuir Motorista
                      </Button>
                    )}
                    {delivery.status === 'assigned' && (
                      <Button
                        onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                        size="sm"
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <Package className="w-4 h-4" />
                        Marcar como Coletado
                      </Button>
                    )}
                    {delivery.status === 'picked_up' && (
                      <Button
                        onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                        size="sm"
                        className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar Entrega
                      </Button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <Button
                        onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                        size="sm"
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Finalizar Entrega
                      </Button>
                    )}
                    {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                      <Button
                        onClick={() => updateDeliveryStatus(delivery.id, 'cancelled')}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Ban className="w-4 h-4" />
                        Cancelar
                      </Button>
                    )}
                    <Button
                      onClick={() => printDelivery(delivery)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Criado em {new Date(delivery.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDriverModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Atribuir Motorista</h2>
                <button
                  onClick={() => {
                    setShowDriverModal(false)
                    setSelectedDelivery(null)
                    setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '' })
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Pedido: <strong>#{selectedDelivery.order?.order_code}</strong>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Cliente: <strong>{selectedDelivery.order?.customer_name}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Motorista
                  </label>
                  <input
                    type="text"
                    value={newDriver.name}
                    onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                    placeholder="Digite o nome do motorista"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone do Motorista
                  </label>
                  <input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => assignDriver(selectedDelivery.id, newDriver.name, newDriver.phone)}
                    disabled={!newDriver.name || !newDriver.phone}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Atribuir
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDriverModal(false)
                      setSelectedDelivery(null)
                      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '' })
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
