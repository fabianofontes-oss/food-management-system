'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Calendar, DollarSign, ShoppingBag, TrendingUp, CreditCard, Loader2, 
  AlertCircle, Award, Clock, Download, FileText, PieChart, BarChart3,
  Users, Percent, ArrowUpRight, ArrowDownRight, Minus, Filter,
  Mail, Printer, FileSpreadsheet, TrendingDown, Layers, UserCheck,
  XCircle, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts'

interface ReportMetrics {
  total_orders: number
  total_revenue: number
  average_ticket: number
  paid_count: number
  pending_count: number
}

interface PaymentBreakdown {
  method: string
  count: number
  total: number
}

interface TopProduct {
  product_name: string
  total_quantity: number
  total_revenue: number
  order_count: number
}

interface PeakHour {
  hour: number
  total_orders: number
  total_revenue: number
  average_ticket: number
}

interface DailyData {
  date: string
  orders: number
  revenue: number
  ticket: number
}

interface CategoryData {
  category: string
  revenue: number
  quantity: number
  percentage: number
}

interface ComparisonData {
  current: { orders: number; revenue: number; ticket: number }
  previous: { orders: number; revenue: number; ticket: number }
  change: { orders: number; revenue: number; ticket: number }
}

interface CancellationData {
  total: number
  rate: number
  reasons: { reason: string; count: number }[]
}

interface TopCustomer {
  phone: string
  name: string
  orders: number
  total_spent: number
  last_order: string
}

type DatePreset = 'today' | '7days' | '30days' | '90days' | 'thisMonth' | 'lastMonth' | 'custom'
type ReportTab = 'overview' | 'products' | 'payments' | 'customers' | 'dre' | 'comparison'

const CHART_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']

