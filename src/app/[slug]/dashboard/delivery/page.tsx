'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Truck, MapPin, Clock, Phone, Package, User, Navigation, CheckCircle, XCircle, Loader2, Search, Calendar, BarChart3, TrendingUp, Printer, X, UserPlus, Play, CheckCheck, Ban, Bell, BellOff, Users, Edit, Trash2, Plus, Star, History, DollarSign, Link2, Copy, ExternalLink, Percent } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
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
  commission_percent: number
  total_earnings: number
  created_at: string
  updated_at: string
}

export default function DeliveryPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeError, setStoreError] = useState('')
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'paid'>('all')
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
    notes: '',
    commission_percent: 10
  })
  const [showDriverHistory, setShowDriverHistory] = useState<Driver | null>(null)
  const [driverDeliveries, setDriverDeliveries] = useState<Delivery[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStore() {
      try {
        setStoreError('')
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          setStoreError('Loja não encontrada')
          setLoading(false)
          return
        }
        setStoreId(data.id)
      } catch (err: any) {
        console.error('Erro ao buscar loja (delivery):', {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
          slug
        })
        setStoreError('Erro ao carregar loja')
        setLoading(false)
      }
    }

    if (slug) {
      fetchStore()
    }
  }, [slug, supabase])

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
        (payload: { eventType: string }) => {
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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      cash: 'Dinheiro',
      card: 'Cartão',
      card_on_delivery: 'Cartão na Entrega',
      online: 'Online'
    }
    return labels[method] || method
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Pago',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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
      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
    } catch (err) {
      console.error('Erro ao atribuir motorista:', err)
      alert('Erro ao atribuir motorista')
    }
  }

  const createDriver = async () => {
    try {
      if (!newDriver.name || !newDriver.phone) {
        alert('Nome e telefone são obrigatórios')
        return
      }

      const { error } = await supabase
        .from('drivers')
        .insert({
          tenant_id: tenantId,
          store_id: storeId,
          name: newDriver.name,
          phone: newDriver.phone,
          email: newDriver.email || null,
          vehicle_type: newDriver.vehicle_type || null,
          vehicle_plate: newDriver.vehicle_plate || null,
          notes: newDriver.notes || null
        })

      if (error) throw error
      
      await fetchDrivers()
      setShowDriverForm(false)
      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
      alert('Motorista cadastrado com sucesso!')
    } catch (err) {
      console.error('Erro ao criar motorista:', err)
      alert('Erro ao cadastrar motorista')
    }
  }

  const updateDriver = async () => {
    try {
      if (!editingDriver || !newDriver.name || !newDriver.phone) {
        alert('Nome e telefone são obrigatórios')
        return
      }

      const { error } = await supabase
        .from('drivers')
        .update({
          name: newDriver.name,
          phone: newDriver.phone,
          email: newDriver.email || null,
          vehicle_type: newDriver.vehicle_type || null,
          vehicle_plate: newDriver.vehicle_plate || null,
          notes: newDriver.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDriver.id)

      if (error) throw error
      
      await fetchDrivers()
      setShowDriverForm(false)
      setEditingDriver(null)
      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
      alert('Motorista atualizado com sucesso!')
    } catch (err) {
      console.error('Erro ao atualizar motorista:', err)
      alert('Erro ao atualizar motorista')
    }
  }

  const deleteDriver = async (driverId: string) => {
    try {
      if (!confirm('Tem certeza que deseja excluir este motorista?')) {
        return
      }

      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId)

      if (error) throw error
      
      await fetchDrivers()
      alert('Motorista excluído com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir motorista:', err)
      alert('Erro ao excluir motorista')
    }
  }

  const toggleDriverAvailability = async (driverId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          is_available: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)

      if (error) throw error
      await fetchDrivers()
    } catch (err) {
      console.error('Erro ao alterar disponibilidade:', err)
      alert('Erro ao alterar disponibilidade')
    }
  }

  const openEditDriver = (driver: Driver) => {
    setEditingDriver(driver)
    setNewDriver({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      vehicle_type: driver.vehicle_type || 'moto',
      vehicle_plate: driver.vehicle_plate || '',
      notes: driver.notes || '',
      commission_percent: driver.commission_percent || 10
    })
    setShowDriverForm(true)
  }

  // Buscar histórico de entregas do motorista
  const fetchDriverHistory = async (driver: Driver) => {
    try {
      const { data } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders(order_code, customer_name, total_amount)
        `)
        .eq('store_id', storeId)
        .eq('driver_name', driver.name)
        .order('created_at', { ascending: false })
        .limit(50)

      setDriverDeliveries(data || [])
      setShowDriverHistory(driver)
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
    }
  }

  // Calcular comissão do motorista
  const calculateDriverEarnings = (driver: Driver) => {
    const driverDelivs = deliveries.filter(d => d.driver_name === driver.name && d.status === 'delivered')
    const totalFees = driverDelivs.reduce((acc, d) => acc + (d.delivery_fee || 0), 0)
    const commission = (totalFees * (driver.commission_percent || 10)) / 100
    return { total: totalFees, commission, count: driverDelivs.length }
  }

  // Gerar link de rastreio
  const generateTrackingLink = (delivery: Delivery) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/${slug}/rastreio/${delivery.id}`
  }

  // Copiar link para clipboard
  const copyTrackingLink = async (delivery: Delivery) => {
    const link = generateTrackingLink(delivery)
    try {
      await navigator.clipboard.writeText(link)
      alert('Link copiado!')
    } catch (err) {
      console.error('Erro ao copiar:', err)
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
    const matchesPaymentStatus = paymentStatusFilter === 'all' || (delivery.order as any)?.payment_status === paymentStatusFilter || (!((delivery.order as any)?.payment_status) && paymentStatusFilter === 'pending')
    const matchesSearch = !searchTerm || 
      delivery.order?.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.order?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || delivery.created_at.startsWith(dateFilter)
    
    return matchesFilter && matchesPaymentStatus && matchesSearch && matchesDate
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando entregas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-lg shadow-cyan-500/25">
                <Truck className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Delivery
            </h1>
            <p className="text-slate-500 mt-2 ml-14">
              {deliveries.length} entrega{deliveries.length !== 1 ? 's' : ''} no total
            </p>
          </div>
          <Button
            onClick={() => setShowDriversManager(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25"
          >
            <Users className="w-5 h-5" />
            Gerenciar Motoristas ({drivers.length})
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Total de Entregas</div>
              <div className="p-2 bg-slate-100 rounded-xl">
                <Truck className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Pendentes</div>
              <div className="p-2 bg-amber-100 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Em Trânsito</div>
              <div className="p-2 bg-orange-100 rounded-xl">
                <Navigation className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-600">{stats.in_transit}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Entregues</div>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{stats.delivered}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por pedido, cliente ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all"
              />
            </div>
            <Button
              onClick={() => setShowMetrics(!showMetrics)}
              variant="outline"
              className="flex items-center gap-2 hover:shadow-md transition-all"
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
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Truck className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Nenhuma entrega encontrada
            </h3>
            <p className="text-slate-500">
              {filter === 'all' 
                ? 'Ainda não há entregas cadastradas'
                : `Não há entregas com status "${getStatusLabel(filter)}"`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDeliveries.map(delivery => (
              <div key={delivery.id} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl transition-all">
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
                    <Button
                      onClick={() => copyTrackingLink(delivery)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <Link2 className="w-4 h-4" />
                      Link Rastreio
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-4">
                    <span>Criado em {new Date(delivery.created_at).toLocaleString('pt-BR')}</span>
                    {delivery.driver_name && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <DollarSign className="w-3 h-3" />
                        Comissão: {formatCurrency((delivery.delivery_fee || 0) * 0.1)}
                      </span>
                    )}
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
                    setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
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
                      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
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

        {/* Modal de Gestão de Motoristas */}
        {showDriversManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Gerenciar Motoristas
                </h2>
                <button
                  onClick={() => setShowDriversManager(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    {drivers.length} motorista{drivers.length !== 1 ? 's' : ''} cadastrado{drivers.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    onClick={() => {
                      setEditingDriver(null)
                      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
                      setShowDriverForm(true)
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Motorista
                  </Button>
                </div>

                {drivers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Nenhum motorista cadastrado
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Cadastre motoristas para facilitar a atribuição de entregas
                    </p>
                    <Button
                      onClick={() => {
                        setEditingDriver(null)
                        setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
                        setShowDriverForm(true)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Primeiro Motorista
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {drivers.map(driver => (
                      <div key={driver.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{driver.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                driver.is_available 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {driver.is_available ? 'Disponível' : 'Indisponível'}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {driver.phone}
                              </div>
                              {driver.email && (
                                <div className="flex items-center gap-2">
                                  <span>📧</span>
                                  {driver.email}
                                </div>
                              )}
                              {driver.vehicle_type && (
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  {driver.vehicle_type === 'moto' ? 'Moto' : driver.vehicle_type === 'carro' ? 'Carro' : 'Bicicleta'}
                                  {driver.vehicle_plate && ` - ${driver.vehicle_plate}`}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                {driver.rating?.toFixed(1) || '0.0'} | {driver.total_deliveries || 0} entregas
                              </div>
                              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <Percent className="w-4 h-4" />
                                Comissão: {driver.commission_percent || 10}%
                                {(() => {
                                  const earnings = calculateDriverEarnings(driver)
                                  return earnings.count > 0 ? (
                                    <span className="ml-2 text-emerald-700">
                                      ({formatCurrency(earnings.commission)} de {earnings.count} entregas)
                                    </span>
                                  ) : null
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => fetchDriverHistory(driver)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <History className="w-4 h-4" />
                              Histórico
                            </Button>
                            <Button
                              onClick={() => toggleDriverAvailability(driver.id, driver.is_available)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {driver.is_available ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </Button>
                            <Button
                              onClick={() => openEditDriver(driver)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteDriver(driver.id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Formulário (Criar/Editar Motorista) */}
        {showDriverForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDriver ? 'Editar Motorista' : 'Novo Motorista'}
                </h2>
                <button
                  onClick={() => {
                    setShowDriverForm(false)
                    setEditingDriver(null)
                    setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newDriver.name}
                    onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Veículo
                  </label>
                  <select
                    value={newDriver.vehicle_type}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicle_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="moto">Moto</option>
                    <option value="carro">Carro</option>
                    <option value="bicicleta">Bicicleta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    value={newDriver.vehicle_plate}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicle_plate: e.target.value.toUpperCase() })}
                    placeholder="ABC-1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={newDriver.notes}
                    onChange={(e) => setNewDriver({ ...newDriver, notes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comissão (%)
                  </label>
                  <input
                    type="number"
                    value={newDriver.commission_percent}
                    onChange={(e) => setNewDriver({ ...newDriver, commission_percent: parseInt(e.target.value) || 10 })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={editingDriver ? updateDriver : createDriver}
                    disabled={!newDriver.name || !newDriver.phone}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {editingDriver ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDriverForm(false)
                      setEditingDriver(null)
                      setNewDriver({ name: '', phone: '', email: '', vehicle_type: 'moto', vehicle_plate: '', notes: '', commission_percent: 10 })
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

        {/* Modal de Histórico do Motorista */}
        {showDriverHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6" />
                    Histórico de {showDriverHistory.name}
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    {driverDeliveries.length} entregas encontradas
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDriverHistory(null)
                    setDriverDeliveries([])
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {driverDeliveries.filter(d => d.status === 'delivered').length}
                    </div>
                    <div className="text-sm text-blue-600">Entregues</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(driverDeliveries.reduce((acc, d) => acc + (d.delivery_fee || 0), 0))}
                    </div>
                    <div className="text-sm text-emerald-600">Total Taxas</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      {formatCurrency(driverDeliveries.reduce((acc, d) => acc + (d.delivery_fee || 0), 0) * ((showDriverHistory.commission_percent || 10) / 100))}
                    </div>
                    <div className="text-sm text-purple-600">Comissão ({showDriverHistory.commission_percent || 10}%)</div>
                  </div>
                </div>

                {/* Lista de entregas */}
                {driverDeliveries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma entrega encontrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {driverDeliveries.map(delivery => (
                      <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-bold text-gray-900">
                            #{delivery.order?.order_code}
                          </div>
                          <div className="text-sm text-gray-600">
                            {delivery.order?.customer_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(delivery.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                            {getStatusLabel(delivery.status)}
                          </div>
                          <div className="text-sm font-medium text-emerald-600 mt-1">
                            +{formatCurrency((delivery.delivery_fee || 0) * ((showDriverHistory.commission_percent || 10) / 100))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <Button
                  onClick={() => {
                    setShowDriverHistory(null)
                    setDriverDeliveries([])
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
