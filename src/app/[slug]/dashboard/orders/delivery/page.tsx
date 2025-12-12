'use client'

import { useState, useEffect, useRef } from 'react'
import { Package, Truck, Loader2, Info, Printer, MessageSquare, User, Copy, Navigation, MapPin, Phone, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useOrders } from '@/hooks/useOrders'
import { useSettings } from '@/hooks/useSettings'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeliveryHeader } from './components/DeliveryHeader'
import { DeliveryStats } from './components/DeliveryStats'
import { useDeliveryStats } from './hooks/useDeliveryStats'
import { copyAddress, openInMaps, printDeliveryLabel } from './utils/deliveryHelpers'

export default function DeliveryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [storeId, setStoreId] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadStore() {
      if (!slug) return
      const { data } = await supabase.from('stores').select('id').eq('slug', slug).single()
      if (data) setStoreId(data.id)
    }
    loadStore()
  }, [slug])
  
  const { orders, loading, updateOrderStatus } = useOrders()
  const { settings } = useSettings(storeId)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [drivers] = useState(['Carlos Entregador', 'Ana Delivery', 'José Motoboy'])
  const [assignedDriver, setAssignedDriver] = useState<Record<string, string>>({})
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({})
  const [showNoteModal, setShowNoteModal] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({})

  const deliveryOrders = orders.filter(o => o.order_type === 'delivery')
  const stats = useDeliveryStats(deliveryOrders)

  useEffect(() => {
    const pendingCount = deliveryOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length
    if (pendingCount > lastOrderCount && lastOrderCount > 0 && soundEnabled) {
      if (audioRef.current) audioRef.current.play().catch(e => console.log('Erro ao tocar som:', e))
    }
    setLastOrderCount(pendingCount)
  }, [deliveryOrders, lastOrderCount, soundEnabled])

  useEffect(() => {
    async function loadOrderItems() {
      const orderIds = deliveryOrders.map(o => o.id)
      if (orderIds.length === 0) return
      const { data } = await supabase.from('order_items').select('id, order_id, product_id, quantity, unit_price, products(name)').in('order_id', orderIds)
      if (data) {
        const itemsByOrder: Record<string, any[]> = {}
        data.forEach((item: any) => {
          const orderId = item.order_id
          if (!itemsByOrder[orderId]) itemsByOrder[orderId] = []
          itemsByOrder[orderId].push(item)
        })
        setOrderItems(itemsByOrder)
      }
    }
    loadOrderItems()
  }, [deliveryOrders])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingOrderId(id)
    try {
      await updateOrderStatus(id, newStatus as any)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('❌ Erro ao atualizar status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const assignDriver = (orderId: string, driver: string) => {
    setAssignedDriver(prev => ({ ...prev, [orderId]: driver }))
  }

  const saveNote = (orderId: string) => {
    if (noteInput.trim()) {
      setDeliveryNotes(prev => ({ ...prev, [orderId]: noteInput }))
      setNoteInput('')
      setShowNoteModal(null)
    }
  }

  const pendingDeliveries = deliveryOrders.filter(d => d.status === 'pending' || d.status === 'confirmed')
  const assignedDeliveries = deliveryOrders.filter(d => d.status === 'preparing' || d.status === 'ready')
  const inTransitDeliveries = deliveryOrders.filter(d => d.status === 'out_for_delivery')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando entregas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      
      <div className="max-w-7xl mx-auto">
        <DeliveryHeader soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)} />
        
        <DeliveryStats 
          pendingCount={pendingDeliveries.length}
          inTransitCount={inTransitDeliveries.length}
          deliveredToday={stats.deliveredToday}
          avgDeliveryTime={stats.avgDeliveryTime}
        />

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-blue-900 mb-1">Configurações de Entrega</div>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• Taxa: <span className="font-bold">{formatCurrency(settings?.delivery_fee || 0)}</span></div>
              <div>• Raio: <span className="font-bold">{settings?.delivery_radius || 0} km</span></div>
              <div>• Tempo estimado: <span className="font-bold">{settings?.estimated_prep_time || 0} min</span></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div>
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Aguardando ({pendingDeliveries.length})</span>
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {pendingDeliveries.map(delivery => {
                const minutes = Math.floor((Date.now() - new Date(delivery.created_at).getTime()) / 60000)
                const isUrgent = minutes > 30
                
                return (
                  <div key={delivery.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 border-yellow-500 relative ${isUrgent ? 'animate-pulse' : ''}`}>
                    {isUrgent && (
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-lg">
                        🔥 URGENTE!
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-gray-900">#{delivery.order_code}</div>
                      {minutes > 20 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          ⚠️ {minutes} min
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold">{delivery.customer_name}</div>
                          <div className="text-sm text-gray-600">{delivery.delivery_address || 'Endereço não informado'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <span className="text-sm">{delivery.customer_phone || ''}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => copyAddress(delivery.delivery_address || '')} className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs flex items-center justify-center gap-1">
                          <Copy className="w-3 h-3" />Copiar
                        </button>
                        <button onClick={() => openInMaps(delivery.delivery_address || '')} className="flex-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs flex items-center justify-center gap-1">
                          <Navigation className="w-3 h-3" />Maps
                        </button>
                      </div>
                    </div>

                    {orderItems[delivery.id] && orderItems[delivery.id].length > 0 && (
                      <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                        <div className="text-xs font-semibold text-purple-800 uppercase mb-1">Itens:</div>
                        {orderItems[delivery.id].map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.products?.name || 'Produto'}</span>
                            <span className="text-gray-500">{formatCurrency(item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-2xl font-bold text-purple-600 mb-3">
                      Total: {formatCurrency(delivery.total_amount)}
                    </div>

                    <div className="mb-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                        <User className="w-3 h-3 inline mr-1" />Atribuir entregador:
                      </label>
                      <select value={assignedDriver[delivery.id] || ''} onChange={(e) => assignDriver(delivery.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm">
                        <option value="">Selecione...</option>
                        {drivers.map(driver => <option key={driver} value={driver}>{driver}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button onClick={() => printDeliveryLabel(delivery, orderItems, deliveryNotes)} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Printer className="w-4 h-4" />Imprimir
                      </button>
                      <button onClick={() => { setShowNoteModal(delivery.id); setNoteInput(deliveryNotes[delivery.id] || '') }} className="flex-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />Nota
                      </button>
                    </div>

                    <Button onClick={() => updateStatus(delivery.id, 'preparing')} disabled={updatingOrderId === delivery.id} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                      {updatingOrderId === delivery.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Iniciar Preparo'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="bg-blue-100 text-blue-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Pronto ({assignedDeliveries.length})</span>
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {assignedDeliveries.map(delivery => (
                <div key={delivery.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-blue-500">
                  <div className="text-2xl font-bold text-gray-900 mb-3">#{delivery.order_code}</div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-semibold">{delivery.customer_name}</span>
                    </div>
                    <div className="text-sm text-gray-600">{delivery.delivery_address}</div>
                  </div>
                  <div className="text-xl font-bold text-blue-600 mb-3">Total: {formatCurrency(delivery.total_amount)}</div>
                  {assignedDriver[delivery.id] && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                      <div className="text-xs font-semibold text-blue-800 uppercase">Entregador:</div>
                      <div className="text-sm font-bold text-blue-900">{assignedDriver[delivery.id]}</div>
                    </div>
                  )}
                  <Button onClick={() => updateStatus(delivery.id, 'out_for_delivery')} disabled={updatingOrderId === delivery.id} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    {updatingOrderId === delivery.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Saiu para Entrega'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-green-100 text-green-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Em Rota ({inTransitDeliveries.length})</span>
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {inTransitDeliveries.map(delivery => {
                const deliveryTime = stats.deliveryTimes[delivery.id] || 0
                return (
                  <div key={delivery.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-gray-900">#{delivery.order_code}</div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-bold">{deliveryTime} min</span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-semibold">{delivery.customer_name}</span>
                      </div>
                      <div className="text-sm text-gray-600">{delivery.delivery_address}</div>
                    </div>
                    <div className="text-xl font-bold text-green-600 mb-3">Total: {formatCurrency(delivery.total_amount)}</div>
                    <Button onClick={() => updateStatus(delivery.id, 'delivered')} disabled={updatingOrderId === delivery.id} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                      {updatingOrderId === delivery.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Entrega'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Nota de Entrega
            </h3>
            <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Ex: Portão azul, Interfone 201, Deixar com porteiro..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" rows={4} autoFocus />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNoteModal(null)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={() => saveNote(showNoteModal)} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                Salvar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
