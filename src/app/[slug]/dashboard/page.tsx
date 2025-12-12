'use client'

import { BarChart3, TrendingUp, ShoppingBag, Users, DollarSign, Package, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useOrders } from '@/hooks/useOrders'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const { products, loading: loadingProducts } = useProducts()
  const { orders, loading: loadingOrders } = useOrders()
  const [customersCount, setCustomersCount] = useState(0)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  
  useEffect(() => {
    checkOnboardingStatus()
  }, [slug])
  
  async function checkOnboardingStatus() {
    try {
      const supabaseClient = createClient()
      
      // Get current user session
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) {
        setCheckingOnboarding(false)
        return
      }

      // Get store
      const { data: store } = await supabaseClient
        .from('stores')
        .select('id, settings')
        .eq('slug', slug)
        .single()

      if (!store) {
        setCheckingOnboarding(false)
        return
      }

      // Get user role
      const { data: storeUser } = await supabaseClient
        .from('store_users')
        .select('role')
        .eq('store_id', store.id)
        .eq('user_id', session.user.id)
        .single()

      // Only check onboarding for owner/manager
      if (storeUser && (storeUser.role === 'owner' || storeUser.role === 'manager')) {
        const settings = store.settings as any
        const onboardingCompleted = settings?.onboarding?.completed === true

        if (!onboardingCompleted) {
          router.push(`/${slug}/dashboard/onboarding`)
          return
        }
      }

      setCheckingOnboarding(false)
    } catch (err) {
      console.error('Error checking onboarding:', err)
      setCheckingOnboarding(false)
    }
  }
  
  useEffect(() => {
    async function fetchCustomers() {
      const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true })
      setCustomersCount(count || 0)
    }
    fetchCustomers()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const ordersToday = orders.filter(o => o.created_at.startsWith(today))
  const vendasHoje = ordersToday.reduce((sum, o) => sum + o.total_amount, 0)
  const pedidosHoje = ordersToday.length
  
  const stats = [
    { label: 'Vendas Hoje', value: formatCurrency(vendasHoje), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Pedidos Hoje', value: pedidosHoje.toString(), icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Clientes', value: customersCount.toString(), icon: Users, color: 'bg-purple-500' },
    { label: 'Produtos', value: products.length.toString(), icon: Package, color: 'bg-orange-500' },
  ]

  const recentOrders = orders.slice(0, 5)
  
  const topProducts = products.slice(0, 5).map(p => ({
    name: p.name,
    sales: 0,
    revenue: formatCurrency(p.base_price)
  }))

  if (loadingProducts || loadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'delivered': 'bg-green-100 text-green-700',
      'preparing': 'bg-yellow-100 text-yellow-700',
      'pending': 'bg-red-100 text-red-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'ready': 'bg-purple-100 text-purple-700',
      'out_for_delivery': 'bg-blue-100 text-blue-700',
      'cancelled': 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }
  
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'delivered': 'Entregue',
      'preparing': 'Em preparo',
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'ready': 'Pronto',
      'out_for_delivery': 'Saiu para entrega',
      'cancelled': 'Cancelado',
    }
    return labels[status] || status
  }
  
  const getElapsedTime = (dateString: string) => {
    const date = new Date(dateString)
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    return `${minutes} min`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">Painel Administrativo</p>
        </div>
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Pedidos Recentes</h2>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">#{order.order_code}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{order.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-1">há {getElapsedTime(order.created_at)}</div>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(order.total_amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Produtos Mais Vendidos</h2>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">Preço: {product.revenue}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${((idx + 1) / topProducts.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all text-left">
              <Package className="w-8 h-8 text-blue-600 mb-3" />
              <div className="font-bold text-gray-900">Adicionar Produto</div>
              <div className="text-sm text-gray-600 mt-1">Cadastrar novo item</div>
            </button>
            <button className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all text-left">
              <Users className="w-8 h-8 text-green-600 mb-3" />
              <div className="font-bold text-gray-900">Gerenciar Usuários</div>
              <div className="text-sm text-gray-600 mt-1">Equipe e permissões</div>
            </button>
            <button className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all text-left">
              <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
              <div className="font-bold text-gray-900">Relatórios</div>
              <div className="text-sm text-gray-600 mt-1">Análises e métricas</div>
            </button>
            <button className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all text-left">
              <DollarSign className="w-8 h-8 text-orange-600 mb-3" />
              <div className="font-bold text-gray-900">Financeiro</div>
              <div className="text-sm text-gray-600 mt-1">Vendas e pagamentos</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
