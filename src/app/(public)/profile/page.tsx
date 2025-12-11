'use client'

import { useState } from 'react'
import { User, MapPin, Phone, Mail, ShoppingBag, Clock, DollarSign } from 'lucide-react'
import { formatCurrency, formatPhone, formatDate } from '@/lib/utils'

interface Order {
  id: string
  order_code: string
  created_at: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  items_count: number
}

interface Address {
  id: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'data'>('orders')

  const customer = {
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    cpf: '123.456.789-00',
    total_orders: 15,
    total_spent: 450.00
  }

  const orders: Order[] = [
    {
      id: '1',
      order_code: 'A-001',
      created_at: '2024-12-10T10:30:00',
      total_amount: 35.00,
      status: 'delivered',
      items_count: 2
    },
    {
      id: '2',
      order_code: 'A-002',
      created_at: '2024-12-09T15:20:00',
      total_amount: 28.50,
      status: 'delivered',
      items_count: 1
    }
  ]

  const addresses: Address[] = [
    {
      id: '1',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01310-100',
      is_default: true
    }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-purple-100 text-purple-700',
      ready: 'bg-green-100 text-green-700',
      delivered: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }
    return texts[status as keyof typeof texts] || status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{customer.name}</h1>
              <div className="flex gap-6 text-green-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{customer.total_orders} pedidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(customer.total_spent)} gastos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Meus Pedidos
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'addresses'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Endereços
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'data'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Meus Dados
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">Pedido #{order.order_code}</h3>
                          <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{order.items_count} {order.items_count === 1 ? 'item' : 'itens'}</span>
                        <span className="font-bold text-green-600 text-lg">{formatCurrency(order.total_amount)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Você ainda não fez nenhum pedido</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4">
                {addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-1" />
                          <div>
                            <p className="font-medium">
                              {address.street}, {address.number}
                              {address.complement && ` - ${address.complement}`}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {address.district}, {address.city} - {address.state}
                            </p>
                            <p className="text-gray-600 text-sm">CEP: {address.zip_code}</p>
                          </div>
                        </div>
                        {address.is_default && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Padrão
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum endereço cadastrado</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span>{customer.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{customer.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{formatPhone(customer.phone)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span>{customer.cpf}</span>
                  </div>
                </div>

                <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Editar Dados
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
