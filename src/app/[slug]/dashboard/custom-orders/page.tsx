'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Calendar, Package, Clock, CheckCircle, Truck, Phone,
  Plus, Search, Filter, Loader2, AlertCircle, X,
  ChefHat, MapPin, DollarSign, MessageSquare, Printer,
  CalendarDays, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomOrder {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  delivery_date: string
  delivery_time: string | null
  delivery_type: string
  delivery_address: string | null
  subtotal: number
  total: number
  deposit_amount: number
  deposit_paid: boolean
  status: string
  notes: string | null
  created_at: string
  items?: CustomOrderItem[]
}

interface CustomOrderItem {
  id: string
  name: string
  quantity: number
  unit_price: number
  total_price: number
  customizations: any
  kit_details: any
  notes: string | null
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered'

export default function CustomOrdersPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      if (data) setStoreId(data.id)
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) loadOrders()
  }, [storeId, statusFilter])

  async function loadOrders() {
    let query = supabase
      .from('custom_orders')
      .select('*, items:custom_order_items(*)')
      .eq('store_id', storeId)
      .order('delivery_date', { ascending: true })
      .order('delivery_time', { ascending: true })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setOrders(data || [])
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    await supabase.from('custom_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    loadOrders()
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  async function markDepositPaid(orderId: string) {
    await supabase.from('custom_orders')
      .update({ deposit_paid: true, deposit_paid_at: new Date().toISOString() })
      .eq('id', orderId)
    loadOrders()
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      in_production: { label: 'Em Produção', color: 'bg-purple-100 text-purple-700', icon: ChefHat },
      ready: { label: 'Pronto', color: 'bg-green-100 text-green-700', icon: Package },
      delivered: { label: 'Entregue', color: 'bg-slate-100 text-slate-700', icon: Truck },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: X }
    }
    return statusMap[status] || statusMap.pending
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { 
      weekday: 'short', day: '2-digit', month: '2-digit' 
    })
  }

  const formatTime = (time: string | null) => {
    if (!time) return ''
    return time.slice(0, 5)
  }

  // Agrupar pedidos por data
  const ordersByDate = orders.reduce((acc, order) => {
    const date = order.delivery_date
    if (!acc[date]) acc[date] = []
    acc[date].push(order)
    return acc
  }, {} as Record<string, CustomOrder[]>)

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    inProduction: orders.filter(o => o.status === 'in_production').length,
    ready: orders.filter(o => o.status === 'ready').length,
    today: orders.filter(o => o.delivery_date === new Date().toISOString().split('T')[0]).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/25">
                <CalendarDays className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Encomendas
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Pedidos agendados e sob encomenda</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Encomenda
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Hoje</p>
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.today}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Pendentes</p>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Confirmados</p>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Produzindo</p>
              <ChefHat className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.inProduction}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Prontos</p>
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: '🕐 Pendentes' },
            { id: 'confirmed', label: '✅ Confirmados' },
            { id: 'in_production', label: '👨‍🍳 Produzindo' },
            { id: 'ready', label: '📦 Prontos' },
            { id: 'delivered', label: '🚚 Entregues' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id as StatusFilter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === filter.id 
                  ? 'bg-amber-500 text-white shadow-lg' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Lista de Encomendas por Data */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <CalendarDays className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma encomenda</h3>
            <p className="text-slate-500">As encomendas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(ordersByDate).map(([date, dateOrders]) => {
              const isToday = date === new Date().toISOString().split('T')[0]
              const isTomorrow = date === new Date(Date.now() + 86400000).toISOString().split('T')[0]
              
              return (
                <div key={date}>
                  <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${
                    isToday ? 'text-amber-600' : isTomorrow ? 'text-blue-600' : 'text-slate-700'
                  }`}>
                    <Calendar className="w-5 h-5" />
                    {isToday ? '📅 HOJE' : isTomorrow ? '📅 AMANHÃ' : formatDate(date)}
                    <span className="text-sm font-normal text-slate-400">({dateOrders.length} pedido{dateOrders.length > 1 ? 's' : ''})</span>
                  </h3>
                  
                  <div className="grid gap-4">
                    {dateOrders.map(order => {
                      const statusInfo = getStatusInfo(order.status)
                      const StatusIcon = statusInfo.icon
                      
                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl shadow-lg border p-5 hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold text-slate-800">#{order.order_number}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </span>
                                {!order.deposit_paid && order.deposit_amount > 0 && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                    💰 Sinal pendente
                                  </span>
                                )}
                              </div>
                              
                              <p className="font-medium text-slate-800">{order.customer_name}</p>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.customer_phone}
                              </p>
                              
                              {order.items && order.items.length > 0 && (
                                <div className="mt-2 text-sm text-slate-600">
                                  {order.items.map((item, i) => (
                                    <span key={item.id}>
                                      {item.quantity}x {item.name}
                                      {i < order.items!.length - 1 && ' + '}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-slate-500 mb-1">
                                {order.delivery_type === 'delivery' ? '🚚 Entrega' : '🏠 Retirada'}
                                {order.delivery_time && ` às ${formatTime(order.delivery_time)}`}
                              </p>
                              <p className="text-xl font-bold text-green-600">{formatCurrency(order.total)}</p>
                              {order.deposit_amount > 0 && (
                                <p className="text-xs text-slate-500">
                                  Sinal: {formatCurrency(order.deposit_amount)} 
                                  {order.deposit_paid ? ' ✅' : ' ⏳'}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {order.delivery_type === 'delivery' && order.delivery_address && (
                            <p className="mt-3 pt-3 border-t text-sm text-slate-500 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {order.delivery_address}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Detalhes */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Encomenda #{selectedOrder.order_number}</h3>
                  <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Status e Ações */}
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}>
                        ✅ Confirmar
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}>
                        ❌ Cancelar
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'in_production')}>
                      👨‍🍳 Iniciar Produção
                    </Button>
                  )}
                  {selectedOrder.status === 'in_production' && (
                    <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}>
                      📦 Marcar Pronto
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}>
                      🚚 Marcar Entregue
                    </Button>
                  )}
                  {!selectedOrder.deposit_paid && selectedOrder.deposit_amount > 0 && (
                    <Button size="sm" variant="outline" onClick={() => markDepositPaid(selectedOrder.id)}>
                      💰 Sinal Pago
                    </Button>
                  )}
                </div>

                {/* Cliente */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Cliente</h4>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <a href={`tel:${selectedOrder.customer_phone}`} className="text-blue-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {selectedOrder.customer_phone}
                  </a>
                </div>

                {/* Entrega */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Entrega</h4>
                  <p>{selectedOrder.delivery_type === 'delivery' ? '🚚 Entrega' : '🏠 Retirada no local'}</p>
                  <p className="font-medium">
                    {formatDate(selectedOrder.delivery_date)}
                    {selectedOrder.delivery_time && ` às ${formatTime(selectedOrder.delivery_time)}`}
                  </p>
                  {selectedOrder.delivery_address && (
                    <p className="text-sm text-slate-500 mt-1">📍 {selectedOrder.delivery_address}</p>
                  )}
                </div>

                {/* Itens */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Itens</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex justify-between text-lg font-bold text-green-700">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  {selectedOrder.deposit_amount > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 mt-1">
                      <span>Sinal ({selectedOrder.deposit_paid ? '✅ Pago' : '⏳ Pendente'})</span>
                      <span>{formatCurrency(selectedOrder.deposit_amount)}</span>
                    </div>
                  )}
                </div>

                {selectedOrder.notes && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h4 className="font-semibold text-amber-700 mb-1">📝 Observações</h4>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 pt-4">
                  <a
                    href={`https://wa.me/55${selectedOrder.customer_phone.replace(/\D/g, '')}?text=Olá ${selectedOrder.customer_name}! Sobre sua encomenda #${selectedOrder.order_number}...`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                  <Button variant="outline" className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
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
