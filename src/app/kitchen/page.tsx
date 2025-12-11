'use client'

import { useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Order {
  id: string
  code: string
  items: { name: string; quantity: number; notes?: string }[]
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
  createdAt: Date
  channel: 'delivery' | 'pickup' | 'dine_in'
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      code: 'A001',
      items: [
        { name: 'Açaí 500ml', quantity: 2, notes: 'Sem granola' },
        { name: 'Suco Natural 300ml', quantity: 1 }
      ],
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 60000),
      channel: 'delivery'
    },
    {
      id: '2',
      code: 'A002',
      items: [
        { name: 'Açaí 300ml', quantity: 1 },
        { name: 'Açaí 700ml', quantity: 1, notes: 'Extra banana' }
      ],
      status: 'preparing',
      createdAt: new Date(Date.now() - 10 * 60000),
      channel: 'pickup'
    },
    {
      id: '3',
      code: 'A003',
      items: [
        { name: 'Suco Natural 500ml', quantity: 3 }
      ],
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60000),
      channel: 'dine_in'
    }
  ])

  const updateStatus = (id: string, status: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status } : order
    ))
  }

  const getElapsedTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    return `${minutes} min`
  }

  const getChannelLabel = (channel: Order['channel']) => {
    const labels = {
      delivery: 'Delivery',
      pickup: 'Retirada',
      dine_in: 'Mesa'
    }
    return labels[channel]
  }

  const getChannelColor = (channel: Order['channel']) => {
    const colors = {
      delivery: 'bg-purple-100 text-purple-700',
      pickup: 'bg-blue-100 text-blue-700',
      dine_in: 'bg-green-100 text-green-700'
    }
    return colors[channel]
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')

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
                    <div className="text-3xl font-bold text-gray-900">{order.code}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(order.channel)}`}>
                      {getChannelLabel(order.channel)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-red-600 mb-4">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{getElapsedTime(order.createdAt)}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{item.quantity}x</span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        {item.notes && (
                          <div className="text-sm text-orange-600 mt-1 italic">
                            Obs: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => updateStatus(order.id, 'preparing')}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                  >
                    Iniciar Preparo
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
                    <div className="text-3xl font-bold text-gray-900">{order.code}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(order.channel)}`}>
                      {getChannelLabel(order.channel)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-yellow-600 mb-4">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{getElapsedTime(order.createdAt)}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{item.quantity}x</span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        {item.notes && (
                          <div className="text-sm text-orange-600 mt-1 italic">
                            Obs: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => updateStatus(order.id, 'ready')}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    Marcar como Pronto
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
                    <div className="text-3xl font-bold text-gray-900">{order.code}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(order.channel)}`}>
                      {getChannelLabel(order.channel)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Pronto</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{item.quantity}x</span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                  >
                    Finalizar Pedido
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
