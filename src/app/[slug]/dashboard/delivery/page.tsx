'use client'

import { useState } from 'react'
import { Truck, MapPin, Phone, Clock, CheckCircle, Package, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useOrders } from '@/hooks/useOrders'
import { useSettings } from '@/hooks/useSettings'
import { useStores } from '@/hooks/useStores'

export default function DeliveryPage() {
  const { orders, loading, updateOrderStatus } = useOrders()
  const { stores } = useStores()
  const currentStore = stores[0]
  const { settings } = useSettings(currentStore?.id)
  
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [drivers] = useState(['Carlos Entregador', 'Ana Delivery', 'José Motoboy'])

  const deliveryOrders = orders.filter(o => o.order_type === 'delivery')

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingOrderId(id)
    try {
      await updateOrderStatus(id, newStatus)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('❌ Erro ao atualizar status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const getElapsedTime = (dateString: string) => {
    const date = new Date(dateString)
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    return `${minutes} min`
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Delivery</h1>
          <p className="text-gray-600 mt-1">Gestão de Entregas</p>
          
          {/* Info de Configurações */}
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-blue-900 mb-1">Configurações de Entrega</div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• Taxa de entrega: <span className="font-bold">{formatCurrency(settings?.delivery_fee || 0)}</span></div>
                <div>• Raio de entrega: <span className="font-bold">{settings?.delivery_radius || 0} km</span></div>
                <div>• Tempo estimado: <span className="font-bold">{settings?.estimated_prep_time || 0} min</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Aguardando Entregador */}
          <div>
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Aguardando ({pendingDeliveries.length})</span>
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {pendingDeliveries.map(delivery => (
                <div key={delivery.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-yellow-500">
                  <div className="text-2xl font-bold text-gray-900 mb-2">#{delivery.order_code}</div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{delivery.customer_name}</div>
                        <div className="text-sm text-gray-600">{delivery.delivery_address || 'Endereço não informado'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">{delivery.customer_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-600">{getElapsedTime(delivery.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    {formatCurrency(delivery.total_amount)}
                  </div>

                  <Button
                    onClick={() => updateStatus(delivery.id, 'preparing')}
                    disabled={updatingOrderId === delivery.id}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    {updatingOrderId === delivery.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                    ) : (
                      'Confirmar Pedido'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Atribuídos */}
          <div>
            <div className="bg-blue-100 text-blue-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Atribuídos ({assignedDeliveries.length})</span>
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {assignedDeliveries.map(delivery => (
                <div key={delivery.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-blue-500">
                  <div className="text-2xl font-bold text-gray-900 mb-2">#{delivery.orderCode}</div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{delivery.customer}</div>
                        <div className="text-sm text-gray-600">{delivery.address}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">{delivery.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-600">Em preparo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">{getElapsedTime(delivery.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    {formatCurrency(delivery.total)}
                  </div>

                  <Button
                    onClick={() => updateStatus(delivery.id, 'out_for_delivery')}
                    disabled={updatingOrderId === delivery.id}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {updatingOrderId === delivery.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Atualizando...</>
                    ) : (
                      'Saiu para Entrega'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Em Trânsito */}
          <div>
            <div className="bg-green-100 text-green-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Em Trânsito ({inTransitDeliveries.length})</span>
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {inTransitDeliveries.map(delivery => (
                <div key={delivery.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-green-500">
                  <div className="text-2xl font-bold text-gray-900 mb-2">#{delivery.orderCode}</div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{delivery.customer}</div>
                        <div className="text-sm text-gray-600">{delivery.address}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">{delivery.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">Em trânsito</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">{getElapsedTime(delivery.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    {formatCurrency(delivery.total)}
                  </div>

                  <Button
                    onClick={() => updateStatus(delivery.id, 'delivered')}
                    disabled={updatingOrderId === delivery.id}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {updatingOrderId === delivery.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Finalizando...</>
                    ) : (
                      <><CheckCircle className="w-5 h-5 mr-2" />Confirmar Entrega</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
