'use client'

import { useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useOrders } from '@/hooks/useOrders'

export default function KitchenPage() {
  const { orders, loading, updateOrderStatus } = useOrders()
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Cozinha / KDS</h1>
          <p className="text-orange-100 mt-1">Kitchen Display System</p>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pendentes */}
          <div>
            <div className="bg-red-100 text-red-800 p-4 rounded-t-2xl font-bold text-lg flex items-center justify-between">
              <span>Pendentes ({pendingOrders.length})</span>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-4 mt-4">
              {pendingOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl font-bold text-gray-900">{order.order_code}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(order.order_type)}`}>
                      {getChannelLabel(order.order_type)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-red-600 mb-4">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{getElapsedTime(order.created_at)}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.customer_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total: {formatCurrency(order.total_amount)}
                      </div>
                      {order.notes && (
                        <div className="text-sm text-orange-600 mt-1 italic">
                          Obs: {order.notes}
                        </div>
                      )}
                    </div>
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
              ))}
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
                  
                  <div className="flex items-center gap-2 text-yellow-600 mb-4">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{getElapsedTime(order.created_at)}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.customer_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total: {formatCurrency(order.total_amount)}
                      </div>
                      {order.notes && (
                        <div className="text-sm text-orange-600 mt-1 italic">
                          Obs: {order.notes}
                        </div>
                      )}
                    </div>
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
                        Total: {formatCurrency(order.total_amount)}
                      </div>
                    </div>
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
    </div>
  )
}
