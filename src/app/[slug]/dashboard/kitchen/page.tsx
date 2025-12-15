'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, ChefHat, Bell, Maximize, Minimize, Printer, User, MessageSquare, TrendingUp, Timer, Package as PackageIcon, Users, Plus, Trash2, RefreshCw, Filter, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useOrders } from '@/hooks/useOrders'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type OrderItem = {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  products: {
    name: string
  }
}

interface Chef {
  id: string
  name: string
  is_active: boolean
}

export default function KitchenPage() {
  const params = useParams()
  const slug = params.slug as string
  const { t, formatCurrency: formatCurrencyI18n } = useLanguage()
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({})
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedChef, setSelectedChef] = useState<Record<string, string>>({})
  const [kitchenNotes, setKitchenNotes] = useState<Record<string, string>>({})
  const [showNoteModal, setShowNoteModal] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [chefs, setChefs] = useState<Chef[]>([])
  const [showChefManager, setShowChefManager] = useState(false)
  const [newChefName, setNewChefName] = useState('')
  const [completedToday, setCompletedToday] = useState(0)
  const [avgPrepTime, setAvgPrepTime] = useState(0)
  const [channelFilter, setChannelFilter] = useState<'all' | 'delivery' | 'dine_in' | 'takeout'>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'paid'>('all')
  const [lateFilter, setLateFilter] = useState<'all' | 'late'>('all')
  const [storeId, setStoreId] = useState<string | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const { orders, loading, updateOrderStatus, refreshOrders } = useOrders(storeId ?? undefined)

  // Constante para pedidos atrasados
  const LATE_MINUTES = 30

  // Buscar store_id
  useEffect(() => {
    async function fetchStore() {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      if (data) setStoreId(data.id)
    }
    if (slug) fetchStore()
  }, [slug])

  // Buscar cozinheiros do banco
  useEffect(() => {
    async function fetchChefs() {
      if (!storeId) return
      const { data } = await supabase
        .from('kitchen_chefs')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name')
      if (data) setChefs(data)
    }
    fetchChefs()
  }, [storeId])

  // Realtime subscription para pedidos
  useEffect(() => {
    if (!storeId) return

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('Realtime update:', payload)
          setLastUpdate(new Date())
          if (refreshOrders) refreshOrders()
          
          // Tocar som para novos pedidos
          if (payload.eventType === 'INSERT' && soundEnabled) {
            playNotificationSound('normal')
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, soundEnabled, refreshOrders])

  // Timer para atualizar tempo decorrido a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Calcular estatísticas
  useEffect(() => {
    const today = new Date().toDateString()
    const completedOrders = orders.filter(o => 
      o.status === 'delivered' && new Date(o.created_at).toDateString() === today
    )
    setCompletedToday(completedOrders.length)
    
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((acc, order) => {
        const created = new Date(order.created_at).getTime()
        const updated = new Date(order.updated_at).getTime()
        return acc + (updated - created)
      }, 0)
      setAvgPrepTime(Math.floor(totalTime / completedOrders.length / 60000))
    }
  }, [orders])

  // Notificação sonora diferenciada para novos pedidos
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length
    if (pendingCount > lastOrderCount && lastOrderCount > 0 && soundEnabled) {
      const urgentOrders = orders.filter(o => {
        const minutes = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000)
        return minutes > 20 && (o.status === 'pending' || o.status === 'confirmed')
      })
      playNotificationSound(urgentOrders.length > 0 ? 'urgent' : 'normal')
    }
    setLastOrderCount(pendingCount)
  }, [orders, lastOrderCount, soundEnabled])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isFullscreen])

  // Carregar itens dos pedidos
  useEffect(() => {
    async function loadOrderItems() {
      const orderIds = orders.map(o => o.id)
      if (orderIds.length === 0) return

      const { data } = await supabase
        .from('order_items')
        .select('id, product_id, quantity, unit_price, products(name)')
        .in('order_id', orderIds)

      if (data) {
        const itemsByOrder: Record<string, OrderItem[]> = {}
        data.forEach((item: any) => {
          const orderId = item.order_id
          if (!itemsByOrder[orderId]) itemsByOrder[orderId] = []
          itemsByOrder[orderId].push(item)
        })
        setOrderItems(itemsByOrder)
      }
    }
    loadOrderItems()
  }, [orders])

  const playNotificationSound = (type: 'normal' | 'urgent' = 'normal') => {
    if (audioRef.current) {
      audioRef.current.playbackRate = type === 'urgent' ? 1.5 : 1.0
      audioRef.current.volume = type === 'urgent' ? 1.0 : 0.7
      audioRef.current.play().catch(e => console.log('Erro ao tocar som:', e))
      
      if (type === 'urgent') {
        setTimeout(() => {
          audioRef.current?.play().catch(e => console.log('Erro:', e))
        }, 500)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log('Erro fullscreen:', e))
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(e => console.log('Erro exit fullscreen:', e))
      setIsFullscreen(false)
    }
  }

  const printOrder = (order: any) => {
    const printWindow = window.open('', '', 'width=300,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comanda #${order.order_code}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 10px; }
              h2 { text-align: center; margin: 5px 0; }
              .item { margin: 5px 0; }
              hr { border: 1px dashed #000; }
            </style>
          </head>
          <body>
            <h2>COMANDA #${order.order_code}</h2>
            <hr>
            <p><strong>Cliente:</strong> ${order.customer_name}</p>
            <p><strong>Tipo:</strong> ${getChannelLabel(order.order_type)}</p>
            <p><strong>Hora:</strong> ${new Date(order.created_at).toLocaleTimeString('pt-BR')}</p>
            <hr>
            <h3>ITENS:</h3>
            ${orderItems[order.id]?.map(item => `
              <div class="item">
                <strong>${item.quantity}x</strong> ${item.products?.name || 'Produto'}
              </div>
            `).join('') || ''}
            <hr>
            ${order.notes ? `<p><strong>OBS:</strong> ${order.notes}</p><hr>` : ''}
            <p style="text-align: center; margin-top: 20px;">*** FIM DA COMANDA ***</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const assignChef = (orderId: string, chef: string) => {
    setSelectedChef(prev => ({ ...prev, [orderId]: chef }))
  }

  const saveNote = (orderId: string) => {
    if (noteInput.trim()) {
      setKitchenNotes(prev => ({ ...prev, [orderId]: noteInput }))
      setNoteInput('')
      setShowNoteModal(null)
    }
  }

  const updateStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled') => {
    setUpdatingOrderId(id)
    try {
      await updateOrderStatus(id, newStatus)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('❌ Erro ao atualizar status do pedido')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const getElapsedTime = (dateString: string) => {
    const date = new Date(dateString)
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    return `${minutes} min`
  }

  const getTimerColor = (minutes: number) => {
    if (minutes < 10) return 'text-green-600'
    if (minutes < 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressPercentage = (dateString: string, maxMinutes: number = 30) => {
    const date = new Date(dateString)
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    return Math.min((minutes / maxMinutes) * 100, 100)
  }

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      delivery: 'Delivery',
      pickup: 'Retirada',
      dine_in: 'Mesa'
    }
    return labels[channel] || 'Outro'
  }

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      delivery: 'bg-purple-100 text-purple-700',
      pickup: 'bg-blue-100 text-blue-700',
      dine_in: 'bg-green-100 text-green-700'
    }
    return colors[channel] || 'bg-gray-100 text-gray-700'
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

  const filterByChannel = (ordersList: any[]) => {
    if (channelFilter === 'all') return ordersList
    return ordersList.filter(o => o.order_type === channelFilter)
  }

  const filterByPaymentStatus = (ordersList: any[]) => {
    if (paymentStatusFilter === 'all') return ordersList
    return ordersList.filter(o => (o.payment_status || 'pending') === paymentStatusFilter)
  }

  // Calcular pedidos atrasados
  const isOrderLate = (order: any) => {
    if (!['confirmed', 'preparing'].includes(order.status)) return false
    const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
    return minutes > LATE_MINUTES
  }

  const lateOrdersCount = orders.filter(isOrderLate).length

  // Filtrar por late
  const filterByLate = (ordersList: any[]) => {
    if (lateFilter === 'all') return ordersList
    return ordersList.filter(isOrderLate)
  }

  const pendingOrders = filterByLate(filterByPaymentStatus(filterByChannel(orders.filter(o => o.status === 'pending' || o.status === 'confirmed'))))
  const preparingOrders = filterByLate(filterByPaymentStatus(filterByChannel(orders.filter(o => o.status === 'preparing'))))
  const readyOrders = filterByPaymentStatus(filterByChannel(orders.filter(o => o.status === 'ready')))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-4 md:p-6 lg:p-8">
      {/* Audio para notificação */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header com controles */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-500/25">
                  <ChefHat className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                {t('menu.kitchen')}
              </h1>
              <p className="text-slate-500 mt-2 ml-14">Kitchen Display System - Pressione F para fullscreen</p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Indicador Realtime */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                isRealtimeConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <Zap className={`w-4 h-4 ${isRealtimeConnected ? 'text-emerald-500' : 'text-red-500'}`} />
                {isRealtimeConnected ? 'Ao vivo' : 'Offline'}
              </div>
              
              <button
                onClick={() => setShowChefManager(true)}
                className="p-3 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all shadow-md shadow-purple-100"
                title="Gerenciar Cozinheiros"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-xl transition-all shadow-md ${
                  soundEnabled ? 'bg-emerald-100 text-emerald-700 shadow-emerald-100' : 'bg-slate-100 text-slate-400 shadow-slate-100'
                }`}
                title={soundEnabled ? 'Som ativado' : 'Som desativado'}
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => refreshOrders && refreshOrders()}
                className="p-3 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all shadow-md shadow-blue-100"
                title="Atualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all shadow-md shadow-slate-100"
                title="Modo Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de Pedido</label>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
                >
                  <option value="all">Todos</option>
                  <option value="delivery">Delivery</option>
                  <option value="dine_in">Mesa</option>
                  <option value="takeout">Retirada</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-slate-600 mb-2">Status do Pagamento</label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
              </div>
              {/* Filtro Rápido de Atrasados */}
              <div className="flex items-end">
                <button
                  onClick={() => setLateFilter(lateFilter === 'all' ? 'late' : 'all')}
                  className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    lateFilter === 'late' 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/25' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                  Atrasados ({lateOrdersCount})
                </button>
              </div>
            </div>
          </div>

          {/* Painel de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <PackageIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Pendentes</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{pendingOrders.length}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Timer className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Em Preparo</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{preparingOrders.length}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Concluídos Hoje</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{completedToday}</div>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Tempo Médio</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{avgPrepTime || '--'} min</div>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pendentes */}
          <div>
            <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between shadow-lg">
              <span>Pendentes ({pendingOrders.length})</span>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {pendingOrders.map(order => {
                const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
                const isUrgent = minutes > 20
                const isCritical = minutes > 15
                
                return (
                <div key={order.id} className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 border-l-4 border-red-500 relative ${isUrgent ? 'animate-pulse' : ''}`}>
                  {isUrgent && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-lg">
                      🔥 URGENTE!
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl font-bold text-gray-900">{order.order_code}</div>
                    <div className="flex items-center gap-2">
                      {isCritical && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          ⚠️ {minutes} min
                        </span>
                      )}
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(order.order_type)}`}>
                        {getChannelLabel(order.order_type)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {getPaymentMethodLabel(order.payment_method || 'cash')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.payment_status || 'pending')}`}>
                      {getPaymentStatusLabel(order.payment_status || 'pending')}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className={`font-bold text-lg ${getTimerColor(Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000))}`}>
                        {getElapsedTime(order.created_at)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercentage(order.created_at)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.customer_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total: {formatCurrencyI18n(order.total_amount)}
                      </div>
                      {order.notes && (
                        <div className="text-sm text-orange-600 mt-1 italic">
                          Obs: {order.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Itens do pedido */}
                    {orderItems[order.id] && orderItems[order.id].length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Itens:</div>
                        {orderItems[order.id].map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.products?.name || 'Produto'}</span>
                            <span className="text-gray-500">{formatCurrencyI18n(item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Atribuição de Chef */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                      <User className="w-3 h-3 inline mr-1" />Atribuir para:
                    </label>
                    <select
                      value={selectedChef[order.id] || ''}
                      onChange={(e) => assignChef(order.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Selecionar cozinheiro...</option>
                      {chefs.map(chef => (
                        <option key={chef.id} value={chef.name}>{chef.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nota da Cozinha */}
                  {kitchenNotes[order.id] && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-xs font-semibold text-yellow-800 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />Nota:
                      </div>
                      <div className="text-sm text-yellow-900 mt-1">{kitchenNotes[order.id]}</div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => printOrder(order)}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      title="Imprimir Comanda"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                    <button
                      onClick={() => {
                        setShowNoteModal(order.id)
                        setNoteInput(kitchenNotes[order.id] || '')
                      }}
                      className="flex-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      title="Adicionar Nota"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Nota
                    </button>
                  </div>

                  <Button
                    onClick={() => updateStatus(order.id, 'preparing')}
                    disabled={updatingOrderId === order.id}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                  >
                    {updatingOrderId === order.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Atualizando...</>
                    ) : (
                      'Iniciar Preparo'
                    )}
                  </Button>
                </div>
              )})}
            </div>
          </div>

          {/* Em Preparo */}
          <div>
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between shadow-lg">
              <span>Em Preparo ({preparingOrders.length})</span>
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {preparingOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 border-l-4 border-amber-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl font-bold text-gray-900">{order.order_code}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(order.order_type)}`}>
                      {getChannelLabel(order.order_type)}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className={`font-bold text-lg ${getTimerColor(Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000))}`}>
                        {getElapsedTime(order.created_at)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercentage(order.created_at)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.customer_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total: {formatCurrencyI18n(order.total_amount)}
                      </div>
                      {order.notes && (
                        <div className="text-sm text-orange-600 mt-1 italic">
                          Obs: {order.notes}
                        </div>
                      )}
                    </div>
                    
                    {orderItems[order.id] && orderItems[order.id].length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Itens:</div>
                        {orderItems[order.id].map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.products?.name || 'Produto'}</span>
                            <span className="text-gray-500">{formatCurrencyI18n(item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => updateStatus(order.id, 'ready')}
                    disabled={updatingOrderId === order.id}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {updatingOrderId === order.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Atualizando...</>
                    ) : (
                      'Marcar como Pronto'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Prontos */}
          <div>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between shadow-lg">
              <span>Prontos ({readyOrders.length})</span>
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl font-bold text-gray-900">{order.order_code}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(order.order_type)}`}>
                      {getChannelLabel(order.order_type)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Pronto</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.customer_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total: {formatCurrencyI18n(order.total_amount)}
                      </div>
                    </div>
                    
                    {orderItems[order.id] && orderItems[order.id].length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Itens:</div>
                        {orderItems[order.id].map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.products?.name || 'Produto'}</span>
                            <span className="text-gray-500">{formatCurrencyI18n(item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => updateStatus(order.id, 'out_for_delivery')}
                    disabled={updatingOrderId === order.id}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                  >
                    {updatingOrderId === order.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Atualizando...</>
                    ) : (
                      'Finalizar Pedido'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Notas */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              Nota da Cozinha
            </h3>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Ex: Faltou ingrediente X, Cliente pediu pressa..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNoteModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveNote(showNoteModal)}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                Salvar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Cozinheiros */}
      {showChefManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowChefManager(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Gerenciar Cozinheiros
            </h3>
            
            {/* Adicionar novo cozinheiro */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newChefName}
                onChange={(e) => setNewChefName(e.target.value)}
                placeholder="Nome do cozinheiro"
                className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 outline-none"
              />
              <button
                onClick={async () => {
                  if (!newChefName.trim() || !storeId) return
                  await supabase.from('kitchen_chefs').insert([{ name: newChefName, store_id: storeId }])
                  const { data } = await supabase.from('kitchen_chefs').select('*').eq('store_id', storeId).eq('is_active', true).order('name')
                  if (data) setChefs(data)
                  setNewChefName('')
                }}
                disabled={!newChefName.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {/* Lista de cozinheiros */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chefs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum cozinheiro cadastrado
                </p>
              ) : (
                chefs.map(chef => (
                  <div key={chef.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-800">{chef.name}</span>
                    <button
                      onClick={async () => {
                        await supabase.from('kitchen_chefs').update({ is_active: false }).eq('id', chef.id)
                        const { data } = await supabase.from('kitchen_chefs').select('*').eq('store_id', storeId).eq('is_active', true).order('name')
                        if (data) setChefs(data)
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowChefManager(false)}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
