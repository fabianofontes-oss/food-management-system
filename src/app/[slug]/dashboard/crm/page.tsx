'use client'

import { useState, useEffect } from 'react'
import { Search, Users, TrendingUp, DollarSign, MessageCircle, Loader2 } from 'lucide-react'
import { formatCurrency, formatPhone } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

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
  const params = useParams()
  const slug = params.slug as string
  const [storeId, setStoreId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStoreId() {
      if (!slug) return
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      setStoreId(data?.id ?? null)
    }
    loadStoreId()
  }, [slug])

  useEffect(() => {
    async function fetchCustomers() {
      if (!storeId) {
        setCustomers([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })

        const { data: ordersData } = await supabase
          .from('orders')
          .select('customer_id, total_amount, created_at')
          .eq('store_id', storeId)

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
  }, [storeId])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/25">
              <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            CRM - Gestão de Clientes
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Relacionamento e segmentação de clientes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Total de Clientes</span>
              <div className="p-2 bg-blue-100 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Clientes VIP</span>
              <div className="p-2 bg-purple-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.vip}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Novos Clientes</span>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{stats.new}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Receita Total</span>
              <div className="p-2 bg-green-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSegment(null)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                selectedSegment === null 
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedSegment('VIP')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                selectedSegment === 'VIP' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
              }`}
            >
              VIP
            </button>
            <button
              onClick={() => setSelectedSegment('Regular')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                selectedSegment === 'Regular' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
              }`}
            >
              Regular
            </button>
            <button
              onClick={() => setSelectedSegment('New')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                selectedSegment === 'New' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
              }`}
            >
              Novos
            </button>
            <button
              onClick={() => setSelectedSegment('Inactive')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                selectedSegment === 'Inactive' 
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Contato</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Pedidos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Total Gasto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Segmento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatPhone(customer.phone)}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{customer.total_orders}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatCurrency(customer.total_spent)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        customer.segment === 'VIP' ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700' :
                        customer.segment === 'New' ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700' :
                        customer.segment === 'Inactive' ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700' :
                        'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700'
                      }`}>
                        {customer.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md shadow-green-500/20 hover:shadow-lg"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium">Nenhum cliente encontrado</p>
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
