'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  BarChart3, TrendingUp, TrendingDown, Users, ShoppingBag,
  DollarSign, Clock, Loader2, AlertCircle, Calendar,
  ArrowUp, ArrowDown, Minus, PieChart, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  averageTicket: number
  totalCustomers: number
  ordersByDay: { date: string; count: number; revenue: number }[]
  ordersByHour: { hour: number; count: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  paymentMethods: { method: string; count: number; total: number }[]
  ordersByChannel: { channel: string; count: number }[]
  comparison: {
    orders: { current: number; previous: number; change: number }
    revenue: { current: number; previous: number; change: number }
    ticket: { current: number; previous: number; change: number }
  }
}

type Period = '7d' | '30d' | '90d'

export default function AnalyticsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<Period>('30d')
  
  const [data, setData] = useState<AnalyticsData>({
    totalOrders: 0,
    totalRevenue: 0,
    averageTicket: 0,
    totalCustomers: 0,
    ordersByDay: [],
    ordersByHour: [],
    topProducts: [],
    paymentMethods: [],
    ordersByChannel: [],
    comparison: {
      orders: { current: 0, previous: 0, change: 0 },
      revenue: { current: 0, previous: 0, change: 0 },
      ticket: { current: 0, previous: 0, change: 0 }
    }
  })

  useEffect(() => {
    async function loadStore() {
      try {
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()

        if (storeError || !store) {
          setError('Loja não encontrada')
          setLoading(false)
          return
        }
        setStoreId(store.id)
      } catch (err) {
        console.error('Erro ao carregar loja:', err)
        setError('Erro ao carregar loja')
        setLoading(false)
      }
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) loadAnalytics()
  }, [storeId, period])

  async function loadAnalytics() {
    try {
      setLoading(true)
      
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const now = new Date()
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

      // Buscar pedidos do período atual
      const { data: currentOrders } = await supabase
        .from('orders')
        .select('id, total_amount, payment_method, channel, created_at')
        .eq('store_id', storeId)
        .gte('created_at', startDate.toISOString())

      // Buscar pedidos do período anterior para comparação
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('store_id', storeId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      // Buscar clientes
      const { count: customerCount } = await supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)

      // Buscar itens dos pedidos para top produtos
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, unit_price')
        .in('order_id', (currentOrders || []).map(o => o.id))

      if (currentOrders) {
        const totalOrders = currentOrders.length
        const totalRevenue = currentOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Pedidos por dia
        const ordersByDayMap = new Map<string, { count: number; revenue: number }>()
        currentOrders.forEach(order => {
          const date = new Date(order.created_at).toISOString().split('T')[0]
          const existing = ordersByDayMap.get(date) || { count: 0, revenue: 0 }
          ordersByDayMap.set(date, {
            count: existing.count + 1,
            revenue: existing.revenue + (order.total_amount || 0)
          })
        })
        const ordersByDay = Array.from(ordersByDayMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date))

        // Pedidos por hora
        const ordersByHourMap = new Map<number, number>()
        currentOrders.forEach(order => {
          const hour = new Date(order.created_at).getHours()
          ordersByHourMap.set(hour, (ordersByHourMap.get(hour) || 0) + 1)
        })
        const ordersByHour = Array.from(ordersByHourMap.entries())
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => a.hour - b.hour)

        // Métodos de pagamento
        const paymentMap = new Map<string, { count: number; total: number }>()
        currentOrders.forEach(order => {
          const method = order.payment_method || 'Não informado'
          const existing = paymentMap.get(method) || { count: 0, total: 0 }
          paymentMap.set(method, {
            count: existing.count + 1,
            total: existing.total + (order.total_amount || 0)
          })
        })
        const paymentMethods = Array.from(paymentMap.entries())
          .map(([method, data]) => ({ method, ...data }))

        // Canais de venda
        const channelMap = new Map<string, number>()
        currentOrders.forEach(order => {
          const channel = order.channel || 'Não informado'
          channelMap.set(channel, (channelMap.get(channel) || 0) + 1)
        })
        const ordersByChannel = Array.from(channelMap.entries())
          .map(([channel, count]) => ({ channel, count }))

        // Top produtos
        const productMap = new Map<string, { quantity: number; revenue: number }>()
        orderItems?.forEach(item => {
          const name = item.product_name
          const existing = productMap.get(name) || { quantity: 0, revenue: 0 }
          productMap.set(name, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.unit_price * item.quantity)
          })
        })
        const topProducts = Array.from(productMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10)

        // Comparação com período anterior
        const prevTotal = previousOrders?.length || 0
        const prevRevenue = previousOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
        const prevTicket = prevTotal > 0 ? prevRevenue / prevTotal : 0

        const calcChange = (current: number, previous: number) => 
          previous > 0 ? ((current - previous) / previous) * 100 : 0

        setData({
          totalOrders,
          totalRevenue,
          averageTicket,
          totalCustomers: customerCount || 0,
          ordersByDay,
          ordersByHour,
          topProducts,
          paymentMethods,
          ordersByChannel,
          comparison: {
            orders: { current: totalOrders, previous: prevTotal, change: calcChange(totalOrders, prevTotal) },
            revenue: { current: totalRevenue, previous: prevRevenue, change: calcChange(totalRevenue, prevRevenue) },
            ticket: { current: averageTicket, previous: prevTicket, change: calcChange(averageTicket, prevTicket) }
          }
        })
      }
    } catch (err) {
      console.error('Erro ao carregar analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-red-100 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <p className="text-slate-600 font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/25">
              <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Analytics
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Métricas e tendências do seu negócio</p>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Pedidos</p>
            <div className="p-2 bg-violet-100 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{data.totalOrders}</p>
          <div className={`flex items-center gap-1.5 mt-3 text-sm ${getChangeColor(data.comparison.orders.change)}`}>
            {getChangeIcon(data.comparison.orders.change)}
            <span className="font-medium">{Math.abs(data.comparison.orders.change).toFixed(1)}% vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Faturamento</p>
            <div className="p-2 bg-emerald-100 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(data.totalRevenue)}</p>
          <div className={`flex items-center gap-1.5 mt-3 text-sm ${getChangeColor(data.comparison.revenue.change)}`}>
            {getChangeIcon(data.comparison.revenue.change)}
            <span className="font-medium">{Math.abs(data.comparison.revenue.change).toFixed(1)}% vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Ticket Médio</p>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(data.averageTicket)}</p>
          <div className={`flex items-center gap-1.5 mt-3 text-sm ${getChangeColor(data.comparison.ticket.change)}`}>
            {getChangeIcon(data.comparison.ticket.change)}
            <span className="font-medium">{Math.abs(data.comparison.ticket.change).toFixed(1)}% vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">Clientes</p>
            <div className="p-2 bg-amber-100 rounded-xl">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{data.totalCustomers}</p>
          <p className="text-sm text-slate-400 mt-3 font-medium">Total cadastrados</p>
        </div>
      </div>

      {/* Gráficos e Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por dia */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            Vendas por Dia
          </h3>
          {data.ordersByDay.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">Sem dados no período</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.ordersByDay.slice(-7).map(day => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-24">
                    {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full flex items-center justify-end pr-2"
                      style={{ 
                        width: `${Math.max(10, (day.revenue / Math.max(...data.ordersByDay.map(d => d.revenue))) * 100)}%` 
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        {formatCurrency(day.revenue)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{day.count} ped.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Horários de pico */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            Horários de Pico
          </h3>
          {data.ordersByHour.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">Sem dados no período</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 24 }, (_, i) => {
                const hourData = data.ordersByHour.find(h => h.hour === i)
                const count = hourData?.count || 0
                const maxCount = Math.max(...data.ordersByHour.map(h => h.count))
                const intensity = maxCount > 0 ? count / maxCount : 0
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: `rgba(139, 92, 246, ${intensity * 0.8 + 0.1})`,
                      color: intensity > 0.5 ? 'white' : '#374151'
                    }}
                    title={`${i}h: ${count} pedidos`}
                  >
                    {i}h
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Produtos */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            Top Produtos
          </h3>
          {data.topProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">Sem dados no período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topProducts.slice(0, 5).map((product, i) => (
                <div key={product.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} vendidos</p>
                  </div>
                  <p className="font-medium text-green-600">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formas de Pagamento */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-xl">
              <PieChart className="w-5 h-5 text-cyan-600" />
            </div>
            Formas de Pagamento
          </h3>
          {data.paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <PieChart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">Sem dados no período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.paymentMethods.map(payment => {
                const percentage = data.totalRevenue > 0 
                  ? (payment.total / data.totalRevenue) * 100 
                  : 0
                return (
                  <div key={payment.method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{payment.method}</span>
                      <span className="text-gray-500">{payment.count} pedidos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-20 text-right">
                        {formatCurrency(payment.total)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
