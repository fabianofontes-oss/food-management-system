'use client'

import { useState } from 'react'
import { Truck, MapPin, Phone, Clock, CheckCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Delivery {
  id: string
  orderCode: string
  customer: string
  address: string
  phone: string
  total: number
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered'
  driver?: string
  createdAt: Date
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: '1',
      orderCode: 'A001',
      customer: 'João Silva',
      address: 'Rua das Flores, 123 - Centro',
      phone: '(11) 99999-9999',
      total: 45.00,
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 60000)
    },
    {
      id: '2',
      orderCode: 'A002',
      customer: 'Maria Santos',
      address: 'Av. Principal, 456 - Jardim',
      phone: '(11) 98888-8888',
      total: 32.00,
      status: 'assigned',
      driver: 'Carlos Entregador',
      createdAt: new Date(Date.now() - 15 * 60000)
    },
    {
      id: '3',
      orderCode: 'A003',
      customer: 'Pedro Costa',
      address: 'Rua do Comércio, 789 - Vila Nova',
      phone: '(11) 97777-7777',
      total: 28.00,
      status: 'in_transit',
      driver: 'Ana Delivery',
      createdAt: new Date(Date.now() - 25 * 60000)
    }
  ])

  const [drivers] = useState(['Carlos Entregador', 'Ana Delivery', 'José Motoboy'])

  const updateStatus = (id: string, status: Delivery['status'], driver?: string) => {
    setDeliveries(deliveries.map(delivery => 
      delivery.id === id ? { ...delivery, status, driver } : delivery
    ))
  }

  const assignDriver = (id: string, driver: string) => {
    updateStatus(id, 'assigned', driver)
  }

  const getElapsedTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    return `${minutes} min`
  }

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending')
  const assignedDeliveries = deliveries.filter(d => d.status === 'assigned')
  const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Delivery</h1>
          <p className="text-purple-100 mt-1">Gestão de Entregas</p>
        </div>
      </header>

      <div className="container mx-auto p-4">
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
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-600">{getElapsedTime(delivery.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    {formatCurrency(delivery.total)}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold mb-2">Atribuir Entregador:</div>
                    {drivers.map(driver => (
                      <button
                        key={driver}
                        onClick={() => assignDriver(delivery.id, driver)}
                        className="w-full p-3 text-left rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5" />
                          <span className="font-semibold">{driver}</span>
                        </div>
                      </button>
                    ))}
                  </div>
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
                      <span className="text-sm font-semibold text-blue-600">{delivery.driver}</span>
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
                    onClick={() => updateStatus(delivery.id, 'in_transit', delivery.driver)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    Saiu para Entrega
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
                      <span className="text-sm font-semibold text-green-600">{delivery.driver}</span>
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
                    onClick={() => updateStatus(delivery.id, 'delivered', delivery.driver)}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirmar Entrega
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
