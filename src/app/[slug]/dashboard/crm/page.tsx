'use client'

import { useState, useEffect } from 'react'
import { Search, Users, TrendingUp, DollarSign, MessageCircle, Loader2 } from 'lucide-react'
import { formatCurrency, formatPhone } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  total_orders: number
  total_spent: number
  last_order_date: string
  segment: 'VIP' | 'Regular' | 'New' | 'Inactive'
}

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true)
      try {
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })

        const { data: ordersData } = await supabase
          .from('orders')
          .select('customer_id, total_amount, created_at')

        const customersWithStats = (customersData || []).map((customer: any) => {
          const customerOrders = (ordersData || []).filter((o: any) => o.customer_id === customer.id)
          const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0)
          const totalOrders = customerOrders.length
          const lastOrder = customerOrders[0]?.created_at || customer.created_at

          let segment: 'VIP' | 'Regular' | 'New' | 'Inactive' = 'New'
          if (totalSpent > 500) segment = 'VIP'
          else if (totalOrders > 5) segment = 'Regular'
          else if (totalOrders === 0) segment = 'Inactive'

          return {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_date: lastOrder,
            segment
          }
        })

        setCustomers(customersWithStats)
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.phone.includes(searchQuery)
    const matchesSegment = selectedSegment ? c.segment === selectedSegment : true
    return matchesSearch && matchesSegment
  })

  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.segment === 'VIP').length,
    new: customers.filter(c => c.segment === 'New').length,
    inactive: customers.filter(c => c.segment === 'Inactive').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CRM - Gestão de Clientes</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total de Clientes</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Clientes VIP</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.vip}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Novos Clientes</span>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.new}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Receita Total</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSelectedSegment(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSegment === null ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedSegment('VIP')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSegment === 'VIP' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              VIP
            </button>
            <button
              onClick={() => setSelectedSegment('Regular')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSegment === 'Regular' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Regular
            </button>
            <button
              onClick={() => setSelectedSegment('New')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSegment === 'New' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Novos
            </button>
            <button
              onClick={() => setSelectedSegment('Inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSegment === 'Inactive' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contato</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pedidos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Gasto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Segmento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatPhone(customer.phone)}</td>
                    <td className="px-6 py-4 text-gray-900">{customer.total_orders}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(customer.total_spent)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        customer.segment === 'VIP' ? 'bg-purple-100 text-purple-700' :
                        customer.segment === 'New' ? 'bg-green-100 text-green-700' :
                        customer.segment === 'Inactive' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {customer.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
