'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Calendar, DollarSign, ShoppingBag, TrendingUp, CreditCard, Loader2, AlertCircle, Award, Clock, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

type DatePreset = 'today' | '7days' | '30days' | 'custom'

export default function ReportsPage() {
  const params = useParams()
  const slug = params.slug as string
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
  const [topN, setTopN] = useState<number>(5)

  // Carregar store_id
  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
      }
    }
    loadStore()
  }, [slug])

  // Calcular datas baseado no preset
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (datePreset) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }
      case '7days':
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return {
          start: sevenDaysAgo.toISOString(),
          end: new Date().toISOString()
        }
      case '30days':
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        return {
          start: thirtyDaysAgo.toISOString(),
          end: new Date().toISOString()
        }
      case 'custom':
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
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
        
        const paidCount = orders.filter(o => o.payment_status === 'paid').length
        const pendingCount = orders.filter(o => o.payment_status === 'pending' || !o.payment_status).length

        setMetrics({
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          average_ticket: averageTicket,
          paid_count: paidCount,
          pending_count: pendingCount
        })

        // Calcular breakdown por método de pagamento
        const breakdown: Record<string, { count: number; total: number }> = {}
        
        orders.forEach(order => {
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
        const orderIds = orders.map(o => o.id)
        
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity, unit_price, order_id, products(name)')
          .in('order_id', orderIds)

        if (itemsError) throw itemsError

        // Calcular Top Products
        if (orderItems && orderItems.length > 0) {
          const productStats: Record<string, { quantity: number; revenue: number; orders: Set<string> }> = {}
          
          orderItems.forEach(item => {
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
        
        orders.forEach(order => {
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
      } catch (err) {
        console.error('Erro ao carregar relatórios:', err)
        setError('Erro ao carregar relatórios')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [storeId, datePreset, startDate, endDate, topN])

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
          
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              onClick={() => setDatePreset('today')}
              className={datePreset === 'today' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Hoje
            </Button>
            <Button
              onClick={() => setDatePreset('7days')}
              className={datePreset === '7days' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Últimos 7 dias
            </Button>
            <Button
              onClick={() => setDatePreset('30days')}
              className={datePreset === '30days' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Últimos 30 dias
            </Button>
            <Button
              onClick={() => setDatePreset('custom')}
              className={datePreset === 'custom' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Personalizado
            </Button>
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
          </>
        )}
      </div>
    </div>
  )
}
