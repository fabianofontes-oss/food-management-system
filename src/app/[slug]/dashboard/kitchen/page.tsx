'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, ChefHat, Bell, Maximize, Minimize, Printer, User, MessageSquare, TrendingUp, Timer, Package as PackageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useOrders } from '@/hooks/useOrders'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

type OrderItem = {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  products: {
    name: string
  }
}

export default function KitchenPage() {
  const { t, formatCurrency: formatCurrencyI18n } = useLanguage()
  const { orders, loading, updateOrderStatus } = useOrders()
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
  const [chefs] = useState(['João', 'Maria', 'Carlos', 'Ana'])
  const [completedToday, setCompletedToday] = useState(0)
  const [avgPrepTime, setAvgPrepTime] = useState(0)

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload()
    }, 30000)
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

  const updateStatus = async (id: string, newStatus: string) => {
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

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      {/* Audio para notificação */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header com controles */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <ChefHat className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
                {t('menu.kitchen')}
              </h1>
              <p className="text-gray-600 mt-1">Kitchen Display System - Pressione F para fullscreen</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-xl transition-colors ${
                  soundEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}
                title={soundEnabled ? 'Som ativado' : 'Som desativado'}
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                title="Modo Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Painel de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <PackageIcon className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Pendentes</span>
              </div>
              <div className="text-3xl font-bold">{pendingOrders.length}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Timer className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Em Preparo</span>
              </div>
              <div className="text-3xl font-bold">{preparingOrders.length}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Concluídos Hoje</span>
              </div>
              <div className="text-3xl font-bold">{completedToday}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Tempo Médio</span>
              </div>
              <div className="text-3xl font-bold">{avgPrepTime || '--'} min</div>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pendentes */}
          <div>
            <div className="bg-red-100 text-red-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Pendentes ({pendingOrders.length})</span>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {pendingOrders.map(order => {
                const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
                const isUrgent = minutes > 20
                const isCritical = minutes > 15
                
                return (
                <div key={order.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 border-red-500 relative ${isUrgent ? 'animate-pulse' : ''}`}>
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
                        <option key={chef} value={chef}>{chef}</option>
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
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Em Preparo ({preparingOrders.length})</span>
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {preparingOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-yellow-500">
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
            <div className="bg-green-100 text-green-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Prontos ({readyOrders.length})</span>
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-green-500">
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
    </div>
  )
}