export default function ReportsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [metrics, setMetrics] = useState<ReportMetrics>({
    total_orders: 0,
    total_revenue: 0,
    average_ticket: 0,
    paid_count: 0,
    pending_count: 0
  })
  
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [topN, setTopN] = useState<number>(10)
  
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [cancellations, setCancellations] = useState<CancellationData>({ total: 0, rate: 0, reasons: [] })
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Carregar store_id
  useEffect(() => {
    async function loadStore() {
      try {
        const { data, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()
        
        if (storeError || !data) {
          setError('Loja não encontrada')
          setLoading(false)
          return
        }
        setStoreId(data.id)
      } catch (err) {
        console.error('Erro ao carregar loja:', err)
        setError('Erro ao carregar loja')
        setLoading(false)
      }
    }
    loadStore()
  }, [slug, supabase])

  // Calcular datas baseado no preset
  const getDateRange = (): { start: string; end: string } => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (datePreset) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }
      case '7days':
        return {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      case '30days':
        return {
          start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      case '90days':
        return {
          start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          end: new Date().toISOString()
        }
      case 'lastMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
        }
      case 'custom':
      default:
        return {
          start: startDate ? new Date(startDate).toISOString() : today.toISOString(),
          end: endDate ? new Date(endDate + 'T23:59:59').toISOString() : new Date().toISOString()
        }
    }
  }

  // Carregar dados
  useEffect(() => {
    if (!storeId) return

    async function loadReports() {
      setLoading(true)
      setError('')

      try {
        const { start, end } = getDateRange()

        // Buscar pedidos do período (excluir cancelados)
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, total_amount, payment_method, payment_status, status, created_at')
          .eq('store_id', storeId)
          .neq('status', 'cancelled')
          .gte('created_at', start)
          .lte('created_at', end)

        if (ordersError) throw ordersError

        if (!orders || orders.length === 0) {
          // Sem pedidos no período
          setMetrics({
            total_orders: 0,
            total_revenue: 0,
            average_ticket: 0,
            paid_count: 0,
            pending_count: 0
          })
          setPaymentBreakdown([])
          setLoading(false)
          return
        }

        // Calcular métricas
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
        
        const paidCount = orders.filter((o: any) => o.payment_status === 'paid').length
        const pendingCount = orders.filter((o: any) => o.payment_status === 'pending' || !o.payment_status).length

        setMetrics({
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          average_ticket: averageTicket,
          paid_count: paidCount,
          pending_count: pendingCount
        })

        // Calcular breakdown por método de pagamento
        const breakdown: Record<string, { count: number; total: number }> = {}
        
        orders.forEach((order: any) => {
          const method = order.payment_method || 'cash'
          if (!breakdown[method]) {
            breakdown[method] = { count: 0, total: 0 }
          }
          breakdown[method].count++
          breakdown[method].total += order.total_amount || 0
        })

        const breakdownArray = Object.entries(breakdown).map(([method, data]) => ({
          method,
          count: data.count,
          total: data.total
        }))

        setPaymentBreakdown(breakdownArray)

        // Buscar order_items para análise de produtos e horários
        const orderIds = orders.map((o: any) => o.id)
        
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity, unit_price, order_id, products(name)')
          .in('order_id', orderIds)

        if (itemsError) throw itemsError

        // Calcular Top Products
        if (orderItems && orderItems.length > 0) {
          const productStats: Record<string, { quantity: number; revenue: number; orders: Set<string> }> = {}
          
          orderItems.forEach((item: any) => {
            const productName = (item.products as any)?.name || 'Produto Desconhecido'
            if (!productStats[productName]) {
              productStats[productName] = { quantity: 0, revenue: 0, orders: new Set() }
            }
            productStats[productName].quantity += item.quantity
            productStats[productName].revenue += item.quantity * item.unit_price
            productStats[productName].orders.add(item.order_id)
          })

          const topProductsArray = Object.entries(productStats)
            .map(([name, stats]) => ({
              product_name: name,
              total_quantity: stats.quantity,
              total_revenue: stats.revenue,
              order_count: stats.orders.size
            }))
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, topN)

          setTopProducts(topProductsArray)
        } else {
          setTopProducts([])
        }

        // Calcular Peak Hours
        const hourStats: Record<number, { orders: number; revenue: number }> = {}
        
        orders.forEach((order: any) => {
          const hour = new Date(order.created_at).getHours()
          if (!hourStats[hour]) {
            hourStats[hour] = { orders: 0, revenue: 0 }
          }
          hourStats[hour].orders++
          hourStats[hour].revenue += order.total_amount || 0
        })

        const peakHoursArray = Object.entries(hourStats)
          .map(([hour, stats]) => ({
            hour: parseInt(hour),
            total_orders: stats.orders,
            total_revenue: stats.revenue,
            average_ticket: stats.orders > 0 ? stats.revenue / stats.orders : 0
          }))
          .sort((a, b) => b.total_orders - a.total_orders)

        setPeakHours(peakHoursArray)

        // Calcular dados diários para gráfico
        const dailyStats: Record<string, { orders: number; revenue: number }> = {}
        orders.forEach((order: any) => {
          const date = new Date(order.created_at).toISOString().split('T')[0]
          if (!dailyStats[date]) {
            dailyStats[date] = { orders: 0, revenue: 0 }
          }
          dailyStats[date].orders++
          dailyStats[date].revenue += order.total_amount || 0
        })
        
        const dailyArray = Object.entries(dailyStats)
          .map(([date, stats]) => ({
            date,
            orders: stats.orders,
            revenue: stats.revenue,
            ticket: stats.orders > 0 ? stats.revenue / stats.orders : 0
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
        
        setDailyData(dailyArray)

        // Buscar pedidos do período anterior para comparação
        const days = datePreset === '7days' ? 7 : datePreset === '30days' ? 30 : datePreset === '90days' ? 90 : 1
        const previousStart = new Date(new Date(start).getTime() - days * 24 * 60 * 60 * 1000).toISOString()
        
        const { data: previousOrders } = await supabase
          .from('orders')
          .select('id, total_amount')
          .eq('store_id', storeId)
          .neq('status', 'cancelled')
          .gte('created_at', previousStart)
          .lt('created_at', start)

        if (previousOrders) {
          const prevTotal = previousOrders.length
          const prevRevenue = previousOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
          const prevTicket = prevTotal > 0 ? prevRevenue / prevTotal : 0

          const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0

          setComparison({
            current: { orders: totalOrders, revenue: totalRevenue, ticket: averageTicket },
            previous: { orders: prevTotal, revenue: prevRevenue, ticket: prevTicket },
            change: {
              orders: calcChange(totalOrders, prevTotal),
              revenue: calcChange(totalRevenue, prevRevenue),
              ticket: calcChange(averageTicket, prevTicket)
            }
          })
        }

        // Buscar top clientes
        const customerStats: Record<string, { orders: number; total: number; last: string }> = {}
        orders.forEach((order: any) => {
          const phone = order.customer_phone || 'Não informado'
          if (!customerStats[phone]) {
            customerStats[phone] = { orders: 0, total: 0, last: order.created_at }
          }
          customerStats[phone].orders++
          customerStats[phone].total += order.total_amount || 0
          if (order.created_at > customerStats[phone].last) {
            customerStats[phone].last = order.created_at
          }
        })

        const topCustomersArray = Object.entries(customerStats)
          .filter(([phone]) => phone !== 'Não informado')
          .map(([phone, stats]) => ({
            phone,
            name: phone,
            orders: stats.orders,
            total_spent: stats.total,
            last_order: stats.last
          }))
          .sort((a, b) => b.total_spent - a.total_spent)
          .slice(0, 10)

        setTopCustomers(topCustomersArray)

        // Calcular cancelamentos
        const { data: cancelledOrders } = await supabase
          .from('orders')
          .select('id, cancellation_reason')
          .eq('store_id', storeId)
          .eq('status', 'cancelled')
          .gte('created_at', start)
          .lte('created_at', end)

        if (cancelledOrders) {
          const reasons: Record<string, number> = {}
          cancelledOrders.forEach((o: any) => {
            const reason = o.cancellation_reason || 'Não informado'
            reasons[reason] = (reasons[reason] || 0) + 1
          })

          setCancellations({
            total: cancelledOrders.length,
            rate: (orders.length + cancelledOrders.length) > 0 
              ? (cancelledOrders.length / (orders.length + cancelledOrders.length)) * 100 
              : 0,
            reasons: Object.entries(reasons).map(([reason, count]) => ({ reason, count }))
          })
        }
      } catch (err) {
        console.error('Erro ao carregar relatórios:', err)
        setError('Erro ao carregar relatórios')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [storeId, datePreset, startDate, endDate, topN, channelFilter])

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      cash: 'Dinheiro',
      card: 'Cartão',
      card_on_delivery: 'Cartão na Entrega'
    }
    return labels[method] || method
  }

  const exportToCSV = () => {
    const { start, end } = getDateRange()
    const startFormatted = new Date(start).toLocaleDateString('pt-BR')
    const endFormatted = new Date(end).toLocaleDateString('pt-BR')

    // CSV Header
    let csv = 'RELATÓRIO DE VENDAS\n'
    csv += `Período: ${startFormatted} - ${endFormatted}\n\n`

    // Métricas Principais
    csv += 'MÉTRICAS PRINCIPAIS\n'
    csv += 'Métrica,Valor\n'
    csv += `Total de Pedidos,${metrics.total_orders}\n`
    csv += `Receita Total,R$ ${metrics.total_revenue.toFixed(2)}\n`
    csv += `Ticket Médio,R$ ${metrics.average_ticket.toFixed(2)}\n`
    csv += `Pedidos Pagos,${metrics.paid_count}\n`
    csv += `Pedidos Pendentes,${metrics.pending_count}\n\n`

    // Breakdown por Método de Pagamento
    csv += 'VENDAS POR MÉTODO DE PAGAMENTO\n'
    csv += 'Método,Quantidade,Total,% do Total\n'
    paymentBreakdown.forEach(item => {
      const percentage = ((item.total / metrics.total_revenue) * 100).toFixed(1)
      csv += `${getPaymentMethodLabel(item.method)},${item.count},R$ ${item.total.toFixed(2)},${percentage}%\n`
    })
    csv += '\n'

    // Top Products
    csv += 'PRODUTOS MAIS VENDIDOS\n'
    csv += 'Produto,Quantidade,Receita,Nº Pedidos\n'
    topProducts.forEach(product => {
      csv += `${product.product_name},${product.total_quantity},R$ ${product.total_revenue.toFixed(2)},${product.order_count}\n`
    })

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_vendas_${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
              Relatórios
            </h1>
            <p className="text-gray-600 mt-1">Análise de vendas e desempenho</p>
          </div>
          {!loading && metrics.total_orders > 0 && (
            <Button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Filtros de Data */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Período</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'today', label: 'Hoje' },
              { key: '7days', label: '7 dias' },
              { key: '30days', label: '30 dias' },
              { key: '90days', label: '90 dias' },
              { key: 'thisMonth', label: 'Este mês' },
              { key: 'lastMonth', label: 'Mês anterior' },
              { key: 'custom', label: 'Personalizado' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                onClick={() => setDatePreset(key as DatePreset)}
                className={datePreset === key ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
              >
                {label}
              </Button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Total de Pedidos</span>
                </div>
                <div className="text-3xl font-bold">{metrics.total_orders}</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Receita Total</span>
                </div>
                <div className="text-3xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Ticket Médio</span>
                </div>
                <div className="text-3xl font-bold">{formatCurrency(metrics.average_ticket)}</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Status Pagamento</span>
                </div>
                <div className="text-lg font-bold">
                  {metrics.paid_count} Pagos / {metrics.pending_count} Pendentes
                </div>
              </div>
            </div>

            {/* Comparação com período anterior */}
            {comparison && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Pedidos vs Período Anterior</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{comparison.current.orders}</span>
                    <span className={`flex items-center text-sm font-medium ${comparison.change.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.change.orders >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {Math.abs(comparison.change.orders).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Anterior: {comparison.previous.orders}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Receita vs Período Anterior</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{formatCurrency(comparison.current.revenue)}</span>
                    <span className={`flex items-center text-sm font-medium ${comparison.change.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.change.revenue >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {Math.abs(comparison.change.revenue).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Anterior: {formatCurrency(comparison.previous.revenue)}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Ticket vs Período Anterior</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{formatCurrency(comparison.current.ticket)}</span>
                    <span className={`flex items-center text-sm font-medium ${comparison.change.ticket >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.change.ticket >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {Math.abs(comparison.change.ticket).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Anterior: {formatCurrency(comparison.previous.ticket)}</p>
                </div>
              </div>
            )}

            {/* Gráfico de Evolução Diária */}
            {dailyData.length > 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  Evolução Diária
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? 'Receita' : 'Pedidos'
                        ]}
                        labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="orders" name="Pedidos" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="Receita" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Breakdown por Método de Pagamento */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vendas por Método de Pagamento</h2>
              
              {paymentBreakdown.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum pedido encontrado no período selecionado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-bold text-gray-700">Método</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Quantidade</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Total</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentBreakdown.map((item) => (
                        <tr key={item.method} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{getPaymentMethodLabel(item.method)}</td>
                          <td className="py-3 px-4 text-right">{item.count}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {((item.total / metrics.total_revenue) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="py-3 px-4">TOTAL</td>
                        <td className="py-3 px-4 text-right">{metrics.total_orders}</td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatCurrency(metrics.total_revenue)}
                        </td>
                        <td className="py-3 px-4 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-900">Produtos Mais Vendidos</h2>
                </div>
                <select
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
              </div>
              
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum produto vendido no período selecionado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-bold text-gray-700">Produto</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Quantidade</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Receita</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Nº Pedidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={product.product_name} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-orange-600">#{index + 1}</span>
                              <span className="font-medium">{product.product_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">{product.total_quantity}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">
                            {formatCurrency(product.total_revenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">{product.order_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Peak Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Horários de Pico</h2>
              </div>
              
              {peakHours.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum pedido no período selecionado
                </div>
              ) : (
                <>
                  {/* Top 5 Busiest Hours */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Top 5 Horários Mais Movimentados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {peakHours.slice(0, 5).map((hour, index) => (
                        <div key={hour.hour} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                          <div className="text-sm opacity-90 mb-1">#{index + 1}</div>
                          <div className="text-2xl font-bold mb-1">{hour.hour}:00</div>
                          <div className="text-sm opacity-90">{hour.total_orders} pedidos</div>
                          <div className="text-xs opacity-75 mt-1">{formatCurrency(hour.total_revenue)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full 24-hour Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Distribuição Completa (24h)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-bold text-gray-700">Horário</th>
                            <th className="text-right py-3 px-4 font-bold text-gray-700">Pedidos</th>
                            <th className="text-right py-3 px-4 font-bold text-gray-700">Receita</th>
                            <th className="text-right py-3 px-4 font-bold text-gray-700">Ticket Médio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peakHours.map((hour) => (
                            <tr key={hour.hour} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{hour.hour}:00 - {hour.hour}:59</td>
                              <td className="py-3 px-4 text-right">{hour.total_orders}</td>
                              <td className="py-3 px-4 text-right font-bold text-green-600">
                                {formatCurrency(hour.total_revenue)}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {formatCurrency(hour.average_ticket)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Grid de 2 colunas: Clientes e Cancelamentos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Top Clientes */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Top 10 Clientes
                </h2>
                {topCustomers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum cliente identificado no período
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCustomers.map((customer, i) => (
                      <div key={customer.phone} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customer.phone}</p>
                          <p className="text-xs text-gray-500">{customer.orders} pedidos</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(customer.total_spent)}</p>
                          <p className="text-xs text-gray-400">
                            Último: {new Date(customer.last_order).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cancelamentos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  Cancelamentos
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{cancellations.total}</p>
                    <p className="text-sm text-red-700">Cancelados</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">{cancellations.rate.toFixed(1)}%</p>
                    <p className="text-sm text-orange-700">Taxa</p>
                  </div>
                </div>
                {cancellations.reasons.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Motivos:</h3>
                    <div className="space-y-2">
                      {cancellations.reasons.map(({ reason, count }) => (
                        <div key={reason} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{reason}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico Pizza de Pagamentos */}
            {paymentBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-cyan-600" />
                  Distribuição por Forma de Pagamento
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={paymentBreakdown.map(p => ({ ...p, name: getPaymentMethodLabel(p.method) }))}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(props: any) => {
                          const name = props?.name ?? props?.payload?.name ?? 'N/A'
                          const pct = typeof props?.percent === 'number' ? props.percent : 0
                          return `${name}: ${(pct * 100).toFixed(0)}%`
                        }}
                      >
                        {paymentBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
