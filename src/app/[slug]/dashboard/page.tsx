'use client'

import { BarChart3, TrendingUp, ShoppingBag, Users, DollarSign, Package, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useOrders } from '@/hooks/useOrders'
import { useStoreId } from '@/hooks/useStore'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const storeId = useStoreId()
  
  const { products, loading: loadingProducts } = useProducts(storeId ?? undefined)
  const { orders, loading: loadingOrders } = useOrders(storeId ?? undefined)
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
      if (!storeId) {
        setCustomersCount(0)
        return
      }

      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
      setCustomersCount(count || 0)
    }
    fetchCustomers()
  }, [storeId])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
              <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Visão geral do seu negócio</p>
        </div>
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-semibold">+0%</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Pedidos Recentes</h2>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">Nenhum pedido ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-lg text-slate-800">#{order.order_code}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">{order.customer_name}</div>
                      <div className="text-xs text-slate-400 mt-1">há {getElapsedTime(order.created_at)}</div>
                    </div>
                    <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-100 rounded-xl">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Produtos Mais Vendidos</h2>
            </div>
            {topProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">Nenhum produto ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">{product.name}</div>
                          <div className="text-sm text-slate-500">Preço: {product.revenue}</div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full"
                        style={{ width: `${100 - (idx * 15)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Ações Rápidas</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all text-left">
              <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4 group-hover:bg-blue-200 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-bold text-slate-800">Adicionar Produto</div>
              <div className="text-sm text-slate-500 mt-1">Cadastrar novo item</div>
            </button>
            <button className="group p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all text-left">
              <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-4 group-hover:bg-emerald-200 transition-colors">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="font-bold text-slate-800">Gerenciar Usuários</div>
              <div className="text-sm text-slate-500 mt-1">Equipe e permissões</div>
            </button>
            <button className="group p-6 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-2xl border border-violet-200/50 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all text-left">
              <div className="p-3 bg-violet-100 rounded-xl w-fit mb-4 group-hover:bg-violet-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-violet-600" />
              </div>
              <div className="font-bold text-slate-800">Relatórios</div>
              <div className="text-sm text-slate-500 mt-1">Análises e métricas</div>
            </button>
            <button className="group p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all text-left">
              <div className="p-3 bg-amber-100 rounded-xl w-fit mb-4 group-hover:bg-amber-200 transition-colors">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div className="font-bold text-slate-800">Financeiro</div>
              <div className="text-sm text-slate-500 mt-1">Vendas e pagamentos</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
